import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_error.dart';
import '../../core/network/dio_provider.dart';

final riderApiProvider = Provider((ref) => RiderApi(ref));

class RiderApi {
  RiderApi(this._ref);
  final Ref _ref;
  Dio get _dio => _ref.read(dioProvider);

  Future<Map<String, dynamic>> me() async {
    try {
      final res = await _dio.get('/rider/me');
      return Map<String, dynamic>.from(res.data as Map);
    } catch (e) {
      throw Exception(apiErrorMessage(e));
    }
  }

  Future<List<Map<String, dynamic>>> jobs() async {
    try {
      final res = await _dio.get('/rider/shipments');
      return (res.data as List).cast<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    } catch (e) {
      throw Exception(apiErrorMessage(e));
    }
  }

  Future<List<Map<String, dynamic>>> history() async {
    try {
      final res = await _dio.get('/rider/shipments/history');
      return (res.data as List).cast<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    } catch (e) {
      throw Exception(apiErrorMessage(e));
    }
  }

  Future<Map<String, dynamic>> get(String id) async {
    try {
      final res = await _dio.get('/rider/shipments/$id');
      return Map<String, dynamic>.from(res.data as Map);
    } catch (e) {
      throw Exception(apiErrorMessage(e));
    }
  }

  Future<void> updateStatus(String id, String status, {String? failureReason}) async {
    try {
      await _dio.post('/rider/shipments/$id/status', data: {
        'status': status,
        if (failureReason != null) 'failureReason': failureReason,
      });
    } catch (e) {
      throw Exception(apiErrorMessage(e));
    }
  }

  Future<Map<String, dynamic>> generatePod(String id) async {
    try {
      final res = await _dio.post('/rider/shipments/$id/pod/generate');
      return Map<String, dynamic>.from(res.data as Map);
    } catch (e) {
      throw Exception(apiErrorMessage(e));
    }
  }

  Future<void> verifyPod(String id, {required String otp, String? recipientName}) async {
    try {
      await _dio.post('/rider/shipments/$id/pod/verify', data: {
        'otp': otp,
        'recipientName': ?recipientName,
      });
    } catch (e) {
      throw Exception(apiErrorMessage(e));
    }
  }

  Future<void> collectCod(String id) async {
    try {
      await _dio.post('/rider/shipments/$id/cod/collect', data: {});
    } catch (e) {
      throw Exception(apiErrorMessage(e));
    }
  }

  Future<void> setAvailability(String status) async {
    try {
      await _dio.post('/rider/availability', data: {'status': status});
    } catch (e) {
      throw Exception(apiErrorMessage(e));
    }
  }
}
