@echo off
cd /d C:\Users\hp\Desktop\laxmi-agro\laxmi-agro-app
adb reverse tcp:5000 tcp:5000
flutter run -d RZ8N821LM7B --dart-define=API_BASE_URL=http://127.0.0.1:5000/api/v1
