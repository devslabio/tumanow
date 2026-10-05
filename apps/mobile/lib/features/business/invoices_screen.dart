import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import 'business_api.dart';
import 'corporate_account_screen.dart' show corporateAccountsProvider;

final invoicesProvider = FutureProvider.autoDispose((ref) {
  return ref.watch(businessApiProvider).invoices();
});

String _money(dynamic v) {
  if (v == null) return '—';
  final n = num.tryParse(v.toString());
  if (n == null) return v.toString();
  return n.toStringAsFixed(0).replaceAllMapped(
        RegExp(r'\B(?=(\d{3})+(?!\d))'),
        (m) => ',',
      );
}

String _date(dynamic v) {
  if (v == null) return '—';
  final d = DateTime.tryParse(v.toString());
  if (d == null) return '—';
  return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
}

Color _statusColor(String status) {
  switch (status) {
    case 'PAID':
      return Colors.green.shade700;
    case 'VOID':
      return AppColors.muted;
    default:
      return Colors.amber.shade800;
  }
}

class InvoicesScreen extends ConsumerWidget {
  const InvoicesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Reuse the same provider corporate-account screen already fetches, so
    // navigating between them doesn't refire unnecessary requests.
    ref.watch(corporateAccountsProvider);
    final async = ref.watch(invoicesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Invoices')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('$e')),
        data: (rows) {
          if (rows.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'No invoices yet.',
                  style: TextStyle(color: AppColors.muted),
                ),
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(invoicesProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: rows.length,
              separatorBuilder: (context, index) => const SizedBox(height: 10),
              itemBuilder: (context, i) {
                final row = rows[i];
                final operator = row['operator'] as Map?;
                final courier = operator?['tradingName'] ?? operator?['legalName'] ?? '—';
                final status = row['status']?.toString() ?? '';
                final currency = row['currency']?.toString() ?? 'RWF';
                return Card(
                  child: ListTile(
                    title: Text(
                      row['invoiceNumber']?.toString() ?? '—',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    subtitle: Text(
                      '$courier\n${_date(row['periodStart'])} – ${_date(row['periodEnd'])}'
                      '${row['dueAt'] != null ? '\nDue ${_date(row['dueAt'])}' : ''}',
                      maxLines: 3,
                    ),
                    isThreeLine: true,
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          '${_money(row['totalAmount'])} $currency',
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        Text(
                          status,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: _statusColor(status),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
