/// Environment configuration injected at build time via --dart-define.
///
/// Usage:
///   Local:   flutter run --dart-define=API_BASE_URL=http://localhost:3000
///   Staging: flutter run --dart-define=API_BASE_URL=https://staging.eqbis.com
///   Prod:    flutter run --dart-define=API_BASE_URL=https://eqbis.com
class Env {
  const Env._();

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000',
  );

  static const String appName = 'Eqbis';
}
