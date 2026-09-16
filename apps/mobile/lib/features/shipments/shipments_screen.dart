import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import 'shipments_api.dart';
import 'shipment_date.dart';

final shipmentsListProvider = FutureProvider.autoDispose((ref) {
  return ref.watch(shipmentsApiProvider).list();
});

class ShipmentsScreen extends ConsumerWidget {
  const ShipmentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(shipmentsListProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('My shipments'),
        actions: [
          IconButton(
            onPressed: () => context.push('/shipments/new'),
            icon: const Icon(Icons.add),
          ),
        ],
      ),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('$e')),
        data: (rows) {
          if (rows.isEmpty) {
            return const Center(child: Text('No shipments yet'));
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(shipmentsListProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: rows.length,
              separatorBuilder: (context, index) => const SizedBox(height: 10),
              itemBuilder: (context, i) {
                final row = rows[i];
                final tracking = row['trackingNumber']?.toString() ?? '—';
                final status = row['status']?.toString() ?? '';
                final isCod = row['isCod'] == true;
                final created = shipmentCreatedLabel(context, row);
                final completion = shipmentCompletionLabel(context, row);
                return Card(
                  child: ListTile(
                    onTap: () => context.push('/shipments/${row['id']}'),
                    title: Text(tracking, style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text(
                      '${row['pickupAddress']} → ${row['deliveryAddress']}'
                      '${created == null ? '' : '\n$created'}'
                      '${completion == null ? '' : '\n$completion'}',
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(status, style: const TextStyle(fontSize: 11, color: AppColors.muted)),
                        if (isCod)
                          const Text('COD', style: TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.w700)),
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
