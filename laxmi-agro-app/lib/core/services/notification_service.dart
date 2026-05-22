import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';

import '../providers/auth_provider.dart';
import '../../main.dart';

/// Handles background messages (must be top-level function)
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('[FCM] Background message: ${message.messageId}');
}

class NotificationService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final Ref _ref;
  String? _currentToken;

  NotificationService(this._ref);

  Future<void> initialize() async {
    // Request permission (Android 13+ requires explicit permission)
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    debugPrint('[FCM] Permission status: ${settings.authorizationStatus}');

    if (settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional) {
      await _getAndRegisterToken();
      _setupTokenRefreshListener();
      _setupForegroundMessageHandler();
    }
  }

  Future<void> _getAndRegisterToken() async {
    try {
      final token = await _messaging.getToken();
      if (token != null) {
        _currentToken = token;
        debugPrint('[FCM] Token: ${token.substring(0, 20)}...');
        await _registerTokenWithBackend(token);
      }
    } catch (e) {
      debugPrint('[FCM] Error getting token: $e');
    }
  }

  void _setupTokenRefreshListener() {
    _messaging.onTokenRefresh.listen((newToken) async {
      debugPrint('[FCM] Token refreshed');
      _currentToken = newToken;
      await _registerTokenWithBackend(newToken);
    });
  }

  void _setupForegroundMessageHandler() {
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint('[FCM] Foreground message: ${message.notification?.title}');
      
      if (message.notification != null) {
        final title = message.notification?.title ?? 'Notification';
        final body = message.notification?.body ?? '';
        
        scafoldMessengerKey.currentState?.showSnackBar(
          SnackBar(
            content: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                if (body.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(body, style: const TextStyle(fontSize: 14)),
                ],
              ],
            ),
            behavior: SnackBarBehavior.floating,
            margin: const EdgeInsets.only(top: 10, left: 16, right: 16, bottom: 20),
            backgroundColor: title.contains('Approved') || title.contains('Upgraded') ? Colors.green.shade700 : Colors.blue.shade700,
            duration: const Duration(seconds: 5),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
      
      if (message.data['type'] == 'ROLE_UPDATED') {
        _ref.read(authProvider.notifier).fetchCurrentUser();
      }
    });

    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      debugPrint('[FCM] Message opened app: ${message.data}');
      
      if (message.data['type'] == 'ROLE_UPDATED') {
        _ref.read(authProvider.notifier).fetchCurrentUser();
      }
    });
  }

  Future<void> _registerTokenWithBackend(String token) async {
    try {
      final api = _ref.read(apiClientProvider);
      await api.post('/notifications/register-token', data: {
        'fcmToken': token,
        'platform': 'android',
      });
      debugPrint('[FCM] Token registered with backend');
    } on DioException catch (e) {
      // Don't crash if backend is unavailable — token will be re-sent on next refresh
      debugPrint('[FCM] Failed to register token: ${e.message}');
    }
  }

  String? get currentToken => _currentToken;
}

final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService(ref);
});
