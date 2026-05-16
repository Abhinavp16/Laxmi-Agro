import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:google_fonts/google_fonts.dart';

class InventoryManagementScreen extends StatefulWidget {
  const InventoryManagementScreen({super.key});

  @override
  State<InventoryManagementScreen> createState() => _InventoryManagementScreenState();
}

class _InventoryManagementScreenState extends State<InventoryManagementScreen> {
  int _selectedTab = 0;
  int _selectedNavIndex = 0;

  // Colors from design
  static const Color primary = Color(0xFF135bec);
  static const Color backgroundLight = Color(0xFFf6f6f8);
  static const Color textDark = Color(0xFF0d121b);
  static const Color textSecondary = Color(0xFF4c669a);
  static const Color borderColor = Color(0xFFcfd7e7);
  static const Color green500 = Color(0xFF22c55e);
  static const Color green600 = Color(0xFF16a34a);
  static const Color orange500 = Color(0xFFf97316);
  static const Color orange600 = Color(0xFFea580c);
  static const Color orange700 = Color(0xFFc2410c);
  static const Color orange100 = Color(0xFFffedd5);
  static const Color orange50 = Color(0xFFfff7ed);
  static const Color red500 = Color(0xFFef4444);
  static const Color red600 = Color(0xFFdc2626);

  final List<String> _tabs = ['All Items', 'In Stock', 'Low Stock', 'Out of Stock'];

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
                      child: Icon(Icons.menu, color: textDark),
                    ),
                    Expanded(
                      child: Text(
                        'Inventory Management',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: textDark,
                          letterSpacing: -0.015 * 18,
                        ),
                      ),
                    ),
                    Stack(
                      children: [
                        const SizedBox(
                          width: 48,
                          height: 48,
                          child: Icon(Icons.notifications, color: textDark),
                        ),
                        Positioned(
                          top: 8,
                          right: 8,
                          child: Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: red500,
                              shape: BoxShape.circle,
                            ),
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
              child: Column(
                children: [
                  // Analytics Quick Glance
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Expanded(
                          child: _buildStatCard(
                            'Total Value',
                            '\$4.2M',
                            Icons.trending_up,
                            '12% vs last month',
                            green500,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildStatCard(
                            'Demand Alert',
                            '5 Items',
                            Icons.warning,
                            'Restock suggested',
                            orange500,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Search Bar
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: Container(
                      height: 48,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: borderColor),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.02),
                            blurRadius: 4,
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          const SizedBox(width: 16),
                          Icon(Icons.search, color: textSecondary),
                          const SizedBox(width: 8),
                          Expanded(
                            child: TextField(
                              decoration: InputDecoration(
                                hintText: 'Search machines (e.g. Tractors, Harvesters)',
                                hintStyle: GoogleFonts.plusJakartaSans(
                                  color: textSecondary,
                                  fontSize: 16,
                                ),
                                border: InputBorder.none,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Tabs
                  Container(
                    decoration: BoxDecoration(
                      border: Border(bottom: BorderSide(color: borderColor)),
                    ),
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Row(
                        children: List.generate(_tabs.length, (index) {
                          final isSelected = _selectedTab == index;
                          return GestureDetector(
                            onTap: () => setState(() => _selectedTab = index),
                            child: Container(
                              padding: const EdgeInsets.only(top: 16, bottom: 13, right: 24),
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
                                  color: isSelected ? primary : textSecondary,
                                  letterSpacing: 0.015 * 14,
                                ),
                              ),
                            ),
                          );
                        }),
                      ),
                    ),
                  ),

                  // Inventory List
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: borderColor),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.02),
                            blurRadius: 4,
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          _buildInventoryItem(
                            imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCXbK0yY9hH2sc5kOsLb9HtM0wkDF-0PicSV7WmFrq9OEoJD7bk8XZ9ywE5Zc9Mq1gMEH36Fq2Aro-Zg5ic2Qoty-es6o6mJSH_5khapcctRAv8dyY6NISBjB0e5uSl-lY4MJA5l2uUkjYkjWWqGmyhU_jRcFJUwjEylI3FOKQynPkCINw6O0n98einV7h7omPnmqRbrsTxdk3XwrYfr9_WF5dSjSbqdLgWe0hugMKaStc6AqMXr-17x4f1GbMkk7z-I8iAAqgFRK5U',
                            name: 'Kubota M7 Series',
                            status: 'Low Stock',
                            statusColor: orange600,
                            stock: '2 units',
                            price: '\$110,000 avg',
                            badge: 'Restock Recommended',
                            badgeColor: orange100,
                            badgeTextColor: orange700,
                            showBadgeIcon: true,
                            backgroundColor: orange50.withOpacity(0.3),
                            showBorder: true,
                          ),
                          _buildInventoryItem(
                            imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCYEMdeBmOnSSvENWvRhvMJMQkLrqd8cX9LPxrbaXmBz1FxDXRK6BBtnGLYHPY8Wa6211LzJkWaUNXsJQw2yLfuZtTJl925IcSAX3h1BRtEP0dX_cAnqCGEG5jb7J5BBtLn7fbXt3xN7xSNN6NnIRZTv5V2gwqatGjglZkYZ4RbNlBfh8v0B3foy-gqkdH2Aolse9sxsJmKVJ13E1IdNc9eJ6bDMhGECB9ipuwRYcedNUbqpv9V_irJT4lVld-ueEi2QJgHYWSauZen',
                            name: 'New Holland CR10.90',
                            status: 'In Stock',
                            statusColor: green600,
                            stock: '8 units',
                            price: '\$650,000 avg',
                            showBorder: true,
                          ),
                          _buildInventoryItem(
                            imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCcxfkkJHOIV-QKMWisyG0j4zZ7yiBb0TvxrOAE4IBAeTE-YxNCsODlIkmntgAzO7ns76QWv_QYgm2eCtTM4gj2qhXy2CAM3ipGssiKC1E5o7SQs7i2zZjHIO-vWsl2bfqhs2mekhI5Aj_e0D0PCTsk8Mw0fy7RL26CDpX3kJaicxN0lJC8aTvWyO-rlxAaOv4UL6XoqIDiF6jA0XjeOlYT73vAiSgrBWxwGRG07yIw9K1txrrkE6fCTkdbJrhdrhVcOfq71PHf73-k',
                            name: 'Case IH Steiger 620',
                            status: 'Out of Stock',
                            statusColor: red600,
                            stock: '0 units',
                            price: '\$580,000 avg',
                            isGrayscale: true,
                            opacity: 0.75,
                            showBorder: true,
                          ),
                          _buildInventoryItem(
                            imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBdnAkgZ3Y0C6b0n_rZyegRQbYj8ZinNflezk4j5H2wNrt6xZMxl7kMDEZFAexSHhmy0kDSoAx3LXJQUGf4SLNZrS28jVxcGRVp545IDLbo3RGf2GUBBwrlkYlg1ArVYNVnzN_N-1AGQ9Xbzr1CG-s2uVq31FXVos6bCJi_3HpnNHG8VF6wR31CoTaSgwkuU8xctCHist57ObRz56iVCIDCYCzU7eRED76bweJYOJuAXN1Tk0lBMNlVgaTsu114JYr-gJElkjfMwkR5',
                            name: 'John Deere 8R 410',
                            status: 'In Stock',
                            statusColor: green600,
                            stock: '12 units',
                            price: '\$420,000 avg',
                            badge: 'Trending',
                            badgeColor: primary.withOpacity(0.2),
                            badgeTextColor: primary,
                            backgroundColor: primary.withOpacity(0.05),
                            showBorder: false,
                          ),
                        ],
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

      // Floating Action Button
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        backgroundColor: primary,
        child: const Icon(Icons.add, color: Colors.white, size: 30),
      ),

      // Bottom Navigation
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: borderColor)),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildNavItem(Icons.inventory_2, 'Inventory', 0, true),
                _buildNavItem(Icons.analytics, 'Demand', 1, false),
                _buildNavItem(Icons.shopping_cart, 'Orders', 2, false),
                _buildNavItem(Icons.settings, 'Settings', 3, false),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, String subtitle, Color subtitleColor) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
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
            label.toUpperCase(),
            style: GoogleFonts.plusJakartaSans(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: textSecondary,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: textDark,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Icon(icon, size: 14, color: subtitleColor),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  subtitle,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 12,
                    color: subtitleColor,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInventoryItem({
    required String imageUrl,
    required String name,
    required String status,
    required Color statusColor,
    required String stock,
    required String price,
    String? badge,
    Color? badgeColor,
    Color? badgeTextColor,
    bool showBadgeIcon = false,
    Color? backgroundColor,
    bool isGrayscale = false,
    double opacity = 1.0,
    required bool showBorder,
  }) {
    return Opacity(
      opacity: opacity,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: backgroundColor ?? Colors.transparent,
          border: showBorder ? Border(bottom: BorderSide(color: borderColor)) : null,
        ),
        child: Row(
          children: [
            // Image
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: ColorFiltered(
                colorFilter: isGrayscale
                    ? const ColorFilter.mode(Colors.grey, BlendMode.saturation)
                    : const ColorFilter.mode(Colors.transparent, BlendMode.multiply),
                child: CachedNetworkImage(
                  imageUrl: imageUrl,
                  width: 70,
                  height: 70,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(
                    width: 70,
                    height: 70,
                    color: borderColor,
                  ),
                  errorWidget: (context, url, error) => Container(
                    width: 70,
                    height: 70,
                    color: borderColor,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),

            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          name,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: textDark,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (badge != null) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: badgeColor,
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (showBadgeIcon) ...[
                                Icon(Icons.trending_up, size: 12, color: badgeTextColor),
                                const SizedBox(width: 4),
                              ],
                              Text(
                                badge.toUpperCase(),
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: badgeTextColor,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Status: $status',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: statusColor,
                    ),
                  ),
                  Text(
                    'Stock: $stock | $price',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 12,
                      color: textSecondary,
                    ),
                  ),
                ],
              ),
            ),

            // Edit Button
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Color(0xFFe7ebf3),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: borderColor),
              ),
              child: Text(
                'Edit',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: textDark,
                ),
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
          Icon(icon, color: isSelected ? primary : textSecondary, size: 24),
          const SizedBox(height: 4),
          Text(
            label,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 10,
              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              color: isSelected ? primary : textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
