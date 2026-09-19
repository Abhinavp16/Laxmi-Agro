import 'package:flutter/foundation.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/app_update_config.dart';
import 'api_client.dart';

enum MobilePlatform { android, ios }

abstract interface class AppUpdateGateway {
  Future<AppUpdateCheckResult> checkForMandatoryUpdate();

  Future<bool> openStore(Uri storeUri);
}

class AppUpdateService implements AppUpdateGateway {
  AppUpdateService(this._apiClient);

  static const Duration requestTimeout = Duration(seconds: 5);
  static final Uri androidStoreUri = Uri.parse(
    'https://play.google.com/store/apps/details?id=com.laxmiagro.app',
  );
  static final Uri iosStoreUri = Uri.parse(
    'https://apps.apple.com/in/app/laxmi-agro/id6804305521',
  );

  final ApiClient _apiClient;

  @override
  Future<AppUpdateCheckResult> checkForMandatoryUpdate() async {
    final platform = currentPlatform;
    if (platform == null) return const AppUpdateCheckResult.success(null);

    try {
      final results = await Future.wait<Object>([
        _apiClient.get('/settings/mobile-app'),
        PackageInfo.fromPlatform(),
      ]).timeout(requestTimeout);
      final response = results[0] as dynamic;
      final packageInfo = results[1] as PackageInfo;
      final body = response.data;
      if (body is! Map || body['success'] != true || body['data'] is! Map) {
        return const AppUpdateCheckResult.unavailable();
      }

      final data = Map<String, dynamic>.from(body['data'] as Map);
      final platformData = data[platform.name];
      if (platformData is! Map) {
        return const AppUpdateCheckResult.unavailable();
      }

      final config = AppUpdateConfig.fromJson(
        Map<String, dynamic>.from(platformData),
      );
      if (config.enabled && config.storeUri != storeUriFor(platform)) {
        return const AppUpdateCheckResult.unavailable();
      }
      final currentBuildNumber = int.tryParse(packageInfo.buildNumber);
      return AppUpdateCheckResult.success(
        evaluate(
          config: config,
          currentVersion: packageInfo.version,
          currentBuildNumber: currentBuildNumber,
        ),
      );
    } catch (error) {
      debugPrint('[AppUpdate] Check skipped: $error');
      return const AppUpdateCheckResult.unavailable();
    }
  }

  @override
  Future<bool> openStore(Uri storeUri) async {
    if (storeUri.scheme != 'https' || !storeUri.hasAuthority) {
      return false;
    }
    try {
      return await launchUrl(storeUri, mode: LaunchMode.externalApplication);
    } catch (error) {
      debugPrint('[AppUpdate] Store launch failed: $error');
      return false;
    }
  }

  @visibleForTesting
  static AppUpdateRequirement? evaluate({
    required AppUpdateConfig config,
    required String currentVersion,
    required int? currentBuildNumber,
  }) {
    if (!config.enabled ||
        currentBuildNumber == null ||
        config.latestBuildNumber == null ||
        currentBuildNumber >= config.latestBuildNumber!) {
      return null;
    }

    return AppUpdateRequirement(
      currentVersion: currentVersion,
      latestVersion: config.latestVersion!,
      storeUri: config.storeUri!,
      title: config.title!,
      message: config.message!,
    );
  }

  static MobilePlatform? get currentPlatform {
    if (kIsWeb) return null;
    return switch (defaultTargetPlatform) {
      TargetPlatform.android => MobilePlatform.android,
      TargetPlatform.iOS => MobilePlatform.ios,
      _ => null,
    };
  }

  static Uri storeUriFor(MobilePlatform platform) {
    return switch (platform) {
      MobilePlatform.android => androidStoreUri,
      MobilePlatform.ios => iosStoreUri,
    };
  }
}
