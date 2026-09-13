import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../auth/session.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionProvider);
    final name = session?.user.displayName ?? 'there';
    return Scaffold(
      appBar: AppBar(title: const Text('TumaNow')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(
            'Hi, $name',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: AppColors.navy,
                ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Send packages across Rwanda with trusted operators.',
            style: TextStyle(color: AppColors.muted),
          ),
          const SizedBox(height: 24),
          _ActionCard(
            icon: Icons.add_box_outlined,
            title: 'New shipment',
            subtitle: 'Match operators and create a delivery',
            onTap: () => context.push('/shipments/new'),
          ),
          const SizedBox(height: 12),
          _ActionCard(
            icon: Icons.inventory_2_outlined,
            title: 'My shipments',
            subtitle: 'See status, pay, and details',
            onTap: () => context.go('/shipments'),
          ),
          const SizedBox(height: 12),
          _ActionCard(
            icon: Icons.travel_explore_outlined,
            title: 'Track a package',
            subtitle: 'Public tracking by number',
            onTap: () => context.go('/track'),
          ),
        ],
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        onTap: onTap,
        leading: CircleAvatar(
          backgroundColor: AppColors.primary.withValues(alpha: 0.12),
          foregroundColor: AppColors.primary,
          child: Icon(icon),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
      ),
    );
  }
}
