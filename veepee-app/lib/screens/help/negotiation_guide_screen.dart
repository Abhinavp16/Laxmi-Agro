import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:google_fonts/google_fonts.dart';

class NegotiationGuideScreen extends StatelessWidget {
  const NegotiationGuideScreen({super.key});

  // Colors from design
  static const Color primary = Color(0xFF46ec13);
  static const Color backgroundLight = Color(0xFFf6f8f6);
  static const Color backgroundDark = Color(0xFF142210);
  static const Color textDark = Color(0xFF111b0d);
  static const Color gray200 = Color(0xFFe5e7eb);
  static const Color gray500 = Color(0xFF6b7280);
  static const Color gray600 = Color(0xFF4b5563);
  static const Color gray700 = Color(0xFF374151);

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
              child: Container(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                decoration: BoxDecoration(
                  border: Border(bottom: BorderSide(color: gray200)),
                ),
                child: Row(
                  children: [
                    SizedBox(
                      width: 48,
                      height: 48,
                      child: Icon(Icons.arrow_back_ios, color: textDark),
                    ),
                    Expanded(
                      child: Text(
                        'Negotiation Guide',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: textDark,
                          letterSpacing: -0.015 * 18,
                        ),
                      ),
                    ),
                    SizedBox(
                      width: 48,
                      height: 48,
                      child: Icon(Icons.share, color: textDark),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Content
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header Image
                  Stack(
                    children: [
                      CachedNetworkImage(
                        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWM7Zn7xn1Zptt14QxzzKlFp5IsmU4htIJ72jt3R9uEysAUCkZqa1bvZ9sZCo81e8SVmUCa_G_sJvf5-cVtWxL36ikqXAgXyLuLF39BIy3RGO68PozXiai7KyfxhIa5dk8mLa670KTWLTzFXFxruPjngfoabWBLaOxW4VSngJyCVx7EJWUQq2Lc05MjSO_ng3E_gxO1OWZJvcqrW4tI0aXnS1abRSxta99O17IpCqPfKuw5Ew6PFZ0u_3JTLhoS0t-SZAlx606Gzew',
                        width: double.infinity,
                        height: 200,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => Container(height: 200, color: gray200),
                        errorWidget: (context, url, error) => Container(height: 200, color: gray200),
                      ),
                      Positioned.fill(
                        child: Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                Colors.transparent,
                                backgroundDark.withOpacity(0.8),
                              ],
                              stops: const [0.4, 1.0],
                            ),
                          ),
                        ),
                      ),
                      Positioned(
                        left: 16,
                        bottom: 16,
                        child: Text(
                          'Bulk Pricing Guide',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 28,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                            letterSpacing: -0.5,
                          ),
                        ),
                      ),
                    ],
                  ),

                  // Headline
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 24, 16, 4),
                    child: Text(
                      'How Price Negotiation Works',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 24,
                        fontWeight: FontWeight.w700,
                        color: textDark,
                        letterSpacing: -0.5,
                      ),
                    ),
                  ),

                  // Description
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      'Our wholesale platform allows you to negotiate directly with manufacturers for bulk agricultural equipment orders.',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 14,
                        color: gray600,
                        height: 1.5,
                      ),
                    ),
                  ),

                  // Section Header
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 32, 16, 8),
                    child: Text(
                      'The 3-Step Process',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: textDark,
                        letterSpacing: -0.015 * 18,
                      ),
                    ),
                  ),

                  // Timeline
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      children: [
                        _buildTimelineStep(
                          icon: Icons.request_quote,
                          title: '1. Request Bulk Price',
                          description: 'Go to any tractor or machinery listing and tap "Request Quote". Specify your quantity (min. 5 units) and target price.',
                          showTopLine: false,
                          showBottomLine: true,
                        ),
                        _buildTimelineStep(
                          icon: Icons.handshake,
                          title: '2. Review Counter-Offer',
                          description: 'The seller will review and either accept or send a counter-offer. You\'ll receive a push notification for every update.',
                          showTopLine: true,
                          showBottomLine: true,
                        ),
                        _buildTimelineStep(
                          icon: Icons.payments,
                          title: '3. Complete Secure Payment',
                          description: 'Once price is agreed, an invoice is generated. Pay via secure wire transfer or bank guarantee to unlock logistics tracking.',
                          showTopLine: true,
                          showBottomLine: false,
                        ),
                      ],
                    ),
                  ),

                  // Expert Tips Header
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                    child: Text(
                      'Expert Tips',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: textDark,
                        letterSpacing: -0.015 * 18,
                      ),
                    ),
                  ),

                  // Tip Card
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: primary.withOpacity(0.2)),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(Icons.lightbulb, color: primary),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'Sellers are 40% more likely to accept offers if you include your desired delivery timeline in the message field.',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 14,
                                color: gray700,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Feedback Section
                  Container(
                    margin: const EdgeInsets.only(top: 32),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 32),
                    decoration: BoxDecoration(
                      border: Border(top: BorderSide(color: gray200)),
                    ),
                    child: Column(
                      children: [
                        Text(
                          'Was this helpful?',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: textDark,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            OutlinedButton.icon(
                              onPressed: () {},
                              icon: Icon(Icons.thumb_up, color: gray500, size: 20),
                              label: Text(
                                'Yes',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                  color: textDark,
                                ),
                              ),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                                side: BorderSide(color: gray200),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(999),
                                ),
                              ),
                            ),
                            const SizedBox(width: 16),
                            OutlinedButton.icon(
                              onPressed: () {},
                              icon: Icon(Icons.thumb_down, color: gray500, size: 20),
                              label: Text(
                                'No',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                  color: textDark,
                                ),
                              ),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                                side: BorderSide(color: gray200),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(999),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // CTA Buttons
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 40),
                    child: Column(
                      children: [
                        SizedBox(
                          width: double.infinity,
                          height: 56,
                          child: ElevatedButton(
                            onPressed: () {},
                            style: ElevatedButton.styleFrom(
                              backgroundColor: primary,
                              foregroundColor: backgroundDark,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: Text(
                              'Start a New Negotiation',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          height: 56,
                          child: OutlinedButton.icon(
                            onPressed: () {},
                            icon: Icon(Icons.support_agent, color: textDark),
                            label: Text(
                              'Contact Support',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: textDark,
                              ),
                            ),
                            style: OutlinedButton.styleFrom(
                              side: BorderSide(color: gray200),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
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
        ],
      ),
    );
  }

  Widget _buildTimelineStep({
    required IconData icon,
    required String title,
    required String description,
    required bool showTopLine,
    required bool showBottomLine,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Timeline indicator
        SizedBox(
          width: 40,
          child: Column(
            children: [
              if (showTopLine)
                Container(width: 2, height: 8, color: primary.withOpacity(0.3)),
              Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Icon(icon, color: primary),
              ),
              if (showBottomLine)
                Container(width: 2, height: 48, color: primary.withOpacity(0.3)),
            ],
          ),
        ),
        const SizedBox(width: 8),
        // Content
        Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: textDark,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 14,
                    color: gray600,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
