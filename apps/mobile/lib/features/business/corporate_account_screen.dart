import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import 'business_api.dart';

final corporateAccountsProvider = FutureProvider.autoDispose((ref) {
  return ref.watch(businessApiProvider).corporateAccounts();
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

Color _statusColor(String status) {
  switch (status) {
    case 'ACTIVE':
      return Colors.green.shade700;
    case 'SUSPENDED':
      return AppColors.error;
    default:
      return AppColors.muted;
  }
}

class CorporateAccountScreen extends ConsumerWidget {
  const CorporateAccountScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(corporateAccountsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Corporate account')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('$e')),
        data: (rows) {
          if (rows.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  "No courier has set up postpaid terms for your company yet.",
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.muted),
                ),
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(corporateAccountsProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: rows.length,
              separatorBuilder: (context, index) => const SizedBox(height: 10),
              itemBuilder: (context, i) {
                final row = rows[i];
                final operator = row['operator'] as Map?;
                final name = operator?['tradingName'] ?? operator?['legalName'] ?? '—';
                final status = row['status']?.toString() ?? '';
                final currency = row['currency']?.toString() ?? 'RWF';
                return Card(
                  child: ListTile(
                    title: Text('$name', style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text('${_money(row['currentBalance'])} / ${_money(row['creditLimit'])} $currency'),
                    trailing: Text(
                      status,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: _statusColor(status),
                      ),
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
