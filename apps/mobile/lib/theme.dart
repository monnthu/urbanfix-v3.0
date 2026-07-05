import 'package:flutter/material.dart';

const brand = Color(0xFF1A57F5);
const brandDark = Color(0xFF1443E1);

/// Category marker colors — must stay in sync with the web legend
/// (apps/web/src/lib/constants.ts).
const categoryColors = <String, Color>{
  'flooding': Color(0xFF2563EB),
  'pothole': Color(0xFF78350F),
  'streetlight': Color(0xFFF59E0B),
  'garbage': Color(0xFF16A34A),
  'graffiti': Color(0xFFDB2777),
  'water': Color(0xFF0891B2),
  'other': Color(0xFF64748B),
};

Color categoryColor(String id) => categoryColors[id] ?? categoryColors['other']!;

ThemeData buildTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: brand,
    primary: brand,
  );
  return ThemeData(
    colorScheme: scheme,
    useMaterial3: true,
    scaffoldBackgroundColor: const Color(0xFFF8FAFC),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.white,
      foregroundColor: Color(0xFF0F172A),
      elevation: 0,
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: brand,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    ),
  );
}
