import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../theme/theme.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic>? _stats;
  List<dynamic> _activity = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await apiService.get('/dashboard');
      setState(() {
        _stats    = data['stats'] as Map<String, dynamic>;
        _activity = data['recentActivity'] as List<dynamic>? ?? [];
        _loading  = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, size: 20),
            onPressed: _load,
          ),
        ],
      ),
      body: _loading
        ? const Center(child: CircularProgressIndicator())
        : _error != null
          ? Center(child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(_error!, style: const TextStyle(color: EqbisTheme.danger)),
                const SizedBox(height: 12),
                ElevatedButton(onPressed: _load, child: const Text('Retry')),
              ],
            ))
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Text('Overview', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 12),

                  // Stats grid
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                    childAspectRatio: 1.6,
                    children: [
                      _StatCard('Employees',      _stats?['employees'],      Icons.people_rounded,         EqbisTheme.accent),
                      _StatCard('Open Invoices',  _stats?['invoicesOpen'],   Icons.receipt_long_rounded,   EqbisTheme.warning),
                      _StatCard('Paid Invoices',  _stats?['invoicesPaid'],   Icons.check_circle_rounded,   EqbisTheme.success),
                      _StatCard('Active Clients', _stats?['clients'],        Icons.business_rounded,       EqbisTheme.accent2),
                      _StatCard('Open Tickets',   _stats?['tickets'],        Icons.support_agent_rounded,  EqbisTheme.danger),
                      _StatCard('Pending Leaves', _stats?['pendingLeaves'],  Icons.event_busy_rounded,     EqbisTheme.warning),
                    ],
                  ),

                  const SizedBox(height: 24),
                  Text('Recent Activity', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 12),

                  ..._activity.map((a) => _ActivityItem(a as Map<String, dynamic>)),

                  if (_activity.isEmpty)
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Text('No recent activity', style: Theme.of(context).textTheme.bodySmall),
                      ),
                    ),
                ],
              ),
            ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final dynamic value;
  final IconData icon;
  final Color color;

  const _StatCard(this.label, this.value, this.icon, this.color);

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Icon(icon, color: color, size: 20),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(value?.toString() ?? '0',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: color)),
                Text(label,
                  style: Theme.of(context).textTheme.bodySmall,
                  maxLines: 1, overflow: TextOverflow.ellipsis),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ActivityItem extends StatelessWidget {
  final Map<String, dynamic> activity;
  const _ActivityItem(this.activity);

  @override
  Widget build(BuildContext context) {
    final action  = activity['action']  as String? ?? '';
    final module  = activity['module']  as String? ?? '';
    final details = activity['details'] as String? ?? '';

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 32, height: 32,
            decoration: BoxDecoration(
              color: EqbisTheme.surface,
              shape: BoxShape.circle,
              border: Border.all(color: EqbisTheme.border),
            ),
            child: Icon(_moduleIcon(module), size: 14, color: EqbisTheme.textMuted),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(details.isNotEmpty ? details : '$action in $module',
                  style: const TextStyle(fontSize: 13)),
                Text(module, style: Theme.of(context).textTheme.labelSmall),
              ],
            ),
          ),
        ],
      ),
    );
  }

  IconData _moduleIcon(String module) => switch (module) {
    'hr'       => Icons.people_outlined,
    'finance'  => Icons.receipt_long_outlined,
    'crm'      => Icons.business_outlined,
    'projects' => Icons.folder_outlined,
    'support'  => Icons.support_agent_outlined,
    _          => Icons.circle_outlined,
  };
}
