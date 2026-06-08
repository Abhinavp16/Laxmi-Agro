import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class PendingPriceChangeNotice extends StatefulWidget {
  final Map<String, dynamic>? pendingPriceChange;
  final bool compact;
  final Color primaryColor;
  final Color accentColor;
  final Color backgroundColor;

  const PendingPriceChangeNotice({
    super.key,
    required this.pendingPriceChange,
    this.compact = false,
    this.primaryColor = const Color(0xFF0F172A),
    this.accentColor = const Color(0xFFEA580C),
    this.backgroundColor = const Color(0xFFFFF7ED),
  });

  @override
  State<PendingPriceChangeNotice> createState() =>
      _PendingPriceChangeNoticeState();
}

class _PendingPriceChangeNoticeState extends State<PendingPriceChangeNotice> {
  Timer? _timer;
  Duration? _remaining;

  @override
  void initState() {
    super.initState();
    _refreshRemaining();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      _refreshRemaining();
    });
  }

  @override
  void didUpdateWidget(covariant PendingPriceChangeNotice oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.pendingPriceChange != widget.pendingPriceChange) {
      _refreshRemaining();
    }
  }

  void _refreshRemaining() {
    final effectiveAtRaw = widget.pendingPriceChange?['effectiveAt']?.toString();
    final effectiveAt = effectiveAtRaw == null
        ? null
        : DateTime.tryParse(effectiveAtRaw)?.toLocal();

    if (effectiveAt == null) {
      if (mounted) {
        setState(() => _remaining = null);
      }
      return;
    }

    final remaining = effectiveAt.difference(DateTime.now());
    if (mounted) {
      setState(() => _remaining = remaining.isNegative ? Duration.zero : remaining);
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String _formatPrice(dynamic value) {
    final parsed = value is num
        ? value.toDouble()
        : double.tryParse(value?.toString() ?? '') ?? 0;
    return parsed.toStringAsFixed(0);
  }

  String _formatDuration(Duration duration) {
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);
    final seconds = duration.inSeconds.remainder(60);
    if (hours > 0) {
      return '${hours}h ${minutes.toString().padLeft(2, '0')}m';
    }
    return '${minutes}m ${seconds.toString().padLeft(2, '0')}s';
  }

  @override
  Widget build(BuildContext context) {
    final data = widget.pendingPriceChange;
    final remaining = _remaining;
    if (data == null || remaining == null || remaining == Duration.zero) {
      return const SizedBox.shrink();
    }

    final currentPrice = data['currentPrice'];
    final newPrice = data['newPrice'];
    final timerText = _formatDuration(remaining);

    return Container(
      width: double.infinity,
      margin: EdgeInsets.only(top: widget.compact ? 6 : 10),
      padding: EdgeInsets.symmetric(
        horizontal: widget.compact ? 8 : 10,
        vertical: widget.compact ? 6 : 8,
      ),
      decoration: BoxDecoration(
        color: widget.backgroundColor,
        borderRadius: BorderRadius.circular(widget.compact ? 8 : 10),
        border: Border.all(color: widget.accentColor.withOpacity(0.18)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.compact ? 'Price update pending' : 'Upcoming price change',
            style: GoogleFonts.outfit(
              fontSize: widget.compact ? 10.5 : 12,
              fontWeight: FontWeight.w700,
              color: widget.primaryColor,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            '₹${_formatPrice(currentPrice)} -> ₹${_formatPrice(newPrice)} in $timerText',
            style: GoogleFonts.outfit(
              fontSize: widget.compact ? 10 : 11.5,
              fontWeight: FontWeight.w600,
              color: widget.accentColor,
              height: 1.25,
            ),
          ),
        ],
      ),
    );
  }
}
