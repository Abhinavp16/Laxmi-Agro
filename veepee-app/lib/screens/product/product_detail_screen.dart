import 'dart:async';
import 'dart:ui';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../../widgets/app_image.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:youtube_player_flutter/youtube_player_flutter.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/config/api_config.dart';
import '../../core/services/storage_service.dart';
import '../../core/providers/cart_provider.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/wishlist_provider.dart';
import '../../core/providers/locale_provider.dart';
import '../../widgets/verified_seller_badge.dart';

class ProductDetailScreen extends ConsumerStatefulWidget {
  final String productId;
  final String? heroTag;

  const ProductDetailScreen({super.key, required this.productId, this.heroTag});

  @override
  ConsumerState<ProductDetailScreen> createState() =>
      _ProductDetailScreenState();
}

class _ProductDetailScreenState extends ConsumerState<ProductDetailScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _cartBounce;
  final PageController _imgCtrl = PageController();
  int _imgIndex = 0;
  bool _addedToCart = false;
  int _quantity = 1;
  bool _descExpanded = false;
  // _isFav removed â€“ now using wishlistProvider
  bool _shippingOpen = false;
  bool _isBuyNowLoading = false;
  YoutubePlayerController? _ytCtrl;
  bool _videoReady = false;
  Map<String, dynamic>? _product;
  List<dynamic> _relatedProducts = [];
  bool _isLoading = true;
  bool _isRelatedLoading = false;
  int _bgKey = 0;
  String _whatsappNumber = '';
  String? _error;
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

  // Spotlyst Q1 Design Tokens
  static const Color _blue = Color(0xFF2563EB);
  static const Color _bg = Color(0xFFF8FAFC);
  static const Color _card = Color(0xFFFFFFFF);
  static const Color _green = Color(0xFF16A34A);
  static const Color _red = Color(0xFFEF4444);
  static const Color _amber = Color(0xFFF59E0B);
  static const Color _txt = Color(0xFF1E293B);
  static const Color _txtSec = Color(0xFF64748B);
  static const Color _txtMuted = Color(0xFF94A3B8);
  static const Color _border = Color(0xFFE2E8F0);
  static const Color _violet = Color(0xFF7C3AED);
  static const Color _mrpAmount = Color(0xFF94A3B8);
  static const Color _customerAmount = Color(0xFF6366F1);
  static const Color _specialAmountWholesale = Color(0xFF15803D);

  @override
  void initState() {
    super.initState();
    _cartBounce = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _fetchProduct();
    _fetchWhatsappNumber();
  }

  @override
  void dispose() {
    _cartBounce.dispose();
    _imgCtrl.dispose();
    _ytCtrl?.dispose();
    super.dispose();
  }

  void _initYoutube() {
    final url = _product?['videoUrl']?.toString() ?? '';
    if (url.isEmpty) return;
    final id = YoutubePlayer.convertUrlToId(url);
    if (id == null) return;
    _ytCtrl = YoutubePlayerController(
      initialVideoId: id,
      flags: const YoutubePlayerFlags(
        autoPlay: false,
        mute: false,
        enableCaption: false,
        showLiveFullscreenButton: false,
        disableDragSeek: false,
        forceHD: false,
      ),
    );
  }

  void _openFullscreenVideo() {
    final url = _product?['videoUrl']?.toString() ?? '';
    if (url.isEmpty) return;
    final vid = YoutubePlayer.convertUrlToId(url);
    if (vid == null) return;

    // Pause inline player if playing
    _ytCtrl?.pause();

    Navigator.of(context).push(
      PageRouteBuilder(
        opaque: false,
        pageBuilder: (context, animation, secondaryAnimation) =>
            _FullscreenVideoPage(videoId: vid),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(opacity: animation, child: child);
        },
      ),
    );
  }

  Future<void> _fetchProduct() async {
    try {
      final r = await _dio.get('/products/${widget.productId}');
      if (r.statusCode == 200) {
        final rawData = r.data['data'] ?? r.data;
        final productData = rawData is Map<String, dynamic>
            ? Map<String, dynamic>.from(rawData)
            : Map<String, dynamic>.from(rawData as Map);
        if (_needsLabelFallback(productData)) {
          productData['labels'] = await _fetchFallbackLabels(
            productData['labelIds'] as List<dynamic>,
          );
        }
        setState(() {
          _product = productData;
          _isLoading = false;
        });
        _trackView();
        _fetchRelatedProducts();
      }
    } on DioException catch (e) {
      final data = e.response?.data;
      final map = data is Map ? data : null;
      final error = map?['error'];
      final errorMap = error is Map ? error : null;
      var msg =
          map?['message']?.toString() ??
          errorMap?['message']?.toString() ??
          e.message ??
          'Failed to load product details';
      if (e.type == DioExceptionType.connectionError ||
          msg.contains('No route to host') ||
          msg.contains('Connection refused')) {
        msg =
            'Cannot reach server. Check backend is running and API URL in api_config.dart.';
      }
      debugPrint('Error fetching product: $msg');
      setState(() {
        _isLoading = false;
        _error = msg;
      });
    } catch (e) {
      debugPrint('Error fetching product: $e');
      setState(() {
        _isLoading = false;
        _error = 'Failed to load product details';
      });
    }
  }

  bool _needsLabelFallback(Map<String, dynamic> productData) {
    final labels = productData['labels'];
    final labelIds = productData['labelIds'];
    final hasResolvedLabels = labels is List && labels.isNotEmpty;
    final hasLabelIds = labelIds is List && labelIds.isNotEmpty;
    return !hasResolvedLabels && hasLabelIds;
  }

  Future<List<Map<String, dynamic>>> _fetchFallbackLabels(
    List<dynamic> labelIds,
  ) async {
    try {
      final response = await _dio.get('/');
      if (response.statusCode != 200) {
        return const [];
      }

      final payload = response.data['data'];
      if (payload is! Map) return const [];
      final rawLabels = payload['labels'];
      if (rawLabels is! List) return const [];

      final lookup = <String, Map<String, dynamic>>{};
      for (final item in rawLabels.whereType<Map>()) {
        final label = Map<String, dynamic>.from(item);
        final labelId = _normalizedLabelLookup(label['id']);
        final labelTitle = _normalizedLabelLookup(label['title']);
        if (labelId.isNotEmpty) {
          lookup[labelId] = label;
        }
        if (labelTitle.isNotEmpty) {
          lookup.putIfAbsent(labelTitle, () => label);
        }
      }

      final resolved = labelIds
          .map((id) => lookup[_normalizedLabelLookup(id)])
          .whereType<Map<String, dynamic>>()
          .toList();
      resolved.sort((a, b) {
        final aOrder = (a['order'] as num?)?.toInt() ?? 0;
        final bOrder = (b['order'] as num?)?.toInt() ?? 0;
        return aOrder.compareTo(bOrder);
      });
      return resolved;
    } catch (e) {
      debugPrint('Error resolving fallback product labels: $e');
      return const [];
    }
  }

  String _normalizedLabelLookup(dynamic value) =>
      value?.toString().trim().toLowerCase() ?? '';

  Future<void> _trackView() async {
    try {
      final token = await StorageService.getAccessToken();
      await _dio.post(
        '/products/${widget.productId}/view',
        data: {'source': 'direct'},
        options: token != null
            ? Options(headers: {'Authorization': 'Bearer $token'})
            : null,
      );
    } catch (_) {}
  }

  Future<void> _trackEvent(String event) async {
    try {
      final token = await StorageService.getAccessToken();
      await _dio.post(
        '/products/${widget.productId}/event',
        data: {'event': event, 'source': 'direct'},
        options: token != null
            ? Options(headers: {'Authorization': 'Bearer $token'})
            : null,
      );
    } catch (_) {}
  }

  List<Map<String, String>> get _imagesData {
    if (_product == null) return [];
    final imgs = _product!['images'] as List<dynamic>?;
    if (imgs == null || imgs.isEmpty) return [];
    return imgs
        .map((e) {
          final m = e as Map<String, dynamic>;
          return {
            'url': m['url']?.toString() ?? '',
            'blurHash': m['blurHash']?.toString() ?? '',
          };
        })
        .where((m) => m['url']!.isNotEmpty)
        .toList();
  }

  List<String> get _images {
    if (_product == null) return [];
    final imgs = _product!['images'] as List<dynamic>?;
    if (imgs == null || imgs.isEmpty) return [];
    return imgs
        .map((e) => (e as Map<String, dynamic>)['url']?.toString() ?? '')
        .where((u) => u.isNotEmpty)
        .toList();
  }

  List<Map<String, dynamic>> get _specs {
    if (_product == null) return [];
    return (_product!['specifications'] as List<dynamic>?)
            ?.map((e) => e as Map<String, dynamic>)
            .toList() ??
        [];
  }

  List<String> get _bullets {
    if (_product == null) return [];
    return (_product!['bulletPoints'] as List<dynamic>?)
            ?.map((e) => e.toString())
            .where((s) => s.isNotEmpty)
            .toList() ??
        [];
  }

  String _fmt(dynamic price) {
    if (price == null) return '0';
    final v = (price is int) ? price.toDouble() : (price as num).toDouble();
    // Always show full numbers on product detail page
    return v.toStringAsFixed(0);
  }

  // ------------------------------------------
  // BUILD
  // ------------------------------------------
  @override
  Widget build(BuildContext context) {
    final currentLang = ref.watch(localeProvider);
    final t = ref.read(localeProvider.notifier).translate;
    final bp = MediaQuery.of(context).padding.bottom;
    final tp = MediaQuery.of(context).padding.top;

    if (_isLoading) {
      return Scaffold(
        backgroundColor: _bg,
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(
                width: 28,
                height: 28,
                child: CircularProgressIndicator(
                  color: _blue,
                  strokeWidth: 2.5,
                ),
              ),
              const SizedBox(height: 14),
              Text(
                t('Loading product...'),
                style: GoogleFonts.plusJakartaSans(
                  color: _txtSec,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (_error != null || _product == null) {
      return Scaffold(
        backgroundColor: _bg,
        body: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(8),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: IconButton(
                    onPressed: () => context.pop(),
                    icon: const Icon(
                      Icons.arrow_back_ios_new,
                      color: _blue,
                      size: 20,
                    ),
                  ),
                ),
              ),
              Expanded(
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.error_outline,
                        color: _txtMuted,
                        size: 48,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        _error ?? t('Product not found'),
                        style: GoogleFonts.plusJakartaSans(
                          color: _txtSec,
                          fontSize: 15,
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextButton(
                        onPressed: () {
                          setState(() {
                            _isLoading = true;
                            _error = null;
                          });
                          _fetchProduct();
                        },
                        child: Text(
                          t('Retry'),
                          style: GoogleFonts.plusJakartaSans(
                            color: _blue,
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
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

    final name =
        (currentLang == 'Hindi' &&
            _product!['nameHindi'] != null &&
            _product!['nameHindi'].toString().isNotEmpty)
        ? _product!['nameHindi'].toString()
        : _product!['name']?.toString() ?? 'Product';

    final desc =
        _product!['description']?.toString() ??
        _product!['shortDescription']?.toString() ??
        '';
    final sku = _product!['sku']?.toString() ?? '';
    final price = _product!['price'] ?? _product!['retailPrice'];
    final customerPrice = _product!['retailPrice'] ?? _product!['price'];
    final mrp = _product!['mrp'];
    final wsPrice = _product!['wholesalePrice'];
    final minWsQty = _product!['minWholesaleQuantity'] ?? 5;
    final stock = _product!['stock'] ?? 0;
    final inStock = (stock is int ? stock : 0) > 0;
    final isWholesaler = ref.watch(authProvider).user?.isWholesaler == true;
    final negEnabled = _product!['negotiationEnabled'] == true && isWholesaler;
    final bottomContentInset = inStock ? 185.0 : 120.0;
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark.copyWith(
        statusBarColor: Colors.transparent,
      ),
      child: Scaffold(
        backgroundColor: _bg,
        body: Stack(
          children: [
            RefreshIndicator(
              onRefresh: _fetchProduct,
              color: _blue,
              backgroundColor: Colors.white,
              edgeOffset: tp + 60,
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(
                  parent: BouncingScrollPhysics(),
                ),
                slivers: [
                  SliverToBoxAdapter(child: SizedBox(height: tp + 64)),
                  SliverToBoxAdapter(child: _imageCarousel(name)),
                  SliverToBoxAdapter(
                    child: _infoSection(
                      name,
                      sku,
                      price,
                      mrp,
                      customerPrice,
                      wsPrice,
                      stock,
                      inStock,
                      !isWholesaler,
                      isWholesaler,
                      t,
                    ),
                  ),
                  if (_specs.isNotEmpty)
                    SliverToBoxAdapter(child: _specsSection(t)),
                  SliverToBoxAdapter(child: _trustBadgesStrip()),
                  if (_productLabels.isNotEmpty)
                    SliverToBoxAdapter(child: _productLabelsSection()),
                  if (negEnabled)
                    SliverToBoxAdapter(
                      child: _negotiateCard(name, price, wsPrice, minWsQty, t),
                    ),
                  SliverToBoxAdapter(child: _descSection(desc, t)),
                  SliverToBoxAdapter(child: _allImagesSection(name, t)),
                  SliverToBoxAdapter(child: _videoSection(t)),
                  SliverToBoxAdapter(child: _shippingSection(t)),
                  SliverToBoxAdapter(child: _relatedProductsSection(t)),
                  SliverToBoxAdapter(
                    child: SizedBox(height: bottomContentInset + bp),
                  ),
                ],
              ),
            ),
            _topBar(tp, name, inStock, t),
            _bottomBar(
              name,
              price,
              mrp,
              stock,
              inStock,
              bp,
              negEnabled,
              wsPrice,
              minWsQty,
              t,
            ),
          ],
        ),
      ),
    );
  }

  // -- TOP BAR --
  Widget _topBar(
    double tp,
    String name,
    bool inStock,
    String Function(String) t,
  ) {
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: ClipRect(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
          child: Container(
            padding: EdgeInsets.fromLTRB(8, tp + 4, 8, 10),
            decoration: BoxDecoration(
              color: _card.withOpacity(0.85),
              border: Border(
                bottom: BorderSide(color: _border.withOpacity(0.5)),
              ),
            ),
            child: Row(
              children: [
                _circleBtn(Icons.arrow_back_ios_new, () => context.pop()),
                const SizedBox(width: 4),
                Expanded(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: _txt,
                        ),
                      ),
                      Text(
                        inStock ? t('In Stock') : t('Out of Stock'),
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: inStock ? _green : _red,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 4),
                _circleBtn(Icons.share_outlined, () {
                  final p = _product;
                  if (p == null) return;
                  final pName = p['name']?.toString() ?? 'Product';
                  final pPrice = p['price'] ?? p['retailPrice'];
                  final shareText =
                      'Check out $pName'
                      '${pPrice != null ? ' - ₹${_fmt(pPrice)}' : ''}'
                      ' on AgriMart!\n\nhttps://agrimart.app/product/${widget.productId}';
                  SharePlus.instance.share(ShareParams(text: shareText));
                }),
                Builder(
                  builder: (ctx) {
                    final isFav = ref
                        .watch(wishlistProvider)
                        .contains(widget.productId);
                    return _circleBtn(
                      isFav ? Icons.favorite : Icons.favorite_border,
                      () {
                        final p = _product;
                        if (p == null) return;
                        final item = WishlistItem(
                          productId: widget.productId,
                          name: p['name']?.toString() ?? '',
                          image: _images.isNotEmpty ? _images.first : null,
                          price: (p['price'] ?? 0).toDouble(),
                          mrp: p['mrp'] != null
                              ? (p['mrp'] as num).toDouble()
                              : null,
                          category: p['category']?.toString(),
                          nameHindi: p['nameHindi']?.toString(),
                        );
                        ref.read(wishlistProvider.notifier).toggle(item);
                      },
                      color: isFav ? _red : _txtSec,
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _circleBtn(IconData icon, VoidCallback onTap, {Color? color}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: _bg.withOpacity(0.6),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, size: 18, color: color ?? _txt),
      ),
    );
  }

  // ── IMAGE CAROUSEL ──
  Widget _imageCarousel(String name) {
    if (_images.isEmpty) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(16, 6, 16, 0),
        child: Container(
          height: 260,
          decoration: BoxDecoration(
            color: _card,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: _border.withOpacity(0.7)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.06),
                blurRadius: 18,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: const Center(
            child: Icon(Icons.image_outlined, size: 56, color: _txtMuted),
          ),
        ),
      );
    }
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 6, 16, 0),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: _border.withOpacity(0.7)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: Stack(
            children: [
              AspectRatio(
                aspectRatio: 4 / 3,
                child: PageView.builder(
                  controller: _imgCtrl,
                  itemCount: _imagesData.length,
                  onPageChanged: (i) => setState(() => _imgIndex = i),
                  itemBuilder: (_, i) {
                    final data = _imagesData[i];
                    final img = AppImage(
                      imageUrl: data['url']!,
                      blurHash: data['blurHash'],
                      category: _product?['category']?.toString() ?? '',
                      name: name, // assuming name is available in scope
                      fit: BoxFit.contain,
                    );
                    if (i == 0 && widget.heroTag != null) {
                      return Hero(
                        tag: widget.heroTag!,
                        child: Container(color: _card, child: img),
                      );
                    }
                    return Container(color: _card, child: img);
                  },
                ),
              ),
              Positioned.fill(
                child: IgnorePointer(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.white.withOpacity(0.05),
                          Colors.transparent,
                          Colors.black.withOpacity(0.06),
                        ],
                        stops: const [0.0, 0.55, 1.0],
                      ),
                    ),
                  ),
                ),
              ),
              if (_images.length > 1)
                Positioned(
                  bottom: 16,
                  left: 0,
                  right: 0,
                  child: Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.86),
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(color: _border.withOpacity(0.6)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.05),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: List.generate(
                          _images.length,
                          (i) => AnimatedContainer(
                            duration: const Duration(milliseconds: 250),
                            width: i == _imgIndex ? 18 : 6,
                            height: 6,
                            margin: const EdgeInsets.symmetric(horizontal: 3),
                            decoration: BoxDecoration(
                              color: i == _imgIndex
                                  ? _blue
                                  : _txt.withOpacity(0.22),
                              borderRadius: BorderRadius.circular(3),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  // ── PRODUCT INFO ──
  Widget _infoSection(
    String name,
    String sku,
    dynamic price,
    dynamic mrp,
    dynamic customerPrice,
    dynamic wsPrice,
    dynamic stock,
    bool inStock,
    bool showNegotiate,
    bool isWholesaler,
    String Function(String) t,
  ) {
    final priceNum = price is num
        ? price.toDouble()
        : double.tryParse('$price') ?? 0;
    final mrpNum = mrp is num ? mrp.toDouble() : double.tryParse('$mrp') ?? 0;
    final disc = (mrpNum > 0 && priceNum > 0 && mrpNum > priceNum)
        ? (((mrpNum - priceNum) / mrpNum) * 100).round()
        : 0;

    final rawRating = _product?['averageRating'] ?? _product?['rating'];
    final rating = rawRating is num
        ? rawRating.toDouble()
        : double.tryParse(rawRating?.toString() ?? '') ?? 0.0;
    final ratingCountRaw = _product?['ratingCount'] ?? _product?['reviewCount'];
    final ratingCount = ratingCountRaw is num
        ? ratingCountRaw.toInt()
        : int.tryParse(ratingCountRaw?.toString() ?? '') ?? 0;
    String getBrand() {
      final keys = ['brandName', 'brand', 'companyName', 'manufacturer'];
      for (final key in keys) {
        final val = _product?[key]?.toString().trim();
        if (val != null && val.isNotEmpty) return val;
      }
      return 'OXON';
    }
    final brandDetails = getBrand();

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: _card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _border.withOpacity(0.5)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: const Color(0xFFD6E6FF)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.star_rounded,
                      size: 16,
                      color: Color(0xFFF59E0B),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      rating > 0 ? rating.toStringAsFixed(1) : 'N/A',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: _txt,
                      ),
                    ),
                    if (ratingCount > 0) ...[
                      const SizedBox(width: 4),
                      Text(
                        '($ratingCount)',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: _txtSec,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const Spacer(),
              const VerifiedSellerBadge(compact: true),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.storefront_rounded, size: 16, color: _txtSec),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  '${t('Brand')}: $brandDetails',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: _txtSec,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            name,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: _txt,
              height: 1.2,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '${t('SKU')}: ${sku.isNotEmpty ? sku : 'MILL-001'}',
            style: GoogleFonts.plusJakartaSans(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: _txtSec,
              letterSpacing: 0.2,
            ),
          ),
          const SizedBox(height: 8),

          RichText(
            text: TextSpan(
              style: GoogleFonts.plusJakartaSans(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: _txtSec,
              ),
              children: [
                TextSpan(text: '${t('MRP')}: '),
                TextSpan(
                  text: mrp != null
                      ? '₹${_fmt(mrp)}'
                      : (price != null ? '₹${_fmt(price)}' : 'N/A'),
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: _mrpAmount,
                    decoration: TextDecoration.lineThrough,
                  ),
                ),
              ],
            ),
          ),
          if (price != null) ...[
            const SizedBox(height: 4),
            // For wholesalers, show customer price first
            if (isWholesaler) ...[
              Row(
                children: [
                  Text(
                    '${t('Customer Price')}: ',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: _txtSec,
                    ),
                  ),
                  Text(
                    '₹${_fmt(customerPrice)}',
                    style: GoogleFonts.montserrat(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: _customerAmount,
                      decoration: TextDecoration.lineThrough,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 2),
            ],
            // Show the main price (wholesale price for wholesalers, customer price for customers)
            Row(
              children: [
                Text(
                  '${t('Special Price')}: ',
                  style: GoogleFonts.outfit(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: _txtSec,
                  ),
                ),
                Text(
                  '₹${_fmt(isWholesaler && wsPrice != null ? wsPrice : price)}',
                  style: GoogleFonts.outfit(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: isWholesaler ? _specialAmountWholesale : _blue,
                  ),
                ),
                const Spacer(),
                if (disc > 0)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: _green.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.local_offer_outlined,
                          size: 14,
                          color: _green,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          '$disc% ${t('OFF')}',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: _green,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ],
          const SizedBox(height: 12),
          // Live Purchase Counter
          Builder(
            builder: (context) {
              final pMin =
                  (_product!['purchaseCountMin'] as num?)?.toInt() ?? 0;
              final pMax =
                  (_product!['purchaseCountMax'] as num?)?.toInt() ?? 0;
              if (pMin <= 0 && pMax <= 0) return const SizedBox.shrink();
              final effectiveMax = pMax > pMin ? pMax : pMin;
              final dayOfYear = DateTime.now()
                  .difference(DateTime(DateTime.now().year))
                  .inDays;
              final productIdHash = widget.productId.toString().hashCode.abs();
              final seed = productIdHash + dayOfYear;
              final range = effectiveMax - pMin;
              final count = range > 0 ? pMin + (seed % (range + 1)) : pMin;
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFEF4444).withOpacity(0.08),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: const Color(0xFFEF4444).withOpacity(0.2),
                    width: 1,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.local_fire_department_rounded,
                      size: 16,
                      color: Color(0xFFEF4444),
                    ),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        '$count units sold in the last 24 hours',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFFEF4444),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
          // Delivery info and icons
          Row(
            children: [
              Icon(Icons.person_outline, size: 14, color: _txtSec),
              const SizedBox(width: 4),
              Icon(Icons.storefront_outlined, size: 14, color: _txtSec),
              const SizedBox(width: 4),
              Icon(Icons.local_shipping_outlined, size: 14, color: _txtSec),
              const SizedBox(width: 8),
              Text(
                t('Delivery within 5 days of Purchase'),
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 12,
                  color: _txtSec,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(
                inStock ? Icons.check_circle : Icons.cancel,
                size: 16,
                color: inStock ? _green : _red,
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  inStock ? t('In Stock')
                      : t('Out of Stock'),
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: inStock ? _green : _red,
                  ),
                ),
              ),
              if (showNegotiate) ...[
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: () => _openCustomerChat(name, sku, price),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [Color(0xFF5A8C69), Color(0xFF2F6D4D)],
                      ),
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF2F6D4D).withOpacity(0.35),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const FaIcon(
                          FontAwesomeIcons.whatsapp,
                          size: 16,
                          color: Colors.white,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          t('Bulk Order'),
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ] else ...[
                Text(
                  t('Incl. taxes'),
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 12,
                    color: _txtMuted,
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _badge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        text,
        style: GoogleFonts.plusJakartaSans(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: color,
        ),
      ),
    );
  }

  // ── SPECIFICATIONS ──
  List<Map<String, dynamic>> get _productLabels {
    final raw = _product?['labels'];
    if (raw is! List) return const [];
    final labels = raw
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList();
    labels.sort((a, b) {
      final aOrder = (a['order'] as num?)?.toInt() ?? 0;
      final bOrder = (b['order'] as num?)?.toInt() ?? 0;
      return aOrder.compareTo(bOrder);
    });
    return labels;
  }

  Widget _productLabelsSection() {
    final labels = _productLabels;
    if (labels.isEmpty) return const SizedBox.shrink();

    // Show max 5 labels
    final displayLabels = labels.take(5).toList();
    final labelCount = displayLabels.length;

    // Gap adapts based on label count (smaller gap for more labels)
    final gap = labelCount >= 4 ? 6.0 : (labelCount >= 3 ? 8.0 : 10.0);

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final totalGaps = (labelCount - 1) * gap;
          final availableWidth = constraints.maxWidth - totalGaps;
          final labelWidth = availableWidth / labelCount;
          // Fixed height for all labels
          const labelHeight = 80.0;

          return Row(
            children: displayLabels.asMap().entries.map((entry) {
              final isLast = entry.key == labelCount - 1;
              return Expanded(
                child: Padding(
                  padding: EdgeInsets.only(right: isLast ? 0 : gap),
                  child: SizedBox(
                    width: labelWidth,
                    height: labelHeight,
                    child: _buildProductLabelCard(entry.value),
                  ),
                ),
              );
            }).toList(),
          );
        },
      ),
    );
  }

  Widget _buildProductLabelCard(Map<String, dynamic> label) {
    final title = label['title']?.toString().trim() ?? '';
    final sourceType = label['sourceType']?.toString() == 'image'
        ? 'image'
        : 'icon';
    final imageUrl = _resolveLabelAssetUrl(label['image']?.toString() ?? '');
    final iconName = label['icon']?.toString() ?? '';

    // Light blue background matching trust badges strip
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFE8F5F8),
        borderRadius: BorderRadius.circular(0),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 32,
            height: 32,
            child: sourceType == 'image' && imageUrl.isNotEmpty
                ? CachedNetworkImage(
                    imageUrl: imageUrl,
                    fit: BoxFit.contain,
                    placeholder: (_, __) => _labelVisualSkeleton(),
                    errorWidget: (_, __, ___) => Icon(
                      _productLabelIcon(iconName, title),
                      size: 28,
                      color: const Color(0xFF2B6F73),
                    ),
                  )
                : Icon(
                    _productLabelIcon(iconName, title),
                    size: 28,
                    color: const Color(0xFF2B6F73),
                  ),
          ),
          const SizedBox(height: 6),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Text(
              title,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 10,
                height: 1.2,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF1E293B),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _labelVisualSkeleton() {
    return Container(
      decoration: BoxDecoration(
        color: _blue.withOpacity(0.08),
        borderRadius: BorderRadius.circular(12),
      ),
    );
  }

  String _resolveLabelAssetUrl(String imageUrl) {
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

  IconData _productLabelIcon(String rawIconName, String title) {
    final iconName = rawIconName.trim().toLowerCase();
    const iconMap = <String, IconData>{
      'autorenew': Icons.autorenew_rounded,
      'autorenew_rounded': Icons.autorenew_rounded,
      'assignment_return': Icons.assignment_return_rounded,
      'assignment_return_rounded': Icons.assignment_return_rounded,
      'published_with_changes': Icons.published_with_changes_rounded,
      'published_with_changes_rounded': Icons.published_with_changes_rounded,
      'verified': Icons.verified_rounded,
      'verified_rounded': Icons.verified_rounded,
      'workspace_premium': Icons.workspace_premium_rounded,
      'workspace_premium_rounded': Icons.workspace_premium_rounded,
      'inventory_2': Icons.inventory_2_rounded,
      'inventory_2_rounded': Icons.inventory_2_rounded,
      'local_shipping': Icons.local_shipping_rounded,
      'local_shipping_rounded': Icons.local_shipping_rounded,
      'support_agent': Icons.support_agent_rounded,
      'support_agent_rounded': Icons.support_agent_rounded,
      'headset_mic': Icons.headset_mic_rounded,
      'headset_mic_rounded': Icons.headset_mic_rounded,
      'shield': Icons.shield_rounded,
      'shield_rounded': Icons.shield_rounded,
      'security': Icons.security_rounded,
      'security_rounded': Icons.security_rounded,
      'payments': Icons.payments_rounded,
      'payments_rounded': Icons.payments_rounded,
      'currency_rupee': Icons.currency_rupee_rounded,
      'currency_rupee_rounded': Icons.currency_rupee_rounded,
      'check_circle': Icons.check_circle_rounded,
      'check_circle_rounded': Icons.check_circle_rounded,
    };

    if (iconMap.containsKey(iconName)) {
      return iconMap[iconName]!;
    }

    final probe = '$iconName ${title.toLowerCase()}';
    if (probe.contains('return') || probe.contains('refund')) {
      return Icons.autorenew_rounded;
    }
    if (probe.contains('quality') || probe.contains('assurance')) {
      return Icons.verified_rounded;
    }
    if (probe.contains('delivery') || probe.contains('dispatch')) {
      return Icons.inventory_2_rounded;
    }
    if (probe.contains('support') || probe.contains('assist')) {
      return Icons.headset_mic_rounded;
    }
    if (probe.contains('protect') || probe.contains('secure')) {
      return Icons.shield_rounded;
    }
    if (probe.contains('trust') || probe.contains('safe')) {
      return Icons.check_circle_rounded;
    }
    return Icons.verified_user_rounded;
  }

  Widget _specsSection(String Function(String) t) {
    final displayCount = _specs.length > 4 ? 4 : _specs.length;
    final hasMore = _specs.length > 4;

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: _card,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: _border.withOpacity(0.5)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: _blue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.auto_awesome_rounded,
                  color: _blue,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Specifications',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: _txt,
                  ),
                ),
              ),
              if (_specs.isNotEmpty)
                Text(
                  '${_specs.length} ${t('items')}',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: _txtMuted,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 20),
          ListView.separated(
            shrinkWrap: true,
            padding: EdgeInsets.zero,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: displayCount,
            separatorBuilder: (_, __) => Divider(
              color: _border.withOpacity(0.4),
              height: 24,
              thickness: 0.8,
            ),
            itemBuilder: (context, i) {
              final spec = _specs[i];
              String key = spec['key']?.toString() ?? '';
              final val = spec['value']?.toString() ?? '';
              bool isGeneric = key.toLowerCase().startsWith('feature_');

              return Row(
                children: [
                  Icon(Icons.auto_awesome_rounded, color: _blue, size: 14),
                  const SizedBox(width: 16),
                  Expanded(
                    child: RichText(
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      text: TextSpan(
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 14,
                          color: _txt,
                          height: 1.3,
                        ),
                        children: [
                          if (!isGeneric && key.isNotEmpty)
                            TextSpan(
                              text: '$key: ',
                              style: GoogleFonts.plusJakartaSans(
                                fontWeight: FontWeight.w600,
                                color: _txtMuted,
                                fontSize: 13,
                              ),
                            ),
                          TextSpan(
                            text: val,
                            style: GoogleFonts.plusJakartaSans(
                              fontWeight: FontWeight.w700,
                              color: _txt,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
          if (hasMore) ...[
            const SizedBox(height: 16),
            GestureDetector(
              onTap: () => _openSpecsSheet(t),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: _blue.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      t('View all specifications'),
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: _blue,
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Icon(
                      Icons.keyboard_arrow_right_rounded,
                      size: 18,
                      color: _blue,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _openSpecsSheet(String Function(String) t) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(ctx).size.height * 0.75,
        ),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 12),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: _border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 24),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Row(
                children: [
                  Text(
                    t('Specifications'),
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: _txt,
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: _bg,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '${_specs.length} ${t('items')}',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: _txtSec,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.fromLTRB(24, 0, 24, 40),
                itemCount: _specs.length,
                separatorBuilder: (_, __) =>
                    Divider(color: _border.withOpacity(0.5), height: 1),
                itemBuilder: (ctx, i) {
                  final spec = _specs[i];
                  final key = spec['key']?.toString() ?? '';
                  final val = spec['value']?.toString() ?? '';
                  bool isGeneric = key.toLowerCase().startsWith('feature_');

                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Row(
                      children: [
                        Icon(
                          Icons.auto_awesome_rounded,
                          color: _blue,
                          size: 14,
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: RichText(
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            text: TextSpan(
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 14,
                                color: _txt,
                              ),
                              children: [
                                if (!isGeneric && key.isNotEmpty)
                                  TextSpan(
                                    text: '$key: ',
                                    style: GoogleFonts.plusJakartaSans(
                                      fontWeight: FontWeight.w600,
                                      color: _txtSec,
                                      fontSize: 13,
                                    ),
                                  ),
                                TextSpan(
                                  text: val,
                                  style: GoogleFonts.plusJakartaSans(
                                    fontWeight: FontWeight.w700,
                                    color: _txt,
                                    fontSize: 14,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  // -- NEGOTIATE CARD --
  Widget _negotiateCard(
    String name,
    dynamic price,
    dynamic wsPrice,
    dynamic minQty,
    String Function(String) t,
  ) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF7C3AED), Color(0xFF6D28D9)],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.handshake_outlined,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      t('Bulk Negotiation'),
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                    Text(
                      t('Get wholesale pricing for custom bulk orders'),
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 13,
                        color: Colors.white.withOpacity(0.8),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (wsPrice != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  Text(
                    t('Wholesale: '),
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 13,
                      color: Colors.white.withOpacity(0.7),
                    ),
                  ),
                  Text(
                    '₹${_fmt(wsPrice)}${t('/unit')}',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 16),
          GestureDetector(
            onTap: () => _openNegotiateSheet(name, price, wsPrice, minQty, t),
            child: Container(
              width: double.infinity,
              height: 48,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.request_quote_outlined, size: 18, color: _violet),
                  const SizedBox(width: 8),
                  Text(
                    t('Start Negotiation'),
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: _violet,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── ALL IMAGES ──
  Widget _allImagesSection(String name, String Function(String) t) {
    if (_imagesData.isEmpty) return const SizedBox.shrink();
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: _card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _border.withOpacity(0.5)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            t('Product Gallery'),
            style: GoogleFonts.plusJakartaSans(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: _txt,
            ),
          ),
          const SizedBox(height: 16),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _imagesData.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (_, i) {
              final data = _imagesData[i];
              return ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: AppImage(
                  imageUrl: data['url']!,
                  blurHash: data['blurHash'],
                  category: _product?['category']?.toString() ?? '',
                  name: name,
                  fit: BoxFit.cover,
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  // ── DESCRIPTION ──
  Widget _descSection(String description, String Function(String) t) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: _card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _border.withOpacity(0.5)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            t('Description'),
            style: GoogleFonts.plusJakartaSans(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: _txt,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            description.isNotEmpty
                ? (_descExpanded
                      ? description
                      : (description.length > 200
                            ? '${description.substring(0, 200)}...'
                            : description))
                : t('No description available for this product.'),
            style: GoogleFonts.plusJakartaSans(
              fontSize: 14,
              color: description.isNotEmpty ? _txtSec : _txtMuted,
              height: 1.7,
              fontStyle: description.isEmpty
                  ? FontStyle.italic
                  : FontStyle.normal,
            ),
          ),
          if (_bullets.isNotEmpty) ...[
            const SizedBox(height: 14),
            ...(_descExpanded ? _bullets : _bullets.take(3)).map(
              (p) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      margin: const EdgeInsets.only(top: 6),
                      width: 6,
                      height: 6,
                      decoration: const BoxDecoration(
                        color: _blue,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        p,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: _txt,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
          if (description.length > 200 || _bullets.length > 3) ...[
            const SizedBox(height: 8),
            GestureDetector(
              onTap: () => setState(() => _descExpanded = !_descExpanded),
              child: Text(
                _descExpanded ? t('Show less') : t('Read more'),
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: _blue,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  // ── VIDEO (lazy) ──
  Widget _videoSection(String Function(String) t) {
    final url = _product?['videoUrl']?.toString() ?? '';
    if (url.isEmpty) return const SizedBox.shrink();
    final vid = YoutubePlayer.convertUrlToId(url);
    if (vid == null) return const SizedBox.shrink();

    if (!_videoReady) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
        child: GestureDetector(
          onTap: () {
            _initYoutube();
            setState(() => _videoReady = true);
          },
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  CachedNetworkImage(
                    imageUrl: 'https://img.youtube.com/vi/$vid/hqdefault.jpg',
                    width: double.infinity,
                    height: 200,
                    fit: BoxFit.cover,
                    placeholder: (_, __) => Container(height: 200, color: _bg),
                    errorWidget: (_, __, ___) => Container(
                      height: 200,
                      color: _bg,
                      child: const Center(
                        child: Icon(
                          Icons.play_circle_outline,
                          size: 48,
                          color: _txtMuted,
                        ),
                      ),
                    ),
                  ),
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.55),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.play_arrow_rounded,
                      color: Colors.white,
                      size: 32,
                    ),
                  ),
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    child: Container(
                      padding: const EdgeInsets.fromLTRB(16, 28, 16, 12),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.transparent,
                            Colors.black.withOpacity(0.6),
                          ],
                        ),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.play_circle_filled,
                            color: Color(0xFFFF0000),
                            size: 18,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            t('Product Demo'),
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }
    if (_ytCtrl == null) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Stack(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: YoutubePlayer(
              controller: _ytCtrl!,
              showVideoProgressIndicator: true,
              progressIndicatorColor: _blue,
              progressColors: const ProgressBarColors(
                playedColor: Color(0xFFFF0000),
                handleColor: Color(0xFFFF0000),
              ),
            ),
          ),
          Positioned(
            top: 8,
            right: 8,
            child: GestureDetector(
              onTap: _openFullscreenVideo,
              child: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.55),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.fullscreen_rounded,
                  color: Colors.white,
                  size: 22,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // -- SHIPPING --
  // ── RELATED PRODUCTS ──
  Widget _relatedProductsSection(String Function(String) t) {
    if (_isRelatedLoading) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 20),
        child: Center(child: CircularProgressIndicator(color: _blue)),
      );
    }
    if (_relatedProducts.isEmpty) return const SizedBox.shrink();

    return TweenAnimationBuilder<double>(
      key: ValueKey(_bgKey),
      tween: Tween<double>(begin: 0, end: 1),
      duration: const Duration(seconds: 10), // Slow drift
      builder: (context, value, child) {
        return Container(
          padding: const EdgeInsets.symmetric(vertical: 24),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment(math.sin(value * 2 * math.pi), -1),
              end: Alignment(-math.sin(value * 2 * math.pi), 1),
              colors: const [
                Color(0xFFEFF6FF), // Sky Blue 50
                Color(0xFFDBEAFE), // Sky Blue 100
                Color(0xFFEFF6FF), 
              ],
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                child: Text(
                  t('Related Products'),
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF1E293B),
                  ),
                ),
              ),
              SizedBox(
                height: 255, // Increased from 210 to accommodate action buttons and avoid overflow
                child: ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  scrollDirection: Axis.horizontal,

            itemCount: _relatedProducts.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final item = _relatedProducts[index];
              final pid = item['id']?.toString() ?? item['_id']?.toString() ?? '';
              final img = item['primaryImage'] ?? (item['images'] != null && (item['images'] as List).isNotEmpty ? item['images'][0]['url'] : '');
              
              final currentLang = ref.watch(localeProvider);
              final nameHindi = item['nameHindi']?.toString() ?? '';
              final nameEnglish = item['name']?.toString() ?? '';
              final displayName = currentLang == 'Hindi' && nameHindi.isNotEmpty ? nameHindi : nameEnglish;

              final price = item['price'] ?? 0;
              final mrp = item['mrp'] ?? 0;
              final hasMrp = mrp != null && mrp != price && (mrp as num) > 0;
              final discount = hasMrp
                  ? (((mrp - price) / mrp) * 100).round()
                  : 0;
              final inStock = (item['stock'] ?? 0) > 0;
              final stock = item['stock'] ?? 0;

              return GestureDetector(
                onTap: () => context.push('/product/$pid'),
                child: Container(
                  width: 155,
                  decoration: BoxDecoration(
                    color: _card,
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: _border.withOpacity(0.5)),
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
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Image Area
                      ClipRRect(
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                        child: Stack(
                          children: [
                            Container(
                              height: 110,
                              width: double.infinity,
                              color: Colors.white,
                              child: Center(
                                child: CachedNetworkImage(
                                  imageUrl: img,
                                  fit: BoxFit.contain,
                                  placeholder: (_, __) => const Center(child: CircularProgressIndicator(strokeWidth: 2, color: _blue)),
                                  errorWidget: (_, __, ___) => const Icon(Icons.image, color: _txtMuted),
                                ),
                              ),
                            ),
                            if (discount > 0)
                              Positioned(
                                top: 6,
                                left: 6,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: _green,
                                    borderRadius: BorderRadius.circular(2),
                                  ),
                                  child: Text(
                                    '$discount% OFF',
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 8,
                                      fontWeight: FontWeight.w800,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ),
                            if (!inStock)
                              Positioned.fill(
                                child: Container(
                                  color: Colors.white.withOpacity(0.6),
                                  child: Center(
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: Colors.black.withOpacity(0.8),
                                        borderRadius: BorderRadius.circular(2),
                                      ),
                                      child: Text(
                                        'Out of Stock',
                                        style: GoogleFonts.plusJakartaSans(
                                          color: Colors.white,
                                          fontSize: 9,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                      // Info Area
                      Padding(
                        padding: const EdgeInsets.all(8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            SizedBox(
                              height: 44, // Reduced from 48 for compactness
                              child: Text(
                                displayName.split(' ').map((word) {
                                  if (word.isEmpty) return word;
                                  return word[0].toUpperCase() + word.substring(1).toLowerCase();
                                }).join(' '),
                                maxLines: 3,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.w700,
                                  color: _txt,
                                ),
                              ),
                            ),
                            const SizedBox(height: 2), // Reduced gap from 4 to 2
                            Row(
                              children: [
                                Text(
                                  '₹${_fmt(price)}',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w800,
                                    color: _txt,
                                  ),
                                ),
                                if (hasMrp) ...[
                                  const SizedBox(width: 4),
                                  Text(
                                    '₹${_fmt(mrp)}',
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 9,
                                      color: _red,
                                      decoration: TextDecoration.lineThrough,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                            const SizedBox(height: 8),
                            // ACTION BUTTONS
                            if (inStock)
                              Row(
                                children: [
                                  // BUY NOW
                                  Expanded(
                                    child: GestureDetector(
                                      onTap: () {
                                        _trackEvent('related_buy_now_$pid');
                                        context.push(
                                          '/buy-now',
                                          extra: {
                                            'productId': pid,
                                            'productName': displayName,
                                            'productImage': img,
                                            'price': (price is num) ? price.toDouble() : 0.0,
                                            'mrp': (mrp is num) ? mrp.toDouble() : null,
                                            'quantity': 1,
                                            'stock': stock,
                                          },
                                        );
                                      },
                                      child: Container(
                                        height: 30,
                                        decoration: BoxDecoration(
                                          color: _blue,
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        alignment: Alignment.center,
                                        child: Text(
                                          t('Buy Now'),
                                          style: GoogleFonts.plusJakartaSans(
                                            color: Colors.white,
                                            fontSize: 9,
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  // ADD TO CART ICON
                                  GestureDetector(
                                    onTap: () {
                                      final pPrice = (price is num) ? price.toDouble() : 0.0;
                                      _trackEvent('related_add_to_cart_$pid');
                                      ref.read(cartProvider.notifier).addItem(
                                        productId: pid,
                                        name: displayName,
                                        price: pPrice,
                                        image: img,
                                        quantity: 1,
                                      );
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(
                                          content: Text(t('Added to cart')),
                                          duration: const Duration(seconds: 1),
                                          behavior: SnackBarBehavior.floating,
                                        ),
                                      );
                                    },
                                    child: Container(
                                      width: 30,
                                      height: 30,
                                      decoration: BoxDecoration(
                                        color: _blue.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(4),
                                        border: Border.all(color: _blue.withOpacity(0.2)),
                                      ),
                                      child: const Icon(Icons.add_shopping_cart_rounded, size: 14, color: _blue),
                                    ),
                                  ),
                                ],
                              )
                            else
                              Container(
                                height: 30,
                                width: double.infinity,
                                alignment: Alignment.center,
                                child: Text(
                                  t('Out of Stock'),
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: _red,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
              const SizedBox(height: 20),
            ],
          ),
        );
      },
      onEnd: () {
        if (mounted) {
          setState(() {
            _bgKey++;
          });
        }
      },
    );
  }


  Future<void> _fetchRelatedProducts() async {
    try {
      debugPrint('Fetching related products for: ${widget.productId}');
      setState(() => _isRelatedLoading = true);
      final r = await _dio.get('/products/${widget.productId}/related');
      debugPrint('Related products response: ${r.data}');
      if (mounted) {
        setState(() {
          _relatedProducts = r.data['data'] ?? [];
          _isRelatedLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching related products: $e');
      if (mounted) {
        setState(() => _isRelatedLoading = false);
      }
    }
  }

  Widget _shippingSection(String Function(String) t) {
    final terms =
        _product?['shippingTerms']?.toString() ??
        'Free shipping on orders above ₹5,000. Standard delivery 5-7 '
            'business days.\n\nReturn Policy: 7-day returns for unused items '
            'in original packaging.';
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: _card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _border.withOpacity(0.5)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          GestureDetector(
            onTap: () => setState(() => _shippingOpen = !_shippingOpen),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: Row(
                children: [
                  const Icon(
                    Icons.local_shipping_outlined,
                    size: 20,
                    color: _txtSec,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      t('Shipping & Returns'),
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: _txt,
                      ),
                    ),
                  ),
                  AnimatedRotation(
                    turns: _shippingOpen ? 0.25 : 0,
                    duration: const Duration(milliseconds: 300),
                    child: const Icon(
                      Icons.chevron_right,
                      color: _txtMuted,
                      size: 20,
                    ),
                  ),
                ],
              ),
            ),
          ),
          AnimatedCrossFade(
            firstChild: const SizedBox(width: double.infinity),
            secondChild: Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
              child: Text(
                terms,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 13,
                  color: _txtSec,
                  height: 1.6,
                ),
              ),
            ),
            crossFadeState: _shippingOpen
                ? CrossFadeState.showSecond
                : CrossFadeState.showFirst,
            duration: const Duration(milliseconds: 300),
            sizeCurve: Curves.easeInOut,
          ),
        ],
      ),
    );
  }

  Future<void> _fetchWhatsappNumber() async {
    try {
      final response = await _dio.get('/settings/banners');
      if (response.statusCode == 200) {
        final data = response.data['data'] ?? {};
        final wa = data['whatsapp']?.toString() ?? '';
        if (wa.isNotEmpty && mounted) setState(() => _whatsappNumber = wa);
      }
    } catch (_) {}
  }

  void _openWhatsApp(String name, dynamic price) {
    final pPrice = price != null ? '₹${_fmt(price)}' : '';
    final msg =
        'Hi, I need help with this product:\n\n'
        '*$name*${pPrice.isNotEmpty ? ' - $pPrice' : ''}\n\n'
        'https://agrimart.app/product/${widget.productId}\n\n'
        'Please share more details.';
    final encoded = Uri.encodeComponent(msg);
    final phone = _whatsappNumber.replaceAll(RegExp(r'[^0-9+]'), '');
    final url = Uri.parse('https://wa.me/$phone?text=$encoded');
    launchUrl(url, mode: LaunchMode.externalApplication);
  }

  void _openCustomerChat(String name, String sku, dynamic price) {
    final pPrice = price != null ? '₹${_fmt(price)}' : '';
    final msg =
        'Hi, I am interested in this product:\n\n'
        '*Name:* $name\n'
        '*SKU:* $sku\n'
        '*Price:* $pPrice\n\n'
        'Please share more details.';
    final encoded = Uri.encodeComponent(msg);
    const phone = '917880080069';
    final url = Uri.parse('https://wa.me/$phone?text=$encoded');
    launchUrl(url, mode: LaunchMode.externalApplication);
  }

  void _openBulkNegotiationSheet(
    String name,
    dynamic price,
    String Function(String) t,
  ) {
    final qtyCtrl = TextEditingController();
    final detailCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: _border,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Text(
                t('Bulk Quantity Negotiation'),
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: _txt,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                t(
                  "Want to deal in more quantity? Send us your requirement and we'll get back to you with the best price.",
                ),
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 14,
                  color: _txtSec,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                t('Expected Quantity'),
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: _txt,
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: qtyCtrl,
                keyboardType: TextInputType.number,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
                decoration: InputDecoration(
                  hintText: t('e.g. 100 units'),
                  filled: true,
                  fillColor: _bg,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                t('Requirement Details'),
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: _txt,
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: detailCtrl,
                maxLines: 3,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                ),
                decoration: InputDecoration(
                  hintText: t(
                    'Tell us about your requirement or target price...',
                  ),
                  filled: true,
                  fillColor: _bg,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.all(16),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    final qty = qtyCtrl.text.trim();
                    final details = detailCtrl.text.trim();
                    if (qty.isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(t('Please enter quantity'))),
                      );
                      return;
                    }
                    _sendNegotiationWhatsApp(name, price, qty, details);
                    Navigator.pop(ctx);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF25D366),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.chat_rounded, size: 20),
                      const SizedBox(width: 10),
                      Text(
                        t('Send Negotiation Request'),
                        style: GoogleFonts.plusJakartaSans(
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Center(
                child: TextButton(
                  onPressed: () {
                    Navigator.pop(ctx);
                    _openWhatsApp(name, price);
                  },
                  child: Text(
                    t('Direct Chat with Company'),
                    style: GoogleFonts.plusJakartaSans(
                      color: _txtSec,
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    ).then((_) {
      qtyCtrl.dispose();
      detailCtrl.dispose();
    });
  }

  void _sendNegotiationWhatsApp(
    String name,
    dynamic price,
    String qty,
    String details,
  ) {
    final pPrice = price != null ? '₹${_fmt(price)}' : '';
    final msg =
        '*BULK NEGOTIATION REQUEST*\n\n'
        '*Product:* $name\n'
        '*Retail Price:* $pPrice\n'
        '*Desired Quantity:* $qty\n'
        '*Requirement Details:* ${details.isEmpty ? 'N/A' : details}\n\n'
        'View Product: https://agrimart.app/product/${widget.productId}';

    final encoded = Uri.encodeComponent(msg);
    final phone = _whatsappNumber.replaceAll(RegExp(r'[^0-9+]'), '');
    final url = Uri.parse('https://wa.me/$phone?text=$encoded');
    launchUrl(url, mode: LaunchMode.externalApplication);
  }

  // -- BOTTOM BAR --
  Widget _bottomBar(
    String name,
    dynamic price,
    dynamic mrp,
    dynamic stock,
    bool inStock,
    double bp,
    bool negEnabled,
    dynamic wsPrice,
    dynamic minQty,
    String Function(String) t,
  ) {
    return Positioned(
      left: 0,
      right: 0,
      bottom: 0,
      child: Container(
        padding: EdgeInsets.fromLTRB(16, 12, 16, bp + 10),
        decoration: BoxDecoration(
          color: _card,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 20,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (inStock)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  children: [
                    Text(
                      t('Select Quantity:'),
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: _txt,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      decoration: BoxDecoration(
                        color: _bg,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: _border),
                      ),
                      child: Row(
                        children: [
                          _qtyBtn(Icons.remove, () {
                            if (_quantity > 1) setState(() => _quantity--);
                          }),
                          Container(
                            width: 40,
                            alignment: Alignment.center,
                            child: Text(
                              '$_quantity',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: _txt,
                              ),
                            ),
                          ),
                          _qtyBtn(Icons.add, () {
                            final s = stock is int ? stock : 99;
                            if (_quantity < s) setState(() => _quantity++);
                          }),
                        ],
                      ),
                    ),
                    if (stock != null) ...[
                      const SizedBox(width: 12),
                      _buildStockStatus(stock, t),
                    ],
                  ],
                ),
              ),
            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: inStock && !_addedToCart
                        ? () {
                            final img = _images.isNotEmpty ? _images[0] : null;
                            ref
                                .read(cartProvider.notifier)
                                .addItem(
                                  productId: widget.productId,
                                  name: name,
                                  image: img,
                                  price: (price is int)
                                      ? price.toDouble()
                                      : (price as num?)?.toDouble() ?? 0,
                                  mrp: (mrp is int)
                                      ? mrp.toDouble()
                                      : (mrp as num?)?.toDouble(),
                                  quantity: _quantity,
                                  stock: stock is int ? stock : 99,
                                );
                            _trackEvent('cart_add');
                            setState(() => _addedToCart = true);
                            _cartBounce.forward().then(
                              (_) => _cartBounce.reverse(),
                            );
                            Future.delayed(const Duration(seconds: 2), () {
                              if (mounted) setState(() => _addedToCart = false);
                            });
                          }
                        : null,
                    child: Container(
                      height: 56,
                      decoration: BoxDecoration(
                        color: _card,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: _border),
                      ),
                      child: Center(
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              _addedToCart
                                  ? Icons.check_rounded
                                  : Icons.shopping_cart_outlined,
                              size: 22,
                              color: _txt,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              t('Add to Cart'),
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: _txt,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: GestureDetector(
                    onTap: inStock && !_isBuyNowLoading
                        ? () async {
                            setState(() => _isBuyNowLoading = true);
                            try {
                              final img = _images.isNotEmpty
                                  ? _images[0]
                                  : null;
                              final productPrice = (price is int)
                                  ? price.toDouble()
                                  : (price as num?)?.toDouble() ?? 0;
                              final productMrp = (mrp is int)
                                  ? mrp.toDouble()
                                  : (mrp as num?)?.toDouble();
                              final productStock = stock is int ? stock : 99;

                              if (!mounted) return;
                              context.push(
                                '/buy-now',
                                extra: {
                                  'productId': widget.productId,
                                  'productName': name,
                                  'productImage': img,
                                  'price': productPrice,
                                  'mrp': productMrp,
                                  'quantity': _quantity,
                                  'stock': productStock,
                                },
                              );
                            } finally {
                              if (mounted) {
                                setState(() => _isBuyNowLoading = false);
                              }
                            }
                          }
                        : null,
                    child: Container(
                      height: 56,
                      decoration: BoxDecoration(
                        color: inStock && !_isBuyNowLoading ? _blue : _txtMuted,
                        borderRadius: BorderRadius.circular(18),
                        boxShadow: inStock
                            ? [
                                BoxShadow(
                                  color: _blue.withOpacity(0.25),
                                  blurRadius: 12,
                                  offset: const Offset(0, 4),
                                ),
                              ]
                            : null,
                      ),
                      child: Center(
                        child: _isBuyNowLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.2,
                                  color: Colors.white,
                                ),
                              )
                            : Text(
                                t('Buy Now'),
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStockStatus(dynamic stock, String Function(String) t) {
    final stockCount = stock is int ? stock : 99;

    String label;
    Color color;

    if (stockCount <= 0) {
      label = t('Out of Stock');
      color = _red;
    } else {
      label = t('In Stock');
      color = _green;
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.circle, size: 8, color: color),
        const SizedBox(width: 6),
        Text(
          label,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
      ],
    );
  }

  // ------------------------------------------
  // NEGOTIATE SHEET (native Flutter animation)
  // ------------------------------------------
  void _openNegotiateSheet(
    String productName,
    dynamic retailPrice,
    dynamic wsPrice,
    dynamic minQty,
    String Function(String) t,
  ) {
    final rp = retailPrice != null
        ? (retailPrice is int
              ? retailPrice.toDouble()
              : (retailPrice as num).toDouble())
        : 0.0;
    final wp = wsPrice != null
        ? (wsPrice is int ? wsPrice.toDouble() : (wsPrice as num).toDouble())
        : rp * 0.85;
    final minQ = minQty is int ? minQty : 10;
    int step = 0;
    int qty = 1;
    double target = wp;
    final qtyCtrl = TextEditingController(text: '$qty');
    final priceCtrl = TextEditingController(text: _fmt(target));

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheet) {
          Widget content;
          if (step == 0) {
            content = _sheetStep1(
              qty,
              qtyCtrl,
              minQ,
              (q) => setSheet(() => qty = q),
              () => setSheet(() => step = 1),
              t,
            );
          } else if (step == 1) {
            content = _sheetStep2(
              qty,
              target,
              priceCtrl,
              rp,
              (p) => setSheet(() => target = p),
              () => setSheet(() => step = 0),
              () => setSheet(() => step = 2),
              t,
            );
          } else {
            content = _sheetStep3(
              productName,
              qty,
              target,
              rp,
              () => setSheet(() => step = 1),
              () {
                Navigator.of(ctx).pop();
                _submitNegotiation(qty, target);
              },
              t,
            );
          }

          return Container(
            margin: EdgeInsets.only(top: MediaQuery.of(ctx).padding.top + 40),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            ),
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(
                20,
                12,
                20,
                MediaQuery.of(ctx).padding.bottom + 20,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 5,
                      margin: const EdgeInsets.only(bottom: 20),
                      decoration: BoxDecoration(
                        color: _border,
                        borderRadius: BorderRadius.circular(100),
                      ),
                    ),
                  ),
                  _stepDots(step),
                  const SizedBox(height: 24),
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 200),
                    child: KeyedSubtree(key: ValueKey(step), child: content),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    ).then((_) {
      qtyCtrl.dispose();
      priceCtrl.dispose();
    });
  }

  Widget _stepDots(int cur) {
    return Row(
      children: List.generate(3, (i) {
        final done = i < cur;
        final active = i == cur;
        return Expanded(
          child: Row(
            children: [
              if (i > 0)
                Expanded(
                  child: Container(height: 2, color: done ? _blue : _border),
                ),
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: done || active ? _blue : _bg,
                  border: Border.all(
                    color: done || active ? _blue : _border,
                    width: 2,
                  ),
                ),
                child: Center(
                  child: done
                      ? const Icon(Icons.check, color: Colors.white, size: 14)
                      : Text(
                          '${i + 1}',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: active ? Colors.white : _txtMuted,
                          ),
                        ),
                ),
              ),
              if (i < 2)
                Expanded(
                  child: Container(height: 2, color: done ? _blue : _border),
                ),
            ],
          ),
        );
      }),
    );
  }

  Widget _qtyBtn(IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.all(8),
        child: Icon(icon, size: 18, color: _blue),
      ),
    );
  }

  // Step 1: Quantity
  Widget _sheetStep1(
    int qty,
    TextEditingController ctrl,
    int minQ,
    ValueChanged<int> onQty,
    VoidCallback onNext,
    String Function(String) t,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: _violet.withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(Icons.inventory_2_outlined, color: _violet, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    t('How many units?'),
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: _txt,
                    ),
                  ),
                  Text(
                    t('Select quantity for your bulk quote'),
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 13,
                      color: _txtSec,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),
        Text(
          t('QUICK SELECT'),
          style: GoogleFonts.plusJakartaSans(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: _txtSec,
            letterSpacing: 1,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [10, 25, 50, 100].map((q) {
            final sel = qty == q;
            return Expanded(
              child: GestureDetector(
                onTap: () {
                  onQty(q);
                  ctrl.text = '$q';
                },
                child: Container(
                  margin: EdgeInsets.only(right: q == 100 ? 0 : 8),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: sel ? _blue : _bg,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: sel ? _blue : _border),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    '$q',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: sel ? Colors.white : _txt,
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 14),
        Container(
          decoration: BoxDecoration(
            color: _bg,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: _border),
          ),
          child: TextField(
            controller: ctrl,
            keyboardType: TextInputType.number,
            onChanged: (v) {
              final p = int.tryParse(v);
              if (p != null) onQty(p);
            },
            style: GoogleFonts.plusJakartaSans(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: _txt,
            ),
            decoration: InputDecoration(
              hintText: t('Custom quantity'),
              hintStyle: GoogleFonts.plusJakartaSans(color: _txtMuted),
              prefixIcon: Icon(Icons.edit_outlined, color: _txtSec, size: 20),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 14,
              ),
            ),
          ),
        ),
        const SizedBox(height: 20),
        GestureDetector(
          onTap: qty >= 1 ? onNext : null,
          child: Container(
            width: double.infinity,
            height: 52,
            decoration: BoxDecoration(
              color: qty >= 1 ? _blue : _border,
              borderRadius: BorderRadius.circular(14),
              boxShadow: qty >= 1
                  ? [
                      BoxShadow(
                        color: _blue.withOpacity(0.3),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ]
                  : null,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  t('Continue to Pricing'),
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: qty >= 1 ? Colors.white : _txtMuted,
                  ),
                ),
                const SizedBox(width: 8),
                Icon(
                  Icons.arrow_forward_rounded,
                  size: 20,
                  color: qty >= 1 ? Colors.white : _txtMuted,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // Step 2: Price
  Widget _sheetStep2(
    int qty,
    double target,
    TextEditingController ctrl,
    double rp,
    ValueChanged<double> onPrice,
    VoidCallback onBack,
    VoidCallback onNext,
    String Function(String) t,
  ) {
    final savings = (rp - target) * qty;
    final pct = rp > 0 ? ((rp - target) / rp * 100).round() : 0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: _blue.withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(Icons.payments_outlined, color: _blue, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    t('Set Your Price'),
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: _txt,
                    ),
                  ),
                  Text(
                    '$qty ${t('units')} · ${t('Retail')}: ₹${_fmt(rp)}/${t('unit')}',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 13,
                      color: _txtSec,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 18),
        Text(
          t('TARGET PRICE PER UNIT'),
          style: GoogleFonts.plusJakartaSans(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: _txtSec,
            letterSpacing: 1,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: _bg,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: _border),
          ),
          child: TextField(
            controller: ctrl,
            keyboardType: TextInputType.number,
            onChanged: (v) {
              final p = double.tryParse(v.replaceAll(',', ''));
              if (p != null) onPrice(p);
            },
            style: GoogleFonts.plusJakartaSans(
              fontSize: 24,
              fontWeight: FontWeight.w700,
              color: _txt,
            ),
            decoration: InputDecoration(
              prefixText: '₹ ',
              prefixStyle: GoogleFonts.plusJakartaSans(
                fontSize: 24,
                fontWeight: FontWeight.w700,
                color: _blue,
              ),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 14,
              ),
            ),
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: [0.80, 0.85, 0.90].map((f) {
            final v = rp * f;
            final sel = (target - v).abs() < 1;
            return Expanded(
              child: GestureDetector(
                onTap: () {
                  onPrice(v);
                  ctrl.text = _fmt(v);
                },
                child: Container(
                  margin: EdgeInsets.only(right: f == 0.90 ? 0 : 8),
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    color: sel ? _blue.withOpacity(0.08) : _bg,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: sel ? _blue : _border),
                  ),
                  child: Column(
                    children: [
                      Text(
                        '₹${_fmt(v)}',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: sel ? _blue : _txt,
                        ),
                      ),
                      Text(
                        '${((1 - f) * 100).round()}% ${t('off')}',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: sel ? _blue : _txtSec,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        if (target > 0 && target < rp) ...[
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: _green.withOpacity(0.06),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: _green.withOpacity(0.2)),
            ),
            child: Row(
              children: [
                Icon(Icons.savings_outlined, color: _green, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    '${t('Save')} ₹${_fmt(savings)} ${t('total')} ($pct% ${t('off')} × $qty ${t('units')})',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: _green,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 18),
        Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: onBack,
                child: Container(
                  height: 50,
                  decoration: BoxDecoration(
                    color: _bg,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: _border),
                  ),
                  child: Center(
                    child: Text(
                      t('Back'),
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: _txt,
                      ),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              flex: 2,
              child: GestureDetector(
                onTap: target > 0 ? onNext : null,
                child: Container(
                  height: 50,
                  decoration: BoxDecoration(
                    color: target > 0 ? _blue : _border,
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: target > 0
                        ? [
                            BoxShadow(
                              color: _blue.withOpacity(0.3),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ]
                        : null,
                  ),
                  child: Center(
                    child: Text(
                      t('Review Quote'),
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: target > 0 ? Colors.white : _txtMuted,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  // Step 3: Review
  Widget _sheetStep3(
    String productName,
    int qty,
    double target,
    double rp,
    VoidCallback onBack,
    VoidCallback onSubmit,
    String Function(String) t,
  ) {
    final total = target * qty;
    final saved = (rp * qty) - total;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: _green.withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(Icons.fact_check_outlined, color: _green, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    t('Review Quote'),
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: _txt,
                    ),
                  ),
                  Text(
                    t('Confirm details before submitting'),
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 13,
                      color: _txtSec,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 18),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: _bg,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: _border),
          ),
          child: Column(
            children: [
              _reviewLine(t('Product'), productName),
              _divider(),
              _reviewLine(t('Quantity'), '$qty ${t('units')}'),
              _divider(),
              _reviewLine(t('Your Price'), '₹${_fmt(target)}/${t('unit')}'),
              _divider(),
              _reviewLine(
                t('Retail Price'),
                '₹${_fmt(rp)}/${t('unit')}',
                muted: true,
              ),
              _divider(),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    t('Total'),
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: _txt,
                    ),
                  ),
                  Text(
                    '₹${_fmt(total)}',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: _blue,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        if (saved > 0) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: _green.withOpacity(0.06),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: _green.withOpacity(0.2)),
            ),
            child: Row(
              children: [
                Icon(Icons.trending_down_rounded, color: _green, size: 18),
                const SizedBox(width: 8),
                Text(
                  '${t('You save')} ₹${_fmt(saved)} ${t('vs retail')}',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: _green,
                  ),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: _amber.withOpacity(0.06),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: _amber.withOpacity(0.2)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.info_outline, color: _amber, size: 16),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Bulk orders require manual UPI verification before processing.',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 12,
                    color: const Color(0xFF92400E),
                    height: 1.4,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: onBack,
                child: Container(
                  height: 50,
                  decoration: BoxDecoration(
                    color: _bg,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: _border),
                  ),
                  child: Center(
                    child: Text(
                      'Edit',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: _txt,
                      ),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              flex: 2,
              child: GestureDetector(
                onTap: onSubmit,
                child: Container(
                  height: 50,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF7C3AED), Color(0xFF6D28D9)],
                    ),
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [
                      BoxShadow(
                        color: _violet.withOpacity(0.3),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.send_rounded,
                        color: Colors.white,
                        size: 18,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Submit Quote',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _reviewLine(String label, String value, {bool muted = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.plusJakartaSans(fontSize: 14, color: _txtSec),
        ),
        Flexible(
          child: Text(
            value,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: muted ? _txtMuted : _txt,
              decoration: muted ? TextDecoration.lineThrough : null,
            ),
            textAlign: TextAlign.right,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _divider() => Container(
    height: 1,
    color: _border.withOpacity(0.5),
    margin: const EdgeInsets.symmetric(vertical: 10),
  );

  Future<void> _submitNegotiation(int qty, double pricePerUnit) async {
    try {
      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.post(
        '/negotiations',
        data: {
          'productId': widget.productId,
          'quantity': qty,
          'pricePerUnit': pricePerUnit,
        },
      );

      if (response.data['success'] == true && mounted) {
        final negNumber = response.data['data']?['negotiationNumber'] ?? '';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Quotation $negNumber submitted for $qty units!',
                    style: GoogleFonts.plusJakartaSans(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            backgroundColor: _green,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            margin: const EdgeInsets.all(16),
          ),
        );
      }
    } on DioException catch (e) {
      if (!mounted) return;
      final msg =
          e.response?.data?['message']?.toString() ??
          'Failed to submit negotiation';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.error_outline, color: Colors.white, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  msg,
                  style: GoogleFonts.plusJakartaSans(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          backgroundColor: _red,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          margin: const EdgeInsets.all(16),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Something went wrong: $e'),
          backgroundColor: _red,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          margin: const EdgeInsets.all(16),
        ),
      );
    }
  }

  Widget _trustBadgesStrip() {
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: SizedBox(height: 36, child: _ProductTrustBadgeMarquee()),
    );
  }
}

// ------------------------------------------
// FULLSCREEN VIDEO PAGE (overlay)
// ------------------------------------------
class _FullscreenVideoPage extends StatefulWidget {
  final String videoId;
  const _FullscreenVideoPage({required this.videoId});

  @override
  State<_FullscreenVideoPage> createState() => _FullscreenVideoPageState();
}

class _FullscreenVideoPageState extends State<_FullscreenVideoPage> {
  late YoutubePlayerController _controller;

  @override
  void initState() {
    super.initState();
    _controller = YoutubePlayerController(
      initialVideoId: widget.videoId,
      flags: const YoutubePlayerFlags(
        autoPlay: true,
        mute: false,
        enableCaption: false,
        showLiveFullscreenButton: false,
        hideControls: false,
        forceHD: true,
      ),
    );
    // Lock to landscape for the fullscreen video page
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  }

  @override
  void dispose() {
    _controller.dispose();
    // Restore portrait orientation and system UI
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ]);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          Center(
            child: YoutubePlayer(
              controller: _controller,
              showVideoProgressIndicator: true,
              progressIndicatorColor: const Color(0xFF2563EB),
              progressColors: const ProgressBarColors(
                playedColor: Color(0xFFFF0000),
                handleColor: Color(0xFFFF0000),
              ),
            ),
          ),
          Positioned(
            top: MediaQuery.of(context).padding.top + 8,
            right: 16,
            child: GestureDetector(
              onTap: () => Navigator.of(context).pop(),
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.55),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.close_rounded,
                  color: Colors.white,
                  size: 24,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ------------------------------------------
// TRUST BADGE MARQUEE for product detail
// ------------------------------------------
class _ProductTrustBadgeMarquee extends StatefulWidget {
  @override
  State<_ProductTrustBadgeMarquee> createState() =>
      _ProductTrustBadgeMarqueeState();
}

class _ProductTrustBadgeMarqueeState extends State<_ProductTrustBadgeMarquee> {
  late final ScrollController _sc;
  Timer? _timer;

  static const Color _blue = Color(0xFF2563EB);
  static const Color _txtSec = Color(0xFF64748B);

  static final List<Map<String, dynamic>> _badges = [
    {'icon': Icons.verified_user_rounded, 'text': 'Verified Products'},
    {'icon': Icons.star_rounded, 'text': 'Trusted Reviews'},
    {'icon': Icons.support_agent_rounded, 'text': 'Guaranteed Support'},
    {'icon': Icons.local_shipping_rounded, 'text': 'Fast Delivery'},
    {'icon': Icons.shield_rounded, 'text': 'Secure Payments'},
    {'icon': Icons.autorenew_rounded, 'text': 'Easy Returns'},
    {'icon': Icons.verified_user_rounded, 'text': 'Verified Products'},
    {'icon': Icons.star_rounded, 'text': 'Trusted Reviews'},
    {'icon': Icons.support_agent_rounded, 'text': 'Guaranteed Support'},
    {'icon': Icons.local_shipping_rounded, 'text': 'Fast Delivery'},
    {'icon': Icons.shield_rounded, 'text': 'Secure Payments'},
    {'icon': Icons.autorenew_rounded, 'text': 'Easy Returns'},
  ];

  @override
  void initState() {
    super.initState();
    _sc = ScrollController();
    WidgetsBinding.instance.addPostFrameCallback((_) => _startScroll());
  }

  void _startScroll() {
    _timer = Timer.periodic(const Duration(milliseconds: 30), (_) {
      if (!_sc.hasClients) return;
      final max = _sc.position.maxScrollExtent;
      final cur = _sc.offset;
      if (cur >= max) {
        _sc.jumpTo(0);
      } else {
        _sc.jumpTo(cur + 0.8);
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _sc.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: _blue.withOpacity(0.04),
      child: ListView.builder(
        controller: _sc,
        scrollDirection: Axis.horizontal,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: _badges.length,
        itemBuilder: (_, i) {
          final item = _badges[i];
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(item['icon'] as IconData, size: 16, color: _blue),
                const SizedBox(width: 6),
                Text(
                  item['text'] as String,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: _txtSec,
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
