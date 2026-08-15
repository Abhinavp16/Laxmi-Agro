import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../core/services/notification_service.dart';
import '../../core/services/storage_service.dart';

class PermissionsOnboardingScreen extends ConsumerStatefulWidget {
  const PermissionsOnboardingScreen({super.key});

  @override
  ConsumerState<PermissionsOnboardingScreen> createState() =>
      _PermissionsOnboardingScreenState();
}

class _PermissionsOnboardingScreenState
    extends ConsumerState<PermissionsOnboardingScreen> {
  bool _isRequesting = false;

  Future<void> _complete({required bool requestPermissions}) async {
    if (_isRequesting) return;
    setState(() => _isRequesting = true);

    try {
      if (requestPermissions) {
        await ref
            .read(notificationServiceProvider)
            .initialize(requestPermission: true);
        await _requestLocationPermission();
        await _requestPhotoPermission();
      }
      await StorageService.setFirstLaunchComplete();
      if (mounted) context.go('/home');
    } finally {
      if (mounted) setState(() => _isRequesting = false);
    }
  }

  Future<void> _requestLocationPermission() async {
    final current = await Geolocator.checkPermission();
    if (current == LocationPermission.denied) {
      await Geolocator.requestPermission();
    }
  }

  Future<void> _requestPhotoPermission() async {
    // Android's system photo picker used by image_picker does not need broad
    // media-library access. iOS needs a purpose-bound photo-library prompt.
    if (Platform.isIOS) {
      await Permission.photos.request();
    }
  }

  @override
  Widget build(BuildContext context) {
    const primary = Color(0xFF1E40AF);
    const textPrimary = Color(0xFF0F172A);
    const textSecondary = Color(0xFF475569);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 520),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: const Icon(
                      Icons.verified_user_outlined,
                      color: primary,
                      size: 30,
                    ),
                  ),
                  const SizedBox(height: 28),
                  Text(
                    'Set up helpful permissions',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      color: textPrimary,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Laxmi Agro will ask only for permissions used by its features. You can continue without granting them and change your choice later in device settings.',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 15,
                      height: 1.55,
                      color: textSecondary,
                    ),
                  ),
                  const SizedBox(height: 26),
                  const _PermissionBenefit(
                    icon: Icons.notifications_outlined,
                    title: 'Notifications',
                    description:
                        'Receive order, payment, and price-update alerts.',
                  ),
                  const SizedBox(height: 12),
                  const _PermissionBenefit(
                    icon: Icons.location_on_outlined,
                    title: 'Location while using the app',
                    description:
                        'Place a wholesaler shop accurately on the map. You can select a location manually instead.',
                  ),
                  const SizedBox(height: 12),
                  const _PermissionBenefit(
                    icon: Icons.photo_library_outlined,
                    title: 'Photos',
                    description:
                        'Select profile images, business proof, and payment screenshots when you choose to upload them.',
                  ),
                  const SizedBox(height: 30),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: FilledButton(
                      onPressed: _isRequesting
                          ? null
                          : () => _complete(requestPermissions: true),
                      style: FilledButton.styleFrom(
                        backgroundColor: primary,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: _isRequesting
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : Text(
                              'Continue',
                              style: GoogleFonts.plusJakartaSans(
                                fontWeight: FontWeight.w700,
                                fontSize: 16,
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: TextButton(
                      onPressed: _isRequesting
                          ? null
                          : () => _complete(requestPermissions: false),
                      child: Text(
                        'Not now',
                        style: GoogleFonts.plusJakartaSans(
                          fontWeight: FontWeight.w700,
                          color: textSecondary,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Notifications, location, and photo access are optional. Declining them does not prevent unrelated app functions from working.',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 12,
                      height: 1.45,
                      color: textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _PermissionBenefit extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;

  const _PermissionBenefit({
    required this.icon,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: const Color(0xFF1E40AF).withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: const Color(0xFF1E40AF), size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  description,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 13,
                    height: 1.45,
                    color: const Color(0xFF475569),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
