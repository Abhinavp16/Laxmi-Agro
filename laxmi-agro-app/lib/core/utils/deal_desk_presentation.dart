class DealDeskPresentation {
  static bool hasLinkedOrder(Map<String, dynamic> negotiation) {
    final orderRef = negotiation['orderId'];
    final value = orderRef is Map
        ? (orderRef['_id'] ?? orderRef['id'])
        : orderRef;
    final orderId = value?.toString().trim() ?? '';
    return orderId.isNotEmpty && orderId.toLowerCase() != 'null';
  }

  static String? orderStatusLabel(Map<String, dynamic> negotiation) {
    final status = negotiation['status']?.toString().toLowerCase() ?? '';
    if (status == 'converted' || hasLinkedOrder(negotiation)) {
      return 'Order Created';
    }
    if (status == 'accepted') return 'Accepted · Order Pending';
    return null;
  }
}
