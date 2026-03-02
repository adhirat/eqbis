import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../theme/theme.dart';

class HrScreen extends StatefulWidget {
  const HrScreen({super.key});

  @override
  State<HrScreen> createState() => _HrScreenState();
}

class _HrScreenState extends State<HrScreen> {
  List<dynamic> _employees = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await apiService.get('/hr/employees', params: {'status': 'active'});
      setState(() { _employees = data['employees'] as List<dynamic>? ?? []; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('HR — Employees')),
      body: _loading
        ? const Center(child: CircularProgressIndicator())
        : _error != null
          ? Center(child: Text(_error!, style: const TextStyle(color: EqbisTheme.danger)))
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _employees.length,
                itemBuilder: (c, i) {
                  final emp = _employees[i] as Map<String, dynamic>;
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: EqbisTheme.accent.withAlpha(30),
                        child: Text(
                          '${emp['first_name']?[0] ?? ''}${emp['last_name']?[0] ?? ''}',
                          style: const TextStyle(color: EqbisTheme.accent, fontWeight: FontWeight.w600, fontSize: 13),
                        ),
                      ),
                      title: Text('${emp['first_name']} ${emp['last_name']}',
                        style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14)),
                      subtitle: Text(emp['job_title'] ?? emp['department'] ?? '',
                        style: Theme.of(context).textTheme.bodySmall),
                      trailing: Text(emp['custom_id'] ?? '',
                        style: const TextStyle(fontSize: 11, color: EqbisTheme.textMuted, fontFamily: 'monospace')),
                    ),
                  );
                },
              ),
            ),
    );
  }
}
