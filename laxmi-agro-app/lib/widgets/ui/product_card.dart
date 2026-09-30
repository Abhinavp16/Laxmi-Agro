import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hugeicons/hugeicons.dart';

import '../../core/theme/app_fonts.dart';
import '../../core/theme/app_theme.dart';
import '../app_image.dart';
import 'pressable.dart';
import 'ui_basics.dart';

/// The app's single product card, used in grids and horizontal rails.
///
/// Give it a bounded height (grid extent or a sized rail); price and [action]
/// sit at the bottom so cards in a row line up.
class ProductCard extends StatelessWidget {
  const ProductCard({
    super.key,
    required this.name,
    required this.price,
    required this.onTap,
    this.imageUrl,
    this.category = '',
    this.brand,
    this.mrp,
    this.unit,
    this.packNote,
    this.rating,
    this.reviewCount,
    this.badge,
    this.badgeTone = ChipTone.brand,
    this.inStock = true,
    this.soldOutLabel,
    this.wishlisted,
    this.onWishlist,
    this.wishlistLabel,
    this.action,
    this.heroTag,
    this.specs = const [],
    this.extra,
    this.offLabel,
    this.semanticLabel,
  });

  final String name;
  final num price;
  final VoidCallback onTap;
  final String? imageUrl;
  final String category;
  final String? brand;
  final num? mrp;

  /// Price suffix, e.g. "/m".
  final String? unit;

  /// One short line under the price, e.g. "Coil 500 m = ₹37,500".
  final String? packNote;

  /// Shown only when not null and above zero.
  final double? rating;
  final int? reviewCount;
  final String? badge;
  final ChipTone badgeTone;
  final bool inStock;
  final String? soldOutLabel;
  final bool? wishlisted;
  final VoidCallback? onWishlist;
  final String? wishlistLabel;

  /// Usually a [QuantityStepper]; laid out full width at the bottom.
  final Widget? action;
  final String? heroTag;
  final List<String> specs;

  /// Any extra line (e.g. a sold-count line) above the price.
  final Widget? extra;
  final String Function(int percent)? offLabel;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    Widget image = Container(
      decoration: BoxDecoration(
        color: AppColors.gray50,
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      clipBehavior: Clip.antiAlias,
      padding: const EdgeInsets.all(10),
      child: (imageUrl == null || imageUrl!.isEmpty)
          ? AppImage(imageUrl: '', category: category, name: name)
          : AppImage(
              imageUrl: imageUrl!,
              category: category,
              name: name,
              fit: BoxFit.contain,
            ),
    );
    if (heroTag != null) {
      image = Hero(tag: heroTag!, transitionOnUserGestures: true, child: image);
    }

    return Pressable(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.lg),
      color: AppColors.surfaceLight,
      semanticLabel: semanticLabel ?? name,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: AppColors.border),
        ),
        padding: const EdgeInsets.all(6),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AspectRatio(
              aspectRatio: 1,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  image,
                  if (!inStock)
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.62),
                        borderRadius: BorderRadius.circular(AppRadius.md),
                      ),
                      alignment: Alignment.center,
                      child: StatusChip(
                        label: soldOutLabel ?? 'Sold out',
                        tone: ChipTone.neutral,
                        dense: true,
                      ),
                    ),
                  if (badge != null && badge!.isNotEmpty)
                    Positioned(
                      left: 6,
                      top: 6,
                      child: StatusChip(label: badge!, tone: badgeTone, dense: true),
                    ),
                  if (onWishlist != null)
                    Positioned(
                      right: 2,
                      top: 2,
                      child: WishlistButton(
                        active: wishlisted ?? false,
                        onTap: onWishlist!,
                        label: wishlistLabel,
                      ),
                    ),
                ],
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(4, 8, 4, 2),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (brand != null && brand!.isNotEmpty)
                      Text(
                        brand!.toUpperCase(),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppFonts.jakarta(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textTertiary,
                          letterSpacing: 0.4,
                        ),
                      ),
                    const SizedBox(height: 2),
                    Text(
                      name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppFonts.jakarta(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                        height: 1.3,
                      ),
                    ),
                    if (specs.isNotEmpty) ...[
                      const SizedBox(height: 5),
                      _SpecLine(specs: specs),
                    ],
                    if ((rating ?? 0) > 0) ...[
                      const SizedBox(height: 4),
                      _RatingLine(rating: rating!, count: reviewCount),
                    ],
                    if (extra != null) ...[const SizedBox(height: 4), extra!],
                    const Spacer(),
                    PriceView(
                      price: price,
                      mrp: mrp,
                      unit: unit,
                      size: 15,
                      offLabel: offLabel,
                    ),
                    if (packNote != null && packNote!.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Text(
                          packNote!,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppFonts.jakarta(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textTertiary,
                          ),
                        ),
                      ),
                    if (action != null) ...[
                      const SizedBox(height: 8),
                      action!,
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SpecLine extends StatelessWidget {
  const _SpecLine({required this.specs});

  final List<String> specs;

  @override
  Widget build(BuildContext context) {
    return Text(
      specs.where((s) => s.trim().isNotEmpty).join('  ·  '),
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
      style: AppFonts.jakarta(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        color: AppColors.textSecondary,
      ),
    );
  }
}

class _RatingLine extends StatelessWidget {
  const _RatingLine({required this.rating, this.count});

  final double rating;
  final int? count;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Icon(Icons.star_rounded, size: 14, color: Color(0xFFE8A317)),
        const SizedBox(width: 2),
        Text(
          rating.toStringAsFixed(1),
          style: AppFonts.jakarta(
            fontSize: 11.5,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        if (count != null && count! > 0) ...[
          const SizedBox(width: 3),
          Text(
            '($count)',
            style: AppFonts.jakarta(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: AppColors.textTertiary,
            ),
          ),
        ],
      ],
    );
  }
}

/// Heart toggle with a small pop when it becomes active.
class WishlistButton extends StatelessWidget {
  const WishlistButton({
    super.key,
    required this.active,
    required this.onTap,
    this.label,
    this.size = 36,
    this.filledBackground = true,
  });

  final bool active;
  final VoidCallback onTap;
  final String? label;
  final double size;
  final bool filledBackground;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      toggled: active,
      label: label,
      child: InkResponse(
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        radius: size * 0.7,
        child: SizedBox(
          width: size + 8,
          height: size + 8,
          child: Center(
            child: Container(
              width: size,
              height: size,
              decoration: filledBackground
                  ? BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.94),
                      shape: BoxShape.circle,
                      boxShadow: AppShadows.card,
                    )
                  : null,
              child: Center(
                child: AnimatedSwitcher(
                  duration: AppMotion.of(context, AppMotion.base),
                  transitionBuilder: (child, animation) => ScaleTransition(
                    scale: TweenSequence<double>([
                      TweenSequenceItem(tween: Tween(begin: 0.6, end: 1.18), weight: 60),
                      TweenSequenceItem(tween: Tween(begin: 1.18, end: 1), weight: 40),
                    ]).animate(animation),
                    child: child,
                  ),
                  child: active
                      ? Icon(
                          Icons.favorite_rounded,
                          key: const ValueKey('on'),
                          size: size * 0.5,
                          color: AppColors.error,
                        )
                      : HugeIcon(
                          key: const ValueKey('off'),
                          icon: HugeIcons.strokeRoundedFavourite,
                          size: size * 0.5,
                          color: AppColors.textSecondary,
                        ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
