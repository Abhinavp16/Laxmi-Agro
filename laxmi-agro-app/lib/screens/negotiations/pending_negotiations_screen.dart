import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:google_fonts/google_fonts.dart';

class PendingNegotiationsScreen extends StatefulWidget {
  const PendingNegotiationsScreen({super.key});

  @override
  State<PendingNegotiationsScreen> createState() => _PendingNegotiationsScreenState();
}

class _PendingNegotiationsScreenState extends State<PendingNegotiationsScreen> {
  int _selectedTab = 0;
  int _selectedNavIndex = 1;

  // Colors from design
  static const Color primary = Color(0xFF135bec);
  static const Color backgroundLight = Color(0xFFf6f6f8);
  static const Color textDark = Color(0xFF0d121b);
  static const Color gray500 = Color(0xFF6b7280);
  static const Color gray400 = Color(0xFF9ca3af);
  static const Color gray300 = Color(0xFFd1d5db);
  static const Color gray200 = Color(0xFFe5e7eb);
  static const Color gray100 = Color(0xFFf3f4f6);
  static const Color gray50 = Color(0xFFf9fafb);
  static const Color yellow100 = Color(0xFFfef3c7);
  static const Color yellow700 = Color(0xFFa16207);
  static const Color blue100 = Color(0xFFdbeafe);
  static const Color blue700 = Color(0xFF1d4ed8);
  static const Color red50 = Color(0xFFfef2f2);
  static const Color red600 = Color(0xFFdc2626);

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
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                decoration: const BoxDecoration(
                  border: Border(bottom: BorderSide(color: gray200)),
                ),
                child: Row(
                  children: [
                    SizedBox(
                      width: 48,
                      height: 48,
                      child: Icon(Icons.arrow_back_ios, color: primary),
                    ),
                    Expanded(
                      child: Text(
                        'Pending Negotiations',
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
                      child: Icon(Icons.search, color: textDark),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Tabs
          Container(
            color: Colors.white,
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: gray200)),
            ),
            child: Row(
              children: [
                _buildTab('Pending', 0),
                _buildTab('Countered', 1),
                _buildTab('Completed', 2),
              ],
            ),
          ),

          // Content
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Section Header
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Active Requests',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                            color: textDark,
                            letterSpacing: -0.015 * 20,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Review 3 bulk purchase proposals',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 14,
                            color: gray500,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Negotiation Card 1
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: gray100),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.04),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          // Image
                          ClipRRect(
                            borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                            child: AspectRatio(
                              aspectRatio: 16 / 9,
                              child: CachedNetworkImage(
                                imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCfjvY9qv7e2DrzoarDJlFi_jYIt61c3SXbMznlWUWHVcJoUrnydvSqGF6yKzkzfXBQq3_yM3Z5VzEdlK3w7KAxeOykQnfDpLNZrPwqKa5FBnH4Y2ZPNm4rXLmiuQ2V-PH4PkiyfkUOoNOk1pdpgQpodhuCfmqNSww3HoRcN6IKmN1twcPfV9kocnazApf4grG6fJrExHZmzBuYtiadH4f8-CdumZ1O02LS4JIL7qC0l-ae7fhmAQXlhVFeAceRkqyU4pJPL1B11B5s',
                                fit: BoxFit.cover,
                                placeholder: (context, url) => Container(color: gray200),
                                errorWidget: (context, url, error) => Container(color: gray200),
                              ),
                            ),
                          ),
                          // Content
                          Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Header row
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'REQ-8291',
                                          style: GoogleFonts.plusJakartaSans(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w700,
                                            color: primary,
                                            letterSpacing: 1,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          'Wholesale Farm Equipment Co.',
                                          style: GoogleFonts.plusJakartaSans(
                                            fontSize: 18,
                                            fontWeight: FontWeight.w700,
                                            color: textDark,
                                          ),
                                        ),
                                      ],
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: yellow100,
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        'PENDING REVIEW',
                                        style: GoogleFonts.plusJakartaSans(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w700,
                                          color: yellow700,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),

                                // Product info
                                Text(
                                  '15x Industrial Harvesters - Gen 4',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                    color: Color(0xFF4b5563),
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Text(
                                      '\$1,400,000',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 12,
                                        color: gray400,
                                        decoration: TextDecoration.lineThrough,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Proposed: \$1,250,000',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w700,
                                        color: textDark,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 16),

                                // Negotiation History Timeline
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: gray50,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'NEGOTIATION HISTORY',
                                        style: GoogleFonts.plusJakartaSans(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w700,
                                          color: gray400,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      // Timeline item 1
                                      Row(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Column(
                                            children: [
                                              Container(
                                                width: 8,
                                                height: 8,
                                                decoration: BoxDecoration(
                                                  shape: BoxShape.circle,
                                                  color: gray300,
                                                ),
                                              ),
                                              Container(
                                                width: 2,
                                                height: 24,
                                                color: gray200,
                                              ),
                                            ],
                                          ),
                                          const SizedBox(width: 12),
                                          Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                'Quote requested',
                                                style: GoogleFonts.plusJakartaSans(
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w600,
                                                  color: textDark,
                                                ),
                                              ),
                                              Text(
                                                'Oct 12, 10:30 AM',
                                                style: GoogleFonts.plusJakartaSans(
                                                  fontSize: 10,
                                                  color: gray500,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                      // Timeline item 2
                                      Row(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Container(
                                            width: 8,
                                            height: 8,
                                            decoration: const BoxDecoration(
                                              shape: BoxShape.circle,
                                              color: primary,
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                          Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                'Price Counter-proposal',
                                                style: GoogleFonts.plusJakartaSans(
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w600,
                                                  color: primary,
                                                ),
                                              ),
                                              RichText(
                                                text: TextSpan(
                                                  style: GoogleFonts.plusJakartaSans(
                                                    fontSize: 10,
                                                    color: gray500,
                                                  ),
                                                  children: [
                                                    const TextSpan(text: 'Oct 14, 02:15 PM • '),
                                                    TextSpan(
                                                      text: 'Wholesaler',
                                                      style: GoogleFonts.plusJakartaSans(
                                                        fontSize: 10,
                                                        fontWeight: FontWeight.w700,
                                                        color: gray500,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 16),

                                // Buttons
                                Row(
                                  children: [
                                    Expanded(
                                      child: SizedBox(
                                        height: 40,
                                        child: ElevatedButton(
                                          onPressed: () {},
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: primary,
                                            foregroundColor: Colors.white,
                                            elevation: 0,
                                            shape: RoundedRectangleBorder(
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                          ),
                                          child: Text(
                                            'Accept',
                                            style: GoogleFonts.plusJakartaSans(
                                              fontSize: 14,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: SizedBox(
                                        height: 40,
                                        child: OutlinedButton(
                                          onPressed: () {},
                                          style: OutlinedButton.styleFrom(
                                            backgroundColor: gray100,
                                            foregroundColor: textDark,
                                            side: BorderSide(color: gray200),
                                            shape: RoundedRectangleBorder(
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                          ),
                                          child: Text(
                                            'Counter-offer',
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
                                const SizedBox(height: 8),
                                SizedBox(
                                  width: double.infinity,
                                  height: 40,
                                  child: TextButton(
                                    onPressed: () {},
                                    style: TextButton.styleFrom(
                                      backgroundColor: red50,
                                      foregroundColor: red600,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                    ),
                                    child: Text(
                                      'Reject',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w700,
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

                  // Negotiation Card 2
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: gray100),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.04),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Header row
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'REQ-8295',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700,
                                        color: primary,
                                        letterSpacing: 1,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Agro-Logistics North',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 18,
                                        fontWeight: FontWeight.w700,
                                        color: textDark,
                                      ),
                                    ),
                                  ],
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: blue100,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    'URGENT',
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700,
                                      color: blue700,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),

                            // Product info
                            Text(
                              '8x Multi-Terrain Tractors',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                                color: Color(0xFF4b5563),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Proposed: \$640,000',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: textDark,
                              ),
                            ),
                            const SizedBox(height: 16),

                            // Button
                            SizedBox(
                              width: double.infinity,
                              height: 40,
                              child: ElevatedButton(
                                onPressed: () {},
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: primary,
                                  foregroundColor: Colors.white,
                                  elevation: 0,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                ),
                                child: Text(
                                  'Review Proposal',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 14,
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

                  const SizedBox(height: 80),
                ],
              ),
            ),
          ),
        ],
      ),
      // Bottom Navigation
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.8),
          border: const Border(top: BorderSide(color: gray200)),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildNavItem(Icons.dashboard, 'Dashboard', 0),
                _buildNavItem(Icons.handshake, 'Deals', 1),
                _buildNavItem(Icons.inventory_2, 'Stock', 2),
                _buildNavItem(Icons.person, 'Admin', 3),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTab(String label, int index) {
    final isSelected = _selectedTab == index;
    return Expanded(
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
            label,
            textAlign: TextAlign.center,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: isSelected ? primary : gray500,
              letterSpacing: 0.015 * 14,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(IconData icon, String label, int index) {
    final isSelected = _selectedNavIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedNavIndex = index),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            color: isSelected ? primary : gray400,
            size: 24,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 10,
              fontWeight: FontWeight.w500,
              color: isSelected ? primary : gray400,
            ),
          ),
        ],
      ),
    );
  }
}
