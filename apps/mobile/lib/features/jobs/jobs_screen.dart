import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import 'rider_api.dart';

final jobsProvider = FutureProvider.autoDispose((ref) => ref.watch(riderApiProvider).jobs());

class JobsScreen extends ConsumerWidget {
  const JobsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(jobsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Active jobs')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('$e')),
        data: (rows) {
          if (rows.isEmpty) {
            return RefreshIndicator(
              onRefresh: () async => ref.invalidate(jobsProvider),
              child: ListView(
                children: [
                  SizedBox(height: MediaQuery.of(context).size.height * 0.2),
                  const Icon(Icons.local_shipping_outlined, size: 72, color: AppColors.border),
                  const SizedBox(height: 16),
                  const Text(
                    'No active jobs',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.navy),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'New assignments will appear here.\nPull down to refresh.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppColors.muted),
                  ),
                ],
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(jobsProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: rows.length,
              separatorBuilder: (context, index) => const SizedBox(height: 10),
              itemBuilder: (context, i) {
                final row = rows[i];
                return Card(
                  child: ListTile(
                    onTap: () => context.push('/jobs/${row['id']}'),
                    title: Text(row['trackingNumber']?.toString() ?? '—',
                        style: const TextStyle(fontWeight: FontWeight.w700)),
                    subtitle: Text(
                      '${row['pickupAddress']} → ${row['deliveryAddress']}',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    trailing: Text(
                      row['status']?.toString() ?? '',
                      style: const TextStyle(fontSize: 11, color: AppColors.muted),
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
