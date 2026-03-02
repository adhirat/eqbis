/// Runtime configuration via --dart-define.
/// Usage: flutter run --dart-define=API_BASE_URL=https://staging.eqbis.com
class Env {
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:8787',
  );
}
