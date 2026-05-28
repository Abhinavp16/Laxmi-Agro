# Laxmi Agro App

## Local API Setup

The app uses `lib/core/config/api_config.dart` and supports runtime overrides with Dart defines.

Examples:

```bash
flutter run --dart-define=API_BASE_URL=http://localhost:5000/api/v1
```

Android emulator:

```bash
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5000/api/v1
```

Physical device on the same network:

```bash
flutter run --dart-define=API_LOCAL_IP=192.168.1.8
```

If no override is supplied, the app falls back to the defaults in `ApiConfig`.

On this Mac mini setup, helper script:

```bash
./run-flutter.sh
```
