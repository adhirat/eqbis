import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/signup_screen.dart';
import 'screens/portal/portal_shell.dart';
import 'screens/portal/dashboard_screen.dart';
import 'services/auth_service.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) async {
      final isAuth = await AuthService.instance.isAuthenticated();
      final isAuthRoute = state.matchedLocation.startsWith('/auth') ||
          state.matchedLocation == '/login' ||
          state.matchedLocation == '/signup';

      if (!isAuth && !isAuthRoute) return '/login';
      if (isAuth && isAuthRoute) return '/portal/dashboard';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/signup', builder: (_, __) => const SignupScreen()),
      ShellRoute(
        builder: (context, state, child) => PortalShell(child: child),
        routes: [
          GoRoute(
            path: '/portal/dashboard',
            builder: (_, __) => const DashboardScreen(),
          ),
          GoRoute(
            path: '/portal/hr',
            builder: (_, __) => const DashboardScreen(), // placeholder
          ),
          GoRoute(
            path: '/portal/finance',
            builder: (_, __) => const DashboardScreen(), // placeholder
          ),
        ],
      ),
    ],
  );
});
