import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hugeicons/hugeicons.dart';

import '../../core/theme/app_fonts.dart';
import '../../core/theme/app_theme.dart';

/// A fully rounded green track with a white knob: slide the knob to the end
/// to confirm. Let go early and it springs back. While [onConfirmed] runs
/// (or [loading] is set) the knob waits at the end with a spinner, then
/// returns. Screen readers get a plain button that confirms on tap.
class SlideToConfirm extends StatefulWidget {
  const SlideToConfirm({
    super.key,
    required this.label,
    required this.onConfirmed,
    this.icon = HugeIcons.strokeRoundedArrowRight01,
    this.loading = false,
  });

  final String label;

  /// Called once the knob reaches the end; null disables the slider.
  final Future<void> Function()? onConfirmed;
  final IconData icon;
  final bool loading;

  @override
  State<SlideToConfirm> createState() => _SlideToConfirmState();
}

class _SlideToConfirmState extends State<SlideToConfirm>
    with SingleTickerProviderStateMixin {
  static const double _height = 56;
  static const double _inset = 4;
  static const double _knob = _height - _inset * 2;

  /// How far along the knob is, 0 (start) to 1 (end).
  late final AnimationController _progress = AnimationController(
    vsync: this,
    duration: AppMotion.springDuration,
  );
  bool _running = false;

  bool get _enabled =>
      widget.onConfirmed != null && !widget.loading && !_running;

  @override
  void dispose() {
    _progress.dispose();
    super.dispose();
  }

  void _drag(DragUpdateDetails details, double travel) {
    if (!_enabled || travel <= 0) return;
    _progress.value = (_progress.value + details.delta.dx / travel).clamp(
      0.0,
      1.0,
    );
  }

  void _release() {
    if (!_enabled) return;
    if (_progress.value >= 0.85) {
      _confirm();
    } else {
      _springBack();
    }
  }

  void _springBack() {
    _progress.animateTo(
      0,
      duration: AppMotion.of(context, AppMotion.springDuration),
      curve: AppMotion.spring,
    );
  }

  Future<void> _confirm() async {
    final onConfirmed = widget.onConfirmed;
    if (onConfirmed == null) return;
    HapticFeedback.mediumImpact();
    setState(() => _running = true);
    await _progress.animateTo(
      1,
      duration: AppMotion.of(context, AppMotion.fast),
      curve: AppMotion.standard,
    );
    try {
      await onConfirmed();
    } finally {
      if (mounted) {
        setState(() => _running = false);
        _springBack();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final busy = _running || widget.loading;
    return Semantics(
      button: true,
      enabled: _enabled,
      label: widget.label,
      excludeSemantics: true,
      onTap: _enabled ? _confirm : null,
      child: Opacity(
        opacity: widget.onConfirmed == null ? 0.5 : 1,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final travel = constraints.maxWidth - _knob - _inset * 2;
            return GestureDetector(
              behavior: HitTestBehavior.opaque,
              onHorizontalDragUpdate: (details) => _drag(details, travel),
              onHorizontalDragEnd: (_) => _release(),
              onHorizontalDragCancel: _release,
              child: AnimatedBuilder(
                animation: _progress,
                builder: (context, _) {
                  final t = _progress.value;
                  return Container(
                    height: _height,
                    decoration: const ShapeDecoration(
                      color: AppColors.primary,
                      shape: StadiumBorder(),
                    ),
                    child: Stack(
                      children: [
                        // A lighter trail behind the knob.
                        Positioned(
                          left: _inset,
                          top: _inset,
                          bottom: _inset,
                          width: _knob + t * travel,
                          child: DecoratedBox(
                            decoration: ShapeDecoration(
                              color: Colors.white.withValues(alpha: 0.16),
                              shape: const StadiumBorder(),
                            ),
                          ),
                        ),
                        // The label fades as the knob passes over it.
                        Positioned.fill(
                          left: _knob + _inset * 2,
                          right: _inset * 3,
                          child: Center(
                            child: Opacity(
                              opacity: (1 - t * 1.4).clamp(0.0, 1.0),
                              child: Text(
                                widget.label,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: AppFonts.jakarta(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          left: _inset + t * travel,
                          top: _inset,
                          width: _knob,
                          height: _knob,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                              boxShadow: AppShadows.card,
                            ),
                            child: Center(
                              child: busy
                                  ? const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2.4,
                                        color: AppColors.primary,
                                      ),
                                    )
                                  : HugeIcon(
                                      icon: widget.icon,
                                      size: 22,
                                      color: AppColors.primary,
                                    ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            );
          },
        ),
      ),
    );
  }
}
