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

/// Green bar that rises from the bottom while the cart has items: product
/// thumbnails, item count, total and "View cart".
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
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 10),
            child: Pressable(
              onTap: onTap,
              haptic: true,
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(AppRadius.lg),
              shape: AppShapes.squircle(AppRadius.lg),
              semanticLabel: '${l10n.productViewCart}, ${l10n.commonItemsCount(count)}',
              child: Container(
                height: 58,
                padding: const EdgeInsets.symmetric(horizontal: 10),
                decoration: ShapeDecoration(
                  shape: AppShapes.squircle(AppRadius.lg),
                  shadows: [
                    BoxShadow(
                      color: AppColors.primaryDeep.withValues(alpha: 0.28),
                      blurRadius: 18,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    _Thumbs(items: cart.items),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          RollingNumber(
                            value: count,
                            format: (value) => l10n.commonItemsCount(value.toInt()),
                            style: AppFonts.jakarta(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Colors.white.withValues(alpha: 0.85),
                            ),
                          ),
                          RollingNumber(
                            value: cart.subtotal,
                            format: (value) => '₹${NumberFormatter.formatPrice(value)}',
                            style: AppFonts.jakarta(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      l10n.productViewCart,
                      style: AppFonts.jakarta(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(width: 4),
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
    );
  }
}

class _Thumbs extends StatelessWidget {
  const _Thumbs({required this.items});

  final List<CartItem> items;

  @override
  Widget build(BuildContext context) {
    final shown = items.take(3).toList();
    const size = 36.0;
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
                    borderRadius: BorderRadius.circular(AppRadius.sm + 2),
                    border: Border.all(color: AppColors.primary, width: 1.5),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(AppRadius.sm - 2),
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
