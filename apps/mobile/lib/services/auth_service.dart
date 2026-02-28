import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/env.dart';

const _tokenKey = 'better_auth_token';

class AuthService {
  AuthService._()
      : _dio = Dio(BaseOptions(
          baseUrl: Env.apiBaseUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
          headers: {'Content-Type': 'application/json'},
        )),
        _storage = const FlutterSecureStorage();

  static final AuthService instance = AuthService._();

  final Dio _dio;
  final FlutterSecureStorage _storage;

  // ── Session token ─────────────────────────────────────────────────────────

  Future<String?> getToken() => _storage.read(key: _tokenKey);

  Future<void> _saveToken(String token) =>
      _storage.write(key: _tokenKey, value: token);

  Future<void> clearToken() => _storage.delete(key: _tokenKey);

  Future<bool> isAuthenticated() async => (await getToken()) != null;

  // ── Auth calls to Better Auth REST API ───────────────────────────────────

  /// POST /api/auth/sign-in/email
  Future<Map<String, dynamic>> signIn({
    required String email,
    required String password,
  }) async {
    final response = await _dio.post('/api/auth/sign-in/email', data: {
      'email': email,
      'password': password,
    });
    final token = response.data['token'] as String?;
    if (token != null) await _saveToken(token);
    return response.data as Map<String, dynamic>;
  }

  /// POST /api/auth/sign-up/email
  Future<Map<String, dynamic>> signUp({
    required String name,
    required String email,
    required String password,
  }) async {
    final response = await _dio.post('/api/auth/sign-up/email', data: {
      'name': name,
      'email': email,
      'password': password,
    });
    final token = response.data['token'] as String?;
    if (token != null) await _saveToken(token);
    return response.data as Map<String, dynamic>;
  }

  /// POST /api/auth/sign-out
  Future<void> signOut() async {
    final token = await getToken();
    if (token != null) {
      await _dio.post(
        '/api/auth/sign-out',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );
    }
    await clearToken();
  }

  /// GET /api/auth/get-session — returns current user or null
  Future<Map<String, dynamic>?> getSession() async {
    final token = await getToken();
    if (token == null) return null;
    try {
      final response = await _dio.get(
        '/api/auth/get-session',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );
      return response.data as Map<String, dynamic>?;
    } on DioException {
      await clearToken();
      return null;
    }
  }
}
