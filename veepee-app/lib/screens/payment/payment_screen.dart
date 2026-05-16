import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

import '../../core/theme/app_theme.dart';
import '../../core/providers/auth_provider.dart';

class PaymentScreen extends ConsumerStatefulWidget {
  final String orderId;

  const PaymentScreen({super.key, required this.orderId});

  @override
  ConsumerState<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends ConsumerState<PaymentScreen> {
  // Payment options
  bool _razorpayEnabled = false;
  bool _bankTransferEnabled = true;
  String _razorpayKeyId = '';
  
  // Bank details
  String _bankName = '';
  String _accountNumber = '';
  String _ifscCode = '';
  String _accountHolderName = '';
  String _upiId = '';
  String _upiDisplayName = '';
  
  // Order details
  double _orderTotal = 0;
  String _orderNumber = '';
  
  // UI state
  String _selectedMethod = 'bank'; // 'bank' or 'razorpay'
  String? _existingScreenshot;
  File? _selectedImage;
  bool _isLoading = true;
  bool _isUploading = false;
  bool _isProcessingRazorpay = false;
  String? _error;
  
  // Razorpay
  late Razorpay _razorpay;

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
    _loadData();
  }

  @override
  void dispose() {
    _razorpay.clear();
    super.dispose();
  }

  Future<void> _loadData() async {
    try {
      final api = ref.read(apiClientProvider);
      final results = await Future.wait([
        api.get('/settings/payment-options'),
        api.get('/orders/${widget.orderId}'),
        api.get('/payments/${widget.orderId}'),
      ]);

      final paymentOptions = results[0].data['data'];
      final order = results[1].data['data'];
      final payment = results[2].data['data'];

      if (!mounted) return;
      setState(() {
        // Payment options
        _razorpayEnabled = paymentOptions['razorpayEnabled'] ?? false;
        _bankTransferEnabled = paymentOptions['bankTransferEnabled'] ?? true;
        _razorpayKeyId = paymentOptions['razorpayKeyId'] ?? '';
        
        // Bank details
        final bankDetails = paymentOptions['bankDetails'];
        if (bankDetails != null) {
          _bankName = bankDetails['bankName'] ?? '';
          _accountNumber = bankDetails['accountNumber'] ?? '';
          _ifscCode = bankDetails['ifscCode'] ?? '';
          _accountHolderName = bankDetails['accountHolderName'] ?? '';
        }
        _upiId = paymentOptions['upiId'] ?? '';
        _upiDisplayName = paymentOptions['upiDisplayName'] ?? '';
        
        // Order details
        _orderTotal = (order['total'] ?? 0).toDouble();
        _orderNumber = order['orderNumber'] ?? '';
        _existingScreenshot = payment['screenshotUrl'];
        
        // Default to bank transfer only (razorpay disabled)
        _selectedMethod = 'bank';
        
        _isLoading = false;
      });
    } on DioException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.response?.data?['message']?.toString() ?? 'Failed to load payment details';
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() { _error = 'Something went wrong'; _isLoading = false; });
    }
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) async {
    setState(() => _isProcessingRazorpay = true);
    try {
      final api = ref.read(apiClientProvider);
      await api.post('/razorpay/verify', data: {
        'razorpay_order_id': response.orderId,
        'razorpay_payment_id': response.paymentId,
        'razorpay_signature': response.signature,
        'orderId': widget.orderId,
      });

      if (!mounted) return;
      setState(() => _isProcessingRazorpay = false);

      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Row(children: [
          const Icon(Icons.check_circle, color: Colors.white, size: 20),
          const SizedBox(width: 10),
          Expanded(child: Text('Payment successful!',
            style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600))),
        ]),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ));

      if (mounted) context.go('/order-success/${widget.orderId}');
    } catch (e) {
      if (!mounted) return;
      setState(() => _isProcessingRazorpay = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Payment verification failed. Please contact support.',
          style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ));
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    setState(() => _isProcessingRazorpay = false);
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text('Payment failed: ${response.message ?? 'Unknown error'}',
        style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600)),
      backgroundColor: AppColors.error,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      margin: const EdgeInsets.all(16),
    ));
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text('External wallet selected: ${response.walletName}',
        style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600)),
      backgroundColor: AppColors.info,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      margin: const EdgeInsets.all(16),
    ));
  }

  Future<void> _initiateRazorpayPayment() async {
    setState(() => _isProcessingRazorpay = true);
    try {
      final api = ref.read(apiClientProvider);
      final response = await api.post('/razorpay/create-order', data: {
        'orderId': widget.orderId,
      });

      final data = response.data['data'];
      final auth = ref.read(authProvider);

      final contact = data['prefill']?['contact'] ?? auth.user?.phone ?? '';
      final formattedContact = contact.isNotEmpty && !contact.startsWith('+')
          ? '+91$contact'
          : contact;

      var options = {
        'key': data['razorpayKeyId'],
        'amount': data['amount'],
        'currency': data['currency'],
        'name': 'OXON',
        'description': 'Order #${data['orderNumber']}',
        'order_id': data['razorpayOrderId'],
        'prefill': {
          'name': auth.user?.name ?? '',
          'email': auth.user?.email ?? '',
          'contact': formattedContact,
        },
        'theme': {
          'color': '#2563EB',
        },
      };

      _razorpay.open(options);
    } catch (e) {
      if (!mounted) return;
      setState(() => _isProcessingRazorpay = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Failed to initiate payment. Please try again.',
          style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ));
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, maxWidth: 1200, imageQuality: 85);
    if (picked != null && mounted) {
      setState(() => _selectedImage = File(picked.path));
    }
  }

  Future<void> _submitForVerification() async {
    if (_selectedImage == null && _existingScreenshot == null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Row(children: [
          const Icon(Icons.warning_amber_rounded, color: Colors.white, size: 20),
          const SizedBox(width: 10),
          Expanded(child: Text('Please upload a payment screenshot first',
            style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600))),
        ]),
        backgroundColor: AppColors.warning,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ));
      return;
    }

    if (_existingScreenshot != null) {
      // Already uploaded — just inform user
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Payment screenshot already submitted. Awaiting verification.',
          style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.info,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ));
      return;
    }

    setState(() => _isUploading = true);
    try {
      final api = ref.read(apiClientProvider);
      final formData = FormData.fromMap({
        'screenshot': await MultipartFile.fromFile(
          _selectedImage!.path,
          filename: 'payment_screenshot.jpg',
        ),
      });

      await api.post('/payments/${widget.orderId}/upload', data: formData);

      if (!mounted) return;
      setState(() { _isUploading = false; _existingScreenshot = 'uploaded'; });

      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Row(children: [
          const Icon(Icons.check_circle, color: Colors.white, size: 20),
          const SizedBox(width: 10),
          Expanded(child: Text('Payment screenshot submitted! Awaiting verification.',
            style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600))),
        ]),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ));

      // Navigate to order success
      if (mounted) context.go('/order-success/${widget.orderId}');
    } on DioException catch (e) {
      if (!mounted) return;
      final msg = e.response?.data?['message']?.toString() ?? 'Upload failed';
      setState(() => _isUploading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(msg, style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ));
    } catch (e) {
      if (!mounted) return;
      setState(() => _isUploading = false);
    }
  }

  String _formatPrice(double price) {
    return price.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (m) => '${m[1]},',
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: AppColors.backgroundLight,
        appBar: AppBar(backgroundColor: AppColors.backgroundLight, elevation: 0,
          leading: IconButton(onPressed: () => context.pop(),
            icon: const Icon(Icons.arrow_back_ios, color: AppColors.textPrimary)),
          title: Text('Payment', style: GoogleFonts.plusJakartaSans(
            fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
          centerTitle: true),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null) {
      return Scaffold(
        backgroundColor: AppColors.backgroundLight,
        appBar: AppBar(backgroundColor: AppColors.backgroundLight, elevation: 0,
          leading: IconButton(onPressed: () => context.pop(),
            icon: const Icon(Icons.arrow_back_ios, color: AppColors.textPrimary)),
          title: Text('Payment', style: GoogleFonts.plusJakartaSans(
            fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
          centerTitle: true),
        body: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.error_outline, size: 48, color: AppColors.error),
          const SizedBox(height: 16),
          Text(_error!, style: GoogleFonts.plusJakartaSans(fontSize: 16, color: AppColors.textSecondary)),
          const SizedBox(height: 16),
          ElevatedButton(onPressed: () { setState(() { _isLoading = true; _error = null; }); _loadData(); },
            child: const Text('Retry')),
        ])),
      );
    }

    final bool canSubmitBank = _selectedImage != null && _existingScreenshot == null;

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: AppColors.backgroundLight, elevation: 0,
        leading: IconButton(onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back_ios, color: AppColors.textPrimary)),
        title: Text('Payment', style: GoogleFonts.plusJakartaSans(
          fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          const SizedBox(height: 8),
          // Order badge
          if (_orderNumber.isNotEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.08),
                borderRadius: BorderRadius.circular(8)),
              child: Text('Order $_orderNumber', style: GoogleFonts.plusJakartaSans(
                fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.primary))),
          const SizedBox(height: 16),
          
          // Order Total Card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [AppColors.primary, AppColors.primary.withOpacity(0.8)]),
              borderRadius: BorderRadius.circular(16)),
            child: Column(children: [
              Text('Order Total', style: GoogleFonts.plusJakartaSans(
                fontSize: 14, fontWeight: FontWeight.w500, color: Colors.white70)),
              const SizedBox(height: 4),
              Text('₹${_formatPrice(_orderTotal)}', style: GoogleFonts.plusJakartaSans(
                fontSize: 36, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: -1)),
            ]),
          ),
          const SizedBox(height: 20),

          // Payment Method Tabs
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: AppColors.gray100,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(children: [
              // [COMMENTED OUT RAZORPAY] if (_razorpayEnabled)
              //   Expanded(child: _buildTabButton('razorpay', 'Pay via UPI', Icons.flash_on_rounded)),
              // if (_razorpayEnabled && _bankTransferEnabled)
              //   const SizedBox(width: 4),
              if (_bankTransferEnabled)
                Expanded(child: _buildTabButton('bank', 'Bank Transfer', Icons.account_balance_rounded)),
            ]),
          ),
          const SizedBox(height: 20),

          // [COMMENTED OUT RAZORPAY SECTION]
          // // Razorpay Section
          // if (_selectedMethod == 'razorpay' && _razorpayEnabled) ...[
          //   Container(
          //     padding: const EdgeInsets.all(24),
          //     decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16),
          //       border: Border.all(color: AppColors.border),
          //       boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10)]),
          //     child: Column(children: [
          //       Container(
          //         padding: const EdgeInsets.all(16),
          //         decoration: BoxDecoration(
          //           color: AppColors.primary.withOpacity(0.1), shape: BoxShape.circle),
          //         child: Icon(Icons.flash_on_rounded, size: 40, color: AppColors.primary)),
          //       const SizedBox(height: 16),
          //       Text('Quick & Secure Payment', style: GoogleFonts.plusJakartaSans(
          //         fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
          //       const SizedBox(height: 8),
          //       Text('Pay instantly using UPI, Cards, or Net Banking via Razorpay',
          //         textAlign: TextAlign.center,
          //         style: GoogleFonts.plusJakartaSans(fontSize: 14, color: AppColors.textSecondary)),
          //       const SizedBox(height: 24),
          //       SizedBox(width: double.infinity, height: 56,
          //         child: ElevatedButton(
          //           onPressed: _isProcessingRazorpay ? null : _initiateRazorpayPayment,
          //           style: ElevatedButton.styleFrom(
          //             backgroundColor: AppColors.primary,
          //             foregroundColor: Colors.white, elevation: 4,
          //             shadowColor: AppColors.primary.withOpacity(0.3),
          //             shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
          //           child: _isProcessingRazorpay
          //             ? const SizedBox(width: 24, height: 24,
          //                 child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
          //             : Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          //                 const Icon(Icons.lock_rounded, size: 20),
          //                 const SizedBox(width: 8),
          //                 Text('Pay ₹${_formatPrice(_orderTotal)}',
          //                   style: GoogleFonts.plusJakartaSans(fontSize: 16, fontWeight: FontWeight.w700)),
          //               ]))),
          //       const SizedBox(height: 12),
          //       Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          //         Icon(Icons.verified_user_rounded, size: 14, color: AppColors.success),
          //         const SizedBox(width: 4),
          //         Text('Secured by Razorpay', style: GoogleFonts.plusJakartaSans(
          //           fontSize: 12, color: AppColors.textSecondary)),
          //       ]),
          //     ]),
          //   ),
          // ],

          // Bank Transfer Section
          if (_selectedMethod == 'bank' && _bankTransferEnabled) ...[
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10)]),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Bank Transfer Details', style: GoogleFonts.plusJakartaSans(
                  fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                const SizedBox(height: 16),
                if (_bankName.isNotEmpty) _buildBankDetailRow('Bank Name', _bankName),
                if (_accountNumber.isNotEmpty) _buildBankDetailRow('Account No.', _accountNumber, copyable: true),
                if (_ifscCode.isNotEmpty) _buildBankDetailRow('IFSC Code', _ifscCode, copyable: true),
                if (_accountHolderName.isNotEmpty) _buildBankDetailRow('Account Holder', _accountHolderName),
                if (_upiId.isNotEmpty) ...[
                  const Divider(height: 24),
                  Text('OR Pay via UPI', style: GoogleFonts.plusJakartaSans(
                    fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  _buildBankDetailRow('UPI ID', _upiId, copyable: true),
                  if (_upiDisplayName.isNotEmpty)
                    _buildBankDetailRow('Name', _upiDisplayName),
                ],
              ]),
            ),
            const SizedBox(height: 20),

            // Upload Section
            Text('Upload Payment Proof', style: GoogleFonts.plusJakartaSans(
              fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
            const SizedBox(height: 8),
            Text('Upload a screenshot of your successful transaction',
              style: GoogleFonts.plusJakartaSans(fontSize: 14, color: AppColors.textSecondary)),
            const SizedBox(height: 16),

            // Upload Area / Preview
            GestureDetector(
              onTap: _existingScreenshot != null ? null : _pickImage,
              child: Container(
                width: double.infinity,
                constraints: const BoxConstraints(minHeight: 160),
                decoration: BoxDecoration(
                  color: _selectedImage != null ? Colors.white : AppColors.primary.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: _selectedImage != null ? AppColors.success : AppColors.primary.withOpacity(0.3))),
                child: _existingScreenshot != null
                  ? Padding(padding: const EdgeInsets.all(24),
                      child: Column(children: [
                        Icon(Icons.check_circle_rounded, size: 48, color: AppColors.success),
                        const SizedBox(height: 12),
                        Text('Screenshot Uploaded', style: GoogleFonts.plusJakartaSans(
                          fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.success)),
                        const SizedBox(height: 4),
                        Text('Awaiting admin verification', style: GoogleFonts.plusJakartaSans(
                          fontSize: 13, color: AppColors.textSecondary)),
                      ]))
                  : _selectedImage != null
                    ? Stack(children: [
                        ClipRRect(borderRadius: BorderRadius.circular(11),
                          child: Image.file(_selectedImage!, width: double.infinity,
                            height: 200, fit: BoxFit.cover)),
                        Positioned(top: 8, right: 8,
                          child: GestureDetector(
                            onTap: () => setState(() => _selectedImage = null),
                            child: Container(padding: const EdgeInsets.all(6),
                              decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                              child: const Icon(Icons.close, color: Colors.white, size: 16)))),
                      ])
                    : Padding(padding: const EdgeInsets.all(24),
                        child: Column(children: [
                          Container(padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withOpacity(0.1), shape: BoxShape.circle),
                            child: Icon(Icons.cloud_upload_outlined, size: 28, color: AppColors.primary)),
                          const SizedBox(height: 12),
                          Text('Tap to Select Screenshot', style: GoogleFonts.plusJakartaSans(
                            fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                          const SizedBox(height: 4),
                          Text('PNG or JPG (Max 5MB)', style: GoogleFonts.plusJakartaSans(
                            fontSize: 12, color: AppColors.textSecondary)),
                        ])),
              )),
            const SizedBox(height: 20),

            // Submit Button for Bank Transfer
            SizedBox(width: double.infinity, height: 56,
              child: ElevatedButton(
                onPressed: (_isUploading || !canSubmitBank) ? null : _submitForVerification,
                style: ElevatedButton.styleFrom(
                  backgroundColor: canSubmitBank ? AppColors.primary : AppColors.gray300,
                  foregroundColor: Colors.white, elevation: canSubmitBank ? 4 : 0,
                  shadowColor: AppColors.primary.withOpacity(0.3),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                child: _isUploading
                  ? const SizedBox(width: 24, height: 24,
                      child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                  : Text(_existingScreenshot != null ? 'Already Submitted' : 'Submit for Verification',
                      style: GoogleFonts.plusJakartaSans(fontSize: 16, fontWeight: FontWeight.w700)))),
            const SizedBox(height: 12),
            Text('Verification usually takes 30-60 minutes during business hours.',
              textAlign: TextAlign.center,
              style: GoogleFonts.plusJakartaSans(fontSize: 11, color: AppColors.textSecondary)),
          ],
          
          const SizedBox(height: 24),
        ]),
      ),
    );
  }

  Widget _buildTabButton(String method, String title, IconData icon) {
    final isSelected = _selectedMethod == method;
    return GestureDetector(
      onTap: () => setState(() => _selectedMethod = method),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          boxShadow: isSelected ? [
            BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2)),
          ] : null,
        ),
        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(icon, size: 18, color: isSelected ? AppColors.primary : AppColors.textSecondary),
          const SizedBox(width: 8),
          Text(title, style: GoogleFonts.plusJakartaSans(
            fontSize: 14, fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            color: isSelected ? AppColors.primary : AppColors.textSecondary)),
        ]),
      ),
    );
  }

  Widget _buildBankDetailRow(String label, String value, {bool copyable = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(label, style: GoogleFonts.plusJakartaSans(
          fontSize: 13, color: AppColors.textSecondary)),
        Row(children: [
          Text(value, style: GoogleFonts.plusJakartaSans(
            fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
          if (copyable) ...[
            const SizedBox(width: 8),
            GestureDetector(
              onTap: () {
                Clipboard.setData(ClipboardData(text: value));
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                  content: Text('$label copied!', style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600)),
                  backgroundColor: AppColors.primary,
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  margin: const EdgeInsets.all(16),
                  duration: const Duration(seconds: 1),
                ));
              },
              child: Icon(Icons.content_copy, size: 16, color: AppColors.primary)),
          ],
        ]),
      ]),
    );
  }
}
