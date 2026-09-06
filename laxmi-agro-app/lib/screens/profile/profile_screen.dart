import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hugeicons/hugeicons.dart';

import '../../core/models/user_model.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/theme/app_theme.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final profileName = user?.name.trim().isNotEmpty == true
        ? user!.name.trim()
        : 'Account';
    final status = _accountStatus(user);

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: const HugeIcon(
            icon: HugeIcons.strokeRoundedArrowLeft01,
            color: AppColors.textPrimary,
            size: 24,
          ),
          tooltip: 'Back',
        ),
        title: Text(
          'My Account',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            onPressed: () => context.push('/edit-profile'),
            icon: const HugeIcon(
              icon: HugeIcons.strokeRoundedPencilEdit01,
              color: AppColors.textPrimary,
              size: 22,
            ),
            tooltip: 'Edit profile',
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            Container(
              width: double.infinity,
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 28),
              child: Column(
                children: [
                  _Avatar(user: user, name: profileName),
                  const SizedBox(height: 16),
                  Text(
                    profileName,
                    textAlign: TextAlign.center,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  if ((user?.phone?.trim().isNotEmpty ?? false) ||
                      (user?.email.trim().isNotEmpty ?? false)) ...[
                    const SizedBox(height: 4),
                    Text(
                      user?.phone?.trim().isNotEmpty == true
                          ? user!.phone!.trim()
                          : user?.email.trim() ?? '',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  _StatusBadge(status: status),
                ],
              ),
            ),
            const SizedBox(height: 8),
            _Section(
              title: 'ACCOUNT',
              children: [
                _MenuItem(
                  icon: HugeIcons.strokeRoundedUserEdit01,
                  title: 'Edit Profile',
                  subtitle: 'Update your account information',
                  onTap: () => context.push('/edit-profile'),
                ),
                _MenuItem(
                  icon: HugeIcons.strokeRoundedLocation01,
                  title: 'Addresses',
                  subtitle: 'Manage delivery addresses',
                  onTap: () => context.push('/addresses'),
                ),
                if (user?.businessInfo?.verified != true)
                  _MenuItem(
                    icon: HugeIcons.strokeRoundedStore01,
                    title: _wholesalerActionTitle(user),
                    subtitle: _wholesalerActionSubtitle(user),
                    onTap: () => context.push('/convert-to-wholesaler'),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            _Section(
              title: 'ACTIVITY',
              children: [
                _MenuItem(
                  icon: HugeIcons.strokeRoundedShoppingBag01,
                  title: 'Previous Orders',
                  subtitle: 'View order history and status',
                  onTap: () => context.push('/previous-orders'),
                ),
                _MenuItem(
                  icon: HugeIcons.strokeRoundedHandGrip,
                  title: 'Negotiations',
                  subtitle: 'View your price negotiations',
                  onTap: () => context.push('/negotiations'),
                ),
                if (user?.isWholesaler == true)
                  _MenuItem(
                    icon: HugeIcons.strokeRoundedPackage,
                    title: 'Add Product',
                    subtitle: 'Create a product listing',
                    onTap: () => context.push('/add-product'),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            // Show View Customer App only for wholesalers
            if (user?.isWholesaler == true)
              _Section(
                title: 'WHOLESALE',
                children: [
                  _MenuItem(
                    icon: HugeIcons.strokeRoundedShoppingCart01,
                    title: 'View Customer App',
                    subtitle: 'See what customers see',
                    onTap: () => context.push('/guest-app-preview'),
                  ),
                ],
              ),
            const SizedBox(height: 8),
            _Section(
              title: 'SUPPORT & LEGAL',
              children: [
                _MenuItem(
                  icon: HugeIcons.strokeRoundedHelpCircle,
                  title: 'Help & Support',
                  subtitle: 'FAQs and contact information',
                  onTap: () => context.push('/help'),
                ),
                _MenuItem(
                  icon: HugeIcons.strokeRoundedShield01,
                  title: 'Privacy Policy',
                  subtitle: 'How we collect and use data',
                  onTap: () => context.push('/legal/privacy-policy'),
                ),
                _MenuItem(
                  icon: HugeIcons.strokeRoundedFile01,
                  title: 'Terms & Conditions',
                  subtitle: 'Terms of use',
                  onTap: () => context.push('/legal/terms-conditions'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Container(
              color: Colors.white,
              child: _MenuItem(
                icon: HugeIcons.strokeRoundedLogout01,
                title: 'Sign Out',
                subtitle: 'Log out of your account',
                iconColor: AppColors.error,
                titleColor: AppColors.error,
                onTap: () async {
                  await ref.read(authProvider.notifier).logout();
                  if (context.mounted) context.go('/login');
                },
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  _ProfileStatus _accountStatus(UserModel? user) {
    final businessInfo = user?.businessInfo;
    if (user?.isWholesaler == true && businessInfo?.verified == true) {
      return const _ProfileStatus(
        label: 'Verified wholesaler',
        color: AppColors.success,
        icon: HugeIcons.strokeRoundedCheckmarkCircle01,
      );
    }
    if (businessInfo?.status == 'pending') {
      return const _ProfileStatus(
        label: 'Wholesaler application pending',
        color: Color(0xFFD97706),
        icon: HugeIcons.strokeRoundedTime02,
      );
    }
    if (businessInfo?.status == 'rejected') {
      return const _ProfileStatus(
        label: 'Wholesaler application needs attention',
        color: AppColors.error,
        icon: HugeIcons.strokeRoundedAlert02,
      );
    }
    if (user?.isWholesaler == true) {
      return const _ProfileStatus(
        label: 'Wholesaler verification required',
        color: Color(0xFFD97706),
        icon: HugeIcons.strokeRoundedAlert02,
      );
    }
    return const _ProfileStatus(
      label: 'Customer account',
      color: AppColors.primary,
      icon: HugeIcons.strokeRoundedUser,
    );
  }

  String _wholesalerActionTitle(UserModel? user) {
    if (user?.businessInfo?.status == 'pending') {
      return 'Wholesaler Application';
    }
    return user?.isWholesaler == true
        ? 'Complete Wholesaler Verification'
        : 'Become a Wholesaler';
  }

  String _wholesalerActionSubtitle(UserModel? user) {
    if (user?.businessInfo?.status == 'pending') {
      return 'View your application status';
    }
    return user?.isWholesaler == true
        ? 'Submit business proof for admin review'
        : 'Submit business details for verification';
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({required this.user, required this.name});

  final UserModel? user;
  final String name;

  @override
  Widget build(BuildContext context) {
    final avatarUrl = user?.avatar?.trim() ?? '';
    return Container(
      width: 100,
      height: 100,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: AppColors.primary.withValues(alpha: 0.1),
        border: Border.all(color: AppColors.primary, width: 3),
      ),
      clipBehavior: Clip.antiAlias,
      child: avatarUrl.isNotEmpty
          ? Image.network(
              avatarUrl,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => _Initials(name: name),
            )
          : _Initials(name: name),
    );
  }
}

class _Initials extends StatelessWidget {
  const _Initials({required this.name});

  final String name;

  @override
  Widget build(BuildContext context) {
    final parts = name
        .trim()
        .split(RegExp(r'\s+'))
        .where((part) => part.isNotEmpty);
    final initials = parts.take(2).map((part) => part[0]).join().toUpperCase();
    return Center(
      child: Text(
        initials.isEmpty ? 'A' : initials,
        style: GoogleFonts.plusJakartaSans(
          fontSize: 32,
          fontWeight: FontWeight.w700,
          color: AppColors.primary,
        ),
      ),
    );
  }
}

class _ProfileStatus {
  const _ProfileStatus({
    required this.label,
    required this.color,
    required this.icon,
  });

  final String label;
  final Color color;
  final IconData icon;
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});

  final _ProfileStatus status;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: status.color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          HugeIcon(icon: status.icon, size: 15, color: status.color),
          const SizedBox(width: 6),
          Text(
            status.label,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: status.color,
            ),
          ),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text(
              title,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: AppColors.textSecondary,
                letterSpacing: 1,
              ),
            ),
          ),
          ...children,
        ],
      ),
    );
  }
}

class _MenuItem extends StatelessWidget {
  const _MenuItem({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.iconColor,
    this.titleColor,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final Color? iconColor;
  final Color? titleColor;

  @override
  Widget build(BuildContext context) {
    final effectiveIconColor = iconColor ?? AppColors.primary;
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: effectiveIconColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: effectiveIconColor, size: 22),
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
                      fontWeight: FontWeight.w600,
                      color: titleColor ?? AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            const HugeIcon(
              icon: HugeIcons.strokeRoundedArrowRight01,
              color: AppColors.gray400,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }
}
