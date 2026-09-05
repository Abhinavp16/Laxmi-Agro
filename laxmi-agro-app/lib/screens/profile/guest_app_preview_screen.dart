import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hugeicons/hugeicons.dart';

import '../../core/providers/guest_mode_provider.dart';
import '../home/marketplace_home_screen.dart';

class GuestAppPreviewScreen extends ConsumerWidget {
  const GuestAppPreviewScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Enable guest mode when entering this screen
    ref.read(guestModeProvider.notifier).enableGuestMode();

    return WillPopScope(
      onWillPop: () async {
        // Disable guest mode when leaving this screen
        if (context.mounted) {
          ref.read(guestModeProvider.notifier).disableGuestMode();
        }
        return true;
      },
      child: Scaffold(
        backgroundColor: Colors.white,
        body: Stack(
          children: [
            // Main app content in guest mode
            const MarketplaceHomeScreen(),
            // Guest mode header banner
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: _GuestModeBanner(
                onClose: () {
                  ref.read(guestModeProvider.notifier).disableGuestMode();
                  context.pop();
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GuestModeBanner extends StatelessWidget {
  final VoidCallback onClose;

  const _GuestModeBanner({required this.onClose});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: const Color(0xFF1E40AF), // Primary blue
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 12,
        bottom: 12,
        left: 16,
        right: 16,
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(6),
            ),
            child: const HugeIcon(
              icon: HugeIcons.strokeRoundedUser,
              color: Colors.white,
              size: 18,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Viewing as Customer',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                Text(
                  'You\'re seeing what customers see',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 11,
                    color: Colors.white.withValues(alpha: 0.85),
                  ),
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: onClose,
            child: Container(
              padding: const EdgeInsets.all(6),
              child: const HugeIcon(
                icon: HugeIcons.strokeRoundedCancel01,
                color: Colors.white,
                size: 18,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
