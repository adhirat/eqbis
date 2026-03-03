import 'package:flutter/material.dart';

class EqbisTheme {
  // Palette matching the web dark theme
  static const Color bg = Color(0xFF0F172A); // slate-900
  static const Color surface = Color(0xFF1E293B); // slate-800
  static const Color border = Color(0xFF334155); // slate-700
  static const Color text = Color(0xFFF1F5F9); // slate-100
  static const Color textMuted = Color(0xFF94A3B8); // slate-400
  static const Color accent = Color(0xFF3B82F6); // blue-500
  static const Color accent2 = Color(0xFF8B5CF6); // violet-500
  static const Color danger = Color(0xFFEF4444); // red-500
  static const Color success = Color(0xFF22C55E); // green-500
  static const Color warning = Color(0xFFF59E0B); // amber-500

  static ThemeData get dark => ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: bg,
        colorScheme: ColorScheme.dark(
          primary: accent,
          secondary: accent2,
          surface: surface,
          error: danger,
        ),
        cardTheme: CardThemeData(
          color: surface,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(color: border, width: 1),
          ),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: surface,
          foregroundColor: text,
          elevation: 0,
          scrolledUnderElevation: 0,
          centerTitle: false,
          titleTextStyle: TextStyle(
            color: text,
            fontSize: 16,
            fontWeight: FontWeight.w600,
            letterSpacing: -0.3,
          ),
        ),
        navigationBarTheme: NavigationBarThemeData(
          backgroundColor: surface,
          indicatorColor: accent.withAlpha(40),
          labelTextStyle: WidgetStateProperty.all(
            const TextStyle(fontSize: 11, color: textMuted),
          ),
          iconTheme: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return const IconThemeData(color: accent, size: 22);
            }
            return const IconThemeData(color: textMuted, size: 22);
          }),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: bg,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: border),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: accent, width: 1.5),
          ),
          hintStyle: const TextStyle(color: textMuted, fontSize: 14),
          labelStyle: const TextStyle(color: textMuted, fontSize: 13),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: accent,
            foregroundColor: Colors.white,
            minimumSize: const Size.fromHeight(44),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            textStyle:
                const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
          ),
        ),
        textTheme: const TextTheme(
          displayLarge: TextStyle(color: text, fontWeight: FontWeight.w700),
          displayMedium: TextStyle(color: text, fontWeight: FontWeight.w700),
          headlineLarge:
              TextStyle(color: text, fontWeight: FontWeight.w600, fontSize: 20),
          headlineMedium:
              TextStyle(color: text, fontWeight: FontWeight.w600, fontSize: 17),
          titleLarge:
              TextStyle(color: text, fontWeight: FontWeight.w600, fontSize: 15),
          titleMedium:
              TextStyle(color: text, fontWeight: FontWeight.w500, fontSize: 14),
          bodyLarge: TextStyle(color: text, fontSize: 14),
          bodyMedium: TextStyle(color: text, fontSize: 13),
          bodySmall: TextStyle(color: textMuted, fontSize: 12),
          labelSmall: TextStyle(color: textMuted, fontSize: 11),
        ),
      );
}
