import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class ShippingAddress {
  final String id;
  final String slot;
  final String fullName;
  final String phone;
  final String addressLine1;
  final String city;
  final String state;
  final String pincode;

  const ShippingAddress({
    required this.id,
    required this.slot,
    required this.fullName,
    required this.phone,
    required this.addressLine1,
    required this.city,
    required this.state,
    required this.pincode,
  });

  static String generateId() =>
      DateTime.now().microsecondsSinceEpoch.toString();

  ShippingAddress copyWith({
    String? id,
    String? slot,
    String? fullName,
    String? phone,
    String? addressLine1,
    String? city,
    String? state,
    String? pincode,
  }) {
    return ShippingAddress(
      id: id ?? this.id,
      slot: slot ?? this.slot,
      fullName: fullName ?? this.fullName,
      phone: phone ?? this.phone,
      addressLine1: addressLine1 ?? this.addressLine1,
      city: city ?? this.city,
      state: state ?? this.state,
      pincode: pincode ?? this.pincode,
    );
  }

  factory ShippingAddress.fromJson(Map<String, dynamic> json) {
    return ShippingAddress(
      id: json['id']?.toString() ?? '',
      slot: json['slot']?.toString() ?? '',
      fullName: json['fullName']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      addressLine1: json['addressLine1']?.toString() ?? '',
      city: json['city']?.toString() ?? '',
      state: json['state']?.toString() ?? '',
      pincode: json['pincode']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'slot': slot,
      'fullName': fullName,
      'phone': phone,
      'addressLine1': addressLine1,
      'city': city,
      'state': state,
      'pincode': pincode,
    };
  }

  Map<String, String> toOrderPayload() {
    return {
      'fullName': fullName,
      'phone': phone,
      'addressLine1': addressLine1,
      'city': city,
      'state': state,
      'pincode': pincode,
    };
  }

  String get shortAddress => '$addressLine1, $city';
}

class ShippingAddressService {
  static const _addressesKey = 'shipping_addresses';
  static const _selectedAddressIdKey = 'selected_shipping_address_id';
  static const slotPrimary = 'primary';
  static const slotSecondary = 'secondary';

  static bool _isValidSlot(String slot) =>
      slot == slotPrimary || slot == slotSecondary;

  static List<ShippingAddress> _sortBySlot(List<ShippingAddress> addresses) {
    final primary = addresses.where((a) => a.slot == slotPrimary).toList();
    final secondary = addresses.where((a) => a.slot == slotSecondary).toList();
    return [...primary, ...secondary];
  }

  static List<ShippingAddress> _normalizeSlots(List<ShippingAddress> addresses) {
    final normalized = <ShippingAddress>[];
    ShippingAddress? primary;
    ShippingAddress? secondary;
    final withoutSlot = <ShippingAddress>[];

    for (final address in addresses) {
      if (address.slot == slotPrimary && primary == null) {
        primary = address;
      } else if (address.slot == slotSecondary && secondary == null) {
        secondary = address;
      } else if (!_isValidSlot(address.slot)) {
        withoutSlot.add(address);
      }
    }

    if (primary == null && withoutSlot.isNotEmpty) {
      primary = withoutSlot.removeAt(0).copyWith(slot: slotPrimary);
    }
    if (secondary == null && withoutSlot.isNotEmpty) {
      secondary = withoutSlot.removeAt(0).copyWith(slot: slotSecondary);
    }

    if (primary != null) normalized.add(primary);
    if (secondary != null) normalized.add(secondary);
    return _sortBySlot(normalized);
  }

  static String _defaultSlotForNew(List<ShippingAddress> addresses) {
    final hasPrimary = addresses.any((a) => a.slot == slotPrimary);
    if (!hasPrimary) return slotPrimary;
    return slotSecondary;
  }

  static Future<List<ShippingAddress>> getAddresses() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_addressesKey);
    if (raw == null || raw.isEmpty) return [];

    final parsed = jsonDecode(raw);
    if (parsed is! List) return [];

    final decoded = parsed
        .whereType<Map>()
        .map((e) => ShippingAddress.fromJson(Map<String, dynamic>.from(e)))
        .toList();
    final normalized = _normalizeSlots(decoded);

    if (jsonEncode(decoded.map((e) => e.toJson()).toList()) !=
        jsonEncode(normalized.map((e) => e.toJson()).toList())) {
      await _setAddresses(normalized);
    }
    return normalized;
  }

  static Future<void> _setAddresses(List<ShippingAddress> addresses) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _addressesKey,
      jsonEncode(addresses.map((e) => e.toJson()).toList()),
    );
  }

  static Future<String?> getSelectedAddressId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_selectedAddressIdKey);
  }

  static Future<void> setSelectedAddressId(String? id) async {
    final prefs = await SharedPreferences.getInstance();
    if (id == null || id.isEmpty) {
      await prefs.remove(_selectedAddressIdKey);
      return;
    }
    await prefs.setString(_selectedAddressIdKey, id);
  }

  static Future<ShippingAddress?> getSelectedAddress() async {
    final addresses = await getAddresses();
    final selectedId = await getSelectedAddressId();
    if (addresses.isEmpty) return null;

    if (selectedId == null || selectedId.isEmpty) {
      return addresses.first;
    }

    return addresses.firstWhere(
      (a) => a.id == selectedId,
      orElse: () => addresses.first,
    );
  }

  static Future<void> upsertAddress(ShippingAddress address) async {
    final addresses = await getAddresses();
    final safeSlot = _isValidSlot(address.slot)
        ? address.slot
        : _defaultSlotForNew(addresses);
    final incoming = address.copyWith(slot: safeSlot);

    final index = addresses.indexWhere(
      (a) => a.id == incoming.id || a.slot == incoming.slot,
    );
    if (index >= 0) {
      addresses[index] = incoming;
    } else {
      addresses.add(incoming);
    }
    await _setAddresses(_normalizeSlots(addresses));
  }

  static Future<void> deleteAddress(String id) async {
    final addresses = await getAddresses();
    final updated = addresses.where((a) => a.id != id).toList();
    await _setAddresses(updated);

    final selectedId = await getSelectedAddressId();
    if (selectedId == id) {
      await setSelectedAddressId(updated.isNotEmpty ? updated.first.id : null);
    }
  }
}
