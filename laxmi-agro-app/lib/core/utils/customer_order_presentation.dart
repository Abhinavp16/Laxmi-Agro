import 'package:flutter/material.dart';

class CustomerOrderPresentation {
  static String acceptanceStatus(Map<String, dynamic> order) =>
      order['acceptanceStatus']?.toString().toLowerCase() ?? '';

  static String stage(Map<String, dynamic> order) {
    final acceptance = acceptanceStatus(order);
    if (acceptance == 'rejected') return 'rejected';
    if (acceptance == 'pending') return 'awaiting_acceptance';

    final fulfillment = order['status']?.toString() ?? 'pending_payment';
    if (acceptance == 'accepted' && fulfillment == 'pending_payment') {
      return 'accepted_awaiting_payment';
    }
    return fulfillment;
  }

  static String label(String stage) {
    switch (stage) {
      case 'awaiting_acceptance':
        return 'Submitted · Awaiting Approval';
      case 'accepted_awaiting_payment':
        return 'Accepted · Awaiting Payment';
      case 'pending_payment':
        return 'Awaiting Payment Confirmation';
      case 'payment_uploaded':
        return 'Awaiting Shop Confirmation';
      case 'payment_verified':
        return 'Payment Confirmed';
      case 'processing':
        return 'Processing';
      case 'shipped':
        return 'Shipped';
      case 'delivered':
        return 'Delivered';
      case 'rejected':
        return 'Order Rejected';
      case 'cancelled':
        return 'Cancelled';
      default:
        return stage.replaceAll('_', ' ');
    }
  }

  static Color color(String stage) {
    switch (stage) {
      case 'awaiting_acceptance':
        return const Color(0xFFD97706);
      case 'accepted_awaiting_payment':
        return const Color(0xFF0F766E);
      case 'pending_payment':
        return const Color(0xFFF59E0B);
      case 'payment_uploaded':
        return const Color(0xFF6366F1);
      case 'payment_verified':
        return const Color(0xFF2563EB);
      case 'processing':
        return const Color(0xFF7C3AED);
      case 'shipped':
        return const Color(0xFF0284C7);
      case 'delivered':
        return const Color(0xFF16A34A);
      case 'rejected':
      case 'cancelled':
        return const Color(0xFFDC2626);
      default:
        return const Color(0xFF64748B);
    }
  }

  static IconData icon(String stage) {
    switch (stage) {
      case 'awaiting_acceptance':
        return Icons.schedule_rounded;
      case 'accepted_awaiting_payment':
        return Icons.task_alt_rounded;
      case 'pending_payment':
        return Icons.access_time_rounded;
      case 'payment_uploaded':
        return Icons.hourglass_top_rounded;
      case 'payment_verified':
        return Icons.verified_rounded;
      case 'processing':
        return Icons.inventory_2_rounded;
      case 'shipped':
        return Icons.local_shipping_rounded;
      case 'delivered':
        return Icons.check_circle_rounded;
      case 'rejected':
        return Icons.block_rounded;
      case 'cancelled':
        return Icons.cancel_rounded;
      default:
        return Icons.info_outline_rounded;
    }
  }

  static List<String> timeline(Map<String, dynamic> order) {
    final currentStage = stage(order);
    if (currentStage == 'rejected') {
      return const ['awaiting_acceptance', 'rejected'];
    }
    if (currentStage == 'awaiting_acceptance') {
      return const ['awaiting_acceptance'];
    }

    final acceptance = acceptanceStatus(order);
    final history = order['statusHistory'] is List
        ? order['statusHistory'] as List
        : const [];
    bool hasHistory(String status) => history.any(
      (item) => item is Map && item['status']?.toString() == status,
    );
    final stages = <String>[
      if (acceptance == 'accepted') ...[
        'awaiting_acceptance',
        'accepted_awaiting_payment',
      ] else
        'pending_payment',
      if (currentStage == 'payment_uploaded' || hasHistory('payment_uploaded'))
        'payment_uploaded',
      'payment_verified',
      'processing',
      'shipped',
      'delivered',
    ];
    if (currentStage == 'cancelled') {
      final completed = <String>[
        if (acceptance == 'accepted') ...[
          'awaiting_acceptance',
          'accepted_awaiting_payment',
        ] else
          'pending_payment',
        for (final status in const [
          'payment_uploaded',
          'payment_verified',
          'processing',
          'shipped',
          'delivered',
        ])
          if (hasHistory(status)) status,
        'cancelled',
      ];
      return completed;
    }

    final index = stages.indexOf(currentStage);
    return index < 0 ? stages : stages.take(index + 1).toList();
  }
}
