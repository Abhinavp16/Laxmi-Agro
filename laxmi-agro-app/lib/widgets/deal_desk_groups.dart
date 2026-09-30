import 'package:flutter/material.dart';

import '../core/theme/app_fonts.dart';
import '../core/utils/number_formatter.dart';
import '../l10n/l10n.dart';

String? _groupId(Map<String, dynamic> negotiation) {
  final group = negotiation['requestGroup'];
  final id = group is Map ? group['id']?.toString() : null;
  return id == null || id.isEmpty ? null : id;
}

/// Deal Desk list items: products the wholesaler sent together from the cart
/// get one header ("Requirement REQ-… · 3 products · ₹…") above their cards,
/// since Laxmi Agro confirms them as one order.
List<Widget> dealDeskEntries(
  BuildContext context,
  List<Map<String, dynamic>> negotiations,
  Widget Function(Map<String, dynamic> negotiation) buildCard, {
  Color color = const Color(0xFF1E40AF),
}) {
  final groups = <String, List<Map<String, dynamic>>>{};
  for (final negotiation in negotiations) {
    final id = _groupId(negotiation);
    if (id != null) groups.putIfAbsent(id, () => []).add(negotiation);
  }
  final shown = <String>{};
  final entries = <Widget>[];
  for (final negotiation in negotiations) {
    final id = _groupId(negotiation);
    if (id != null && shown.add(id)) {
      final members = groups[id]!;
      final total = members.fold<num>(
        0,
        (sum, n) => sum + ((n['currentTotalPrice'] as num?) ?? 0),
      );
      final number = (negotiation['requestGroup'] as Map)['number'];
      entries.add(
        Padding(
          key: ValueKey('requirement-group-$id'),
          padding: const EdgeInsets.only(bottom: 8, top: 4),
          child: Row(
            children: [
              Icon(Icons.inventory_2_outlined, size: 16, color: color),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  context.l10n.dealDeskRequirementGroup(
                    number?.toString() ?? '',
                    members.length,
                    NumberFormatter.formatPrice(total),
                  ),
                  style: AppFonts.jakarta(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: color,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }
    entries.add(buildCard(negotiation));
  }
  return entries;
}
