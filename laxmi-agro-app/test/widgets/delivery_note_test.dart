import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:laxmi_agro/l10n/l10n.dart';
import 'package:laxmi_agro/widgets/delivery_note.dart';

Future<void> _pump(WidgetTester tester, Locale locale) => tester.pumpWidget(
  MaterialApp(
    locale: locale,
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    home: const Scaffold(body: DeliveryNote()),
  ),
);

void main() {
  testWidgets('delivery note in English and Hindi', (tester) async {
    await _pump(tester, const Locale('en'));
    expect(
      find.text(
        '+ Delivery charges, if any, will be added by Laxmi Agro when your order is confirmed.',
      ),
      findsOneWidget,
    );
    await _pump(tester, const Locale('hi'));
    expect(
      find.text(
        '+ डिलीवरी शुल्क (यदि लागू हो) ऑर्डर कन्फर्म होते समय लक्ष्मी एग्रो द्वारा जोड़ा जाएगा।',
      ),
      findsOneWidget,
    );
  });
}
