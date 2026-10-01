import 'dart:async';
import 'dart:ui' as ui show Gradient;

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:intl/intl.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../../core/theme/app_fonts.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/customer_order_presentation.dart';
import '../../core/utils/number_formatter.dart';
import '../../l10n/l10n.dart';
import '../../widgets/ui/ui.dart';
import '../orders/order_parts.dart';

// Building blocks of the Profile tab: the green identity card with its stats
// strip, the "Your order" card, the wholesaler upgrade card and the footer.

/// One number in the identity card's stats strip.
class ProfileStat {
  const ProfileStat({
    required this.value,
    required this.label,
    required this.onTap,
  });

  final int value;
  final String label;
  final VoidCallback onTap;
}

/// Green card at the top of the Profile tab: avatar, name, contact, account
/// status and a white stats strip. Guests get a log-in button instead.
class ProfileIdentityCard extends StatelessWidget {
  const ProfileIdentityCard({
    super.key,
    required this.name,
    this.contactLine,
    this.businessName,
    this.avatarUrl,
    this.statusLabel,
    this.statusTone = ChipTone.brand,
    this.statusIcon,
    this.memberSince,
    this.isGuest = false,
    this.onEdit,
    this.onLogin,
    this.stats = const [],
  });

  final String name;
  final String? contactLine;
  final String? businessName;
  final String? avatarUrl;
  final String? statusLabel;
  final ChipTone statusTone;
  final IconData? statusIcon;

  /// "Member since Mar 2025", already localised.
  final String? memberSince;
  final bool isGuest;
  final VoidCallback? onEdit;
  final VoidCallback? onLogin;
  final List<ProfileStat> stats;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final radius = BorderRadius.circular(AppRadius.xl);
    final subtle = Colors.white.withValues(alpha: 0.78);

    return Container(
      decoration: BoxDecoration(
        borderRadius: radius,
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.primary, AppColors.primaryDeep],
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryDeep.withValues(alpha: 0.22),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: radius,
        child: Stack(
          children: [
            const Positioned.fill(child: _CardSheen()),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ProfileAvatar(
                        name: name,
                        url: avatarUrl,
                        isGuest: isGuest,
                        size: 64,
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 2),
                            Text(
                              name,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: AppFonts.jakarta(
                                fontSize: 19,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                                letterSpacing: -0.3,
                                height: 1.2,
                              ),
                            ),
                            if (businessName?.isNotEmpty == true) ...[
                              const SizedBox(height: 2),
                              Text(
                                businessName!,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: AppFonts.jakarta(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white.withValues(alpha: 0.9),
                                ),
                              ),
                            ],
                            if (contactLine?.isNotEmpty == true) ...[
                              const SizedBox(height: 3),
                              Text(
                                contactLine!,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: AppText.price(
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.w500,
                                  color: subtle,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      if (onEdit != null) ...[
                        const SizedBox(width: 8),
                        _GlassIconButton(
                          icon: HugeIcons.strokeRoundedPencilEdit02,
                          tooltip: l10n.homeEditProfile,
                          onTap: onEdit!,
                        ),
                      ],
                    ],
                  ),
                  if (statusLabel != null || memberSince != null) ...[
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 10,
                      runSpacing: 6,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        if (statusLabel != null)
                          StatusChip(
                            label: statusLabel!,
                            tone: statusTone,
                            icon: statusIcon,
                            dense: true,
                          ),
                        if (memberSince != null)
                          Text(
                            memberSince!,
                            style: AppFonts.jakarta(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: subtle,
                            ),
                          ),
                      ],
                    ),
                  ],
                  if (isGuest && onLogin != null) ...[
                    const SizedBox(height: 16),
                    AppButton(
                      label: l10n.commonLogin,
                      icon: HugeIcons.strokeRoundedLogin01,
                      variant: AppButtonVariant.secondary,
                      size: AppButtonSize.medium,
                      onPressed: onLogin,
                    ),
                  ] else if (stats.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    _StatsStrip(stats: stats),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatsStrip extends StatelessWidget {
  const _StatsStrip({required this.stats});

  final List<ProfileStat> stats;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 4),
      child: IntrinsicHeight(
        child: Row(
          children: [
            for (var i = 0; i < stats.length; i++) ...[
              if (i > 0)
                const VerticalDivider(
                  width: 1,
                  thickness: 1,
                  indent: 12,
                  endIndent: 12,
                  color: AppColors.border,
                ),
              Expanded(child: _StatCell(stat: stats[i])),
            ],
          ],
        ),
      ),
    );
  }
}

class _StatCell extends StatelessWidget {
  const _StatCell({required this.stat});

  final ProfileStat stat;

  @override
  Widget build(BuildContext context) {
    return Pressable(
      onTap: stat.onTap,
      haptic: true,
      scale: 0.95,
      borderRadius: BorderRadius.circular(AppRadius.md),
      semanticLabel: '${stat.value} ${stat.label}',
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            RollingNumber(
              value: stat.value,
              style: AppText.price(fontSize: 19),
            ),
            const SizedBox(height: 2),
            Text(
              stat.label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: AppFonts.jakarta(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GlassIconButton extends StatelessWidget {
  const _GlassIconButton({
    required this.icon,
    required this.tooltip,
    required this.onTap,
  });

  final IconData icon;
  final String tooltip;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Pressable(
        onTap: onTap,
        haptic: true,
        scale: 0.92,
        color: Colors.white.withValues(alpha: 0.16),
        splashColor: Colors.white.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(AppRadius.pill),
        semanticLabel: tooltip,
        child: SizedBox(
          width: 38,
          height: 38,
          child: Center(
            child: HugeIcon(icon: icon, size: 18, color: Colors.white),
          ),
        ),
      ),
    );
  }
}

/// Soft glows on the identity card, and every few seconds a glossy band of
/// light glides across it, like light catching a membership card. The sweep
/// stays off when the OS asks for reduced motion.
class _CardSheen extends StatefulWidget {
  const _CardSheen();

  @override
  State<_CardSheen> createState() => _CardSheenState();
}

class _CardSheenState extends State<_CardSheen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _sweep = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1600),
  );
  Timer? _first;
  Timer? _every;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _first?.cancel();
    _every?.cancel();
    if (AppMotion.reduced(context)) {
      _sweep.stop();
      return;
    }
    void run() {
      if (mounted) _sweep.forward(from: 0);
    }

    _first = Timer(const Duration(milliseconds: 900), run);
    _every = Timer.periodic(const Duration(seconds: 5), (_) => run());
  }

  @override
  void dispose() {
    _first?.cancel();
    _every?.cancel();
    _sweep.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(child: CustomPaint(painter: _SheenPainter(_sweep)));
  }
}

class _SheenPainter extends CustomPainter {
  _SheenPainter(this.sweep) : super(repaint: sweep);

  final AnimationController sweep;

  static const Color _lift = Color(0xFF3DB45F);

  /// Direction the band travels in: mostly sideways, a little downwards.
  static final Offset _direction = () {
    const d = Offset(1, 0.45);
    return d / d.distance;
  }();
  static const double _halfBand = 70;

  @override
  void paint(Canvas canvas, Size size) {
    // Light in the top-right corner, a brighter green from the bottom-left.
    final light = Offset(size.width * 0.9, 0);
    canvas.drawCircle(
      light,
      200,
      Paint()
        ..shader = RadialGradient(
          colors: [
            Colors.white.withValues(alpha: 0.13),
            Colors.white.withValues(alpha: 0),
          ],
        ).createShader(Rect.fromCircle(center: light, radius: 200)),
    );
    final rise = Offset(0, size.height);
    canvas.drawCircle(
      rise,
      190,
      Paint()
        ..shader = RadialGradient(
          colors: [_lift.withValues(alpha: 0.30), _lift.withValues(alpha: 0)],
        ).createShader(Rect.fromCircle(center: rise, radius: 190)),
    );

    if (!sweep.isAnimating) return;
    // The band's centre runs from just before the top-left corner to just
    // past the bottom-right one, measured along [_direction].
    final far = size.width * _direction.dx + size.height * _direction.dy;
    final t = Curves.easeInOutCubic.transform(sweep.value);
    final along = -_halfBand + (far + 2 * _halfBand) * t;
    canvas.drawRect(
      Offset.zero & size,
      Paint()
        // Runs along [_direction] between the band's two edges; clear
        // beyond them.
        ..shader = ui.Gradient.linear(
          _direction * (along - _halfBand),
          _direction * (along + _halfBand),
          [
            Colors.white.withValues(alpha: 0),
            Colors.white.withValues(alpha: 0.16),
            Colors.white.withValues(alpha: 0),
          ],
          const [0, 0.5, 1],
        ),
    );
  }

  @override
  bool shouldRepaint(_SheenPainter oldDelegate) => oldDelegate.sweep != sweep;
}

/// Round avatar: the photo, else initials, else a person icon for guests.
class ProfileAvatar extends StatelessWidget {
  const ProfileAvatar({
    super.key,
    required this.name,
    this.url,
    this.isGuest = false,
    this.size = 64,
  });

  final String name;
  final String? url;
  final bool isGuest;
  final double size;

  String get _initials {
    final parts = name
        .trim()
        .split(RegExp(r'\s+'))
        .where((part) => part.isNotEmpty);
    return parts.take(2).map((part) => part[0]).join().toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final initials = Center(
      child: isGuest || _initials.isEmpty
          ? HugeIcon(
              icon: HugeIcons.strokeRoundedUser,
              size: size * 0.44,
              color: AppColors.primaryDeep,
            )
          : Text(
              _initials,
              style: AppFonts.jakarta(
                fontSize: size * 0.34,
                fontWeight: FontWeight.w800,
                color: AppColors.primaryDeep,
              ),
            ),
    );
    final hasPhoto = url?.trim().isNotEmpty == true;
    return Container(
      width: size,
      height: size,
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.white.withValues(alpha: 0.92),
      ),
      child: Container(
        decoration: const BoxDecoration(
          shape: BoxShape.circle,
          color: AppColors.primarySoft,
        ),
        clipBehavior: Clip.antiAlias,
        child: hasPhoto
            ? CachedNetworkImage(
                imageUrl: url!.trim(),
                fit: BoxFit.cover,
                fadeInDuration: AppMotion.base,
                placeholder: (_, _) => initials,
                errorWidget: (_, _, _) => initials,
              )
            : initials,
      ),
    );
  }
}

/// "Member since Mar 2025" for the identity card, or null without a date.
String? profileMemberSinceText(BuildContext context, DateTime? joined) {
  if (joined == null) return null;
  final locale = Localizations.localeOf(context).languageCode;
  return context.l10n.profileMemberSince(
    DateFormat.yMMM(locale).format(joined.toLocal()),
  );
}

/// Orders that haven't finished yet (not delivered, cancelled or rejected).
List<Map<String, dynamic>> profileActiveOrders(
  List<Map<String, dynamic>> orders,
) {
  return [
    for (final order in orders)
      if (!const {
        'delivered',
        'cancelled',
        'rejected',
      }.contains(CustomerOrderPresentation.stage(order)))
        order,
  ];
}

/// "Your order" card: the latest order that is still on its way, with its
/// stage, a progress bar and a Track / View status button when the orders
/// screen offers one.
class ProfileActiveOrderCard extends StatelessWidget {
  const ProfileActiveOrderCard({
    super.key,
    required this.order,
    required this.moreInProgress,
    required this.onOpen,
    this.onTrack,
    this.trackLabel,
  });

  final Map<String, dynamic> order;

  /// How many other orders are also in progress.
  final int moreInProgress;
  final VoidCallback onOpen;
  final VoidCallback? onTrack;
  final String? trackLabel;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final stage = CustomerOrderPresentation.stage(order);
    final tone = CustomerOrderPresentation.toneColor(stage);
    final items = order['items'] as List<dynamic>? ?? const [];
    final number = order['orderNumber']?.toString() ?? '';
    final total = order['total'] as num?;
    final progress = CustomerOrderPresentation.progress(order);

    return Pressable(
      onTap: onOpen,
      scale: 0.985,
      color: AppColors.surfaceLight,
      borderRadius: BorderRadius.circular(AppRadius.lg),
      semanticLabel: '${l10n.profileYourOrder} $number',
      child: Container(
        padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: tone.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(AppRadius.md),
                  ),
                  child: Center(
                    child: HugeIcon(
                      icon: CustomerOrderPresentation.hugeIcon(stage),
                      size: 22,
                      color: tone,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        CustomerOrderPresentation.label(l10n, stage),
                        // Some stages are long ("Submitted · Awaiting
                        // Acceptance"); let them wrap.
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: AppFonts.jakarta(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        [
                          if (number.isNotEmpty) number,
                          l10n.commonItemsCount(items.length),
                        ].join(' · '),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppFonts.jakarta(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w500,
                          color: AppColors.textTertiary,
                        ),
                      ),
                    ],
                  ),
                ),
                if (total != null) ...[
                  const SizedBox(width: 8),
                  Text(
                    l10n.commonRupees(NumberFormatter.formatPrice(total)),
                    style: AppText.price(fontSize: 16),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 12),
            TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: progress),
              duration: AppMotion.of(
                context,
                const Duration(milliseconds: 700),
              ),
              curve: AppMotion.emphasized,
              builder: (_, value, _) =>
                  OrderProgressBar(value: value, color: tone),
            ),
            if (onTrack != null || moreInProgress > 0) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  if (onTrack != null)
                    AppButton(
                      label: trackLabel ?? l10n.ordersTrackOrder,
                      icon: HugeIcons.strokeRoundedDeliveryTruck01,
                      variant: AppButtonVariant.tonal,
                      size: AppButtonSize.small,
                      expand: false,
                      onPressed: onTrack,
                    ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: moreInProgress <= 0
                        ? const SizedBox.shrink()
                        : Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              Flexible(
                                child: Text(
                                  l10n.profileMoreOrdersInProgress(
                                    moreInProgress,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  textAlign: TextAlign.end,
                                  style: AppFonts.jakarta(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.primary,
                                  ),
                                ),
                              ),
                              const HugeIcon(
                                icon: HugeIcons.strokeRoundedArrowRight01,
                                size: 16,
                                color: AppColors.primary,
                              ),
                            ],
                          ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Warm card that pitches (or tracks) the wholesaler application, with a
/// shop-worker illustration on the right. Marigold is the palette's savings
/// colour, and it keeps this card apart from the green identity card above.
class ProfileUpgradeCard extends StatelessWidget {
  const ProfileUpgradeCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.ctaLabel,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final String ctaLabel;
  final VoidCallback onTap;

  /// Width / height of assets/images/wholesale_worker.webp.
  static const double _artAspect = 1200 / 518;

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.circular(AppRadius.lg);
    return Pressable(
      onTap: onTap,
      haptic: true,
      scale: 0.985,
      borderRadius: radius,
      splashColor: AppColors.accent.withValues(alpha: 0.10),
      semanticLabel: title,
      child: Ink(
        decoration: BoxDecoration(
          borderRadius: radius,
          border: Border.all(color: AppColors.accent.withValues(alpha: 0.22)),
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [AppColors.accentSoft, AppColors.surfaceLight],
          ),
        ),
        child: LayoutBuilder(
          builder: (context, constraints) {
            final textWidth = constraints.maxWidth * 0.66;
            return Stack(
              children: [
                // The illustration fills the card's height from the
                // bottom-right; its left side fades out behind the text.
                Positioned.fill(
                  child: LayoutBuilder(
                    builder: (context, box) {
                      final artHeight = box.maxHeight;
                      final artWidth = artHeight * _artAspect;
                      return Stack(
                        children: [
                          Positioned(
                            right: -artWidth * 0.26,
                            bottom: 0,
                            width: artWidth,
                            height: artHeight,
                            child: ShaderMask(
                              blendMode: BlendMode.dstIn,
                              shaderCallback: (rect) => const LinearGradient(
                                colors: [
                                  Color(0x00000000),
                                  Color(0x33000000),
                                  Color(0xFF000000),
                                ],
                                stops: [0.14, 0.34, 0.5],
                              ).createShader(rect),
                              child: Image.asset(
                                'assets/images/wholesale_worker.webp',
                                fit: BoxFit.fill,
                                excludeFromSemantics: true,
                              ),
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ),
                Align(
                  alignment: Alignment.centerLeft,
                  child: ConstrainedBox(
                    constraints: BoxConstraints(maxWidth: textWidth + 32),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            title,
                            style: AppFonts.jakarta(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                              height: 1.25,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            subtitle,
                            style: AppFonts.jakarta(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              color: AppColors.textSecondary,
                              height: 1.35,
                            ),
                          ),
                          const SizedBox(height: 14),
                          Container(
                            padding: const EdgeInsets.fromLTRB(14, 8, 10, 8),
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              borderRadius: BorderRadius.circular(
                                AppRadius.pill,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  ctaLabel,
                                  style: AppFonts.jakarta(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w800,
                                    color: Colors.white,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                const HugeIcon(
                                  icon: HugeIcons.strokeRoundedArrowRight02,
                                  size: 16,
                                  color: Colors.white,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

/// Small green count pill for a settings row ("3" unread).
class ProfileCountPill extends StatelessWidget {
  const ProfileCountPill({super.key, required this.count, this.semantic});

  final int count;
  final String? semantic;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: semantic,
      excludeSemantics: semantic != null,
      child: Container(
        constraints: const BoxConstraints(minWidth: 22),
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
        decoration: BoxDecoration(
          color: AppColors.primary,
          borderRadius: BorderRadius.circular(AppRadius.pill),
        ),
        child: Text(
          count > 99 ? '99+' : '$count',
          textAlign: TextAlign.center,
          style: AppText.price(
            fontSize: 12,
            fontWeight: FontWeight.w800,
            color: Colors.white,
          ),
        ),
      ),
    );
  }
}

/// Quiet sign-off under the settings: logo, "Since 1993" and the app version.
class ProfileFooter extends StatefulWidget {
  const ProfileFooter({super.key});

  @override
  State<ProfileFooter> createState() => _ProfileFooterState();
}

class _ProfileFooterState extends State<ProfileFooter> {
  late final Future<PackageInfo> _info = PackageInfo.fromPlatform();

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final style = AppFonts.jakarta(
      fontSize: 12,
      fontWeight: FontWeight.w600,
      color: AppColors.textTertiary,
    );
    return Column(
      children: [
        Opacity(
          opacity: 0.9,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(AppRadius.sm),
            child: Image.asset(
              'assets/images/laxmi-agro-logo.png',
              width: 32,
              height: 32,
              fit: BoxFit.cover,
            ),
          ),
        ),
        const SizedBox(height: 8),
        FutureBuilder<PackageInfo>(
          future: _info,
          builder: (context, snapshot) {
            final version = snapshot.data?.version;
            return Text(
              [
                l10n.homeTrustSince1993,
                if (version != null && version.isNotEmpty)
                  l10n.helpVersion(version),
              ].join('  ·  '),
              textAlign: TextAlign.center,
              style: style,
            );
          },
        ),
      ],
    );
  }
}

/// Fades its child in with a short upward drift the first time it is shown.
/// Inside an [IndexedStack] tab it waits until the tab is actually visible.
class ProfileReveal extends StatefulWidget {
  const ProfileReveal({super.key, required this.child, this.index = 0});

  final Widget child;

  /// Position in the page; each step delays the start a little.
  final int index;

  @override
  State<ProfileReveal> createState() => _ProfileRevealState();
}

class _ProfileRevealState extends State<ProfileReveal>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: AppMotion.slow,
  );
  late final Animation<double> _curve = CurvedAnimation(
    parent: _controller,
    curve: AppMotion.emphasized,
  );
  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    if (AppMotion.reduced(context)) {
      _started = true;
      _controller.value = 1;
      return;
    }
    // Hidden tabs have tickers muted; start once this one is on screen.
    if (!TickerMode.of(context)) return;
    _started = true;
    Future<void>.delayed(Duration(milliseconds: 45 * widget.index), () {
      if (mounted) _controller.forward();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _curve,
      child: widget.child,
      builder: (context, child) => Opacity(
        opacity: _curve.value,
        child: Transform.translate(
          offset: Offset(0, 14 * (1 - _curve.value)),
          child: child,
        ),
      ),
    );
  }
}
