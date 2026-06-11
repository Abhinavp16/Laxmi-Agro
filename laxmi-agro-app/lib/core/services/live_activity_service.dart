import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:live_activities/live_activities.dart';

class LiveActivityService {
  LiveActivityService._();

  static final LiveActivityService instance = LiveActivityService._();

  static const String _appGroupId = 'group.com.laxmiagro.app';
  static const Set<String> _priceCampaignTypes = {
    'price_change_campaign_started',
    'price_change_campaign_12h',
    'price_change_campaign_6h',
    'price_change_campaign_20m',
    'price_change_campaign_3h',
    'price_change_campaign_1h',
    'price_change_campaign_5m',
    'price_change_campaign_applied',
  };

  final LiveActivities _liveActivities = LiveActivities();
  bool _isInitialized = false;

  Future<void> ensureInitialized() async {
    if (kIsWeb ||
        defaultTargetPlatform != TargetPlatform.iOS ||
        _isInitialized) {
      return;
    }

    try {
      await _liveActivities.init(
        appGroupId: _appGroupId,
        urlScheme: 'laxmiagro',
        requestAndroidNotificationPermission: false,
      );
      _isInitialized = true;
    } catch (error) {
      debugPrint('[LiveActivity] initialization skipped: $error');
    }
  }

  bool isPriceCampaignType(String? type) {
    return type != null && _priceCampaignTypes.contains(type);
  }

  Future<void> syncFromNotificationData(
    Map<String, dynamic>? data, {
    String? title,
    String? body,
  }) async {
    if (kIsWeb || defaultTargetPlatform != TargetPlatform.iOS || data == null) {
      return;
    }

    await ensureInitialized();
    if (!_isInitialized) return;

    final type = data['type']?.toString();
    if (!isPriceCampaignType(type)) {
      return;
    }

    final campaignId = data['campaignId']?.toString().trim().isNotEmpty == true
        ? data['campaignId']!.toString()
        : 'price-change-campaign';

    if (type == 'price_change_campaign_applied') {
      await _end(campaignId);
      return;
    }

    final effectiveAtRaw = data['effectiveAt']?.toString();
    final effectiveAt = effectiveAtRaw == null
        ? null
        : DateTime.tryParse(effectiveAtRaw)?.toLocal();

    if (effectiveAt == null || !effectiveAt.isAfter(DateTime.now())) {
      await _end(campaignId);
      return;
    }

    try {
      final supported = await _liveActivities.areActivitiesSupported();
      final enabled = await _liveActivities.areActivitiesEnabled();
      if (!supported || !enabled) {
        return;
      }

      final payload = <String, dynamic>{
        'title': title ?? data['title']?.toString() ?? 'Price update scheduled',
        'body':
            body ??
            data['body']?.toString() ??
            'A scheduled price update is active.',
        'effectiveAt': effectiveAt.toUtc().toIso8601String(),
        'stage': type,
        'campaignId': campaignId,
      };

      await _liveActivities.createOrUpdateActivity(
        campaignId,
        payload,
        removeWhenAppIsKilled: false,
        iOSEnableRemoteUpdates: false,
        staleIn:
            effectiveAt.difference(DateTime.now()) + const Duration(minutes: 5),
      );
    } catch (error) {
      debugPrint('[LiveActivity] sync failed: $error');
    }
  }

  Future<void> endFromNotificationData(Map<String, dynamic>? data) async {
    if (data == null) return;
    final campaignId = data['campaignId']?.toString().trim().isNotEmpty == true
        ? data['campaignId']!.toString()
        : 'price-change-campaign';
    await _end(campaignId);
  }

  Future<void> clearAll() async {
    if (kIsWeb || defaultTargetPlatform != TargetPlatform.iOS) {
      return;
    }
    await ensureInitialized();
    if (!_isInitialized) return;
    try {
      await _liveActivities.endAllActivities();
    } catch (error) {
      debugPrint('[LiveActivity] clear failed: $error');
    }
  }

  Future<void> _end(String campaignId) async {
    if (kIsWeb || defaultTargetPlatform != TargetPlatform.iOS) {
      return;
    }
    await ensureInitialized();
    if (!_isInitialized) return;
    try {
      await _liveActivities.endActivity(campaignId);
    } catch (error) {
      debugPrint('[LiveActivity] end failed: $error');
    }
  }
}
