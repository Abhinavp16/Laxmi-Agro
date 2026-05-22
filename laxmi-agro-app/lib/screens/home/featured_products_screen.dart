import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hugeicons/hugeicons.dart';

import '../../core/config/api_config.dart';
import '../../core/providers/locale_provider.dart';

class FeaturedProductsScreen extends ConsumerStatefulWidget {
  final bool isHotDeals;
  final String? brandName;

  const FeaturedProductsScreen({
    super.key,
    this.isHotDeals = false,
    this.brandName,
  });

  @override
  ConsumerState<FeaturedProductsScreen> createState() =>
      _FeaturedProductsScreenState();
}

class _FeaturedProductsScreenState
    extends ConsumerState<FeaturedProductsScreen> {
  static const Color primaryBlue = Color(0xFF1E40AF);
  static const Color backgroundWhite = Color(0xFFF8FAFC);
  static const Color surfaceWhite = Color(0xFFFFFFFF);
  static const Color textPrimary = Color(0xFF0F172A);
  static const Color textSecondary = Color(0xFF475569);
  static const Color textMuted = Color(0xFF64748B);
  static const Color borderLight = Color(0xFFF1F5F9);

  late final Dio _dio = Dio(
    BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: ApiConfig.connectTimeout,
      receiveTimeout: ApiConfig.receiveTimeout,
    ),
  );

  List<Map<String, dynamic>> _products = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchProducts();
  }

  Future<void> _fetchProducts() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      // Fetch all products and filter on client side
      final response = await _dio.get('/products');

      if (response.statusCode == 200) {
        final data = response.data;
        final List<dynamic> items = data['data'] ?? data ?? [];

        final filtered = items.where((item) {
          if (widget.brandName != null) {
            final brand = (item['brand'] ?? item['brandName'] ?? '').toString();
            final name = (item['name'] ?? '').toString();
            debugPrint('Filtering by brand: ${widget.brandName} | Item brand: $brand | Item name: $name');
            return brand.toLowerCase() == widget.brandName!.toLowerCase();
          }
          if (widget.isHotDeals) {
            return item['isHot'] == true;
          } else {
            return item['isFeatured'] == true;
          }
        }).toList();

        final products = filtered.map<Map<String, dynamic>>((item) {
          final name = item['name']?.toString() ?? '';
          final cat = (item['category'] ?? item['categoryName'] ?? '')
              .toString();

          // Try every possible image field the backend might use (robust version from home screen)
          String apiImage =
              (item['primaryImage'] ??
                      item['image'] ??
                      item['imageUrl'] ??
                      item['photo'] ??
                      item['thumbnail'] ??
                      item['img'] ??
                      '')
                  .toString()
                  .trim();

          if (apiImage.isNotEmpty && apiImage.startsWith('/')) {
            final serverBase = ApiConfig.baseUrl.replaceFirst('/api/v1', '');
            apiImage = '$serverBase$apiImage';
          }

          return <String, dynamic>{
            'id': item['id']?.toString() ?? item['_id']?.toString() ?? '',
            'name': name,
            'category': cat,
            'price': item['price'] ?? item['retailPrice'] ?? 0,
            'originalPrice': item['mrp'] ?? item['originalPrice'] ?? 0,
            'image': apiImage,
          };
        }).toList();

        setState(() {
          _products = products;
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  String _formatPrice(num? price) {
    if (price == null) return '';
    if (price >= 100000) {
      final lakhs = price / 100000;
      // Show 1L, 1.07L, etc. for amounts >= 1 lakh
      if (lakhs >= 10) {
        return '${lakhs.toStringAsFixed(0)}L';
      } else {
        return '${lakhs.toStringAsFixed(2)}L';
      }
    }
    // Show full number for amounts below 1 lakh (e.g., 6455 instead of 6.5K)
    return price.toStringAsFixed(0);
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(localeProvider.notifier).translate;
    final title = widget.brandName != null
        ? widget.brandName!
        : (widget.isHotDeals ? t('Hot Deals') : t('Popular Products'));

    return Scaffold(
      backgroundColor: backgroundWhite,
      appBar: AppBar(
        backgroundColor: surfaceWhite,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: textPrimary),
          onPressed: () => context.pop(),
        ),
        title: Text(
          title,
          style: GoogleFonts.outfit(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: textPrimary,
          ),
        ),
        centerTitle: false,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(t('Error loading products')),
                  const SizedBox(height: 8),
                  ElevatedButton(
                    onPressed: _fetchProducts,
                    child: Text(t('Retry')),
                  ),
                ],
              ),
            )
          : _products.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    widget.isHotDeals
                        ? Icons.local_fire_department_outlined
                        : Icons.star_outline,
                    size: 64,
                    color: textMuted,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    t('No products available'),
                    style: GoogleFonts.outfit(
                      color: textMuted,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            )
          : GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 0.52,
              ),
              itemCount: _products.length,
              itemBuilder: (context, index) {
                final product = _products[index];
                return _buildProductCard(product, t);
              },
            ),
    );
  }

  Widget _buildProductCard(
    Map<String, dynamic> product,
    String Function(String) t,
  ) {
    final price = product['price'] as num?;
    final originalPrice = product['originalPrice'] as num?;
    final hasDiscount =
        originalPrice != null &&
        originalPrice > 0 &&
        price != null &&
        price < originalPrice;
    final discount = hasDiscount
        ? (((originalPrice - price) / originalPrice) * 100).round()
        : 0;

    return GestureDetector(
      onTap: () => context.push('/product/${product['id']}'),
      child: Container(
        decoration: BoxDecoration(
          color: surfaceWhite,
          borderRadius: BorderRadius.circular(4), // Squarish
          border: Border.all(color: borderLight, width: 1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            Expanded(
              flex: 3,
              child: Stack(
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(4),
                    ),
                    child:
                        product['image'] != null &&
                            product['image'].toString().isNotEmpty
                        ? CachedNetworkImage(
                            imageUrl: product['image'],
                            width: double.infinity,
                            fit: BoxFit.contain,
                            placeholder: (_, __) =>
                                Container(color: borderLight),
                            errorWidget: (_, __, ___) => Container(
                              color: borderLight,
                              child: const Icon(Icons.image, color: textMuted),
                            ),
                          )
                        : Container(
                            color: borderLight,
                            child: const Center(
                              child: Icon(
                                HugeIcons.strokeRoundedImage02,
                                size: 40,
                                color: textMuted,
                              ),
                            ),
                          ),
                  ),
                  if (widget.isHotDeals)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.red,
                          borderRadius: BorderRadius.circular(2),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.local_fire_department,
                              color: Colors.white,
                              size: 12,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              'HOT',
                              style: GoogleFonts.outfit(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  if (hasDiscount)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: primaryBlue,
                          borderRadius: BorderRadius.circular(2),
                        ),
                        child: Text(
                          '-$discount%',
                          style: GoogleFonts.outfit(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            // Details
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    SizedBox(
                      height: 52,
                      child: Text(
                        (product['name'] ?? '').toString().split(' ').map((word) {
                          if (word.isEmpty) return word;
                          return word[0].toUpperCase() + word.substring(1).toLowerCase();
                        }).join(' '),
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.outfit(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w400,
                          color: textPrimary,
                          height: 1.25,
                        ),
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (hasDiscount)
                          Text(
                            '₹${_formatPrice(originalPrice)}',
                            style: GoogleFonts.outfit(
                              fontSize: 11,
                              color: const Color(0xFFEF4444),
                              decoration: TextDecoration.lineThrough,
                            ),
                          ),
                        Text(
                          '₹${_formatPrice(price)}',
                          style: GoogleFonts.outfit(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: primaryBlue,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
