import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../widgets/app_image.dart';
import 'package:intl/intl.dart';

import '../../core/providers/auth_provider.dart';

class NegotiationsScreen extends ConsumerStatefulWidget {
  const NegotiationsScreen({super.key});

  @override
  ConsumerState<NegotiationsScreen> createState() => _NegotiationsScreenState();
}

class _NegotiationsScreenState extends ConsumerState<NegotiationsScreen>
    with WidgetsBindingObserver {
  int _selectedTab = 0;
  bool _isLoading = true;
  String? _error;
  List<Map<String, dynamic>> _negotiations = [];

  static const Color primaryBlue = Color(0xFF2563EB);
  static const Color backgroundWhite = Color(0xFFF8FAFC);
  static const Color surfaceWhite = Color(0xFFFFFFFF);
  static const Color textPrimary = Color(0xFF1E293B);
  static const Color textMuted = Color(0xFF94A3B8);
  static const Color borderLight = Color(0xFFE2E8F0);
  static const Color slateBlue = Color(0xFF4C669A);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _fetchNegotiations();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _fetchNegotiations();
    }
  }

  Future<void> _fetchNegotiations() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final api = ref.read(apiClientProvider);
      final response = await api.get('/negotiations');
      final data = response.data;
      if (data['success'] == true) {
        final List items = data['data'] ?? [];
        setState(() {
          _negotiations = items.cast<Map<String, dynamic>>();
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() { _error = 'Failed to load negotiations'; _isLoading = false; });
    }
  }

  List<Map<String, dynamic>> get _filteredNegotiations {
    if (_selectedTab == 0) return _negotiations;
    if (_selectedTab == 1) {
      return _negotiations.where((n) =>
        ['pending', 'countered'].contains(n['status'])).toList();
    }
    // Completed tab
    return _negotiations.where((n) =>
      ['accepted', 'rejected', 'expired', 'converted'].contains(n['status'])).toList();
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark.copyWith(statusBarColor: Colors.transparent),
      child: Scaffold(
        backgroundColor: backgroundWhite,
        body: SafeArea(
          child: Column(
            children: [
              // Header
              Container(
                padding: const EdgeInsets.fromLTRB(4, 4, 16, 0),
                color: backgroundWhite,
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => context.pop(),
                      icon: const Icon(Icons.arrow_back_ios_rounded, size: 20, color: textPrimary),
                    ),
                    Expanded(
                      child: Text(
                        'Negotiations',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 18, fontWeight: FontWeight.w700,
                          color: textPrimary, letterSpacing: -0.3,
                        ),
                      ),
                    ),
                    const SizedBox(width: 40),
                  ],
                ),
              ),
              // Tabs
              Container(
                decoration: const BoxDecoration(
                  border: Border(bottom: BorderSide(color: borderLight, width: 1)),
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: [
                      _buildTab('All', 0),
                      const SizedBox(width: 32),
                      _buildTab('Active', 1),
                      const SizedBox(width: 32),
                      _buildTab('Completed', 2),
                    ],
                  ),
                ),
              ),
              // Content
              Expanded(
                child: RefreshIndicator(
                  color: primaryBlue,
                  onRefresh: _fetchNegotiations,
                  child: _isLoading
                      ? ListView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          children: const [
                            SizedBox(height: 200),
                            Center(child: CircularProgressIndicator(color: primaryBlue)),
                          ],
                        )
                      : _error != null
                          ? ListView(
                              physics: const AlwaysScrollableScrollPhysics(),
                              children: [
                                const SizedBox(height: 200),
                                Center(
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(_error!, style: GoogleFonts.plusJakartaSans(color: textMuted)),
                                      const SizedBox(height: 12),
                                      TextButton(onPressed: _fetchNegotiations, child: const Text('Retry')),
                                    ],
                                  ),
                                ),
                              ],
                            )
                          : _filteredNegotiations.isEmpty
                              ? ListView(
                                  physics: const AlwaysScrollableScrollPhysics(),
                                  children: [
                                    const SizedBox(height: 200),
                                    Center(
                                      child: Column(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(Icons.handshake_outlined, size: 48, color: textMuted.withOpacity(0.5)),
                                          const SizedBox(height: 12),
                                          Text(
                                            _selectedTab == 1 ? 'No active negotiations' :
                                            _selectedTab == 2 ? 'No completed negotiations' :
                                            'No negotiations yet',
                                            style: GoogleFonts.plusJakartaSans(fontSize: 16, fontWeight: FontWeight.w600, color: textMuted),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            'Start negotiating on product pages',
                                            style: GoogleFonts.plusJakartaSans(fontSize: 13, color: slateBlue),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                )
                              : ListView.builder(
                                  physics: const AlwaysScrollableScrollPhysics(),
                                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
                                  itemCount: _filteredNegotiations.length,
                                  itemBuilder: (context, index) =>
                                      _buildNegotiationCard(_filteredNegotiations[index]),
                                ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTab(String label, int index) {
    final isSelected = _selectedTab == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedTab = index),
      child: Container(
        padding: const EdgeInsets.only(top: 16, bottom: 13),
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
          style: GoogleFonts.plusJakartaSans(
            fontSize: 14, fontWeight: FontWeight.w700,
            letterSpacing: 0.3,
            color: isSelected ? primaryBlue : slateBlue,
          ),
        ),
      ),
    );
  }

  Map<String, dynamic> _getStatusDisplay(String status) {
    switch (status) {
      case 'pending':
        return {'label': 'PENDING', 'color': const Color(0xFF6B7280), 'bg': const Color(0xFFF3F4F6)};
      case 'countered':
        return {'label': 'COUNTER-OFFER', 'color': const Color(0xFFF59E0B), 'bg': const Color(0xFFFEF3C7)};
      case 'accepted':
        return {'label': 'ACCEPTED', 'color': const Color(0xFF16A34A), 'bg': const Color(0xFFDCFCE7)};
      case 'rejected':
        return {'label': 'REJECTED', 'color': const Color(0xFFDC2626), 'bg': const Color(0xFFFEE2E2)};
      case 'expired':
        return {'label': 'EXPIRED', 'color': const Color(0xFF9CA3AF), 'bg': const Color(0xFFF3F4F6)};
      case 'converted':
        return {'label': 'CONVERTED', 'color': const Color(0xFF7C3AED), 'bg': const Color(0xFFF3E8FF)};
      default:
        return {'label': status.toUpperCase(), 'color': const Color(0xFF6B7280), 'bg': const Color(0xFFF3F4F6)};
    }
  }

  Widget _buildNegotiationCard(Map<String, dynamic> negotiation) {
    final status = negotiation['status'] as String? ?? 'pending';
    final statusDisplay = _getStatusDisplay(status);
    final product = negotiation['product'] as Map<String, dynamic>? ?? {};
    final productName = product['name'] as String? ?? 'Unknown Product';
    final imageUrl = product['image'] as String? ?? '';
    final quantity = negotiation['requestedQuantity'] ?? 0;
    final requestedPrice = negotiation['requestedPricePerUnit'] ?? 0;
    final currentPrice = negotiation['currentPricePerUnit'] ?? 0;
    final currentTotal = negotiation['currentTotalPrice'] ?? 0;
    final currentOfferBy = negotiation['currentOfferBy'] as String? ?? '';
    final negotiationNumber = negotiation['negotiationNumber'] as String? ?? '';
    final negotiationId = (negotiation['id'] ?? negotiation['_id'] ?? '').toString();
    final canPay = negotiation['canPay'] == true;
    final createdAt = negotiation['createdAt'] as String? ?? '';

    String formattedDate = '';
    if (createdAt.isNotEmpty) {
      try {
        formattedDate = DateFormat('MMM d, yyyy').format(DateTime.parse(createdAt));
      } catch (_) {}
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: GestureDetector(
        onTap: () async {
          final result = await context.push('/negotiation-detail/$negotiationId');
          if (result == true) _fetchNegotiations();
        },
        child: Container(
          decoration: BoxDecoration(
            color: surfaceWhite,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: borderLight),
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2)),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Product Image
              if (imageUrl.isNotEmpty)
                AspectRatio(
                  aspectRatio: 2.4,
                  child: AppImage(
                    imageUrl: imageUrl,
                    blurHash: product['blurHash'] as String?,
                    category: product['category'] as String? ?? '',
                    name: productName,
                    fit: BoxFit.cover,
                  ),
                ),
              // Card Body
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Request ID + Status Badge
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          negotiationNumber.isNotEmpty ? negotiationNumber : 'NEGOTIATION',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12, fontWeight: FontWeight.w600,
                            color: slateBlue, letterSpacing: 0.5,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: statusDisplay['bg'] as Color,
                            borderRadius: BorderRadius.circular(100),
                          ),
                          child: Text(
                            statusDisplay['label'] as String,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 10, fontWeight: FontWeight.w800,
                              color: statusDisplay['color'] as Color,
                              letterSpacing: 0.3,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    // Product Name
                    Text(
                      productName,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 18, fontWeight: FontWeight.w700,
                        color: textPrimary, height: 1.2, letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: 4),
                    // Quantity + Date
                    Row(
                      children: [
                        Text(
                          'Qty: $quantity units',
                          style: GoogleFonts.plusJakartaSans(fontSize: 14, fontWeight: FontWeight.w500, color: slateBlue),
                        ),
                        if (formattedDate.isNotEmpty) ...[
                          Text('  •  ', style: GoogleFonts.plusJakartaSans(color: textMuted)),
                          Text(formattedDate, style: GoogleFonts.plusJakartaSans(fontSize: 12, color: textMuted)),
                        ],
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Price Info
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: backgroundWhite,
                        borderRadius: BorderRadius.circular(8),
                        border: status == 'accepted'
                            ? const Border(left: BorderSide(color: Color(0xFF16A34A), width: 4))
                            : null,
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Your Price/unit:', style: GoogleFonts.plusJakartaSans(fontSize: 13, color: slateBlue)),
                              Text(
                                '₹${NumberFormat('#,##,###').format(requestedPrice)}',
                                style: GoogleFonts.plusJakartaSans(fontSize: 14, fontWeight: FontWeight.w700, color: textPrimary),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                status == 'countered' && currentOfferBy == 'admin'
                                    ? 'Admin Counter:'
                                    : 'Current Price/unit:',
                                style: GoogleFonts.plusJakartaSans(fontSize: 13, color: slateBlue),
                              ),
                              Text(
                                '₹${NumberFormat('#,##,###').format(currentPrice)}',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 14, fontWeight: FontWeight.w700,
                                  color: status == 'accepted' ? const Color(0xFF16A34A) : primaryBlue,
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
                              Text('Total:', style: GoogleFonts.plusJakartaSans(fontSize: 14, fontWeight: FontWeight.w600, color: textPrimary)),
                              Text(
                                '₹${NumberFormat('#,##,###').format(currentTotal)}',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 16, fontWeight: FontWeight.w800,
                                  color: status == 'accepted' ? const Color(0xFF16A34A) : textPrimary,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    // Action Button
                    _buildActionButton(status, currentOfferBy, canPay, negotiationId),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActionButton(String status, String currentOfferBy, bool canPay, String negotiationId) {
    String label;
    String style;
    IconData? icon;
    VoidCallback? onTap;

    if (status == 'countered' && currentOfferBy == 'admin') {
      label = 'Respond to Counter';
      style = 'primary';
      icon = Icons.reply_rounded;
      onTap = () async {
        final result = await context.push('/negotiation-detail/$negotiationId');
        if (result == true) _fetchNegotiations();
      };
    } else if (status == 'accepted' && canPay) {
      label = 'Proceed to Order';
      style = 'primary';
      icon = Icons.account_balance_wallet_rounded;
      onTap = () {};
    } else if (status == 'pending') {
      label = 'Under Review';
      style = 'disabled';
    } else if (status == 'rejected') {
      label = 'Rejected';
      style = 'disabled';
    } else if (status == 'expired') {
      label = 'Expired';
      style = 'disabled';
    } else {
      label = 'View Details';
      style = 'outline';
      onTap = () async {
        final result = await context.push('/negotiation-detail/$negotiationId');
        if (result == true) _fetchNegotiations();
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
              ? [BoxShadow(color: primaryBlue.withOpacity(0.2), blurRadius: 8, offset: const Offset(0, 3))]
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
                fontSize: 14, fontWeight: FontWeight.w700,
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
}
