import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class PortalShell extends StatelessWidget {
  const PortalShell({super.key, required this.child});
  final Widget child;

  static const _tabs = [
    _Tab(
        icon: Icons.grid_view_rounded,
        label: 'Dashboard',
        path: '/portal/dashboard'),
    _Tab(icon: Icons.people_outline_rounded, label: 'HR', path: '/portal/hr'),
    _Tab(
        icon: Icons.receipt_long_outlined,
        label: 'Finance',
        path: '/portal/finance'),
    _Tab(icon: Icons.menu_rounded, label: 'More', path: '/portal/more'),
  ];

  int _currentIndex(BuildContext context) {
    final loc = GoRouterState.of(context).matchedLocation;
    final idx = _tabs.indexWhere((t) => loc.startsWith(t.path));
    return idx < 0 ? 0 : idx;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex(context),
        onDestinationSelected: (i) => context.go(_tabs[i].path),
        destinations: _tabs
            .map((t) =>
                NavigationDestination(icon: Icon(t.icon), label: t.label))
            .toList(),
      ),
    );
  }
}

class _Tab {
  const _Tab({required this.icon, required this.label, required this.path});
  final IconData icon;
  final String label;
  final String path;
}
