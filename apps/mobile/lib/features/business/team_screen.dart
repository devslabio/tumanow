import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_error.dart';
import '../../core/theme/app_colors.dart';
import '../auth/session.dart';
import 'business_api.dart';

final teamProvider = FutureProvider.autoDispose((ref) {
  return ref.watch(businessApiProvider).team();
});

class TeamScreen extends ConsumerStatefulWidget {
  const TeamScreen({super.key});
  @override
  ConsumerState<TeamScreen> createState() => _TeamScreenState();
}

class _TeamScreenState extends ConsumerState<TeamScreen> {
  bool _busy = false;

  Future<void> _addMember() async {
    final controller = TextEditingController();
    final email = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add teammate'),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(
            labelText: "Their TumaNow account email",
            hintText: 'colleague@example.com',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, controller.text.trim()),
            child: const Text('Add'),
          ),
        ],
      ),
    );
    if (email == null || email.isEmpty || !mounted) return;

    setState(() => _busy = true);
    try {
      await ref.read(businessApiProvider).addTeamMember(email);
      ref.invalidate(teamProvider);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(apiErrorMessage(e))),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _removeMember(String membershipId) async {
    setState(() => _busy = true);
    try {
      await ref.read(businessApiProvider).removeTeamMember(membershipId);
      ref.invalidate(teamProvider);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(apiErrorMessage(e))),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionProvider);
    final isBusiness = session?.customerType == 'BUSINESS';
    final isOwner = isBusiness && session?.customerRole == 'OWNER';
    final async = ref.watch(teamProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Team'),
        actions: [
          if (isOwner)
            IconButton(
              onPressed: _busy ? null : _addMember,
              icon: const Icon(Icons.person_add_alt_1_outlined),
            ),
        ],
      ),
      body: Column(
        children: [
          if (!isBusiness)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              color: AppColors.field,
              child: const Text(
                'Teams are for business accounts. Register a company account to invite teammates.',
                style: TextStyle(color: AppColors.muted),
              ),
            ),
          Expanded(
            child: async.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('$e')),
              data: (rows) {
                return RefreshIndicator(
                  onRefresh: () async => ref.invalidate(teamProvider),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: rows.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 10),
                    itemBuilder: (context, i) {
                      final row = rows[i];
                      final role = row['role']?.toString() ?? 'MEMBER';
                      final membershipId = row['membershipId']?.toString();
                      return Card(
                        child: ListTile(
                          title: Text(
                            row['fullName']?.toString() ?? row['email']?.toString() ?? '—',
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                          subtitle: Text(row['email']?.toString() ?? ''),
                          trailing: isOwner && membershipId != null
                              ? IconButton(
                                  onPressed: _busy ? null : () => _removeMember(membershipId),
                                  icon: const Icon(Icons.close, color: AppColors.error),
                                )
                              : Text(
                                  role,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: role == 'OWNER' ? Colors.green.shade700 : AppColors.muted,
                                  ),
                                ),
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
