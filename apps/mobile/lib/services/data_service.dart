import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config.dart';
import '../models/report.dart';

/// Central data access. Reads go through the Supabase client directly (public,
/// RLS-protected); report creation goes through the web app's API so routing +
/// AI triage run server-side with the same logic as the web client.
class DataService {
  final SupabaseClient _sb = Supabase.instance.client;

  Session? get session => _sb.auth.currentSession;
  User? get user => _sb.auth.currentUser;
  bool get isSignedIn => session != null;

  Future<AuthResponse> signInWithPassword(String email, String password) {
    return _sb.auth.signInWithPassword(email: email, password: password);
  }

  Future<void> signInWithGoogle() {
    // Requires the Google provider configured in Supabase and a matching
    // redirect scheme registered for the mobile app.
    return _sb.auth.signInWithOAuth(
      OAuthProvider.google,
      redirectTo: 'com.urbanfix.mobile://login-callback',
    );
  }

  Future<void> signOut() => _sb.auth.signOut();

  Future<List<Report>> getReports() async {
    final rows = await _sb
        .from('reports')
        .select()
        .order('created_at', ascending: false);
    return (rows as List)
        .map((r) => Report.fromJson(r as Map<String, dynamic>))
        .toList();
  }

  Future<List<Category>> getCategories() async {
    final rows = await _sb.from('categories').select().order('label');
    return (rows as List)
        .map((r) => Category.fromJson(r as Map<String, dynamic>))
        .toList();
  }

  /// Uploads an image to the public bucket and returns its public URL.
  Future<String?> uploadImage(File file) async {
    final uid = user?.id ?? 'anon';
    final path = '$uid/${DateTime.now().millisecondsSinceEpoch}.jpg';
    await _sb.storage.from(AppConfig.reportImagesBucket).upload(path, file);
    return _sb.storage.from(AppConfig.reportImagesBucket).getPublicUrl(path);
  }

  /// Creates a report via the web API route (server-side routing + AI).
  Future<String?> createReport({
    required String title,
    required String description,
    required String category,
    required double latitude,
    required double longitude,
    String? addressText,
    String? imageUrl,
  }) async {
    final token = session?.accessToken;
    final res = await http.post(
      Uri.parse('${AppConfig.apiBaseUrl}/api/reports'),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'title': title,
        'description': description,
        'category': category,
        'latitude': latitude,
        'longitude': longitude,
        'address_text': addressText,
        'image_url': imageUrl,
      }),
    );
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return (jsonDecode(res.body) as Map<String, dynamic>)['id'] as String?;
    }
    return null;
  }

  /// One support/verify per user per report.
  Future<bool> support(String reportId) async {
    final uid = user?.id;
    if (uid == null) return false;
    try {
      await _sb.from('report_supports').insert({
        'report_id': reportId,
        'civilian_user_id': uid,
      });
      return true;
    } catch (_) {
      return false;
    }
  }
}
