import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:dio/dio.dart';

import '../../core/theme/app_theme.dart';
import '../../core/providers/auth_provider.dart';

class PaymentVerificationScreen extends ConsumerStatefulWidget {
  const PaymentVerificationScreen({super.key});

  @override
  ConsumerState<PaymentVerificationScreen> createState() => _PaymentVerificationScreenState();
}

class _PaymentVerificationScreenState extends ConsumerState<PaymentVerificationScreen> {
  int _selectedTab = 0;
  List<Map<String, dynamic>> _payments = [];
  bool _isLoading = true;
  String? _error;
  String? _actionInProgress; // paymentId being processed

  static const Color primary = Color(0xFF135bec);
  static const Color backgroundLight = Color(0xFFf6f6f8);
  static const Color textDark = Color(0xFF0d121b);
  static const Color textSecondary = Color(0xFF4c669a);
  static const Color borderColor = Color(0xFFcfd7e7);
  static const Color gray100 = Color(0xFFf3f4f6);
  static const Color gray200 = Color(0xFFe5e7eb);
  static const Color yellow100 = Color(0xFFfef9c3);
  static const Color yellow700 = Color(0xFFa16207);
  static const Color green50 = Color(0xFFf0fdf4);
  static const Color green600 = Color(0xFF16a34a);
  static const Color red50 = Color(0xFFfef2f2);
  static const Color red200 = Color(0xFFfecaca);
  static const Color red600 = Color(0xFFdc2626);

  final List<String> _tabs = ['Pending', 'Verified', 'Rejected'];
  final List<String> _statusFilter = ['pending', 'verified', 'rejected'];

  @override
  void initState() {
    super.initState();
    _fetchPayments();
  }

  Future<void> _fetchPayments() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final api = ref.read(apiClientProvider);
      final response = await api.get('/admin/payments', queryParameters: {
        'status': _statusFilter[_selectedTab],
      });
      if (response.data['success'] == true) {
        final data = response.data['data'] as List<dynamic>? ?? [];
        if (!mounted) return;
        setState(() { _payments = data.cast<Map<String, dynamic>>(); _isLoading = false; });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() { _error = 'Failed to load payments'; _isLoading = false; });
    }
  }

  Future<void> _approvePayment(String paymentId) async {
    setState(() => _actionInProgress = paymentId);
    try {
      final api = ref.read(apiClientProvider);
      await api.put('/admin/payments/$paymentId/verify');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Payment verified successfully',
          style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600)),
        backgroundColor: green600, behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16)));
      _fetchPayments();
    } on DioException catch (e) {
      if (!mounted) return;
      final msg = e.response?.data?['message']?.toString() ?? 'Failed to verify';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(msg, style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600)),
        backgroundColor: red600, behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16)));
    } finally {
      if (mounted) setState(() => _actionInProgress = null);
    }
  }

  Future<void> _rejectPayment(String paymentId) async {
    final reasonCtrl = TextEditingController();
    final reason = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Reject Payment', style: GoogleFonts.plusJakartaSans(
          fontSize: 18, fontWeight: FontWeight.w700)),
        content: TextField(controller: reasonCtrl, maxLines: 3,
          decoration: InputDecoration(hintText: 'Reason for rejection...',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)))),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, reasonCtrl.text.trim()),
            style: ElevatedButton.styleFrom(backgroundColor: red600, foregroundColor: Colors.white),
            child: const Text('Reject')),
        ],
      ),
    );
    reasonCtrl.dispose();
    if (reason == null || reason.isEmpty) return;

    setState(() => _actionInProgress = paymentId);
    try {
      final api = ref.read(apiClientProvider);
      await api.put('/admin/payments/$paymentId/reject', data: {'reason': reason});
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Payment rejected', style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600)),
        backgroundColor: red600, behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16)));
      _fetchPayments();
    } catch (_) {
    } finally {
      if (mounted) setState(() => _actionInProgress = null);
    }
  }

  String _fmt(num price) {
    return price.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
  }

  String _timeAgo(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final dt = DateTime.parse(dateStr);
      final diff = DateTime.now().difference(dt);
      if (diff.inMinutes < 1) return 'Just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes} min ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      return DateFormat('MMM dd, yyyy').format(dt.toLocal());
    } catch (_) { return ''; }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundLight,
      appBar: AppBar(
        backgroundColor: backgroundLight, elevation: 0,
        leading: IconButton(onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back_ios, color: textDark)),
        title: Text('Payment Verification', style: GoogleFonts.plusJakartaSans(
          fontSize: 18, fontWeight: FontWeight.w700, color: textDark)),
        centerTitle: true,
      ),
      body: Column(children: [
        // Tabs
        Container(
          decoration: BoxDecoration(border: Border(bottom: BorderSide(color: borderColor))),
          child: Row(children: List.generate(_tabs.length, (index) {
            final isSelected = _selectedTab == index;
            return Expanded(child: GestureDetector(
              onTap: () { setState(() => _selectedTab = index); _fetchPayments(); },
              child: Container(
                padding: const EdgeInsets.only(top: 16, bottom: 13),
                decoration: BoxDecoration(border: Border(bottom: BorderSide(
                  color: isSelected ? primary : Colors.transparent, width: 3))),
                child: Text(_tabs[index], textAlign: TextAlign.center,
                  style: GoogleFonts.plusJakartaSans(fontSize: 14, fontWeight: FontWeight.w700,
                    color: isSelected ? primary : textSecondary)))));
          }))),

        // Content
        Expanded(child: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
            ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.error_outline, size: 48, color: red600),
                const SizedBox(height: 12),
                Text(_error!, style: GoogleFonts.plusJakartaSans(fontSize: 16, color: textSecondary)),
                const SizedBox(height: 16),
                ElevatedButton(onPressed: _fetchPayments, child: const Text('Retry'))]))
            : _payments.isEmpty
              ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.payment_rounded, size: 56, color: AppColors.gray300),
                  const SizedBox(height: 12),
                  Text('No ${_tabs[_selectedTab].toLowerCase()} payments',
                    style: GoogleFonts.plusJakartaSans(fontSize: 16, fontWeight: FontWeight.w600,
                      color: textSecondary))]))
              : RefreshIndicator(onRefresh: _fetchPayments,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _payments.length,
                    itemBuilder: (_, i) => _buildPaymentCard(_payments[i])))),
      ]),
    );
  }

  Widget _buildPaymentCard(Map<String, dynamic> payment) {
    final id = payment['_id']?.toString() ?? '';
    final status = payment['status']?.toString() ?? 'pending';
    final amount = payment['amount'] ?? 0;
    final screenshot = payment['screenshotUrl']?.toString();
    final uploadedAt = payment['uploadedAt']?.toString();
    final order = payment['orderId'] as Map<String, dynamic>?;
    final user = payment['userId'] as Map<String, dynamic>?;
    final orderNumber = order?['orderNumber']?.toString() ?? '';
    final buyerName = user?['name']?.toString() ?? 'Unknown';
    final buyerPhone = user?['phone']?.toString() ?? '';
    final rejectionReason = payment['rejectionReason']?.toString();
    final isProcessing = _actionInProgress == id;

    Color statusBg, statusFg;
    String statusLabel;
    if (status == 'verified') {
      statusBg = green50; statusFg = green600; statusLabel = 'VERIFIED';
    } else if (status == 'rejected') {
      statusBg = red50; statusFg = red600; statusLabel = 'REJECTED';
    } else {
      statusBg = yellow100; statusFg = yellow700; statusLabel = 'PENDING';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12),
        border: Border.all(color: gray100),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4)]),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Header
        Padding(padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
          child: Row(children: [
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(_timeAgo(uploadedAt), style: GoogleFonts.plusJakartaSans(
                fontSize: 12, color: textSecondary)),
              Text(buyerName, style: GoogleFonts.plusJakartaSans(
                fontSize: 16, fontWeight: FontWeight.w700, color: textDark)),
              if (buyerPhone.isNotEmpty)
                Text(buyerPhone, style: GoogleFonts.plusJakartaSans(
                  fontSize: 12, color: textSecondary)),
            ])),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(color: statusBg, borderRadius: BorderRadius.circular(4)),
              child: Text(statusLabel, style: GoogleFonts.plusJakartaSans(
                fontSize: 10, fontWeight: FontWeight.w700, color: statusFg))),
          ])),

        // Screenshot
        if (screenshot != null && screenshot.isNotEmpty)
          Padding(padding: const EdgeInsets.symmetric(horizontal: 16),
            child: ClipRRect(borderRadius: BorderRadius.circular(8),
              child: CachedNetworkImage(imageUrl: screenshot, width: double.infinity,
                height: 220, fit: BoxFit.cover,
                placeholder: (_, __) => Container(height: 220, color: gray200),
                errorWidget: (_, __, ___) => Container(height: 220, color: gray200,
                  child: const Center(child: Icon(Icons.broken_image, size: 40)))))),

        // Details
        Padding(padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(child: _buildDetailItem('Order', orderNumber)),
              Expanded(child: _buildDetailItem('Amount', '₹${_fmt(amount)}')),
            ]),
            if (rejectionReason != null && rejectionReason.isNotEmpty) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: red50, borderRadius: BorderRadius.circular(8)),
                child: Row(children: [
                  Icon(Icons.info_outline, size: 16, color: red600),
                  const SizedBox(width: 8),
                  Expanded(child: Text('Reason: $rejectionReason', style: GoogleFonts.plusJakartaSans(
                    fontSize: 12, color: red600))),
                ])),
            ],
          ])),

        // Actions (only for pending)
        if (status == 'pending')
          Padding(padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Row(children: [
              Expanded(child: SizedBox(height: 44,
                child: ElevatedButton.icon(
                  onPressed: isProcessing ? null : () => _approvePayment(id),
                  icon: isProcessing
                    ? const SizedBox(width: 16, height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.check_circle, size: 18),
                  label: Text('Approve', style: GoogleFonts.plusJakartaSans(
                    fontSize: 14, fontWeight: FontWeight.w700)),
                  style: ElevatedButton.styleFrom(backgroundColor: primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)))))),
              const SizedBox(width: 12),
              Expanded(child: SizedBox(height: 44,
                child: OutlinedButton.icon(
                  onPressed: isProcessing ? null : () => _rejectPayment(id),
                  icon: Icon(Icons.cancel, size: 18, color: red600),
                  label: Text('Reject', style: GoogleFonts.plusJakartaSans(
                    fontSize: 14, fontWeight: FontWeight.w700, color: red600)),
                  style: OutlinedButton.styleFrom(backgroundColor: red50,
                    side: BorderSide(color: red200),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)))))),
            ])),
      ]),
    );
  }

  Widget _buildDetailItem(String label, String value) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: GoogleFonts.plusJakartaSans(
        fontSize: 11, fontWeight: FontWeight.w500, color: textSecondary)),
      Text(value, style: GoogleFonts.plusJakartaSans(
        fontSize: 14, fontWeight: FontWeight.w700, color: textDark),
        overflow: TextOverflow.ellipsis),
    ]);
  }
}
