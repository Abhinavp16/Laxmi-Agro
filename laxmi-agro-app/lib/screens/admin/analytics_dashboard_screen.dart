import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AnalyticsDashboardScreen extends StatefulWidget {
  const AnalyticsDashboardScreen({super.key});

  @override
  State<AnalyticsDashboardScreen> createState() =>
      _AnalyticsDashboardScreenState();
}

class _AnalyticsDashboardScreenState extends State<AnalyticsDashboardScreen> {
  int _selectedNavIndex = 0;
  // Colors from design
  static const Color primary = Color(0xFF135bec);
  static const Color backgroundLight = Color(0xFFf6f6f8);
  static const Color textDark = Color(0xFF0d121b);
  static const Color gray200 = Color(0xFFe5e7eb);
  static const Color gray400 = Color(0xFF9ca3af);
  static const Color gray500 = Color(0xFF6b7280);
  static const Color green600 = Color(0xFF07883b);
  static const Color red500 = Color(0xFFef4444);
  static const Color red600 = Color(0xFFe73908);
  static const Color orange50 = Color(0xFFfff7ed);
  static const Color orange100 = Color(0xFFffedd5);
  static const Color orange200 = Color(0xFFfed7aa);
  static const Color orange600 = Color(0xFFea580c);
  static const Color orange700 = Color(0xFFc2410c);
  static const Color orange900 = Color(0xFF7c2d12);
  static const Color red50 = Color(0xFFfef2f2);
  static const Color red100 = Color(0xFFfee2e2);
  static const Color red200 = Color(0xFFfecaca);
  static const Color red700 = Color(0xFFb91c1c);
  static const Color red900 = Color(0xFF7f1d1d);
  static const Color blue50 = Color(0xFFeff6ff);
  static const Color blue100 = Color(0xFFdbeafe);
  static const Color blue200 = Color(0xFFbfdbfe);
  static const Color blue600 = Color(0xFF2563eb);
  static const Color blue700 = Color(0xFF1d4ed8);
  static const Color blue900 = Color(0xFF1e3a8a);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundLight,
      body: Column(
        children: [
          // Header
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
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(Icons.menu, color: textDark),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'Admin Dashboard',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: textDark,
                        letterSpacing: -0.015 * 18,
                      ),
                    ),
                    const Spacer(),
                    SizedBox(
                      width: 40,
                      height: 40,
                      child: Icon(Icons.search, color: textDark),
                    ),
                    Stack(
                      children: [
                        SizedBox(
                          width: 40,
                          height: 40,
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
              padding: const EdgeInsets.only(bottom: 100),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Stats Cards
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Wrap(
                      spacing: 16,
                      runSpacing: 16,
                      children: [
                        _buildStatCard(
                          'Total Revenue',
                          '\$4.2M',
                          Icons.payments,
                          '+12%',
                          green600,
                          true,
                        ),
                        _buildStatCard(
                          'Active Deals',
                          '124',
                          Icons.handshake,
                          '+5%',
                          green600,
                          true,
                        ),
                        _buildStatCard(
                          'Pending',
                          '18',
                          Icons.verified_user,
                          '-2%',
                          red600,
                          false,
                        ),
                      ],
                    ),
                  ),

                  // Demand Intelligence Header
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                    child: Text(
                      'Demand Intelligence',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: textDark,
                        letterSpacing: -0.015 * 22,
                      ),
                    ),
                  ),

                  // Chart Card
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    child: Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: gray200),
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
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Views vs. Stock Levels',
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500,
                                      color: gray500,
                                    ),
                                  ),
                                  Text(
                                    '850 avg views',
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 28,
                                      fontWeight: FontWeight.w700,
                                      color: textDark,
                                      letterSpacing: -0.5,
                                    ),
                                  ),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: primary.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  'LIVE',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: primary,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Text(
                                'Last 30 days',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 14,
                                  color: gray500,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                '+15%',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                  color: green600,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),

                          // Bar Chart
                          SizedBox(
                            height: 200,
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                _buildChartBar('TRACTORS', 0.9),
                                _buildChartBar('HARVESTERS', 0.65),
                                _buildChartBar('PLOWS', 1.0),
                                _buildChartBar('SEEDERS', 0.8),
                                _buildChartBar('BALERS', 0.3),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Critical Alerts Header
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
                    child: Text(
                      'Critical Alerts',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: textDark,
                        letterSpacing: -0.015 * 22,
                      ),
                    ),
                  ),

                  // Alert Cards
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    child: Column(
                      children: [
                        _buildAlertCard(
                          icon: Icons.inventory_2,
                          iconBgColor: orange100,
                          iconColor: orange600,
                          bgColor: orange50,
                          borderColor: orange200,
                          title: 'Deutz-Fahr 6 Series',
                          titleColor: orange900,
                          subtitle: 'Stock Level: ',
                          subtitleValue: '0',
                          subtitleSuffix: ' | Negotiation High',
                          subtitleColor: orange700,
                          buttonText: 'RESTOCK',
                          buttonColor: orange600,
                        ),
                        const SizedBox(height: 12),
                        _buildAlertCard(
                          icon: Icons.report,
                          iconBgColor: red100,
                          iconColor: red600,
                          bgColor: red50,
                          borderColor: red200,
                          title: 'John Deere S780',
                          titleColor: red900,
                          subtitle: 'High Demand: ',
                          subtitleValue: '42 Leads',
                          subtitleSuffix: ' | Stock Out',
                          subtitleColor: red700,
                          buttonText: 'RESTOCK',
                          buttonColor: red600,
                        ),
                        const SizedBox(height: 12),
                        _buildAlertCard(
                          icon: Icons.info,
                          iconBgColor: blue100,
                          iconColor: blue600,
                          bgColor: blue50,
                          borderColor: blue200,
                          title: 'CLAAS Lexion 8000',
                          titleColor: blue900,
                          subtitle: 'Inventory Low: ',
                          subtitleValue: '2 units',
                          subtitleSuffix: ' remaining',
                          subtitleColor: blue700,
                          buttonText: 'ORDER',
                          buttonColor: blue600,
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

      // Bottom Navigation
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: gray200)),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(Icons.dashboard, 'Dashboard', 0, true),
                _buildNavItem(Icons.inventory, 'Inventory', 1, false),
                _buildNavItem(Icons.shopping_cart, 'Orders', 2, false),
                _buildNavItem(Icons.analytics, 'Analytics', 3, false),
                _buildNavItem(Icons.settings, 'Settings', 4, false),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(
    String label,
    String value,
    IconData icon,
    String change,
    Color changeColor,
    bool isUp,
  ) {
    return Container(
      width: (MediaQuery.of(context).size.width - 48) / 2,
      constraints: const BoxConstraints(minWidth: 158),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: gray200),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  label.toUpperCase(),
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: gray500,
                    letterSpacing: 1,
                  ),
                ),
              ),
              Icon(icon, color: primary),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 24,
              fontWeight: FontWeight.w700,
              color: textDark,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(
                isUp ? Icons.trending_up : Icons.trending_down,
                size: 14,
                color: changeColor,
              ),
              const SizedBox(width: 4),
              Text(
                change,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: changeColor,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildChartBar(String label, double height) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            Expanded(
              child: Align(
                alignment: Alignment.bottomCenter,
                child: FractionallySizedBox(
                  heightFactor: height,
                  child: Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: primary.withOpacity(0.2),
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(4),
                      ),
                      border: Border(top: BorderSide(color: primary, width: 2)),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: gray500,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAlertCard({
    required IconData icon,
    required Color iconBgColor,
    required Color iconColor,
    required Color bgColor,
    required Color borderColor,
    required String title,
    required Color titleColor,
    required String subtitle,
    required String subtitleValue,
    required String subtitleSuffix,
    required Color subtitleColor,
    required String buttonText,
    required Color buttonColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: iconBgColor,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: iconColor),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: titleColor,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                RichText(
                  text: TextSpan(
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 12,
                      color: subtitleColor,
                    ),
                    children: [
                      TextSpan(text: subtitle),
                      TextSpan(
                        text: subtitleValue,
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      TextSpan(text: subtitleSuffix),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(
              backgroundColor: buttonColor,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: Text(
              buttonText,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem(
    IconData icon,
    String label,
    int index,
    bool isSelected,
  ) {
    return GestureDetector(
      onTap: () => setState(() => _selectedNavIndex = index),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: isSelected ? primary : gray400, size: 24),
          const SizedBox(height: 4),
          Text(
            label,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 10,
              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              color: isSelected ? primary : gray400,
            ),
          ),
        ],
      ),
    );
  }
}
