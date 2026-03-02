import 'package:flutter/material.dart';
import 'router.dart';
import 'theme/theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const EqbisApp());
}

class EqbisApp extends StatelessWidget {
  const EqbisApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title:           'Eqbis',
      debugShowCheckedModeBanner: false,
      theme:           EqbisTheme.dark,
      routerConfig:    router,
    );
  }
}
