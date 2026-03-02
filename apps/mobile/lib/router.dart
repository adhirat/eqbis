import 'package:go_router/go_router.dart';
import 'services/api_service.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/signup_screen.dart';
import 'screens/portal/portal_shell.dart';
import 'screens/portal/dashboard_screen.dart';
import 'screens/portal/hr_screen.dart';
import 'screens/portal/finance_screen.dart';
import 'screens/portal/more_screen.dart';

final router = GoRouter(
  initialLocation: '/portal/dashboard',
  redirect: (context, state) async {
    final isAuthed = await apiService.isAuthenticated;
    final isAuthRoute = state.matchedLocation.startsWith('/auth');

    if (!isAuthed && !isAuthRoute) return '/auth/login';
    if (isAuthed  &&  isAuthRoute) return '/portal/dashboard';
    return null;
  },
  routes: [
    // Auth
    GoRoute(path: '/auth/login',  builder: (c, s) => const LoginScreen()),
    GoRoute(path: '/auth/signup', builder: (c, s) => const SignupScreen()),

    // Portal shell with bottom navigation
    ShellRoute(
      builder: (context, state, child) => PortalShell(child: child),
      routes: [
        GoRoute(path: '/portal/dashboard', builder: (c, s) => const DashboardScreen()),
        GoRoute(path: '/portal/hr',        builder: (c, s) => const HrScreen()),
        GoRoute(path: '/portal/finance',   builder: (c, s) => const FinanceScreen()),
        GoRoute(path: '/portal/more',      builder: (c, s) => const MoreScreen()),
      ],
    ),
  ],
);
