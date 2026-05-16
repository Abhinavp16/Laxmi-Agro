import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/providers/locale_provider.dart';
import '../../core/config/api_config.dart';
import '../../core/providers/cart_provider.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/services/notification_service.dart';
import '../../core/services/redeemed_coupon_service.dart';
import '../../core/services/shipping_address_service.dart';
import '../../core/services/storage_service.dart';
import '../../core/services/transliteration_service.dart';
import '../categories/categories_screen.dart';
import '../profile/legal_policy_screen.dart';
import '../../widgets/product_image_placeholder.dart';
import '../../widgets/app_image.dart';
import '../../core/providers/wishlist_provider.dart';
import '../../core/providers/order_count_provider.dart';

class MarketplaceHomeScreen extends ConsumerStatefulWidget {
  final int? initialTab;
  final String? initialSearchQuery;
  const MarketplaceHomeScreen({
    super.key,
    this.initialTab,
    this.initialSearchQuery,
  });

  @override
  ConsumerState<MarketplaceHomeScreen> createState() =>
      _MarketplaceHomeScreenState();
}

class _MarketplaceHomeScreenState extends ConsumerState<MarketplaceHomeScreen> {
  static const Duration _guestInitialFreeUseDuration = Duration(minutes: 3);
  static const Duration _guestPromptRepeatDuration = Duration(minutes: 3);
  late int _selectedNavIndex;
  bool _isCheckingOut = false;
  int _currentCarouselIndex = 0;
  final PageController _carouselController = PageController();
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  // Use ApiConfig.baseUrl - update the IP in lib/core/config/api_config.dart
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
  // Blue Theme Colors - Apple-like design
  static const Color primaryBlue = Color(0xFF1E40AF);
  static const Color primaryBlueDark = Color(0xFF1D4ED8);
  static const Color backgroundWhite = Color(0xFFF8FAFC);
  static const Color surfaceWhite = Color(0xFFFFFFFF);
  static const Color textPrimary = Color(0xFF0F172A);
  static const Color textSecondary = Color(0xFF475569);
  static const Color textMuted = Color(0xFF64748B);
  static const Color borderLight = Color(0xFFF1F5F9);

  // State for dynamic data
  List<Map<String, dynamic>> _brands = [];
  List<Map<String, dynamic>> _products = [];
  bool _isLoadingBrands = true;
  bool _isLoadingProducts = true;

  // Search state
  List<Map<String, dynamic>> _searchResults = [];
  bool _isSearching = false;
  String _searchQuery = '';
  Timer? _searchDebounce;
  final List<String> _recentSearches = ['Seed Drill', 'Tractor parts'];

  // Filter state
  String? _selectedFilterCategory;
  String? _selectedFilterBrand;
  List<String> _categories = [];
  List<Map<String, dynamic>> _categoryData = [];
  bool _isLoadingCategories = true;
  String? _requestedCategoryName;

  // Hero banners from API (top carousel)
  List<Map<String, dynamic>> _heroBanners = [];
  bool _isLoadingHeroBanners = true;
  Timer? _heroAutoRotateTimer;

  // Promo banners from API (second carousel)
  List<Map<String, dynamic>> _promoBanners = [];
  bool _isLoadingPromoBanners = true;
  int _currentPromoBannerIndex = 0;
  final PageController _promoBannerController = PageController();
  Timer? _promoAutoRotateTimer;
  final Set<String> _pendingHindiSync = <String>{};
  final Set<String> _completedHindiSync = <String>{};
  static final RegExp _mongoObjectIdPattern = RegExp(r'^[a-fA-F0-9]{24}$');

  // Notification state
  List<Map<String, dynamic>> _notifications = [];
  int _unreadCount = 0;
  bool _isLoadingNotifications = false;
  StateSetter? _dialogSetter;
  DateTime? _lastNotificationPopupFetchAt;

  // Offers state
  List<Map<String, dynamic>> _offers = [];
  bool _isLoadingOffers = true;

  // Reviews state
  List<Map<String, dynamic>> _dynamicReviews = [];
  bool _isLoadingReviews = true;
  Timer? _guestAuthPromptTimer;
  bool _isGuestAuthDialogVisible = false;

  @override
  void initState() {
    super.initState();
    _selectedNavIndex = widget.initialTab ?? 0;
    _fetchBrands();
    _fetchProducts();
    _fetchCategories();
    _fetchPromoBanners();
    _fetchOffers();
    _fetchReviews();
    _loadSavedShippingAddresses();
    _initNotifications();
    _fetchNotificationCount();

    // Fetch cart from server so it persists across app restarts
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _applyInitialSearchRouteState();
      ref.read(cartProvider.notifier).fetchCart();
      _startAutoRotate();
      _initGuestAuthPromptFlow();
    });
  }

  @override
  void didUpdateWidget(covariant MarketplaceHomeScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.initialTab != widget.initialTab ||
        oldWidget.initialSearchQuery != widget.initialSearchQuery) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          _applyInitialSearchRouteState();
        }
      });
    }
  }

  void _applyInitialSearchRouteState() {
    final requestedQuery = widget.initialSearchQuery?.trim() ?? '';
    final targetTab = requestedQuery.isNotEmpty ? 1 : (widget.initialTab ?? 0);

    if (_selectedNavIndex != targetTab) {
      setState(() => _selectedNavIndex = targetTab);
    }

    if (targetTab != 1) {
      return;
    }

    if (requestedQuery.isNotEmpty && _searchController.text != requestedQuery) {
      _searchController
        ..text = requestedQuery
        ..selection = TextSelection.collapsed(offset: requestedQuery.length);
      _searchProducts(requestedQuery);
    }

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _searchFocusNode.requestFocus();
      }
    });
  }

  Future<void> _initGuestAuthPromptFlow() async {
    if (!mounted) return;
    if (ref.read(authProvider).isAuthenticated) return;

    final trialStartAt = await StorageService.getOrCreateGuestTrialStartedAt();
    if (!mounted) return;

    final elapsed = DateTime.now().difference(trialStartAt);
    final initialDelay = _guestInitialFreeUseDuration - elapsed;
    if (initialDelay.isNegative || initialDelay == Duration.zero) {
      _showGuestAuthPrompt();
      return;
    }

    _guestAuthPromptTimer?.cancel();
    _guestAuthPromptTimer = Timer(initialDelay, _showGuestAuthPrompt);
  }

  void _scheduleNextGuestPrompt() {
    _guestAuthPromptTimer?.cancel();
    _guestAuthPromptTimer = Timer(_guestPromptRepeatDuration, () {
      _showGuestAuthPrompt();
    });
  }

  bool _isAuthRouteActive() {
    final currentPath = GoRouter.of(
      context,
    ).routeInformationProvider.value.uri.path;
    const authPaths = <String>{
      '/login',
      '/register',
      '/signup',
      '/role-login',
      '/wholesaler-registration',
    };
    return authPaths.any(
      (path) => currentPath == path || currentPath.startsWith('$path/'),
    );
  }

  Future<void> _showGuestAuthPrompt() async {
    if (!mounted) return;
    final auth = ref.read(authProvider);
    if (auth.isAuthenticated || _isGuestAuthDialogVisible) return;

    // Don't show popup on auth routes
    if (_isAuthRouteActive()) {
      _scheduleNextGuestPrompt();
      return;
    }

    _isGuestAuthDialogVisible = true;
    final shouldOpenLogin = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Login Required'),
          content: const Text(
            'Please login or sign up to continue enjoying all features.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Skip'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: const Text('Login / Sign Up'),
            ),
          ],
        );
      },
    );
    _isGuestAuthDialogVisible = false;

    if (!mounted) return;
    if (ref.read(authProvider).isAuthenticated) return;

    if (shouldOpenLogin == true) {
      context.push('/login');
    }
    _scheduleNextGuestPrompt();
  }

  Future<void> _initNotifications() async {
    try {
      await ref.read(notificationServiceProvider).initialize();
    } catch (e) {
      debugPrint('Notification init error: $e');
    }
  }

  Future<void> _fetchReviews() async {
    try {
      final response = await _dio.get('/reviews');
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'];
        setState(() {
          _dynamicReviews = data
              .map((item) => item as Map<String, dynamic>)
              .toList();
          _isLoadingReviews = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching reviews: $e');
      setState(() {
        _isLoadingReviews = false;
      });
    }
  }

  Future<void> _fetchBrands() async {
    try {
      debugPrint('Fetching brands...');
      final response = await _dio.get('/companies');
      debugPrint('Brands response: ${response.statusCode}');
      if (response.statusCode == 200) {
        final data = response.data;
        final List<dynamic> items = data['data'] ?? data ?? [];
        debugPrint('Found ${items.length} brands');
        setState(() {
          final fetched = items
              .map<Map<String, dynamic>>(
                (item) => <String, dynamic>{
                  'id': item['_id']?.toString() ?? item['id']?.toString() ?? '',
                  'name': item['name']?.toString() ?? '',
                  'logo': item['logo'] is Map
                      ? item['logo']['url']?.toString() ?? ''
                      : item['logo']?.toString() ?? '',
                  'slug': item['slug']?.toString() ?? '',
                },
              )
              .toList();
          
          // Sort brands to bring OXON to the front
          fetched.sort((a, b) {
            final nameA = a['name']?.toString().toUpperCase() ?? '';
            final nameB = b['name']?.toString().toUpperCase() ?? '';
            if (nameA == 'OXON') return -1;
            if (nameB == 'OXON') return 1;
            return 0;
          });
          
          // Use empty list if API returns nothing (shimmer/empty state will show)
          _brands = fetched.isEmpty ? [] : fetched;
          _isLoadingBrands = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching brands: $e');
      setState(() {
        _brands = [];
        _isLoadingBrands = false;
      });
    }
  }

  /// Returns empty string when no valid URL found — the [ProductImagePlaceholder]
  /// widget will render a beautiful category-specific illustration instead.
  static String _fallbackImageFor(String name, String category) {
    return ''; // ProductImagePlaceholder handles the display
  }

  Future<void> _fetchProducts() async {
    try {
      debugPrint('Fetching products...');
      final response = await _dio.get('/products');
      debugPrint('Products response: ${response.statusCode}');
      if (response.statusCode == 200) {
        final data = response.data;
        final List<dynamic> items = data['data'] ?? data ?? [];
        debugPrint('Found ${items.length} products');
        setState(() {
          final fetched = items.map<Map<String, dynamic>>((item) {
            final name = item['name']?.toString() ?? '';
            final cat = (item['category'] ?? item['categoryName'] ?? '')
                .toString();
            // Try every possible image field the backend might use
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
            // If the URL is relative (starts with /), prepend the server base
            if (apiImage.isNotEmpty && apiImage.startsWith('/')) {
              final serverBase = ApiConfig.baseUrl.replaceFirst('/api/v1', '');
              apiImage = '$serverBase$apiImage';
            }
            final isValidUrl =
                apiImage.startsWith('http://') ||
                apiImage.startsWith('https://');
            final image = isValidUrl ? apiImage : _fallbackImageFor(name, cat);
            debugPrint('Product: $name | apiImage: $apiImage | final: $image');
            return <String, dynamic>{
              'id': item['id']?.toString() ?? item['_id']?.toString() ?? '',
              'name': name,
              'nameHindi': item['nameHindi']?.toString() ?? '',
              'category': cat,
              'brand': cat,
              'price': item['price'] ?? item['retailPrice'] ?? 0,
              'originalPrice': item['mrp'] ?? item['originalPrice'] ?? 0,
              'image': image,
              'blurHash': item['primaryBlurHash'] ?? item['blurHash'] ?? '',
              'isFeatured': item['isFeatured'] == true,
              'isHot': item['isHot'] == true,
              'isNew': item['isNew'] == true,
              'inStock': item['inStock'] != false,
              'discount': 0,
              'rating': item['rating'] ?? 4.5,
              'reviewCount': item['reviewCount'] ?? item['reviews'] ?? '',
              'purchaseCountMin': item['purchaseCountMin'] ?? 0,
              'purchaseCountMax': item['purchaseCountMax'] ?? 0,
            };
          }).toList();
          // Use empty list if API returns nothing (shimmer/empty state will show)
          _products = fetched.isEmpty ? [] : fetched;
          _isLoadingProducts = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching products: $e');
      setState(() {
        _products = [];
        _isLoadingProducts = false;
      });
    }
  }

  Future<void> _fetchCategories() async {
    setState(() => _isLoadingCategories = true);
    try {
      final response = await _dio.get('/products/categories');
      debugPrint('Products categories API response: ${response.data}');
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
          debugPrint('Error fetching category metadata from /categories: $e');
        }

        setState(() {
          _categoryData = items
              .map<Map<String, dynamic>>((item) {
                final name = item['name']?.toString() ?? '';
                final metadata =
                    categoryMetaByName[_normalizedCategoryKey(name)] ?? {};
                return {
                  'name': name,
                  'image': metadata['image']?.toString() ?? '',
                  'blurHash': metadata['blurHash']?.toString(),
                  'slug': metadata['slug']?.toString() ?? '',
                  'count': item['count'] ?? item['productCount'],
                };
              })
              .where((item) => (item['name'] as String).isNotEmpty)
              .where(_categoryHasProducts)
              .toList();
          _categories = _categoryData
              .map<String>((item) => item['name']?.toString() ?? '')
              .toList();
          _isLoadingCategories = false;
        });
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
      'slug': slug,
      'image': _extractCategoryImageUrl(item),
      'blurHash': item['image'] is Map ? item['image']['blurHash']?.toString() : null,
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
    return _resolveCategoryImageUrl(rawUrl?.toString() ?? '');
  }

  String _resolveCategoryImageUrl(String imageUrl) {
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

  Future<void> _fetchPromoBanners() async {
    try {
      final response = await _dio.get('/settings/banners');
      if (response.statusCode == 200) {
        final data = response.data['data'] ?? {};
        final List<dynamic> heroItems = data['heroBanners'] ?? [];
        final List<dynamic> promoItems = data['promoBanners'] ?? [];

        setState(() {
          if (heroItems.isNotEmpty) {
            _heroBanners = heroItems
                .map<Map<String, dynamic>>(
                  (item) => <String, dynamic>{
                    'title': item['title']?.toString() ?? '',
                    'subtitle': item['subtitle']?.toString() ?? '',
                    'tag': item['tag']?.toString() ?? '',
                    'imageUrl': item['imageUrl']?.toString() ?? '',
                    'linkUrl': item['linkUrl']?.toString() ?? '',
                    'buttonText': item['buttonText']?.toString() ?? '',
                    'buttonIcon': item['buttonIcon']?.toString() ?? '',
                  },
                )
                .toList();
          }
          if (promoItems.isNotEmpty) {
            _promoBanners = promoItems
                .map<Map<String, dynamic>>(
                  (item) => <String, dynamic>{
                    'title': item['title']?.toString() ?? '',
                    'subtitle': item['subtitle']?.toString() ?? '',
                    'tag': item['tag']?.toString() ?? '',
                    'imageUrl': item['imageUrl']?.toString() ?? '',
                    'linkUrl': item['linkUrl']?.toString() ?? '',
                    'buttonText': item['buttonText']?.toString() ?? '',
                    'buttonIcon': item['buttonIcon']?.toString() ?? '',
                  },
                )
                .toList();
          }
        });
        _startAutoRotate();
      }
    } catch (e) {
      debugPrint('Error fetching banners: $e');
    } finally {
      setState(() {
        _isLoadingHeroBanners = false;
        _isLoadingPromoBanners = false;
      });
    }
  }

  Future<void> _fetchOffers() async {
    try {
      final auth = ref.read(authProvider);
      String targetGroup;

      if (auth.isAuthenticated) {
        // User is logged in - use their role
        targetGroup = auth.user?.role ?? 'buyer';
      } else {
        // Guest user - show customer/buyer offers
        targetGroup = 'buyer';
      }

      final response = await _dio.get(
        '/offers',
        queryParameters: {'targetGroup': targetGroup},
      );

      if (response.statusCode == 200) {
        final List<dynamic> items = response.data['data'] ?? [];
        setState(() {
          _offers = items.map<Map<String, dynamic>>((item) {
            final discountType = item['discountType']?.toString() ?? '';
            final discountValue = item['discountValue'];
            return {
              'title': item['title'] ?? '',
              'discount': discountType == 'percentage'
                  ? '$discountValue%'
                  : '₹$discountValue',
              'type': discountType,
              'value': discountValue,
              'code': item['code']?.toString(),
              'rule': discountType == 'percentage'
                  ? 'Up to $discountValue% off on selected products'
                  : 'Flat Rs $discountValue off on eligible orders',
            };
          }).toList();
          _isLoadingOffers = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching offers: $e');
      setState(() => _isLoadingOffers = false);
      // For guest users, try fetching buyer offers as fallback
      final auth = ref.read(authProvider);
      if (!auth.isAuthenticated) {
        try {
          final response = await _dio.get(
            '/offers',
            queryParameters: {'targetGroup': 'buyer'},
          );
          if (response.statusCode == 200) {
            final List<dynamic> items = response.data['data'] ?? [];
            if (items.isNotEmpty && mounted) {
              setState(() {
                _offers = items.map<Map<String, dynamic>>((item) {
                  final discountType = item['discountType']?.toString() ?? '';
                  final discountValue = item['discountValue'];
                  return {
                    'title': item['title'] ?? '',
                    'discount': discountType == 'percentage'
                        ? '$discountValue%'
                        : '₹$discountValue',
                    'type': discountType,
                    'value': discountValue,
                    'code': item['code']?.toString(),
                    'rule': discountType == 'percentage'
                        ? 'Up to $discountValue% off on selected products'
                        : 'Flat Rs $discountValue off on eligible orders',
                  };
                }).toList();
              });
            }
          }
        } catch (e2) {
          debugPrint('Error fetching buyer offers fallback: $e2');
        }
      }
    }
  }

  void _startAutoRotate() {
    _heroAutoRotateTimer?.cancel();
    _promoAutoRotateTimer?.cancel();
    if (_heroBanners.length > 1) {
      _heroAutoRotateTimer = Timer.periodic(const Duration(seconds: 5), (_) {
        if (_carouselController.hasClients) {
          final next = (_currentCarouselIndex + 1) % _heroBanners.length;
          _carouselController.animateToPage(
            next,
            duration: const Duration(milliseconds: 400),
            curve: Curves.easeInOut,
          );
        }
      });
    }
    if (_promoBanners.length > 1) {
      _promoAutoRotateTimer = Timer.periodic(const Duration(seconds: 5), (_) {
        if (_promoBannerController.hasClients) {
          final next = (_currentPromoBannerIndex + 1) % _promoBanners.length;
          _promoBannerController.animateToPage(
            next,
            duration: const Duration(milliseconds: 400),
            curve: Curves.easeInOut,
          );
        }
      });
    }
  }

  Future<void> _handleRefresh() async {
    debugPrint('Pull to refresh triggered...');
    await Future.wait([
      _fetchBrands(),
      _fetchProducts(),
      _fetchCategories(),
      _fetchPromoBanners(),
      _fetchOffers(),
      _fetchNotificationCount(),
      _fetchNegotiations(),
      ref.read(authProvider.notifier).fetchCurrentUser(),
    ]);
  }

  Future<void> _searchProducts(String query) async {
    if (query.trim().isEmpty &&
        _selectedFilterCategory == null &&
        _selectedFilterBrand == null) {
      setState(() {
        _searchResults = [];
        _isSearching = false;
        _searchQuery = '';
      });
      return;
    }
    setState(() {
      _isSearching = true;
      _searchQuery = query;
    });
    try {
      final params = <String, dynamic>{};
      if (query.trim().isNotEmpty) params['q'] = query;
      if (_selectedFilterCategory != null) {
        params['category'] = _selectedFilterCategory;
      }
      if (_selectedFilterBrand != null) params['brand'] = _selectedFilterBrand;

      final endpoint = query.trim().isNotEmpty
          ? '/products/search'
          : '/products';
      final response = await _dio.get(endpoint, queryParameters: params);
      if (response.statusCode == 200) {
        final List<dynamic> items = response.data['data'] ?? [];
        setState(() {
          _searchResults = items
              .map<Map<String, dynamic>>(
                (item) => <String, dynamic>{
                  'id': item['id']?.toString() ?? item['_id']?.toString() ?? '',
                  'name': item['name']?.toString() ?? '',
                  'nameHindi': item['nameHindi']?.toString() ?? '',
                  'brand': item['category']?.toString() ?? '',
                  'price': item['price'] ?? item['retailPrice'] ?? 0,
                   'originalPrice': item['mrp'] ?? 0,
                  'image': item['primaryImage']?.toString() ?? '',
                  'blurHash': item['primaryBlurHash']?.toString() ?? item['blurHash']?.toString() ?? '',
                  'inStock': item['inStock'] == true,
                  'shortDescription':
                      item['shortDescription']?.toString() ?? '',
                },
              )
              .toList();
          _isSearching = false;
        });
      }
    } catch (e) {
      debugPrint('Search error: $e');
      setState(() => _isSearching = false);
    }
  }

  void _showFilterSheet() {
    String? tempCategory = _selectedFilterCategory;
    String? tempBrand = _selectedFilterBrand;
    final t = ref.read(localeProvider.notifier).translate;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) {
          return Container(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.65,
            ),
            decoration: const BoxDecoration(
              color: surfaceWhite,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Handle bar
                Container(
                  margin: const EdgeInsets.only(top: 12),
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: borderLight,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                // Header
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        t('Filters'),
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: textPrimary,
                        ),
                      ),
                      GestureDetector(
                        onTap: () {
                          setSheetState(() {
                            tempCategory = null;
                            tempBrand = null;
                          });
                        },
                        child: Text(
                          t('Reset'),
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: primaryBlue,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                // Category section
                Flexible(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          t('Category'),
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: textPrimary,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: _categories.map((cat) {
                            final selected = tempCategory == cat;
                            return GestureDetector(
                              onTap: () => setSheetState(
                                () => tempCategory = selected ? null : cat,
                              ),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 10,
                                ),
                                decoration: BoxDecoration(
                                  color: selected ? primaryBlue : surfaceWhite,
                                  borderRadius: BorderRadius.circular(100),
                                  border: Border.all(
                                    color: selected ? primaryBlue : borderLight,
                                  ),
                                  boxShadow: selected
                                      ? [
                                          BoxShadow(
                                            color: primaryBlue.withOpacity(0.2),
                                            blurRadius: 8,
                                            offset: const Offset(0, 2),
                                          ),
                                        ]
                                      : null,
                                ),
                                child: Text(
                                  cat,
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: selected
                                        ? Colors.white
                                        : textSecondary,
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 24),
                        // Brand section
                        Text(
                          t('Brand'),
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: textPrimary,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: _brands.map((brand) {
                            final name = brand['name'] as String;
                            final selected = tempBrand == name;
                            return GestureDetector(
                              onTap: () => setSheetState(
                                () => tempBrand = selected ? null : name,
                              ),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 10,
                                ),
                                decoration: BoxDecoration(
                                  color: selected ? primaryBlue : surfaceWhite,
                                  borderRadius: BorderRadius.circular(100),
                                  border: Border.all(
                                    color: selected ? primaryBlue : borderLight,
                                  ),
                                  boxShadow: selected
                                      ? [
                                          BoxShadow(
                                            color: primaryBlue.withOpacity(0.2),
                                            blurRadius: 8,
                                            offset: const Offset(0, 2),
                                          ),
                                        ]
                                      : null,
                                ),
                                child: Text(
                                  name,
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: selected
                                        ? Colors.white
                                        : textSecondary,
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),
                // Apply button
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
                  child: SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: () {
                        setState(() {
                          _selectedFilterCategory = tempCategory;
                          _selectedFilterBrand = tempBrand;
                        });
                        Navigator.pop(ctx);
                        _searchProducts(_searchQuery);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: primaryBlue,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 0,
                      ),
                      child: Text(
                        t('Apply Filters'),
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _fetchNotificationCount() async {
    try {
      final api = ref.read(apiClientProvider);
      final response = await api.get(
        '/notifications/my',
        queryParameters: {'limit': 1},
      );
      if (response.statusCode == 200) {
        setState(() {
          _unreadCount = response.data['unreadCount'] ?? 0;
        });
      }
    } catch (e) {
      debugPrint('Error fetching notification count: $e');
    }
  }

  Future<void> _fetchNotifications([
    void Function(void Function())? dialogSetter,
  ]) async {
    final update = dialogSetter ?? setState;
    update(() => _isLoadingNotifications = true);
    try {
      final api = ref.read(apiClientProvider);
      final response = await api.get(
        '/notifications/my',
        queryParameters: {'limit': 10},
      );
      if (response.statusCode == 200) {
        final List<dynamic> items = response.data['data'] ?? [];
        final mapped = items
            .map<Map<String, dynamic>>(
              (item) => <String, dynamic>{
                'id': item['_id']?.toString() ?? '',
                'title': item['title']?.toString() ?? '',
                'body': item['body']?.toString() ?? '',
                'type': item['type']?.toString() ?? 'general',
                'isRead': item['isRead'] == true,
                'createdAt': item['createdAt']?.toString() ?? '',
                'data': item['data'] ?? {},
              },
            )
            .toList();
        _notifications = mapped;
        _unreadCount = response.data['unreadCount'] ?? 0;
        _isLoadingNotifications = false;
        update(() {});
        // Also update parent so badge refreshes
        if (dialogSetter != null && mounted) setState(() {});
      } else {
        _isLoadingNotifications = false;
        update(() {});
      }
    } catch (e) {
      debugPrint('Error fetching notifications: $e');
      _isLoadingNotifications = false;
      update(() {});
    }
  }

  Future<void> _markNotificationsRead([
    void Function(void Function())? dialogSetter,
  ]) async {
    try {
      final api = ref.read(apiClientProvider);
      await api.post('/notifications/mark-read', data: {});
      _unreadCount = 0;
      for (var n in _notifications) {
        n['isRead'] = true;
      }
      if (dialogSetter != null) dialogSetter(() {});
      if (mounted) setState(() {});
    } catch (e) {
      debugPrint('Error marking notifications read: $e');
    }
  }

  void _showNotificationPopup() {
    _isLoadingNotifications = true;
    _dialogSetter = null;
    final t = ref.read(localeProvider.notifier).translate;
    showDialog(
      context: context,
      barrierColor: Colors.black26,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) {
          // Trigger fetch only once per dialog open, deferred to avoid setState-during-build
          if (_dialogSetter == null) {
            _dialogSetter = setDialogState;
            final now = DateTime.now();
            final shouldFetch =
                _lastNotificationPopupFetchAt == null ||
                now.difference(_lastNotificationPopupFetchAt!) >
                    const Duration(seconds: 8);
            if (shouldFetch) {
              _lastNotificationPopupFetchAt = now;
              Future.microtask(() => _fetchNotifications(setDialogState));
            } else {
              _isLoadingNotifications = false;
            }
          }
          return GestureDetector(
            onTap: () => Navigator.pop(ctx),
            behavior: HitTestBehavior.opaque,
            child: Stack(
              children: [
                Positioned(
                  top: MediaQuery.of(context).padding.top + 60,
                  right: 12,
                  child: GestureDetector(
                    onTap: () {}, // absorb taps on the popup itself
                    child: Material(
                      color: Colors.transparent,
                      child: Container(
                        width: MediaQuery.of(context).size.width * 0.88,
                        constraints: const BoxConstraints(maxHeight: 420),
                        decoration: BoxDecoration(
                          color: surfaceWhite,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.12),
                              blurRadius: 24,
                              offset: const Offset(0, 8),
                            ),
                            BoxShadow(
                              color: primaryBlue.withOpacity(0.06),
                              blurRadius: 40,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // Header
                            Padding(
                              padding: const EdgeInsets.fromLTRB(20, 16, 12, 0),
                              child: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        t('Notifications'),
                                        style: GoogleFonts.plusJakartaSans(
                                          fontSize: 17,
                                          fontWeight: FontWeight.w800,
                                          color: textPrimary,
                                        ),
                                      ),
                                      if (_unreadCount > 0) ...[
                                        const SizedBox(width: 8),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 8,
                                            vertical: 2,
                                          ),
                                          decoration: BoxDecoration(
                                            color: primaryBlue,
                                            borderRadius: BorderRadius.circular(
                                              100,
                                            ),
                                          ),
                                          child: Text(
                                            '$_unreadCount',
                                            style: GoogleFonts.plusJakartaSans(
                                              fontSize: 11,
                                              fontWeight: FontWeight.w700,
                                              color: Colors.white,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                  Row(
                                    children: [
                                      if (_unreadCount > 0)
                                        GestureDetector(
                                          onTap: () => _markNotificationsRead(
                                            setDialogState,
                                          ),
                                          child: Padding(
                                            padding: const EdgeInsets.all(8),
                                            child: Text(
                                              t('Mark all read'),
                                              style:
                                                  GoogleFonts.plusJakartaSans(
                                                    fontSize: 12,
                                                    fontWeight: FontWeight.w600,
                                                    color: primaryBlue,
                                                  ),
                                            ),
                                          ),
                                        ),
                                      IconButton(
                                        onPressed: () => Navigator.pop(ctx),
                                        icon: const Icon(
                                          Icons.close_rounded,
                                          size: 20,
                                          color: textMuted,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            const Divider(height: 1, color: borderLight),
                            // Content
                            _isLoadingNotifications
                                ? const Padding(
                                    padding: EdgeInsets.all(40),
                                    child: Center(
                                      child: CircularProgressIndicator(
                                        color: primaryBlue,
                                        strokeWidth: 2,
                                      ),
                                    ),
                                  )
                                : _notifications.isEmpty
                                ? Padding(
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 40,
                                    ),
                                    child: Column(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Container(
                                          width: 56,
                                          height: 56,
                                          decoration: BoxDecoration(
                                            color: primaryBlue.withOpacity(
                                              0.08,
                                            ),
                                            borderRadius: BorderRadius.circular(
                                              16,
                                            ),
                                          ),
                                          child: Icon(
                                            Icons.notifications_none_rounded,
                                            size: 28,
                                            color: primaryBlue.withOpacity(0.5),
                                          ),
                                        ),
                                        const SizedBox(height: 12),
                                        Text(
                                          t('No notifications yet'),
                                          style: GoogleFonts.plusJakartaSans(
                                            fontSize: 15,
                                            fontWeight: FontWeight.w600,
                                            color: textPrimary,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          t("You're all caught up!"),
                                          style: GoogleFonts.plusJakartaSans(
                                            fontSize: 13,
                                            color: textMuted,
                                          ),
                                        ),
                                      ],
                                    ),
                                  )
                                : Flexible(
                                    child: ListView.separated(
                                      shrinkWrap: true,
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 4,
                                      ),
                                      itemCount: _notifications.length,
                                      separatorBuilder: (_, __) =>
                                          const Divider(
                                            height: 1,
                                            color: borderLight,
                                            indent: 60,
                                          ),
                                      itemBuilder: (_, i) =>
                                          _buildNotificationItem(
                                            _notifications[i],
                                          ),
                                    ),
                                  ),
                            // Footer
                            if (_notifications.isNotEmpty) ...[
                              const Divider(height: 1, color: borderLight),
                              GestureDetector(
                                onTap: () {
                                  Navigator.pop(ctx);
                                  context.push('/notifications');
                                },
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 14,
                                  ),
                                  child: Text(
                                    t('View All Notifications'),
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: primaryBlue,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    ).then((_) => _dialogSetter = null);
  }

  Widget _buildNotificationItem(Map<String, dynamic> notification) {
    final isRead = notification['isRead'] == true;
    final type = notification['type']?.toString() ?? 'general';
    final createdAt = notification['createdAt']?.toString() ?? '';

    IconData icon;
    Color iconColor;
    Color iconBg;

    switch (type) {
      case 'payment_verified':
        icon = Icons.check_circle_rounded;
        iconColor = const Color(0xFF16A34A);
        iconBg = const Color(0xFFF0FDF4);
        break;
      case 'payment_rejected':
        icon = Icons.cancel_rounded;
        iconColor = const Color(0xFFEF4444);
        iconBg = const Color(0xFFFEF2F2);
        break;
      case 'order_update':
        icon = Icons.local_shipping_rounded;
        iconColor = const Color(0xFF2563EB);
        iconBg = const Color(0xFFEFF6FF);
        break;
      case 'negotiation_update':
        icon = Icons.handshake_rounded;
        iconColor = const Color(0xFFF59E0B);
        iconBg = const Color(0xFFFFFBEB);
        break;
      default:
        icon = Icons.notifications_rounded;
        iconColor = const Color(0xFF8B5CF6);
        iconBg = const Color(0xFFF5F3FF);
    }

    String timeAgo = '';
    if (createdAt.isNotEmpty) {
      try {
        final dt = DateTime.parse(createdAt);
        final diff = DateTime.now().difference(dt);
        if (diff.inMinutes < 1) {
          timeAgo = 'Just now';
        } else if (diff.inMinutes < 60) {
          timeAgo = '${diff.inMinutes}m ago';
        } else if (diff.inHours < 24) {
          timeAgo = '${diff.inHours}h ago';
        } else {
          timeAgo = '${diff.inDays}d ago';
        }
      } catch (_) {}
    }

    return Container(
      color: isRead ? Colors.transparent : primaryBlue.withOpacity(0.02),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: iconBg,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, size: 20, color: iconColor),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        notification['title'] ?? '',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 14,
                          fontWeight: isRead
                              ? FontWeight.w600
                              : FontWeight.w700,
                          color: textPrimary,
                        ),
                      ),
                    ),
                    if (!isRead)
                      Container(
                        width: 8,
                        height: 8,
                        margin: const EdgeInsets.only(left: 6),
                        decoration: const BoxDecoration(
                          color: primaryBlue,
                          shape: BoxShape.circle,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  notification['body'] ?? '',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 12,
                    color: textSecondary,
                    height: 1.4,
                  ),
                ),
                if (timeAgo.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    timeAgo,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 11,
                      color: textMuted,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _heroAutoRotateTimer?.cancel();
    _promoAutoRotateTimer?.cancel();
    _guestAuthPromptTimer?.cancel();
    _carouselController.dispose();
    _searchController.dispose();
    _searchFocusNode.dispose();
    _searchDebounce?.cancel();
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _addr1Ctrl.dispose();
    _cityCtrl.dispose();
    _stateCtrl.dispose();
    _pinCtrl.dispose();
    _couponCtrl.dispose();
    _promoBannerController.dispose();
    super.dispose();
  }

  bool get _isWholesaler {
    final auth = ref.read(authProvider);
    return auth.user?.isWholesaler == true;
  }

  String _getDisplayName(Map<String, dynamic> product, String currentLang) {
    final nameHindi = product['nameHindi']?.toString() ?? '';
    final nameEnglish = product['name']?.toString() ?? '';
    final productId =
        product['id']?.toString() ?? product['_id']?.toString() ?? '';

    if (currentLang == 'Hindi') {
      if (nameHindi.isNotEmpty) return nameHindi;

      if (nameEnglish.isNotEmpty && productId.isNotEmpty) {
        final syncKey = '$productId|$nameEnglish';
        if (!_pendingHindiSync.contains(syncKey) &&
            !_completedHindiSync.contains(syncKey)) {
          _pendingHindiSync.add(syncKey);
          Future.microtask(
            () => _triggerBackgroundTransliteration(
              productId,
              nameEnglish,
              syncKey,
            ),
          );
        }
      }
      return nameEnglish;
    }

    if (nameEnglish.isNotEmpty) {
      return nameEnglish.split(' ').map((word) {
        if (word.isEmpty) return word;
        return word[0].toUpperCase() + word.substring(1).toLowerCase();
      }).join(' ');
    }
    return nameEnglish;
  }

  Future<void> _triggerBackgroundTransliteration(
    String productId,
    String nameEnglish,
    String syncKey,
  ) async {
    if (productId.isEmpty || nameEnglish.isEmpty) {
      _pendingHindiSync.remove(syncKey);
      _completedHindiSync.add(syncKey);
      return;
    }

    // Avoid backend errors/noise for non-ObjectId placeholder IDs.
    if (!_mongoObjectIdPattern.hasMatch(productId)) {
      _pendingHindiSync.remove(syncKey);
      _completedHindiSync.add(syncKey);
      return;
    }

    try {
      final transliterated = await TransliterationService.transliterateToHindi(
        nameEnglish,
      );
      if (transliterated != nameEnglish) {
        await TransliterationService.syncHindiName(productId, transliterated);
      }
    } finally {
      _pendingHindiSync.remove(syncKey);
      _completedHindiSync.add(syncKey);
    }
  }

  List<Widget> get _bodyPages {
    if (_isWholesaler) {
      return [
        _buildHomeContent(),
        _buildSearchContent(),
        CategoriesScreen(
          onSearchTap: () => setState(() => _selectedNavIndex = 1),
          initialCategoryName: _requestedCategoryName,
        ),
        _buildCartContent(),
        _buildNegotiationsContent(),
        _buildProfileContent(),
      ];
    }
    return [
      _buildHomeContent(),
      _buildSearchContent(),
      CategoriesScreen(
        onSearchTap: () => setState(() => _selectedNavIndex = 1),
        initialCategoryName: _requestedCategoryName,
      ),
      _buildCartContent(),
      _buildProfileContent(),
    ];
  }

  @override
  Widget build(BuildContext context) {
    // Watch auth to rebuild when role changes
    ref.watch(authProvider);

    // Listen for role changes (e.g., from buyer to wholesaler after approval)
    // to refresh the offers and other role-dependent data without manual refresh.
    ref.listen<AuthState>(authProvider, (previous, next) {
      final oldRole = previous?.user?.role;
      final newRole = next.user?.role;

      if (oldRole != null && oldRole != newRole) {
        debugPrint(
          '[Auth] Role changed from $oldRole to $newRole, auto-refreshing data...',
        );
        // Use Future.microtask to avoid calling setState during build cycle
        Future.microtask(() => _handleRefresh());
      }
    });

    final pages = _bodyPages;
    // Clamp nav index to valid range
    if (_selectedNavIndex >= pages.length) {
      _selectedNavIndex = 0;
    }
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        
        // If not on Home tab, go back to Home tab
        if (_selectedNavIndex > 0) {
          setState(() {
            _selectedNavIndex = 0;
          });
          return;
        }
        
        // If already on Home tab, allow the app to exit
        SystemNavigator.pop();
      },
      child: AnnotatedRegion<SystemUiOverlayStyle>(
        value: SystemUiOverlayStyle.dark.copyWith(
          statusBarColor: Colors.transparent,
        ),
        child: Scaffold(
          backgroundColor: backgroundWhite,
          body: SafeArea(
            child: IndexedStack(index: _selectedNavIndex, children: pages),
          ),
          bottomNavigationBar: _buildBottomNav(),
        ),
      ),
    );
  }

  Widget _buildHomeContent() {
    return Column(
      children: [
        _buildAppBar(),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _handleRefresh,
            color: primaryBlue,
            backgroundColor: Colors.white,
            edgeOffset: 20,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(
                parent: BouncingScrollPhysics(),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHomeSearchBar(),
                  const SizedBox(height: 8),
                  _buildCarousel(),
                  const SizedBox(height: 24),
                  _buildPartnershipStrip(),
                  const SizedBox(height: 16),
                  _buildOfferSection(),
                  const SizedBox(height: 8),
                  _buildCategorySection(),
                  const SizedBox(height: 8),
                  _buildBrandsSection(),
                  const SizedBox(height: 8),
                  _buildProductsSection(
                    ref
                        .read(localeProvider.notifier)
                        .translate('Popular Products'),
                    true,
                  ),
                  const SizedBox(height: 8),
                  _buildProductsSection(
                    ref.read(localeProvider.notifier).translate('Hot Deals'),
                    false,
                  ),
                  const SizedBox(height: 8),
                  _buildTrustStrip(),
                  const SizedBox(height: 32),
                  if (_promoBanners.isNotEmpty) ...[
                    _buildPromoBannerCarousel(),
                    const SizedBox(height: 32),
                  ],
                  _buildReferralBanner(),
                  const SizedBox(height: 32),
                  _buildWhyBuySection(),
                  const SizedBox(height: 32),
                  _buildReviewSection(),
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTrustStrip() {
    final t = ref.read(localeProvider.notifier).translate;
    return _TrustBadgeMarquee(
      isActive: _selectedNavIndex == 0,
      items: [
        {'icon': Icons.local_shipping_rounded, 'text': t('Pan-India Delivery')},
        {'icon': Icons.verified_user_rounded, 'text': t('Certified Products')},
        {'icon': Icons.support_agent_rounded, 'text': t('24/7 Expert Support')},
        {'icon': Icons.local_offer_rounded, 'text': t('Bulk Sale Active')},
      ],
    );
  }

  Widget _buildHomeSearchBar() {
    final t = ref.read(localeProvider.notifier).translate;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: GestureDetector(
        onTap: () => setState(() => _selectedNavIndex = 1),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: borderLight),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.02),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              const Icon(Icons.search_rounded, color: textMuted, size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  t('Search products, brands...'),
                  style: GoogleFonts.plusJakartaSans(
                    color: textMuted,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOfferSection() {
    final t = ref.read(localeProvider.notifier).translate;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                t('Exclusive Offers'),
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: textPrimary,
                ),
              ),
              Text(
                t('View Deals'),
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: primaryBlue,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        // Show shimmer while loading
        if (_isLoadingOffers)
          Padding(
            padding: const EdgeInsets.only(left: 20, bottom: 8),
            child: Shimmer.fromColors(
              baseColor: Colors.grey[300]!,
              highlightColor: Colors.grey[100]!,
              child: Row(
                children: List.generate(
                  3,
                  (index) => Container(
                    width: 160,
                    height: 100,
                    margin: const EdgeInsets.only(right: 12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                ),
              ),
            ),
          )
        // Show empty state if no offers
        else if (_offers.isEmpty)
          const SizedBox.shrink()
        // Show offers
        else
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.only(left: 20, bottom: 8),
            physics: const BouncingScrollPhysics(),
            child: Row(
              children: _offers.map((offer) {
                final index = _offers.indexOf(offer);
                final colors = [
                  const Color(0xFF3B82F6),
                  const Color(0xFF10B981),
                  const Color(0xFF8B5CF6),
                  const Color(0xFFF59E0B),
                ];
                final icons = [
                  Icons.water_drop_rounded,
                  Icons.grass_rounded,
                  Icons.settings_rounded,
                  Icons.tag_rounded,
                ];

                return _buildModernOfferCard(
                  offer['title'] ?? '',
                  offer['discount'] ?? '',
                  colors[index % colors.length],
                  icons[index % icons.length],
                  couponCode: offer['code']?.toString(),
                  rule:
                      offer['rule']?.toString() ??
                      'Apply during checkout to unlock offer',
                );
              }).toList(),
            ),
          ),
      ],
    );
  }

  Widget _buildModernOfferCard(
    String title,
    String discount,
    Color color,
    IconData icon, {
    String? couponCode,
    String? rule,
  }) {
    final t = ref.read(localeProvider.notifier).translate;
    const double cardW = 145;
    const double cardH = 205;
    const double dashedH = 10;
    const double topH = cardH * 0.65 - dashedH / 2;
    const double botH = cardH * 0.35 - dashedH / 2;

    // Derive a slightly lighter shade for gradient
    final Color colorLight = Color.lerp(Colors.white, color, 0.6) ?? color;

    return Container(
      width: cardW,
      height: cardH,
      margin: const EdgeInsets.only(right: 16),
      child: Stack(
        children: [
          // Drop shadow
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(22),
                boxShadow: [
                  BoxShadow(
                    color: color.withOpacity(0.45),
                    blurRadius: 20,
                    spreadRadius: 2,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
            ),
          ),
          // Clipped ticket shape
          ClipPath(
            clipper: const _TicketClipper(),
            child: SizedBox(
              width: cardW,
              height: cardH,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // TOP: gradient + starburst
                  SizedBox(
                    width: cardW,
                    height: topH,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [colorLight, color],
                        ),
                      ),
                      child: Stack(
                        children: [
                          // Starburst rays
                          Positioned.fill(
                            child: CustomPaint(painter: _StarburstPainter()),
                          ),
                          // Faint background icon
                          Positioned(
                            top: 4,
                            right: 4,
                            child: Opacity(
                              opacity: 0.18,
                              child: Icon(icon, size: 60, color: Colors.white),
                            ),
                          ),
                          // Title + big discount
                          Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  title.toUpperCase(),
                                  textAlign: TextAlign.center,
                                  style: GoogleFonts.plusJakartaSans(
                                    color: Colors.white.withOpacity(0.92),
                                    fontSize: 8.5,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 1.8,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                FittedBox(
                                  fit: BoxFit.scaleDown,
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                    ),
                                    child: Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        if (discount.contains('₹'))
                                          Padding(
                                            padding: const EdgeInsets.only(
                                              top: 5,
                                              right: 2,
                                            ),
                                            child: Text(
                                              '₹',
                                              style:
                                                  GoogleFonts.plusJakartaSans(
                                                    color: Colors.white,
                                                    fontSize: 22,
                                                    fontWeight: FontWeight.w900,
                                                    height: 1.0,
                                                  ),
                                            ),
                                          ),
                                        Text(
                                          discount
                                              .replaceAll('%', '')
                                              .replaceAll('₹', ''),
                                          style: GoogleFonts.plusJakartaSans(
                                            color: Colors.white,
                                            fontSize: 54,
                                            fontWeight: FontWeight.w900,
                                            height: 0.88,
                                            letterSpacing: -2,
                                          ),
                                        ),
                                        if (discount.contains('%'))
                                          Padding(
                                            padding: const EdgeInsets.only(
                                              top: 5,
                                            ),
                                            child: Text(
                                              '%',
                                              style:
                                                  GoogleFonts.plusJakartaSans(
                                                    color: Colors.white,
                                                    fontSize: 22,
                                                    fontWeight: FontWeight.w900,
                                                    height: 1.0,
                                                  ),
                                            ),
                                          ),
                                      ],
                                    ),
                                  ),
                                ),
                                Text(
                                  t('OFF'),
                                  style: GoogleFonts.plusJakartaSans(
                                    color: Colors.white,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  // DASHED SEPARATOR
                  SizedBox(
                    width: cardW,
                    height: dashedH,
                    child: const ColoredBox(
                      color: Colors.white,
                      child: CustomPaint(painter: _DashedLinePainter()),
                    ),
                  ),
                  // BOTTOM: white + redeem button
                  SizedBox(
                    width: cardW,
                    height: botH,
                    child: ColoredBox(
                      color: Colors.white,
                      child: Center(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 14),
                          child: SizedBox(
                            width: double.infinity,
                            height: 36,
                            child: DecoratedBox(
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: Colors.grey.shade300,
                                  width: 1.5,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.06),
                                    blurRadius: 8,
                                    offset: const Offset(0, 3),
                                  ),
                                ],
                              ),
                              child: GestureDetector(
                                onTap: () => _redeemOffer(
                                  code: (couponCode?.trim().isNotEmpty ?? false)
                                      ? couponCode!.trim()
                                      : title.replaceAll(' ', '').toUpperCase(),
                                  title: title,
                                  rule:
                                      rule ??
                                      'Apply during checkout to unlock this offer',
                                ),
                                child: Center(
                                  child: Text(
                                    t('REDEEM'),
                                    style: GoogleFonts.plusJakartaSans(
                                      color: color,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 2.5,
                                    ),
                                  ),
                                ),
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
        ],
      ),
    );
  }

  Widget _buildPartnershipStrip() {
    final items = <Map<String, dynamic>>[
      {'image': 'assets/images/oxon logo.jpeg', 'label': 'OXON'},
      {'icon': Icons.eco_outlined, 'label': 'EcoTech'},
      {'icon': Icons.bolt_rounded, 'label': 'Kargill'},
      {'icon': Icons.layers_outlined, 'label': 'AgriPlus'},
      {'icon': Icons.water_drop_outlined, 'label': 'V-Flow'},
      {'icon': Icons.build_outlined, 'label': 'HeavyDuty'},
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: const Color(0xFFF5F7FB),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: borderLight),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Text(
                'AUTHORIZED REPRESENTATIVE & PARTNERSHIPS',
                textAlign: TextAlign.center,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 3,
                  color: textMuted,
                ),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              height: 42,
              child: _PartnershipMarquee(
                items: items,
                isActive: _selectedNavIndex == 0,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _redeemOffer({
    required String code,
    required String title,
    required String rule,
  }) async {
    final user = ref.read(authProvider).user;
    final userKey = user?.id.isNotEmpty == true
        ? user!.id
        : (user?.phone ?? user?.email ?? 'guest');
    await RedeemedCouponService.redeemCoupon(
      userKey: userKey,
      code: code,
      title: title,
      rule: rule,
    );
    if (!mounted) return;

    // Copy code to clipboard
    await Clipboard.setData(ClipboardData(text: code));

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.white, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                '$code copied! Use it in cart or find it in "My Coupons" in Profile.',
                style: GoogleFonts.plusJakartaSans(
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
        backgroundColor: Colors.green.shade600,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  String _fmtCatName(String name) {
    if (name.isEmpty) return '';
    // Replace hyphens with spaces and capitalize words
    final parts = name.replaceAll('-', ' ').split(' ');
    return parts.map((word) {
      if (word.isEmpty) return '';
      return word[0].toUpperCase() + word.substring(1).toLowerCase();
    }).join(' ');
  }

  // Skeleton loader for categories
  Widget _buildCategorySkeleton() {
    return SizedBox(
      height: 145,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.only(left: 16, right: 8),
        itemCount: 5,
        itemBuilder: (context, index) {
          return Container(
            width: 100,
            margin: const EdgeInsets.only(right: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              children: [
                Expanded(
                  child: Container(
                    decoration: const BoxDecoration(
                      color: Color(0xFFE2E8F0),
                      borderRadius: BorderRadius.vertical(
                        top: Radius.circular(20),
                      ),
                    ),
                  ),
                ),
                Container(
                  height: 12,
                  margin: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                Container(
                  height: 12,
                  width: 60,
                  margin: const EdgeInsets.only(bottom: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildCategorySection() {
    final t = ref.read(localeProvider.notifier).translate;

    // Use dynamic data if available, otherwise show empty state
    final categories = _categoryData.isNotEmpty ? _categoryData : [];

    // Show empty state if no categories
    if (categories.isEmpty && !_isLoadingCategories) {
      return const SizedBox.shrink();
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            primaryBlue.withOpacity(0.25),
            primaryBlue.withOpacity(0.08),
            Colors.transparent,
          ],
          stops: const [0.0, 0.45, 1.0],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      t('Categories'),
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: textPrimary,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      height: 3,
                      width: 40,
                      decoration: BoxDecoration(
                        color: primaryBlue,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ],
                ),
                GestureDetector(
                  onTap: () => setState(() => _selectedNavIndex = 2),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: borderLight),
                    ),
                    child: Row(
                      children: [
                        Text(
                          t('See All'),
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: primaryBlue,
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(
                          Icons.arrow_forward_ios_rounded,
                          size: 10,
                          color: primaryBlue,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Show skeleton while loading
          if (_isLoadingCategories)
            _buildCategorySkeleton()
          else
            SizedBox(
              height: 145,
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.only(left: 16, right: 8, bottom: 4),
                physics: const BouncingScrollPhysics(),
                child: Row(
                  children: categories.map((cat) {
                    return GestureDetector(
                      onTap: () {
                        final name = cat['name']?.toString() ?? '';
                        setState(() {
                          _requestedCategoryName = name;
                          _selectedNavIndex = 2;
                        });
                      },
                      child: Container(
                        width: 100,
                        margin: const EdgeInsets.only(right: 12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.07),
                              blurRadius: 10,
                              spreadRadius: 0,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Expanded(
                              child: ClipRRect(
                                borderRadius: const BorderRadius.vertical(
                                  top: Radius.circular(20),
                                ),
                                child:
                                    (cat['image']?.toString() ?? '').isNotEmpty
                                        ? Padding(
                                          padding: const EdgeInsets.all(8.0),
                                          child: AppImage(
                                            imageUrl: cat['image']!.toString(),
                                            blurHash: cat['blurHash']?.toString(),
                                            category: cat['name']?.toString() ?? '',
                                            name: cat['name']?.toString() ?? '',
                                            fit: BoxFit.contain,
                                          ),
                                        )
                                        : Container(
                                          color: const Color(0xFFF1F5F9),
                                          child: const Icon(
                                            Icons.category_outlined,
                                            color: textMuted,
                                          ),
                                        ),
                              ),
                            ),
                            Container(
                              height: 40,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: Colors.grey[700],
                                borderRadius: const BorderRadius.vertical(
                                  bottom: Radius.circular(20),
                                ),
                              ),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                              ),
                              child: Text(
                                _fmtCatName(cat['name']?.toString() ?? ''),
                                textAlign: TextAlign.center,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white,
                                  height: 1.1,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSearchContent() {
    final t = ref.read(localeProvider.notifier).translate;
    final popularCategories = [
      t('🔥 Trending'),
      t('Tractors'),
      t('Harvesters'),
      t('Irrigation'),
      t('Seeds'),
      t('Fertilizers'),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                t('Explore'),
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: textPrimary,
                  letterSpacing: -0.3,
                ),
              ),
            ],
          ),
        ),
        // Search Bar
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
          child: Container(
            height: 56,
            decoration: BoxDecoration(
              color: surfaceWhite,
              borderRadius: BorderRadius.circular(100),
              boxShadow: [
                BoxShadow(
                  color: primaryBlue.withOpacity(0.06),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                const SizedBox(width: 20),
                HugeIcon(
                  icon: HugeIcons.strokeRoundedSearch02,
                  color: primaryBlue,
                  size: 24,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    focusNode: _searchFocusNode,
                    onChanged: (value) {
                      _searchDebounce?.cancel();
                      if (value.trim().isEmpty) {
                        setState(() {
                          _searchResults = [];
                          _isSearching = false;
                          _searchQuery = '';
                        });
                        return;
                      }
                      _searchDebounce = Timer(
                        const Duration(milliseconds: 400),
                        () {
                          _searchProducts(value);
                        },
                      );
                    },
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 16,
                      fontWeight: FontWeight.w400,
                      color: textPrimary,
                    ),
                    decoration: InputDecoration(
                      hintText: t('Products, brands, equipment...'),
                      hintStyle: GoogleFonts.plusJakartaSans(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: textMuted,
                      ),
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.zero,
                    ),
                  ),
                ),
                if (_searchQuery.isNotEmpty)
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Always show filter button when searching so users can apply filters
                      GestureDetector(
                        onTap: _showFilterSheet,
                        child: Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: Stack(
                            clipBehavior: Clip.none,
                            children: [
                              HugeIcon(
                                icon: HugeIcons.strokeRoundedFilterHorizontal,
                                color:
                                    (_selectedFilterCategory != null ||
                                        _selectedFilterBrand != null)
                                    ? primaryBlue
                                    : textMuted,
                                size: 22,
                              ),
                              if (_selectedFilterCategory != null ||
                                  _selectedFilterBrand != null)
                                Positioned(
                                  top: -2,
                                  right: -4,
                                  child: Container(
                                    width: 8,
                                    height: 8,
                                    decoration: const BoxDecoration(
                                      color: primaryBlue,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ),
                      GestureDetector(
                        onTap: () {
                          _searchController.clear();
                          setState(() {
                            _searchResults = [];
                            _isSearching = false;
                            _searchQuery = '';
                          });
                        },
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: borderLight,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.close,
                              size: 14,
                              color: textSecondary,
                            ),
                          ),
                        ),
                      ),
                    ],
                  )
                else
                  GestureDetector(
                    onTap: _showFilterSheet,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Stack(
                        clipBehavior: Clip.none,
                        children: [
                          HugeIcon(
                            icon: HugeIcons.strokeRoundedFilterHorizontal,
                            color:
                                (_selectedFilterCategory != null ||
                                    _selectedFilterBrand != null)
                                ? primaryBlue
                                : textMuted,
                            size: 22,
                          ),
                          if (_selectedFilterCategory != null ||
                              _selectedFilterBrand != null)
                            Positioned(
                              top: -2,
                              right: -4,
                              child: Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: primaryBlue,
                                  shape: BoxShape.circle,
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
        ),
        // Content
        Expanded(
          child: _isSearching
              ? const Center(
                  child: CircularProgressIndicator(color: primaryBlue),
                )
              : _searchQuery.isNotEmpty
              ? _searchResults.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.search_off_rounded,
                              size: 48,
                              color: textMuted,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              t('No results found'),
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: textPrimary,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              t('Try a different search term'),
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 13,
                                color: textMuted,
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                        itemCount: _searchResults.length,
                        itemBuilder: (context, index) =>
                            _buildSuggestionCard(_searchResults[index]),
                      )
              : SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Recent Searches
                      if (_recentSearches.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    t('Recent Searches'),
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w700,
                                      color: textPrimary,
                                    ),
                                  ),
                                  GestureDetector(
                                    onTap: () =>
                                        setState(() => _recentSearches.clear()),
                                    child: Text(
                                      t('CLEAR ALL'),
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w700,
                                        color: primaryBlue,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              ...List.generate(
                                _recentSearches.length,
                                (i) => Padding(
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 6,
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 40,
                                        height: 40,
                                        decoration: BoxDecoration(
                                          color: surfaceWhite,
                                          shape: BoxShape.circle,
                                          boxShadow: [
                                            BoxShadow(
                                              color: Colors.black.withOpacity(
                                                0.03,
                                              ),
                                              blurRadius: 4,
                                              offset: const Offset(0, 2),
                                            ),
                                          ],
                                        ),
                                        child: Icon(
                                          Icons.history_rounded,
                                          color: textMuted,
                                          size: 20,
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: GestureDetector(
                                          onTap: () {
                                            _searchController.text =
                                                _recentSearches[i];
                                            setState(
                                              () => _searchQuery =
                                                  _recentSearches[i],
                                            );
                                            _searchProducts(_recentSearches[i]);
                                          },
                                          child: Text(
                                            _recentSearches[i],
                                            style: GoogleFonts.plusJakartaSans(
                                              fontSize: 16,
                                              fontWeight: FontWeight.w400,
                                              color: textPrimary,
                                            ),
                                          ),
                                        ),
                                      ),
                                      GestureDetector(
                                        onTap: () => setState(
                                          () => _recentSearches.removeAt(i),
                                        ),
                                        child: Padding(
                                          padding: const EdgeInsets.all(8),
                                          child: Icon(
                                            Icons.close_rounded,
                                            color: textMuted,
                                            size: 20,
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
                      // Popular Searches
                      Padding(
                        padding: const EdgeInsets.only(top: 24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                              ),
                              child: Text(
                                t('Popular Searches'),
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                  color: textPrimary,
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                            SizedBox(
                              height: 44,
                              child: ListView.separated(
                                scrollDirection: Axis.horizontal,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                ),
                                itemCount: popularCategories.length,
                                separatorBuilder: (_, __) =>
                                    const SizedBox(width: 10),
                                itemBuilder: (context, index) {
                                  final isFirst = index == 0;
                                  return GestureDetector(
                                    onTap: () {
                                      final term = popularCategories[index]
                                          .replaceAll('🔥 ', '');
                                      _searchController.text = term;
                                      setState(() => _searchQuery = term);
                                      _searchProducts(term);
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 20,
                                      ),
                                      decoration: BoxDecoration(
                                        color: isFirst
                                            ? primaryBlue
                                            : surfaceWhite,
                                        borderRadius: BorderRadius.circular(
                                          100,
                                        ),
                                        border: Border.all(
                                          color: isFirst
                                              ? primaryBlue
                                              : borderLight,
                                        ),
                                        boxShadow: isFirst
                                            ? [
                                                BoxShadow(
                                                  color: primaryBlue
                                                      .withOpacity(0.3),
                                                  blurRadius: 12,
                                                  offset: const Offset(0, 4),
                                                ),
                                              ]
                                            : null,
                                      ),
                                      child: Center(
                                        child: Text(
                                          popularCategories[index],
                                          style: GoogleFonts.plusJakartaSans(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w700,
                                            color: isFirst
                                                ? Colors.white
                                                : textPrimary,
                                          ),
                                        ),
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ),
                          ],
                        ),
                      ),
                      // Top Suggestions
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 32, 16, 100),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  t('Top Suggestions'),
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w700,
                                    color: textPrimary,
                                  ),
                                ),
                                Text(
                                  t('Based on your interest'),
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w400,
                                    color: textMuted,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            ..._products
                                .take(5)
                                .map(
                                  (product) => _buildSuggestionCard(product),
                                ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildSuggestionCard(Map<String, dynamic> product) {
    final t = ref.read(localeProvider.notifier).translate;
    final currentLang = ref.read(localeProvider);
    final heroTag = 'search-product-${product['id']}';
    final hasOriginalPrice =
        product['originalPrice'] != null &&
        product['originalPrice'] != product['price'] &&
        product['originalPrice'] > 0;

    return GestureDetector(
      onTap: () => context.push(
        '/product/${product['id']}',
        extra: {'heroTag': heroTag},
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: surfaceWhite,
          borderRadius: BorderRadius.circular(4),
          border: Border.all(color: borderLight.withOpacity(0.7)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.015),
              blurRadius: 4,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: Row(
          children: [
            Hero(
              tag: heroTag,
              child: Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(4),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child:
                      (product['image']?.toString() ?? '').isNotEmpty
                      ? AppImage(
                          imageUrl: product['image'].toString(),
                          blurHash: product['blurHash']?.toString(),
                          category: product['category']?.toString() ?? '',
                          name: product['name']?.toString() ?? '',
                          width: 100,
                          height: 100,
                          fit: BoxFit.contain,
                        )
                      : ProductImagePlaceholder(
                          category: product['category']?.toString() ?? '',
                          name: product['name']?.toString() ?? '',
                        ),
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          _getDisplayName(product, currentLang),
                          style: GoogleFonts.outfit(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (product['rating'] != null)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDCFCE7),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.star_rounded,
                                size: 12,
                                color: Color(0xFF15803D),
                              ),
                              const SizedBox(width: 2),
                              Text(
                                '${product['rating']}',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: const Color(0xFF15803D),
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  const SizedBox(height: 4),
                  // Live Purchase Counter (list view)
                  Builder(
                    builder: (context) {
                      final pMin =
                          (product['purchaseCountMin'] as num?)?.toInt() ?? 0;
                      final pMax =
                          (product['purchaseCountMax'] as num?)?.toInt() ?? 0;
                      if (pMin <= 0 && pMax <= 0) {
                        return const SizedBox.shrink();
                      }
                      final effectiveMax = pMax > pMin ? pMax : pMin;
                      final dayOfYear = DateTime.now()
                          .difference(DateTime(DateTime.now().year))
                          .inDays;
                      final productIdHash = product['id']
                          .toString()
                          .hashCode
                          .abs();
                      final seed = productIdHash + dayOfYear;
                      final range = effectiveMax - pMin;
                      final count = range > 0
                          ? pMin + (seed % (range + 1))
                          : pMin;
                      return Padding(
                        padding: const EdgeInsets.only(top: 4, bottom: 2),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.local_fire_department_rounded,
                              size: 11,
                              color: Color(0xFFEF4444),
                            ),
                            const SizedBox(width: 3),
                            Flexible(
                              child: Text(
                                '$count sold in 24hrs',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFFEF4444),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                  if ((product['brand'] ?? '').toString().isNotEmpty)
                    Text(
                      product['brand'],
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 12,
                        fontWeight: FontWeight.w400,
                        color: textMuted,
                      ),
                    ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Text(
                            '₹${_formatPrice(product['price'] ?? 0)}',
                            style: GoogleFonts.montserrat(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: textPrimary,
                            ),
                          ),
                          if (hasOriginalPrice) ...[
                            const SizedBox(width: 6),
                            Text(
                              '₹${_formatPrice(product['originalPrice'])}',
                              style: GoogleFonts.montserrat(
                                fontSize: 11,
                                fontWeight: FontWeight.w400,
                                color: const Color(0xFFEF4444),
                                decoration: TextDecoration.lineThrough,
                              ),
                            ),
                          ],
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: primaryBlue.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          t('View'),
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: primaryBlue,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCartContent() {
    final cart = ref.watch(cartProvider);
    final t = ref.read(localeProvider.notifier).translate;
    final hasActiveCoupon = _hasActiveAppliedCoupon(cart);
    final isCouponLocked =
        _appliedCouponCode != null &&
        _normalizedCouponInput == _appliedCouponCode;
    final couponDiscount = hasActiveCoupon ? _appliedCouponDiscount : 0.0;
    final payableTotal = math
        .max(cart.grandTotal - couponDiscount, 0)
        .toDouble();
    return Column(
      children: [
        // Header
        Container(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          color: backgroundWhite,
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    t('My Cart'),
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: textPrimary,
                      letterSpacing: -0.5,
                    ),
                  ),
                  Row(
                    children: [
                      if (cart.itemCount > 0)
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
                            t(
                              '${cart.itemCount} ${cart.itemCount == 1 ? 'item' : 'items'}',
                            ),
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: primaryBlue,
                            ),
                          ),
                        ),
                      if (cart.items.isNotEmpty) ...[
                        const SizedBox(width: 8),
                        GestureDetector(
                          onTap: () =>
                              ref.read(cartProvider.notifier).clearCart(),
                          child: Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              color: surfaceWhite,
                              shape: BoxShape.circle,
                              border: Border.all(color: borderLight),
                            ),
                            child: Center(
                              child: HugeIcon(
                                icon: HugeIcons.strokeRoundedDelete02,
                                color: textMuted,
                                size: 18,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
              if (cart.items.isNotEmpty) ...[
                const SizedBox(height: 10),
                GestureDetector(
                  onTap: () => _openCartAddressBottomSheet(),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: surfaceWhite,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: borderLight),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.location_on_outlined, size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _addr1Ctrl.text.trim().isEmpty
                                ? t('Add Shipping Details')
                                : '${_nameCtrl.text.trim()}, ${_addr1Ctrl.text.trim()}, ${_cityCtrl.text.trim()}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: textPrimary,
                            ),
                          ),
                        ),
                        Text(
                          _addr1Ctrl.text.trim().isEmpty ? t('Add') : t('Edit'),
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: primaryBlue,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
        Expanded(
          child: cart.items.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          color: primaryBlue.withOpacity(0.06),
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: HugeIcon(
                            icon: HugeIcons.strokeRoundedShoppingCart01,
                            color: primaryBlue.withOpacity(0.4),
                            size: 48,
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        t('Your cart is empty'),
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: textPrimary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        t('Discover products and add them here'),
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 14,
                          color: textSecondary,
                        ),
                      ),
                      const SizedBox(height: 32),
                      GestureDetector(
                        onTap: () => setState(() => _selectedNavIndex = 0),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 28,
                            vertical: 14,
                          ),
                          decoration: BoxDecoration(
                            color: primaryBlue,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: primaryBlue.withOpacity(0.25),
                                blurRadius: 12,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Text(
                            t('Browse Products'),
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                  itemCount: cart.items.length,
                  itemBuilder: (context, index) {
                    final item = cart.items[index];
                    return Dismissible(
                      key: Key(item.productId),
                      direction: DismissDirection.endToStart,
                      onDismissed: (_) =>
                          _removeCartItemAndRefreshCoupon(item.productId),
                      background: Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEE2E2),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        alignment: Alignment.centerRight,
                        padding: const EdgeInsets.only(right: 24),
                        child: const Icon(
                          Icons.delete_outline_rounded,
                          color: Color(0xFFEF4444),
                          size: 24,
                        ),
                      ),
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: surfaceWhite,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: borderLight.withOpacity(0.5),
                          ),
                        ),
                        child: Row(
                          children: [
                            // Product Image
                            ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child:
                                  item.image != null && item.image!.isNotEmpty
                                  ? CachedNetworkImage(
                                      imageUrl: item.image!,
                                      width: 80,
                                      height: 80,
                                      fit: BoxFit.cover,
                                      placeholder: (_, __) => Container(
                                        width: 80,
                                        height: 80,
                                        color: const Color(0xFFF1F5F9),
                                      ),
                                      errorWidget: (_, __, ___) => Container(
                                        width: 80,
                                        height: 80,
                                        color: const Color(0xFFF1F5F9),
                                        child: Center(
                                          child: HugeIcon(
                                            icon:
                                                HugeIcons.strokeRoundedImage01,
                                            color: textMuted,
                                            size: 24,
                                          ),
                                        ),
                                      ),
                                    )
                                  : Container(
                                      width: 80,
                                      height: 80,
                                      color: const Color(0xFFF1F5F9),
                                      child: Center(
                                        child: HugeIcon(
                                          icon: HugeIcons.strokeRoundedImage01,
                                          color: textMuted,
                                          size: 24,
                                        ),
                                      ),
                                    ),
                            ),
                            const SizedBox(width: 12),
                            // Product Details
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.name,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: textPrimary,
                                      height: 1.2,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Text(
                                        '₹${_formatPrice(item.price)}',
                                        style: GoogleFonts.plusJakartaSans(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w700,
                                          color: primaryBlue,
                                        ),
                                      ),
                                      if (item.mrp != null &&
                                          item.mrp! > item.price) ...[
                                        const SizedBox(width: 6),
                                        Text(
                                          '₹${_formatPrice(item.mrp!)}',
                                          style: GoogleFonts.plusJakartaSans(
                                            fontSize: 12,
                                            color: const Color(0xFFEF4444),
                                            decoration:
                                                TextDecoration.lineThrough,
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  // Quantity Controls
                                  Container(
                                    height: 32,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF1F5F9),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        GestureDetector(
                                          onTap: () =>
                                              _updateCartQtyAndRefreshCoupon(
                                                item.productId,
                                                item.quantity - 1,
                                              ),
                                          child: Container(
                                            width: 32,
                                            height: 32,
                                            decoration: BoxDecoration(
                                              color: surfaceWhite,
                                              borderRadius:
                                                  BorderRadius.circular(8),
                                              border: Border.all(
                                                color: borderLight,
                                              ),
                                            ),
                                            alignment: Alignment.center,
                                            child: Icon(
                                              Icons.remove,
                                              size: 16,
                                              color: item.quantity > 1
                                                  ? textPrimary
                                                  : textMuted,
                                            ),
                                          ),
                                        ),
                                        Container(
                                          width: 36,
                                          alignment: Alignment.center,
                                          child: Text(
                                            '${item.quantity}',
                                            style: GoogleFonts.plusJakartaSans(
                                              fontSize: 14,
                                              fontWeight: FontWeight.w700,
                                              color: textPrimary,
                                            ),
                                          ),
                                        ),
                                        GestureDetector(
                                          onTap: () =>
                                              _updateCartQtyAndRefreshCoupon(
                                                item.productId,
                                                item.quantity + 1,
                                              ),
                                          child: Container(
                                            width: 32,
                                            height: 32,
                                            decoration: BoxDecoration(
                                              color: primaryBlue,
                                              borderRadius:
                                                  BorderRadius.circular(8),
                                            ),
                                            alignment: Alignment.center,
                                            child: const Icon(
                                              Icons.add,
                                              size: 16,
                                              color: Colors.white,
                                            ),
                                          ),
                                        ),
                                      ],
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
        // Price Summary & Checkout
        if (cart.items.isNotEmpty)
          Container(
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
            decoration: BoxDecoration(
              color: surfaceWhite,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(24),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.06),
                  blurRadius: 16,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: SafeArea(
              child: Column(
                children: [
                  // Order Summary
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              t('Subtotal'),
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 14,
                                color: textSecondary,
                              ),
                            ),
                            Text(
                              '₹${_formatPrice(cart.subtotal)}',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: textPrimary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              t('Delivery'),
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 14,
                                color: textSecondary,
                              ),
                            ),
                            Text(
                              '₹${_formatPrice(cart.deliveryFee)}',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: textPrimary,
                              ),
                            ),
                          ],
                        ),
                        if (hasActiveCoupon) ...[
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                '${t('Coupon')} (${_appliedCouponCode ?? ''})',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 14,
                                  color: const Color(0xFF16A34A),
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              Text(
                                '-\u20B9${_formatPrice(couponDiscount)}',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFF16A34A),
                                ),
                              ),
                            ],
                          ),
                        ],
                        const SizedBox(height: 12),
                        Container(height: 1, color: borderLight),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              hasActiveCoupon ? t('Payable Total') : t('Total'),
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: textPrimary,
                              ),
                            ),
                            Text(
                              '₹${_formatPrice(payableTotal)}',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                                color: primaryBlue,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _couponCtrl,
                          enabled: !isCouponLocked && !_isApplyingCoupon,
                          textCapitalization: TextCapitalization.characters,
                          inputFormatters: [
                            FilteringTextInputFormatter.allow(
                              RegExp(r'[a-zA-Z0-9_-]'),
                            ),
                          ],
                          onChanged: (_) {
                            if (_appliedCouponCode != null &&
                                _normalizedCouponInput != _appliedCouponCode) {
                              setState(() => _clearAppliedCouponPreview());
                            }
                          },
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                          decoration: InputDecoration(
                            labelText: t('Coupon / Affiliate Code'),
                            hintText: t('Enter coupon or affiliate code'),
                            labelStyle: GoogleFonts.plusJakartaSans(
                              fontSize: 13,
                              color: textSecondary,
                            ),
                            hintStyle: GoogleFonts.plusJakartaSans(
                              fontSize: 13,
                              color: textMuted,
                            ),
                            filled: true,
                            fillColor: const Color(0xFFF8FAFC),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 10,
                            ),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                              borderSide: BorderSide(color: borderLight),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                              borderSide: BorderSide(color: borderLight),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                              borderSide: BorderSide(
                                color: primaryBlue,
                                width: 1.5,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox(
                        height: 44,
                        child: ElevatedButton(
                          onPressed: _isApplyingCoupon || isCouponLocked
                              ? null
                              : _applyCouponPreview,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: primaryBlue,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                            padding: const EdgeInsets.symmetric(horizontal: 14),
                          ),
                          child: _isApplyingCoupon
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : Text(
                                  t(isCouponLocked ? 'Applied' : 'Apply'),
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                        ),
                      ),
                    ],
                  ),
                  if (isCouponLocked) ...[
                    const SizedBox(height: 6),
                    Align(
                      alignment: Alignment.centerRight,
                      child: GestureDetector(
                        onTap: () => setState(
                          () => _clearAppliedCouponPreview(clearInput: true),
                        ),
                        child: Text(
                          t('Change code'),
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: primaryBlue,
                          ),
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  // Checkout Button
                  GestureDetector(
                    onTap: _isCheckingOut ? null : _proceedToCheckout,
                    child: Container(
                      width: double.infinity,
                      height: 48,
                      decoration: BoxDecoration(
                        color: _isCheckingOut
                            ? primaryBlue.withOpacity(0.6)
                            : primaryBlue,
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: [
                          BoxShadow(
                            color: primaryBlue.withOpacity(0.3),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          if (_isCheckingOut) ...[
                            const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(width: 12),
                          ],
                          Text(
                            _isCheckingOut
                                ? t('Creating Order...')
                                : t('Proceed to Checkout'),
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                          if (!_isCheckingOut) ...[
                            const SizedBox(width: 8),
                            const Icon(
                              Icons.arrow_forward_rounded,
                              size: 20,
                              color: Colors.white,
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  int _negotiationTab = 0;
  bool _isNegotiationsLoading = true;
  List<Map<String, dynamic>> _negotiations = [];

  Future<void> _fetchNegotiations() async {
    setState(() => _isNegotiationsLoading = true);
    try {
      final api = ref.read(apiClientProvider);
      final response = await api.get('/negotiations');
      if (response.data['success'] == true) {
        final List items = response.data['data'] ?? [];
        setState(() {
          _negotiations = items.cast<Map<String, dynamic>>();
          _isNegotiationsLoading = false;
        });
      }
    } catch (e) {
      setState(() => _isNegotiationsLoading = false);
    }
  }

  List<Map<String, dynamic>> get _filteredNegotiations {
    if (_negotiationTab == 0) return _negotiations;
    if (_negotiationTab == 1) {
      return _negotiations
          .where((n) => ['pending', 'countered'].contains(n['status']))
          .toList();
    }
    return _negotiations
        .where(
          (n) => [
            'accepted',
            'rejected',
            'expired',
            'converted',
          ].contains(n['status']),
        )
        .toList();
  }

  Map<String, dynamic> _getNegStatusDisplay(String status) {
    final t = ref.read(localeProvider.notifier).translate;
    switch (status) {
      case 'pending':
        return {
          'label': t('PENDING'),
          'color': const Color(0xFF6B7280),
          'bg': const Color(0xFFF3F4F6),
        };
      case 'countered':
        return {
          'label': t('COUNTER-OFFER'),
          'color': const Color(0xFFF59E0B),
          'bg': const Color(0xFFFEF3C7),
        };
      case 'accepted':
        return {
          'label': t('ACCEPTED'),
          'color': const Color(0xFF16A34A),
          'bg': const Color(0xFFDCFCE7),
        };
      case 'rejected':
        return {
          'label': t('REJECTED'),
          'color': const Color(0xFFDC2626),
          'bg': const Color(0xFFFEE2E2),
        };
      case 'expired':
        return {
          'label': t('EXPIRED'),
          'color': const Color(0xFF9CA3AF),
          'bg': const Color(0xFFF3F4F6),
        };
      case 'converted':
        return {
          'label': t('CONVERTED'),
          'color': const Color(0xFF7C3AED),
          'bg': const Color(0xFFF3E8FF),
        };
      default:
        return {
          'label': status.toUpperCase(),
          'color': const Color(0xFF6B7280),
          'bg': const Color(0xFFF3F4F6),
        };
    }
  }

  Widget _buildNegotiationsContent() {
    final t = ref.read(localeProvider.notifier).translate;
    if (_isNegotiationsLoading && _negotiations.isEmpty) {
      _fetchNegotiations();
    }
    return Column(
      children: [
        // Header
        Container(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          color: backgroundWhite,
          child: Text(
            t('Negotiations'),
            style: GoogleFonts.plusJakartaSans(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: textPrimary,
              letterSpacing: -0.5,
            ),
          ),
        ),
        // Tabs
        Container(
          color: backgroundWhite,
          child: Container(
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: borderLight, width: 1)),
            ),
            child: Row(
              children: [
                _buildNegotiationTab(t('All'), 0),
                _buildNegotiationTab(t('Active'), 1),
                _buildNegotiationTab(t('Completed'), 2),
              ],
            ),
          ),
        ),
        // Content
        Expanded(
          child: _isNegotiationsLoading
              ? const Center(
                  child: CircularProgressIndicator(color: primaryBlue),
                )
              : _filteredNegotiations.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.handshake_outlined,
                        size: 48,
                        color: textMuted.withOpacity(0.5),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        _negotiationTab == 1
                            ? t('No active negotiations')
                            : _negotiationTab == 2
                            ? t('No completed negotiations')
                            : t('No negotiations yet'),
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: textMuted,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        t('Start negotiating on product pages'),
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 13,
                          color: const Color(0xFF4C669A),
                        ),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _fetchNegotiations,
                  child: ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                    itemCount: _filteredNegotiations.length,
                    itemBuilder: (context, index) =>
                        _buildNegotiationCard(_filteredNegotiations[index]),
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildNegotiationTab(String label, int index) {
    final isSelected = _negotiationTab == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _negotiationTab = index),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color: isSelected ? primaryBlue : Colors.transparent,
                width: 3,
              ),
            ),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.3,
              color: isSelected ? primaryBlue : const Color(0xFF4C669A),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNegotiationCard(Map<String, dynamic> negotiation) {
    final t = ref.read(localeProvider.notifier).translate;
    final status = negotiation['status'] as String? ?? 'pending';
    final statusDisplay = _getNegStatusDisplay(status);
    final product = negotiation['product'] as Map<String, dynamic>? ?? {};
    final productName = product['name'] as String? ?? t('Unknown Product');
    final imageUrl = product['image'] as String? ?? '';
    final quantity = negotiation['requestedQuantity'] ?? 0;
    final requestedPrice = negotiation['requestedPricePerUnit'] ?? 0;
    final currentPrice = negotiation['currentPricePerUnit'] ?? 0;
    final currentTotal = negotiation['currentTotalPrice'] ?? 0;
    final currentOfferBy = negotiation['currentOfferBy'] as String? ?? '';
    final negotiationNumber = negotiation['negotiationNumber'] as String? ?? '';
    final negotiationId = (negotiation['id'] ?? negotiation['_id'] ?? '')
        .toString();
    final canPay = negotiation['canPay'] == true;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: GestureDetector(
        onTap: () async {
          final result = await context.push(
            '/negotiation-detail/$negotiationId',
          );
          if (result == true) _fetchNegotiations();
        },
        child: Container(
          decoration: BoxDecoration(
            color: surfaceWhite,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: borderLight),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (imageUrl.isNotEmpty)
                AspectRatio(
                  aspectRatio: 2.4,
                  child: CachedNetworkImage(
                    imageUrl: imageUrl,
                    fit: BoxFit.cover,
                    placeholder: (_, __) =>
                        Container(color: const Color(0xFFF1F5F9)),
                    errorWidget: (_, __, ___) => Container(
                      color: const Color(0xFFF1F5F9),
                      child: Center(
                        child: HugeIcon(
                          icon: HugeIcons.strokeRoundedImage01,
                          color: textMuted,
                          size: 40,
                        ),
                      ),
                    ),
                  ),
                ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          negotiationNumber.isNotEmpty
                              ? negotiationNumber
                              : t('NEGOTIATION'),
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF4C669A),
                            letterSpacing: 0.5,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: statusDisplay['bg'] as Color,
                            borderRadius: BorderRadius.circular(100),
                          ),
                          child: Text(
                            statusDisplay['label'] as String,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: statusDisplay['color'] as Color,
                              letterSpacing: 0.3,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      productName,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: textPrimary,
                        height: 1.2,
                        letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      t('Qty: $quantity units'),
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: const Color(0xFF4C669A),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: backgroundWhite,
                        borderRadius: BorderRadius.circular(8),
                        border: status == 'accepted'
                            ? const Border(
                                left: BorderSide(
                                  color: Color(0xFF16A34A),
                                  width: 4,
                                ),
                              )
                            : null,
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                t('Your Price/unit:'),
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 13,
                                  color: const Color(0xFF4C669A),
                                ),
                              ),
                              Text(
                                '₹$requestedPrice',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: textPrimary,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                status == 'countered' &&
                                        currentOfferBy == 'admin'
                                    ? t('Admin Counter:')
                                    : t('Current Price/unit:'),
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 13,
                                  color: const Color(0xFF4C669A),
                                ),
                              ),
                              Text(
                                '₹$currentPrice',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: status == 'accepted'
                                      ? const Color(0xFF16A34A)
                                      : primaryBlue,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          const Divider(height: 1),
                          const SizedBox(height: 6),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                t('Total:'),
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: textPrimary,
                                ),
                              ),
                              Text(
                                '₹$currentTotal',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                  color: status == 'accepted'
                                      ? const Color(0xFF16A34A)
                                      : textPrimary,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildNegActionButton(
                      status,
                      currentOfferBy,
                      canPay,
                      negotiationId,
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

  Widget _buildNegActionButton(
    String status,
    String currentOfferBy,
    bool canPay,
    String negotiationId,
  ) {
    final t = ref.read(localeProvider.notifier).translate;
    String label;
    String style;
    IconData? icon;
    VoidCallback? onTap;
    if (status == 'countered' && currentOfferBy == 'admin') {
      label = t('Respond to Counter');
      style = 'primary';
      icon = Icons.reply_rounded;
      onTap = () async {
        final r = await context.push('/negotiation-detail/$negotiationId');
        if (r == true) _fetchNegotiations();
      };
    } else if (status == 'accepted' && canPay) {
      label = t('Proceed to Order');
      style = 'primary';
      icon = Icons.account_balance_wallet_rounded;
      onTap = () => _proceedToNegotiationOrder(negotiationId);
    } else if (status == 'pending') {
      label = t('Under Review');
      style = 'disabled';
    } else if (status == 'rejected') {
      label = t('Rejected');
      style = 'disabled';
    } else if (status == 'expired') {
      label = t('Expired');
      style = 'disabled';
    } else {
      label = t('View Details');
      style = 'outline';
      onTap = () async {
        final r = await context.push('/negotiation-detail/$negotiationId');
        if (r == true) _fetchNegotiations();
      };
    }

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        height: 44,
        decoration: BoxDecoration(
          color: style == 'primary'
              ? primaryBlue
              : style == 'disabled'
              ? borderLight
              : surfaceWhite,
          borderRadius: BorderRadius.circular(10),
          border: style == 'outline' ? Border.all(color: borderLight) : null,
          boxShadow: style == 'primary' && icon != null
              ? [
                  BoxShadow(
                    color: primaryBlue.withOpacity(0.2),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 16, color: Colors.white),
              const SizedBox(width: 6),
            ],
            Text(
              label,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: style == 'primary'
                    ? Colors.white
                    : style == 'disabled'
                    ? const Color(0xFF9CA3AF)
                    : textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileContent() {
    final t = ref.read(localeProvider.notifier).translate;
    final user = ref.watch(authProvider).user;
    final isGuest = user == null;

    final profileItems = [
      {
        'type': 'setting',
        'icon': HugeIcons.strokeRoundedLocation01,
        'color': const Color(0xFF059669),
        'title': t('Addresses'),
        'subtitle': null,
        'onTap': () {
          context.push('/addresses').then((_) => _loadSavedShippingAddresses());
        },
      },
      {
        'type': 'setting',
        'icon': HugeIcons.strokeRoundedNotification02,
        'color': const Color(0xFF7C3AED),
        'title': t('Notifications'),
        'subtitle': null,
        'onTap': () => context.push('/notifications', extra: {'bottomTab': 4}),
      },
      {
        'type': 'setting',
        'icon': HugeIcons.strokeRoundedHelpCircle,
        'color': const Color(0xFFD97706),
        'title': t('Help & Support'),
        'subtitle': null,
        'onTap': () => context.push('/help'),
      },
      {
        'type': 'setting',
        'icon': HugeIcons.strokeRoundedFile01,
        'color': const Color(0xFF0891B2),
        'title': t('Legal & Policies'),
        'subtitle': null,
        'onTap': () => _showLegalPoliciesSheet(),
      },
      {
        'type': 'setting',
        'icon': HugeIcons.strokeRoundedInformationCircle,
        'color': const Color(0xFF4338CA),
        'title': t('About'),
        'subtitle': null,
        'onTap': () => context.push('/about'),
      },
      {
        'type': 'setting',
        'icon': HugeIcons.strokeRoundedTicket01,
        'color': const Color(0xFFDC2626),
        'title': t('My Coupon & Offer Code'),
        'subtitle': null,
        'onTap': () => context.push('/my-coupons'),
      },
      if (user?.role != 'wholesaler')
        {
          'type': 'setting',
          'icon': HugeIcons.strokeRoundedStore02,
          'color': primaryBlue,
          'title': t('Apply for wholesaler account'),
          'subtitle': t('Unlock bulk pricing & deals'),
          'onTap': () => context.push('/convert-to-wholesaler'),
        },
    ];

    final wishlistCount = ref.watch(wishlistProvider).items.length;
    final orderCount = ref.watch(orderCountProvider).value ?? 0;

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      child: Column(
        children: [
          // Premium Profile Header
          Stack(
            children: [
              // Gradient Background with decorative shapes
              Container(
                height: 370,
                width: double.infinity,
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Color(0xFF8B5CF6), // Vibrant Purple
                      Color(0xFF6366F1), // Indigo
                      Color(0xFF4F46E5), // Deeper Indigo
                    ],
                  ),
                ),
                child: Stack(
                  children: [
                    // Decorative Circle 1
                    Positioned(
                      top: -50,
                      right: -50,
                      child: Container(
                        width: 200,
                        height: 200,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withOpacity(0.1),
                        ),
                      ),
                    ),
                    // Decorative Circle 2
                    Positioned(
                      bottom: 40,
                      left: -30,
                      child: Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withOpacity(0.05),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Header Content
              Container(
                width: double.infinity,
                padding: const EdgeInsets.only(top: 40, bottom: 40),
                child: Column(
                  children: [
                    // Back Button & Settings Icon Row
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          IconButton(
                            onPressed: () {
                              if (_selectedNavIndex != 0) {
                                setState(() => _selectedNavIndex = 0);
                              }
                            },
                            icon: const Icon(
                              HugeIcons.strokeRoundedArrowLeft01,
                              color: Colors.white,
                              size: 24,
                            ),
                          ),
                          Text(
                            t('Profile'),
                            style: GoogleFonts.plusJakartaSans(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          IconButton(
                            onPressed: () => context.push(
                              isGuest ? '/login' : '/edit-profile',
                            ),
                            icon: const Icon(
                              HugeIcons.strokeRoundedSettings01,
                              color: Colors.white,
                              size: 24,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 15),

                    // Animated Avatar
                    TweenAnimationBuilder<double>(
                      tween: Tween(begin: 0.0, end: 1.0),
                      duration: const Duration(milliseconds: 800),
                      curve: Curves.elasticOut,
                      builder: (context, value, child) {
                        return Transform.scale(
                          scale: value,
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white24,
                            ),
                            child: Container(
                              width: 100,
                              height: 100,
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.white,
                              ),
                              clipBehavior: Clip.antiAlias,
                              child:
                                  user?.avatar != null &&
                                      user!.avatar!.isNotEmpty
                                  ? CachedNetworkImage(
                                      imageUrl: user.avatar!,
                                      fit: BoxFit.cover,
                                      placeholder: (context, url) =>
                                          const Center(
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2,
                                            ),
                                          ),
                                      errorWidget: (context, url, error) =>
                                          const Icon(
                                            HugeIcons.strokeRoundedUser,
                                            size: 40,
                                            color: Color(0xFF6366F1),
                                          ),
                                    )
                                  : const Icon(
                                      HugeIcons.strokeRoundedUser,
                                      size: 40,
                                      color: Color(0xFF6366F1),
                                    ),
                            ),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 16),

                    // User Name
                    Text(
                      user?.name ?? 'Guest User',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 12),

                    // User Email/Phone/Address
                    Column(
                      children: [
                        if (user != null && user.phone != null)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 4),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  HugeIcons.strokeRoundedCall02,
                                  size: 14,
                                  color: Colors.white.withOpacity(0.8),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  user.phone!,
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 15,
                                    color: Colors.white.withOpacity(0.95),
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        if (user != null &&
                            user.address != null &&
                            user.address!.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  HugeIcons.strokeRoundedLocation01,
                                  size: 14,
                                  color: Colors.white.withOpacity(0.8),
                                ),
                                const SizedBox(width: 6),
                                Flexible(
                                  child: Text(
                                    user.address!,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 14,
                                      color: Colors.white.withOpacity(0.9),
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        if (isGuest ||
                            (user.phone == null && user.address == null))
                          Text(
                            user?.email ?? 'Sign in to sync data',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 14,
                              color: Colors.white.withOpacity(0.9),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        if (isGuest) ...[
                          const SizedBox(height: 14),
                          Padding(
                            padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
                            child: SizedBox(
                              width: double.infinity,
                              child: OutlinedButton(
                                onPressed: () => context.push('/login'),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: Colors.white,
                                  side: BorderSide(
                                    color: Colors.white.withOpacity(0.9),
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 12,
                                  ),
                                ),
                                child: Text(
                                  'Login',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),

          // Main Content Card (overlapping the header)
          Transform.translate(
            offset: const Offset(0, -40),
            child: TweenAnimationBuilder<double>(
              tween: Tween(begin: 0.0, end: 1.0),
              duration: const Duration(milliseconds: 600),
              builder: (context, value, child) {
                return Opacity(
                  opacity: value,
                  child: Transform.translate(
                    offset: Offset(0, 40 * (1 - value)),
                    child: child,
                  ),
                );
              },
              child: Column(
                children: [
                  // Fast Actions / Stats row
                  // Fast Actions / Stats row
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildQuickStat(
                          HugeIcons.strokeRoundedPackage,
                          t('My Orders'),
                          orderCount.toString(),
                          color: const Color(0xFF6366F1), // Premium Indigo
                          onTap: () => context.push('/previous-orders'),
                        ),
                        _buildQuickStat(
                          HugeIcons.strokeRoundedFavourite,
                          t('Wishlist'),
                          wishlistCount.toString(),
                          color: const Color(0xFFF43F5E), // Vibrant Rose
                          onTap: () => context.push('/wishlist'),
                        ),
                        _buildQuickStat(
                          HugeIcons.strokeRoundedUserEdit01,
                          t('Edit Profile'),
                          '0',
                          color: const Color(0xFFF59E0B), // Amber
                          onTap: () => context.push(
                            isGuest ? '/login' : '/edit-profile',
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Settings List Card
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Container(
                      decoration: BoxDecoration(
                        color: surfaceWhite,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: borderLight.withOpacity(0.7)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.02),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        children: List.generate(profileItems.length, (index) {
                          final item = profileItems[index];
                          final isHeader = item['type'] == 'header';
                          if (isHeader) {
                            return Padding(
                              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                              child: Align(
                                alignment: Alignment.centerLeft,
                                child: Text(
                                  item['title'] as String,
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: textMuted,
                                    letterSpacing: 1,
                                  ),
                                ),
                              ),
                            );
                          }

                          final nextIsHeader =
                              index < profileItems.length - 1 &&
                              profileItems[index + 1]['type'] == 'header';
                          final showDivider =
                              index < profileItems.length - 1 && !nextIsHeader;

                          return _buildSettingItem(
                            icon: item['icon'] as IconData,
                            iconColor: item['color'] as Color,
                            title: item['title'] as String,
                            subtitle: item['subtitle'] as String?,
                            showDivider: showDivider,
                            onTap: item['onTap'] as VoidCallback,
                          );
                        }),
                      ),
                    ),
                  ),

                  // Danger Zone / Logout
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 32, 16, 120),
                    child: TextButton.icon(
                      onPressed: () async {
                        await ref.read(authProvider.notifier).logout();
                        if (mounted) {
                          context.go('/login');
                        }
                      },
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 12,
                        ),
                        foregroundColor: Colors.red.shade600,
                        backgroundColor: Colors.red.shade50,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      icon: HugeIcon(
                        icon: HugeIcons.strokeRoundedLogout02,
                        color: Colors.red.shade600,
                        size: 20,
                      ),
                      label: Text(
                        t('Log Out'),
                        style: GoogleFonts.plusJakartaSans(
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                        ),
                      ),
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

  Widget _buildQuickStat(
    IconData icon,
    String label,
    String value, {
    required Color color,
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 100,
        height: 100,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.06),
              blurRadius: 15,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                HugeIcon(icon: icon, color: color, size: 24),
                if (value != '0')
                  Positioned(
                    right: -10,
                    top: -8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: color,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                      child: Text(
                        value,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              label.toUpperCase(),
              style: GoogleFonts.plusJakartaSans(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                color: textPrimary.withOpacity(0.8),
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingItem({
    required IconData icon,
    required Color iconColor,
    required String title,
    String? subtitle,
    required bool showDivider,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: showDivider
              ? Border(
                  bottom: BorderSide(
                    color: borderLight.withOpacity(0.5),
                    width: 1,
                  ),
                )
              : null,
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: HugeIcon(icon: icon, color: iconColor, size: 20),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: textPrimary,
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 12,
                        fontWeight: FontWeight.w400,
                        color: textMuted,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            HugeIcon(
              icon: HugeIcons.strokeRoundedArrowRight01,
              color: textMuted,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showLegalPoliciesSheet() async {
    final t = ref.read(localeProvider.notifier).translate;
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) {
        return SafeArea(
          child: FractionallySizedBox(
            heightFactor: 0.88,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 38,
                      height: 4,
                      decoration: BoxDecoration(
                        color: borderLight,
                        borderRadius: BorderRadius.circular(100),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    t('Legal & Policies'),
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Expanded(
                    child: ListView.builder(
                      itemCount: LegalPolicyCatalog.items.length,
                      itemBuilder: (context, index) {
                        final policy = LegalPolicyCatalog.items[index];
                        return _buildPolicySheetItem(
                          icon: policy.icon,
                          color: policy.color,
                          title: t(policy.title),
                          policyId: policy.id,
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildPolicySheetItem({
    required IconData icon,
    required Color color,
    required String title,
    required String policyId,
  }) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          shape: BoxShape.circle,
        ),
        child: HugeIcon(icon: icon, color: color, size: 18),
      ),
      title: Text(
        title,
        style: GoogleFonts.plusJakartaSans(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: textPrimary,
        ),
      ),
      trailing: HugeIcon(
        icon: HugeIcons.strokeRoundedArrowRight01,
        color: textMuted,
        size: 18,
      ),
      onTap: () {
        Navigator.of(context).pop();
        context.push('/legal/$policyId');
      },
    );
  }

  Widget _buildAppBar() {
    final t = ref.read(localeProvider.notifier).translate;
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      color: backgroundWhite,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Logo
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: primaryBlue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.asset(
                    'assets/images/oxon logo.jpeg',
                    width: 24,
                    height: 24,
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                'OXON',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  color: textPrimary,
                  letterSpacing: -1,
                ),
              ),
            ],
          ),
          // Actions
          Row(
            children: [
              PopupMenuButton<String>(
                offset: const Offset(0, 45),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                onSelected: (String value) {
                  ref.read(localeProvider.notifier).setLanguage(value);
                },
                itemBuilder: (context) => [
                  _buildLanguageItem('English', '', t('English')),
                  _buildLanguageItem('Hindi', '', t('Hindi')),
                ],
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(100),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.08),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        ref.watch(localeProvider) == 'English' ? 'EN' : 'HI',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: primaryBlue,
                        ),
                      ),
                      const SizedBox(width: 4),
                      const Icon(
                        Icons.arrow_drop_down_rounded,
                        color: primaryBlue,
                        size: 20,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              GestureDetector(
                onTap: _showNotificationPopup,
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: surfaceWhite,
                        shape: BoxShape.circle,
                        border: Border.all(color: borderLight),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.03),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Center(
                        child: HugeIcon(
                          icon: HugeIcons.strokeRoundedNotification02,
                          color: textPrimary,
                          size: 20,
                        ),
                      ),
                    ),
                    if (_unreadCount > 0)
                      Positioned(
                        top: -2,
                        right: -2,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: Color(0xFFEF4444),
                            shape: BoxShape.circle,
                          ),
                          constraints: const BoxConstraints(
                            minWidth: 18,
                            minHeight: 18,
                          ),
                          child: Text(
                            '$_unreadCount',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  PopupMenuItem<String> _buildLanguageItem(
    String value,
    String emoji,
    String label,
  ) {
    final currentLang = ref.watch(localeProvider);
    final isSelected = currentLang == value;
    return PopupMenuItem<String>(
      value: value,
      child: Row(
        children: [
          Text(
            label,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 14,
              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              color: isSelected ? primaryBlue : textPrimary,
            ),
          ),
          if (isSelected) ...[
            const Spacer(),
            const Icon(Icons.check_rounded, color: primaryBlue, size: 16),
          ],
        ],
      ),
    );
  }

  Widget _buildCarousel() {
    if (_isLoadingHeroBanners) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Shimmer.fromColors(
          baseColor: Colors.grey[300]!,
          highlightColor: Colors.grey[100]!,
          child: Container(
            height: 220,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(30),
            ),
          ),
        ),
      );
    }
    if (_heroBanners.isEmpty) {
      return const SizedBox.shrink();
    }
    final t = ref.read(localeProvider.notifier).translate;
    return Column(
      children: [
        SizedBox(
          height: 220,
          child: PageView.builder(
            controller: _carouselController,
            itemCount: _heroBanners.length,
            physics: const ClampingScrollPhysics(),
            onPageChanged: (index) {
              setState(() => _currentCarouselIndex = index);
            },
            itemBuilder: (context, index) {
              final item = _heroBanners[index];
              final hasImage = (item['imageUrl'] ?? '').toString().isNotEmpty;
              final linkUrl = item['linkUrl']?.toString() ?? '';
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: GestureDetector(
                  onTap: () => _handleBannerTap(linkUrl),
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(30),
                      gradient: hasImage
                          ? null
                          : LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [primaryBlue, primaryBlueDark],
                            ),
                      image: hasImage
                          ? DecorationImage(
                              image: CachedNetworkImageProvider(
                                item['imageUrl'],
                              ),
                              fit: BoxFit.cover,
                            )
                          : null,
                      boxShadow: [
                        BoxShadow(
                          color: primaryBlue.withOpacity(0.3),
                          blurRadius: 20,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: Stack(
                      children: [
                        if (hasImage)
                          Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(30),
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [
                                  Colors.transparent,
                                  Colors.black.withOpacity(0.6),
                                ],
                              ),
                            ),
                          ),
                        Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.white24,
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  item['tag'] ?? t('NEW ARRIVAL'),
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    color: Colors.white,
                                    letterSpacing: 1.2,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                item['title'] ?? t('Next-Gen\nTractors'),
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 26,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.white,
                                  height: 1.1,
                                  letterSpacing: -0.5,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 16),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 20,
                                  vertical: 10,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      item['buttonText'] ?? t('Shop Now'),
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w800,
                                        color: primaryBlue,
                                      ),
                                    ),
                                    _getBannerIcon(
                                      item['buttonIcon'],
                                      primaryBlue,
                                      16,
                                    ),
                                  ],
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
            },
          ),
        ),
        if (_heroBanners.length > 1) ...[
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              _heroBanners.length,
              (index) => AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                margin: const EdgeInsets.symmetric(horizontal: 4),
                width: _currentCarouselIndex == index ? 24 : 8,
                height: 8,
                decoration: BoxDecoration(
                  color: _currentCarouselIndex == index
                      ? primaryBlue
                      : primaryBlue.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }

  void _handleBannerTap(String linkUrl) {
    if (linkUrl.isEmpty) return;
    if (linkUrl.startsWith('/product/')) {
      context.push(linkUrl);
    } else if (linkUrl.startsWith('/category/')) {
      final catName = linkUrl.replaceFirst('/category/', '');
      setState(() {
        _selectedFilterCategory = catName;
        _isSearching = true;
      });
      _searchProducts('');
    } else if (linkUrl.startsWith('http')) {
      launchUrl(Uri.parse(linkUrl), mode: LaunchMode.externalApplication);
    }
  }

  Widget _buildBrandsSection() {
    final t = ref.read(localeProvider.notifier).translate;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
          colors: [
            const Color(0xFF0369A1).withOpacity(0.28), // Darker Sky Blue
            const Color(0xFF0EA5E9).withOpacity(0.1),
            Colors.transparent,
          ],
          stops: const [0.0, 0.5, 1.0],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      t('Top Brands'),
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: textPrimary,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      height: 3,
                      width: 40,
                      decoration: BoxDecoration(
                        color: const Color(0xFF0EA5E9),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ],
                ),
                GestureDetector(
                  onTap: () => context.push('/brands'),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: borderLight),
                    ),
                    child: Row(
                      children: [
                        Text(
                          t('See All'),
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: primaryBlue,
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(
                          Icons.arrow_forward_ios_rounded,
                          size: 10,
                          color: primaryBlue,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          SizedBox(
            height: 100,
            child: _isLoadingBrands
                ? ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: 5,
                  itemBuilder:
                      (context, index) => Padding(
                        padding: const EdgeInsets.only(right: 12),
                        child: Container(
                          width: 168,
                          decoration: BoxDecoration(
                            color: borderLight,
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                      ),
                )
                : _brands.isEmpty
                ? Center(
                  child: Text(
                    t('No brands available'),
                    style: GoogleFonts.plusJakartaSans(color: textMuted),
                  ),
                )
                : ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  physics: const BouncingScrollPhysics(),
                  itemCount: _brands.length,
                  itemBuilder: (context, index) {
                    final brand = _brands[index];
                    final accentColor = Color(
                      (brand['accent'] as int?) ?? 0xFF2563EB,
                    );
                    final hasLogo =
                        brand['logo'] != null &&
                        brand['logo'].toString().isNotEmpty;

                    return Padding(
                      padding: const EdgeInsets.only(right: 12),
                      child: GestureDetector(
                        onTap: () {
                          final name = brand['name']?.toString() ?? '';
                          context.push('/brand/$name');
                        },
                        child: Container(
                          width: 168,
                          decoration: BoxDecoration(
                            color: surfaceWhite,
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: borderLight, width: 1),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.05),
                                blurRadius: 12,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Row(
                            children: [
                              // Logo area
                              Container(
                                width: 68,
                                height: double.infinity,
                                decoration: BoxDecoration(
                                  color: accentColor.withOpacity(0.07),
                                  borderRadius: const BorderRadius.only(
                                    topLeft: Radius.circular(17),
                                    bottomLeft: Radius.circular(17),
                                  ),
                                ),
                                child:
                                    hasLogo
                                        ? Padding(
                                          padding: const EdgeInsets.all(10),
                                          child: CachedNetworkImage(
                                            imageUrl: brand['logo'],
                                            fit: BoxFit.contain,
                                            placeholder:
                                                (_, __) => Center(
                                                  child: SizedBox(
                                                    width: 20,
                                                    height: 20,
                                                    child:
                                                        CircularProgressIndicator(
                                                          strokeWidth: 2,
                                                          color: accentColor,
                                                        ),
                                                  ),
                                                ),
                                            errorWidget:
                                                (_, __, ___) =>
                                                    _buildBrandInitial(
                                                      brand['name'] ?? '',
                                                      accentColor,
                                                    ),
                                          ),
                                        )
                                        : _buildBrandInitial(
                                          brand['name'] ?? '',
                                          accentColor,
                                        ),
                              ),
                              // Info area
                              Expanded(
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 10,
                                  ),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Text(
                                        brand['name'] ?? '',
                                        style: GoogleFonts.plusJakartaSans(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w800,
                                          color: textPrimary,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 4),
                                      if (brand['tag'] != null) ...[
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 6,
                                            vertical: 2,
                                          ),
                                          decoration: BoxDecoration(
                                            color: accentColor.withOpacity(0.1),
                                            borderRadius: BorderRadius.circular(
                                              6,
                                            ),
                                          ),
                                          child: Text(
                                            brand['tag'],
                                            style: GoogleFonts.plusJakartaSans(
                                              fontSize: 9,
                                              fontWeight: FontWeight.w700,
                                              color: accentColor,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                        const SizedBox(height: 6),
                                      ],
                                      Row(
                                        children: [
                                          Icon(
                                            Icons.verified_rounded,
                                            size: 10,
                                            color: accentColor,
                                          ),
                                          const SizedBox(width: 3),
                                          Text(
                                            t('Verified'),
                                            style: GoogleFonts.plusJakartaSans(
                                              fontSize: 9,
                                              fontWeight: FontWeight.w600,
                                              color: textMuted,
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
                      ),
                    );
                  },
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildBrandInitial(String name, Color color) {
    final initial = name.isNotEmpty ? name[0].toUpperCase() : 'B';
    return Center(
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: color.withOpacity(0.15),
          shape: BoxShape.circle,
        ),
        child: Center(
          child: Text(
            initial,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 18,
              fontWeight: FontWeight.w900,
              color: color,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildProductsSection(String title, bool isFeatured) {
    // Popular Products (isFeatured=true) shows only products where isFeatured==true.
    // Hot Deals (isFeatured=false) shows only products where isHot==true.
    final filteredProducts = isFeatured
        ? _products.where((p) => p['isFeatured'] == true).toList()
        : _products.where((p) => p['isHot'] == true).toList();
    final t = ref.read(localeProvider.notifier).translate;
    final currentLang = ref.read(localeProvider);

    // Section colors based on requirement
    final Color gradientBase = isFeatured 
        ? const Color(0xFF1E3A8A) // Medium/Dark Blue
        : const Color(0xFFEF4444); // Reddish

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            isFeatured 
                ? const Color(0xFF1E3A8A).withOpacity(0.15) // Deep Blue
                : const Color(0xFFFECACA).withOpacity(0.25), // Lighter Reddish
            isFeatured
                ? const Color(0xFF1E3A8A).withOpacity(0.05)
                : const Color(0xFFFECACA).withOpacity(0.1),
            Colors.transparent,
          ],
          stops: const [0.0, 0.4, 1.0],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: textPrimary,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      height: 3,
                      width: 40,
                      decoration: BoxDecoration(
                        color: gradientBase,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ],
                ),
                GestureDetector(
                  onTap: () {
                    if (isFeatured) {
                      context.push('/popular-products');
                    } else {
                      context.push('/hot-deals');
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: borderLight),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.03),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Text(
                          t('View all'),
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: primaryBlue,
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(
                          Icons.arrow_forward_ios_rounded,
                          size: 10,
                          color: primaryBlue,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          // Products Grid - 2 columns
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: _isLoadingProducts
                ? GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 0.52,
                    ),
                    itemCount: 4,
                    itemBuilder: (context, index) => Container(
                      decoration: BoxDecoration(
                        color: borderLight,
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  )
                : filteredProducts.isEmpty
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(40),
                      child: Column(
                        children: [
                          Icon(Icons.inventory_2_outlined, color: textMuted.withOpacity(0.5), size: 48),
                          const SizedBox(height: 12),
                          Text(
                            t('No products available'),
                            style: GoogleFonts.plusJakartaSans(color: textMuted),
                          ),
                        ],
                      ),
                    ),
                  )
                : GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 0.52,
                    ),
                    itemCount: filteredProducts.length > 6
                        ? 6
                        : filteredProducts.length,
                    itemBuilder: (context, index) {
                      final product = filteredProducts[index];
                      // Only show HOT badge in Hot Deals section, not in Popular Products
                      return _buildProductCard(
                        product,
                        currentLang: currentLang,
                        showHotBadge: !isFeatured,
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildProductCard(
    Map<String, dynamic> product, {
    required String currentLang,
    bool showHotBadge = true,
  }) {
    final t = ref.read(localeProvider.notifier).translate;
    final heroTag = 'product-image-${product['id']}';
    final hasOriginalPrice =
        product['originalPrice'] != null &&
        product['originalPrice'] != product['price'] &&
        (product['originalPrice'] as num?) != null &&
        (product['originalPrice'] as num) > 0;
    final discount = hasOriginalPrice
        ? (((product['originalPrice'] as num) - (product['price'] as num)) /
                  (product['originalPrice'] as num) *
                  100)
              .round()
        : 0;

    // Pick badge: HOT (only when showHotBadge=true) > SALE (discount) > NEW
    String? badgeLabel;
    Color? badgeColor;
    if (showHotBadge && (product['isHot'] == true || product['badge']?.toString().contains('HOT') == true)) {
      badgeLabel = 'HOT'; // Force clean label without flames
      badgeColor = const Color(0xFFEF4444);
    } else if (discount > 0) {
      badgeLabel = t('SALE');
      badgeColor = const Color(0xFF16A34A);
    } else if (product['isNew'] == true) {
      badgeLabel = t('NEW');
      badgeColor = primaryBlue;
    }

    final category = (product['category'] ?? '').toString().toUpperCase();
    final rating = product['rating'];
    final reviewCount = product['reviewCount'] ?? product['reviews'] ?? '';

    return GestureDetector(
      onTap: () => context.push(
        '/product/${product['id']}',
        extra: {'heroTag': heroTag},
      ),
      child: Container(
        decoration: BoxDecoration(
          color: surfaceWhite,
          borderRadius: BorderRadius.circular(4),
          border: Border.all(color: borderLight, width: 1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 8,
              spreadRadius: 0,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Image area ──
            Expanded(
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(4),
                ),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    // Background + image
                    Hero(
                      tag: heroTag,
                      child:
                          product['image'] != null &&
                              product['image'].toString().isNotEmpty
                          ? CachedNetworkImage(
                              imageUrl: product['image'],
                              fit: BoxFit.contain,
                              placeholder: (_, __) => ProductImagePlaceholder(
                                category: product['category']?.toString() ?? '',
                                name: product['name']?.toString() ?? '',
                              ),
                              errorWidget: (_, __, ___) =>
                                  ProductImagePlaceholder(
                                    category:
                                        product['category']?.toString() ?? '',
                                    name: product['name']?.toString() ?? '',
                                  ),
                            )
                          : ProductImagePlaceholder(
                              category: product['category']?.toString() ?? '',
                              name: product['name']?.toString() ?? '',
                            ),
                    ),
                    // Out of stock overlay
                    if (product['inStock'] == false)
                      Container(
                        color: Colors.white.withOpacity(0.65),
                        alignment: Alignment.center,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.black87,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            t('Out of Stock'),
                            style: GoogleFonts.outfit(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    // Badge (top-left)
                    if (badgeLabel != null)
                      Positioned(
                        top: 10,
                        left: 10,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: badgeColor,
                            borderRadius: BorderRadius.circular(2),
                          ),
                          child: Text(
                            badgeLabel,
                            style: GoogleFonts.outfit(
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),

            // ── Info area ──
            Padding(
              padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (category.isNotEmpty)
                    Text(
                      category,
                      style: GoogleFonts.outfit(
                        fontSize: 9.5,
                        fontWeight: FontWeight.w700,
                        color: textMuted,
                        letterSpacing: 0.8,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  const SizedBox(height: 2),
                  SizedBox(
                    height: 52,
                    child: Text(
                      _getDisplayName(product, currentLang),
                      style: GoogleFonts.outfit(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w400,
                        color: textPrimary,
                        height: 1.25,
                      ),
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(height: 4),
                  // Star rating visualization
                  if (rating != null)
                    Row(
                      children: [
                        Text(
                          '$rating',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            color: textPrimary,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Row(
                          children: List.generate(5, (index) {
                            final rv = (rating is num) ? rating.toDouble() : double.tryParse(rating.toString()) ?? 0.0;
                            final starIndex = index + 1;
                            if (rv >= starIndex) {
                              return const Icon(
                                Icons.star_rounded,
                                size: 14,
                                color: Color(0xFFFBBF24),
                              );
                            } else if (rv >= starIndex - 0.5) {
                              return const Icon(
                                Icons.star_half_rounded,
                                size: 14,
                                color: Color(0xFFFBBF24),
                              );
                            } else {
                              return const Icon(
                                Icons.star_outline_rounded,
                                size: 14,
                                color: Color(0xFFE2E8F0),
                              );
                            }
                          }),
                        ),
                        if (reviewCount != null &&
                            reviewCount.toString().isNotEmpty) ...[
                          const SizedBox(width: 5),
                          Text(
                            '($reviewCount)',
                            style: GoogleFonts.outfit(
                              fontSize: 10,
                              color: textMuted,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ],
                    ),
                  const SizedBox.shrink(),
                  const SizedBox(height: 6),
                  // Price + Cart button
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '₹${_formatPrice(product['price'] ?? 0)}',
                            style: GoogleFonts.outfit(
                              fontSize: 15,
                              fontWeight: FontWeight.w900,
                              color: textPrimary,
                            ),
                          ),
                          if (hasOriginalPrice)
                            Text(
                              '₹${_formatPrice(product['originalPrice'])}',
                              style: GoogleFonts.outfit(
                                fontSize: 10,
                                color: const Color(0xFFEF4444),
                                decoration: TextDecoration.lineThrough,
                              ),
                            ),
                        ],
                      ),
                      GestureDetector(
                        onTap: () {
                          ref
                              .read(cartProvider.notifier)
                              .addItem(
                                productId: product['id'].toString(),
                                name: product['name'] ?? '',
                                nameHindi: product['nameHindi']?.toString(),
                                price: (product['price'] as num).toDouble(),
                                mrp: hasOriginalPrice
                                    ? (product['originalPrice'] as num)
                                          .toDouble()
                                    : null,
                                image: product['image']?.toString(),
                                quantity: 1,
                              );
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                t('Added to cart'),
                                style: GoogleFonts.outfit(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              duration: const Duration(seconds: 1),
                              backgroundColor: primaryBlue,
                              behavior: SnackBarBehavior.floating,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(4),
                              ),
                              margin: const EdgeInsets.all(16),
                            ),
                          );
                        },
                        child: Container(
                          width: 34,
                          height: 34,
                          decoration: BoxDecoration(
                            color: primaryBlue,
                            borderRadius: BorderRadius.circular(10),
                            boxShadow: [
                              BoxShadow(
                                color: primaryBlue.withOpacity(0.35),
                                blurRadius: 8,
                                offset: const Offset(0, 3),
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.shopping_cart_rounded,
                            color: Colors.white,
                            size: 17,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatPrice(dynamic price) {
    if (price == null) return '0';
    final val = (price is int) ? price.toDouble() : (price as num).toDouble();
    if (val >= 100000) {
      // Show 1L, 1.07L, etc. for amounts >= 1 lakh
      final lakhs = val / 100000;
      if (lakhs >= 10) {
        return '${lakhs.toStringAsFixed(0)}L';
      } else {
        return '${lakhs.toStringAsFixed(2)}L';
      }
    }
    // Show full number for amounts below 1 lakh (e.g., 6455 instead of 6.5K)
    return val.toStringAsFixed(0);
  }

  // Checkout state for cart address + coupon
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _addr1Ctrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  final _stateCtrl = TextEditingController();
  final _pinCtrl = TextEditingController();
  List<ShippingAddress> _savedShippingAddresses = [];
  String? _selectedShippingAddressId;
  final _couponCtrl = TextEditingController();
  bool _isApplyingCoupon = false;
  String? _appliedCouponCode;
  double _appliedCouponDiscount = 0;
  double? _appliedCouponSubtotalSnapshot;
  int? _appliedCouponItemCountSnapshot;

  String get _normalizedCouponInput => _couponCtrl.text.trim().toUpperCase();

  bool _hasActiveAppliedCoupon(CartState cart) {
    return _appliedCouponCode != null &&
        _appliedCouponCode == _normalizedCouponInput &&
        _appliedCouponSubtotalSnapshot == cart.subtotal &&
        _appliedCouponItemCountSnapshot == cart.itemCount;
  }

  void _clearAppliedCouponPreview({bool clearInput = false}) {
    if (clearInput) _couponCtrl.clear();
    _appliedCouponCode = null;
    _appliedCouponDiscount = 0;
    _appliedCouponSubtotalSnapshot = null;
    _appliedCouponItemCountSnapshot = null;
  }

  Future<void> _applyCouponPreview({
    bool showSuccessToast = true,
    bool showErrorToast = true,
    bool recordRedeem = true,
  }) async {
    final t = ref.read(localeProvider.notifier).translate;
    final cart = ref.read(cartProvider);
    final couponCode = _normalizedCouponInput;
    if (_isApplyingCoupon || couponCode.isEmpty || cart.items.isEmpty) return;

    setState(() => _isApplyingCoupon = true);
    try {
      final api = ref.read(apiClientProvider);
      final response = await api.post(
        '/orders/preview-coupon',
        data: {'couponCode': couponCode},
      );
      final data = Map<String, dynamic>.from(response.data['data'] ?? {});
      final discount = (data['discount'] as num?)?.toDouble() ?? 0;
      final discountSource = (data['discountSource'] as String?) ?? 'offer';

      if (!mounted) return;
      final latestCart = ref.read(cartProvider);
      setState(() {
        _isApplyingCoupon = false;
        _appliedCouponCode = couponCode;
        _appliedCouponDiscount = discount;
        _appliedCouponSubtotalSnapshot = latestCart.subtotal;
        _appliedCouponItemCountSnapshot = latestCart.itemCount;
      });
      if (recordRedeem) {
        final user = ref.read(authProvider).user;
        final userKey = user?.id.isNotEmpty == true
            ? user!.id
            : (user?.phone ?? user?.email ?? 'guest');
        await RedeemedCouponService.redeemCoupon(
          userKey: userKey,
          code: couponCode,
          title: couponCode,
          rule: 'Applied successfully during checkout',
        );
      }
      if (showSuccessToast) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              t(
                discountSource == 'affiliate'
                    ? 'Affiliate code applied'
                    : 'Coupon applied successfully',
              ),
              style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600),
            ),
            backgroundColor: const Color(0xFF16A34A),
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
          e.response?.data?['message']?.toString() ?? t('Invalid coupon code');
      setState(() {
        _isApplyingCoupon = false;
        _clearAppliedCouponPreview();
      });
      if (showErrorToast) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              msg,
              style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600),
            ),
            backgroundColor: const Color(0xFFDC2626),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            margin: const EdgeInsets.all(16),
          ),
        );
      }
    } catch (_) {
      if (!mounted) return;
      setState(() => _isApplyingCoupon = false);
    }
  }

  Future<void> _autoReapplyCouponIfNeeded() async {
    final cart = ref.read(cartProvider);
    if (cart.items.isEmpty) {
      if (mounted) {
        setState(() => _clearAppliedCouponPreview(clearInput: true));
      }
      return;
    }

    if (_appliedCouponCode == null) return;
    if (_normalizedCouponInput != _appliedCouponCode) return;
    if (_hasActiveAppliedCoupon(cart)) return;
    if (_isApplyingCoupon) return;

    await _applyCouponPreview(
      showSuccessToast: false,
      showErrorToast: false,
      recordRedeem: false,
    );
  }

  Future<void> _updateCartQtyAndRefreshCoupon(
    String productId,
    int quantity,
  ) async {
    await ref.read(cartProvider.notifier).updateQuantity(productId, quantity);
    await _autoReapplyCouponIfNeeded();
  }

  Future<void> _removeCartItemAndRefreshCoupon(String productId) async {
    await ref.read(cartProvider.notifier).removeItem(productId);
    await _autoReapplyCouponIfNeeded();
  }

  Future<void> _loadSavedShippingAddresses() async {
    final addresses = await ShippingAddressService.getAddresses();
    final selectedId = await ShippingAddressService.getSelectedAddressId();
    if (!mounted) return;

    setState(() {
      _savedShippingAddresses = addresses;
      _selectedShippingAddressId =
          selectedId ?? (addresses.isNotEmpty ? addresses.first.id : null);
    });

    final selected = _getSelectedShippingAddress();
    if (selected != null) {
      _setAddressControllersFromMap(selected.toOrderPayload());
    }
  }

  ShippingAddress? _getSelectedShippingAddress() {
    if (_savedShippingAddresses.isEmpty) return null;
    return _savedShippingAddresses.firstWhere(
      (a) => a.id == _selectedShippingAddressId,
      orElse: () => _savedShippingAddresses.first,
    );
  }

  void _setAddressControllersFromMap(Map<String, String> address) {
    _nameCtrl.text = address['fullName'] ?? '';
    _phoneCtrl.text = address['phone'] ?? '';
    _addr1Ctrl.text = address['addressLine1'] ?? '';
    _cityCtrl.text = address['city'] ?? '';
    _stateCtrl.text = address['state'] ?? '';
    _pinCtrl.text = address['pincode'] ?? '';
  }

  Future<bool> _openCartAddressBottomSheet() async {
    final auth = ref.read(authProvider);
    final t = ref.read(localeProvider.notifier).translate;
    final fk = GlobalKey<FormState>();

    final selected = _getSelectedShippingAddress();
    final initial =
        selected?.toOrderPayload() ??
        {
          'fullName': _nameCtrl.text.isNotEmpty
              ? _nameCtrl.text
              : (auth.user?.name ?? ''),
          'phone': _phoneCtrl.text.isNotEmpty
              ? _phoneCtrl.text
              : (auth.user?.phone ?? ''),
          'addressLine1': _addr1Ctrl.text,
          'city': _cityCtrl.text,
          'state': _stateCtrl.text,
          'pincode': _pinCtrl.text,
        };

    final nameC = TextEditingController(text: initial['fullName'] ?? '');
    final phoneC = TextEditingController(text: initial['phone'] ?? '');
    final addr1C = TextEditingController(text: initial['addressLine1'] ?? '');
    final cityC = TextEditingController(text: initial['city'] ?? '');
    final stateC = TextEditingController(text: initial['state'] ?? '');
    final pinC = TextEditingController(text: initial['pincode'] ?? '');

    String? selectedId = _selectedShippingAddressId;

    final address = await showModalBottomSheet<Map<String, String>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Container(
          margin: EdgeInsets.only(top: MediaQuery.of(ctx).padding.top + 40),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Padding(
            padding: EdgeInsets.fromLTRB(
              20,
              16,
              20,
              MediaQuery.of(ctx).viewInsets.bottom + 20,
            ),
            child: Form(
              key: fk,
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 5,
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: borderLight,
                          borderRadius: BorderRadius.circular(100),
                        ),
                      ),
                    ),
                    Text(
                      t('Shipping Address'),
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: textPrimary,
                      ),
                    ),
                    if (_savedShippingAddresses.isNotEmpty) ...[
                      const SizedBox(height: 14),
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: _savedShippingAddresses.map((a) {
                            final active = selectedId == a.id;
                            return Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: ChoiceChip(
                                label: Text(
                                  '${a.fullName} • ${a.shortAddress}',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: active ? Colors.white : textPrimary,
                                  ),
                                ),
                                selected: active,
                                onSelected: (_) {
                                  setSheetState(() => selectedId = a.id);
                                  nameC.text = a.fullName;
                                  phoneC.text = a.phone;
                                  addr1C.text = a.addressLine1;
                                  cityC.text = a.city;
                                  stateC.text = a.state;
                                  pinC.text = a.pincode;
                                },
                                selectedColor: primaryBlue,
                                backgroundColor: const Color(0xFFF1F5F9),
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    ],
                    const SizedBox(height: 16),
                    _addrField(t('Full Name'), nameC),
                    const SizedBox(height: 12),
                    _addrField(
                      t('Phone'),
                      phoneC,
                      keyboard: TextInputType.phone,
                    ),
                    const SizedBox(height: 12),
                    _addrField(t('Address Line 1'), addr1C),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(child: _addrField(t('City'), cityC)),
                        const SizedBox(width: 12),
                        Expanded(child: _addrField(t('State'), stateC)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _addrField(
                      t('Pincode'),
                      pinC,
                      keyboard: TextInputType.number,
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: () {
                          if (!fk.currentState!.validate()) return;
                          Navigator.of(ctx).pop({
                            'id': selectedId ?? ShippingAddress.generateId(),
                            'fullName': nameC.text.trim(),
                            'phone': phoneC.text.trim(),
                            'addressLine1': addr1C.text.trim(),
                            'city': cityC.text.trim(),
                            'state': stateC.text.trim(),
                            'pincode': pinC.text.trim(),
                          });
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: primaryBlue,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: Text(
                          t('Save Address'),
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 15,
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
        ),
      ),
    );

    // Let modal route teardown complete before touching state/navigation.
    await Future<void>.delayed(Duration.zero);
    await WidgetsBinding.instance.endOfFrame;

    if (address == null || !mounted) return false;

    final savedAddress = ShippingAddress(
      id: address['id'] ?? ShippingAddress.generateId(),
      fullName: address['fullName'] ?? '',
      phone: address['phone'] ?? '',
      addressLine1: address['addressLine1'] ?? '',
      city: address['city'] ?? '',
      state: address['state'] ?? '',
      pincode: address['pincode'] ?? '',
      slot: '',
    );

    await ShippingAddressService.upsertAddress(savedAddress);
    await ShippingAddressService.setSelectedAddressId(savedAddress.id);
    await _loadSavedShippingAddresses();
    _setAddressControllersFromMap(savedAddress.toOrderPayload());
    return true;
  }

  Future<void> _proceedToCheckout() async {
    if (!ref.read(authProvider).isAuthenticated) {
      await _showCheckoutLoginRequiredPopup();
      return;
    }

    final cart = ref.read(cartProvider);
    final hasActiveCoupon = _hasActiveAppliedCoupon(cart);
    final typedCoupon = _normalizedCouponInput;
    final t = ref.read(localeProvider.notifier).translate;
    if (typedCoupon.isNotEmpty && !hasActiveCoupon) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            t('Tap Apply to use this coupon'),
            style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600),
          ),
          backgroundColor: const Color(0xFFF59E0B),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          margin: const EdgeInsets.all(16),
        ),
      );
      return;
    }

    // Validate stock before opening address sheet
    setState(() => _isCheckingOut = true);
    final result = await ref.read(cartProvider.notifier).validateStock();
    if (!mounted) return;
    setState(() => _isCheckingOut = false);

    final bool valid = result['valid'] ?? true;
    if (!valid) {
      final issues = ((result['issues'] as List<dynamic>?) ?? [])
          .cast<Map<String, dynamic>>();
      _showStockIssueSnackbar(issues);
      return;
    }

    final saved = await _openCartAddressBottomSheet();
    if (!saved || !mounted) return;
    await Future<void>.delayed(Duration.zero);
    await WidgetsBinding.instance.endOfFrame;
    if (!mounted) return;
    await _confirmAndPay();
  }

  void _showStockIssueSnackbar(List<Map<String, dynamic>> issues) {
    final t = ref.read(localeProvider.notifier).translate;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              t('Cannot proceed — stock issues:'),
              style: GoogleFonts.plusJakartaSans(
                fontWeight: FontWeight.w700,
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 4),
            ...issues.map(
              (i) => Padding(
                padding: const EdgeInsets.only(bottom: 2),
                child: Text(
                  '• ${i['message'] ?? t('Stock issue')}',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ),
          ],
        ),
        backgroundColor: const Color(0xFFDC2626),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 4),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  Future<void> _confirmAndPay() async {
    final t = ref.read(localeProvider.notifier).translate;
    final cart = ref.read(cartProvider);
    final hasActiveCoupon = _hasActiveAppliedCoupon(cart);

    final address = {
      'fullName': _nameCtrl.text.trim(),
      'phone': _phoneCtrl.text.trim(),
      'addressLine1': _addr1Ctrl.text.trim(),
      'city': _cityCtrl.text.trim(),
      'state': _stateCtrl.text.trim(),
      'pincode': _pinCtrl.text.trim(),
    };

    setState(() {
      _isCheckingOut = true;
    });
    try {
      final api = ref.read(apiClientProvider);
      final payload = <String, dynamic>{'shippingAddress': address};
      if (hasActiveCoupon && _appliedCouponCode != null) {
        payload['couponCode'] = _appliedCouponCode;
      }
      final response = await api.post('/orders', data: payload);

      if (!mounted) return;
      setState(() => _isCheckingOut = false);

      if (response.data['success'] == true) {
        final orderId = response.data['data']['orderId'].toString();
        _clearAppliedCouponPreview(clearInput: true);
        ref.read(cartProvider.notifier).clearCart();
        await Future.delayed(const Duration(milliseconds: 100));
        if (mounted) context.push('/payment/$orderId');
      }
    } on DioException catch (e) {
      if (!mounted) return;
      setState(() => _isCheckingOut = false);
      if (e.response?.statusCode == 401) {
        await _showCheckoutLoginRequiredPopup();
        return;
      }
      final data = e.response?.data;
      final map = data is Map ? data : null;
      final error = map?['error'];
      final errorMap = error is Map ? error : null;
      var msg =
          map?['message']?.toString() ??
          errorMap?['message']?.toString() ??
          e.message ??
          t('Checkout failed');
      if (e.type == DioExceptionType.connectionError ||
          msg.contains('No route to host') ||
          msg.contains('Connection refused')) {
        msg =
            'Cannot reach server. Check backend is running and API URL in api_config.dart.';
      }
      // If it's a stock issue from the server, refresh cart to show updated stock
      final code = map?['code']?.toString() ?? errorMap?['code']?.toString();
      if (code == 'INSUFFICIENT_STOCK') {
        ref.read(cartProvider.notifier).fetchCart();
        ref.read(cartProvider.notifier).validateStock();
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            msg,
            style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600),
          ),
          backgroundColor: const Color(0xFFDC2626),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          margin: const EdgeInsets.all(16),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _isCheckingOut = false);
    }
  }

  Future<void> _showCheckoutLoginRequiredPopup() async {
    if (!mounted) return;
    if (ref.read(authProvider).isAuthenticated) return;

    final shouldOpenLogin = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Login Required'),
          content: const Text(
            'You can add products to cart and view them, but login is required to buy.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Not now'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: const Text('Login'),
            ),
          ],
        );
      },
    );

    if (!mounted) return;
    if (shouldOpenLogin == true) {
      context.push('/login');
    }
  }

  Future<void> _proceedToNegotiationOrder(String negotiationId) async {
    final auth = ref.read(authProvider);
    final nameC = TextEditingController(text: auth.user?.name ?? '');
    final phoneC = TextEditingController(text: auth.user?.phone ?? '');
    final addr1C = TextEditingController();
    final cityC = TextEditingController();
    final stateC = TextEditingController();
    final pinC = TextEditingController();
    final fk = GlobalKey<FormState>();
    final t = ref.read(localeProvider.notifier).translate;

    final address = await showModalBottomSheet<Map<String, String>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        margin: EdgeInsets.only(top: MediaQuery.of(ctx).padding.top + 40),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Padding(
          padding: EdgeInsets.fromLTRB(
            20,
            16,
            20,
            MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: Form(
            key: fk,
            child: SingleChildScrollView(
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
                        color: borderLight,
                        borderRadius: BorderRadius.circular(100),
                      ),
                    ),
                  ),
                  Text(
                    t('Shipping Address'),
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: textPrimary,
                    ),
                  ),
                  const SizedBox(height: 20),
                  _addrField(t('Full Name'), nameC),
                  const SizedBox(height: 12),
                  _addrField(t('Phone'), phoneC, keyboard: TextInputType.phone),
                  const SizedBox(height: 12),
                  _addrField(t('Address Line 1'), addr1C),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: _addrField(t('City'), cityC)),
                      const SizedBox(width: 12),
                      Expanded(child: _addrField(t('State'), stateC)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _addrField(
                    t('Pincode'),
                    pinC,
                    keyboard: TextInputType.number,
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: () {
                        if (fk.currentState!.validate()) {
                          Navigator.of(ctx).pop({
                            'fullName': nameC.text.trim(),
                            'phone': phoneC.text.trim(),
                            'addressLine1': addr1C.text.trim(),
                            'city': cityC.text.trim(),
                            'state': stateC.text.trim(),
                            'pincode': pinC.text.trim(),
                          });
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF16A34A),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        t('Confirm & Proceed'),
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 16,
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
      ),
    );

    nameC.dispose();
    phoneC.dispose();
    addr1C.dispose();
    cityC.dispose();
    stateC.dispose();
    pinC.dispose();

    if (address == null || !mounted) return;

    try {
      final api = ref.read(apiClientProvider);
      final response = await api.post(
        '/orders/from-negotiation',
        data: {'negotiationId': negotiationId, 'shippingAddress': address},
      );

      if (!mounted) return;
      if (response.data['success'] == true) {
        final orderId = response.data['data']['orderId'].toString();
        context.push('/payment/$orderId');
      }
    } on DioException catch (e) {
      if (!mounted) return;
      final msg =
          e.response?.data?['message']?.toString() ??
          t('Failed to create order');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            msg,
            style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600),
          ),
          backgroundColor: const Color(0xFFDC2626),
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
          content: Text(
            'Error: $e',
            style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600),
          ),
          backgroundColor: const Color(0xFFDC2626),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          margin: const EdgeInsets.all(16),
        ),
      );
    }
  }

  Widget _addrField(
    String label,
    TextEditingController ctrl, {
    TextInputType? keyboard,
  }) {
    return TextFormField(
      controller: ctrl,
      keyboardType: keyboard,
      validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
      style: GoogleFonts.plusJakartaSans(fontSize: 14),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: GoogleFonts.plusJakartaSans(
          fontSize: 14,
          color: textSecondary,
        ),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 14,
          vertical: 14,
        ),
      ),
    );
  }

  Widget _buildPromoBannerCarousel() {
    if (_isLoadingPromoBanners) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Shimmer.fromColors(
          baseColor: Colors.grey[300]!,
          highlightColor: Colors.grey[100]!,
          child: Container(
            height: 160,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
            ),
          ),
        ),
      );
    }
    if (_promoBanners.isEmpty) return const SizedBox.shrink();
    final t = ref.read(localeProvider.notifier).translate;
    return Column(
      children: [
        SizedBox(
          height: 160,
          child: PageView.builder(
            controller: _promoBannerController,
            itemCount: _promoBanners.length,
            physics: const ClampingScrollPhysics(),
            onPageChanged: (i) => setState(() => _currentPromoBannerIndex = i),
            itemBuilder: (context, index) {
              final banner = _promoBanners[index];
              final linkUrl = banner['linkUrl'] ?? '';
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: GestureDetector(
                  onTap: () => _handleBannerTap(linkUrl),
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 15,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(24),
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          CachedNetworkImage(
                            imageUrl: banner['imageUrl'] ?? '',
                            fit: BoxFit.cover,
                            placeholder: (_, __) => Container(
                              color: primaryBlue.withOpacity(0.05),
                              child: const Center(
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              ),
                            ),
                            errorWidget: (_, __, ___) => Container(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    primaryBlue.withOpacity(0.1),
                                    primaryBlue.withOpacity(0.2),
                                  ],
                                ),
                              ),
                              child: const Center(
                                child: Icon(
                                  Icons.image_not_supported_outlined,
                                  color: textMuted,
                                ),
                              ),
                            ),
                          ),
                          // Text Content Overlay
                          Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.centerLeft,
                                end: Alignment.centerRight,
                                colors: [
                                  Colors.black.withOpacity(0.7),
                                  Colors.transparent,
                                ],
                              ),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(20),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  if (banner['tag'] != null &&
                                      banner['tag'].isNotEmpty)
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 4,
                                      ),
                                      margin: const EdgeInsets.only(bottom: 8),
                                      decoration: BoxDecoration(
                                        color: Colors.white24,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        banner['tag'],
                                        style: GoogleFonts.plusJakartaSans(
                                          fontSize: 9,
                                          fontWeight: FontWeight.w800,
                                          color: Colors.white,
                                          letterSpacing: 0.8,
                                        ),
                                      ),
                                    ),
                                  if (banner['title'] != null &&
                                      banner['title'].isNotEmpty)
                                    Text(
                                      banner['title'],
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 20,
                                        fontWeight: FontWeight.w900,
                                        color: Colors.white,
                                        height: 1.1,
                                        letterSpacing: -0.5,
                                      ),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  if (banner['subtitle'] != null &&
                                      banner['subtitle'].isNotEmpty)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 4),
                                      child: Text(
                                        banner['subtitle'],
                                        style: GoogleFonts.plusJakartaSans(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w500,
                                          color: Colors.white.withOpacity(0.9),
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  const SizedBox(height: 12),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 16,
                                      vertical: 8,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(
                                          banner['buttonText'] ?? t('Shop Now'),
                                          style: GoogleFonts.plusJakartaSans(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w800,
                                            color: primaryBlue,
                                          ),
                                        ),
                                        _getBannerIcon(
                                          banner['buttonIcon'],
                                          primaryBlue,
                                          14,
                                        ),
                                      ],
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
            },
          ),
        ),
        if (_promoBanners.length > 1) ...[
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              _promoBanners.length,
              (index) => AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                margin: const EdgeInsets.symmetric(horizontal: 4),
                width: _currentPromoBannerIndex == index ? 20 : 6,
                height: 6,
                decoration: BoxDecoration(
                  color: _currentPromoBannerIndex == index
                      ? primaryBlue
                      : primaryBlue.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _getBannerIcon(String? iconName, Color color, double size) {
    if (iconName == 'none') {
      return const SizedBox.shrink();
    }

    String effectiveIcon = (iconName == null || iconName.trim().isEmpty)
        ? 'arrowright'
        : iconName.toLowerCase().trim();

    IconData iconData;
    switch (effectiveIcon) {
      case 'arrowright':
      case 'moveright':
      case 'chevronright':
        iconData = HugeIcons.strokeRoundedArrowRight01;
        break;
      case 'arrowupright':
        iconData = HugeIcons.strokeRoundedArrowUpRight01;
        break;
      case 'shoppingcart':
      case 'shoppingcart01icon':
        iconData = HugeIcons.strokeRoundedShoppingCart01;
        break;
      case 'externallink':
        iconData = HugeIcons.strokeRoundedLink01;
        break;
      case 'play':
      case 'playcircle':
        iconData = HugeIcons.strokeRoundedPlay;
        break;
      case 'eye':
        iconData = HugeIcons.strokeRoundedView;
        break;
      case 'info':
        iconData = HugeIcons.strokeRoundedInformationCircle;
        break;
      case 'package':
        iconData = HugeIcons.strokeRoundedPackage;
        break;
      case 'arrowrightcircle':
        iconData = HugeIcons.strokeRoundedArrowRight01;
        break;
      case 'heart':
        iconData = HugeIcons.strokeRoundedFavourite;
        break;
      case 'star':
        iconData = HugeIcons.strokeRoundedStar;
        break;
      case 'home':
        iconData = HugeIcons.strokeRoundedHome01;
        break;
      case 'user':
        iconData = HugeIcons.strokeRoundedUser;
        break;
      case 'settings':
        iconData = HugeIcons.strokeRoundedSettings01;
        break;
      case 'bell':
        iconData = HugeIcons.strokeRoundedNotification01;
        break;
      case 'check':
      case 'checkcircle':
        iconData = HugeIcons.strokeRoundedCheckmarkCircle01;
        break;
      case 'x':
      case 'xcircle':
        iconData = HugeIcons.strokeRoundedCancel01;
        break;
      case 'phone':
        iconData = HugeIcons.strokeRoundedCall;
        break;
      case 'mail':
        iconData = HugeIcons.strokeRoundedMail01;
        break;
      case 'plus':
        iconData = HugeIcons.strokeRoundedPlusSign;
        break;
      case 'minus':
        iconData = HugeIcons.strokeRoundedMinusSign;
        break;
      case 'lock':
      case 'unlock':
        iconData = HugeIcons.strokeRoundedSettings01; // Closer safe mapping
        break;
      case 'trash':
        iconData = HugeIcons.strokeRoundedDelete01;
        break;
      case 'search':
      case 'search01icon':
        iconData = HugeIcons.strokeRoundedSearch01;
        break;
      case 'calendar':
      case 'calendar01icon':
        iconData = HugeIcons.strokeRoundedCalendar01;
        break;
      case 'camera':
      case 'camera01icon':
        iconData = HugeIcons.strokeRoundedCamera01;
        break;
      case 'share':
      case 'share01icon':
        iconData = HugeIcons.strokeRoundedShare01;
        break;
      case 'download':
      case 'download01icon':
        iconData = HugeIcons.strokeRoundedDownload01;
        break;
      case 'upload':
      case 'upload01icon':
        iconData = HugeIcons.strokeRoundedUpload01;
        break;
      case 'tag':
      case 'tag01icon':
        iconData = HugeIcons.strokeRoundedTag01;
        break;
      case 'ticket':
      case 'ticket01icon':
        iconData = HugeIcons.strokeRoundedTicket01;
        break;
      case 'store':
      case 'store01icon':
        iconData = HugeIcons.strokeRoundedStore01;
        break;
      case 'gift':
      case 'gifticon':
        iconData = HugeIcons.strokeRoundedGift;
        break;
      case 'flash':
      case 'zap':
      case 'flashicon':
        iconData = HugeIcons.strokeRoundedFlash;
        break;
      case 'badgepercent':
      case 'percent':
      case 'percent01icon':
        iconData =
            HugeIcons.strokeRoundedCoins01; // Fallback for percent-like icon
        break;
      case 'shoppingbag':
      case 'shoppingbag01icon':
        iconData = HugeIcons.strokeRoundedShoppingBag01;
        break;
      case 'truck':
      case 'deliverybox01icon':
        iconData = HugeIcons.strokeRoundedDeliveryBox01;
        break;
      case 'creditcard':
      case 'creditcardicon':
        iconData = HugeIcons.strokeRoundedCreditCard;
        break;
      case 'arrowright':
      case 'arrowright01icon':
        iconData = HugeIcons.strokeRoundedArrowRight01;
        break;
      case 'sparkles':
      case 'sparklesicon':
        iconData = HugeIcons.strokeRoundedSparkles;
        break;
      default:
        iconData = HugeIcons.strokeRoundedArrowRight01;
    }

    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Icon(iconData, color: color, size: size),
    );
  }

  Widget _buildWhyBuySection() {
    final t = ref.read(localeProvider.notifier).translate;
    final items = [
      {
        'icon': Icons.verified_rounded,
        'color': const Color(0xFF2563EB),
        'bg': const Color(0xFFEFF6FF),
        'title': t('Premium Quality'),
        'subtitle': t('Certified products'),
      },
      {
        'icon': Icons.local_offer_rounded,
        'color': const Color(0xFF7C3AED),
        'bg': const Color(0xFFF5F3FF),
        'title': t('Bulk Pricing'),
        'subtitle': t('Best wholesale rates'),
      },
      {
        'icon': Icons.local_shipping_rounded,
        'color': const Color(0xFF0891B2),
        'bg': const Color(0xFFECFEFF),
        'title': t('Fast Delivery'),
        'subtitle': t('Pan-India shipping'),
      },
      {
        'icon': Icons.support_agent_rounded,
        'color': const Color(0xFF16A34A),
        'bg': const Color(0xFFF0FDF4),
        'title': t('24/7 Support'),
        'subtitle': t('Always here to help'),
      },
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(30),
          border: Border.all(color: borderLight),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          children: [
            Text(
              t('Why Buy From Us?'),
              style: GoogleFonts.plusJakartaSans(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: textPrimary,
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(child: _buildWhyBuyItem(items[0])),
                const SizedBox(width: 16),
                Expanded(child: _buildWhyBuyItem(items[1])),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: _buildWhyBuyItem(items[2])),
                const SizedBox(width: 16),
                Expanded(child: _buildWhyBuyItem(items[3])),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWhyBuyItem(Map<String, dynamic> item) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: (item['bg'] as Color).withOpacity(0.5),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            item['icon'] as IconData,
            color: item['color'] as Color,
            size: 28,
          ),
          const SizedBox(height: 12),
          Text(
            item['title'] as String,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: textPrimary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            item['subtitle'] as String,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 12,
              color: textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReferralBanner() {
    final t = ref.watch(localeProvider.notifier).translate;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: GestureDetector(
        onTap: () => context.push('/referral'),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: Image.asset(
            'assets/images/referral_banner.png',
            width: double.infinity,
            height: 160,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) {
              return Container(
                height: 160,
                width: double.infinity,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF008E46), Color(0xFF00C853)],
                  ),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Center(
                  child: Text(
                    t('REFERRAL PROGRAM'),
                    style: GoogleFonts.plusJakartaSans(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildReviewSection() {
    final t = ref.watch(localeProvider.notifier).translate;

    if (_isLoadingReviews && _dynamicReviews.isEmpty) {
      return const SizedBox.shrink();
    }

    final reviews = _dynamicReviews.isNotEmpty
        ? _dynamicReviews
        : [
            {
              'name': 'Rajesh Kumar',
              'role': 'Progressive Farmer, Punjab',
              'review':
                  'OXON has completely changed how I source my tools. The bulk pricing and quality are unbeatable for my 50-acre farm.',
              'rating': 5.0,
            },
            {
              'name': 'Priya Sharma',
              'role': 'Agri-Retailer, Delhi',
              'review':
                  "As a retailer, I need reliable delivery and authentic brands. OXON's pan-India service is a lifesaver for my business.",
              'rating': 5.0,
            },
            {
              'name': 'Amit Patel',
              'role': 'Wholesale Distributor, Gujarat',
              'review':
                  "I've been using OXON for a year now. It has greatly simplified how I manage large orders and track inventory.",
              'rating': 4.5,
            },
            {
              'name': 'Anjali Singh',
              'role': 'Organic Farm Owner, UP',
              'review':
                  "The variety of premium seeds and modern irrigation tools on OXON is impressive. Truly a one-stop shop for modern farming.",
              'rating': 5.0,
            },
          ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    t('Voices of Trust'),
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: primaryBlue,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    t('What Our Customers Say'),
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: textPrimary,
                      letterSpacing: -0.5,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: primaryBlue.withOpacity(0.05),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.format_quote_rounded,
                  color: primaryBlue,
                  size: 24,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.only(left: 24, right: 8, bottom: 20),
          physics: const BouncingScrollPhysics(),
          child: Row(
            children: reviews
                .map(
                  (review) => _buildReviewCard(
                    Map<String, String>.from({
                      'name': t(review['name'].toString()),
                      'role': t(review['role'].toString()),
                      'review': t(review['review'].toString()),
                      'rating': review['rating'].toString(),
                    }),
                  ),
                )
                .toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildReviewCard(Map<String, String> review) {
    return Container(
      width: 310,
      margin: const EdgeInsets.only(right: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(32),
        child: Stack(
          children: [
            Positioned(
              top: -20,
              right: -20,
              child: Icon(
                Icons.format_quote_rounded,
                size: 100,
                color: Colors.black.withOpacity(0.03),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 52,
                        height: 52,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: LinearGradient(
                            colors: [primaryBlue, primaryBlue.withOpacity(0.7)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: primaryBlue.withOpacity(0.2),
                              blurRadius: 8,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Center(
                          child: Text(
                            review['name']!.substring(0, 1).toUpperCase(),
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 20,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    review['name']!,
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w800,
                                      color: textPrimary,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 4),
                                const Icon(
                                  Icons.verified_rounded,
                                  color: Color(0xFF10B981),
                                  size: 16,
                                ),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              review['role']!,
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 13,
                                color: textMuted,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      ...List.generate(5, (index) {
                        double rating = double.parse(review['rating']!);
                        if (index < rating.floor()) {
                          return const Icon(
                            Icons.star_rounded,
                            color: Color(0xFFF59E0B),
                            size: 18,
                          );
                        } else if (index < rating) {
                          return const Icon(
                            Icons.star_half_rounded,
                            color: Color(0xFFF59E0B),
                            size: 18,
                          );
                        } else {
                          return const Icon(
                            Icons.star_outline_rounded,
                            color: Color(0xFFE2E8F0),
                            size: 18,
                          );
                        }
                      }),
                      const SizedBox(width: 8),
                      Text(
                        review['rating']!,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: textPrimary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    review['review']!,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 15,
                      color: textSecondary.withOpacity(0.9),
                      height: 1.6,
                      fontWeight: FontWeight.w500,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomNav() {
    final t = ref.read(localeProvider.notifier).translate;
    return Container(
      decoration: BoxDecoration(
        color: surfaceWhite,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          child: Row(
            children: _isWholesaler
                ? [
                    _buildNavItem(HugeIcons.strokeRoundedHome01, t('Home'), 0),
                    _buildNavItem(
                      HugeIcons.strokeRoundedSearch01,
                      t('Search'),
                      1,
                    ),
                    _buildNavItem(
                      HugeIcons.strokeRoundedDashboardSquare01,
                      t('Categories'),
                      2,
                    ),
                    _buildCartNavItem(3),
                    _buildNavItem(
                      HugeIcons.strokeRoundedHandGrip,
                      t('Negotiate'),
                      4,
                    ),
                    _buildNavItem(HugeIcons.strokeRoundedUser, t('Profile'), 5),
                  ]
                : [
                    _buildNavItem(HugeIcons.strokeRoundedHome01, t('Home'), 0),
                    _buildNavItem(
                      HugeIcons.strokeRoundedSearch01,
                      t('Search'),
                      1,
                    ),
                    _buildNavItem(
                      HugeIcons.strokeRoundedDashboardSquare01,
                      t('Categories'),
                      2,
                    ),
                    _buildCartNavItem(3),
                    _buildNavItem(HugeIcons.strokeRoundedUser, t('Profile'), 4),
                  ],
          ),
        ),
      ),
    );
  }

  Widget _buildCartNavItem(int index) {
    final isSelected = _selectedNavIndex == index;
    final cart = ref.watch(cartProvider);
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedNavIndex = index),
        behavior: HitTestBehavior.opaque,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeInOut,
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: Colors.transparent,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  AnimatedScale(
                    scale: isSelected ? 1.15 : 1.0,
                    duration: const Duration(milliseconds: 250),
                    curve: Curves.easeOutBack,
                    child: HugeIcon(
                      icon: HugeIcons.strokeRoundedShoppingCart01,
                      color: isSelected ? primaryBlue : textMuted,
                      size: 24,
                    ),
                  ),
                  if (cart.itemCount > 0)
                    Positioned(
                      right: -8,
                      top: -6,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: Color(0xFFEF4444),
                          shape: BoxShape.circle,
                        ),
                        constraints: const BoxConstraints(
                          minWidth: 18,
                          minHeight: 18,
                        ),
                        child: Text(
                          '${cart.itemCount}',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 4),
              AnimatedDefaultTextStyle(
                duration: const Duration(milliseconds: 200),
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 10,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                  color: isSelected ? primaryBlue : textMuted,
                ),
                child: const Text('Cart'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(IconData icon, String label, int index) {
    final isSelected = _selectedNavIndex == index;

    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedNavIndex = index),
        behavior: HitTestBehavior.opaque,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeInOut,
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: Colors.transparent,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedScale(
                scale: isSelected ? 1.15 : 1.0,
                duration: const Duration(milliseconds: 250),
                curve: Curves.easeOutBack,
                child: HugeIcon(
                  icon: icon,
                  color: isSelected ? primaryBlue : textMuted,
                  size: 24,
                ),
              ),
              const SizedBox(height: 4),
              AnimatedDefaultTextStyle(
                duration: const Duration(milliseconds: 200),
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 10,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                  color: isSelected ? primaryBlue : textMuted,
                ),
                child: Text(label),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════
// TRUST BADGE MARQUEE (auto-scrolling strip)
// ══════════════════════════════════════════
class _TrustBadgeMarquee extends StatefulWidget {
  final List<Map<String, dynamic>> items;
  final bool isActive;
  const _TrustBadgeMarquee({required this.items, required this.isActive});

  @override
  State<_TrustBadgeMarquee> createState() => _TrustBadgeMarqueeState();
}

class _TrustBadgeMarqueeState extends State<_TrustBadgeMarquee> {
  late final ScrollController _scrollController;
  bool _isAutoScrolling = false;

  static const Color _blue = Color(0xFF2563EB);
  static const Color _txtSec = Color(0xFF64748B);

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (widget.isActive) _startScroll();
    });
  }

  @override
  void didUpdateWidget(covariant _TrustBadgeMarquee oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isActive && !oldWidget.isActive) {
      _startScroll();
      return;
    }
    if (!widget.isActive && oldWidget.isActive) {
      _isAutoScrolling = false;
    }
  }

  void _startScroll() {
    if (_isAutoScrolling) return;
    _isAutoScrolling = true;
    _autoScrollLoop();
  }

  Future<void> _autoScrollLoop() async {
    while (mounted && _isAutoScrolling) {
      if (!widget.isActive) break;
      if (!_scrollController.hasClients) {
        await Future<void>.delayed(const Duration(milliseconds: 250));
        continue;
      }

      final max = _scrollController.position.maxScrollExtent;
      if (max <= 0) {
        await Future<void>.delayed(const Duration(milliseconds: 600));
        continue;
      }

      final remaining = (max - _scrollController.offset).clamp(0.0, max);
      if (remaining <= 1) {
        _scrollController.jumpTo(0);
        await Future<void>.delayed(const Duration(milliseconds: 180));
        continue;
      }

      // Smooth GPU-driven animation is cheaper than a 30ms jumpTo timer loop.
      final durationMs = (remaining * 18).clamp(900, 7000).toInt();
      try {
        await _scrollController.animateTo(
          max,
          duration: Duration(milliseconds: durationMs),
          curve: Curves.linear,
        );
      } catch (_) {
        break;
      }

      if (!mounted || !_isAutoScrolling) break;
      if (_scrollController.hasClients) {
        _scrollController.jumpTo(0);
      }
      await Future<void>.delayed(const Duration(milliseconds: 180));
    }
  }

  @override
  void dispose() {
    _isAutoScrolling = false;
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 48,
      color: _blue.withOpacity(0.04),
      child: ListView.builder(
        controller: _scrollController,
        scrollDirection: Axis.horizontal,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: widget.items.length,
        itemBuilder: (_, i) {
          final item = widget.items[i];
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

// ── Helpers for ticket-style offer cards ──────────────────────────────────────

class _PartnershipMarquee extends StatefulWidget {
  final List<Map<String, dynamic>> items;
  final bool isActive;
  const _PartnershipMarquee({required this.items, required this.isActive});

  @override
  State<_PartnershipMarquee> createState() => _PartnershipMarqueeState();
}

class _PartnershipMarqueeState extends State<_PartnershipMarquee> {
  late final ScrollController _scrollController;
  bool _isAutoScrolling = false;

  static const Color _blue = Color(0xFF2563EB);
  static const Color _txtSec = Color(0xFF64748B);

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (widget.isActive) _startScroll();
    });
  }

  @override
  void didUpdateWidget(covariant _PartnershipMarquee oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isActive && !oldWidget.isActive) {
      _startScroll();
      return;
    }
    if (!widget.isActive && oldWidget.isActive) {
      _isAutoScrolling = false;
    }
  }

  void _startScroll() {
    if (_isAutoScrolling) return;
    _isAutoScrolling = true;
    _autoScrollLoop();
  }

  Future<void> _autoScrollLoop() async {
    while (mounted && _isAutoScrolling) {
      if (!widget.isActive) break;
      if (!_scrollController.hasClients) {
        await Future<void>.delayed(const Duration(milliseconds: 250));
        continue;
      }

      final max = _scrollController.position.maxScrollExtent;
      if (max <= 0) {
        await Future<void>.delayed(const Duration(milliseconds: 600));
        continue;
      }

      final remaining = (max - _scrollController.offset).clamp(0.0, max);
      if (remaining <= 1) {
        _scrollController.jumpTo(0);
        await Future<void>.delayed(const Duration(milliseconds: 180));
        continue;
      }

      final durationMs = (remaining * 18).clamp(900, 7000).toInt();
      try {
        await _scrollController.animateTo(
          max,
          duration: Duration(milliseconds: durationMs),
          curve: Curves.linear,
        );
      } catch (_) {
        break;
      }

      if (!mounted || !_isAutoScrolling) break;
      if (_scrollController.hasClients) {
        _scrollController.jumpTo(0);
      }
      await Future<void>.delayed(const Duration(milliseconds: 180));
    }
  }

  @override
  void dispose() {
    _isAutoScrolling = false;
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      controller: _scrollController,
      scrollDirection: Axis.horizontal,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: widget.items.length,
      itemBuilder: (_, i) {
        final item = widget.items[i];
        final imagePath = item['image'] as String?;
        final icon = item['icon'] as IconData?;
        final label = (item['label'] ?? '') as String;

        return Container(
          margin: const EdgeInsets.only(right: 10),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (imagePath != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: Image.asset(
                    imagePath,
                    width: 20,
                    height: 20,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) =>
                        Icon(Icons.handshake_outlined, size: 16, color: _blue),
                  ),
                )
              else if (icon != null)
                Icon(icon, size: 16, color: _blue)
              else
                Icon(Icons.handshake_outlined, size: 16, color: _blue),
              const SizedBox(width: 6),
              Text(
                label,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: _txtSec,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _TicketClipper extends CustomClipper<Path> {
  const _TicketClipper();

  @override
  Path getClip(Size size) {
    const double r = 20.0; // corner radius
    const double cr = 13.0; // cutout radius
    final double cy = size.height * 0.65; // cutout Y position

    final path = Path()
      ..moveTo(r, 0)
      ..lineTo(size.width - r, 0)
      ..quadraticBezierTo(size.width, 0, size.width, r)
      ..lineTo(size.width, cy - cr)
      ..arcToPoint(
        Offset(size.width, cy + cr),
        radius: const Radius.circular(cr),
        clockwise: false,
      )
      ..lineTo(size.width, size.height - r)
      ..quadraticBezierTo(size.width, size.height, size.width - r, size.height)
      ..lineTo(r, size.height)
      ..quadraticBezierTo(0, size.height, 0, size.height - r)
      ..lineTo(0, cy + cr)
      ..arcToPoint(
        Offset(0, cy - cr),
        radius: const Radius.circular(cr),
        clockwise: false,
      )
      ..lineTo(0, r)
      ..quadraticBezierTo(0, 0, r, 0)
      ..close();
    return path;
  }

  @override
  bool shouldReclip(_TicketClipper oldClipper) => false;
}

class _DashedLinePainter extends CustomPainter {
  const _DashedLinePainter();

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF94A3B8)
      ..style = PaintingStyle.fill;

    const double dw = 9.0;
    const double ds = 5.0;
    const double dh = 2.5;
    double x = 18.0;
    final double cy = size.height / 2;

    while (x < size.width - 18) {
      canvas.drawRRect(
        RRect.fromLTRBR(
          x,
          cy - dh / 2,
          x + dw,
          cy + dh / 2,
          const Radius.circular(2),
        ),
        paint,
      );
      x += dw + ds;
    }
  }

  @override
  bool shouldRepaint(_DashedLinePainter oldDelegate) => false;
}

class _StarburstPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withOpacity(0.12)
      ..style = PaintingStyle.fill;

    final Offset src = Offset(size.width / 2, size.height * -0.1);
    const int rayCount = 16;
    const double spread = 3.14159 * 1.1;

    for (int i = 0; i < rayCount; i++) {
      final double angle = -spread / 2 + (spread / (rayCount - 1)) * i;
      const double len = 380.0;
      const double halfW = 22.0;

      final double ex = src.dx + len * math.sin(angle);
      final double ey = src.dy + len * math.cos(angle);

      final double lx = src.dx + halfW * math.cos(angle);
      final double ly = src.dy - halfW * math.sin(angle);
      final double rx = src.dx - halfW * math.cos(angle);
      final double ry = src.dy + halfW * math.sin(angle);

      final path = Path()
        ..moveTo(lx, ly)
        ..lineTo(
          ex + halfW * math.cos(angle) * 0.3,
          ey - halfW * math.sin(angle) * 0.3,
        )
        ..lineTo(
          ex - halfW * math.cos(angle) * 0.3,
          ey + halfW * math.sin(angle) * 0.3,
        )
        ..lineTo(rx, ry)
        ..close();

      canvas.drawPath(path, paint);
    }
  }

  @override
  bool shouldRepaint(_StarburstPainter oldDelegate) => false;
}
