import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class CounterOfferScreen extends StatelessWidget {
  const CounterOfferScreen({super.key});

  // Colors from design
  static const Color primary = Color(0xFF135bec);
  static const Color backgroundLight = Color(0xFFf6f6f8);
  static const Color textDark = Color(0xFF0d121b);
  static const Color textSecondary = Color(0xFF4c669a);
  static const Color gray200 = Color(0xFFe5e7eb);
  static const Color gray100 = Color(0xFFf3f4f6);
  static const Color gray50 = Color(0xFFf9fafb);
  static const Color green50 = Color(0xFFf0fdf4);
  static const Color green600 = Color(0xFF16a34a);
  static const Color green700 = Color(0xFF15803d);

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
                        'Create Counter-offer',
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
                      child: Icon(Icons.more_horiz, color: textDark),
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
                  // Original Request Section Header
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                    child: Text(
                      'Original Request',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: textDark,
                        letterSpacing: -0.015 * 18,
                      ),
                    ),
                  ),

                  // Item Details Card
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.03),
                            blurRadius: 4,
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          _buildDetailRow('Item', 'Tractor Model X (Heavy Duty)', true),
                          _buildDetailRow('Quantity', '50 units', true),
                          _buildDetailRow('Original Bid', '₹80,000 / unit', false),
                        ],
                      ),
                    ),
                  ),

                  // Price Comparison Card
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.03),
                            blurRadius: 4,
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Retail Price',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 14,
                                  color: textSecondary,
                                ),
                              ),
                              Text(
                                '₹95,000 / unit',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: textDark,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Container(
                            height: 8,
                            decoration: BoxDecoration(
                              color: gray100,
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: FractionallySizedBox(
                              alignment: Alignment.centerLeft,
                              widthFactor: 0.84,
                              child: Container(
                                decoration: BoxDecoration(
                                  color: primary,
                                  borderRadius: BorderRadius.circular(999),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Bid is 15.8% below retail price',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 12,
                              fontStyle: FontStyle.italic,
                              color: textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Proposed Counter-offer Section Header
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
                    child: Text(
                      'Proposed Counter-offer',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: textDark,
                        letterSpacing: -0.015 * 18,
                      ),
                    ),
                  ),

                  // Counter Price Input Card
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.03),
                            blurRadius: 4,
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'New Counter Price (per unit)',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                              color: textSecondary,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Container(
                            decoration: BoxDecoration(
                              color: gray50,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: Color(0xFFd1d5db)),
                            ),
                            child: TextField(
                              keyboardType: TextInputType.number,
                              decoration: InputDecoration(
                                prefixText: '₹ ',
                                prefixStyle: GoogleFonts.plusJakartaSans(
                                  color: Color(0xFF6b7280),
                                ),
                                hintText: '85,000',
                                hintStyle: GoogleFonts.plusJakartaSans(color: textSecondary),
                                border: InputBorder.none,
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                              ),
                              style: GoogleFonts.plusJakartaSans(
                                fontWeight: FontWeight.w700,
                                color: textDark,
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),

                          // Margin Indicator
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: green50,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Icon(Icons.trending_up, color: green600, size: 16),
                                    const SizedBox(width: 8),
                                    Text(
                                      'PROFIT MARGIN IMPACT',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: green700,
                                        letterSpacing: 1,
                                      ),
                                    ),
                                  ],
                                ),
                                Text(
                                  '+6.25% vs Bid',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: green700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Message to Buyer Card
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.03),
                            blurRadius: 4,
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Message to Buyer',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                              color: textSecondary,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Container(
                            height: 120,
                            decoration: BoxDecoration(
                              color: gray50,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: Color(0xFFd1d5db)),
                            ),
                            child: TextField(
                              maxLines: null,
                              expands: true,
                              decoration: InputDecoration(
                                hintText: 'Explain the reason for this counter-offer (e.g., freight costs, seasonal demand)...',
                                hintStyle: GoogleFonts.plusJakartaSans(
                                  color: textSecondary,
                                  fontSize: 14,
                                ),
                                border: InputBorder.none,
                                contentPadding: const EdgeInsets.all(12),
                              ),
                              style: GoogleFonts.plusJakartaSans(
                                color: textDark,
                                fontSize: 14,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Action Buttons
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: gray200)),
            ),
            child: SafeArea(
              child: Column(
                children: [
                  SizedBox(
                    width: double.infinity,
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
                        'Send Counter-offer',
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
                    height: 48,
                    child: TextButton(
                      onPressed: () {},
                      style: TextButton.styleFrom(
                        backgroundColor: gray100,
                        foregroundColor: textSecondary,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        'Save Draft',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
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

  Widget _buildDetailRow(String label, String value, bool showBorder) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        border: showBorder
            ? Border(bottom: BorderSide(color: gray100))
            : null,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 14,
              color: textSecondary,
            ),
          ),
          Text(
            value,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: textDark,
            ),
          ),
        ],
      ),
    );
  }
}
