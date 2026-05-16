import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:google_fonts/google_fonts.dart';

class PowerTillerDetailScreen extends StatelessWidget {
  const PowerTillerDetailScreen({super.key});

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
  static const Color blue800 = Color(0xFF1e40af);
  static const Color orange100 = Color(0xFFffedd5);
  static const Color orange700 = Color(0xFFc2410c);
  static const Color green600 = Color(0xFF16a34a);
  static const Color yellow400 = Color(0xFFfacc15);

  @override
  Widget build(BuildContext context) {
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
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(shape: BoxShape.circle),
                      child: Icon(
                        Icons.arrow_back_ios_new,
                        color: slate700,
                        size: 20,
                      ),
                    ),
                    Expanded(
                      child: Text(
                        'Product Details',
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
              padding: const EdgeInsets.only(bottom: 120),
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
                          fit: BoxFit.cover,
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
                                'TOP RATED',
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
                                color: orange100,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                'BEST SELLER',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: orange700,
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
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.baseline,
                          textBaseline: TextBaseline.alphabetic,
                          children: [
                            Text(
                              '₹45,000',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 30,
                                fontWeight: FontWeight.w800,
                                color: primary,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '₹52,000',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 14,
                                color: slate400,
                                decoration: TextDecoration.lineThrough,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '13% OFF',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: green600,
                              ),
                            ),
                          ],
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
                              'Delivery within 5 days of Purchase',
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
                                Icons.settings_suggest_rounded,
                                color: primary,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Text(
                              'Specifications',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                color: slate500,
                                letterSpacing: 1.5,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        Column(
                          children: [
                            _buildSpecItem(
                              Icons.settings_suggest,
                              'Engine',
                              '7HP Heavy Duty',
                            ),
                            _buildSpecItem(
                              Icons.local_gas_station,
                              'Fuel Type',
                              'Petrol/Gasoline',
                            ),
                            _buildSpecItem(
                              Icons.verified,
                              'Warranty',
                              '1 Year Limited',
                            ),
                            _buildSpecItem(Icons.speed, 'RPM', '3600 RPM Max'),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Wholesale Program Card
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [primary, blue800],
                        ),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: secondary.withOpacity(0.2),
                            blurRadius: 16,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Stack(
                        children: [
                          Positioned(
                            right: -16,
                            bottom: -16,
                            child: Opacity(
                              opacity: 0.1,
                              child: Icon(
                                Icons.handshake,
                                size: 100,
                                color: Colors.white,
                              ),
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(
                                    Icons.groups,
                                    size: 14,
                                    color: Colors.white,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    'WHOLESALE PROGRAM',
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700,
                                      color: Color(0xFFbfdbfe),
                                      letterSpacing: 2,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Wholesale Pricing Available',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Ordering more than 5 units? Negotiate direct rates with manufacturers.',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 14,
                                  color: Color(0xFFbfdbfe),
                                  height: 1.5,
                                ),
                              ),
                              const SizedBox(height: 16),
                              SizedBox(
                                width: double.infinity,
                                height: 48,
                                child: ElevatedButton(
                                  onPressed: () {},
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.white,
                                    foregroundColor: primary,
                                    elevation: 2,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                  child: Text(
                                    'Negotiate Bulk Price',
                                    style: GoogleFonts.plusJakartaSans(
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Product Description
                  Container(
                    color: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 16,
                    ),
                    child: Column(
                      children: [
                        _buildExpandableSection(
                          'Product Description',
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
                          'Shipping & Returns',
                          Icons.expand_more,
                        ),
                        _buildExpandableSection(
                          'Customer Reviews (128)',
                          Icons.expand_more,
                          trailing: Row(
                            children: [
                              Icon(Icons.star, size: 14, color: yellow400),
                              const SizedBox(width: 4),
                              Text(
                                '4.8',
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
          color: Colors.white.withOpacity(0.9),
          border: Border(top: BorderSide(color: slate200)),
        ),
        child: Row(
          children: [
            Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.chat, color: slate500),
                Text(
                  'Support',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                    color: slate500,
                  ),
                ),
              ],
            ),
            const SizedBox(width: 16),
            Expanded(
              child: SizedBox(
                height: 48,
                child: OutlinedButton(
                  onPressed: () {},
                  style: OutlinedButton.styleFrom(
                    backgroundColor: gray100,
                    foregroundColor: Color(0xFF111827),
                    side: BorderSide(color: slate200),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    'Add to Cart',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: SizedBox(
                height: 48,
                child: ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primary,
                    foregroundColor: Colors.white,
                    elevation: 4,
                    shadowColor: primary.withOpacity(0.2),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    'Buy Now',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
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

  Widget _buildSpecItem(IconData icon, String title, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: slate50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: slate100),
      ),
      child: Row(
        children: [
          Icon(Icons.arrow_forward_ios_rounded, color: primary, size: 14),
          const SizedBox(width: 16),
          Expanded(
            child: RichText(
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              text: TextSpan(
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 14,
                  color: slate900,
                ),
                children: [
                  TextSpan(
                    text: '$title: ',
                    style: GoogleFonts.plusJakartaSans(
                      fontWeight: FontWeight.w600,
                      color: slate500,
                      fontSize: 13,
                    ),
                  ),
                  TextSpan(
                    text: value,
                    style: GoogleFonts.plusJakartaSans(
                      fontWeight: FontWeight.w700,
                      color: slate900,
                      fontSize: 14,
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
