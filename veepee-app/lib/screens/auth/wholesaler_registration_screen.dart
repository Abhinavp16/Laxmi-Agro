import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class WholesalerRegistrationScreen extends StatefulWidget {
  const WholesalerRegistrationScreen({super.key});

  @override
  State<WholesalerRegistrationScreen> createState() => _WholesalerRegistrationScreenState();
}

class _WholesalerRegistrationScreenState extends State<WholesalerRegistrationScreen> {
  String? _selectedCategory;

  // Colors from design
  static const Color primary = Color(0xFF135bec);
  static const Color backgroundLight = Color(0xFFf6f6f8);
  static const Color textDark = Color(0xFF0d121b);
  static const Color textSecondary = Color(0xFF4c669a);
  static const Color borderColor = Color(0xFFcfd7e7);
  static const Color gray500 = Color(0xFF6b7280);

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
                  border: Border(bottom: BorderSide(color: borderColor)),
                ),
                child: Row(
                  children: [
                    SizedBox(
                      width: 48,
                      height: 48,
                      child: Icon(Icons.arrow_back, color: textDark),
                    ),
                    Expanded(
                      child: Text(
                        'Wholesaler Registration',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: textDark,
                          letterSpacing: -0.015 * 18,
                        ),
                      ),
                    ),
                    const SizedBox(width: 48),
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
                  // Progress Bar
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Registration Progress',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 16,
                                fontWeight: FontWeight.w500,
                                color: textDark,
                              ),
                            ),
                            Text(
                              '1 of 2',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 14,
                                color: textDark,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Container(
                          height: 8,
                          decoration: BoxDecoration(
                            color: borderColor,
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: FractionallySizedBox(
                            alignment: Alignment.centerLeft,
                            widthFactor: 0.5,
                            child: Container(
                              decoration: BoxDecoration(
                                color: primary,
                                borderRadius: BorderRadius.circular(999),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Headline
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
                    child: Text(
                      'Business Details',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 24,
                        fontWeight: FontWeight.w700,
                        color: textDark,
                        letterSpacing: -0.5,
                      ),
                    ),
                  ),

                  // Body Text
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
                    child: Text(
                      'Complete this form to access wholesale pricing and unlock bulk machinery negotiations.',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 16,
                        color: textDark,
                      ),
                    ),
                  ),

                  // Business Name
                  _buildTextField(
                    label: 'Business Name',
                    placeholder: 'Enter registered company name',
                  ),

                  // Contact Person
                  _buildTextField(
                    label: 'Contact Person',
                    placeholder: 'Full name of representative',
                  ),

                  // Business Email
                  _buildTextField(
                    label: 'Business Email',
                    placeholder: 'name@company.com',
                    keyboardType: TextInputType.emailAddress,
                  ),

                  // GST Number
                  _buildTextField(
                    label: 'GST Number',
                    placeholder: '15-digit GSTIN',
                    isOptional: true,
                  ),

                  // Primary Interest Dropdown
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Primary Interest',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                            color: textDark,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          height: 56,
                          padding: const EdgeInsets.symmetric(horizontal: 15),
                          decoration: BoxDecoration(
                            color: backgroundLight,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: borderColor),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: _selectedCategory,
                              hint: Text(
                                'Select category',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 16,
                                  color: textSecondary,
                                ),
                              ),
                              isExpanded: true,
                              icon: Icon(Icons.expand_more, color: textDark),
                              items: const [
                                DropdownMenuItem(value: 'mini-mills', child: Text('Mini Mills')),
                                DropdownMenuItem(value: 'farming-tools', child: Text('Farming Tools')),
                                DropdownMenuItem(value: 'tractors', child: Text('Tractors & Heavy Duty')),
                                DropdownMenuItem(value: 'irrigation', child: Text('Irrigation Systems')),
                                DropdownMenuItem(value: 'processing', child: Text('Food Processing Machinery')),
                              ],
                              onChanged: (value) => setState(() => _selectedCategory = value),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Navigation Buttons
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 32, 16, 12),
                    child: SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton(
                        onPressed: () {},
                        style: ElevatedButton.styleFrom(
                          backgroundColor: primary,
                          foregroundColor: Colors.white,
                          elevation: 8,
                          shadowColor: primary.withOpacity(0.3),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: Text(
                          'Next Step',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ),

                  // Sign in link
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Center(
                      child: RichText(
                        text: TextSpan(
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 14,
                            color: gray500,
                          ),
                          children: [
                            const TextSpan(text: 'Already have a wholesale account? '),
                            TextSpan(
                              text: 'Sign in here',
                              style: GoogleFonts.plusJakartaSans(
                                fontWeight: FontWeight.w600,
                                color: primary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTextField({
    required String label,
    required String placeholder,
    TextInputType keyboardType = TextInputType.text,
    bool isOptional = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  color: textDark,
                ),
              ),
              if (isOptional)
                Text(
                  'OPTIONAL',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 12,
                    color: gray500,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Container(
            height: 56,
            decoration: BoxDecoration(
              color: backgroundLight,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: borderColor),
            ),
            child: TextField(
              keyboardType: keyboardType,
              decoration: InputDecoration(
                hintText: placeholder,
                hintStyle: GoogleFonts.plusJakartaSans(
                  fontSize: 16,
                  color: textSecondary,
                ),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.all(15),
              ),
              style: GoogleFonts.plusJakartaSans(
                fontSize: 16,
                color: textDark,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
