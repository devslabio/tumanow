import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_error.dart';
import '../../core/network/dio_provider.dart';

final notificationsApiProvider = Provider((ref) => NotificationsApi(ref));

final notificationsProvider = FutureProvider.autoDispose((ref) {
  return ref.watch(notificationsApiProvider).list();
});

class NotificationsApi {
  NotificationsApi(this._ref);
  final Ref _ref;
  Dio get _dio => _ref.read(dioProvider);

  Future<List<Map<String, dynamic>>> list() async {
    try {
      final res = await _dio.get('/notifications/me');
      return (res.data as List)
          .cast<Map>()
          .map((row) => Map<String, dynamic>.from(row))
          .toList();
    } catch (e) {
      throw Exception(apiErrorMessage(e));
    }
  }

  Future<void> markRead(String id) async {
    try {
      await _dio.post('/notifications/$id/read');
    } catch (e) {
      throw Exception(apiErrorMessage(e));
    }
  }
}
