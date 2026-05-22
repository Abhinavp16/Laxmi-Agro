import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/locale_provider.dart';

import '../../core/config/api_config.dart';
import '../../core/services/storage_service.dart';

class CategoriesScreen extends ConsumerStatefulWidget {
  final VoidCallback? onSearchTap;
  final String? initialCategoryName;

  const CategoriesScreen({
    super.key,
    this.onSearchTap,
    this.initialCategoryName,
  });

  @override
  ConsumerState<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends ConsumerState<CategoriesScreen> {
  static const Color primaryBlue = Color(0xFF1E40AF);
  static const Color backgroundWhite = Color(0xFFF8FAFC);
  static const Color surfaceWhite = Color(0xFFFFFFFF);
  static const Color textPrimary = Color(0xFF0F172A);
  static const Color textSecondary = Color(0xFF475569);
  static const Color textMuted = Color(0xFF64748B);
  static const Color borderLight = Color(0xFFF1F5F9);

  late final Dio _dio =
      Dio(
          BaseOptions(
            baseUrl: ApiConfig.baseUrl,
            connectTimeout: ApiConfig.connectTimeout,
            receiveTimeout: ApiConfig.receiveTimeout,
          ),
        )
        ..interceptors.add(
          InterceptorsWrapper(
            onRequest: (options, handler) async {
              final token = await StorageService.getAccessToken();
              if (token != null) {
                options.headers['Authorization'] = 'Bearer $token';
              }
              return handler.next(options);
            },
          ),
        );

  List<Map<String, dynamic>> _categories = [];
  List<Map<String, dynamic>> _products = [];
  bool _isLoadingCategories = true;
  bool _isLoadingProducts = false;
  int _selectedCategoryIndex = 0;

  @override
  void initState() {
    super.initState();
    _fetchCategories();
  }

  @override
  void didUpdateWidget(covariant CategoriesScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialCategoryName != null && 
        widget.initialCategoryName != oldWidget.initialCategoryName) {
      final idx = _categories.indexWhere((c) => 
        c['name']?.toString().toLowerCase() == widget.initialCategoryName!.toLowerCase());
      if (idx != -1 && idx != _selectedCategoryIndex) {
        setState(() {
          _selectedCategoryIndex = idx;
          _fetchProductsForCategory(_categories[idx]);
        });
      }
    }
  }

  Future<void> _fetchCategories() async {
    try {
      final response = await _dio.get('/products/categories');
      if (response.statusCode == 200) {
        final List<dynamic> items = response.data['data'] ?? [];
        Map<String, Map<String, dynamic>> categoryMetaByName = {};

        try {
          final metaResponse = await _dio.get(
            '/categories',
            queryParameters: {'active': true, 'limit': 200},
          );
          if (metaResponse.statusCode == 200 &&
              metaResponse.data['success'] == true) {
            final List<dynamic> metaItems = metaResponse.data['data'] ?? [];
            categoryMetaByName = {
              for (final item in metaItems) ..._categoryMetadataEntries(item),
            };
          }
        } catch (e) {
          debugPrint('Error fetching category metadata: $e');
        }

        final cats = items
            .map<Map<String, dynamic>>((item) {
              final name = item['name']?.toString() ?? '';
              final metadata =
                  categoryMetaByName[_normalizedCategoryKey(name)] ?? {};
              return <String, dynamic>{
                'id': metadata['id']?.toString() ?? '',
                'name': name,
                'slug': metadata['slug']?.toString() ?? '',
                'image': metadata['image']?.toString() ?? '',
                'count': item['count'] ?? item['productCount'],
              };
            })
            .where((c) => (c['name'] as String).isNotEmpty)
            .where(_categoryHasProducts)
            .toList();

        setState(() {
          _categories = cats;
          
          if (widget.initialCategoryName != null) {
            final idx = cats.indexWhere((c) => 
              c['name']?.toString().toLowerCase() == widget.initialCategoryName!.toLowerCase());
            if (idx != -1) {
              _selectedCategoryIndex = idx;
            }
          }

          if (_selectedCategoryIndex >= _categories.length) {
            _selectedCategoryIndex = 0;
          }
          _isLoadingCategories = false;
        });

        if (cats.isNotEmpty) {
          _fetchProductsForCategory(cats[_selectedCategoryIndex]);
        }
      }
    } catch (e) {
      debugPrint('Error fetching categories: $e');
      setState(() => _isLoadingCategories = false);
    }
  }

  bool _categoryHasProducts(Map<String, dynamic> category) {
    final rawCount = category['count'];
    if (rawCount == null) return true;
    if (rawCount is num) return rawCount > 0;
    return int.tryParse(rawCount.toString()) != null
        ? int.parse(rawCount.toString()) > 0
        : true;
  }

  String _normalizedCategoryKey(String value) => value.trim().toLowerCase();

  Map<String, Map<String, dynamic>> _categoryMetadataEntries(dynamic item) {
    if (item is! Map) return {};

    final slug = item['slug']?.toString() ?? '';
    final payload = {
      'id': item['_id']?.toString() ?? item['id']?.toString() ?? '',
      'slug': slug,
      'image': _extractCategoryImageUrl(item),
    };

    final keys = <String>{
      _normalizedCategoryKey(item['name']?.toString() ?? ''),
      _normalizedCategoryKey(slug),
      _normalizedCategoryKey(
        (item['name']?.toString() ?? '').replaceAll(RegExp(r'[-_]+'), ' '),
      ),
      _normalizedCategoryKey(slug.replaceAll(RegExp(r'[-_]+'), ' ')),
    }..removeWhere((key) => key.isEmpty);

    return {for (final key in keys) key: payload};
  }

  String _extractCategoryImageUrl(dynamic item) {
    if (item is! Map) return '';
    final image = item['image'];
    final rawUrl = image is Map ? image['url']?.toString() ?? '' : image;
    return _resolveImageUrl(rawUrl?.toString() ?? '');
  }

  String _resolveImageUrl(String imageUrl) {
    final trimmed = imageUrl.trim();
    if (trimmed.isEmpty) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    if (trimmed.startsWith('/')) {
      final serverBase = ApiConfig.baseUrl.replaceFirst('/api/v1', '');
      return '$serverBase$trimmed';
    }
    return '';
  }

  Future<void> _fetchProductsForCategory(Map<String, dynamic> category) async {
    setState(() => _isLoadingProducts = true);
    try {
      final categoryFilter =
          (category['slug']?.toString().trim().isNotEmpty ?? false)
          ? category['slug'].toString().trim()
          : category['name']?.toString().trim() ?? '';
      final response = await _dio.get(
        '/products',
        queryParameters: {'category': categoryFilter},
      );
      if (response.statusCode == 200) {
        final List<dynamic> items = response.data['data'] ?? [];
        setState(() {
          _products = items
              .map<Map<String, dynamic>>(
                (item) => <String, dynamic>{
                  'id': item['id']?.toString() ?? item['_id']?.toString() ?? '',
                  'name': item['name']?.toString() ?? '',
                  'nameHindi': item['nameHindi']?.toString() ?? '',
                  'price': item['price'] ?? item['retailPrice'] ?? 0,
                  'mrp': item['mrp'] ?? 0,
                  'image': item['primaryImage']?.toString() ?? '',
                  'inStock': item['inStock'] != false,
                  'shortDescription':
                      item['shortDescription']?.toString() ?? '',
                  'rating': item['averageRating'] ?? item['rating'] ?? 4.5,
                  'reviewCount': item['ratingCount'] ?? item['reviewCount'] ?? item['reviews'] ?? '',
                },
              )
              .toList();
          _isLoadingProducts = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching products: $e');
      setState(() => _isLoadingProducts = false);
    }
  }

  String _formatPrice(dynamic price) {
    if (price == null) return '0';
    final num p = price is num ? price : num.tryParse(price.toString()) ?? 0;

    // If price is 1 lakh or more, show in "L" format
    if (p >= 100000) {
      final lakhs = p / 100000;
      if (lakhs >= 10) {
        return '${lakhs.toStringAsFixed(0)}L';
      } else {
        return '${lakhs.toStringAsFixed(2)}L';
      }
    }

    // Show full number for amounts below 1 lakh (e.g., 6455 instead of 6.5K)
    return p.toStringAsFixed(0);
  }

  IconData _categoryIcon(String name) {
    final lower = name.toLowerCase();
    if (lower.contains('tractor')) return Icons.agriculture_rounded;
    if (lower.contains('harvest')) return Icons.grass_rounded;
    if (lower.contains('irrigat') || lower.contains('pump')) {
      return Icons.water_drop_rounded;
    }
    if (lower.contains('seed') || lower.contains('plant')) {
      return Icons.eco_rounded;
    }
    if (lower.contains('fertil') || lower.contains('chemic')) {
      return Icons.science_rounded;
    }
    if (lower.contains('tool') || lower.contains('equip')) {
      return Icons.build_rounded;
    }
    if (lower.contains('spray')) return Icons.shower_rounded;
    if (lower.contains('storage') || lower.contains('silo')) {
      return Icons.warehouse_rounded;
    }
    return Icons.category_rounded;
  }

  Future<void> _handleRefresh() async {
    final currentSelectedCategory = _categories.isNotEmpty
        ? Map<String, dynamic>.from(_categories[_selectedCategoryIndex])
        : null;
    await _fetchCategories();
    if (currentSelectedCategory != null) {
      final index = _categories.indexWhere(
        (c) =>
            c['slug'] == currentSelectedCategory['slug'] ||
            c['name'] == currentSelectedCategory['name'],
      );
      if (index != -1) {
        setState(() => _selectedCategoryIndex = index);
        await _fetchProductsForCategory(_categories[index]);
      }
    }
  }

  String _getDisplayName(Map<String, dynamic> product) {
    final currentLang = ref.watch(localeProvider);
    final nameHindi = product['nameHindi']?.toString() ?? '';
    final nameEnglish = product['name']?.toString() ?? '';

    String name;
    if (currentLang == 'Hindi') {
      name = nameHindi.isNotEmpty ? nameHindi : nameEnglish;
    } else {
      name = nameEnglish;
    }

    if (currentLang != 'Hindi' && name.isNotEmpty) {
      return name.split(' ').map((word) {
        if (word.isEmpty) return word;
        return word[0].toUpperCase() + word.substring(1).toLowerCase();
      }).join(' ');
    }
    return name;
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.read(localeProvider.notifier).translate;
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark.copyWith(
        statusBarColor: Colors.transparent,
      ),
      child: Scaffold(
        backgroundColor: backgroundWhite,
        body: SafeArea(
          child: Column(
            children: [
              // Header
              Container(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
                child: Row(
                  children: [
                    Text(
                      t('Categories'),
                      style: GoogleFonts.outfit(
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        color: textPrimary,
                        letterSpacing: -0.3,
                      ),
                    ),
                    const Spacer(),
                    GestureDetector(
                      onTap:
                          widget.onSearchTap ??
                          () => context.go('/home', extra: {'tab': 1}),
                      child: Container(
                        width: 42,
                        height: 42,
                        decoration: BoxDecoration(
                          color: surfaceWhite,
                          shape: BoxShape.circle,
                          border: Border.all(color: borderLight),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.03),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.search_rounded,
                          color: primaryBlue,
                          size: 22,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              // Main content
              Expanded(
                child: _isLoadingCategories
                    ? const Center(
                        child: CircularProgressIndicator(color: primaryBlue),
                      )
                    : _categories.isEmpty
                    ? RefreshIndicator(
                        onRefresh: _handleRefresh,
                        color: primaryBlue,
                        child: ListView(
                          children: [
                            const SizedBox(height: 200),
                            Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.category_outlined,
                                    size: 48,
                                    color: textMuted.withOpacity(0.5),
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    'No categories found',
                                    style: GoogleFonts.outfit(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                      color: textMuted,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      )
                    : Row(
                        children: [
                          // Left sidebar
                          _buildSidebar(),
                          // Vertical divider
                          Container(width: 1, color: borderLight),
                          // Right product grid
                          Expanded(
                            child: RefreshIndicator(
                              onRefresh: _handleRefresh,
                              color: primaryBlue,
                              child: _buildProductGrid(),
                            ),
                          ),
                        ],
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSidebar() {
    return SizedBox(
      width: 88,
      child: ListView.builder(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(vertical: 8),
        itemCount: _categories.length,
        itemBuilder: (context, index) {
          final cat = _categories[index];
          final isSelected = _selectedCategoryIndex == index;
          final imageUrl = cat['image']?.toString() ?? '';
          return GestureDetector(
            onTap: () {
              setState(() => _selectedCategoryIndex = index);
              _fetchProductsForCategory(cat);
            },
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
              decoration: BoxDecoration(
                color: isSelected
                    ? primaryBlue.withOpacity(0.08)
                    : Colors.transparent,
                borderRadius: BorderRadius.circular(12),
                border: isSelected
                    ? Border(left: BorderSide(color: primaryBlue, width: 3))
                    : null,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: isSelected
                          ? primaryBlue.withOpacity(0.12)
                          : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(14),
                      child: imageUrl.isNotEmpty
                          ? CachedNetworkImage(
                              imageUrl: imageUrl,
                              fit: BoxFit.cover,
                              placeholder: (_, __) => Icon(
                                _categoryIcon(cat['name'] ?? ''),
                                size: 22,
                                color: isSelected ? primaryBlue : textSecondary,
                              ),
                              errorWidget: (_, __, ___) => Icon(
                                _categoryIcon(cat['name'] ?? ''),
                                size: 22,
                                color: isSelected ? primaryBlue : textSecondary,
                              ),
                            )
                          : Icon(
                              _categoryIcon(cat['name'] ?? ''),
                              size: 22,
                              color: isSelected ? primaryBlue : textSecondary,
                            ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    cat['name'] ?? '',
                    style: GoogleFonts.outfit(
                      fontSize: 10,
                      fontWeight: isSelected
                          ? FontWeight.w700
                          : FontWeight.w500,
                      color: isSelected ? primaryBlue : textSecondary,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildProductGrid() {
    if (_isLoadingProducts) {
      return const Center(
        child: CircularProgressIndicator(color: primaryBlue, strokeWidth: 2),
      );
    }

    if (_products.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.inventory_2_outlined,
              size: 48,
              color: textMuted.withOpacity(0.4),
            ),
            const SizedBox(height: 12),
            Text(
              'No products in this category',
              style: GoogleFonts.outfit(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: textMuted,
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Category header
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  _categories[_selectedCategoryIndex]['name'] ?? '',
                  style: GoogleFonts.outfit(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: textPrimary,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: primaryBlue.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(100),
                ),
                child: Text(
                  '${_products.length} items',
                  style: GoogleFonts.outfit(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: primaryBlue,
                  ),
                ),
              ),
            ],
          ),
        ),
        // Products
        Expanded(
          child: GridView.builder(
            physics: const AlwaysScrollableScrollPhysics(
              parent: BouncingScrollPhysics(),
            ),
            padding: const EdgeInsets.fromLTRB(12, 4, 12, 100),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 0.48,
            ),
            itemCount: _products.length,
            itemBuilder: (context, index) =>
                _buildProductCard(_products[index]),
          ),
        ),
      ],
    );
  }

  Widget _buildProductCard(Map<String, dynamic> product) {
    final hasMrp =
        product['mrp'] != null &&
        product['mrp'] != product['price'] &&
        (product['mrp'] as num) > 0;
    final rating = product['rating'];
    final discount = hasMrp
        ? (((product['mrp'] as num) - (product['price'] as num)) /
                  (product['mrp'] as num) *
                  100)
              .round()
        : 0;

    return GestureDetector(
      onTap: () => context.push('/product/${product['id']}'),
      child: Container(
        decoration: BoxDecoration(
          color: surfaceWhite,
          borderRadius: BorderRadius.circular(4),
          // border: Border.all(color: borderLight, width: 1), // Removed outer border
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            Expanded(
              flex: 22, // Reduced from 3 to 2.2 (Integer multiplied by 10 for safety)
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(4),
                ),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    product['image'] != null &&
                            product['image'].toString().isNotEmpty
                        ? CachedNetworkImage(
                            imageUrl: product['image'],
                            fit: BoxFit.contain,
                            placeholder: (_, __) =>
                                Container(color: const Color(0xFFF1F5F9)),
                            errorWidget: (_, __, ___) => Container(
                              color: const Color(0xFFF1F5F9),
                              child: const Center(
                                child: Icon(Icons.image, color: textMuted),
                              ),
                            ),
                          )
                        : Container(
                            color: const Color(0xFFF1F5F9),
                            child: const Center(
                              child: Icon(Icons.image, color: textMuted),
                            ),
                          ),
                    if (discount > 0)
                      Positioned(
                        top: 6,
                        left: 6,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFF16A34A).withOpacity(0.9),
                            borderRadius: BorderRadius.circular(2),
                          ),
                          child: Text(
                            '$discount% OFF',
                            style: GoogleFonts.outfit(
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                      ),
                    if (product['inStock'] == false)
                      Positioned.fill(
                        child: Container(
                          color: Colors.white.withOpacity(0.7),
                          alignment: Alignment.center,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.black87,
                              borderRadius: BorderRadius.circular(2),
                            ),
                            child: Text(
                              'Out of Stock',
                              style: GoogleFonts.outfit(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            Expanded(
              flex: 20, // Re-scaled to match 2.2:2.0 as 22:20
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(
                    color: const Color(0xFFE2E8F0),
                    width: 1,
                  ),
                  borderRadius: const BorderRadius.vertical(
                    bottom: Radius.circular(4),
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(
                        height: 44, // More compact but still fits 3 lines tightly
                        child: Text(
                          _getDisplayName(product),
                          style: GoogleFonts.outfit(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w600, // Make it a bit more readable
                            color: textPrimary,
                            height: 1.2,
                          ),
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(height: 1), // Reduced gap
                      // Star rating visualization (Showing always as requested)
                      Row(
                        children: [
                          Text(
                            rating is num ? rating.toDouble().toStringAsFixed(1) : (double.tryParse(rating?.toString() ?? '')?.toStringAsFixed(1) ?? '4.5'),
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              color: textPrimary,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Row(
                            children: List.generate(5, (index) {
                              final rv = (rating != null) 
                                  ? ((rating is num) ? rating.toDouble() : double.tryParse(rating.toString()) ?? 0.0)
                                  : 0.0;
                              final starIndex = index + 1;
                              if (rv >= starIndex) {
                                return const Icon(
                                  Icons.star_rounded,
                                  size: 14,
                                  color: Color(0xFFF59E0B),
                                );
                              } else if (rv >= starIndex - 0.5) {
                                return const Icon(
                                  Icons.star_half_rounded,
                                  size: 14,
                                  color: Color(0xFFF59E0B),
                                );
                              } else {
                                return const Icon(
                                  Icons.star_outline_rounded,
                                  size: 14,
                                  color: Color(0xFFCBD5E1),
                                );
                              }
                            }),
                          ),

                        ],
                      ),
                      const SizedBox(height: 2), // Significantly reduced gap to move price up
                      Row(
                        children: [
                          Text(
                            '₹${_formatPrice(product['price'])}',
                            style: GoogleFonts.outfit(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              color: textPrimary,
                            ),
                          ),
                          if (hasMrp) ...[
                            const SizedBox(width: 4),
                            Text(
                              '₹${_formatPrice(product['mrp'])}',
                              style: GoogleFonts.outfit(
                                fontSize: 10,
                                color: const Color(0xFFEF4444),
                                decoration: TextDecoration.lineThrough,
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 6), // Replaces Spacer for predictable height
                      SizedBox(
                        width: double.infinity,
                        height: 26, // Reduced button height
                        child: ElevatedButton(
                          onPressed: () => context.push('/product/${product['id']}'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: primaryBlue,
                            foregroundColor: Colors.white,
                            padding: EdgeInsets.zero,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                          child: Text(
                            'View Product',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
