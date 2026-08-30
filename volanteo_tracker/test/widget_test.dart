import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:volanteo_tracker/main.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('App smoke test muestra login sin sesión', (WidgetTester tester) async {
    await tester.pumpWidget(const VolanteoTrackerApp());
    await tester.pumpAndSettle();
    expect(find.text('Ingresar'), findsOneWidget);
  });
}
