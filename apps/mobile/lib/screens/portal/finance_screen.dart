import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import '../../theme/theme.dart';

class FinanceScreen extends StatefulWidget {
  const FinanceScreen({super.key});

  @override
  State<FinanceScreen> createState() => _FinanceScreenState();
}

class _FinanceScreenState extends State<FinanceScreen> {
  List<dynamic> _invoices = [];
  Map<String, dynamic>? _stats;
  bool _loading = true;
  String? _error;

  final _fmt = NumberFormat.currency(locale: 'en_US', symbol: '\$');

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await apiService.get('/finance/invoices');
      setState(() {
        _invoices = data['invoices'] as List<dynamic>? ?? [];
        _stats    = data['stats']    as Map<String, dynamic>?;
        _loading  = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Color _statusColor(String status) => switch (status) {
    'paid'      => EqbisTheme.success,
    'overdue'   => EqbisTheme.danger,
    'sent'      => EqbisTheme.accent,
    'draft'     => EqbisTheme.textMuted,
    'cancelled' => EqbisTheme.textMuted,
    _           => EqbisTheme.textMuted,
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Finance — Invoices')),
      body: _loading
        ? const Center(child: CircularProgressIndicator())
        : _error != null
          ? Center(child: Text(_error!, style: const TextStyle(color: EqbisTheme.danger)))
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Stats row
                  if (_stats != null)
                    Row(
                      children: [
                        Expanded(child: _mini('Total', _fmt.format((_stats!['total'] as num?) ?? 0), EqbisTheme.text)),
                        const SizedBox(width: 8),
                        Expanded(child: _mini('Paid', _fmt.format((_stats!['paid'] as num?) ?? 0), EqbisTheme.success)),
                        const SizedBox(width: 8),
                        Expanded(child: _mini('Overdue', _fmt.format((_stats!['overdue'] as num?) ?? 0), EqbisTheme.danger)),
                      ],
                    ),

                  if (_stats != null) const SizedBox(height: 16),

                  ..._invoices.map((inv) {
                    final i = inv as Map<String, dynamic>;
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        title: Text(i['invoice_number'] ?? '',
                          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, fontFamily: 'monospace')),
                        subtitle: Text(i['client_name'] ?? '', style: Theme.of(context).textTheme.bodySmall),
                        trailing: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(_fmt.format((i['total'] as num?) ?? 0),
                              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                            Container(
                              margin: const EdgeInsets.only(top: 2),
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                              decoration: BoxDecoration(
                                color: _statusColor(i['status'] ?? '').withAlpha(30),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(i['status'] ?? '',
                                style: TextStyle(fontSize: 10, color: _statusColor(i['status'] ?? ''), fontWeight: FontWeight.w500)),
                            ),
                          ],
                        ),
                      ),
                    );
                  }),

                  if (_invoices.isEmpty)
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.all(32),
                        child: Text('No invoices yet', style: Theme.of(context).textTheme.bodySmall),
                      ),
                    ),
                ],
              ),
            ),
    );
  }

  Widget _mini(String label, String value, Color color) => Card(
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(value, style: TextStyle(fontWeight: FontWeight.w700, color: color, fontSize: 14)),
          Text(label, style: Theme.of(context).textTheme.labelSmall),
        ],
      ),
    ),
  );
}
