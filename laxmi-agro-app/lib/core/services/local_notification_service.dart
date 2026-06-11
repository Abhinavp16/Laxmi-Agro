import 'dart:async';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../router/app_router.dart';

const String _shopNowActionId = 'price_campaign_shop_now';
const String _priceCampaignPayload = 'price_campaign_open_home';

@pragma('vm:entry-point')
void notificationTapBackground(NotificationResponse notificationResponse) {
  // Keep a background entry point registered for Android action taps.
}

class LocalNotificationService {
  LocalNotificationService._();

  static final LocalNotificationService instance = LocalNotificationService._();

  static const String _defaultChannelId = 'laxmi_agro_default';
  static const String _countdownChannelId = 'laxmi_agro_price_countdown';
  static const int _priceCountdownNotificationId = 910159;

  final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();
  bool _isInitialized = false;

  static const Set<String> _priceCampaignTypes = {
    'price_change_campaign_started',
    'price_change_campaign_12h',
    'price_change_campaign_6h',
    'price_change_campaign_20m',
    'price_change_campaign_applied',
    // Legacy keys kept for older stored notifications.
    'price_change_campaign_3h',
    'price_change_campaign_1h',
    'price_change_campaign_5m',
  };

  Future<void> ensureInitialized() async {
    if (_isInitialized || kIsWeb) return;

    const initializationSettings = InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
      iOS: DarwinInitializationSettings(),
    );

    await _plugin.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: _handleNotificationResponse,
      onDidReceiveBackgroundNotificationResponse: notificationTapBackground,
    );

    final androidPlugin = _plugin
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >();
    await androidPlugin?.createNotificationChannel(
      const AndroidNotificationChannel(
        _defaultChannelId,
        'General Notifications',
        description: 'General notifications for Laxmi Agro',
        importance: Importance.high,
      ),
    );
    await androidPlugin?.createNotificationChannel(
      const AndroidNotificationChannel(
        _countdownChannelId,
        'Price Countdown Notifications',
        description: 'Live countdown notifications for scheduled price updates',
        importance: Importance.high,
      ),
    );

    _isInitialized = true;
  }

  bool isPriceCampaignType(String? type) {
    return type != null && _priceCampaignTypes.contains(type);
  }

  Future<void> handleRemoteMessage(RemoteMessage message) async {
    if (kIsWeb || defaultTargetPlatform != TargetPlatform.android) {
      return;
    }

    await ensureInitialized();

    final type = message.data['type']?.toString();
    if (!isPriceCampaignType(type)) {
      return;
    }

    if (type == 'price_change_campaign_applied') {
      await cancelPriceCountdown();
      await showSimpleNotification(
        title: _extractTitle(message, fallback: 'Laxmi Agro'),
        body: _extractBody(message, fallback: 'New prices are now applied.'),
      );
      return;
    }

    await syncPriceCountdown(
      type: type!,
      title: _extractTitle(message, fallback: 'Price update scheduled'),
      body: _extractBody(
        message,
        fallback: 'A scheduled price update is active.',
      ),
      effectiveAtIso: message.data['effectiveAt']?.toString(),
    );
  }

  Future<void> syncPriceCountdownFromNotificationData(
    Map<String, dynamic>? data, {
    String? title,
    String? body,
  }) async {
    if (kIsWeb ||
        defaultTargetPlatform != TargetPlatform.android ||
        data == null) {
      return;
    }

    await ensureInitialized();

    final type = data['type']?.toString();
    if (!isPriceCampaignType(type)) {
      return;
    }

    if (type == 'price_change_campaign_applied') {
      await cancelPriceCountdown();
      return;
    }

    await syncPriceCountdown(
      type: type!,
      title: title ?? data['title']?.toString() ?? 'Price update scheduled',
      body:
          body ??
          data['body']?.toString() ??
          'A scheduled price update is active.',
      effectiveAtIso: data['effectiveAt']?.toString(),
    );
  }

  Future<void> syncPriceCountdown({
    required String type,
    required String title,
    required String body,
    required String? effectiveAtIso,
  }) async {
    if (kIsWeb || defaultTargetPlatform != TargetPlatform.android) {
      return;
    }

    final effectiveAt = effectiveAtIso == null
        ? null
        : DateTime.tryParse(effectiveAtIso)?.toLocal();
    if (effectiveAt == null) {
      return;
    }

    final remaining = effectiveAt.difference(DateTime.now());
    if (!remaining.isNegative && remaining > Duration.zero) {
      await _plugin.show(
        _priceCountdownNotificationId,
        'Laxmi Agro',
        body,
        NotificationDetails(
          android: AndroidNotificationDetails(
            _countdownChannelId,
            'Price Countdown Notifications',
            channelDescription:
                'Live countdown notifications for scheduled price updates',
            importance: Importance.high,
            priority: Priority.high,
            ongoing: true,
            autoCancel: false,
            onlyAlertOnce: true,
            showWhen: true,
            when: effectiveAt.millisecondsSinceEpoch,
            usesChronometer: true,
            chronometerCountDown: true,
            timeoutAfter: remaining.inMilliseconds,
            largeIcon: const DrawableResourceAndroidBitmap('ic_launcher'),
            color: const Color(0xFF1B8E3E),
            category: AndroidNotificationCategory.promo,
            subText: title,
            styleInformation: BigTextStyleInformation(
              body,
              contentTitle: 'Laxmi Agro',
              summaryText: title,
            ),
            actions: const <AndroidNotificationAction>[
              AndroidNotificationAction(
                _shopNowActionId,
                'Shop Now',
                showsUserInterface: true,
                cancelNotification: false,
              ),
            ],
          ),
        ),
        payload: _priceCampaignPayload,
      );
    } else {
      await cancelPriceCountdown();
    }
  }

  Future<void> showSimpleNotification({
    required String title,
    required String body,
  }) async {
    if (kIsWeb) return;
    await ensureInitialized();

    await _plugin.show(
      DateTime.now().millisecondsSinceEpoch.remainder(100000),
      title,
      body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _defaultChannelId,
          'General Notifications',
          channelDescription: 'General notifications for Laxmi Agro',
          importance: Importance.high,
          priority: Priority.high,
          largeIcon: const DrawableResourceAndroidBitmap('ic_launcher'),
          color: const Color(0xFF1B8E3E),
          styleInformation: BigTextStyleInformation(
            body,
            contentTitle: title,
            summaryText: 'Laxmi Agro',
          ),
        ),
        iOS: const DarwinNotificationDetails(),
      ),
      payload: _priceCampaignPayload,
    );
  }

  Future<void> cancelPriceCountdown() async {
    if (kIsWeb) return;
    await ensureInitialized();
    await _plugin.cancel(_priceCountdownNotificationId);
  }

  String _extractTitle(RemoteMessage message, {required String fallback}) {
    return message.notification?.title ??
        message.data['title']?.toString() ??
        fallback;
  }

  String _extractBody(RemoteMessage message, {required String fallback}) {
    return message.notification?.body ??
        message.data['body']?.toString() ??
        fallback;
  }

  void _handleNotificationResponse(NotificationResponse response) {
    if (response.payload == _priceCampaignPayload ||
        response.actionId == _shopNowActionId) {
      appRouter.go('/home');
    }
  }
}
