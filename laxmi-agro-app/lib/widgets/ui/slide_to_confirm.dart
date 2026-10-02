import 'dart:ui' as ui show FragmentProgram, FragmentShader;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hugeicons/hugeicons.dart';

import '../../core/theme/app_fonts.dart';
import '../../core/theme/app_theme.dart';

/// A fully rounded green track with a white knob: slide the knob to the end
/// to confirm. Every couple of seconds a wave of light sweeps along the
/// track and reveals dithered arrows pointing the way. Let go early and it
/// springs back. While [onConfirmed] runs
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
                    // Keeps the arrows inside the rounded ends.
                    clipBehavior: Clip.antiAlias,
                    child: Stack(
                      children: [
                        // Dithered arrows the shimmer reveals; they fade
                        // out as the knob is dragged.
                        Positioned.fill(
                          child: Opacity(
                            opacity: (1 - t * 1.6).clamp(0.0, 1.0),
                            child: const _ShimmerArrows(
                              start: _inset + _knob + 6,
                            ),
                          ),
                        ),
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

/// The dithered arrows on the slider track, revealed by a sweeping band of
/// light (shaders/slider_arrows.frag). Off when the OS asks for reduced
/// motion; pauses with TickerMode.
class _ShimmerArrows extends StatefulWidget {
  const _ShimmerArrows({required this.start});

  /// Where the arrows begin, past the knob's resting place.
  final double start;

  @override
  State<_ShimmerArrows> createState() => _ShimmerArrowsState();
}

class _ShimmerArrowsState extends State<_ShimmerArrows>
    with SingleTickerProviderStateMixin {
  static final Future<ui.FragmentProgram> _program =
      ui.FragmentProgram.fromAsset('shaders/slider_arrows.frag');

  // One cycle: the sweep, then a short rest.
  late final AnimationController _cycle = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 2600),
  );
  ui.FragmentShader? _shader;

  @override
  void initState() {
    super.initState();
    _program.then((program) {
      if (mounted) setState(() => _shader = program.fragmentShader());
    }, onError: (Object _) {});
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (AppMotion.reduced(context)) {
      _cycle.stop();
    } else if (!_cycle.isAnimating) {
      _cycle.repeat();
    }
  }

  @override
  void dispose() {
    _cycle.dispose();
    _shader?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final shader = _shader;
    if (shader == null || AppMotion.reduced(context)) {
      return const SizedBox.shrink();
    }
    return RepaintBoundary(
      child: CustomPaint(painter: _ArrowsPainter(shader, _cycle, widget.start)),
    );
  }
}

class _ArrowsPainter extends CustomPainter {
  _ArrowsPainter(this.shader, this.cycle, this.start) : super(repaint: cycle);

  final ui.FragmentShader shader;
  final AnimationController cycle;
  final double start;

  /// The sweep takes this share of each cycle; the rest is a pause.
  static const double _sweepShare = 0.7;

  @override
  void paint(Canvas canvas, Size size) {
    final v = cycle.value;
    // Band centre runs from just off the left to just off the right.
    final wave = v < _sweepShare
        ? -0.2 + 1.4 * Curves.easeInOut.transform(v / _sweepShare)
        : -1.0;
    shader
      ..setFloat(0, size.width)
      ..setFloat(1, size.height)
      ..setFloat(2, wave)
      ..setFloat(3, 2)
      ..setFloat(4, start)
      // White dots at up to 55% opacity.
      ..setFloat(5, 1)
      ..setFloat(6, 1)
      ..setFloat(7, 1)
      ..setFloat(8, 0.55);
    canvas.drawRect(Offset.zero & size, Paint()..shader = shader);
  }

  @override
  bool shouldRepaint(_ArrowsPainter oldDelegate) =>
      oldDelegate.shader != shader ||
      oldDelegate.cycle != cycle ||
      oldDelegate.start != start;
}
