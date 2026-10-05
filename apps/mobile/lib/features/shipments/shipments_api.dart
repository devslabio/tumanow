import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_error.dart';
import '../../core/network/dio_provider.dart';

final shipmentsApiProvider = Provider((ref) => ShipmentsApi(ref));

final customerDashboardProvider = FutureProvider.autoDispose((ref) {
  return ref.watch(shipmentsApiProvider).dashboardSummary();
});

class ShipmentsApi {
  ShipmentsApi(this._ref);
  final Ref _ref;
  Dio get _dio => _ref.read(dioProvider);

  Future<List<Map<String, dynamic>>> list() async {
    try {
      final res = await _dio.get('/customer/shipments');
      return (res.data as List).cast<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    } catch (e) {
      throw Exception(apiErrorMessage(e));
    }
  }

  Future<Map<String, dynamic>> dashboardSummary() async {
    try {
      final res = await _dio.get('/customer/dashboard/summary');
      return Map<String, dynamic>.from(res.data as Map);
    } catch (e) {
      throw Exception(apiErrorMessage(e));
    }
  }

  Future<Map<String, dynamic>> get(String id) async {
    try {
      final res = await _dio.get('/customer/shipments/$id');
      return Map<String, dynamic>.from(res.data as Map);
    } catch (e) {
      throw Exception(apiErrorMessage(e));
    }
  }

  Future<Map<String, dynamic>> create(Map<String, dynamic> body) async {
    try {
      final res = await _dio.post('/customer/shipments', data: body);
      return Map<String, dynamic>.from(res.data as Map);
    } catch (e) {
      throw Exception(apiErrorMessage(e));
    }
  }

  Future<List<Map<String, dynamic>>> match(Map<String, dynamic> body) async {
    try {
      final res = await _dio.post('/customer/quotes/match', data: body);
      return (res.data as List).cast<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    } catch (e) {
      throw Exception(apiErrorMessage(e));
    }
  }

  Future<Map<String, dynamic>> track(String number) async {
    try {
      final res = await _dio.get('/tracking/$number');
      return Map<String, dynamic>.from(res.data as Map);
    } catch (e) {
      throw Exception(apiErrorMessage(e));
    }
  }

  Future<Map<String, dynamic>> pay(String shipmentId, {required String method, String? payerPhone}) async {
    try {
      final res = await _dio.post(
        '/customer/shipments/$shipmentId/pay',
        data: {
          'method': method,
          if (payerPhone != null && payerPhone.isNotEmpty) 'payerPhone': payerPhone,
        },
      );
      return Map<String, dynamic>.from(res.data as Map);
    } catch (e) {
      throw Exception(apiErrorMessage(e));
    }
  }
}
