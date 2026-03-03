import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class PortalShell extends StatelessWidget {
  final Widget child;
  const PortalShell({super.key, required this.child});

  int _selectedIndex(BuildContext context) {
    final loc = GoRouterState.of(context).matchedLocation;
    if (loc.startsWith('/portal/hr'))      return 1;
    if (loc.startsWith('/portal/finance')) return 2;
    if (loc.startsWith('/portal/more'))    return 3;
    return 0; // dashboard
  }

  void _onTap(BuildContext context, int idx) {
    switch (idx) {
      case 0: context.go('/portal/dashboard'); break;
      case 1: context.go('/portal/hr');        break;
      case 2: context.go('/portal/finance');   break;
      case 3: context.go('/portal/more');      break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex(context),
        onDestinationSelected: (i) => _onTap(context, i),
        destinations: const [
          NavigationDestination(
            icon:         Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard_rounded),
            label:        'Dashboard',
          ),
          NavigationDestination(
            icon:         Icon(Icons.people_outlined),
            selectedIcon: Icon(Icons.people_rounded),
            label:        'HR',
          ),
          NavigationDestination(
            icon:         Icon(Icons.receipt_long_outlined),
            selectedIcon: Icon(Icons.receipt_long_rounded),
            label:        'Finance',
          ),
          NavigationDestination(
            icon:         Icon(Icons.more_horiz_outlined),
            selectedIcon: Icon(Icons.more_horiz_rounded),
            label:        'More',
          ),
        ],
      ),
    );
  }
}
