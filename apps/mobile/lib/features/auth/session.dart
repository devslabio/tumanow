import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/network/api_error.dart';
import '../../core/network/dio_provider.dart';
import '../../core/providers/shared_preferences_provider.dart';

class TnUser {
  const TnUser({
    required this.id,
    required this.email,
    this.fullName,
    this.phone,
  });
  final String id;
  final String email;
  final String? fullName;
  final String? phone;

  factory TnUser.fromJson(Map<String, dynamic> json) => TnUser(
        id: json['id'] as String,
        email: json['email'] as String? ?? '',
        fullName: json['fullName'] as String?,
        phone: json['phone'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'fullName': fullName,
        'phone': phone,
      };

  String get displayName =>
      (fullName?.trim().isNotEmpty == true) ? fullName!.trim() : email;
}

enum AppRole { customer, rider }

class TnSession {
  const TnSession({
    required this.accessToken,
    required this.user,
    this.customerId,
    this.isCustomer,
    this.driverId,
    this.operatorId,
    this.roleKey,
  });

  final String accessToken;
  final TnUser user;
  final String? customerId;
  final bool? isCustomer;
  final String? driverId;
  final String? operatorId;
  final String? roleKey;

  bool get isRider =>
      (driverId != null && driverId!.isNotEmpty) || roleKey == 'DRIVER';

  bool get isCustomerRole =>
      !isRider && (isCustomer == true || customerId != null);

  AppRole get appRole => isRider ? AppRole.rider : AppRole.customer;

  String get homePath => isRider ? '/jobs' : '/home';
}

const _kAccess = 'tumanow_mobile_access';
const _kUser = 'tumanow_mobile_user';
const _kMeta = 'tumanow_mobile_meta';

final sessionProvider =
    StateNotifierProvider<SessionNotifier, TnSession?>((ref) {
  return SessionNotifier(ref);
});

class SessionNotifier extends StateNotifier<TnSession?> {
  SessionNotifier(this._ref) : super(null) {
    _restore();
  }
  final Ref _ref;
  SharedPreferences get _prefs => _ref.read(sharedPreferencesProvider);

  void _restore() {
    final access = _prefs.getString(_kAccess);
    final userRaw = _prefs.getString(_kUser);
    final metaRaw = _prefs.getString(_kMeta);
    if (access == null || userRaw == null) return;
    try {
      final user = TnUser.fromJson(jsonDecode(userRaw) as Map<String, dynamic>);
      final meta = metaRaw == null
          ? <String, dynamic>{}
          : jsonDecode(metaRaw) as Map<String, dynamic>;
      state = TnSession(
        accessToken: access,
        user: user,
        customerId: meta['customerId'] as String?,
        isCustomer: meta['isCustomer'] as bool?,
        driverId: meta['driverId'] as String?,
        operatorId: meta['operatorId'] as String?,
        roleKey: meta['roleKey'] as String?,
      );
    } catch (_) {}
  }

  Future<void> applyAuthResponse(Map<String, dynamic> data) async {
    final token = data['accessToken'] as String?;
    final userJson = data['user'] as Map<String, dynamic>?;
    if (token == null || userJson == null) {
      throw Exception('Invalid login response');
    }

    final session = TnSession(
      accessToken: token,
      user: TnUser.fromJson(userJson),
      customerId: data['customerId'] as String?,
      isCustomer: data['isCustomer'] as bool?,
      driverId: data['driverId'] as String?,
      operatorId: data['operatorId'] as String?,
      roleKey: data['roleKey'] as String?,
    );

    if (!session.isRider && !session.isCustomerRole) {
      throw Exception(
        'This account is for the web console. Use a customer or rider demo login.',
      );
    }

    await _prefs.setString(_kAccess, session.accessToken);
    await _prefs.setString(_kUser, jsonEncode(session.user.toJson()));
    await _prefs.setString(
      _kMeta,
      jsonEncode({
        'customerId': session.customerId,
        'isCustomer': session.isCustomer,
        'driverId': session.driverId,
        'operatorId': session.operatorId,
        'roleKey': session.roleKey,
      }),
    );
    state = session;
  }

  Future<void> logout() async {
    await _prefs.remove(_kAccess);
    await _prefs.remove(_kUser);
    await _prefs.remove(_kMeta);
    state = null;
  }
}

final authApiProvider = Provider<AuthApi>((ref) => AuthApi(ref));

class AuthApi {
  AuthApi(this._ref);
  final Ref _ref;
  Dio get _dio => _ref.read(dioProvider);

  Future<Map<String, dynamic>> login({
    required String identifier,
    required String password,
  }) async {
    try {
      final res = await _dio.post(
        '/auth/login',
        data: {'identifier': identifier, 'password': password},
      );
      return Map<String, dynamic>.from(res.data as Map);
    } catch (e) {
      throw Exception(apiErrorMessage(e));
    }
  }
}
