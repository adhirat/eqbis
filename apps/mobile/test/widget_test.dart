import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:eqbis/main.dart';

void main() {
  testWidgets('App renders without crash', (WidgetTester tester) async {
    // Just verify app boots without crashing
    await tester.pumpWidget(const EqbisApp());
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
