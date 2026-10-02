import 'package:flutter/widgets.dart';

import '../../l10n/generated/app_localizations.dart';

class DealDeskPresentation {
  static bool hasLinkedOrder(Map<String, dynamic> negotiation) {
    final orderRef = negotiation['orderId'];
    final value = orderRef is Map
        ? (orderRef['_id'] ?? orderRef['id'])
        : orderRef;
    final orderId = value?.toString().trim() ?? '';
    return orderId.isNotEmpty && orderId.toLowerCase() != 'null';
  }

  // Order states after payment is marked; the deal is then done.
  static const _settledOrderStatuses = {
    'payment_verified',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
  };

  /// Completed tab: declined/expired deals, and deals whose order is paid,
  /// shipped, delivered or cancelled. Everything else is still Active.
  static bool isCompleted(Map<String, dynamic> negotiation) {
    final status = negotiation['status']?.toString().toLowerCase() ?? '';
    if (status == 'rejected' || status == 'expired') return true;
    if (!hasLinkedOrder(negotiation)) return false;
    final orderStatus = negotiation['orderStatus']?.toString().toLowerCase();
    return _settledOrderStatuses.contains(orderStatus);
  }

  /// Order status of a negotiation/deal, or null when no order is involved.
  static DealOrderStatus? orderStatus(Map<String, dynamic> negotiation) {
    final status = negotiation['status']?.toString().toLowerCase() ?? '';
    if (status == 'converted' || hasLinkedOrder(negotiation)) {
      return DealOrderStatus.orderCreated;
    }
    if (status == 'accepted') return DealOrderStatus.acceptedOrderPending;
    return null;
  }

  /// Label for [orderStatus]. Pass [l10n] (`context.l10n`) for the current
  /// language; without it the English label is returned.
  static String? orderStatusLabel(
    Map<String, dynamic> negotiation, {
    AppLocalizations? l10n,
  }) {
    final status = orderStatus(negotiation);
    if (status == null) return null;
    final text = l10n ?? lookupAppLocalizations(const Locale('en'));
    switch (status) {
      case DealOrderStatus.orderCreated:
        return text.statusDealOrderCreated;
      case DealOrderStatus.acceptedOrderPending:
        return text.statusDealAcceptedOrderPending;
    }
  }
}

enum DealOrderStatus { orderCreated, acceptedOrderPending }
