import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:dio/dio.dart';

import '../../core/theme/app_theme.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/services/shipping_address_service.dart';

class BuyNowScreen extends ConsumerStatefulWidget {
  final String productId;
  final String productName;
  final String? productImage;
  final double price;
  final double? mrp;
  final int quantity;
  final int stock;

  const BuyNowScreen({
    super.key,
    required this.productId,
    required this.productName,
    this.productImage,
    required this.price,
    this.mrp,
    required this.quantity,
    this.stock = 99,
  });

  @override
  ConsumerState<BuyNowScreen> createState() => _BuyNowScreenState();
}

class _BuyNowScreenState extends ConsumerState<BuyNowScreen> {
  bool _isCheckingOut = false;

  // Coupon state
  String _couponCode = '';
  double _discount = 0;
  String? _appliedCouponCode;
  bool _isApplyingCoupon = false;
  String? _couponError;
  bool _couponSuccess = false;

  // Address state
  List<ShippingAddress> _savedAddresses = [];
  String _selectedAddressId = '';
  String _fullAddress = '';
  String _name = '';
  String _phone = '';
  String _addressLine1 = '';
  String _city = '';
  String _state = '';
  String _pincode = '';

  @override
  void initState() {
    super.initState();
    _loadSavedAddresses();
  }

  Future<void> _loadSavedAddresses() async {
    final addresses = await ShippingAddressService.getAddresses();
    if (!mounted) return;

    // Determine which address to select
    ShippingAddress? addressToSelect;
    if (addresses.isNotEmpty) {
      final primary = addresses.where((a) => a.slot == 'primary').toList();
      addressToSelect = primary.isNotEmpty ? primary.first : addresses.first;
    }

    if (!mounted) return;

    setState(() {
      _savedAddresses = addresses;
    });

    // Select address after setState completes
    if (addressToSelect != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          _selectAddress(addressToSelect!);
        }
      });
    }
  }

  void _selectAddress(ShippingAddress address) {
    setState(() {
      _selectedAddressId = address.id;
      _name = address.fullName;
      _phone = address.phone;
      _addressLine1 = address.addressLine1;
      _city = address.city;
      _state = address.state;
      _pincode = address.pincode;
      _fullAddress = '${address.addressLine1}, ${address.city}, ${address.state} - ${address.pincode}';
    });
  }

  String _fmt(double price) {
    return price
        .toStringAsFixed(0)
        .replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (m) => '${m[1]},',
        );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFf8fafc),
      body: Column(
        children: [
          // Custom App Bar
          Container(
            color: Colors.white,
            child: SafeArea(
              bottom: false,
              child: Container(
                padding: const EdgeInsets.fromLTRB(8, 8, 16, 8),
                decoration: const BoxDecoration(
                  border: Border(bottom: BorderSide(color: Color(0xFFe2e8f0))),
                ),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => context.pop(),
                      icon: const Icon(Icons.arrow_back_ios_new, color: Color(0xFF0f172a)),
                    ),
                    Expanded(
                      child: Text(
                        'Order Summary',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF0f172a),
                        ),
                      ),
                    ),
                    const SizedBox(width: 48),
                  ],
                ),
              ),
            ),
          ),

          // Content
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Product Card
                _buildProductCard(),
                const SizedBox(height: 16),

                // Coupon Section
                _buildCouponSection(),
                const SizedBox(height: 16),

                // Address Section
                _buildAddressSection(),
                const SizedBox(height: 16),

                // Price Summary
                _buildPriceSummary(),
                const SizedBox(height: 100),
              ],
            ),
          ),

          // Bottom CTA
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              border: const Border(top: BorderSide(color: Color(0xFFe2e8f0))),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 20,
                  offset: const Offset(0, -10),
                ),
              ],
            ),
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _canProceed() ? _proceedToCheckout : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF135bec),
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: const Color(0xFF94a3b8),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: _isCheckingOut
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation(Colors.white),
                            ),
                          )
                        : Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                'Proceed to Payment',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(width: 8),
                              const Icon(Icons.chevron_right, size: 20),
                            ],
                          ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  bool _canProceed() {
    return _fullAddress.isNotEmpty && _name.isNotEmpty && _phone.isNotEmpty && !_isCheckingOut;
  }

  Widget _buildProductCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFe2e8f0)),
      ),
      child: Row(
        children: [
          // Product Image
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: widget.productImage != null
                ? CachedNetworkImage(
                    imageUrl: widget.productImage!,
                    width: 80,
                    height: 80,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Container(
                      width: 80,
                      height: 80,
                      color: const Color(0xFFf1f5f9),
                    ),
                    errorWidget: (context, url, error) => Container(
                      width: 80,
                      height: 80,
                      color: const Color(0xFFf1f5f9),
                      child: const Icon(Icons.image, color: Color(0xFF94a3b8)),
                    ),
                  )
                : Container(
                    width: 80,
                    height: 80,
                    color: const Color(0xFFf1f5f9),
                    child: const Icon(Icons.image, color: Color(0xFF94a3b8)),
                  ),
          ),
          const SizedBox(width: 16),

          // Product Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.productName.split(' ').map((word) {
                    if (word.isEmpty) return word;
                    return word[0].toUpperCase() + word.substring(1).toLowerCase();
                  }).join(' '),
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 15.5,
                    fontWeight: FontWeight.w400,
                    color: const Color(0xFF0f172a),
                  ),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  'Qty: ${widget.quantity}',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF64748b),
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Text(
                      '₹${_fmt(widget.price)}',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF135bec),
                      ),
                    ),
                    if (widget.mrp != null && widget.mrp! > widget.price) ...[
                      const SizedBox(width: 8),
                      Text(
                        '₹${_fmt(widget.mrp!)}',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: const Color(0xFFEF4444),
                          decoration: TextDecoration.lineThrough,
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
    );
  }

  Widget _buildCouponSection() {
    // Show simplified view when coupon is applied
    if (_couponSuccess && _discount > 0) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF16a34a).withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFF16a34a)),
        ),
        child: Row(
          children: [
            const Icon(Icons.check_circle, color: Color(0xFF16a34a), size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Coupon applied! You save ₹${_discount.toStringAsFixed(0)}',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF16a34a),
                ),
              ),
            ),
            IconButton(
              onPressed: () {
                setState(() {
                  _couponSuccess = false;
                  _discount = 0;
                  _appliedCouponCode = null;
                  _couponCode = '';
                });
              },
              icon: const Icon(Icons.close, color: Color(0xFF16a34a), size: 20),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            ),
          ],
        ),
      );
    }

    // Show input field when no coupon applied
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFe2e8f0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Apply Coupon',
            style: GoogleFonts.plusJakartaSans(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF0f172a),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Container(
                  height: 48,
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: _couponError != null
                          ? AppColors.error
                          : const Color(0xFFe2e8f0),
                    ),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: TextField(
                    onChanged: (value) {
                      setState(() {
                        _couponCode = value.toUpperCase();
                      });
                    },
                    enabled: !_isApplyingCoupon,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 14,
                      color: const Color(0xFF0f172a),
                    ),
                    decoration: InputDecoration(
                      hintText: 'Enter coupon code',
                      hintStyle: GoogleFonts.plusJakartaSans(
                        fontSize: 14,
                        color: const Color(0xFF94a3b8),
                      ),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              SizedBox(
                height: 48,
                child: ElevatedButton(
                  onPressed: _couponCode.isEmpty || _isApplyingCoupon
                      ? null
                      : _applyCoupon,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0f172a),
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: const Color(0xFFe2e8f0),
                    disabledForegroundColor: const Color(0xFF94a3b8),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                  ),
                  child: _isApplyingCoupon
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation(Colors.white),
                          ),
                        )
                      : Text(
                          'Apply',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                ),
              ),
            ],
          ),
          if (_couponError != null) ...[
            const SizedBox(height: 8),
            Text(
              _couponError!,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 12,
                color: AppColors.error,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildAddressSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFe2e8f0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Delivery Address',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF0f172a),
                ),
              ),
              TextButton(
                onPressed: _showAddressSelectionDialog,
                child: Text(
                  _savedAddresses.isEmpty ? 'Add' : 'Change',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF135bec),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (_savedAddresses.isEmpty)
            InkWell(
              onTap: () {
                context.push('/addresses').then((_) => _loadSavedAddresses());
              },
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  border: Border.all(color: const Color(0xFFe2e8f0), style: BorderStyle.solid),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.add_location_alt, color: Color(0xFF135bec)),
                    const SizedBox(width: 8),
                    Text(
                      'Add Delivery Address',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF135bec),
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFf8fafc),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.person, size: 16, color: Color(0xFF64748b)),
                      const SizedBox(width: 8),
                      Text(
                        _name,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF0f172a),
                        ),
                      ),
                      const SizedBox(width: 16),
                      const Icon(Icons.phone, size: 16, color: Color(0xFF64748b)),
                      const SizedBox(width: 8),
                      Text(
                        _phone,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 14,
                          color: const Color(0xFF64748b),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.location_on, size: 16, color: Color(0xFF64748b)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _fullAddress,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 14,
                            color: const Color(0xFF64748b),
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
    );
  }

  Widget _buildPriceSummary() {
    final discountAmount = double.parse(_discount.toStringAsFixed(2));

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFe2e8f0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Price Summary',
            style: GoogleFonts.plusJakartaSans(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF0f172a),
            ),
          ),
          const SizedBox(height: 12),
          _buildPriceRow('Subtotal', '₹${_fmt(widget.price * widget.quantity)}', const Color(0xFF64748b)),
          const SizedBox(height: 8),
          _buildPriceRow('Delivery Fee', '₹${_fmt(50)}', const Color(0xFF64748b)),
          if (_couponSuccess && _discount > 0) ...[
            const SizedBox(height: 8),
            _buildPriceRow('Discount', '-₹${_discount.toStringAsFixed(2)}', const Color(0xFF16a34a)),
          ],
          Container(
            margin: const EdgeInsets.symmetric(vertical: 12),
            height: 1,
            color: const Color(0xFFe2e8f0),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Total',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF0f172a),
                ),
              ),
              Text(
                '₹${_fmt((widget.price * widget.quantity) + 50 - discountAmount)}',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF135bec),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPriceRow(String label, String value, Color valueColor) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 14,
            fontWeight: FontWeight.w400,
            color: const Color(0xFF64748b),
          ),
        ),
        Text(
          value,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: valueColor,
          ),
        ),
      ],
    );
  }

  Future<void> _applyCoupon() async {
    if (_couponCode.isEmpty) {
      setState(() {
        _couponError = 'Please enter a coupon code';
        _couponSuccess = false;
      });
      return;
    }

    setState(() {
      _isApplyingCoupon = true;
      _couponError = null;
    });

    try {
      final api = ref.read(apiClientProvider);

      final subtotal = widget.price * widget.quantity;

      final response = await api.post(
        '/orders/preview-coupon',
        data: {
          'couponCode': _couponCode,
          'subtotal': subtotal,
        },
      );

      if (!mounted) return;

      if (response.data['success'] == true) {
        setState(() {
          _discount = (response.data['data']['discount'] ?? 0).toDouble();
          _appliedCouponCode = _couponCode;
          _couponSuccess = true;
          _couponError = null;
        });
      } else {
        setState(() {
          _couponError = response.data['message'] ?? 'Invalid coupon code';
          _couponSuccess = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _couponError = 'Failed to apply coupon';
        _couponSuccess = false;
      });
    } finally {
      if (mounted) {
        setState(() {
          _isApplyingCoupon = false;
        });
      }
    }
  }

  Future<void> _showAddressDialog() async {
    final nameController = TextEditingController(text: _name);
    final phoneController = TextEditingController(text: _phone);
    final address1Controller = TextEditingController(text: _addressLine1);
    final cityController = TextEditingController(text: _city);
    final stateController = TextEditingController(text: _state);
    final pinController = TextEditingController(text: _pincode);
    final formKey = GlobalKey<FormState>();

    final result = await showModalBottomSheet<Map<String, String>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(ctx).viewInsets.bottom,
        ),
        child: Container(
          margin: EdgeInsets.only(top: MediaQuery.of(ctx).padding.top + 40),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
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
                        color: const Color(0xFFe2e8f0),
                        borderRadius: BorderRadius.circular(100),
                      ),
                    ),
                  ),
                  Text(
                    'Shipping Address',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF0f172a),
                    ),
                  ),
                  const SizedBox(height: 20),
                  _buildAddressField('Full Name', nameController, TextInputType.text),
                  const SizedBox(height: 12),
                  _buildAddressField('Phone', phoneController, TextInputType.phone),
                  const SizedBox(height: 12),
                  _buildAddressField('Address Line 1', address1Controller, TextInputType.text),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildAddressField('City', cityController, TextInputType.text),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildAddressField('State', stateController, TextInputType.text),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _buildAddressField('Pincode', pinController, TextInputType.number),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: () {
                        if (formKey.currentState!.validate()) {
                          Navigator.of(ctx).pop({
                            'fullName': nameController.text.trim(),
                            'phone': phoneController.text.trim(),
                            'addressLine1': address1Controller.text.trim(),
                            'city': cityController.text.trim(),
                            'state': stateController.text.trim(),
                            'pincode': pinController.text.trim(),
                          });
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF135bec),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        'Confirm & Pay',
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

    // Dispose controllers first
    nameController.dispose();
    phoneController.dispose();
    address1Controller.dispose();
    cityController.dispose();
    stateController.dispose();
    pinController.dispose();

    // Then update state after the frame has settled to avoid widget tree issues
    if (result != null && mounted) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          setState(() {
            _name = result['fullName'] ?? '';
            _phone = result['phone'] ?? '';
            _addressLine1 = result['addressLine1'] ?? '';
            _city = result['city'] ?? '';
            _state = result['state'] ?? '';
            _pincode = result['pincode'] ?? '';
            _fullAddress = '$_addressLine1, $_city, $_state - $_pincode';
            _selectedAddressId = 'manual';
          });
        }
      });
    }
  }

  Widget _buildAddressField(String label, TextEditingController controller, TextInputType keyboardType) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
      style: GoogleFonts.plusJakartaSans(
        fontSize: 14,
        fontWeight: FontWeight.w500,
      ),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: GoogleFonts.plusJakartaSans(color: const Color(0xFF64748b)),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFFe2e8f0)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFFe2e8f0)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFF135bec)),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFFdc2626)),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
    );
  }

  Future<void> _showAddressSelectionDialog() async {
    // Refresh addresses first
    await _loadSavedAddresses();

    if (!mounted) return;

    if (_savedAddresses.isEmpty) {
      // No saved addresses, navigate to address screen to add new
      context.push('/addresses').then((_) => _loadSavedAddresses());
      return;
    }

    final result = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Select Address',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF0f172a),
                  ),
                ),
                TextButton(
                  onPressed: () {
                    Navigator.pop(context);
                    // Navigate to address screen to add new address
                    context.push('/addresses').then((_) {
                      // Reload addresses after returning
                      _loadSavedAddresses();
                    });
                  },
                  child: Text(
                    '+ Add New',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF135bec),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ..._savedAddresses.map((address) => InkWell(
                  onTap: () {
                    Navigator.pop(context, address.id);
                  },
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: _selectedAddressId == address.id
                            ? const Color(0xFF135bec)
                            : const Color(0xFFe2e8f0),
                        width: _selectedAddressId == address.id ? 2 : 1,
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          _selectedAddressId == address.id
                              ? Icons.radio_button_checked
                              : Icons.radio_button_off,
                          color: _selectedAddressId == address.id
                              ? const Color(0xFF135bec)
                              : const Color(0xFF94a3b8),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    address.fullName,
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: const Color(0xFF0f172a),
                                    ),
                                  ),
                                  if (address.slot == 'primary') ...[
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF135bec)
                                            .withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        'Primary',
                                        style: GoogleFonts.plusJakartaSans(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w600,
                                          color: const Color(0xFF135bec),
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${address.addressLine1}, ${address.city}, ${address.state} - ${address.pincode}',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 12,
                                  color: const Color(0xFF64748b),
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Phone: ${address.phone}',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 12,
                                  color: const Color(0xFF64748b),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                )),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );

    if (result != null && mounted) {
      final selectedAddress =
          _savedAddresses.firstWhere((a) => a.id == result);
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          _selectAddress(selectedAddress);
        }
      });
    }
  }

  Future<void> _proceedToCheckout() async {
    if (!_canProceed()) return;

    setState(() => _isCheckingOut = true);

    try {
      final api = ref.read(apiClientProvider);

      final address = {
        'fullName': _name,
        'phone': _phone,
        'addressLine1': _addressLine1.isNotEmpty ? _addressLine1 : _fullAddress,
        'city': _city,
        'state': _state,
        'pincode': _pincode,
      };

      final response = await api.post(
        '/orders',
        data: {
          'items': [
            {
              'productId': widget.productId,
              'quantity': widget.quantity,
            }
          ],
          'shippingAddress': address,
          if (_appliedCouponCode != null && _appliedCouponCode!.isNotEmpty)
            'couponCode': _appliedCouponCode,
        },
      );

      if (!mounted) return;
      setState(() => _isCheckingOut = false);

      if (response.data['success'] == true) {
        final orderId = response.data['data']['orderId'];
        context.push('/payment/$orderId');
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              response.data['message'] ?? 'Order creation failed',
              style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600),
            ),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } on DioException catch (e) {
      if (!mounted) return;
      setState(() => _isCheckingOut = false);

      String msg = 'Failed to create order';
      if (e.response?.data?['message'] != null) {
        msg = e.response!.data['message'].toString();
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(msg, style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600)),
          backgroundColor: AppColors.error,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _isCheckingOut = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to create order', style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600)),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }
}
