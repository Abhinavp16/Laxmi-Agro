import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:google_fonts/google_fonts.dart';

class ProductNegotiationScreen extends StatefulWidget {
  const ProductNegotiationScreen({super.key});

  @override
  State<ProductNegotiationScreen> createState() => _ProductNegotiationScreenState();
}

class _ProductNegotiationScreenState extends State<ProductNegotiationScreen> {
  bool _showNegotiationSheet = true;

  // Colors from design
  static const Color primary = Color(0xFF135bec);
  static const Color backgroundLight = Color(0xFFf6f6f8);
  static const Color slate900 = Color(0xFF0f172a);
  static const Color slate600 = Color(0xFF475569);
  static const Color slate500 = Color(0xFF64748b);
  static const Color slate400 = Color(0xFF94a3b8);
  static const Color slate200 = Color(0xFFe2e8f0);
  static const Color slate100 = Color(0xFFf1f5f9);
  static const Color slate50 = Color(0xFFf8fafc);
  static const Color yellow50 = Color(0xFFfefce8);
  static const Color yellow100 = Color(0xFFfef9c3);
  static const Color yellow600 = Color(0xFFca8a04);
  static const Color yellow700 = Color(0xFFa16207);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundLight,
      body: Stack(
        children: [
          Column(
            children: [
              // TopAppBar
              Container(
                color: backgroundLight.withOpacity(0.8),
                child: SafeArea(
                  bottom: false,
                  child: Container(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                    child: Row(
                      children: [
                        SizedBox(
                          width: 48,
                          height: 48,
                          child: Icon(Icons.arrow_back_ios, color: slate900),
                        ),
                        Expanded(
                          child: Text(
                            'Product Details',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: slate900,
                              letterSpacing: -0.015 * 18,
                            ),
                          ),
                        ),
                        SizedBox(
                          width: 48,
                          height: 48,
                          child: Icon(Icons.share, color: slate900),
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
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Stack(
                            children: [
                              CachedNetworkImage(
                                imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5z3C6Fm9PluvMnx7q6SOATp1RBJ6v95hlz6g-g2J5agCqZk3mGFwJAU1qViuDOsjEIcB2OS9ZTKzdqEypiTCxq8foElraVEzAJbunIC20r2-iqvzIJDJQZX9yNFsHDryYrKOEQYlcdHCNegyi4iirHwjEUUTQp2fjdniffGOH4Ri__B265Zi2XpThpHrOZZsg7CwyOv7znf37CNCVEJ-c0eLSrVISJ8dLUzaSvzwKU1Td7hNJ-Pe5RCPT9EVqotuPybzi52mJit2q',
                                width: double.infinity,
                                height: 320,
                                fit: BoxFit.cover,
                                placeholder: (context, url) => Container(height: 320, color: slate200),
                                errorWidget: (context, url, error) => Container(height: 320, color: slate200),
                              ),
                              Positioned.fill(
                                child: Container(
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      begin: Alignment.topCenter,
                                      end: Alignment.bottomCenter,
                                      colors: [
                                        Colors.transparent,
                                        Colors.black.withOpacity(0.4),
                                      ],
                                      stops: const [0.75, 1.0],
                                    ),
                                  ),
                                ),
                              ),
                              Positioned(
                                bottom: 20,
                                left: 0,
                                right: 0,
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: List.generate(5, (index) {
                                    return Container(
                                      width: 6,
                                      height: 6,
                                      margin: const EdgeInsets.symmetric(horizontal: 4),
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: index == 0 ? Colors.white : Colors.white.withOpacity(0.5),
                                      ),
                                    );
                                  }),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                      // Headline & Price
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: primary.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      'AGRI-TECH SERIES',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w700,
                                        color: primary,
                                        letterSpacing: 1,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'AGRI-PRO 500 Mini Mill',
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 24,
                                      fontWeight: FontWeight.w800,
                                      color: slate900,
                                      letterSpacing: -0.5,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  '₹45,999',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 24,
                                    fontWeight: FontWeight.w900,
                                    color: primary,
                                  ),
                                ),
                                Text(
                                  '₹52,000',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 12,
                                    color: slate500,
                                    decoration: TextDecoration.lineThrough,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                      // Description
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: Text(
                          'High-efficiency grain processing unit suitable for wholesale distribution and small-scale farming. Features a 2HP copper motor, adjustable fineness, and stainless steel housing for long-term durability.',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 14,
                            color: slate600,
                            height: 1.6,
                          ),
                        ),
                      ),

                      // Specifications
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'SPECIFICATIONS',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: slate900,
                                letterSpacing: 2,
                              ),
                            ),
                            const SizedBox(height: 12),
                            GridView.count(
                              crossAxisCount: 2,
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              crossAxisSpacing: 12,
                              mainAxisSpacing: 12,
                              childAspectRatio: 2.5,
                              children: [
                                _buildSpecCard('CAPACITY', '50-70 kg/hr'),
                                _buildSpecCard('POWER', '1.5 kW Single Phase'),
                                _buildSpecCard('MATERIAL', 'Food-grade SS'),
                                _buildSpecCard('WARRANTY', '2 Year On-site'),
                              ],
                            ),
                          ],
                        ),
                      ),

                      // Customer Reviews
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'CUSTOMER REVIEWS',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: slate900,
                                letterSpacing: 2,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Rating Score
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '4.8',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 40,
                                        fontWeight: FontWeight.w900,
                                        color: slate900,
                                        letterSpacing: -2,
                                      ),
                                    ),
                                    Row(
                                      children: List.generate(5, (index) {
                                        return Icon(
                                          index < 4 ? Icons.star : Icons.star_border,
                                          color: primary,
                                          size: 18,
                                        );
                                      }),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      '124 reviews',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 12,
                                        color: slate500,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(width: 32),
                                // Rating Bars
                                Expanded(
                                  child: Column(
                                    children: [
                                      _buildRatingBar('5', 0.7, '70%'),
                                      const SizedBox(height: 8),
                                      _buildRatingBar('4', 0.2, '20%'),
                                      const SizedBox(height: 8),
                                      _buildRatingBar('3', 0.05, '5%'),
                                    ],
                                  ),
                                ),
                              ],
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

          // Bottom Actions
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: slate200)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: SizedBox(
                      height: 56,
                      child: ElevatedButton.icon(
                        onPressed: () {},
                        icon: const Icon(Icons.shopping_cart),
                        label: Text(
                          'Add to Cart',
                          style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: slate100,
                          foregroundColor: slate900,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: SizedBox(
                      height: 56,
                      child: ElevatedButton.icon(
                        onPressed: () => setState(() => _showNegotiationSheet = true),
                        icon: const Icon(Icons.handshake),
                        label: Text(
                          'Negotiate Bulk',
                          style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: primary,
                          foregroundColor: Colors.white,
                          elevation: 8,
                          shadowColor: primary.withOpacity(0.2),
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
          ),

          // Negotiation Sheet Overlay
          if (_showNegotiationSheet)
            GestureDetector(
              onTap: () => setState(() => _showNegotiationSheet = false),
              child: Container(
                color: Colors.black.withOpacity(0.6),
                child: Column(
                  children: [
                    const Spacer(),
                    GestureDetector(
                      onTap: () {},
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.fromLTRB(24, 24, 24, 48),
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Handle
                            Center(
                              child: Container(
                                width: 48,
                                height: 6,
                                decoration: BoxDecoration(
                                  color: slate200,
                                  borderRadius: BorderRadius.circular(999),
                                ),
                              ),
                            ),
                            const SizedBox(height: 24),

                            // Header
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: primary.withOpacity(0.1),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(Icons.request_quote, color: primary),
                                ),
                                const SizedBox(width: 12),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Bulk Negotiation',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 20,
                                        fontWeight: FontWeight.w700,
                                        color: slate900,
                                      ),
                                    ),
                                    Text(
                                      'Submit your best offer for 10+ units',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 14,
                                        color: slate500,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                            const SizedBox(height: 24),

                            // Quantity Field
                            Text(
                              'QUANTITY (MIN. 10)',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: slate400,
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Container(
                              decoration: BoxDecoration(
                                color: slate50,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: slate200),
                              ),
                              child: TextField(
                                keyboardType: TextInputType.number,
                                decoration: InputDecoration(
                                  hintText: 'Enter quantity',
                                  hintStyle: GoogleFonts.plusJakartaSans(color: slate400),
                                  border: InputBorder.none,
                                  contentPadding: const EdgeInsets.all(16),
                                ),
                                controller: TextEditingController(text: '10'),
                                style: GoogleFonts.plusJakartaSans(
                                  fontWeight: FontWeight.w600,
                                  color: slate900,
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),

                            // Target Price Field
                            Text(
                              'TARGET PRICE (PER UNIT)',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: slate400,
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Container(
                              decoration: BoxDecoration(
                                color: slate50,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: slate200),
                              ),
                              child: TextField(
                                keyboardType: TextInputType.number,
                                decoration: InputDecoration(
                                  prefixText: '₹ ',
                                  prefixStyle: GoogleFonts.plusJakartaSans(
                                    fontWeight: FontWeight.w700,
                                    color: slate500,
                                  ),
                                  hintText: '38,000',
                                  hintStyle: GoogleFonts.plusJakartaSans(color: slate400),
                                  border: InputBorder.none,
                                  contentPadding: const EdgeInsets.all(16),
                                ),
                                style: GoogleFonts.plusJakartaSans(
                                  fontWeight: FontWeight.w600,
                                  color: slate900,
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),

                            // Info Banner
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: yellow50,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: yellow100),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Icon(Icons.info, color: yellow600, size: 16),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      'Payments for bulk orders require manual UPI verification by our admins before processing.',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 12,
                                        color: yellow700,
                                        height: 1.4,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 24),

                            // Buttons
                            Row(
                              children: [
                                Expanded(
                                  child: TextButton(
                                    onPressed: () => setState(() => _showNegotiationSheet = false),
                                    child: Text(
                                      'Cancel',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w700,
                                        color: slate500,
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  flex: 2,
                                  child: SizedBox(
                                    height: 56,
                                    child: ElevatedButton(
                                      onPressed: () {},
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: primary,
                                        foregroundColor: Colors.white,
                                        elevation: 8,
                                        shadowColor: primary.withOpacity(0.2),
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                      ),
                                      child: Text(
                                        'Submit Quotation',
                                        style: GoogleFonts.plusJakartaSans(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w700,
                                        ),
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
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSpecCard(String label, String value) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: slate100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            label,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: slate500,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: slate900,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRatingBar(String stars, double percentage, String label) {
    return Row(
      children: [
        SizedBox(
          width: 20,
          child: Text(
            stars,
            style: GoogleFonts.plusJakartaSans(fontSize: 12, color: slate600),
          ),
        ),
        Expanded(
          child: Container(
            height: 6,
            decoration: BoxDecoration(
              color: slate200,
              borderRadius: BorderRadius.circular(999),
            ),
            child: FractionallySizedBox(
              alignment: Alignment.centerLeft,
              widthFactor: percentage,
              child: Container(
                decoration: BoxDecoration(
                  color: primary,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
          ),
        ),
        SizedBox(
          width: 40,
          child: Text(
            label,
            textAlign: TextAlign.right,
            style: GoogleFonts.plusJakartaSans(fontSize: 12, color: slate500),
          ),
        ),
      ],
    );
  }
}
