import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hugeicons/hugeicons.dart';

import '../../core/providers/cart_provider.dart';
import '../../core/providers/guest_mode_provider.dart';
import '../../core/theme/app_fonts.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/number_formatter.dart';
import '../../l10n/l10n.dart';
import '../app_image.dart';
import 'pressable.dart';
import 'quantity_stepper.dart';

/// Green pill that rises from the bottom while the cart has items: round
/// product thumbnails, item count, total and an arrow. It's only as wide as
/// its contents, sits at the left (in line with the page's 16 px gutter),
/// and eases its width as the numbers change.
class FloatingCartBar extends ConsumerWidget {
  const FloatingCartBar({super.key, required this.onTap, this.visible = true});

  final VoidCallback onTap;

  /// Lets the host hide the bar (e.g. on the cart tab) with the same motion.
  final bool visible;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cart = ref.watch(cartProvider);
    final isWholesaler = ref.watch(effectiveIsWholesalerProvider);
    final count = cart.displayItemCount(isWholesaler);
    final show = visible && cart.items.isNotEmpty;
    final l10n = context.l10n;
    final duration = AppMotion.of(context, AppMotion.slow);

    return IgnorePointer(
      ignoring: !show,
      child: AnimatedSlide(
        offset: show ? Offset.zero : const Offset(0, 1.6),
        duration: duration,
        curve: show ? AppMotion.emphasized : AppMotion.exit,
        child: AnimatedOpacity(
          opacity: show ? 1 : 0,
          duration: duration,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
            child: Align(
              alignment: Alignment.bottomLeft,
              child: Pressable(
                onTap: onTap,
                haptic: true,
                color: AppColors.primary,
                shape: const StadiumBorder(),
                semanticLabel:
                    '${l10n.productViewCart}, ${l10n.commonItemsCount(count)}',
                child: Container(
                  height: _height,
                  // The round thumbnails sit concentric with the pill's ends.
                  padding: const EdgeInsets.only(
                    left: (_height - _Thumbs.size) / 2,
                    right: 16,
                  ),
                  decoration: ShapeDecoration(
                    shape: const StadiumBorder(),
                    shadows: [
                      BoxShadow(
                        color: AppColors.primaryDeep.withValues(alpha: 0.28),
                        blurRadius: 18,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: AnimatedSize(
                    duration: duration,
                    curve: AppMotion.standard,
                    alignment: Alignment.centerLeft,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _Thumbs(items: cart.items),
                        const SizedBox(width: 10),
                        Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            RollingNumber(
                              value: count,
                              format: (value) =>
                                  l10n.commonItemsCount(value.toInt()),
                              style: AppFonts.jakarta(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: Colors.white.withValues(alpha: 0.85),
                              ),
                            ),
                            RollingNumber(
                              value: cart.subtotal,
                              format: (value) =>
                                  '₹${NumberFormatter.formatPrice(value)}',
                              style: AppFonts.jakarta(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(width: 12),
                        const HugeIcon(
                          icon: HugeIcons.strokeRoundedArrowRight01,
                          size: 20,
                          color: Colors.white,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  static const double _height = 58;
}

class _Thumbs extends StatelessWidget {
  const _Thumbs({required this.items});

  final List<CartItem> items;

  static const double size = 36;

  @override
  Widget build(BuildContext context) {
    final shown = items.take(3).toList();
    const overlap = 14.0;
    if (shown.isEmpty) return const SizedBox(width: size, height: size);
    return SizedBox(
      width: size + (shown.length - 1) * (size - overlap),
      height: size,
      child: Stack(
        children: [
          for (var i = 0; i < shown.length; i++)
            Positioned(
              left: i * (size - overlap),
              child: AnimatedSwitcher(
                duration: AppMotion.of(context, AppMotion.base),
                transitionBuilder: (child, animation) =>
                    ScaleTransition(scale: animation, child: child),
                child: Container(
                  key: ValueKey(shown[i].cartItemKey),
                  width: size,
                  height: size,
                  padding: const EdgeInsets.all(3),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.primary, width: 1.5),
                  ),
                  child: ClipOval(
                    child: AppImage(
                      imageUrl: shown[i].image ?? '',
                      category: shown[i].category ?? '',
                      name: shown[i].name,
                      width: size,
                      height: size,
                      fit: BoxFit.contain,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
