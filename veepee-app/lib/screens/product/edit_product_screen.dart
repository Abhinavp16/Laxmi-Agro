import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:google_fonts/google_fonts.dart';

class EditProductScreen extends StatefulWidget {
  const EditProductScreen({super.key});

  @override
  State<EditProductScreen> createState() => _EditProductScreenState();
}

class _EditProductScreenState extends State<EditProductScreen> {
  bool _isActive = true;

  // Colors from design
  static const Color primary = Color(0xFF46ec13);
  static const Color backgroundLight = Color(0xFFf6f8f6);
  static const Color textDark = Color(0xFF111b0d);
  static const Color gray200 = Color(0xFFe5e7eb);
  static const Color gray300 = Color(0xFFd1d5db);
  static const Color gray400 = Color(0xFF9ca3af);
  static const Color gray500 = Color(0xFF6b7280);
  static const Color borderColor = Color(0xFFd5e7cf);
  static const Color red500 = Color(0xFFef4444);

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
                        'Edit Product',
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
                      child: Icon(Icons.delete, color: red500),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.only(bottom: 100),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Product Images Header
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Product Images',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: textDark,
                            letterSpacing: -0.015 * 18,
                          ),
                        ),
                        Text(
                          'Drag to reorder',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: gray500,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Image Grid
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Expanded(child: _buildImageTile('https://lh3.googleusercontent.com/aida-public/AB6AXuDjpLtW-hqjBKWGGoltaGOBkkKzJjzF_JMGDQ3PGGnvnkdYjBSV9JcptpFPPOpmT_tk10xYmsTudPyPeBGFUJSddRW1JZbvYYmrbWOuCWIo2B60Mpzz_Tw609vJafWsoeOMkdR0oKYDfOiqJze9lLcD8FQno4MGg0gTzS2pcGACbSbguLJgg8eafnkAH_-mb7y_Bdjdovp5DZt2-BSVm8CV6wbLi8KQJPIORgqxMeWfM1vMFm_8mbtPRvjQMdDQ3hXUyjE_80XhiW48')),
                        const SizedBox(width: 12),
                        Expanded(child: _buildImageTile('https://lh3.googleusercontent.com/aida-public/AB6AXuD1lRY8EzjAWuOlPJM1rOQpcn-jjro3ALousvrASx7hMd79wUEGNtpoOg7RadknnWBoG9PjBBniQiaEizkKbnW96lAdH-WQh9eBshEbhaLfymHArs6T2rlNo7whuvFIEBzZqO_k3VRFi5_tl8dQG9qQ7vjvKTM6muyfeBjp68Apmctmt8L7Q6w79AdpZbA9RGto_Cp4n3LY7CAE64pnkoJ2QxD8N4z2wHptOEUU4uFhF1jLwg8Cri4dXOWvFMv0veITXj-Sxo_-2DxQ')),
                        const SizedBox(width: 12),
                        Expanded(child: _buildAddImageTile()),
                      ],
                    ),
                  ),

                  // Add More Images Button
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: primary.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.add, color: textDark, size: 16),
                          const SizedBox(width: 8),
                          Text(
                            'Add more images',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: textDark,
                              letterSpacing: 0.015 * 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // General Information Header
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                    child: Text(
                      'General Information',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: textDark,
                        letterSpacing: -0.015 * 18,
                      ),
                    ),
                  ),

                  // Product Name
                  _buildTextField(
                    label: 'Product Name',
                    initialValue: 'Portable Mini Mill - Series X',
                  ),

                  // Price
                  _buildTextField(
                    label: 'Price (USD)',
                    initialValue: '1,250.00',
                    prefix: '\$',
                  ),

                  // Description
                  _buildTextArea(
                    label: 'Description',
                    initialValue: 'High-efficiency portable mini mill for small-scale grain processing. Durable build with a 2HP motor. Easy to transport and maintain.',
                  ),

                  // Active Status Toggle
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: borderColor),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Active Status',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: textDark,
                                ),
                              ),
                              Text(
                                'Visible to customers in marketplace',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 12,
                                  color: gray500,
                                ),
                              ),
                            ],
                          ),
                          Switch(
                            value: _isActive,
                            onChanged: (value) => setState(() => _isActive = value),
                            activeThumbColor: primary,
                            activeTrackColor: primary,
                            inactiveThumbColor: Colors.white,
                            inactiveTrackColor: gray200,
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Last Updated Info
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
                    child: Row(
                      children: [
                        Icon(Icons.schedule, size: 14, color: gray500),
                        const SizedBox(width: 8),
                        Text(
                          'Last Updated: October 24, 2023 at 2:15 PM',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12,
                            color: gray500,
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

      // Fixed Footer Button
      bottomSheet: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: backgroundLight.withOpacity(0.8),
          border: Border(top: BorderSide(color: gray200)),
        ),
        child: SafeArea(
          child: SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: primary,
                foregroundColor: textDark,
                elevation: 8,
                shadowColor: primary.withOpacity(0.3),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(
                'Update Changes',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildImageTile(String imageUrl) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        AspectRatio(
          aspectRatio: 1,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: CachedNetworkImage(
              imageUrl: imageUrl,
              fit: BoxFit.cover,
              placeholder: (context, url) => Container(color: gray200),
              errorWidget: (context, url, error) => Container(color: gray200),
            ),
          ),
        ),
        Positioned(
          top: -4,
          right: -4,
          child: Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 4,
                ),
              ],
            ),
            child: Icon(Icons.close, size: 14, color: textDark),
          ),
        ),
      ],
    );
  }

  Widget _buildAddImageTile() {
    return AspectRatio(
      aspectRatio: 1,
      child: Container(
        decoration: BoxDecoration(
          border: Border.all(color: gray300, width: 2, style: BorderStyle.solid),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Center(
          child: Icon(Icons.add_a_photo, color: gray400),
        ),
      ),
    );
  }

  Widget _buildTextField({
    required String label,
    required String initialValue,
    String? prefix,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: textDark,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            height: 56,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: borderColor),
            ),
            child: TextField(
              controller: TextEditingController(text: initialValue),
              decoration: InputDecoration(
                prefixText: prefix != null ? '$prefix ' : null,
                prefixStyle: GoogleFonts.plusJakartaSans(color: gray500),
                border: InputBorder.none,
                contentPadding: EdgeInsets.only(
                  left: prefix != null ? 32 : 15,
                  right: 15,
                  top: 15,
                  bottom: 15,
                ),
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

  Widget _buildTextArea({
    required String label,
    required String initialValue,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: textDark,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            height: 128,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: borderColor),
            ),
            child: TextField(
              controller: TextEditingController(text: initialValue),
              maxLines: null,
              expands: true,
              decoration: const InputDecoration(
                border: InputBorder.none,
                contentPadding: EdgeInsets.all(15),
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
