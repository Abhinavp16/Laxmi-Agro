import 'package:flutter_test/flutter_test.dart';
import 'package:laxmi_agro/core/utils/customer_order_presentation.dart';

void main() {
  group('CustomerOrderPresentation', () {
    test('pending acceptance takes precedence over fulfillment status', () {
      final order = <String, dynamic>{
        'acceptanceStatus': 'pending',
        'status': 'pending_payment',
      };

      expect(CustomerOrderPresentation.stage(order), 'awaiting_acceptance');
      expect(
        CustomerOrderPresentation.label(CustomerOrderPresentation.stage(order)),
        'Submitted · Awaiting Approval',
      );
      expect(CustomerOrderPresentation.timeline(order), [
        'awaiting_acceptance',
      ]);
    });

    test('accepted order starts the fulfillment timeline', () {
      final order = <String, dynamic>{
        'acceptanceStatus': 'accepted',
        'status': 'payment_verified',
      };

      expect(CustomerOrderPresentation.stage(order), 'payment_verified');
      expect(CustomerOrderPresentation.timeline(order), [
        'awaiting_acceptance',
        'accepted_awaiting_payment',
        'payment_verified',
      ]);
    });

    test('rejection is terminal regardless of fulfillment status', () {
      final order = <String, dynamic>{
        'acceptanceStatus': 'rejected',
        'status': 'pending_payment',
        'rejectionReason': 'Delivery is unavailable for this location.',
      };

      expect(CustomerOrderPresentation.stage(order), 'rejected');
      expect(CustomerOrderPresentation.timeline(order), [
        'awaiting_acceptance',
        'rejected',
      ]);
    });

    test('legacy orders retain their fulfillment status', () {
      final order = <String, dynamic>{'status': 'processing'};

      expect(CustomerOrderPresentation.stage(order), 'processing');
      expect(CustomerOrderPresentation.timeline(order), [
        'pending_payment',
        'payment_verified',
        'processing',
      ]);
    });

    test('uploaded payment appears as the latest timeline stage', () {
      final order = <String, dynamic>{
        'acceptanceStatus': 'accepted',
        'status': 'payment_uploaded',
        'statusHistory': [
          {'status': 'payment_uploaded'},
        ],
      };

      expect(CustomerOrderPresentation.timeline(order), [
        'awaiting_acceptance',
        'accepted_awaiting_payment',
        'payment_uploaded',
      ]);
    });

    test('cancelled order retains completed milestones', () {
      final order = <String, dynamic>{
        'acceptanceStatus': 'accepted',
        'status': 'cancelled',
        'statusHistory': [
          {'status': 'payment_verified'},
          {'status': 'processing'},
          {'status': 'cancelled'},
        ],
      };

      expect(CustomerOrderPresentation.timeline(order), [
        'awaiting_acceptance',
        'accepted_awaiting_payment',
        'payment_verified',
        'processing',
        'cancelled',
      ]);
    });
  });
}
