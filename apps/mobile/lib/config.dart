/// Client-safe configuration. Never place the service-role or Gemini keys here;
/// anything that needs a secret must go through the web app's API routes.
///
/// Values can be provided at build time with --dart-define, e.g.:
///   flutter run --dart-define=SUPABASE_URL=... --dart-define=SUPABASE_ANON_KEY=...
class AppConfig {
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://YOUR_PROJECT.supabase.co',
  );

  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'YOUR_ANON_KEY',
  );

  /// Deployed web app base URL, used for /api/reports and /api/ai/* which run
  /// routing + AI server-side.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://urbanfix.vercel.app',
  );

  static const String reportImagesBucket = 'report-images';
}
