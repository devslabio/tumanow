import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/login_screen.dart';
import '../../features/auth/session.dart';
import '../../features/home/home_screen.dart';
import '../../features/jobs/history_screen.dart';
import '../../features/jobs/job_detail_screen.dart';
import '../../features/jobs/jobs_screen.dart';
import '../../features/notifications/notifications_screen.dart';
import '../../features/profile/profile_screen.dart';
import '../../features/shell/app_shell.dart';
import '../../features/shipments/new_shipment_screen.dart';
import '../../features/shipments/shipment_detail_screen.dart';
import '../../features/shipments/shipments_screen.dart';
import '../../features/splash/splash_screen.dart';
import '../../features/track/track_screen.dart';

bool _isCustomerPath(String path) {
  return path == '/home' ||
      path.startsWith('/shipments') ||
      path == '/track';
}

bool _isRiderPath(String path) {
  return path == '/jobs' ||
      path.startsWith('/jobs/') ||
      path.startsWith('/history');
}

final goRouterProvider = Provider<GoRouter>((ref) {
  final session = ref.watch(sessionProvider);
  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) {
      final path = state.uri.path;
      final loggedIn = session != null;

      if (path == '/splash') return null;
      if (!loggedIn && path != '/login') return '/login';
      if (!loggedIn) return null;

      final home = session.homePath;
      if (path == '/login') return home;

      if (session.isRider && _isCustomerPath(path)) return '/jobs';
      if (session.isCustomerRole && _isRiderPath(path)) return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (context, state) => const SplashScreen()),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      ShellRoute(
        builder: (context, state, child) => AppShell(child: child),
        routes: [
          GoRoute(path: '/home', builder: (context, state) => const HomeScreen()),
          GoRoute(
            path: '/shipments',
            builder: (context, state) => const ShipmentsScreen(),
          ),
          GoRoute(path: '/track', builder: (context, state) => const TrackScreen()),
          GoRoute(
            path: '/notifications',
            builder: (context, state) => const NotificationsScreen(),
          ),
          GoRoute(path: '/jobs', builder: (context, state) => const JobsScreen()),
          GoRoute(
            path: '/history',
            builder: (context, state) => const HistoryScreen(),
          ),
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfileScreen(),
          ),
        ],
      ),
      GoRoute(
        path: '/shipments/new',
        builder: (context, state) => const NewShipmentScreen(),
      ),
      GoRoute(
        path: '/shipments/:id',
        builder: (context, state) =>
            ShipmentDetailScreen(id: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/jobs/:id',
        builder: (context, state) =>
            JobDetailScreen(id: state.pathParameters['id']!),
      ),
    ],
  );
});
