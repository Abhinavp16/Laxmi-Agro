import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:dio/dio.dart';

import '../../core/config/api_config.dart';
import '../../core/config/feature_flags.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/services/shipping_address_service.dart';
import '../../core/services/negotiation_socket_service.dart';
import '../../core/utils/number_formatter.dart';
import '../../widgets/order_checkout_actions_sheet.dart';
import '../../widgets/state_city_pincode_fields.dart';

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
  final List<Map<String, dynamic>> _optimisticMessages = [];
  final Map<String, bool> _typingUsers = {}; // { userId: isTyping }
  final Map<String, bool> _readReceipts = {}; // { messageId: isRead }
  final _counterMessageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final NegotiationSocketService _socketService = NegotiationSocketService();
  int _detailRequestSequence = 0;
  bool _refreshAfterInitialLoad = false;
  static const int maxMessageLength = 280;

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
    _initializeSocket();
  }

  void _initializeSocket() {
    final auth = ref.read(authProvider);

    _socketService.onMessageReceived = (data) {
      if (data['negotiationId']?.toString() != widget.negotiationId) return;
      _refreshFromSocket();
    };
    _socketService.onNegotiationChanged = _refreshFromSocket;

    _socketService.onUserTyping = (userId, username) {
      if (mounted) {
        setState(() {
          _typingUsers[userId] = true;
        });
      }
    };

    _socketService.onStopTyping = (userId, _) {
      if (mounted) {
        setState(() {
          _typingUsers.remove(userId);
        });
      }
    };

    _socketService.onReadReceipt = (messageId, userId) {
      if (mounted) {
        setState(() {
          _readReceipts[messageId] = true;
        });
      }
    };

    _socketService.onConnect = () {
      if (mounted) {
        setState(_typingUsers.clear);
      }
    };
    _socketService.onReconnect = _refreshFromSocket;

    _socketService.onDisconnect = () {
      debugPrint('[Socket] Disconnected');
      if (mounted) {
        setState(_typingUsers.clear);
      }
    };

    if (auth.user?.id != null) {
      _socketService.connect(
        serverUrl: ApiConfig.publicBaseUrl,
        negotiationId: widget.negotiationId,
        userId: auth.user!.id,
        userRole: 'wholesaler',
        username: auth.user?.name ?? 'Wholesaler',
      );
    }
  }

  void _refreshFromSocket() {
    if (!mounted) return;
    if (_negotiation == null || _isLoading) {
      _refreshAfterInitialLoad = true;
      return;
    }
    _fetchDetail(background: true);
  }

  void _flushQueuedRefresh() {
    if (!_refreshAfterInitialLoad || _negotiation == null || _isLoading) return;
    _refreshAfterInitialLoad = false;
    _fetchDetail(background: true);
  }

  @override
  void dispose() {
    _counterMessageController.dispose();
    _scrollController.dispose();

    // Disconnect from socket
    final auth = ref.read(authProvider);
    if (auth.user?.id != null) {
      _socketService.leaveNegotiation(
        userId: auth.user!.id,
        userRole: 'wholesaler',
      );
    }
    _socketService.disconnect();

    super.dispose();
  }

  Future<bool> _fetchDetail({bool background = false}) async {
    if (!mounted) return false;
    final requestSequence = ++_detailRequestSequence;
    if (!background) {
      setState(() {
        _isLoading = true;
        _error = null;
      });
    }

    try {
      final api = ref.read(apiClientProvider);
      final response = await api.get('/negotiations/${widget.negotiationId}');
      if (!mounted || requestSequence != _detailRequestSequence) return false;

      if (response.data['success'] == true) {
        setState(() {
          _negotiation = response.data['data'];
          final history = (_negotiation?['history'] as List?) ?? const [];
          final confirmedMessageIds = history
              .map((entry) => entry is Map ? entry['messageId']?.toString() : null)
              .whereType<String>()
              .toSet();
          _optimisticMessages.removeWhere(
            (entry) => confirmedMessageIds.contains(entry['messageId']),
          );
          _error = null;
          _isLoading = false;
        });
        _flushQueuedRefresh();
        Future.delayed(const Duration(milliseconds: 50), () {
          if (mounted) _scrollToBottom();
        });
        return true;
      } else {
        if (!background) {
          setState(() {
            _error = response.data['message']?.toString() ?? 'Failed to load';
            _isLoading = false;
          });
          _flushQueuedRefresh();
        }
      }
    } on DioException catch (e) {
      if (!mounted || requestSequence != _detailRequestSequence) return false;
      if (!background) {
        setState(() {
          _error = e.response?.data?['message']?.toString() ?? 'Failed to load';
          _isLoading = false;
        });
        _flushQueuedRefresh();
      }
    } catch (_) {
      if (!mounted || requestSequence != _detailRequestSequence) return false;
      if (!background) {
        setState(() {
          _error = 'Something went wrong';
          _isLoading = false;
        });
        _flushQueuedRefresh();
      }
    }
    return false;
  }

  // NOTE: wholesalers negotiate through chat messages only. Accept, counter
  // and reject are admin/staff actions performed from the admin panel, so the
  // corresponding app actions were removed. _proceedToOrder below is kept as a
  // legacy fallback for negotiations accepted before order auto-creation.
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
          await OrderCheckoutActionsSheet.handleSuccessfulCheckout(
            context: context,
            apiClient: api,
            responseData: response.data,
          );
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
    final savedAddress = await ShippingAddressService.getSelectedAddress();
    if (!mounted) return null;
    final auth = ref.read(authProvider);
    final nameCtrl = TextEditingController(
      text: savedAddress?.fullName ?? auth.user?.name ?? '',
    );
    final phoneCtrl = TextEditingController(
      text: savedAddress?.phone ?? auth.user?.phone ?? '',
    );
    final addr1Ctrl = TextEditingController(
      text: savedAddress?.addressLine1 ?? '',
    );
    final cityCtrl = TextEditingController(text: savedAddress?.city ?? '');
    final stateCtrl = TextEditingController(text: savedAddress?.state ?? '');
    final pinCtrl = TextEditingController(text: savedAddress?.pincode ?? '');
    final couponCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();

    Map<String, String>?
    result = await showModalBottomSheet<Map<String, String>>(
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
                  StateCityPincodeFields(
                    stateController: stateCtrl,
                    cityController: cityCtrl,
                    pincodeController: pinCtrl,
                  ),
                  if (!kHideOfferCouponUi) ...[
                    const SizedBox(height: 12),
                    _addrField(
                      'Coupon / Affiliate Code (Optional)',
                      couponCtrl,
                      required: false,
                    ),
                  ],
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

    if (result != null) {
      final address = ShippingAddress(
        id: savedAddress?.id ?? ShippingAddress.generateId(),
        slot: savedAddress?.slot ?? ShippingAddressService.slotPrimary,
        fullName: result['fullName'] ?? '',
        phone: result['phone'] ?? '',
        addressLine1: result['addressLine1'] ?? '',
        city: result['city'] ?? '',
        state: result['state'] ?? '',
        pincode: result['pincode'] ?? '',
      );
      await ShippingAddressService.upsertAddress(address);
      await ShippingAddressService.setSelectedAddressId(address.id);
      result = {
        ...address.toOrderPayload(),
        'couponCode': result['couponCode'] ?? '',
      };
    }

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

  // NOTE: counter sheet removed — wholesalers reply through chat messages only.

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
    final orderRef = n['orderId'];
    final orderId = orderRef is Map
        ? orderRef['_id']?.toString()
        : orderRef?.toString();
    final orderNumber = orderRef is Map
        ? orderRef['orderNumber']?.toString() ?? ''
        : (n['orderNumber']?.toString() ?? '');
    final approvedBy = n['approvedBy'] as Map<String, dynamic>?;
    final approvedByLabel = approvedBy == null
        ? null
        : 'Accepted by ${(approvedBy['role'] == 'staff' ? 'Staff' : 'Admin')}${approvedBy['name'] != null && (approvedBy['name'] as String).isNotEmpty ? ' ${approvedBy['name']}' : ''}';

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
              controller: _scrollController,
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
                                'Retail: ₹${NumberFormatter.formatPrice(originalPrice)}',
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
                if (approvedByLabel != null) ...[
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: greenAccent.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.verified_rounded,
                          color: greenAccent,
                          size: 18,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            approvedByLabel,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: greenAccent,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                if (orderId != null && orderId.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: OutlinedButton.icon(
                      onPressed: () => context.push('/tracking/$orderId'),
                      icon: const Icon(Icons.local_shipping_outlined, size: 18),
                      label: Text(
                        orderNumber.isNotEmpty
                            ? 'View Order $orderNumber'
                            : 'View Order',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: primaryBlue,
                        side: BorderSide(color: primaryBlue),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 20),

                // History Timeline
                Text(
                  'Chat & History',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: textPrimary,
                  ),
                ),
                const SizedBox(height: 12),
                ...history.map((entry) {
                  if (entry['action'] == 'message') {
                    return _buildChatMessage(
                      entry['by'] as String,
                      entry['message'] as String,
                      entry['timestamp'] != null
                          ? DateFormat('h:mm a').format(
                              DateTime.parse(entry['timestamp'] as String),
                            )
                          : '',
                      entry['messageId'] as String?,
                    );
                  }
                  return _buildHistoryItem(entry);
                }),
                ..._optimisticMessages.map(
                  (msg) => _buildChatMessage(
                    msg['by'] as String,
                    msg['message'] as String,
                    DateFormat(
                      'h:mm a',
                    ).format(DateTime.parse(msg['timestamp'] as String)),
                    msg['messageId'] as String?,
                  ),
                ),

                const SizedBox(height: 80),
              ],
            ),
          ),
        ),

        // Bottom Action Bar — chat stays open on converted orders so the
        // wholesaler can follow up; only closed states hide it.
        if (!['rejected', 'expired'].contains(status))
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
                '₹${NumberFormatter.formatPrice(currentPrice)}',
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
                '₹${NumberFormatter.formatPrice(currentTotal)}',
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

    // Handle chat messages differently
    if (action == 'message') {
      return _buildChatMessage(by, message, formattedTime);
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
                            '₹${NumberFormatter.formatPrice(price)}/unit',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: textPrimary,
                            ),
                          ),
                          if (total != null)
                            Text(
                              '  •  Total: ₹${NumberFormatter.formatPrice(total)}',
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

  Widget _buildChatMessage(
    String by,
    String message,
    String timestamp, [
    String? messageId,
  ]) {
    final isAdmin = by == 'admin';
    final messageColor = isAdmin ? primaryBlue : slateBlue;
    final bgColor = isAdmin ? primaryBlue.withOpacity(0.08) : backgroundWhite;
    final alignment = isAdmin
        ? CrossAxisAlignment.start
        : CrossAxisAlignment.end;
    final isRead = messageId != null
        ? _readReceipts[messageId] ?? false
        : false;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: alignment,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: messageColor.withOpacity(0.2)),
            ),
            child: Column(
              crossAxisAlignment: alignment,
              children: [
                // Sender badge + timestamp
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: messageColor.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        isAdmin ? 'ADMIN' : 'YOU',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: messageColor,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    if (timestamp.isNotEmpty)
                      Text(
                        timestamp,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 10,
                          color: textMuted,
                        ),
                      ),
                    if (!isAdmin && isRead) ...[
                      const SizedBox(width: 6),
                      Icon(
                        Icons.done_all_rounded,
                        size: 12,
                        color: primaryBlue,
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 6),
                // Message text
                Text(
                  message,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: textPrimary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _sendChatMessage() async {
    final messageText = _counterMessageController.text.trim();
    if (messageText.isEmpty) {
      _showError('Please enter a message');
      return;
    }

    if (messageText.length > maxMessageLength) {
      _showError('Message too long (max $maxMessageLength characters)');
      return;
    }

    // Optimistic update - show message immediately
    final optimisticMessage = {
      'action': 'message',
      'by': 'wholesaler',
      'message': messageText,
      'timestamp': DateTime.now().toIso8601String(),
      'messageId': 'temp-${DateTime.now().millisecondsSinceEpoch}',
      'isOptimistic': true,
    };

    setState(() {
      _optimisticMessages.add(optimisticMessage);
      _counterMessageController.clear();
    });

    // Auto-scroll to newest message
    Future.delayed(const Duration(milliseconds: 100), () {
      _scrollToBottom();
    });

    setState(() => _isActioning = true);
    try {
      final api = ref.read(apiClientProvider);
      await api.post(
        '/negotiations/${widget.negotiationId}/message',
        data: {
          'message': messageText,
          'messageId': optimisticMessage['messageId'],
        },
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Message sent!',
              style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600),
            ),
            backgroundColor: primaryBlue,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            duration: const Duration(milliseconds: 1500),
          ),
        );
        await _fetchDetail(background: true);
      }
    } on DioException catch (e) {
      if (!mounted) return;
      _showError(
        e.response?.data?['message']?.toString() ?? 'Failed to send message',
      );
      // Remove optimistic message on error
      setState(
        () => _optimisticMessages.removeWhere(
          (m) => m['messageId'] == optimisticMessage['messageId'],
        ),
      );
    } finally {
      if (mounted) setState(() => _isActioning = false);
    }
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
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
      child: SafeArea(child: _buildActionRow(status, currentOfferBy, canPay)),
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

    // Chat input for open + converted negotiations (admin confirms the order;
    // wholesalers reply through chat only)
    return _buildChatInput();
  }

  Widget _buildChatInput() {
    final auth = ref.read(authProvider);
    final typingIndicatorText = _typingUsers.isNotEmpty
        ? '${_typingUsers.keys.toList().join(', ')} is typing...'
        : '';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (typingIndicatorText.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(
              typingIndicatorText,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 12,
                color: textMuted,
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _counterMessageController,
                enabled: !_isActioning,
                maxLines: 3,
                minLines: 1,
                onChanged: (value) {
                  setState(() {});

                  // Emit typing indicator
                  if (auth.user?.id != null && value.isNotEmpty) {
                    _socketService.emitTyping(
                      userId: auth.user!.id,
                      username: auth.user?.name ?? 'Wholesaler',
                      userRole: 'wholesaler',
                    );
                  } else if (value.isEmpty && auth.user?.id != null) {
                    _socketService.emitStopTyping(userId: auth.user!.id);
                  }
                },
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
                decoration: InputDecoration(
                  hintText: 'Type a message... (max 280 chars)',
                  hintStyle: GoogleFonts.plusJakartaSans(color: textMuted),
                  filled: true,
                  fillColor: backgroundWhite,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 12,
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
                    borderSide: BorderSide(color: primaryBlue, width: 2),
                  ),
                  disabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide(color: borderLight),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            SizedBox(
              height: 48,
              width: 48,
              child: ElevatedButton(
                onPressed:
                    (_isActioning || _counterMessageController.text.isEmpty)
                    ? null
                    : _sendChatMessage,
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryBlue,
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: textMuted.withOpacity(0.3),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  padding: EdgeInsets.zero,
                ),
                child: _isActioning
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.send_rounded, size: 18),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          '${_counterMessageController.text.length}/$maxMessageLength',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 11,
            color: _counterMessageController.text.length > maxMessageLength
                ? redAccent
                : textMuted,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
