import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

import 'core/theme/app_theme.dart';
import 'core/router/app_router.dart';
import 'core/services/notification_service.dart';

final GlobalKey<ScaffoldMessengerState> scafoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  } catch (error) {
    debugPrint('[Firebase] Skipping initialization: $error');
  }
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );
  runApp(const ProviderScope(child: LaxmiAgroApp()));
}

class LaxmiAgroApp extends StatelessWidget {
  const LaxmiAgroApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      scaffoldMessengerKey: scafoldMessengerKey,
      title: 'Laxmi Agro Enterprises',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      routerConfig: appRouter,
    );
  }
}
