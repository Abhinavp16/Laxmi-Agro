import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/services/shipping_address_service.dart';

class AddressesScreen extends StatefulWidget {
  const AddressesScreen({super.key});

  @override
  State<AddressesScreen> createState() => _AddressesScreenState();
}

class _AddressesScreenState extends State<AddressesScreen> {
  List<ShippingAddress> _addresses = [];
  String? _selectedId;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final addresses = await ShippingAddressService.getAddresses();
    final selectedId = await ShippingAddressService.getSelectedAddressId();
    if (!mounted) return;
    setState(() {
      _addresses = addresses;
      _selectedId = selectedId;
      _loading = false;
    });
  }

  ShippingAddress? _forSlot(String slot) {
    for (final address in _addresses) {
      if (address.slot == slot) return address;
    }
    return null;
  }

  Future<void> _setDefault(ShippingAddress address) async {
    await ShippingAddressService.setSelectedAddressId(address.id);
    if (!mounted) return;
    setState(() => _selectedId = address.id);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('${_slotLabel(address.slot)} set as default')),
    );
  }

  String _slotLabel(String slot) {
    if (slot == ShippingAddressService.slotPrimary) return 'Primary';
    return 'Secondary';
  }

  Future<void> _openEditor(String slot) async {
    final existing = _forSlot(slot);
    final fk = GlobalKey<FormState>();
    final nameC = TextEditingController(text: existing?.fullName ?? '');
    final phoneC = TextEditingController(text: existing?.phone ?? '');
    final addrC = TextEditingController(text: existing?.addressLine1 ?? '');
    final cityC = TextEditingController(text: existing?.city ?? '');
    final stateC = TextEditingController(text: existing?.state ?? '');
    final pinC = TextEditingController(text: existing?.pincode ?? '');

    final payload = await showModalBottomSheet<Map<String, String>>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(
          16,
          12,
          16,
          MediaQuery.of(ctx).viewInsets.bottom + 16,
        ),
        child: Form(
          key: fk,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '${_slotLabel(slot)} Address',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 12),
                _field(nameC, 'Full Name'),
                const SizedBox(height: 10),
                _field(phoneC, 'Phone', keyboard: TextInputType.phone),
                const SizedBox(height: 10),
                _field(addrC, 'Address Line 1'),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(child: _field(cityC, 'City')),
                    const SizedBox(width: 10),
                    Expanded(child: _field(stateC, 'State')),
                  ],
                ),
                const SizedBox(height: 10),
                _field(pinC, 'Pincode', keyboard: TextInputType.number),
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      if (!fk.currentState!.validate()) return;
                      Navigator.pop(ctx, {
                        'fullName': nameC.text.trim(),
                        'phone': phoneC.text.trim(),
                        'addressLine1': addrC.text.trim(),
                        'city': cityC.text.trim(),
                        'state': stateC.text.trim(),
                        'pincode': pinC.text.trim(),
                      });
                    },
                    child: const Text('Save Address'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );

    if (payload == null) return;

    final address = ShippingAddress(
      id: existing?.id ?? ShippingAddress.generateId(),
      slot: slot,
      fullName: payload['fullName'] ?? '',
      phone: payload['phone'] ?? '',
      addressLine1: payload['addressLine1'] ?? '',
      city: payload['city'] ?? '',
      state: payload['state'] ?? '',
      pincode: payload['pincode'] ?? '',
    );

    await ShippingAddressService.upsertAddress(address);
    await ShippingAddressService.setSelectedAddressId(address.id);
    await _load();
  }

  Widget _field(
    TextEditingController controller,
    String label, {
    TextInputType keyboard = TextInputType.text,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboard,
      validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
      ),
    );
  }

  Widget _addressCard(String slot) {
    final address = _forSlot(slot);
    final isDefault = address != null && address.id == _selectedId;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Text(
                      _slotLabel(slot),
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    if (isDefault) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          'Default',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF2563EB),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                TextButton(
                  onPressed: () => _openEditor(slot),
                  child: Text(address == null ? 'Add' : 'Edit'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            if (address == null)
              Text(
                'No address saved yet. Add this delivery slot now.',
                style: GoogleFonts.plusJakartaSans(color: Colors.black54),
              )
            else ...[
              Text(
                '${address.fullName} • ${address.phone}',
                style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 4),
              Text(
                '${address.addressLine1}, ${address.city}, ${address.state} - ${address.pincode}',
              ),
              const SizedBox(height: 10),
              OutlinedButton(
                onPressed: isDefault ? null : () => _setDefault(address),
                child: Text(isDefault ? 'Default for delivery' : 'Set as default'),
              ),
            ],
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Addresses')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    gradient: const LinearGradient(
                      colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.location_on_outlined, color: Colors.white),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Keep two delivery slots ready: Primary and Secondary.',
                          style: GoogleFonts.plusJakartaSans(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                _addressCard(ShippingAddressService.slotPrimary),
                _addressCard(ShippingAddressService.slotSecondary),
              ],
            ),
    );
  }
}
