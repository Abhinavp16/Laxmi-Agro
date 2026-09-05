import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Manages the guest mode state for viewing the app as a customer
class GuestModeNotifier extends StateNotifier<bool> {
  GuestModeNotifier() : super(false);

  void enableGuestMode() {
    state = true;
  }

  void disableGuestMode() {
    state = false;
  }

  bool isGuestMode() => state;
}

final guestModeProvider =
    StateNotifierProvider<GuestModeNotifier, bool>((ref) {
  return GuestModeNotifier();
});
