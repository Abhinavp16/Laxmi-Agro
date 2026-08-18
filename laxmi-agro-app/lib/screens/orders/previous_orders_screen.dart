import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../core/providers/auth_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../widgets/order_checkout_actions_sheet.dart';

class PreviousOrdersScreen extends ConsumerStatefulWidget {
  const PreviousOrdersScreen({super.key});

  @override
  ConsumerState<PreviousOrdersScreen> createState() =>
      _PreviousOrdersScreenState();
}

class _PreviousOrdersScreenState extends ConsumerState<PreviousOrdersScreen> {
  List<Map<String, dynamic>> _orders = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchOrders();
  }

  Future<void> _fetchOrders() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final api = ref.read(apiClientProvider);
      final response = await api.get(
        '/orders',
        queryParameters: {'limit': 50},
      );
      if (response.data['success'] != true) {
        throw StateError('Order request was unsuccessful');
      }

      final data = response.data['data'] as List<dynamic>? ?? [];
      if (!mounted) return;
      setState(() {
        _orders = data.cast<Map<String, dynamic>>();
        _isLoading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Failed to load orders';
        _isLoading = false;
      });
    }
  }

  String _fmt(num? price) {
    return (price ?? 0).toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (match) => '${match[1]},',
    );
  }

  String _formatDate(dynamic value) {
    final parsed = value == null ? null : DateTime.tryParse(value.toString());
    if (parsed == null) return '—';
    return DateFormat('MMM dd, yyyy · hh:mm a').format(parsed.toLocal());
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'pending_payment':
        return const Color(0xFFF59E0B);
      case 'payment_uploaded':
        return const Color(0xFF6366F1);
      case 'payment_verified':
        return const Color(0xFF3B82F6);
      case 'processing':
        return const Color(0xFF8B5CF6);
      case 'shipped':
        return const Color(0xFF0EA5E9);
      case 'delivered':
        return const Color(0xFF22C55E);
      case 'cancelled':
        return const Color(0xFFEF4444);
      default:
        return AppColors.gray500;
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'pending_payment':
        return 'Awaiting Payment Confirmation';
      case 'payment_uploaded':
        return 'Awaiting Shop Confirmation';
      case 'payment_verified':
        return 'Payment Confirmed';
      case 'processing':
        return 'Processing';
      case 'shipped':
        return 'Shipped';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status.replaceAll('_', ' ');
    }
  }

  IconData _statusIcon(String status) {
    switch (status) {
      case 'pending_payment':
        return Icons.access_time_rounded;
      case 'payment_uploaded':
        return Icons.hourglass_top_rounded;
      case 'payment_verified':
        return Icons.verified_rounded;
      case 'processing':
        return Icons.settings_rounded;
      case 'shipped':
        return Icons.local_shipping_rounded;
      case 'delivered':
        return Icons.check_circle_rounded;
      case 'cancelled':
        return Icons.cancel_rounded;
      default:
        return Icons.info_outline_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: const Icon(
            Icons.arrow_back_ios,
            color: AppColors.textPrimary,
          ),
        ),
        title: Text(
          'My Orders',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        centerTitle: true,
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline, size: 48, color: AppColors.error),
            const SizedBox(height: 12),
            Text(
              _error!,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 16,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: _fetchOrders, child: const Text('Retry')),
          ],
        ),
      );
    }

    if (_orders.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.receipt_long_outlined,
              size: 64,
              color: AppColors.gray300,
            ),
            const SizedBox(height: 16),
            Text(
              'No orders yet',
              style: GoogleFonts.plusJakartaSans(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () => context.go('/home'),
              child: Text(
                'Start Shopping',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchOrders,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _orders.length,
        itemBuilder: (_, index) => _buildOrderCard(_orders[index]),
      ),
    );
  }

  Widget _buildOrderCard(Map<String, dynamic> order) {
    final status = order['status']?.toString() ?? '';
    final statusColor = _statusColor(status);
    final items = order['items'] as List<dynamic>? ?? [];
    final orderNumber = order['orderNumber']?.toString() ?? '';
    final orderType = order['orderType']?.toString() == 'wholesale'
        ? 'Wholesale order'
        : 'Retail order';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: ExpansionTile(
        tilePadding: const EdgeInsets.fromLTRB(16, 8, 12, 8),
        childrenPadding: EdgeInsets.zero,
        shape: const Border(),
        collapsedShape: const Border(),
        title: Text(
          orderNumber,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '$orderType · ${_formatDate(order['createdAt'])}',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 11,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 7),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(_statusIcon(status), size: 13, color: statusColor),
                    const SizedBox(width: 4),
                    Flexible(
                      child: Text(
                        _statusLabel(status),
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: statusColor,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '₹${_fmt(order['total'] as num?)}',
              style: GoogleFonts.plusJakartaSans(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
            Text(
              '${items.length} item${items.length == 1 ? '' : 's'}',
              style: GoogleFonts.plusJakartaSans(
                fontSize: 11,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
        children: [
          const Divider(height: 1, color: AppColors.border),
          _buildItems(items),
          const Divider(height: 1, color: AppColors.border),
          _buildPriceBreakdown(order),
          _buildShippingAddress(order),
          _buildTrackingDetails(order),
          _buildStatusHistory(order),
          _buildActions(order, status),
        ],
      ),
    );
  }

  Widget _buildItems(List<dynamic> items) {
    return Column(
      children: items.map<Widget>((rawItem) {
        final item = rawItem as Map<String, dynamic>;
        final image = item['image']?.toString();
        final quantity = item['quantity'] as num? ?? 1;
        final price = item['pricePerUnit'] as num? ?? 0;
        final totalPrice = item['totalPrice'] as num? ?? quantity * price;

        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: image != null && image.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: image,
                        width: 50,
                        height: 50,
                        fit: BoxFit.cover,
                        errorWidget: (_, _, _) => _imagePlaceholder(),
                      )
                    : _imagePlaceholder(),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item['name']?.toString() ?? 'Product',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Qty: $quantity × ₹${_fmt(price)}',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                '₹${_fmt(totalPrice)}',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _imagePlaceholder() {
    return Container(
      width: 50,
      height: 50,
      color: AppColors.gray100,
      child: const Icon(Icons.image_outlined, size: 20),
    );
  }

  Widget _buildPriceBreakdown(Map<String, dynamic> order) {
    final subtotal = order['subtotal'] as num? ?? order['total'] as num? ?? 0;
    final delivery = order['deliveryFee'] as num? ?? 0;
    final discount = order['discount'] as num? ?? 0;

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _detailRow('Subtotal', '₹${_fmt(subtotal)}'),
          const SizedBox(height: 6),
          _detailRow('Delivery', delivery == 0 ? 'Free' : '₹${_fmt(delivery)}'),
          if (discount > 0) ...[
            const SizedBox(height: 6),
            _detailRow('Discount', '-₹${_fmt(discount)}', valueColor: AppColors.success),
          ],
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 10),
            child: Divider(height: 1, color: AppColors.border),
          ),
          _detailRow(
            'Grand Total',
            '₹${_fmt(order['total'] as num?)}',
            bold: true,
          ),
        ],
      ),
    );
  }

  Widget _detailRow(
    String label,
    String value, {
    bool bold = false,
    Color? valueColor,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 13,
            fontWeight: bold ? FontWeight.w700 : FontWeight.w500,
            color: AppColors.textSecondary,
          ),
        ),
        Text(
          value,
          style: GoogleFonts.plusJakartaSans(
            fontSize: bold ? 16 : 13,
            fontWeight: bold ? FontWeight.w800 : FontWeight.w600,
            color: valueColor ?? AppColors.textPrimary,
          ),
        ),
      ],
    );
  }

  Widget _buildShippingAddress(Map<String, dynamic> order) {
    final rawAddress = order['shippingAddress'];
    if (rawAddress is! Map) return const SizedBox.shrink();
    final address = Map<String, dynamic>.from(rawAddress);
    final addressLines = [
      address['addressLine1'],
      address['addressLine2'],
      [address['city'], address['state']]
          .where((value) => value != null && value.toString().isNotEmpty)
          .join(', '),
      address['pincode'],
    ].where((value) => value != null && value.toString().trim().isNotEmpty);

    return _infoSection(
      icon: Icons.location_on_outlined,
      title: 'Shipping Address',
      children: [
        Text(
          address['fullName']?.toString() ?? '',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 3),
        Text(
          addressLines.join('\n'),
          style: GoogleFonts.plusJakartaSans(
            fontSize: 12,
            height: 1.45,
            color: AppColors.textSecondary,
          ),
        ),
        if (address['phone']?.toString().isNotEmpty == true) ...[
          const SizedBox(height: 3),
          Text(
            address['phone'].toString(),
            style: GoogleFonts.plusJakartaSans(
              fontSize: 12,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildTrackingDetails(Map<String, dynamic> order) {
    final tracking = order['trackingNumber']?.toString();
    final courier = order['courierName']?.toString();
    if ((tracking == null || tracking.isEmpty) &&
        (courier == null || courier.isEmpty)) {
      return const SizedBox.shrink();
    }

    return _infoSection(
      icon: Icons.local_shipping_outlined,
      title: 'Delivery Details',
      children: [
        if (courier != null && courier.isNotEmpty)
          Text('Courier: $courier', style: _infoTextStyle()),
        if (tracking != null && tracking.isNotEmpty)
          Text('Tracking: $tracking', style: _infoTextStyle()),
      ],
    );
  }

  Widget _buildStatusHistory(Map<String, dynamic> order) {
    final history = order['statusHistory'] as List<dynamic>? ?? [];
    if (history.isEmpty) return const SizedBox.shrink();

    return _infoSection(
      icon: Icons.history_rounded,
      title: 'Status History',
      children: history.reversed.map<Widget>((raw) {
        final entry = raw as Map;
        final status = entry['status']?.toString() ?? '';
        final note = entry['note']?.toString();
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 8,
                height: 8,
                margin: const EdgeInsets.only(top: 5, right: 8),
                decoration: BoxDecoration(
                  color: _statusColor(status),
                  shape: BoxShape.circle,
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _statusLabel(status),
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    Text(
                      [
                        _formatDate(entry['timestamp']),
                        if (note != null && note.isNotEmpty) note,
                      ].join(' · '),
                      style: _infoTextStyle(),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  TextStyle _infoTextStyle() {
    return GoogleFonts.plusJakartaSans(
      fontSize: 12,
      color: AppColors.textSecondary,
    );
  }

  Widget _infoSection({
    required IconData icon,
    required String title,
    required List<Widget> children,
  }) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.gray50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.gray100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 17, color: AppColors.primary),
              const SizedBox(width: 7),
              Text(
                title,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 9),
          ...children,
        ],
      ),
    );
  }

  Widget _buildActions(Map<String, dynamic> order, String status) {
    final orderId = order['id']?.toString() ?? '';
    final trackingNumber = order['trackingNumber']?.toString();
    final canShareReceipt = status == 'pending_payment' || status == 'payment_uploaded';

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Wrap(
        alignment: WrapAlignment.end,
        spacing: 10,
        runSpacing: 10,
        children: [
          if (canShareReceipt)
            OutlinedButton.icon(
              onPressed: () async {
                final api = ref.read(apiClientProvider);
                await OrderCheckoutActionsSheet.handleSuccessfulCheckout(
                  context: context,
                  apiClient: api,
                  responseData: {'success': true, 'data': order},
                );
              },
              icon: const Icon(Icons.receipt_long_outlined, size: 17),
              label: const Text('Send Receipt'),
            ),
          if (trackingNumber != null && trackingNumber.isNotEmpty)
            FilledButton.icon(
              onPressed: () => context.push('/tracking/$orderId'),
              icon: const Icon(Icons.local_shipping_rounded, size: 17),
              label: const Text('Track Order'),
            )
          else if (status == 'payment_verified' || status == 'processing')
            OutlinedButton.icon(
              onPressed: () => context.push('/tracking/$orderId'),
              icon: const Icon(Icons.timeline_rounded, size: 17),
              label: const Text('View Status'),
            ),
          if (status == 'delivered')
            _terminalChip(
              label: 'Delivered',
              icon: Icons.check_circle_rounded,
              color: const Color(0xFF22C55E),
            ),
          if (status == 'cancelled')
            _terminalChip(
              label: 'Cancelled',
              icon: Icons.cancel_rounded,
              color: AppColors.error,
            ),
        ],
      ),
    );
  }

  Widget _terminalChip({
    required String label,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
