import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/providers/auth_provider.dart';

class AccountPrivacyScreen extends ConsumerStatefulWidget {
  const AccountPrivacyScreen({super.key});

  @override
  ConsumerState<AccountPrivacyScreen> createState() =>
      _AccountPrivacyScreenState();
}

class _AccountPrivacyScreenState extends ConsumerState<AccountPrivacyScreen> {
  Map<String, dynamic>? _request;
  bool _isLoading = true;
  bool _isSubmitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadRequest();
  }

  Future<void> _loadRequest() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    final result = await ref
        .read(authProvider.notifier)
        .getAccountDeletionRequest();
    if (!mounted) return;
    setState(() {
      _request = result;
      _error = ref.read(authProvider).error;
      _isLoading = false;
    });
  }

  Future<void> _requestDeletion() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Request account deletion?'),
        content: const Text(
          'We will process your request within 30 days. Direct account data, uploaded business documents, saved addresses, carts, device tokens, and notifications will be removed or anonymized. Financial records may be retained where required for tax, payment, fraud-prevention, dispute, or warranty obligations. Backup copies expire within 90 days after completion.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Keep account'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red.shade700),
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Request deletion'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _isSubmitting = true);
    final response = await ref
        .read(authProvider.notifier)
        .requestAccountDeletion();
    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (response == null) {
      setState(
        () => _error =
            ref.read(authProvider).error ??
            'Unable to submit deletion request.',
      );
      return;
    }
    setState(() => _request = response);
  }

  Future<void> _cancelRequest() async {
    setState(() => _isSubmitting = true);
    final response = await ref
        .read(authProvider.notifier)
        .cancelAccountDeletionRequest();
    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (response == null) {
      setState(
        () => _error =
            ref.read(authProvider).error ??
            'Unable to cancel deletion request.',
      );
      return;
    }
    setState(() => _request = response);
  }

  String _formatDate(dynamic value) {
    final parsed = value == null ? null : DateTime.tryParse(value.toString());
    if (parsed == null) return '—';
    final local = parsed.toLocal();
    return '${local.day.toString().padLeft(2, '0')}/${local.month.toString().padLeft(2, '0')}/${local.year}';
  }

  @override
  Widget build(BuildContext context) {
    const primary = Color(0xFF1E40AF);
    const textPrimary = Color(0xFF0F172A);
    const textSecondary = Color(0xFF475569);
    final status = _request?['status']?.toString();
    final canCancel = status == 'pending';

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Account & Privacy',
          style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700),
        ),
      ),
      backgroundColor: const Color(0xFFF8FAFC),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _InfoCard(
                  icon: Icons.security_outlined,
                  color: primary,
                  title: 'Your privacy controls',
                  body:
                      'Manage your account-deletion request here. You can also submit a request after uninstalling the app at laxmiagroenterprises.com/delete-account.',
                ),
                const SizedBox(height: 16),
                if (_error != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEE2E2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      _error!,
                      style: GoogleFonts.plusJakartaSans(
                        color: const Color(0xFF991B1B),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                if (status == 'pending' || status == 'in_review')
                  _RequestStatusCard(
                    status: status == 'in_review'
                        ? 'Under review'
                        : 'Request received',
                    dueDate: _formatDate(_request?['dueAt']),
                    backupExpiryDate: _request?['backupExpiryAt'] == null
                        ? null
                        : _formatDate(_request?['backupExpiryAt']),
                  )
                else if (status == 'completed')
                  _RequestStatusCard(
                    status: 'Completed',
                    dueDate: _formatDate(_request?['completedAt']),
                    backupExpiryDate: _formatDate(_request?['backupExpiryAt']),
                  )
                else ...[
                  Text(
                    'Request account deletion',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'After staff verification, we complete deletion within 30 days. Restricted financial records may be retained only for legal, tax, payment, fraud-prevention, dispute, or warranty obligations.',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 14,
                      height: 1.55,
                      color: textSecondary,
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    height: 50,
                    child: FilledButton.icon(
                      onPressed: _isSubmitting ? null : _requestDeletion,
                      icon: _isSubmitting
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.delete_outline),
                      label: Text(
                        'Request account deletion',
                        style: GoogleFonts.plusJakartaSans(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      style: FilledButton.styleFrom(
                        backgroundColor: Colors.red.shade700,
                      ),
                    ),
                  ),
                ],
                if (canCancel) ...[
                  const SizedBox(height: 14),
                  OutlinedButton(
                    onPressed: _isSubmitting ? null : _cancelRequest,
                    child: Text(
                      'Cancel pending request',
                      style: GoogleFonts.plusJakartaSans(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 24),
                Text(
                  'What happens when deletion is completed',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Your account access is revoked. Profile details, saved addresses, uploaded account media, carts, notification tokens, notification history, and negotiations are deleted or anonymized. Backup copies are scheduled to expire within 90 days. Orders and payment records are kept in restricted records for the applicable legal retention period.',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 13,
                    height: 1.55,
                    color: textSecondary,
                  ),
                ),
              ],
            ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String title;
  final String body;

  const _InfoCard({
    required this.icon,
    required this.color,
    required this.title,
    required this.body,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.plusJakartaSans(
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  body,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 13,
                    height: 1.5,
                    color: const Color(0xFF475569),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RequestStatusCard extends StatelessWidget {
  final String status;
  final String dueDate;
  final String? backupExpiryDate;

  const _RequestStatusCard({
    required this.status,
    required this.dueDate,
    this.backupExpiryDate,
  });

  @override
  Widget build(BuildContext context) {
    final isComplete = status == 'Completed';
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isComplete ? const Color(0xFFF0FDF4) : const Color(0xFFEFF6FF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isComplete ? const Color(0xFF86EFAC) : const Color(0xFF93C5FD),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isComplete
                    ? Icons.check_circle_outline
                    : Icons.hourglass_top_outlined,
                color: isComplete
                    ? const Color(0xFF15803D)
                    : const Color(0xFF1D4ED8),
              ),
              const SizedBox(width: 8),
              Text(
                status,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF0F172A),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            isComplete ? 'Completed on: $dueDate' : 'Complete by: $dueDate',
            style: GoogleFonts.plusJakartaSans(
              fontSize: 13,
              color: const Color(0xFF475569),
            ),
          ),
          if (backupExpiryDate != null)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                'Backup expiry: $backupExpiryDate',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 13,
                  color: const Color(0xFF475569),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
