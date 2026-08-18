import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

class NegotiationGuideScreen extends StatelessWidget {
  const NegotiationGuideScreen({super.key});

  static const Color primary = Color(0xFF2D6A4F);
  static const Color backgroundLight = Color(0xFFF6F8F6);
  static const Color backgroundDark = Color(0xFF142210);
  static const Color textDark = Color(0xFF111B0D);
  static const Color gray200 = Color(0xFFE5E7EB);
  static const Color gray600 = Color(0xFF4B5563);
  static const Color gray700 = Color(0xFF374151);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundLight,
      appBar: AppBar(
        backgroundColor: backgroundLight,
        surfaceTintColor: backgroundLight,
        elevation: 0,
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back_ios_new, color: textDark),
          tooltip: 'Back',
        ),
        title: Text(
          'Negotiation Guide',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: textDark,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: backgroundDark,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.handshake_outlined,
                    color: Colors.white,
                    size: 40,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Bulk Pricing Guide',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 27,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Learn how to request and review bulk-price offers for agricultural equipment.',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 14,
                      height: 1.5,
                      color: Colors.white.withValues(alpha: 0.84),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),
            Text(
              'How price negotiation works',
              style: GoogleFonts.plusJakartaSans(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: textDark,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Use negotiations for bulk requirements when you want to discuss quantity, price, and delivery expectations with the seller.',
              style: GoogleFonts.plusJakartaSans(
                fontSize: 14,
                height: 1.55,
                color: gray600,
              ),
            ),
            const SizedBox(height: 24),
            _GuideStep(
              number: '1',
              icon: Icons.request_quote_outlined,
              title: 'Request a bulk price',
              description:
                  'Open an eligible product and submit your quantity, target price, and delivery requirements.',
            ),
            _GuideStep(
              number: '2',
              icon: Icons.handshake_outlined,
              title: 'Review the seller response',
              description:
                  'The seller may accept your request or send a counter-offer. Check the app for updates before confirming an order.',
            ),
            _GuideStep(
              number: '3',
              icon: Icons.receipt_long_outlined,
              title: 'Send your order receipt',
              description:
                  'After your order is created, send its receipt to Laxmi Agro on WhatsApp so the team can coordinate the next step.',
            ),
            _GuideStep(
              number: '4',
              icon: Icons.verified_user_outlined,
              title: 'Pay through the Laxmi Agro team',
              description:
                  'Complete payment at the shop or using QR or bank details provided by the Laxmi Agro team. Your order status is updated after admin verification.',
              isLast: true,
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: primary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: primary.withValues(alpha: 0.2)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.lightbulb_outline, color: primary),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Include the quantity and your preferred delivery timeline in your request so the seller can provide a useful response.',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 13,
                        height: 1.5,
                        color: gray700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),
            SizedBox(
              width: double.infinity,
              height: 54,
              child: FilledButton.icon(
                onPressed: () => context.go('/negotiations'),
                icon: const Icon(Icons.handshake_outlined),
                label: const Text('View Negotiations'),
                style: FilledButton.styleFrom(
                  backgroundColor: primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: 54,
              child: OutlinedButton.icon(
                onPressed: () => context.push('/help'),
                icon: const Icon(Icons.support_agent_outlined),
                label: const Text('Contact Support'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: textDark,
                  side: const BorderSide(color: gray200),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GuideStep extends StatelessWidget {
  const _GuideStep({
    required this.number,
    required this.icon,
    required this.title,
    required this.description,
    this.isLast = false,
  });

  final String number;
  final IconData icon;
  final String title;
  final String description;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 42,
            child: Column(
              children: [
                Container(
                  width: 34,
                  height: 34,
                  decoration: const BoxDecoration(
                    color: NegotiationGuideScreen.primary,
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    number,
                    style: GoogleFonts.plusJakartaSans(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: NegotiationGuideScreen.gray200,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 24),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(icon, color: NegotiationGuideScreen.primary, size: 22),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: NegotiationGuideScreen.textDark,
                          ),
                        ),
                        const SizedBox(height: 5),
                        Text(
                          description,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 13,
                            height: 1.48,
                            color: NegotiationGuideScreen.gray600,
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
}
