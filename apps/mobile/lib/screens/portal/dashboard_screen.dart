import 'package:flutter/material.dart';
import '../../theme/theme.dart';
import '../../services/auth_service.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  String _userName = 'there';

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    final session = await AuthService.instance.getSession();
    if (mounted && session != null) {
      final name = session['user']?['name'] as String? ?? '';
      setState(() => _userName = name.split(' ').first.isNotEmpty ? name.split(' ').first : 'there');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Hey, $_userName 👋', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            Text("Here's your overview", style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurface.withAlpha(128))),
          ],
        ),
        actions: [
          IconButton(icon: const Icon(Icons.notifications_outlined, size: 20), onPressed: () {}),
          const SizedBox(width: 4),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadUser,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Stats grid
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.5,
              children: const [
                _StatCard(label: 'Total Employees', value: '—', delta: null, icon: Icons.people_outline_rounded),
                _StatCard(label: 'Open Invoices', value: '—', delta: null, icon: Icons.receipt_long_outlined),
                _StatCard(label: 'Active Projects', value: '—', delta: null, icon: Icons.folder_outlined),
                _StatCard(label: 'Pending Leaves', value: '—', delta: null, icon: Icons.event_available_outlined),
              ],
            ),
            const SizedBox(height: 20),

            // Recent activity header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Recent Activity', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                Text('View all', style: TextStyle(fontSize: 12, color: AppColors.blue)),
              ],
            ),
            const SizedBox(height: 12),

            // Empty state
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Theme.of(context).cardTheme.color,
                border: Border.all(color: Theme.of(context).brightness == Brightness.dark ? AppColors.borderDark : AppColors.borderLight),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Column(
                children: [
                  Icon(Icons.inbox_outlined, size: 32, color: AppColors.textMutedDark),
                  SizedBox(height: 8),
                  Text('No recent activity', style: TextStyle(fontSize: 13, color: AppColors.textMutedDark)),
                  SizedBox(height: 4),
                  Text('Activity will appear here once you start using the platform.', textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: AppColors.textMutedDark)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.delta,
    required this.icon,
  });

  final String label;
  final String value;
  final String? delta;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        border: Border.all(
          color: Theme.of(context).brightness == Brightness.dark ? AppColors.borderDark : AppColors.borderLight,
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(icon, size: 16, color: AppColors.blue),
              if (delta != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.success.withAlpha(25),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(delta!, style: const TextStyle(fontSize: 10, color: AppColors.success, fontWeight: FontWeight.w600)),
                ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
              Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textMutedDark)),
            ],
          ),
        ],
      ),
    );
  }
}
