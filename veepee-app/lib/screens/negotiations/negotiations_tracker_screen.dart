import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:google_fonts/google_fonts.dart';

class NegotiationsTrackerScreen extends StatefulWidget {
  const NegotiationsTrackerScreen({super.key});

  @override
  State<NegotiationsTrackerScreen> createState() => _NegotiationsTrackerScreenState();
}

class _NegotiationsTrackerScreenState extends State<NegotiationsTrackerScreen> {
  int _selectedTab = 1;

  // Colors from design
  static const Color primary = Color(0xFF135bec);
  static const Color backgroundLight = Color(0xFFf6f6f8);
  static const Color textDark = Color(0xFF0d121b);
  static const Color textSecondary = Color(0xFF4c669a);
  static const Color borderColor = Color(0xFFcfd7e7);
  static const Color gray100 = Color(0xFFf3f4f6);
  static const Color gray800 = Color(0xFF1f2937);
  static const Color amber100 = Color(0xFFfef3c7);
  static const Color amber800 = Color(0xFF92400e);
  static const Color green100 = Color(0xFFdcfce7);
  static const Color green500 = Color(0xFF22c55e);
  static const Color green600 = Color(0xFF16a34a);
  static const Color green800 = Color(0xFF166534);

  final List<String> _tabs = ['All', 'Active', 'Completed'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundLight,
      body: Column(
        children: [
          // TopAppBar
          Container(
            color: backgroundLight,
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Row(
                  children: [
                    SizedBox(
                      width: 40,
                      height: 40,
                      child: Icon(Icons.arrow_back_ios, color: textDark),
                    ),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.only(right: 40),
                        child: Text(
                          'Negotiations',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: textDark,
                            letterSpacing: -0.015 * 18,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Tabs
          Container(
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: borderColor)),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: List.generate(_tabs.length, (index) {
                final isSelected = _selectedTab == index;
                return Padding(
                  padding: const EdgeInsets.only(right: 32),
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedTab = index),
                    child: Container(
                      padding: const EdgeInsets.only(top: 16, bottom: 13),
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(
                            color: isSelected ? primary : Colors.transparent,
                            width: 3,
                          ),
                        ),
                      ),
                      child: Text(
                        _tabs[index],
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: isSelected ? primary : textSecondary,
                          letterSpacing: 0.015 * 14,
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),

          // Content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.only(bottom: 100),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Section Header
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                    child: Text(
                      'Priority Quotes',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: textDark,
                        letterSpacing: -0.015 * 18,
                      ),
                    ),
                  ),

                  // Card: Counter-offer
                  _buildNegotiationCard(
                    requestId: 'Request #8821',
                    badge: 'Counter-offer',
                    badgeColor: amber100,
                    badgeTextColor: amber800,
                    title: 'John Deere 5050D Tractor',
                    quantity: 'Bulk Order: 10 units',
                    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAaGgwMFJfelXOECcbEE0PcOWEJYZG_IeWUQBS3eYYeR8WGclPWdSaSr02PbM2TR18rwhnkGYJXivBh6KDC4s1uOmrpgiRDhh6z_n_S41GhE5FSy-TUXj6NpNohO60LbL3jrhLu5FwgWn51hhzM0DfENdXiue6d4kSXkE6nKm356hu9fj5KaYlwkmIaLRnv1y2nmjXJaXuF4mKUlaYBKe3beGqIjylC9XPYHyiSoZLiSM3lz5YnD9dFy4XOHyxnfFPC0wT9m1ktUPXj',
                    priceWidget: _buildCounterOfferPrices('\$120,000', '\$125,000'),
                    buttonText: 'View Details',
                    buttonEnabled: true,
                  ),

                  // Card: Accepted
                  _buildNegotiationCard(
                    requestId: 'Request #8790',
                    badge: 'Accepted',
                    badgeColor: green100,
                    badgeTextColor: green800,
                    title: 'Mahindra Arjun 555 DI',
                    quantity: 'Bulk Order: 5 units',
                    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDeRnAVFtCPqADjT1xfxgQZUwnbDm7VXA9ZtB8Mx3smt-DQbKK30XiyblbS5DK0_BKbqx-oXRHyWv2Lup0rF6WlV8ArlL4OTx4vA9-kptmUcpYOQ7mq1ShcxTRW2p0JMw-kBheHInQujJ_LwAgIAh4WDhM9yIDHyLlquivu1NDI3Scj9aYrmL9LsMeKh49UKjV1yJmUsma6qz0NQF6IHWdr_eMyUgLNCMgfHBXskdsZfGu35NNpMmmO0eOu9hkoAX-jq80MrzIyYPB7',
                    priceWidget: _buildAcceptedPrice('\$45,000'),
                    buttonText: 'Pay Now',
                    buttonIcon: Icons.account_balance_wallet,
                    buttonEnabled: true,
                  ),

                  // Card: Pending
                  _buildNegotiationCard(
                    requestId: 'Request #8912',
                    badge: 'Pending Review',
                    badgeColor: gray100,
                    badgeTextColor: gray800,
                    title: 'New Holland T6 Series',
                    quantity: 'Bulk Order: 3 units',
                    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDoAi8Z9AYnnHnksg3wzDv3tFls2Idq7TqPmxGitX58sgdDcWHvml_6hb-XPe3HzyhtZRtureb4wn6zRlR-WL493UOLq22iu3vXYo-q499bvG5FGFjVhC-lYehP356yiSmrfid1DCuuIOnA_Y4emJZj5728OBUNr_sdelqFN9PCDJRcxBkGzbCmFhkCybh8txJT4hNO_eEWTrK4-IWmsMhTNyD-_hJRiyNako1lCGLbh86uokS2UzNYiUc5xX1yEnFJNNz2ty4t5sqo',
                    priceWidget: _buildPendingPrice('\$88,000'),
                    buttonText: 'Under Review',
                    buttonEnabled: false,
                    opacity: 0.85,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),

      // Bottom Banner
      bottomSheet: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Color(0xFFe5e7eb))),
        ),
        child: SafeArea(
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: primary.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.verified_user, color: primary, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Manual Verification',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: textDark,
                      ),
                    ),
                    Text(
                      'UPI payments verified within 2-4 hours',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 10,
                        color: textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  'HELP',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: primary,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNegotiationCard({
    required String requestId,
    required String badge,
    required Color badgeColor,
    required Color badgeTextColor,
    required String title,
    required String quantity,
    required String imageUrl,
    required Widget priceWidget,
    required String buttonText,
    IconData? buttonIcon,
    required bool buttonEnabled,
    double opacity = 1.0,
  }) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Opacity(
        opacity: opacity,
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Color(0xFFe5e7eb)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.02),
                blurRadius: 4,
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Image
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                child: CachedNetworkImage(
                  imageUrl: imageUrl,
                  width: double.infinity,
                  height: 180,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(height: 180, color: gray100),
                  errorWidget: (context, url, error) => Container(height: 180, color: gray100),
                ),
              ),

              // Content
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header Row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          requestId.toUpperCase(),
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: textSecondary,
                            letterSpacing: 1,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: badgeColor,
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            badge.toUpperCase(),
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: badgeTextColor,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),

                    // Title
                    Text(
                      title,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: textDark,
                        letterSpacing: -0.015 * 18,
                      ),
                    ),

                    // Quantity
                    Text(
                      quantity,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: textSecondary,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Price Widget
                    priceWidget,
                    const SizedBox(height: 16),

                    // Button
                    SizedBox(
                      width: double.infinity,
                      height: 40,
                      child: ElevatedButton(
                        onPressed: buttonEnabled ? () {} : null,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: buttonEnabled ? primary : Color(0xFFe5e7eb),
                          foregroundColor: buttonEnabled ? Colors.white : Color(0xFF9ca3af),
                          elevation: buttonEnabled ? 4 : 0,
                          shadowColor: buttonEnabled ? primary.withOpacity(0.2) : Colors.transparent,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            if (buttonIcon != null) ...[
                              Icon(buttonIcon, size: 16),
                              const SizedBox(width: 8),
                            ],
                            Text(
                              buttonText,
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
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
  }

  Widget _buildCounterOfferPrices(String yourQuote, String adminPrice) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: backgroundLight,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Your Quote:',
                style: GoogleFonts.plusJakartaSans(fontSize: 14, color: textSecondary),
              ),
              Text(
                yourQuote,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: textDark,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Admin Price:',
                style: GoogleFonts.plusJakartaSans(fontSize: 14, color: textSecondary),
              ),
              Text(
                adminPrice,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: primary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAcceptedPrice(String total) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: backgroundLight,
        borderRadius: BorderRadius.circular(8),
        border: Border(left: BorderSide(color: green500, width: 4)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            'Negotiated Total:',
            style: GoogleFonts.plusJakartaSans(fontSize: 14, color: textSecondary),
          ),
          Text(
            total,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: green600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPendingPrice(String requestedPrice) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        RichText(
          text: TextSpan(
            style: GoogleFonts.plusJakartaSans(fontSize: 14, color: textSecondary),
            children: [
              const TextSpan(text: 'Requested Price: '),
              TextSpan(
                text: requestedPrice,
                style: GoogleFonts.plusJakartaSans(
                  fontWeight: FontWeight.w600,
                  color: textDark,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Awaiting admin verification',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 12,
            fontStyle: FontStyle.italic,
            color: textSecondary,
          ),
        ),
      ],
    );
  }
}
