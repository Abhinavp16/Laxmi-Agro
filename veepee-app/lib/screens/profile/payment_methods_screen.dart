import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class PaymentMethodsScreen extends StatelessWidget {
  const PaymentMethodsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Payment Methods')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              gradient: const LinearGradient(
                colors: [Color(0xFF16A34A), Color(0xFF15803D)],
              ),
            ),
            child: Text(
              'Fast, secure checkout with your preferred payment mode.',
              style: GoogleFonts.plusJakartaSans(
                color: Colors.white,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(height: 12),
          _paymentCard(
            icon: Icons.account_balance_wallet_outlined,
            title: 'UPI',
            subtitle: 'Use UPI apps at checkout',
            badge: 'Instant',
          ),
          _paymentCard(
            icon: Icons.credit_card_outlined,
            title: 'Cards',
            subtitle: 'Credit and debit cards',
            badge: 'Secure',
          ),
          _paymentCard(
            icon: Icons.payments_outlined,
            title: 'Cash on Delivery',
            subtitle: 'Available for eligible orders',
            badge: 'Eligible Orders',
          ),
        ],
      ),
    );
  }

  Widget _paymentCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required String badge,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        leading: CircleAvatar(
          backgroundColor: const Color(0xFFF3F4F6),
          child: Icon(icon, color: const Color(0xFF111827)),
        ),
        title: Text(title, style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700)),
        subtitle: Text(subtitle, style: GoogleFonts.plusJakartaSans(fontSize: 12)),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            color: const Color(0xFFEEF2FF),
          ),
          child: Text(
            badge,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 11,
              color: const Color(0xFF3730A3),
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ),
    );
  }
}
