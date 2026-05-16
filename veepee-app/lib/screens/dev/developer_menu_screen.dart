import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// Import all screens
import '../home/marketplace_home_screen.dart';
import '../auth/login_screen.dart';
import '../auth/role_login_screen.dart';
import '../auth/register_screen.dart';
import '../auth/wholesaler_registration_screen.dart';
import '../product/product_negotiation_screen.dart';
import '../product/power_tiller_detail_screen.dart';
import '../product/product_detail_video_screen.dart';
import '../product/wholesale_detail_screen.dart';
import '../product/edit_product_screen.dart';
import '../product/add_product_screen.dart';
import '../negotiations/counter_offer_screen.dart';
import '../negotiations/negotiations_tracker_screen.dart';
import '../negotiations/pending_negotiations_screen.dart';
import '../negotiations/negotiation_success_screen.dart';
import '../inventory/inventory_management_screen.dart';
import '../admin/analytics_dashboard_screen.dart';
import '../admin/payment_verification_screen.dart';
import '../orders/dispatch_management_screen.dart';
import '../orders/order_success_screen.dart';
import '../orders/shipment_tracking_screen.dart';
import '../cart/shopping_cart_screen.dart';
import '../payment/upi_payment_screen.dart';
import '../profile/wholesaler_profile_screen.dart';
import '../help/help_support_screen.dart';
import '../help/negotiation_guide_screen.dart';
import '../notifications/notifications_center_screen.dart';

class DeveloperMenuScreen extends StatelessWidget {
  const DeveloperMenuScreen({super.key});

  static const Color primary = Color(0xFF135bec);
  static const Color backgroundLight = Color(0xFFf6f6f8);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundLight,
      appBar: AppBar(
        title: Text(
          'Developer Menu',
          style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700),
        ),
        backgroundColor: primary,
        foregroundColor: Colors.white,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildSection('Authentication', [
            _ScreenItem('Login Screen', const LoginScreen()),
            _ScreenItem('Role Login Screen', const RoleLoginScreen()),
            _ScreenItem('Register Screen', const RegisterScreen()),
            _ScreenItem('Wholesaler Registration', const WholesalerRegistrationScreen()),
          ], context),

          _buildSection('Home & Marketplace', [
            _ScreenItem('Home Screen', const MarketplaceHomeScreen()),
          ], context),

          _buildSection('Product Screens', [
            _ScreenItem('Product Negotiation', const ProductNegotiationScreen()),
            _ScreenItem('Power Tiller Detail', const PowerTillerDetailScreen()),
            _ScreenItem('Product Detail (Video)', const ProductDetailVideoScreen()),
            _ScreenItem('Wholesale Detail', const WholesaleDetailScreen()),
            _ScreenItem('Edit Product', const EditProductScreen()),
            _ScreenItem('Add New Product', const AddProductScreen()),
          ], context),

          _buildSection('Negotiations', [
            _ScreenItem('Counter Offer', const CounterOfferScreen()),
            _ScreenItem('Negotiations Tracker', const NegotiationsTrackerScreen()),
            _ScreenItem('Pending Negotiations', const PendingNegotiationsScreen()),
            _ScreenItem('Negotiation Success', const NegotiationSuccessScreen()),
          ], context),

          _buildSection('Orders & Shipping', [
            _ScreenItem('Dispatch Management', const DispatchManagementScreen()),
            _ScreenItem('Order Success', const OrderSuccessScreen()),
            _ScreenItem('Shipment Tracking', const ShipmentTrackingScreen(orderId: 'demo')),
          ], context),

          _buildSection('Cart & Payment', [
            _ScreenItem('Shopping Cart', const ShoppingCartScreen()),
            _ScreenItem('UPI Payment', const UpiPaymentScreen()),
          ], context),

          _buildSection('Admin', [
            _ScreenItem('Analytics Dashboard', const AnalyticsDashboardScreen()),
            _ScreenItem('Payment Verification', const PaymentVerificationScreen()),
            _ScreenItem('Inventory Management', const InventoryManagementScreen()),
          ], context),

          _buildSection('Profile & Help', [
            _ScreenItem('Wholesaler Profile', const WholesalerProfileScreen()),
            _ScreenItem('Help & Support', const HelpSupportScreen()),
            _ScreenItem('Negotiation Guide', const NegotiationGuideScreen()),
            _ScreenItem('Notifications Center', const NotificationsCenterScreen()),
          ], context),

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildSection(String title, List<_ScreenItem> items, BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Text(
            title.toUpperCase(),
            style: GoogleFonts.plusJakartaSans(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: Colors.grey[600],
              letterSpacing: 1,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 8,
              ),
            ],
          ),
          child: Column(
            children: items.asMap().entries.map((entry) {
              final index = entry.key;
              final item = entry.value;
              return Column(
                children: [
                  ListTile(
                    title: Text(
                      item.name,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    trailing: const Icon(Icons.chevron_right, color: Colors.grey),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => item.screen),
                      );
                    },
                  ),
                  if (index < items.length - 1)
                    Divider(height: 1, indent: 16, endIndent: 16, color: Colors.grey[200]),
                ],
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}

class _ScreenItem {
  final String name;
  final Widget screen;

  _ScreenItem(this.name, this.screen);
}
