/// API Configuration
/// Change these values based on your environment
library;

import 'package:flutter/foundation.dart';

class ApiConfig {
  // Override at build/run time:
  // flutter run --dart-define=API_BASE_URL=http://192.168.1.12:5000/api/v1
  // or
  // flutter run --dart-define=API_LOCAL_IP=<YOUR_IP>
  static const String _explicitBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: '',
  );
  static const String _localIp = String.fromEnvironment(
    'API_LOCAL_IP',
    defaultValue: '',
  );

  static String get baseUrl {
    if (_explicitBaseUrl.isNotEmpty) {
      return _explicitBaseUrl;
    }

    if (_localIp.isNotEmpty) {
      return 'http://$_localIp:5000/api/v1';
    }

    if (kIsWeb) {
      return localhostUrl;
    }

    if (defaultTargetPlatform == TargetPlatform.android) {
      return androidUsbDebugUrl;
    }

    return localhostUrl;
  }

  // Alternative URLs for reference
  static const String emulatorUrl = 'http://10.0.2.2:5000/api/v1';
  static const String localhostUrl = 'http://localhost:5000/api/v1';
  static const String androidUsbDebugUrl = 'http://127.0.0.1:5000/api/v1';
  static const String physicalDeviceUrl = 'http://192.168.1.12:5000/api/v1';

  // Timeouts
  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 15);
}
