import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class StorageService {
  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _userDataKey = 'user_data';
  static const _isFirstLaunchKey = 'is_first_launch';
  static const _guestTrialStartedAtKey = 'guest_trial_started_at_ms';
  static const _guestAuthPromptLastShownAtKey = 'guest_auth_prompt_last_shown_at_ms';

  static const _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  static Future<void> _saveTokenFallback(String key, String value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(key, value);
  }

  static Future<String?> _readTokenFallback(String key) async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(key);
  }

  static Future<void> _removeTokenFallback(String key) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(key);
  }

  // Token Management
  static Future<void> saveTokens(
    String accessToken,
    String refreshToken,
  ) async {
    try {
      await _secureStorage.write(key: _accessTokenKey, value: accessToken);
      await _secureStorage.write(key: _refreshTokenKey, value: refreshToken);
    } on MissingPluginException {
      // Fall back to shared preferences if secure storage is not ready yet.
    } on PlatformException {
      // Fall back to shared preferences if secure storage is unavailable.
    }

    await _saveTokenFallback(_accessTokenKey, accessToken);
    await _saveTokenFallback(_refreshTokenKey, refreshToken);
  }

  static Future<String?> getAccessToken() async {
    try {
      final token = await _secureStorage.read(key: _accessTokenKey);
      if (token != null && token.isNotEmpty) {
        return token;
      }
    } on MissingPluginException {
      // Fall back to shared preferences if secure storage plugin is unavailable.
    } on PlatformException {
      // Fall back to shared preferences if secure storage plugin errors.
    }

    return _readTokenFallback(_accessTokenKey);
  }

  static Future<String?> getRefreshToken() async {
    try {
      final token = await _secureStorage.read(key: _refreshTokenKey);
      if (token != null && token.isNotEmpty) {
        return token;
      }
    } on MissingPluginException {
      // Fall back to shared preferences if secure storage plugin is unavailable.
    } on PlatformException {
      // Fall back to shared preferences if secure storage plugin errors.
    }

    return _readTokenFallback(_refreshTokenKey);
  }

  static Future<void> clearTokens() async {
    try {
      await _secureStorage.delete(key: _accessTokenKey);
      await _secureStorage.delete(key: _refreshTokenKey);
    } on MissingPluginException {
      // Fall back to shared preferences if secure storage plugin is unavailable.
    } on PlatformException {
      // Fall back to shared preferences if secure storage plugin errors.
    }

    await _removeTokenFallback(_accessTokenKey);
    await _removeTokenFallback(_refreshTokenKey);
  }

  // User Data Management
  static Future<void> saveUserData(Map<String, dynamic> userData) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userDataKey, jsonEncode(userData));
  }

  static Future<Map<String, dynamic>?> getUserData() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString(_userDataKey);
    if (data != null) {
      return jsonDecode(data) as Map<String, dynamic>;
    }
    return null;
  }

  static Future<void> clearUserData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_userDataKey);
  }

  // First Launch Check
  static Future<bool> isFirstLaunch() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_isFirstLaunchKey) ?? true;
  }

  static Future<void> setFirstLaunchComplete() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_isFirstLaunchKey, false);
  }

  // Guest Trial Management
  static Future<DateTime> getOrCreateGuestTrialStartedAt() async {
    final prefs = await SharedPreferences.getInstance();
    final storedMs = prefs.getInt(_guestTrialStartedAtKey);
    if (storedMs != null) {
      return DateTime.fromMillisecondsSinceEpoch(storedMs);
    }

    final now = DateTime.now();
    await prefs.setInt(_guestTrialStartedAtKey, now.millisecondsSinceEpoch);
    return now;
  }

  static Future<DateTime?> getGuestAuthPromptLastShownAt() async {
    final prefs = await SharedPreferences.getInstance();
    final storedMs = prefs.getInt(_guestAuthPromptLastShownAtKey);
    if (storedMs == null) return null;
    return DateTime.fromMillisecondsSinceEpoch(storedMs);
  }

  static Future<void> setGuestAuthPromptLastShownAt(DateTime value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_guestAuthPromptLastShownAtKey, value.millisecondsSinceEpoch);
  }

  // Clear All
  static Future<void> clearAll() async {
    await clearTokens();
    await clearUserData();
  }
}
