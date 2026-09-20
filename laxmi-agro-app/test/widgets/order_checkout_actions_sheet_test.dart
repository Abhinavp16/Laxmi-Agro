import 'package:flutter_test/flutter_test.dart';
import 'package:laxmi_agro/widgets/order_checkout_actions_sheet.dart';

void main() {
  group('checkout response routing', () {
    test('uses in-app approval for the complete new contract', () {
      final response = {
        'success': true,
        'data': {
          'nextAction': 'await_acceptance',
          'requiresWhatsapp': false,
          'order': {'id': 'order-1', 'orderNumber': 'LA-101'},
        },
      };

      expect(OrderCheckoutActionsSheet.usesInAppApprovalFlow(response), isTrue);
    });

    test('retains legacy flow when nextAction is absent', () {
      final response = {
        'success': true,
        'data': {'requiresWhatsapp': false, 'orderId': 'order-1'},
      };

      expect(
        OrderCheckoutActionsSheet.usesInAppApprovalFlow(response),
        isFalse,
      );
    });

    test('retains legacy flow when WhatsApp is still required', () {
      final response = {
        'success': true,
        'data': {'nextAction': 'await_acceptance', 'requiresWhatsapp': true},
      };

      expect(
        OrderCheckoutActionsSheet.usesInAppApprovalFlow(response),
        isFalse,
      );
    });
  });
}
