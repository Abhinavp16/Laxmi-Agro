import 'package:flutter_test/flutter_test.dart';
import 'package:laxmi_agro/core/utils/deal_desk_presentation.dart';

void main() {
  group('DealDeskPresentation', () {
    test('accepted negotiation without an order remains order pending', () {
      final negotiation = <String, dynamic>{
        'status': 'accepted',
        'orderId': null,
      };

      expect(
        DealDeskPresentation.orderStatusLabel(negotiation),
        'Accepted · Order Pending',
      );
    });

    test('accepted negotiation with an order is shown as order created', () {
      final negotiation = <String, dynamic>{
        'status': 'accepted',
        'orderId': 'order-123',
      };

      expect(
        DealDeskPresentation.orderStatusLabel(negotiation),
        'Order Created',
      );
    });

    test('converted negotiation is shown as order created', () {
      final negotiation = <String, dynamic>{
        'status': 'converted',
        'orderId': null,
      };

      expect(
        DealDeskPresentation.orderStatusLabel(negotiation),
        'Order Created',
      );
    });

    test('a linked order takes precedence over a stale status', () {
      final negotiation = <String, dynamic>{
        'status': 'pending',
        'orderId': 'order-789',
      };

      expect(
        DealDeskPresentation.orderStatusLabel(negotiation),
        'Order Created',
      );
    });

    test('populated order reference counts only when it has an id', () {
      expect(
        DealDeskPresentation.hasLinkedOrder(<String, dynamic>{
          'orderId': <String, dynamic>{'_id': 'order-456'},
        }),
        isTrue,
      );
      expect(
        DealDeskPresentation.hasLinkedOrder(<String, dynamic>{
          'orderId': <String, dynamic>{'orderNumber': 'LA-456'},
        }),
        isFalse,
      );
    });
  });
}
