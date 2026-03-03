import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/auth_service.dart';
import '../../theme/theme.dart';

class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('More')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _Section('Business', [
            _Item(Icons.people_outlined,       'CRM / Clients',    () {}),
            _Item(Icons.folder_outlined,        'Projects',         () {}),
            _Item(Icons.support_agent_outlined, 'Support Tickets',  () {}),
            _Item(Icons.email_outlined,         'Messages',         () {}),
          ]),
          const SizedBox(height: 16),
          _Section('HR', [
            _Item(Icons.schedule_outlined,     'Timesheets',        () {}),
            _Item(Icons.event_note_outlined,   'Leave Requests',    () {}),
            _Item(Icons.work_outline,          'Careers',           () {}),
          ]),
          const SizedBox(height: 16),
          _Section('Account', [
            _Item(Icons.business_outlined,   'Organisation',        () {}),
            _Item(Icons.people_alt_outlined, 'Users & Roles',       () {}),
            _Item(Icons.settings_outlined,   'Settings',            () {}),
          ]),
          const SizedBox(height: 24),
          Card(
            child: ListTile(
              leading: const Icon(Icons.logout_rounded, color: EqbisTheme.danger),
              title: const Text('Sign Out', style: TextStyle(color: EqbisTheme.danger)),
              onTap: () async {
                await authService.logout();
                if (context.mounted) context.go('/auth/login');
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  final String title;
  final List<Widget> children;
  const _Section(this.title, this.children);

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Padding(
        padding: const EdgeInsets.only(left: 4, bottom: 8),
        child: Text(title.toUpperCase(),
          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600,
            color: EqbisTheme.textMuted, letterSpacing: 0.8)),
      ),
      Card(
        child: Column(children: children),
      ),
    ],
  );
}

class _Item extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _Item(this.icon, this.label, this.onTap);

  @override
  Widget build(BuildContext context) => ListTile(
    leading: Icon(icon, size: 20, color: EqbisTheme.textMuted),
    title: Text(label, style: const TextStyle(fontSize: 14)),
    trailing: const Icon(Icons.chevron_right, size: 18, color: EqbisTheme.textMuted),
    onTap: onTap,
    dense: true,
  );
}
