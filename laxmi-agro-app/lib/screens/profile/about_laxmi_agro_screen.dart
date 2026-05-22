import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AboutLaxmiAgroScreen extends StatelessWidget {
  const AboutLaxmiAgroScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('About Laxmi Agro')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(18),
              gradient: const LinearGradient(
                colors: [Color(0xFF4F46E5), Color(0xFF2563EB)],
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    width: 52,
                    height: 52,
                    color: Colors.white.withOpacity(0.16),
                    child: const Icon(
                      Icons.agriculture_rounded,
                      color: Colors.white,
                      size: 28,
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  'Laxmi Agro',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Agriculture supply platform for retailers, dealers, and wholesalers',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 13,
                    color: Colors.white.withOpacity(0.95),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Text(
            'Laxmi Agro, operated through Ashirvad Marketing, supports retailers, wholesalers, and buyers with pumps, submersible cables, GI pipes, PVC column pipes, sprinkler sets, and related agriculture supply items. '
            'You can discover products, place orders, negotiate bulk deals, and manage delivery from one app.',
            style: GoogleFonts.plusJakartaSans(fontSize: 14, height: 1.6),
          ),
          const SizedBox(height: 16),
          Text(
            'What you can do',
            style: GoogleFonts.plusJakartaSans(
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          _featureTile(Icons.verified_outlined, 'Practical catalogue across cable, pipes, irrigation, and pump categories'),
          _featureTile(Icons.location_on_outlined, 'Raipur-based sales and dispatch coordination'),
          _featureTile(Icons.local_offer_outlined, 'Dealer and bulk order support'),
          _featureTile(Icons.support_agent_outlined, 'Direct contact with the business support team'),
        ],
      ),
    );
  }

  Widget _featureTile(IconData icon, String text) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 18,
            backgroundColor: const Color(0xFFEFF6FF),
            child: Icon(icon, color: const Color(0xFF2563EB), size: 18),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(text, style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}
