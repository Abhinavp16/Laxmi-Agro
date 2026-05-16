import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:google_fonts/google_fonts.dart';

class DispatchManagementScreen extends StatefulWidget {
  const DispatchManagementScreen({super.key});

  @override
  State<DispatchManagementScreen> createState() => _DispatchManagementScreenState();
}

class _DispatchManagementScreenState extends State<DispatchManagementScreen> {
  int _selectedTab = 0;
  int _selectedNavIndex = 1;

  // Colors from design
  static const Color primary = Color(0xFF135bec);
  static const Color backgroundLight = Color(0xFFf6f6f8);
  static const Color gray900 = Color(0xFF111827);
  static const Color gray500 = Color(0xFF6b7280);
  static const Color gray400 = Color(0xFF9ca3af);
  static const Color gray200 = Color(0xFFe5e7eb);
  static const Color gray100 = Color(0xFFf3f4f6);
  static const Color green100 = Color(0xFFdcfce7);
  static const Color green700 = Color(0xFF15803d);

  final List<String> _tabs = ['Ready', 'Dispatched', 'Delivered'];

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
                      child: Icon(Icons.arrow_back_ios, color: gray900),
                    ),
                    Expanded(
                      child: Text(
                        'Dispatch Management',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: gray900,
                          letterSpacing: -0.015 * 18,
                        ),
                      ),
                    ),
                    SizedBox(
                      width: 48,
                      height: 48,
                      child: Icon(Icons.search, color: gray900),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Tabs
          Container(
            color: backgroundLight,
            child: Container(
              decoration: BoxDecoration(
                border: Border(bottom: BorderSide(color: gray200)),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: List.generate(_tabs.length, (index) {
                  final isSelected = _selectedTab == index;
                  return Padding(
                    padding: const EdgeInsets.only(right: 32),
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
                          _tabs[index],
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
                }),
              ),
            ),
          ),

          // Content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.only(bottom: 80),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Section Header
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                    child: Text(
                      'Verified Orders',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: gray900,
                        letterSpacing: -0.015 * 18,
                      ),
                    ),
                  ),

                  // Order Card 1 (Expanded with inputs)
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: gray100),
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
                          // Header Row
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: green100,
                                      borderRadius: BorderRadius.circular(999),
                                    ),
                                    child: Text(
                                      'PAID',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700,
                                        color: green700,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Order #AG-8821',
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700,
                                      color: gray900,
                                    ),
                                  ),
                                  Text(
                                    'Buyer: John Deere Farming Ltd.',
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 14,
                                      color: gray500,
                                    ),
                                  ),
                                ],
                              ),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: CachedNetworkImage(
                                  imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVuBFaq0eQL5kdbHdiZZUpewjTDPvQcC088BTNXozMwb-sKjHHjXaTVnJ8fnH1Obc0IqWkoGghUt23eYIxu5aGoWDxhgebTDH-lVAd452ek4_YLm3GOLhEhV_chWu3h0ZYHjjDo_Usjr30ET2Kvr7eJNvUzzAa4DaBeN5le7O7JAlo3EXmYGs1Adlc6s2PP62zQ4yzNx2Y3lXPUg3NeVZF30n8uwD9soqV39piV4FtDcfnKuityrji3i7xLhg2O9WU6-CJKAiO9sc6',
                                  width: 80,
                                  height: 80,
                                  fit: BoxFit.cover,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),

                          // Product Info
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: backgroundLight,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              children: [
                                Icon(Icons.agriculture, color: primary),
                                const SizedBox(width: 16),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Harvesting Combine X9',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w500,
                                        color: gray900,
                                      ),
                                    ),
                                    Text(
                                      'Quantity: 2 units',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 12,
                                        color: gray500,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),

                          // Shipping Details
                          Container(
                            padding: const EdgeInsets.only(top: 16),
                            decoration: BoxDecoration(
                              border: Border(top: BorderSide(color: gray100)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'SHIPPING DETAILS',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: gray500,
                                    letterSpacing: 1,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            'COURIER NAME',
                                            style: GoogleFonts.plusJakartaSans(
                                              fontSize: 10,
                                              color: gray400,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Container(
                                            decoration: BoxDecoration(
                                              color: backgroundLight,
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            child: TextField(
                                              decoration: InputDecoration(
                                                hintText: 'e.g. FedEx',
                                                hintStyle: GoogleFonts.plusJakartaSans(
                                                  fontSize: 14,
                                                  color: gray400,
                                                ),
                                                border: InputBorder.none,
                                                contentPadding: const EdgeInsets.all(8),
                                              ),
                                              style: GoogleFonts.plusJakartaSans(fontSize: 14),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            'TRACKING ID',
                                            style: GoogleFonts.plusJakartaSans(
                                              fontSize: 10,
                                              color: gray400,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Container(
                                            decoration: BoxDecoration(
                                              color: backgroundLight,
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            child: TextField(
                                              decoration: InputDecoration(
                                                hintText: 'TRK-00219',
                                                hintStyle: GoogleFonts.plusJakartaSans(
                                                  fontSize: 14,
                                                  color: gray400,
                                                ),
                                                border: InputBorder.none,
                                                contentPadding: const EdgeInsets.all(8),
                                              ),
                                              style: GoogleFonts.plusJakartaSans(fontSize: 14),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                SizedBox(
                                  width: double.infinity,
                                  height: 40,
                                  child: ElevatedButton.icon(
                                    onPressed: () {},
                                    icon: const Icon(Icons.local_shipping, size: 16),
                                    label: Text(
                                      'Mark as Dispatched',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: primary,
                                      foregroundColor: Colors.white,
                                      elevation: 4,
                                      shadowColor: primary.withOpacity(0.2),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(8),
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

                  // Other Pending Header
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                    child: Text(
                      'Other Pending',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: gray900,
                        letterSpacing: -0.015 * 18,
                      ),
                    ),
                  ),

                  // Order Card 2
                  _buildOrderCard(
                    orderId: 'Order #AG-8794',
                    buyer: 'Buyer: Midwest Grain Co.',
                    product: 'Plow Attachment (4 units)',
                    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCIE3HcbUab0uNj9Q7QW0KzM1YdrXunIjNBvHibjnWcZMcgrTZgKlpWtxga90IKQS3Cwidh-ooyNjkKtzapX8NsS0uCKMuZjt6YEZ0fj0vWIbEjYLh79thAmmypr-WbnnmGQbm2LNfsWzzZTNUo6Iih5DYgQkLxA96yfQGPEQ12NcR2LJGzaRIokpNwIH1ZQ7vVG7aZvYWwJ2KVOIc2IBHPvH1i5yqTwkyLiFu554_jN4Y-BJeMbmLEAuFYLHP6KeErC31kk1ICD61k',
                  ),
                  const SizedBox(height: 16),

                  // Order Card 3
                  _buildOrderCard(
                    orderId: 'Order #AG-8762',
                    buyer: 'Buyer: Green Valley Coop',
                    product: 'Irrigation Pump P40 (1 unit)',
                    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUWQPOfeaLnBVBQNJz_uzNTcNLkO6a_HZRdgkRPsOBg9pk8uX22HYcdMEf_nNKy1OAflwkwzHkWsmqTxbFSCsqs4Ve1oFq47N8ziVkFyWFT37oyx0ZCUEfQQMxBzuS3mmqcMBCITndTs8Wn1SaZAFw9S93gsZRW6ABDMCJ-oKyF0fV684Na4QBQjVzIz1gU2rPggPsC79hS6Xsm04J3s0TeYgMuGR4wTg_3wVJSwhPgvoGqDywX-Gg2r_yRLclHzUu9hxhzjbgcJ49',
                  ),
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
          border: Border(top: BorderSide(color: gray200)),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildNavItem(Icons.dashboard, 'Home', 0, false),
                _buildNavItem(Icons.local_shipping, 'Dispatch', 1, true),
                _buildNavItem(Icons.analytics, 'Stats', 2, false),
                _buildNavItem(Icons.settings, 'Settings', 3, false),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildOrderCard({
    required String orderId,
    required String buyer,
    required String product,
    required String imageUrl,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: gray100),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 4,
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              flex: 2,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: green100,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      'PAID',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: green700,
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    orderId,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: gray900,
                    ),
                  ),
                  Text(
                    buyer,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 14,
                      color: gray500,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.inventory_2, size: 14, color: gray400),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          product,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12,
                            color: Color(0xFF4b5563),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.local_shipping, size: 18, color: primary),
                        const SizedBox(width: 8),
                        Text(
                          'Dispatch',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 16),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: CachedNetworkImage(
                imageUrl: imageUrl,
                width: 96,
                height: 96,
                fit: BoxFit.cover,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem(IconData icon, String label, int index, bool isSelected) {
    return GestureDetector(
      onTap: () => setState(() => _selectedNavIndex = index),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: isSelected ? primary : gray400),
          const SizedBox(height: 4),
          Text(
            label,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 10,
              color: isSelected ? primary : gray400,
            ),
          ),
        ],
      ),
    );
  }
}
