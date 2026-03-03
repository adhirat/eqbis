import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/env.dart';

class ApiService {
  static const _tokenKey = 'eqbis_jwt';

  final Dio _dio;
  final FlutterSecureStorage _storage;

  ApiService()
      : _storage = const FlutterSecureStorage(),
        _dio = Dio(BaseOptions(
          baseUrl: '${Env.apiBaseUrl}/api/v1',
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 30),
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        )) {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          await clearToken();
          // Caller should handle 401 → navigate to login
        }
        handler.next(error);
      },
    ));
  }

  // ── Token management ────────────────────────────────────────────────────────

  Future<String?> getToken() => _storage.read(key: _tokenKey);

  Future<void> saveToken(String token) =>
      _storage.write(key: _tokenKey, value: token);

  Future<void> clearToken() => _storage.delete(key: _tokenKey);

  Future<bool> get isAuthenticated async => (await getToken()) != null;

  // ── HTTP helpers ─────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> get(String path, {Map<String, dynamic>? params}) async {
    final res = await _dio.get<Map<String, dynamic>>(path, queryParameters: params);
    return res.data!;
  }

  Future<Map<String, dynamic>> post(String path, {Map<String, dynamic>? body}) async {
    final res = await _dio.post<Map<String, dynamic>>(path, data: body);
    return res.data!;
  }

  Future<Map<String, dynamic>> put(String path, {Map<String, dynamic>? body}) async {
    final res = await _dio.put<Map<String, dynamic>>(path, data: body);
    return res.data!;
  }
}

// Singleton
final apiService = ApiService();
