import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class NotificationCountdownLabel extends StatefulWidget {
  final Map<String, dynamic>? data;
  final Color color;
  final double fontSize;

  const NotificationCountdownLabel({
    super.key,
    required this.data,
    required this.color,
    this.fontSize = 12,
  });

  @override
  State<NotificationCountdownLabel> createState() =>
      _NotificationCountdownLabelState();
}

class _NotificationCountdownLabelState
    extends State<NotificationCountdownLabel> {
  Timer? _timer;
  Duration? _remaining;

  static const Set<String> _supportedTypes = {
    'price_change_campaign_started',
    'price_change_campaign_12h',
    'price_change_campaign_6h',
    'price_change_campaign_20m',
    'price_change_campaign_3h',
    'price_change_campaign_1h',
    'price_change_campaign_5m',
  };

  @override
  void initState() {
    super.initState();
    _refresh();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _refresh());
  }

  @override
  void didUpdateWidget(covariant NotificationCountdownLabel oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.data != widget.data) {
      _refresh();
    }
  }

  void _refresh() {
    final data = widget.data;
    final type = data?['type']?.toString();
    final effectiveAtRaw = data?['effectiveAt']?.toString();
    final effectiveAt = effectiveAtRaw == null
        ? null
        : DateTime.tryParse(effectiveAtRaw)?.toLocal();

    if (!_supportedTypes.contains(type) || effectiveAt == null) {
      if (mounted) {
        setState(() => _remaining = null);
      }
      return;
    }

    final remaining = effectiveAt.difference(DateTime.now());
    if (mounted) {
      setState(
        () => _remaining = remaining.isNegative ? Duration.zero : remaining,
      );
    }
  }

  String _format(Duration remaining) {
    final days = remaining.inDays;
    final hours = remaining.inHours.remainder(24);
    final minutes = remaining.inMinutes.remainder(60);
    final seconds = remaining.inSeconds.remainder(60);

    if (days > 0) {
      return '${days}d ${hours.toString().padLeft(2, '0')}h';
    }
    if (remaining.inHours > 0) {
      return '${remaining.inHours}h ${minutes.toString().padLeft(2, '0')}m';
    }
    return '${minutes}m ${seconds.toString().padLeft(2, '0')}s';
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final remaining = _remaining;
    if (remaining == null || remaining == Duration.zero) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: const EdgeInsets.only(top: 6),
      child: Text(
        'Time left: ${_format(remaining)}',
        style: GoogleFonts.plusJakartaSans(
          fontSize: widget.fontSize,
          fontWeight: FontWeight.w700,
          color: widget.color,
        ),
      ),
    );
  }
}
