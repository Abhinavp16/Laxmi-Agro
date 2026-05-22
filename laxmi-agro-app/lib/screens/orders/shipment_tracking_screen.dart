import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../core/theme/app_theme.dart';
import '../../core/config/api_config.dart';
import '../../core/services/storage_service.dart';

class ShipmentTrackingScreen extends ConsumerStatefulWidget {
  final String orderId;

  const ShipmentTrackingScreen({super.key, required this.orderId});

  @override
  ConsumerState<ShipmentTrackingScreen> createState() => _ShipmentTrackingScreenState();
}

class _ShipmentTrackingScreenState extends ConsumerState<ShipmentTrackingScreen> {
  late final Dio _dio;
  Map<String, dynamic>? _order;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConfig.baseUrl,
        connectTimeout: ApiConfig.connectTimeout,
        receiveTimeout: ApiConfig.receiveTimeout,
      ),
    )..interceptors.add(
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
    _fetchOrder();
  }

  Future<void> _fetchOrder() async {
    try {
      final response = await _dio.get('/orders/${widget.orderId}');
      if (response.statusCode == 200 && response.data['success'] == true) {
        setState(() {
          _order = response.data['data'];
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching order: $e');
      setState(() {
        _error = 'Failed to load order details';
        _isLoading = false;
      });
    }
  }

  String _getStatusDisplay(String status) {
    switch (status) {
      case 'pending_payment':
        return 'Pending Payment';
      case 'payment_uploaded':
        return 'Payment Uploaded';
      case 'payment_verified':
        return 'Payment Verified';
      case 'processing':
        return 'Processing';
      case 'shipped':
        return 'Shipped';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status.replaceAll('_', ' ').split(' ').map((s) =>
          s.isNotEmpty ? '${s[0].toUpperCase()}${s.substring(1)}' : '').join(' ');
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending_payment':
        return Colors.orange;
      case 'payment_uploaded':
        return Colors.blue;
      case 'payment_verified':
        return Colors.green;
      case 'processing':
        return Colors.blue;
      case 'shipped':
        return Colors.purple;
      case 'delivered':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      default:
        return AppColors.primary;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'pending_payment':
        return Icons.payment;
      case 'payment_uploaded':
        return Icons.cloud_upload;
      case 'payment_verified':
        return Icons.check_circle;
      case 'processing':
        return Icons.inventory_2;
      case 'shipped':
        return Icons.local_shipping;
      case 'delivered':
        return Icons.home;
      case 'cancelled':
        return Icons.cancel;
      default:
        return Icons.info;
    }
  }

  List<String> _getStatusTimeline(String currentStatus) {
    final List<String> allStatuses = [
      'pending_payment',
      'payment_verified',
      'processing',
      'shipped',
      'delivered',
    ];

    // If cancelled, show only relevant statuses
    if (currentStatus == 'cancelled') {
      return ['pending_payment', 'cancelled'];
    }

    // Find current status index
    int currentIndex = allStatuses.indexOf(currentStatus);
    if (currentIndex == -1) {
      // If status is payment_uploaded, treat as after pending_payment
      if (currentStatus == 'payment_uploaded') {
        currentIndex = 1;
      } else {
        return allStatuses;
      }
    }

    return allStatuses.take(currentIndex + 1).toList();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: AppColors.backgroundLight,
        appBar: AppBar(
          backgroundColor: AppColors.backgroundLight,
          elevation: 0,
          leading: IconButton(
            onPressed: () => context.pop(),
            icon: const Icon(Icons.arrow_back_ios, color: AppColors.textPrimary),
          ),
          title: Text(
            'Shipment Details',
            style: GoogleFonts.plusJakartaSans(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          centerTitle: true,
        ),
        body: const Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
      );
    }

    if (_error != null || _order == null) {
      return Scaffold(
        backgroundColor: AppColors.backgroundLight,
        appBar: AppBar(
          backgroundColor: AppColors.backgroundLight,
          elevation: 0,
          leading: IconButton(
            onPressed: () => context.pop(),
            icon: const Icon(Icons.arrow_back_ios, color: AppColors.textPrimary),
          ),
          title: Text(
            'Shipment Details',
            style: GoogleFonts.plusJakartaSans(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          centerTitle: true,
        ),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline, size: 48, color: AppColors.textTertiary),
              const SizedBox(height: 16),
              Text(
                _error ?? 'Order not found',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 16,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      );
    }

    final order = _order!;
    final orderNumber = order['orderNumber'] ?? '';
    final status = order['status'] ?? 'pending_payment';
    final trackingNumber = order['trackingNumber'];
    final courierName = order['courierName'];
    final shippedAt = order['shippedAt'];
    final deliveredAt = order['deliveredAt'];
    final statusHistory = order['statusHistory'] as List? ?? [];
    final items = order['items'] as List? ?? [];

    final statusColor = _getStatusColor(status);
    final statusDisplay = _getStatusDisplay(status);
    final timelineStatuses = _getStatusTimeline(status);

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: AppColors.backgroundLight,
        elevation: 0,
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back_ios, color: AppColors.textPrimary),
        ),
        title: Text(
          'Shipment Details',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        centerTitle: true,
      ),
      body: RefreshIndicator(
        onRefresh: _fetchOrder,
        color: AppColors.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Order Summary Card
              Padding(
                padding: const EdgeInsets.all(16),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.gray100),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Order ID',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 14,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '#$orderNumber',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: statusColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              statusDisplay,
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: statusColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                      if (items.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        const Divider(color: AppColors.gray100),
                        const SizedBox(height: 16),
                        ...items.take(2).map((item) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Row(
                            children: [
                              Container(
                                width: 50,
                                height: 50,
                                decoration: BoxDecoration(
                                  color: AppColors.backgroundLight,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: item['productSnapshot']?['image'] != null
                                    ? ClipRRect(
                                        borderRadius: BorderRadius.circular(8),
                                        child: Image.network(
                                          item['productSnapshot']['image'],
                                          fit: BoxFit.cover,
                                          errorBuilder: (_, __, ___) => const Icon(
                                            Icons.agriculture,
                                            color: AppColors.primary,
                                          ),
                                        ),
                                      )
                                    : const Icon(Icons.agriculture, color: AppColors.primary),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item['productSnapshot']?['name'] ?? 'Product',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w500,
                                        color: AppColors.textPrimary,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    Text(
                                      'Qty: ${item['quantity']} • ₹${NumberFormat('#,##,###').format(item['totalPrice'])}',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 12,
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        )),
                        if (items.length > 2)
                          Text(
                            '+${items.length - 2} more items',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 12,
                              color: AppColors.textTertiary,
                            ),
                          ),
                      ],
                    ],
                  ),
                ),
              ),

              // Order Journey Section
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  'Order Journey',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Timeline
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: timelineStatuses.asMap().entries.map((entry) {
                    final index = entry.key;
                    final s = entry.value;
                    final isLast = index == timelineStatuses.length - 1;
                    final isCompleted = true;
                    final isCurrent = s == status;

                    String subtitle = '';
                    if (statusHistory.isNotEmpty) {
                      final historyItem = statusHistory.firstWhere(
                        (h) => h['status'] == s,
                        orElse: () => null,
                      );
                      if (historyItem != null && historyItem['timestamp'] != null) {
                        subtitle = DateFormat('MMM dd, yyyy hh:mm a')
                            .format(DateTime.parse(historyItem['timestamp']));
                      }
                    }

                    return _buildTimelineItem(
                      icon: _getStatusIcon(s),
                      iconColor: isCurrent ? statusColor : AppColors.success,
                      title: _getStatusDisplay(s),
                      subtitle: subtitle,
                      isCompleted: isCompleted,
                      isLast: isLast,
                      isCurrent: isCurrent,
                      badge: isCurrent ? 'LATEST' : null,
                    );
                  }).toList(),
                ),
              ),

              // Courier Information (only show if shipped)
              if (trackingNumber != null && trackingNumber.isNotEmpty) ...[
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Text(
                    'Courier Information',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.gray100),
                    ),
                    child: Column(
                      children: [
                        if (courierName != null && courierName.isNotEmpty)
                          _buildInfoRow('Courier', courierName),
                        if (courierName != null && courierName.isNotEmpty)
                          const SizedBox(height: 12),
                        _buildInfoRow('Tracking Number', trackingNumber),
                        if (shippedAt != null) ...[
                          const SizedBox(height: 12),
                          _buildInfoRow(
                            'Shipped Date',
                            DateFormat('MMM dd, yyyy').format(DateTime.parse(shippedAt)),
                          ),
                        ],
                        if (deliveredAt != null) ...[
                          const SizedBox(height: 12),
                          _buildInfoRow(
                            'Delivered Date',
                            DateFormat('MMM dd, yyyy').format(DateTime.parse(deliveredAt)),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ],

              // Shipping Address
              if (order['shippingAddress'] != null) ...[
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Text(
                    'Shipping Address',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.gray100),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          order['shippingAddress']['fullName'] ?? '',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '${order['shippingAddress']['addressLine1'] ?? ''}${order['shippingAddress']['addressLine2'] != null ? ', ${order['shippingAddress']['addressLine2']}' : ''}',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 13,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        Text(
                          '${order['shippingAddress']['city'] ?? ''}, ${order['shippingAddress']['state'] ?? ''} - ${order['shippingAddress']['pincode'] ?? ''}',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 13,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        if (order['shippingAddress']['phone'] != null) ...[
                          const SizedBox(height: 8),
                          Text(
                            'Phone: ${order['shippingAddress']['phone']}',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 12,
                              color: AppColors.textTertiary,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ],

              const SizedBox(height: 100),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 12,
                  color: AppColors.textTertiary,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTimelineItem({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required bool isCompleted,
    required bool isLast,
    bool isCurrent = false,
    String? badge,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: iconColor, size: 20),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 40,
                color: isCompleted ? AppColors.success : AppColors.gray300,
              ),
          ],
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: isCurrent ? AppColors.textPrimary : AppColors.textPrimary.withOpacity(0.7),
                      ),
                    ),
                    if (badge != null) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          badge,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                if (subtitle.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }
}
