import 'package:firebase_messaging/firebase_messaging.dart';
import 'dart:async';

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
  bool _isTokenRegistered = false;
  bool _isRegistrationInFlight = false;
  int _registrationAttempt = 0;
  Timer? _registrationRetryTimer;

  static const int _maxRegistrationAttempts = 6;

  NotificationService(this._ref);

  Future<void> initialize({bool requestPermission = false}) async {
    if (Firebase.apps.isEmpty) {
      debugPrint('[FCM] Firebase not configured, skipping notifications');
      return;
    }

    final messaging = FirebaseMessaging.instance;

    // Token registration must not wait for local-notification initialization or
    // initial-message recovery. Either can be delayed on iOS, while a valid
    // APNs/FCM token must be registered with the backend as soon as possible.
    unawaited(_initializeLifecycleInBackground(messaging));

    final settings = requestPermission
        ? await messaging.requestPermission(
            alert: true,
            badge: true,
            sound: true,
            provisional: false,
          )
        : await messaging.getNotificationSettings();

    debugPrint('[FCM] Permission status: ${settings.authorizationStatus}');
    // Let iOS present the FCM notification while the app is open. The previous
    // local-notification fallback was not reliably becoming the iOS notification
    // center delegate, leaving only the in-app SnackBar visible.
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

  Future<void> _initializeLifecycleInBackground(
    FirebaseMessaging messaging,
  ) async {
    try {
      await _ensureLifecycleInitialized(messaging);
    } catch (error) {
      debugPrint('[FCM] Lifecycle initialization failed: $error');
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
    if (_isRegistrationInFlight) return;
    _isRegistrationInFlight = true;

    try {
      final isIos = !kIsWeb && defaultTargetPlatform == TargetPlatform.iOS;
      if (isIos) {
        final apnsToken = await _awaitApnsToken(messaging);
        if (apnsToken == null) {
          debugPrint(
            '[FCM] APNs token still unavailable. iOS cannot receive push yet. '
            'Verify the push entitlement and provisioning profile.',
          );
          _scheduleRegistrationRetry();
          return;
        }
        debugPrint('[FCM] APNs token acquired');
      }

      final token = await messaging.getToken();
      if (token == null || token.isEmpty) {
        debugPrint('[FCM] getToken() returned no token; scheduling retry');
        _scheduleRegistrationRetry();
        return;
      }

      _currentToken = token;
      debugPrint('[FCM] Token: ${token.substring(0, 20)}...');

      final registered = await _registerTokenWithBackend(token);
      if (registered) {
        _isTokenRegistered = true;
        _registrationAttempt = 0;
        _registrationRetryTimer?.cancel();
        _registrationRetryTimer = null;
      } else {
        _scheduleRegistrationRetry();
      }
    } catch (e) {
      // On iOS getToken() throws until APNs registration completes.
      debugPrint('[FCM] Error getting token: $e');
      _scheduleRegistrationRetry();
    } finally {
      _isRegistrationInFlight = false;
    }
  }

  /// iOS only issues an FCM token after APNs registration completes, which can
  /// take several seconds on a fresh install.
  Future<String?> _awaitApnsToken(FirebaseMessaging messaging) async {
    for (var attempt = 0; attempt < 15; attempt++) {
      try {
        final token = await messaging.getAPNSToken();
        if (token != null && token.isNotEmpty) return token;
      } catch (e) {
        debugPrint('[FCM] APNs token lookup failed: $e');
      }
      await Future<void>.delayed(const Duration(seconds: 1));
    }
    return null;
  }

  void _scheduleRegistrationRetry() {
    if (_isTokenRegistered) return;
    if (_registrationRetryTimer != null) return;
    if (_registrationAttempt >= _maxRegistrationAttempts) {
      debugPrint(
        '[FCM] Giving up token registration after $_registrationAttempt attempts. '
        'It will retry on next app start, login, or token refresh.',
      );
      return;
    }

    _registrationAttempt++;
    final delay = Duration(seconds: 5 * _registrationAttempt);
    debugPrint(
      '[FCM] Retrying token registration in ${delay.inSeconds}s '
      '(attempt $_registrationAttempt/$_maxRegistrationAttempts)',
    );

    _registrationRetryTimer = Timer(delay, () async {
      _registrationRetryTimer = null;
      if (_isTokenRegistered || Firebase.apps.isEmpty) return;
      await _getAndRegisterToken(FirebaseMessaging.instance);
    });
  }

  void _setupTokenRefreshListener(FirebaseMessaging messaging) {
    if (_tokenRefreshListenerInstalled) return;
    _tokenRefreshListenerInstalled = true;

    messaging.onTokenRefresh.listen((newToken) async {
      debugPrint('[FCM] Token refreshed');
      _currentToken = newToken;
      _isTokenRegistered = await _registerTokenWithBackend(newToken);
      if (!_isTokenRegistered) {
        _scheduleRegistrationRetry();
      }
    });
  }

  void _setupMessageHandlers() {
    FirebaseMessaging.onMessage.listen((RemoteMessage message) async {
      debugPrint('[FCM] Foreground message: ${message.notification?.title}');

      final type = message.data['type']?.toString();
      if (LocalNotificationService.instance.isPriceCampaignType(type)) {
        await LocalNotificationService.instance.handleRemoteMessage(message);
      } else if (!kIsWeb && defaultTargetPlatform != TargetPlatform.iOS) {
        // iOS presents the original FCM alert natively in the foreground.
        // Android still uses a local notification for foreground messages.
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

  Future<bool> _registerTokenWithBackend(String token) async {
    final platform = defaultTargetPlatform == TargetPlatform.iOS
        ? 'ios'
        : 'android';
    try {
      final api = _ref.read(apiClientProvider);
      await api.post(
        '/notifications/register-token',
        data: {'fcmToken': token, 'platform': platform},
      );
      debugPrint('[FCM] Token registered with backend as $platform');
      return true;
    } on DioException catch (e) {
      // A 401 here means registration ran before login; it retries after auth.
      final status = e.response?.statusCode;
      debugPrint(
        '[FCM] Failed to register $platform token '
        '(status: ${status ?? 'none'}): ${e.message}',
      );
      return false;
    } catch (e) {
      debugPrint('[FCM] Unexpected error registering $platform token: $e');
      return false;
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
