import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:google_fonts/google_fonts.dart';

class WholesalerProfileScreen extends StatefulWidget {
  const WholesalerProfileScreen({super.key});

  @override
  State<WholesalerProfileScreen> createState() => _WholesalerProfileScreenState();
}

class _WholesalerProfileScreenState extends State<WholesalerProfileScreen> {
  int _selectedNavIndex = 3;

  // Colors from design
  static const Color primary = Color(0xFF135bec);
  static const Color backgroundLight = Color(0xFFf6f6f8);
  static const Color slate900 = Color(0xFF0f172a);
  static const Color slate500 = Color(0xFF64748b);
  static const Color slate400 = Color(0xFF94a3b8);
  static const Color slate200 = Color(0xFFe2e8f0);
  static const Color slate100 = Color(0xFFf1f5f9);
  static const Color red500 = Color(0xFFef4444);
  static const Color red100 = Color(0xFFfee2e2);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundLight,
      body: Column(
        children: [
          // Top Navigation Bar
          Container(
            color: backgroundLight,
            child: SafeArea(
              bottom: false,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  border: Border(bottom: BorderSide(color: slate200)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.arrow_back_ios_new, color: slate900),
                    ),
                    Expanded(
                      child: Text(
                        'Wholesaler Profile',
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
                      width: 40,
                      height: 40,
                      child: Icon(Icons.settings, color: slate900),
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
                children: [
                  // Profile Header
                  Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      children: [
                        // Avatar
                        Stack(
                          children: [
                            Container(
                              width: 128,
                              height: 128,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white, width: 4),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.1),
                                    blurRadius: 20,
                                    offset: const Offset(0, 8),
                                  ),
                                ],
                              ),
                              child: ClipOval(
                                child: CachedNetworkImage(
                                  imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDSC1YkNxAIuSUGmylX966i22JM2cKlsZ1vmTeEamXbShU7MFZb5jGKwEXc5jGmLAKP35hfMeKxKvVQ_UY-zCQsdSYTlS9dBGwlWHzv7m9BnO0Q-L-olmfunXv3W4HrGhoHET2fRPbEVakTj8UeHOrJKEkParCDG3ethhHpyFw1HGtu-8kf7LD6rGOQAw8y9ccKE1c_A0pkVUAPEPKOt_BJQP1Fa1vh8dPEavxpHb6IzYWuEZNQSw54NsbTH6-lACOS6AXswZAK3f2A',
                                  fit: BoxFit.cover,
                                  placeholder: (context, url) => Container(color: slate200),
                                  errorWidget: (context, url, error) => Container(color: slate200),
                                ),
                              ),
                            ),
                            Positioned(
                              bottom: 0,
                              right: 0,
                              child: Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: primary,
                                  shape: BoxShape.circle,
                                  border: Border.all(color: Colors.white, width: 2),
                                ),
                                child: const Icon(Icons.verified, color: Colors.white, size: 16),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // Company Name
                        Text(
                          'AgriMech Solutions Ltd.',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 24,
                            fontWeight: FontWeight.w700,
                            color: slate900,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 4),

                        // Status Row
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'Verified Wholesaler',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: primary,
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 6),
                              child: Text('•', style: TextStyle(color: slate400)),
                            ),
                            Text(
                              'Member since 2018',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 14,
                                color: slate500,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),

                        // Switch View Button
                        Container(
                          height: 48,
                          constraints: const BoxConstraints(minWidth: 200),
                          child: ElevatedButton(
                            onPressed: () {},
                            style: ElevatedButton.styleFrom(
                              backgroundColor: primary.withOpacity(0.1),
                              foregroundColor: primary,
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.swap_horiz, size: 20),
                                const SizedBox(width: 8),
                                Text(
                                  'Switch to Retail View',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Stats Section
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      children: [
                        _buildStatCard('NEGOTIATIONS', '124', slate900),
                        const SizedBox(width: 12),
                        _buildStatCard('ACTIVE DEALS', '18', primary),
                        const SizedBox(width: 12),
                        _buildStatCard('POINTS', '4,500', slate900),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Business Management Section
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: slate200),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
                            child: Text(
                              'BUSINESS MANAGEMENT',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: slate900,
                                letterSpacing: 2,
                              ),
                            ),
                          ),
                          _buildMenuItem(
                            icon: Icons.description,
                            iconBgColor: primary.withOpacity(0.1),
                            iconColor: primary,
                            title: 'Business Documents',
                            showBorder: true,
                          ),
                          _buildMenuItem(
                            icon: Icons.receipt_long,
                            iconBgColor: slate100,
                            iconColor: slate900,
                            title: 'Order History',
                            showBorder: true,
                          ),
                          _buildMenuItem(
                            icon: Icons.notifications,
                            iconBgColor: slate100,
                            iconColor: slate900,
                            title: 'Notification Settings',
                            showBorder: false,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Support Section
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: slate200),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
                            child: Text(
                              'SUPPORT',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: slate900,
                                letterSpacing: 2,
                              ),
                            ),
                          ),
                          _buildMenuItem(
                            icon: Icons.help_center,
                            iconBgColor: slate100,
                            iconColor: slate900,
                            title: 'Help & Support',
                            showBorder: true,
                          ),
                          _buildMenuItem(
                            icon: Icons.local_offer_outlined,
                            iconBgColor: slate100,
                            iconColor: slate900,
                            title: 'My Coupon & Offer Code',
                            showBorder: true,
                          ),
                          _buildMenuItem(
                            icon: Icons.logout,
                            iconBgColor: red100,
                            iconColor: red500,
                            title: 'Sign Out',
                            titleColor: red500,
                            showBorder: false,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ],
      ),

      // Bottom Tab Bar
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.8),
          border: Border(top: BorderSide(color: slate200)),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildNavItem(Icons.home, 'HOME', 0),
                _buildNavItem(Icons.handshake, 'DEALS', 1),
                _buildNavItem(Icons.inventory_2, 'INVENTORY', 2),
                _buildNavItem(Icons.account_circle, 'PROFILE', 3),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(String label, String value, Color valueColor) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: slate200),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 4,
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: slate500,
                letterSpacing: 1,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 24,
                fontWeight: FontWeight.w700,
                color: valueColor,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required Color iconBgColor,
    required Color iconColor,
    required String title,
    Color? titleColor,
    required bool showBorder,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: showBorder
            ? Border(bottom: BorderSide(color: slate100))
            : null,
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: iconBgColor,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: iconColor, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              title,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 16,
                fontWeight: titleColor != null ? FontWeight.w600 : FontWeight.w500,
                color: titleColor ?? slate900,
              ),
            ),
          ),
          Icon(Icons.chevron_right, color: slate400),
        ],
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
          Icon(icon, color: isSelected ? primary : slate400, size: 24),
          const SizedBox(height: 4),
          Text(
            label,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: isSelected ? primary : slate400,
              letterSpacing: -0.5,
            ),
          ),
        ],
      ),
    );
  }
}
