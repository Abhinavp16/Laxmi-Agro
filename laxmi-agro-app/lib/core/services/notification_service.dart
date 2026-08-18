import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:firebase_core/firebase_core.dart';

import '../providers/auth_provider.dart';
import '../../main.dart';
import 'local_notification_service.dart';
import 'notification_navigation_service.dart';

/// Handles background messages (must be top-level function)
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    if (Firebase.apps.isEmpty) {
      await Firebase.initializeApp();
    }
  } catch (_) {}
  debugPrint('[FCM] Background message: ${message.messageId}');
  await LocalNotificationService.instance.handleRemoteMessage(message);
}

class NotificationService {
  final Ref _ref;
  String? _currentToken;
  Future<void>? _lifecycleInitialization;
  bool _messageHandlersInstalled = false;
  bool _tokenRefreshListenerInstalled = false;
  bool _priceCountdownSynced = false;

  NotificationService(this._ref);

  Future<void> initialize({bool requestPermission = false}) async {
    if (Firebase.apps.isEmpty) {
      debugPrint('[FCM] Firebase not configured, skipping notifications');
      return;
    }

    final messaging = FirebaseMessaging.instance;
    await _ensureLifecycleInitialized(messaging);

    final settings = requestPermission
        ? await messaging.requestPermission(
            alert: true,
            badge: true,
            sound: true,
            provisional: false,
          )
        : await messaging.getNotificationSettings();

    debugPrint('[FCM] Permission status: ${settings.authorizationStatus}');
    await messaging.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional) {
      await _getAndRegisterToken(messaging);
      _setupTokenRefreshListener(messaging);
      if (!_priceCountdownSynced &&
          !kIsWeb &&
          defaultTargetPlatform == TargetPlatform.android) {
        _priceCountdownSynced = await _syncActivePriceCountdownFromBackend();
      }
    }
  }

  Future<void> _ensureLifecycleInitialized(FirebaseMessaging messaging) async {
    final existingInitialization = _lifecycleInitialization;
    if (existingInitialization != null) {
      return existingInitialization;
    }

    final initialization = _initializeLifecycle(messaging);
    _lifecycleInitialization = initialization;
    try {
      await initialization;
    } catch (_) {
      if (identical(_lifecycleInitialization, initialization)) {
        _lifecycleInitialization = null;
      }
      rethrow;
    }
  }

  Future<void> _initializeLifecycle(FirebaseMessaging messaging) async {
    await LocalNotificationService.instance.ensureInitialized();
    if (!_messageHandlersInstalled) {
      _messageHandlersInstalled = true;
      _setupMessageHandlers();
    }

    final initialMessage = await messaging.getInitialMessage();
    if (initialMessage != null) {
      debugPrint('[FCM] Initial message: ${initialMessage.data}');
      NotificationNavigationService.instance.handlePayload(
        initialMessage.data,
        messageId: initialMessage.messageId,
      );
    }
  }

  Future<void> _getAndRegisterToken(FirebaseMessaging messaging) async {
    try {
      final token = await messaging.getToken();
      if (token != null) {
        _currentToken = token;
        debugPrint('[FCM] Token: ${token.substring(0, 20)}...');
        await _registerTokenWithBackend(token);
      }
    } catch (e) {
      debugPrint('[FCM] Error getting token: $e');
    }
  }

  void _setupTokenRefreshListener(FirebaseMessaging messaging) {
    if (_tokenRefreshListenerInstalled) return;
    _tokenRefreshListenerInstalled = true;

    messaging.onTokenRefresh.listen((newToken) async {
      debugPrint('[FCM] Token refreshed');
      _currentToken = newToken;
      await _registerTokenWithBackend(newToken);
    });
  }

  void _setupMessageHandlers() {
    FirebaseMessaging.onMessage.listen((RemoteMessage message) async {
      debugPrint('[FCM] Foreground message: ${message.notification?.title}');

      final type = message.data['type']?.toString();
      if (LocalNotificationService.instance.isPriceCampaignType(type)) {
        await LocalNotificationService.instance.handleRemoteMessage(message);
      } else if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
        final title = message.notification?.title ?? 'Notification';
        final body = message.notification?.body ?? '';
        if (body.isNotEmpty || title.isNotEmpty) {
          await LocalNotificationService.instance.showSimpleNotification(
            title: title,
            body: body,
            data: message.data,
            messageId: message.messageId,
          );
        }
      }

      if (message.notification != null) {
        final title = message.notification?.title ?? 'Notification';
        final body = message.notification?.body ?? '';

        if (!LocalNotificationService.instance.isPriceCampaignType(type)) {
          scafoldMessengerKey.currentState?.showSnackBar(
            SnackBar(
              content: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  if (body.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(body, style: const TextStyle(fontSize: 14)),
                  ],
                ],
              ),
              behavior: SnackBarBehavior.floating,
              margin: const EdgeInsets.only(
                top: 10,
                left: 16,
                right: 16,
                bottom: 20,
              ),
              backgroundColor:
                  title.contains('Approved') || title.contains('Upgraded')
                  ? Colors.green.shade700
                  : Colors.blue.shade700,
              duration: const Duration(seconds: 5),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          );
        }
      }

      if (message.data['type'] == 'ROLE_UPDATED') {
        _ref.read(authProvider.notifier).fetchCurrentUser();
      }
    });

    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) async {
      debugPrint('[FCM] Message opened app: ${message.data}');

      await LocalNotificationService.instance.handleRemoteMessage(message);
      NotificationNavigationService.instance.handlePayload(
        message.data,
        messageId: message.messageId,
      );

      if (message.data['type'] == 'ROLE_UPDATED') {
        _ref.read(authProvider.notifier).fetchCurrentUser();
      }
    });
  }

  Future<void> _registerTokenWithBackend(String token) async {
    try {
      final api = _ref.read(apiClientProvider);
      await api.post(
        '/notifications/register-token',
        data: {
          'fcmToken': token,
          'platform': defaultTargetPlatform == TargetPlatform.iOS
              ? 'ios'
              : 'android',
        },
      );
      debugPrint('[FCM] Token registered with backend');
    } on DioException catch (e) {
      // Don't crash if backend is unavailable — token will be re-sent on next refresh
      debugPrint('[FCM] Failed to register token: ${e.message}');
    }
  }

  Future<bool> _syncActivePriceCountdownFromBackend() async {
    try {
      final api = _ref.read(apiClientProvider);
      final response = await api.get(
        '/notifications/my',
        queryParameters: {'limit': 20},
      );
      final items = response.data['data'];
      if (items is! List) return true;

      Map<String, dynamic>? latestActive;
      for (final item in items) {
        if (item is! Map) continue;
        final type = item['type']?.toString();
        final data = item['data'];
        final effectiveAtRaw = data is Map
            ? data['effectiveAt']?.toString()
            : null;
        final effectiveAt = effectiveAtRaw == null
            ? null
            : DateTime.tryParse(effectiveAtRaw)?.toLocal();

        if (!LocalNotificationService.instance.isPriceCampaignType(type)) {
          continue;
        }

        if (type == 'price_change_campaign_applied') {
          await LocalNotificationService.instance.cancelPriceCountdown();
          return true;
        }

        if (effectiveAt == null || !effectiveAt.isAfter(DateTime.now())) {
          continue;
        }

        latestActive = Map<String, dynamic>.from(item);
        break;
      }

      if (latestActive == null) {
        await LocalNotificationService.instance.cancelPriceCountdown();
        return true;
      }

      final notificationData = latestActive['data'] is Map
          ? Map<String, dynamic>.from(latestActive['data'])
          : null;

      await LocalNotificationService.instance
          .syncPriceCountdownFromNotificationData(
            notificationData,
            title: latestActive['title']?.toString(),
            body: latestActive['body']?.toString(),
          );
      return true;
    } catch (error) {
      debugPrint('[FCM] Active price countdown sync skipped: $error');
      return false;
    }
  }

  String? get currentToken => _currentToken;
}

final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService(ref);
});
