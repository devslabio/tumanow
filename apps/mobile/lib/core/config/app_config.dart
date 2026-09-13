/// API base (include `/v1`). Override:
/// `flutter run --dart-define=API_BASE=http://127.0.0.1:3345/v1`
abstract final class AppConfig {
  static const String apiBase = String.fromEnvironment(
    'API_BASE',
    defaultValue: 'http://127.0.0.1:3345/v1',
  );
  static const String appName = 'TumaNow';
}
