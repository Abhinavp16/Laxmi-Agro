import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

import 'core/theme/app_theme.dart';
import 'core/router/app_router.dart';
import 'core/providers/auth_provider.dart';
import 'core/services/notification_navigation_service.dart';
import 'core/services/notification_service.dart';

final GlobalKey<ScaffoldMessengerState> scafoldMessengerKey =
    GlobalKey<ScaffoldMessengerState>();

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
    return const _NotificationBootstrap();
  }
}

class _NotificationBootstrap extends ConsumerStatefulWidget {
  const _NotificationBootstrap();

  @override
  ConsumerState<_NotificationBootstrap> createState() =>
      _NotificationBootstrapState();
}

class _NotificationBootstrapState
    extends ConsumerState<_NotificationBootstrap> {
  ProviderSubscription<AuthState>? _authSubscription;

  @override
  void initState() {
    super.initState();
    _authSubscription = ref.listenManual<AuthState>(authProvider, (
      previous,
      next,
    ) {
      NotificationNavigationService.instance.updateAuthentication(
        next.isAuthenticated,
      );

      final justAuthenticated =
          next.isAuthenticated && previous?.isAuthenticated != true;
      if (justAuthenticated) {
        unawaited(_registerNotificationsForAuthenticatedUser());
      }
    }, fireImmediately: true);

    WidgetsBinding.instance.addPostFrameCallback((_) async {
      try {
        await ref.read(notificationServiceProvider).initialize();
      } catch (error) {
        debugPrint('[Notifications] Initialization skipped: $error');
      }
    });
  }

  Future<void> _registerNotificationsForAuthenticatedUser() async {
    try {
      await ref.read(notificationServiceProvider).initialize();
    } catch (error) {
      debugPrint('[Notifications] Login registration skipped: $error');
    }
  }

  @override
  void dispose() {
    _authSubscription?.close();
    super.dispose();
  }

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
