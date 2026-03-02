import '../models/user.dart';
import 'api_service.dart';

class AuthService {
  final ApiService _api;

  AuthService(this._api);

  /// Login with email + password.
  /// Returns the logged-in user on success.
  Future<UserModel> login(String email, String password) async {
    final data = await _api.post('/auth/login', body: {
      'email':    email,
      'password': password,
    });

    final token = data['token'] as String?;
    if (token == null) throw Exception(data['error'] ?? 'Login failed');

    await _api.saveToken(token);
    // Fetch full profile (JWT payload expanded: roles, permissions, orgId, etc.)
    return getMe();
  }

  /// Register a new org + admin user.
  Future<UserModel> register({
    required String email,
    required String password,
    required String fullName,
    required String orgName,
    required String orgSlug,
  }) async {
    final data = await _api.post('/auth/register', body: {
      'email':    email,
      'password': password,
      'fullName': fullName,
      'orgName':  orgName,
      'orgSlug':  orgSlug,
    });

    final token = data['token'] as String?;
    if (token == null) throw Exception(data['error'] ?? 'Registration failed');

    await _api.saveToken(token);
    // Fetch full profile (roles, permissions, orgId, etc.)
    return getMe();
  }

  /// Logout — clears stored token.
  Future<void> logout() async {
    try {
      await _api.post('/auth/logout');
    } catch (_) {
      // Best-effort server-side revocation
    } finally {
      await _api.clearToken();
    }
  }

  /// Fetch current user profile from API.
  Future<UserModel> getMe() async {
    final data = await _api.get('/me');
    return UserModel.fromJson(data);
  }
}

final authService = AuthService(apiService);
