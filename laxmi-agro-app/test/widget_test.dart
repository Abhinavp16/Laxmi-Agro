import 'package:laxmi_agro/main.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('App shell can be constructed', () {
    const app = LaxmiAgroApp();
    expect(app, isA<StatelessWidget>());
  });
}
