import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hugeicons/hugeicons.dart';

import '../../core/models/user_model.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/guest_mode_provider.dart';
import '../../core/providers/locale_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_fonts.dart';
import '../../l10n/l10n.dart';
import '../../widgets/language_picker_sheet.dart';
import '../../widgets/ui/ui.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final l10n = context.l10n;
    final isHindi = ref.watch(localeProvider).languageCode == 'hi';
    final profileName = user?.name.trim().isNotEmpty == true
        ? user!.name.trim()
        : l10n.profileAccountFallback;
    final status = _accountStatus(context, user);
    final contactLine = user?.phone?.trim().isNotEmpty == true
        ? user!.phone!.trim()
        : user?.email.trim() ?? '';

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppHeader(
        title: l10n.profileTitle,
        actions: [
          HeaderIconButton(
            icon: HugeIcons.strokeRoundedPencilEdit01,
            tooltip: l10n.profileEditProfile,
            onPressed: () => context.push('/edit-profile'),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 40),
        children: [
          // Header card
          AppCard(
            child: Row(
              children: [
                _Avatar(user: user, name: profileName),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        profileName,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: AppFonts.jakarta(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                          letterSpacing: -0.3,
                        ),
                      ),
                      if (contactLine.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          contactLine,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.price(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                      const SizedBox(height: 10),
                      StatusChip(
                        label: status.label,
                        tone: status.tone,
                        icon: status.icon,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Quick shortcuts
          IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  child: QuickActionTile(
                    icon: HugeIcons.strokeRoundedShoppingBag01,
                    label: l10n.profilePreviousOrders,
                    onTap: () => context.push('/previous-orders'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: QuickActionTile(
                    icon: HugeIcons.strokeRoundedHandGrip,
                    label: l10n.profileNegotiations,
                    onTap: () => context.push('/negotiations'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: QuickActionTile(
                    icon: HugeIcons.strokeRoundedLocation01,
                    label: l10n.profileAddresses,
                    onTap: () => context.push('/addresses'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          SettingsGroup(
            title: l10n.profileSectionAccount,
            children: [
              SettingsTile(
                icon: HugeIcons.strokeRoundedUserEdit01,
                title: l10n.profileEditProfile,
                subtitle: l10n.profileEditProfileSubtitle,
                onTap: () => context.push('/edit-profile'),
              ),
              if (user?.businessInfo?.verified != true)
                SettingsTile(
                  icon: HugeIcons.strokeRoundedStore01,
                  title: _wholesalerActionTitle(context, user),
                  subtitle: _wholesalerActionSubtitle(context, user),
                  onTap: () => context.push('/convert-to-wholesaler'),
                ),
              SettingsTile(
                icon: HugeIcons.strokeRoundedTranslate,
                // Always show "भाषा" so Hindi readers can find it in English mode.
                title: isHindi
                    ? l10n.languageTitle
                    : '${l10n.languageTitle} / भाषा',
                subtitle: isHindi ? l10n.languageHindi : l10n.languageEnglish,
                onTap: () => showLanguagePicker(context, ref),
              ),
            ],
          ),

          if (user?.isWholesaler == true) ...[
            const SizedBox(height: 24),
            SettingsGroup(
              title: l10n.profileSectionWholesale,
              children: [
                SettingsTile(
                  icon: HugeIcons.strokeRoundedPackage,
                  title: l10n.profileAddProduct,
                  subtitle: l10n.profileAddProductSubtitle,
                  onTap: () => context.push('/add-product'),
                ),
                // Show View Customer App only for wholesalers
                SettingsTile(
                  icon: HugeIcons.strokeRoundedShoppingCart01,
                  title: l10n.profileViewCustomerApp,
                  subtitle: l10n.profileViewCustomerAppSubtitle,
                  onTap: () async {
                    ref.read(guestModeProvider.notifier).enableGuestMode();
                    try {
                      await context.push('/guest-app-preview');
                    } finally {
                      await Future<void>.delayed(Duration.zero);
                      ref.read(guestModeProvider.notifier).disableGuestMode();
                    }
                  },
                ),
              ],
            ),
          ],

          const SizedBox(height: 24),
          SettingsGroup(
            title: l10n.profileSectionSupportLegal,
            children: [
              SettingsTile(
                icon: HugeIcons.strokeRoundedHelpCircle,
                title: l10n.profileHelpSupport,
                subtitle: l10n.profileHelpSupportSubtitle,
                onTap: () => context.push('/help'),
              ),
              SettingsTile(
                icon: HugeIcons.strokeRoundedShield01,
                title: l10n.legalPrivacyPolicy,
                subtitle: l10n.profilePrivacySubtitle,
                onTap: () => context.push('/legal/privacy-policy'),
              ),
              SettingsTile(
                icon: HugeIcons.strokeRoundedFile01,
                title: l10n.legalTermsConditions,
                subtitle: l10n.profileTermsSubtitle,
                onTap: () => context.push('/legal/terms-conditions'),
              ),
            ],
          ),

          // Log out: only when signed in, and only after confirming.
          if (authState.isAuthenticated) ...[
            const SizedBox(height: 24),
            SettingsGroup(
              children: [
                SettingsTile(
                  icon: HugeIcons.strokeRoundedLogout01,
                  title: l10n.profileSignOut,
                  subtitle: l10n.profileSignOutSubtitle,
                  destructive: true,
                  showChevron: false,
                  onTap: () => _confirmLogout(context, ref),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _confirmLogout(BuildContext context, WidgetRef ref) async {
    final l10n = context.l10n;
    final confirmed = await showConfirmDialog(
      context,
      title: l10n.accLogoutTitle,
      message: l10n.accLogoutMessage,
      confirmLabel: l10n.commonLogout,
      cancelLabel: l10n.commonCancel,
      destructive: true,
      icon: HugeIcons.strokeRoundedLogout01,
    );
    if (!confirmed) return;
    await ref.read(authProvider.notifier).logout();
    if (context.mounted) context.go('/login');
  }

  _ProfileStatus _accountStatus(BuildContext context, UserModel? user) {
    final l10n = context.l10n;
    final businessInfo = user?.businessInfo;
    if (user?.isWholesaler == true && businessInfo?.verified == true) {
      return _ProfileStatus(
        label: l10n.profileStatusVerifiedWholesaler,
        tone: ChipTone.success,
        icon: HugeIcons.strokeRoundedCheckmarkCircle01,
      );
    }
    if (businessInfo?.status == 'pending') {
      return _ProfileStatus(
        label: l10n.profileStatusApplicationPending,
        tone: ChipTone.warning,
        icon: HugeIcons.strokeRoundedTime02,
      );
    }
    if (businessInfo?.status == 'rejected') {
      return _ProfileStatus(
        label: l10n.profileStatusApplicationRejected,
        tone: ChipTone.error,
        icon: HugeIcons.strokeRoundedAlert02,
      );
    }
    if (user?.isWholesaler == true) {
      return _ProfileStatus(
        label: l10n.profileStatusVerificationRequired,
        tone: ChipTone.warning,
        icon: HugeIcons.strokeRoundedAlert02,
      );
    }
    return _ProfileStatus(
      label: l10n.profileStatusCustomer,
      tone: ChipTone.brand,
      icon: HugeIcons.strokeRoundedUser,
    );
  }

  String _wholesalerActionTitle(BuildContext context, UserModel? user) {
    final l10n = context.l10n;
    if (user?.businessInfo?.status == 'pending') {
      return l10n.profileWholesalerApplication;
    }
    return user?.isWholesaler == true
        ? l10n.profileCompleteWholesalerVerification
        : l10n.profileBecomeWholesaler;
  }

  String _wholesalerActionSubtitle(BuildContext context, UserModel? user) {
    final l10n = context.l10n;
    if (user?.businessInfo?.status == 'pending') {
      return l10n.profileViewApplicationStatus;
    }
    return user?.isWholesaler == true
        ? l10n.profileSubmitBusinessProof
        : l10n.profileSubmitBusinessDetails;
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
      width: 64,
      height: 64,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        color: AppColors.primarySoft,
      ),
      clipBehavior: Clip.antiAlias,
      child: avatarUrl.isNotEmpty
          ? Image.network(
              avatarUrl,
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => _Initials(name: name),
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
        style: AppFonts.jakarta(
          fontSize: 22,
          fontWeight: FontWeight.w800,
          color: AppColors.primaryDeep,
        ),
      ),
    );
  }
}

class _ProfileStatus {
  const _ProfileStatus({
    required this.label,
    required this.tone,
    required this.icon,
  });

  final String label;
  final ChipTone tone;
  final IconData icon;
}
