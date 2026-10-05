import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../auth/session.dart';
import 'customer_shell.dart';
import 'rider_shell.dart';

/// Picks customer vs rider bottom nav from the logged-in role.
class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionProvider);
    if (session?.isRider == true) {
      return RiderShell(child: child);
    }
    return CustomerShell(child: child);
  }
}
