# Urbanfix Mobile (Flutter)

Civilian mobile app for Urbanfix v3.0 — sign in, submit a report (photo + location),
browse the report list, support reports, and view them on a map. Built with Flutter
so it runs on Android and iOS from a single codebase.

> This folder contains the Flutter source (`lib/`, `pubspec.yaml`). The platform
> runner folders (`android/`, `ios/`, etc.) are generated locally — see step 2.

## Prerequisites

- Flutter SDK 3.19+ (Dart 3.3+). Run `flutter doctor` and resolve any issues.
- Android Studio / Android SDK with an emulator (API 24+) or a physical device.
- The same Supabase project used by the web app.

## Setup

1. Install dependencies:

   ```bash
   cd apps/mobile
   flutter pub get
   ```

2. Generate the platform runners (only once, keeps this repo lib-only):

   ```bash
   flutter create . --platforms=android,ios
   ```

3. Run against your backend by passing config via `--dart-define`:

   ```bash
   flutter run \
     --dart-define=SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
     --dart-define=SUPABASE_ANON_KEY=YOUR_ANON_KEY \
     --dart-define=API_BASE_URL=https://your-web-app.vercel.app
   ```

   (Defaults live in [`lib/config.dart`](lib/config.dart) if you prefer to hardcode
   for a quick demo — but never put service-role or Gemini keys in the app.)

## Required platform permissions

After `flutter create .`, add these before running:

- Android (`android/app/src/main/AndroidManifest.xml`):

  ```xml
  <uses-permission android:name="android.permission.INTERNET" />
  <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
  <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
  ```

- iOS (`ios/Runner/Info.plist`): add `NSLocationWhenInUseUsageDescription` and
  `NSPhotoLibraryUsageDescription` strings.

## Architecture

```
lib/
  main.dart                 App entry + AuthGate (Supabase auth state)
  config.dart               Client-safe config (dart-define overridable)
  theme.dart                Brand + category colors (synced with web legend)
  models/report.dart        Report + Category models
  services/data_service.dart  Supabase reads/auth/storage + web API for create
  screens/
    login_screen.dart       Email sign-in + Google OAuth button
    home_shell.dart         Bottom-nav shell (Reports / Report / Map)
    report_list_screen.dart Public report list + support action
    new_report_screen.dart  Photo + location report submission
    map_screen.dart         WebView Leaflet + OpenStreetMap map + legend
```

- Reads use `supabase_flutter` directly (public, RLS-protected).
- Report creation posts to the web app `/api/reports` so routing + Gemini AI triage
  run server-side (secrets never touch the device). See
  [`../../docs/api-contracts.md`](../../docs/api-contracts.md).
- The map reuses the same Leaflet + OpenStreetMap stack as the web app via a
  `WebView`, so no native map key is required.

## Auth notes

- Email/password sign-in works out of the box against a seeded civilian account.
- Google OAuth uses `signInWithOAuth` with redirect `com.urbanfix.mobile://login-callback`.
  Configure the Google provider in Supabase and register the redirect scheme in the
  Android/iOS runners to enable it.

## Deferred (per plan)

- Institution dashboard and institution AI chat on mobile.
- Full feature parity with web.
- TOTP MFA enrollment on mobile (civilians enroll on web for the MVP).
