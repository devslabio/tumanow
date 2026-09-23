import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import 'rider_api.dart';

final historyProvider = FutureProvider.autoDispose((ref) => ref.watch(riderApiProvider).history());

class HistoryScreen extends ConsumerWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(historyProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('History')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('$e')),
        data: (rows) {
          if (rows.isEmpty) {
            return RefreshIndicator(
              onRefresh: () async => ref.invalidate(historyProvider),
              child: ListView(
                children: [
                  SizedBox(height: MediaQuery.of(context).size.height * 0.2),
                  const Icon(Icons.history, size: 72, color: AppColors.border),
                  const SizedBox(height: 16),
                  const Text(
                    'No completed jobs yet',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.navy),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Delivered and failed shipments will appear here.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppColors.muted),
                  ),
                ],
              ),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: rows.length,
            separatorBuilder: (context, index) => const SizedBox(height: 10),
            itemBuilder: (context, i) {
              final row = rows[i];
              return Card(
                child: ListTile(
                  title: Text(row['trackingNumber']?.toString() ?? '—'),
                  subtitle: Text(row['status']?.toString() ?? '',
                      style: const TextStyle(color: AppColors.muted)),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
