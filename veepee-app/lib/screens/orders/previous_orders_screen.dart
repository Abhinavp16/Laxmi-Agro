import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';

import '../../core/theme/app_theme.dart';
import '../../core/providers/auth_provider.dart';

class PreviousOrdersScreen extends ConsumerStatefulWidget {
  const PreviousOrdersScreen({super.key});

  @override
  ConsumerState<PreviousOrdersScreen> createState() => _PreviousOrdersScreenState();
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
    setState(() { _isLoading = true; _error = null; });
    try {
      final api = ref.read(apiClientProvider);
      final response = await api.get('/orders');
      if (response.data['success'] == true) {
        final data = response.data['data'] as List<dynamic>? ?? [];
        if (!mounted) return;
        setState(() {
          _orders = data.cast<Map<String, dynamic>>();
          _isLoading = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() { _error = 'Failed to load orders'; _isLoading = false; });
    }
  }

  String _fmt(num price) {
    return price.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'pending_payment': return const Color(0xFFf59e0b);
      case 'payment_uploaded': return const Color(0xFF6366f1);
      case 'payment_verified': return const Color(0xFF3b82f6);
      case 'processing': return const Color(0xFF8b5cf6);
      case 'shipped': return const Color(0xFF0ea5e9);
      case 'delivered': return const Color(0xFF22c55e);
      case 'cancelled': return const Color(0xFFef4444);
      default: return AppColors.gray500;
    }
  }

  Color _statusBg(String status) {
    return _statusColor(status).withOpacity(0.1);
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'pending_payment': return 'Pending Payment';
      case 'payment_uploaded': return 'Payment Uploaded';
      case 'payment_verified': return 'Payment Verified';
      case 'processing': return 'Processing';
      case 'shipped': return 'Shipped';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  }

  IconData _statusIcon(String status) {
    switch (status) {
      case 'pending_payment': return Icons.access_time_rounded;
      case 'payment_uploaded': return Icons.upload_file_rounded;
      case 'payment_verified': return Icons.verified_rounded;
      case 'processing': return Icons.settings_rounded;
      case 'shipped': return Icons.local_shipping_rounded;
      case 'delivered': return Icons.check_circle_rounded;
      case 'cancelled': return Icons.cancel_rounded;
      default: return Icons.help_outline;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: Colors.white, elevation: 0,
        leading: IconButton(onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back_ios, color: AppColors.textPrimary)),
        title: Text('My Orders', style: GoogleFonts.plusJakartaSans(
          fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
        centerTitle: true,
      ),
      body: _isLoading
        ? const Center(child: CircularProgressIndicator())
        : _error != null
          ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.error_outline, size: 48, color: AppColors.error),
              const SizedBox(height: 12),
              Text(_error!, style: GoogleFonts.plusJakartaSans(
                fontSize: 16, color: AppColors.textSecondary)),
              const SizedBox(height: 16),
              ElevatedButton(onPressed: _fetchOrders, child: const Text('Retry')),
            ]))
          : _orders.isEmpty
            ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.receipt_long_outlined, size: 64, color: AppColors.gray300),
                const SizedBox(height: 16),
                Text('No orders yet', style: GoogleFonts.plusJakartaSans(
                  fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                const SizedBox(height: 8),
                TextButton(onPressed: () => context.go('/home'),
                  child: Text('Start Shopping', style: GoogleFonts.plusJakartaSans(
                    fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.primary))),
              ]))
            : RefreshIndicator(
                onRefresh: _fetchOrders,
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _orders.length,
                  itemBuilder: (_, i) => _buildOrderCard(_orders[i]))),
    );
  }

  Widget _buildOrderCard(Map<String, dynamic> order) {
    final status = order['status']?.toString() ?? '';
    final items = order['items'] as List<dynamic>? ?? [];
    final total = order['total'] ?? 0;
    final createdAt = order['createdAt']?.toString() ?? '';
    final orderNumber = order['orderNumber']?.toString() ?? '';
    final trackingNumber = order['trackingNumber']?.toString();

    String dateStr = '';
    try {
      final dt = DateTime.parse(createdAt);
      dateStr = DateFormat('MMM dd, yyyy · hh:mm a').format(dt.toLocal());
    } catch (_) {}

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03),
          blurRadius: 8, offset: const Offset(0, 2))]),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Header
        Padding(padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
          child: Row(children: [
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(orderNumber, style: GoogleFonts.plusJakartaSans(
                fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
              const SizedBox(height: 2),
              Text(dateStr, style: GoogleFonts.plusJakartaSans(
                fontSize: 12, color: AppColors.textSecondary)),
            ])),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: _statusBg(status),
                borderRadius: BorderRadius.circular(8)),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(_statusIcon(status), size: 14, color: _statusColor(status)),
                const SizedBox(width: 4),
                Text(_statusLabel(status), style: GoogleFonts.plusJakartaSans(
                  fontSize: 11, fontWeight: FontWeight.w700, color: _statusColor(status))),
              ])),
          ])),

        const Divider(height: 1, color: AppColors.border),

        // Items
        ...items.take(3).map<Widget>((item) {
          final name = item['name']?.toString() ?? '';
          final qty = item['quantity'] ?? 1;
          final price = item['pricePerUnit'] ?? 0;
          final img = item['image']?.toString();

          return Padding(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(children: [
              ClipRRect(borderRadius: BorderRadius.circular(8),
                child: img != null && img.isNotEmpty
                  ? CachedNetworkImage(imageUrl: img, width: 48, height: 48, fit: BoxFit.cover,
                      errorWidget: (_, __, ___) => Container(width: 48, height: 48,
                        color: AppColors.gray100, child: const Icon(Icons.image, size: 20)))
                  : Container(width: 48, height: 48, color: AppColors.gray100,
                      child: const Icon(Icons.image, size: 20))),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(name, style: GoogleFonts.plusJakartaSans(
                  fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                  maxLines: 1, overflow: TextOverflow.ellipsis),
                Text('Qty: $qty × ₹${_fmt(price)}', style: GoogleFonts.plusJakartaSans(
                  fontSize: 12, color: AppColors.textSecondary)),
              ])),
            ]));
        }),

        if (items.length > 3)
          Padding(padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text('+${items.length - 3} more item${items.length - 3 > 1 ? 's' : ''}',
              style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w600,
                color: AppColors.primary))),

        const Divider(height: 1, color: AppColors.border),

        // Footer
        Padding(padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Total', style: GoogleFonts.plusJakartaSans(
                fontSize: 12, color: AppColors.textSecondary)),
              Text('₹${_fmt(total)}', style: GoogleFonts.plusJakartaSans(
                fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
            ]),
            _buildActionButton(order, status, trackingNumber),
          ])),
      ]),
    );
  }

  Widget _buildActionButton(Map<String, dynamic> order, String status, String? trackingNumber) {
    final orderId = order['id']?.toString() ?? '';
    final payment = order['payment'] as Map<String, dynamic>?;
    final screenshotUploaded = payment?['screenshotUploaded'] == true;
    final paymentStatus = payment?['status']?.toString() ?? '';
    final rejectionReason = payment?['rejectionReason']?.toString();

    // Pending payment & no screenshot → "Complete Payment" (orange)
    if (status == 'pending_payment' && !screenshotUploaded) {
      return ElevatedButton.icon(
        onPressed: () async {
          await context.push('/payment/$orderId');
          _fetchOrders(); // refresh on return
        },
        icon: const Icon(Icons.payment_rounded, size: 16),
        label: Text('Complete Payment', style: GoogleFonts.plusJakartaSans(
          fontSize: 12, fontWeight: FontWeight.w700)),
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFFf59e0b), foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
          minimumSize: Size.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
      );
    }

    // Payment was rejected → "Re-upload" (red)
    if (paymentStatus == 'rejected') {
      return Column(crossAxisAlignment: CrossAxisAlignment.end, mainAxisSize: MainAxisSize.min, children: [
        if (rejectionReason != null && rejectionReason.isNotEmpty)
          Padding(padding: const EdgeInsets.only(bottom: 4),
            child: Text('Rejected: $rejectionReason', style: GoogleFonts.plusJakartaSans(
              fontSize: 10, color: AppColors.error), maxLines: 1, overflow: TextOverflow.ellipsis)),
        ElevatedButton.icon(
          onPressed: () async {
            await context.push('/payment/$orderId');
            _fetchOrders();
          },
          icon: const Icon(Icons.refresh_rounded, size: 16),
          label: Text('Re-upload', style: GoogleFonts.plusJakartaSans(
            fontSize: 12, fontWeight: FontWeight.w700)),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.error, foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
            minimumSize: Size.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
        ),
      ]);
    }

    // Shipped with tracking → "Track Order" (blue)
    if (trackingNumber != null && trackingNumber.isNotEmpty) {
      return ElevatedButton.icon(
        onPressed: () => context.push('/tracking/$orderId'),
        icon: const Icon(Icons.local_shipping_rounded, size: 16),
        label: Text('Track Order', style: GoogleFonts.plusJakartaSans(
          fontSize: 12, fontWeight: FontWeight.w700)),
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF0ea5e9), foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
          minimumSize: Size.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
      );
    }

    // Delivered → "Delivered ✓" (green, disabled)
    if (status == 'delivered') {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        decoration: BoxDecoration(
          color: const Color(0xFF22c55e).withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0xFF22c55e).withOpacity(0.3))),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          const Icon(Icons.check_circle_rounded, size: 16, color: Color(0xFF22c55e)),
          const SizedBox(width: 4),
          Text('Delivered', style: GoogleFonts.plusJakartaSans(
            fontSize: 12, fontWeight: FontWeight.w700, color: const Color(0xFF22c55e))),
        ]),
      );
    }

    // Cancelled → "Cancelled" chip (red, disabled)
    if (status == 'cancelled') {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        decoration: BoxDecoration(
          color: AppColors.error.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.error.withOpacity(0.3))),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.cancel_rounded, size: 16, color: AppColors.error),
          const SizedBox(width: 4),
          Text('Cancelled', style: GoogleFonts.plusJakartaSans(
            fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.error)),
        ]),
      );
    }

    // payment_uploaded → still show "View Status" → payment screen
    if (status == 'payment_uploaded') {
      return OutlinedButton.icon(
        onPressed: () => context.push('/payment/$orderId'),
        icon: const Icon(Icons.visibility_rounded, size: 16),
        label: Text('View Status', style: GoogleFonts.plusJakartaSans(
          fontSize: 12, fontWeight: FontWeight.w700)),
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primary,
          side: BorderSide(color: AppColors.primary.withOpacity(0.5)),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
          minimumSize: Size.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
      );
    }

    // payment_verified, processing → "Track Order" → tracking screen
    return OutlinedButton.icon(
      onPressed: () => context.push('/tracking/$orderId'),
      icon: const Icon(Icons.local_shipping_rounded, size: 16),
      label: Text('Track Order', style: GoogleFonts.plusJakartaSans(
        fontSize: 12, fontWeight: FontWeight.w700)),
      style: OutlinedButton.styleFrom(
        foregroundColor: const Color(0xFF0ea5e9),
        side: BorderSide(color: const Color(0xFF0ea5e9).withOpacity(0.5)),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        minimumSize: Size.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
    );
  }
}
