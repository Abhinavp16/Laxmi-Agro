import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hugeicons/hugeicons.dart';

import '../../core/providers/auth_provider.dart';
import '../../core/theme/app_fonts.dart';
import '../../core/theme/app_theme.dart';
import '../../l10n/l10n.dart';
import '../../widgets/ui/ui.dart';
import 'deal_desk_widgets.dart';

class NegotiationsScreen extends ConsumerStatefulWidget {
  const NegotiationsScreen({super.key});

  @override
  ConsumerState<NegotiationsScreen> createState() => _NegotiationsScreenState();
}

class _NegotiationsScreenState extends ConsumerState<NegotiationsScreen>
    with WidgetsBindingObserver {
  int _selectedTab = 0;
  bool _isLoading = true;
  String? _error;
  List<Map<String, dynamic>> _negotiations = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _fetchNegotiations();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _fetchNegotiations();
    }
  }

  Future<void> _fetchNegotiations() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final api = ref.read(apiClientProvider);
      final response = await api.get('/negotiations');
      if (!mounted) return;

      final data = response.data;
      if (data['success'] == true) {
        final List items = data['data'] ?? [];
        setState(() {
          _negotiations = items.cast<Map<String, dynamic>>();
          _isLoading = false;
        });
      } else {
        setState(() {
          _error =
              data['message']?.toString() ??
              context.l10n.negotiationsLoadFailed;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = context.l10n.negotiationsLoadFailed;
        _isLoading = false;
      });
    }
  }

  List<Map<String, dynamic>> get _activeNegotiations => _negotiations
      .where((n) => ['pending', 'countered'].contains(n['status']))
      .toList();

  List<Map<String, dynamic>> get _completedNegotiations => _negotiations
      .where(
        (n) => [
          'accepted',
          'rejected',
          'expired',
          'converted',
        ].contains(n['status']),
      )
      .toList();

  List<Map<String, dynamic>> get _filteredNegotiations {
    if (_selectedTab == 0) {
      return DealDeskPresentation.sortNeedsReplyFirst(_activeNegotiations);
    }
    // Completed tab
    return _completedNegotiations;
  }

  String _idOf(Map<String, dynamic> negotiation) =>
      (negotiation['id'] ?? negotiation['_id'] ?? '').toString();

  Future<void> _openDetail(String negotiationId) async {
    final result = await context.push('/negotiation-detail/$negotiationId');
    if (result == true) _fetchNegotiations();
  }

  void _handleAction(Map<String, dynamic> negotiation, DealTileAction action) {
    final negotiationId = _idOf(negotiation);
    switch (action) {
      case DealTileAction.viewOrder:
        final orderId = negotiation['orderId']?.toString();
        if (orderId != null && orderId.isNotEmpty && orderId != 'null') {
          context.push('/tracking/$orderId');
        } else {
          context.push('/previous-orders');
        }
      case DealTileAction.respond:
      case DealTileAction.viewDetails:
        _openDetail(negotiationId);
      case DealTileAction.underReview:
      case DealTileAction.declined:
      case DealTileAction.expired:
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final active = _activeNegotiations;
    final completed = _completedNegotiations;
    final duration = AppMotion.of(context, AppMotion.base);

    final Widget content;
    if (_isLoading) {
      content = ListView.separated(
        key: const ValueKey('loading'),
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
        itemCount: 4,
        separatorBuilder: (_, _) => const SizedBox(height: 12),
        itemBuilder: (_, _) => const DealInboxSkeleton(),
      );
    } else if (_error != null) {
      content = ListView(
        key: const ValueKey('error'),
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          const SizedBox(height: 60),
          EmptyState(
            icon: HugeIcons.strokeRoundedAlert02,
            tone: ChipTone.error,
            title: _error!,
            actionLabel: l10n.commonRetry,
            onAction: _fetchNegotiations,
          ),
        ],
      );
    } else if (_filteredNegotiations.isEmpty) {
      content = ListView(
        key: ValueKey('empty-$_selectedTab'),
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          const SizedBox(height: 60),
          EmptyState(
            icon: HugeIcons.strokeRoundedAgreement02,
            title: _selectedTab == 0
                ? l10n.negotiationsEmptyActive
                : l10n.negotiationsEmptyCompleted,
            message: l10n.negotiationsEmptyHint,
          ),
        ],
      );
    } else {
      final deals = _filteredNegotiations;
      final replyCount = _selectedTab == 0
          ? deals.where(DealDeskPresentation.needsReply).length
          : 0;
      content = ListView.separated(
        key: ValueKey('list-$_selectedTab'),
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
        itemCount: deals.length + (replyCount > 0 ? 1 : 0),
        separatorBuilder: (_, _) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          if (replyCount > 0 && index == 0) {
            return Padding(
              padding: const EdgeInsets.only(left: 4, top: 4),
              child: Row(
                children: [
                  const DealNeedsReplyDot(size: 8),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      l10n.dealNeedsReplyCount(replyCount),
                      style: AppFonts.jakarta(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primaryDeep,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }
          final negotiation = deals[index - (replyCount > 0 ? 1 : 0)];
          return DealInboxTile(
            negotiation: negotiation,
            orderShortcut: true,
            onTap: () => _openDetail(_idOf(negotiation)),
            onAction: (action) => _handleAction(negotiation, action),
          );
        },
      );
    }

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark.copyWith(
        statusBarColor: Colors.transparent,
      ),
      child: Scaffold(
        backgroundColor: AppColors.backgroundLight,
        appBar: AppHeader(title: l10n.negotiationsTitle),
        body: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
              child: DealSegmentedControl(
                labels: [
                  l10n.negotiationsTabActive,
                  l10n.negotiationsTabCompleted,
                ],
                counts: _isLoading ? null : [active.length, completed.length],
                selectedIndex: _selectedTab,
                onChanged: (index) => setState(() => _selectedTab = index),
              ),
            ),
            Expanded(
              child: RefreshIndicator(
                color: AppColors.primary,
                onRefresh: _fetchNegotiations,
                child: AnimatedSwitcher(
                  duration: duration,
                  switchInCurve: AppMotion.standard,
                  switchOutCurve: AppMotion.exit,
                  child: content,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
