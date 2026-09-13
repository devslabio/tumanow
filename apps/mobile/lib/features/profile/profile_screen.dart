import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../auth/session.dart';
import '../jobs/rider_api.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});
  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  Map<String, dynamic>? _riderMe;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final session = ref.read(sessionProvider);
      if (session?.isRider != true) return;
      ref.read(riderApiProvider).me().then((v) {
        if (mounted) setState(() => _riderMe = v);
      }).catchError((_) {});
    });
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionProvider);
    final isRider = session?.isRider == true;
    final status = _riderMe?['status']?.toString() ?? '—';
    final vehicle = _riderMe?['vehicle'] as Map?;

    return Scaffold(
      appBar: AppBar(title: Text(isRider ? 'Rider profile' : 'Profile')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          ListTile(
            title: Text(session?.user.displayName ?? '—'),
            subtitle: Text(session?.user.email ?? ''),
          ),
          ListTile(
            title: const Text('Role'),
            subtitle: Text(isRider ? 'Rider' : 'Customer'),
          ),
          if (isRider) ...[
            ListTile(
              title: const Text('Availability'),
              subtitle: Text(status),
            ),
            if (vehicle != null)
              ListTile(
                title: const Text('Vehicle'),
                subtitle: Text(
                  '${vehicle['registrationNo']} · ${vehicle['label'] ?? vehicle['type']}',
                ),
              ),
            const Divider(),
            Wrap(
              spacing: 8,
              children: [
                for (final s in ['AVAILABLE', 'OFFLINE', 'BUSY'])
                  OutlinedButton(
                    onPressed: () async {
                      await ref.read(riderApiProvider).setAvailability(s);
                      final me = await ref.read(riderApiProvider).me();
                      if (mounted) setState(() => _riderMe = me);
                    },
                    child: Text(s),
                  ),
              ],
            ),
            const SizedBox(height: 12),
          ],
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout, color: AppColors.error),
            title: const Text('Sign out'),
            onTap: () async {
              await ref.read(sessionProvider.notifier).logout();
              if (context.mounted) context.go('/login');
            },
          ),
        ],
      ),
    );
  }
}
