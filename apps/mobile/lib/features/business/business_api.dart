import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_error.dart';
import '../../core/network/dio_provider.dart';

final businessApiProvider = Provider((ref) => BusinessApi(ref));

class BusinessApi {
  BusinessApi(this._ref);
  final Ref _ref;
  Dio get _dio => _ref.read(dioProvider);

  Future<List<Map<String, dynamic>>> corporateAccounts() async {
    try {
      final res = await _dio.get('/customer/corporate-accounts');
      return (res.data as List).cast<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    } catch (e) {
      throw Exception(apiErrorMessage(e));
    }
  }

  Future<List<Map<String, dynamic>>> invoices() async {
    try {
      final res = await _dio.get('/customer/invoices');
      return (res.data as List).cast<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    } catch (e) {
      throw Exception(apiErrorMessage(e));
    }
  }

  Future<List<Map<String, dynamic>>> team() async {
    try {
      final res = await _dio.get('/customer/team');
      return (res.data as List).cast<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    } catch (e) {
      throw Exception(apiErrorMessage(e));
    }
  }

  Future<void> addTeamMember(String email, {String role = 'MEMBER'}) async {
    try {
      await _dio.post('/customer/team', data: {'email': email, 'role': role});
    } catch (e) {
      throw Exception(apiErrorMessage(e));
    }
  }

  Future<void> removeTeamMember(String membershipId) async {
    try {
      await _dio.delete('/customer/team/$membershipId');
    } catch (e) {
      throw Exception(apiErrorMessage(e));
    }
  }
}
