import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

class HelpSupportScreen extends StatefulWidget {
  const HelpSupportScreen({super.key});

  @override
  State<HelpSupportScreen> createState() => _HelpSupportScreenState();
}

class _HelpSupportScreenState extends State<HelpSupportScreen> {
  static const Color primaryBlue = Color(0xFF2563EB);
  static const Color backgroundWhite = Color(0xFFF8FAFC);
  static const Color surfaceWhite = Color(0xFFFFFFFF);
  static const Color textPrimary = Color(0xFF1E293B);
  static const Color textSecondary = Color(0xFF64748B);
  static const Color textMuted = Color(0xFF94A3B8);
  static const Color borderLight = Color(0xFFE2E8F0);

  int _expandedFaq = -1;

  final List<Map<String, String>> _faqs = [
    {'q': 'How do I place a bulk order?', 'a': 'Navigate to the product page and tap "Initiate Negotiation" to start the bulk ordering process. You can request custom pricing for large quantities.'},
    {'q': 'What payment methods are accepted?', 'a': 'We accept UPI payments. After placing an order, you\'ll be shown our UPI ID to make the payment. Upload the payment screenshot and our team will verify it.'},
    {'q': 'How long does delivery take?', 'a': 'Standard delivery takes 3-5 business days. Express delivery options are available for select products and locations.'},
    {'q': 'How do I track my order?', 'a': 'Go to the Orders section in your profile and tap on any order to view real-time tracking details and status updates.'},
    {'q': 'What is the return policy?', 'a': 'Products can be returned within 7 days of delivery if they are defective or damaged during transit. Contact support to initiate a return.'},
    {'q': 'How do negotiations work?', 'a': 'Wholesalers can negotiate prices for bulk orders. Submit a negotiation request with your preferred price, and our team will review and respond with a counter-offer or acceptance.'},
    {'q': 'How do I become a wholesaler?', 'a': 'Register with a wholesaler account and provide your business details. Once verified by our team, you\'ll get access to wholesale pricing and negotiations.'},
  ];

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
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => context.pop(),
                      icon: const Icon(Icons.arrow_back_ios_rounded, size: 20, color: textPrimary),
                    ),
                    Expanded(
                      child: Text('Help & Support', textAlign: TextAlign.center,
                        style: GoogleFonts.plusJakartaSans(fontSize: 18, fontWeight: FontWeight.w700, color: textPrimary, letterSpacing: -0.3)),
                    ),
                    const SizedBox(width: 40),
                  ],
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Hero Card
                      _buildHeroCard(),
                      const SizedBox(height: 24),
                      // Quick Contact
                      _buildQuickContactRow(),
                      const SizedBox(height: 28),
                      // FAQ Section
                      _buildFaqSection(),
                      const SizedBox(height: 28),
                      // Contact Info Card
                      _buildContactCard(),
                      const SizedBox(height: 24),
                      // App Info
                      _buildAppInfoCard(),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeroCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft, end: Alignment.bottomRight,
          colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: primaryBlue.withOpacity(0.3), blurRadius: 16, offset: const Offset(0, 8))],
      ),
      child: Column(
        children: [
          Container(
            width: 56, height: 56,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(Icons.support_agent_rounded, color: Colors.white, size: 30),
          ),
          const SizedBox(height: 16),
          Text('How can we help you?', style: GoogleFonts.plusJakartaSans(
            fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: -0.3)),
          const SizedBox(height: 8),
          Text('We\'re here to help with anything you need.\nReach out and we\'ll respond as soon as we can.',
            textAlign: TextAlign.center, style: GoogleFonts.plusJakartaSans(
              fontSize: 13, fontWeight: FontWeight.w500, color: Colors.white.withOpacity(0.8), height: 1.5)),
        ],
      ),
    );
  }

  Widget _buildQuickContactRow() {
    final actions = [
      {'icon': Icons.call_rounded, 'label': 'Call Us', 'color': const Color(0xFF16A34A), 'bg': const Color(0xFFF0FDF4), 'action': 'call'},
      {'icon': Icons.chat_bubble_outline_rounded, 'label': 'WhatsApp', 'color': const Color(0xFF25D366), 'bg': const Color(0xFFF0FDF4), 'action': 'whatsapp'},
    ];

    return Row(
      children: [
        for (int i = 0; i < actions.length; i++) ...[
          if (i > 0) const SizedBox(width: 12),
          Expanded(
            child: GestureDetector(
              onTap: () => _handleQuickAction(actions[i]['action'] as String),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 18),
                decoration: BoxDecoration(
                  color: surfaceWhite,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: borderLight),
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 8, offset: const Offset(0, 2))],
                ),
                child: Column(
                  children: [
                    Container(
                      width: 44, height: 44,
                      decoration: BoxDecoration(
                        color: actions[i]['bg'] as Color,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(actions[i]['icon'] as IconData, color: actions[i]['color'] as Color, size: 22),
                    ),
                    const SizedBox(height: 8),
                    Text(actions[i]['label'] as String, style: GoogleFonts.plusJakartaSans(
                      fontSize: 11, fontWeight: FontWeight.w700, color: textPrimary)),
                  ],
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildFaqSection() {
    final faqs = _faqs;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Frequently Asked Questions', style: GoogleFonts.plusJakartaSans(
              fontSize: 17, fontWeight: FontWeight.w800, color: textPrimary, letterSpacing: -0.3)),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(color: primaryBlue.withOpacity(0.08), borderRadius: BorderRadius.circular(100)),
              child: Text('${faqs.length}', style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w700, color: primaryBlue)),
            ),
          ],
        ),
        const SizedBox(height: 16),
        ...List.generate(faqs.length, (i) => _buildFaqTile(faqs[i], i)),
      ],
    );
  }

  Widget _buildFaqTile(Map<String, String> faq, int index) {
    final isExpanded = _expandedFaq == index;
    return GestureDetector(
      onTap: () => setState(() => _expandedFaq = isExpanded ? -1 : index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isExpanded ? primaryBlue.withOpacity(0.03) : surfaceWhite,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isExpanded ? primaryBlue.withOpacity(0.2) : borderLight),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4, offset: const Offset(0, 2))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 32, height: 32,
                  decoration: BoxDecoration(
                    color: isExpanded ? primaryBlue.withOpacity(0.1) : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Center(child: Text('${index + 1}', style: GoogleFonts.plusJakartaSans(
                    fontSize: 13, fontWeight: FontWeight.w800, color: isExpanded ? primaryBlue : textMuted))),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(faq['q']!, style: GoogleFonts.plusJakartaSans(
                    fontSize: 14, fontWeight: FontWeight.w700, color: textPrimary, height: 1.3)),
                ),
                AnimatedRotation(
                  turns: isExpanded ? 0.5 : 0,
                  duration: const Duration(milliseconds: 200),
                  child: Icon(Icons.keyboard_arrow_down_rounded, color: isExpanded ? primaryBlue : textMuted, size: 24),
                ),
              ],
            ),
            AnimatedCrossFade(
              duration: const Duration(milliseconds: 200),
              crossFadeState: isExpanded ? CrossFadeState.showSecond : CrossFadeState.showFirst,
              firstChild: const SizedBox.shrink(),
              secondChild: Padding(
                padding: const EdgeInsets.only(top: 12, left: 44),
                child: Text(faq['a']!, style: GoogleFonts.plusJakartaSans(
                  fontSize: 13, fontWeight: FontWeight.w500, color: textSecondary, height: 1.6)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContactCard() {
    final contacts = [
      {'icon': Icons.email_rounded, 'title': 'Email Us', 'value': 'ixveepee@gmail.com', 'color': const Color(0xFF2563EB)},
      {'icon': Icons.call_rounded, 'title': 'Call Us', 'value': '+91 78800 80069', 'color': const Color(0xFF16A34A)},
      {'icon': Icons.access_time_rounded, 'title': 'Working Hours', 'value': 'Mon – Sat, 9:00 AM – 6:00 PM', 'color': const Color(0xFF7C3AED)},
    ];

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: surfaceWhite,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderLight),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Contact Information', style: GoogleFonts.plusJakartaSans(
            fontSize: 17, fontWeight: FontWeight.w800, color: textPrimary, letterSpacing: -0.3)),
          const SizedBox(height: 4),
          Text('Get in touch with our support team', style: GoogleFonts.plusJakartaSans(
            fontSize: 13, color: textMuted)),
          const SizedBox(height: 20),
          ...List.generate(contacts.length, (i) => Padding(
            padding: EdgeInsets.only(bottom: i < contacts.length - 1 ? 16 : 0),
            child: Row(
              children: [
                Container(
                  width: 44, height: 44,
                  decoration: BoxDecoration(
                    color: (contacts[i]['color'] as Color).withOpacity(0.08),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(contacts[i]['icon'] as IconData, color: contacts[i]['color'] as Color, size: 20),
                ),
                const SizedBox(width: 14),
                Expanded(child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(contacts[i]['title'] as String, style: GoogleFonts.plusJakartaSans(
                      fontSize: 11, fontWeight: FontWeight.w600, color: textMuted, letterSpacing: 0.3)),
                    const SizedBox(height: 2),
                    Text(contacts[i]['value'] as String, style: GoogleFonts.plusJakartaSans(
                      fontSize: 14, fontWeight: FontWeight.w700, color: textPrimary)),
                  ],
                )),
              ],
            ),
          )),
        ],
      ),
    );
  }

  Widget _buildAppInfoCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft, end: Alignment.bottomRight,
          colors: [const Color(0xFFF8FAFC), const Color(0xFFEFF6FF)],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderLight.withOpacity(0.7)),
      ),
      child: Column(
        children: [
          Container(
            width: 48, height: 48,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.asset(
                'assets/images/oxon logo.jpeg',
                fit: BoxFit.cover,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text('OXON', style: GoogleFonts.plusJakartaSans(
            fontSize: 18, fontWeight: FontWeight.w800, color: textPrimary)),
          const SizedBox(height: 4),
          Text('Version 1.0.0', style: GoogleFonts.plusJakartaSans(fontSize: 12, color: textMuted)),
          const SizedBox(height: 12),
          Text('Your trusted B2B agricultural marketplace', textAlign: TextAlign.center,
            style: GoogleFonts.plusJakartaSans(fontSize: 13, color: textSecondary)),
        ],
      ),
    );
  }

  void _handleQuickAction(String action) async {
    final phoneNumber = '+917880080069';

    if (action == 'call') {
      final uri = Uri(scheme: 'tel', path: phoneNumber);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      }
    } else if (action == 'whatsapp') {
      final uri = Uri.parse('https://wa.me/$phoneNumber');
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    }
  }
}
