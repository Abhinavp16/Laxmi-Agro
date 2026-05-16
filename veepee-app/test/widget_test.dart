import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:veepee_impex/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: AgriMartApp()));
    await tester.pump();
    expect(find.text('AgriMart'), findsOneWidget);
  });
}
