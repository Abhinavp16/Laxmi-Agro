import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:dio/dio.dart';

import '../../core/providers/auth_provider.dart';

class NegotiationDetailScreen extends ConsumerStatefulWidget {
  final String negotiationId;
  const NegotiationDetailScreen({super.key, required this.negotiationId});

  @override
  ConsumerState<NegotiationDetailScreen> createState() =>
      _NegotiationDetailScreenState();
}

class _NegotiationDetailScreenState
    extends ConsumerState<NegotiationDetailScreen> {
  bool _isLoading = true;
  bool _isActioning = false;
  String? _error;
  Map<String, dynamic>? _negotiation;
  final _counterPriceController = TextEditingController();
  final _counterMessageController = TextEditingController();

  static const Color primaryBlue = Color(0xFF2563EB);
  static const Color backgroundWhite = Color(0xFFF8FAFC);
  static const Color surfaceWhite = Color(0xFFFFFFFF);
  static const Color textPrimary = Color(0xFF1E293B);
  static const Color textMuted = Color(0xFF94A3B8);
  static const Color borderLight = Color(0xFFE2E8F0);
  static const Color slateBlue = Color(0xFF4C669A);
  static const Color greenAccent = Color(0xFF16A34A);
  static const Color redAccent = Color(0xFFDC2626);
  static const Color amberAccent = Color(0xFFF59E0B);

  @override
  void initState() {
    super.initState();
    _fetchDetail();
  }

  @override
  void dispose() {
    _counterPriceController.dispose();
    _counterMessageController.dispose();
    super.dispose();
  }

  Future<void> _fetchDetail() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final api = ref.read(apiClientProvider);
      final response = await api.get('/negotiations/${widget.negotiationId}');
      if (response.data['success'] == true) {
        setState(() {
          _negotiation = response.data['data'];
          _isLoading = false;
        });
      }
    } on DioException catch (e) {
      setState(() {
        _error = e.response?.data?['message']?.toString() ?? 'Failed to load';
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Something went wrong';
        _isLoading = false;
      });
    }
  }

  Future<void> _acceptOffer() async {
    setState(() => _isActioning = true);
    try {
      final api = ref.read(apiClientProvider);
      await api.post('/negotiations/${widget.negotiationId}/accept');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Offer accepted!',
              style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600),
            ),
            backgroundColor: greenAccent,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        );
        context.pop(true);
      }
    } on DioException catch (e) {
      _showError(
        e.response?.data?['message']?.toString() ?? 'Failed to accept',
      );
    } finally {
      if (mounted) setState(() => _isActioning = false);
    }
  }

  Future<void> _rejectNegotiation() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(
          'Cancel Negotiation?',
          style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700),
        ),
        content: Text(
          'This action cannot be undone.',
          style: GoogleFonts.plusJakartaSans(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('No'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(
              'Yes, Cancel',
              style: GoogleFonts.plusJakartaSans(color: redAccent),
            ),
          ),
        ],
      ),
    );
    if (confirm != true) return;

    setState(() => _isActioning = true);
    try {
      final api = ref.read(apiClientProvider);
      await api.post('/negotiations/${widget.negotiationId}/reject');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Negotiation cancelled',
              style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600),
            ),
            backgroundColor: redAccent,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        );
        context.pop(true);
      }
    } on DioException catch (e) {
      _showError(e.response?.data?['message']?.toString() ?? 'Failed');
    } finally {
      if (mounted) setState(() => _isActioning = false);
    }
  }

  Future<void> _submitCounterOffer() async {
    final priceText = _counterPriceController.text.trim();
    if (priceText.isEmpty) {
      _showError('Please enter a price');
      return;
    }
    final price = double.tryParse(priceText);
    if (price == null || price <= 0) {
      _showError('Invalid price');
      return;
    }

    setState(() => _isActioning = true);
    try {
      final api = ref.read(apiClientProvider);
      await api.post(
        '/negotiations/${widget.negotiationId}/counter',
        data: {
          'pricePerUnit': price,
          'message': _counterMessageController.text.trim(),
        },
      );
      if (mounted) {
        _counterPriceController.clear();
        _counterMessageController.clear();
        Navigator.pop(context); // close bottom sheet
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Counter offer sent!',
              style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600),
            ),
            backgroundColor: primaryBlue,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        );
        _fetchDetail();
      }
    } on DioException catch (e) {
      _showError(
        e.response?.data?['message']?.toString() ?? 'Failed to send counter',
      );
    } finally {
      if (mounted) setState(() => _isActioning = false);
    }
  }

  Future<void> _proceedToOrder() async {
    debugPrint('_proceedToOrder called for ${widget.negotiationId}');
    try {
      final checkoutData = await _showAddressDialog();
      debugPrint('Address dialog returned: $checkoutData');
      if (checkoutData == null || !mounted) return;

      final address = Map<String, String>.from(checkoutData);
      final couponCode = (address.remove('couponCode') ?? '').trim();
      final payload = <String, dynamic>{
        'negotiationId': widget.negotiationId,
        'shippingAddress': address,
      };
      if (couponCode.isNotEmpty) {
        payload['couponCode'] = couponCode.toUpperCase();
      }

      setState(() => _isActioning = true);
      try {
        final api = ref.read(apiClientProvider);
        final response = await api.post(
          '/orders/from-negotiation',
          data: payload,
        );

        if (!mounted) return;
        if (response.data['success'] == true) {
          final orderId = response.data['data']['orderId'];
          context.push('/payment/$orderId');
        }
      } on DioException catch (e) {
        _showError(
          e.response?.data?['message']?.toString() ?? 'Failed to create order',
        );
      } finally {
        if (mounted) setState(() => _isActioning = false);
      }
    } catch (e) {
      debugPrint('_proceedToOrder error: $e');
      if (mounted) _showError('Error: $e');
    }
  }

  Future<Map<String, String>?> _showAddressDialog() async {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final addr1Ctrl = TextEditingController();
    final cityCtrl = TextEditingController();
    final stateCtrl = TextEditingController();
    final pinCtrl = TextEditingController();
    final couponCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();

    final auth = ref.read(authProvider);
    nameCtrl.text = auth.user?.name ?? '';
    phoneCtrl.text = auth.user?.phone ?? '';

    final result = await showModalBottomSheet<Map<String, String>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        margin: EdgeInsets.only(top: MediaQuery.of(ctx).padding.top + 40),
        decoration: const BoxDecoration(
          color: surfaceWhite,
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
            key: formKey,
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
                    'Shipping Address',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: textPrimary,
                    ),
                  ),
                  const SizedBox(height: 20),
                  _addrField('Full Name', nameCtrl),
                  const SizedBox(height: 12),
                  _addrField('Phone', phoneCtrl, keyboard: TextInputType.phone),
                  const SizedBox(height: 12),
                  _addrField('Address Line 1', addr1Ctrl),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: _addrField('City', cityCtrl)),
                      const SizedBox(width: 12),
                      Expanded(child: _addrField('State', stateCtrl)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _addrField(
                    'Pincode',
                    pinCtrl,
                    keyboard: TextInputType.number,
                  ),
                  const SizedBox(height: 12),
                  _addrField(
                    'Coupon / Affiliate Code (Optional)',
                    couponCtrl,
                    required: false,
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: () {
                        if (formKey.currentState!.validate()) {
                          Navigator.of(ctx).pop({
                            'fullName': nameCtrl.text.trim(),
                            'phone': phoneCtrl.text.trim(),
                            'addressLine1': addr1Ctrl.text.trim(),
                            'city': cityCtrl.text.trim(),
                            'state': stateCtrl.text.trim(),
                            'pincode': pinCtrl.text.trim(),
                            'couponCode': couponCtrl.text.trim().toUpperCase(),
                          });
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: greenAccent,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        'Confirm & Proceed',
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

    nameCtrl.dispose();
    phoneCtrl.dispose();
    addr1Ctrl.dispose();
    cityCtrl.dispose();
    stateCtrl.dispose();
    pinCtrl.dispose();
    couponCtrl.dispose();
    return result;
  }

  Widget _addrField(
    String label,
    TextEditingController ctrl, {
    TextInputType? keyboard,
    bool required = true,
  }) {
    return TextFormField(
      controller: ctrl,
      keyboardType: keyboard,
      validator: required
          ? (v) => (v == null || v.trim().isEmpty) ? 'Required' : null
          : null,
      style: GoogleFonts.plusJakartaSans(
        fontSize: 14,
        fontWeight: FontWeight.w500,
      ),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: GoogleFonts.plusJakartaSans(fontSize: 13, color: textMuted),
        filled: true,
        fillColor: backgroundWhite,
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
          borderSide: BorderSide(color: primaryBlue, width: 2),
        ),
      ),
    );
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          msg,
          style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600),
        ),
        backgroundColor: redAccent,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  void _showCounterSheet() {
    final n = _negotiation!;
    final quantity = n['requestedQuantity'] ?? 0;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Container(
          padding: EdgeInsets.fromLTRB(
            20,
            20,
            20,
            MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          decoration: const BoxDecoration(
            color: surfaceWhite,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: borderLight,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Your Counter Offer',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'For $quantity units',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 14,
                  color: slateBlue,
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'Price per unit (₹)',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _counterPriceController,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
                decoration: InputDecoration(
                  prefixText: '₹ ',
                  hintText: 'Enter your price',
                  hintStyle: GoogleFonts.plusJakartaSans(color: textMuted),
                  filled: true,
                  fillColor: backgroundWhite,
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
                    borderSide: BorderSide(color: primaryBlue, width: 2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Message (optional)',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _counterMessageController,
                maxLines: 2,
                style: GoogleFonts.plusJakartaSans(fontSize: 14),
                decoration: InputDecoration(
                  hintText: 'Add a note...',
                  hintStyle: GoogleFonts.plusJakartaSans(color: textMuted),
                  filled: true,
                  fillColor: backgroundWhite,
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
                    borderSide: BorderSide(color: primaryBlue, width: 2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: _isActioning ? null : _submitCounterOffer,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryBlue,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isActioning
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Text(
                          'Send Counter Offer',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
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

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark.copyWith(
        statusBarColor: Colors.transparent,
      ),
      child: Scaffold(
        backgroundColor: backgroundWhite,
        body: SafeArea(
          child: _isLoading
              ? const Center(
                  child: CircularProgressIndicator(color: primaryBlue),
                )
              : _error != null
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        _error!,
                        style: GoogleFonts.plusJakartaSans(color: textMuted),
                      ),
                      const SizedBox(height: 12),
                      TextButton(
                        onPressed: _fetchDetail,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : _buildContent(),
        ),
      ),
    );
  }

  Widget _buildContent() {
    final n = _negotiation!;
    final status = n['status'] as String? ?? 'pending';
    final productSnapshot = n['productSnapshot'] as Map<String, dynamic>? ?? {};
    final history = (n['history'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final quantity = n['requestedQuantity'] ?? 0;
    final currentPrice = n['currentPricePerUnit'] ?? 0;
    final currentTotal = n['currentTotalPrice'] ?? 0;
    final currentOfferBy = n['currentOfferBy'] as String? ?? '';
    final negotiationNumber = n['negotiationNumber'] as String? ?? '';
    final imageUrl = productSnapshot['image'] as String? ?? '';
    final productName = productSnapshot['name'] as String? ?? 'Product';
    final originalPrice = productSnapshot['price'] ?? 0;
    final canPay = n['canPay'] == true;

    return Column(
      children: [
        // Header
        Container(
          padding: const EdgeInsets.fromLTRB(4, 4, 16, 0),
          child: Row(
            children: [
              IconButton(
                onPressed: () => context.pop(),
                icon: const Icon(
                  Icons.arrow_back_ios_rounded,
                  size: 20,
                  color: textPrimary,
                ),
              ),
              Expanded(
                child: Text(
                  negotiationNumber.isNotEmpty
                      ? negotiationNumber
                      : 'Negotiation',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: textPrimary,
                    letterSpacing: -0.3,
                  ),
                ),
              ),
              const SizedBox(width: 40),
            ],
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _fetchDetail,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Product Card
                Container(
                  decoration: BoxDecoration(
                    color: surfaceWhite,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: borderLight),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Row(
                    children: [
                      if (imageUrl.isNotEmpty)
                        SizedBox(
                          width: 90,
                          height: 90,
                          child: CachedNetworkImage(
                            imageUrl: imageUrl,
                            fit: BoxFit.cover,
                            errorWidget: (_, __, ___) =>
                                Container(color: backgroundWhite),
                          ),
                        ),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                productName,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                  color: textPrimary,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Retail: ₹${NumberFormat('#,##,###').format(originalPrice)}',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 13,
                                  color: slateBlue,
                                ),
                              ),
                              Text(
                                'Qty: $quantity units',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 13,
                                  color: slateBlue,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Current Status Card
                _buildStatusCard(
                  status,
                  currentPrice,
                  currentTotal,
                  currentOfferBy,
                  quantity,
                ),
                const SizedBox(height: 20),

                // History Timeline
                Text(
                  'Negotiation History',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: textPrimary,
                  ),
                ),
                const SizedBox(height: 12),
                ...history.reversed.map((entry) => _buildHistoryItem(entry)),

                const SizedBox(height: 80),
              ],
            ),
          ),
        ),

        // Bottom Action Bar
        if (!['rejected', 'expired', 'converted'].contains(status))
          _buildBottomActions(status, currentOfferBy, canPay),
      ],
    );
  }

  Widget _buildStatusCard(
    String status,
    dynamic currentPrice,
    dynamic currentTotal,
    String currentOfferBy,
    dynamic quantity,
  ) {
    Color statusColor;
    String statusLabel;
    IconData statusIcon;

    switch (status) {
      case 'pending':
        statusColor = textMuted;
        statusLabel = 'Pending Review';
        statusIcon = Icons.hourglass_empty_rounded;
        break;
      case 'countered':
        statusColor = amberAccent;
        statusLabel = currentOfferBy == 'admin'
            ? 'Admin Counter Offer'
            : 'Your Counter Offer';
        statusIcon = Icons.swap_horiz_rounded;
        break;
      case 'accepted':
        statusColor = greenAccent;
        statusLabel = 'Accepted';
        statusIcon = Icons.check_circle_rounded;
        break;
      case 'rejected':
        statusColor = redAccent;
        statusLabel = 'Rejected';
        statusIcon = Icons.cancel_rounded;
        break;
      default:
        statusColor = textMuted;
        statusLabel = status.toUpperCase();
        statusIcon = Icons.info_outline;
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: surfaceWhite,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: statusColor.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Icon(statusIcon, color: statusColor, size: 22),
              const SizedBox(width: 8),
              Text(
                statusLabel,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: statusColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Current Price/unit',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 13,
                  color: slateBlue,
                ),
              ),
              Text(
                '₹${NumberFormat('#,##,###').format(currentPrice)}',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: statusColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Total ($quantity units)',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 13,
                  color: slateBlue,
                ),
              ),
              Text(
                '₹${NumberFormat('#,##,###').format(currentTotal)}',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: textPrimary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryItem(Map<String, dynamic> entry) {
    final action = entry['action'] as String? ?? '';
    final by = entry['by'] as String? ?? '';
    final price = entry['pricePerUnit'];
    final total = entry['totalPrice'];
    final message = entry['message'] as String? ?? '';
    final timestamp = entry['timestamp'] as String? ?? '';

    String formattedTime = '';
    if (timestamp.isNotEmpty) {
      try {
        formattedTime = DateFormat(
          'MMM d, h:mm a',
        ).format(DateTime.parse(timestamp));
      } catch (_) {}
    }

    Color dotColor;
    IconData dotIcon;
    String actionLabel;

    switch (action) {
      case 'requested':
        dotColor = primaryBlue;
        dotIcon = Icons.send_rounded;
        actionLabel = 'Negotiation Requested';
        break;
      case 'countered':
        dotColor = amberAccent;
        dotIcon = Icons.swap_horiz_rounded;
        actionLabel = by == 'admin'
            ? 'Admin Counter Offer'
            : 'Your Counter Offer';
        break;
      case 'accepted':
        dotColor = greenAccent;
        dotIcon = Icons.check_circle_rounded;
        actionLabel = by == 'admin' ? 'Accepted by Admin' : 'You Accepted';
        break;
      case 'rejected':
        dotColor = redAccent;
        dotIcon = Icons.cancel_rounded;
        actionLabel = by == 'admin' ? 'Rejected by Admin' : 'You Cancelled';
        break;
      default:
        dotColor = textMuted;
        dotIcon = Icons.circle;
        actionLabel = action;
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 0),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Timeline dot + line
            SizedBox(
              width: 32,
              child: Column(
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: dotColor.withOpacity(0.12),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(dotIcon, size: 14, color: dotColor),
                  ),
                  Expanded(child: Container(width: 2, color: borderLight)),
                ],
              ),
            ),
            const SizedBox(width: 12),
            // Content
            Expanded(
              child: Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: surfaceWhite,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: borderLight),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          actionLabel,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: dotColor,
                          ),
                        ),
                        if (formattedTime.isNotEmpty)
                          Text(
                            formattedTime,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 11,
                              color: textMuted,
                            ),
                          ),
                      ],
                    ),
                    if (price != null) ...[
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Text(
                            '₹${NumberFormat('#,##,###').format(price)}/unit',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: textPrimary,
                            ),
                          ),
                          if (total != null)
                            Text(
                              '  •  Total: ₹${NumberFormat('#,##,###').format(total)}',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 12,
                                color: slateBlue,
                              ),
                            ),
                        ],
                      ),
                    ],
                    if (message.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(
                        '"$message"',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 13,
                          fontStyle: FontStyle.italic,
                          color: slateBlue,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomActions(
    String status,
    String currentOfferBy,
    bool canPay,
  ) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      decoration: BoxDecoration(
        color: surfaceWhite,
        border: const Border(top: BorderSide(color: borderLight)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: _isActioning
            ? const Center(child: CircularProgressIndicator(color: primaryBlue))
            : _buildActionRow(status, currentOfferBy, canPay),
      ),
    );
  }

  Widget _buildActionRow(String status, String currentOfferBy, bool canPay) {
    if (status == 'accepted' && canPay) {
      return SizedBox(
        width: double.infinity,
        height: 48,
        child: ElevatedButton.icon(
          onPressed: _proceedToOrder,
          icon: const Icon(Icons.account_balance_wallet_rounded, size: 18),
          label: Text(
            'Proceed to Order',
            style: GoogleFonts.plusJakartaSans(
              fontSize: 15,
              fontWeight: FontWeight.w700,
            ),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: greenAccent,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
      );
    }

    if (status == 'countered' && currentOfferBy == 'admin') {
      return Row(
        children: [
          Expanded(
            child: OutlinedButton(
              onPressed: _rejectNegotiation,
              style: OutlinedButton.styleFrom(
                foregroundColor: redAccent,
                side: const BorderSide(color: redAccent),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: Text(
                'Decline',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: OutlinedButton(
              onPressed: _showCounterSheet,
              style: OutlinedButton.styleFrom(
                foregroundColor: amberAccent,
                side: const BorderSide(color: amberAccent),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: Text(
                'Counter',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: ElevatedButton(
              onPressed: _acceptOffer,
              style: ElevatedButton.styleFrom(
                backgroundColor: greenAccent,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: Text(
                'Accept',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ],
      );
    }

    if (status == 'pending' ||
        (status == 'countered' && currentOfferBy == 'wholesaler')) {
      return Row(
        children: [
          Expanded(
            child: OutlinedButton(
              onPressed: _rejectNegotiation,
              style: OutlinedButton.styleFrom(
                foregroundColor: redAccent,
                side: const BorderSide(color: redAccent),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: Text(
                'Cancel Negotiation',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ],
      );
    }

    if (status == 'accepted') {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: greenAccent.withOpacity(0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.check_circle_rounded, color: greenAccent, size: 18),
            const SizedBox(width: 8),
            Text(
              'Negotiation Completed',
              style: GoogleFonts.plusJakartaSans(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: greenAccent,
              ),
            ),
          ],
        ),
      );
    }

    return const SizedBox.shrink();
  }
}
