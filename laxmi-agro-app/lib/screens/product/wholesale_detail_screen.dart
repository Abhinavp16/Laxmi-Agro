import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/locale_provider.dart';

class WholesaleDetailScreen extends ConsumerWidget {
  const WholesaleDetailScreen({super.key});

  // Colors from design
  static const Color primary = Color(0xFF1d4ed8);
  static const Color secondary = Color(0xFF3b82f6);
  static const Color backgroundLight = Color(0xFFf8fafc);
  static const Color slate900 = Color(0xFF0f172a);
  static const Color slate700 = Color(0xFF334155);
  static const Color slate600 = Color(0xFF475569);
  static const Color slate500 = Color(0xFF64748b);
  static const Color slate400 = Color(0xFF94a3b8);
  static const Color slate200 = Color(0xFFe2e8f0);
  static const Color slate100 = Color(0xFFf1f5f9);
  static const Color slate50 = Color(0xFFf8fafc);
  static const Color gray100 = Color(0xFFf3f4f6);
  static const Color gray50 = Color(0xFFf9fafb);
  static const Color blue100 = Color(0xFFdbeafe);
  static const Color blue700 = Color(0xFF1d4ed8);
  static const Color yellow400 = Color(0xFFfacc15);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(localeProvider.notifier).translate;
    return Scaffold(
      backgroundColor: backgroundLight,
      body: Column(
        children: [
          // TopAppBar
          Container(
            color: Colors.white,
            child: SafeArea(
              bottom: false,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 16,
                ),
                decoration: BoxDecoration(
                  border: Border(bottom: BorderSide(color: gray100)),
                ),
                child: Row(
                  children: [
                    SizedBox(
                      width: 40,
                      height: 40,
                      child: Icon(
                        Icons.arrow_back_ios_new,
                        color: slate700,
                        size: 20,
                      ),
                    ),
                    Expanded(
                      child: Text(
                        t('Wholesale Details'),
                        textAlign: TextAlign.center,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: slate900,
                        ),
                      ),
                    ),
                    Row(
                      children: [
                        SizedBox(
                          width: 40,
                          height: 40,
                          child: Icon(Icons.share, color: slate700, size: 20),
                        ),
                        SizedBox(
                          width: 40,
                          height: 40,
                          child: Icon(
                            Icons.favorite_border,
                            color: slate700,
                            size: 20,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.only(bottom: 140),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Product Image
                  Stack(
                    children: [
                      AspectRatio(
                        aspectRatio: 1,
                        child: CachedNetworkImage(
                          imageUrl:
                              'https://lh3.googleusercontent.com/aida-public/AB6AXuBY-zk5FiEndc_-knQOpJocZAcvworTwYA780fuc7IJUA41Tcv-jBY3JDWZOAHHWSOR22RTLhbR9zQ-kMmlfosyue4-qz6j5fPnqD-pJLIS2uFn6uSJYjj1nxwryCChmZxVR5TK_6ip-uMgHpCZ3lBhpQ6BkTjyT44jR-Cz06YNAfg43J47CenHeLrjBWFghK65SJx_sRhlfOcHFhMK4mjg3LMI5PKtpJ7zMHiDBKa1bUjTMreaFq1aXO48ToJqwRp-2UEolzahNwA_',
                          fit: BoxFit.contain,
                          placeholder: (context, url) =>
                              Container(color: slate200),
                          errorWidget: (context, url, error) =>
                              Container(color: slate200),
                        ),
                      ),
                      Positioned(
                        bottom: 16,
                        left: 0,
                        right: 0,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.black.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Row(
                                children: List.generate(4, (index) {
                                  return Container(
                                    width: 6,
                                    height: 6,
                                    margin: const EdgeInsets.symmetric(
                                      horizontal: 3,
                                    ),
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: index == 0
                                          ? Colors.white
                                          : Colors.white.withOpacity(0.5),
                                    ),
                                  );
                                }),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  // Product Info
                  Container(
                    color: Colors.white,
                    padding: const EdgeInsets.fromLTRB(20, 24, 20, 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Badges
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: blue100,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                t('TOP RATED'),
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: blue700,
                                  letterSpacing: 1,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: primary,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                t('WHOLESALE ONLY'),
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                  letterSpacing: 1,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),

                        // Title
                        Text(
                          'Multi-Crop Power Tiller',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 24,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF111827),
                          ),
                        ),
                        const SizedBox(height: 8),

                        // Price
                        Text(
                          '${t('Wholesale Price')}: ${t('Negotiable')}',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                            color: primary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${t('Minimum Order Quantity')}: 5 ${t('Units')}',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12,
                            color: slate500,
                          ),
                        ),
                        const SizedBox(height: 8),
                        // Delivery info and icons
                        Row(
                          children: [
                            const Icon(
                              Icons.person_outline,
                              size: 14,
                              color: slate500,
                            ),
                            const SizedBox(width: 4),
                            const Icon(
                              Icons.storefront_outlined,
                              size: 14,
                              color: slate500,
                            ),
                            const SizedBox(width: 4),
                            const Icon(
                              Icons.local_shipping_outlined,
                              size: 14,
                              color: slate500,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              t('Delivery within 5 days of Purchase'),
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 12,
                                color: slate500,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Key Specifications
                  Container(
                    color: Colors.white,
                    padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
                    decoration: BoxDecoration(
                      border: Border(top: BorderSide(color: gray50)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: primary.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(
                                Icons.auto_awesome_rounded,
                                color: primary,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Text(
                              t('Specifications'),
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: slate500,
                                letterSpacing: 2,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Column(
                          children: [
                            _buildSpecItem('7HP Engine'),
                            const SizedBox(height: 12),
                            _buildSpecItem('Petrol Fuel'),
                            const SizedBox(height: 12),
                            _buildSpecItem('1Y Warranty'),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Product Description
                  Container(
                    color: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 16,
                    ),
                    decoration: BoxDecoration(
                      border: Border(top: BorderSide(color: gray100)),
                    ),
                    child: Column(
                      children: [
                        _buildExpandableSection(
                          t('Product Description'),
                          Icons.expand_less,
                          expanded: true,
                          content: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'The Multi-Crop Power Tiller is a robust and versatile machine designed for modern agriculture. Equipped with a heavy-duty 7HP petrol engine, it provides exceptional power-to-weight ratio for tilling, weeding, and soil preparation across diverse terrains.',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 14,
                                  color: slate600,
                                  height: 1.6,
                                ),
                              ),
                              const SizedBox(height: 16),
                              _buildFeatureItem(
                                'Adjustable tilling width for various crop spacing.',
                              ),
                              const SizedBox(height: 8),
                              _buildFeatureItem(
                                'Low fuel consumption with high torque output.',
                              ),
                              const SizedBox(height: 8),
                              _buildFeatureItem(
                                'Ergonomic handles with vibration dampening technology.',
                              ),
                            ],
                          ),
                        ),
                        _buildExpandableSection(
                          t('Wholesale Logistics'),
                          Icons.expand_more,
                        ),
                        _buildExpandableSection(
                          t('Bulk Order Reviews'),
                          Icons.expand_more,
                          trailing: Row(
                            children: [
                              Icon(Icons.star, size: 14, color: yellow400),
                              const SizedBox(width: 4),
                              Text(
                                '4.9',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF111827),
                                ),
                              ),
                            ],
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

      // Bottom Action Bar
      bottomSheet: Container(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.95),
          border: Border(top: BorderSide(color: slate200)),
        ),
        child: Row(
          children: [
            Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.chat, color: primary),
                Text(
                  t('EXPERT HELP'),
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                    color: primary,
                  ),
                ),
              ],
            ),
            const SizedBox(width: 16),
            Expanded(
              child: SizedBox(
                height: 56,
                child: ElevatedButton.icon(
                  onPressed: () {},
                  icon: Icon(Icons.handshake, size: 18),
                  label: Text(
                    t('Initiate Negotiation'),
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primary,
                    foregroundColor: Colors.white,
                    elevation: 8,
                    shadowColor: primary.withOpacity(0.3),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSpecItem(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: slate50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: slate100),
      ),
      child: Row(
        children: [
          Icon(Icons.auto_awesome_rounded, color: primary, size: 14),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              label,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: slate900,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildExpandableSection(
    String title,
    IconData icon, {
    bool expanded = false,
    Widget? content,
    Widget? trailing,
  }) {
    return Container(
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: gray50)),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  title,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: expanded ? 18 : 16,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF111827),
                  ),
                ),
                Row(
                  children: [
                    if (trailing != null) ...[
                      trailing,
                      const SizedBox(width: 8),
                    ],
                    Icon(icon, color: slate400),
                  ],
                ),
              ],
            ),
          ),
          if (content != null)
            Padding(padding: const EdgeInsets.only(bottom: 16), child: content),
        ],
      ),
    );
  }

  Widget _buildFeatureItem(String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(Icons.check_circle, color: primary, size: 18),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: GoogleFonts.plusJakartaSans(fontSize: 14, color: slate600),
          ),
        ),
      ],
    );
  }
}
