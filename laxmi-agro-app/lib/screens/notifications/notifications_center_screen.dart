import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/services/notification_navigation_service.dart';
import '../../widgets/notification_countdown_label.dart';
import '../../core/theme/app_fonts.dart';
import '../../core/theme/app_theme.dart';
import '../../l10n/l10n.dart';
import '../../widgets/ui/ui.dart';

class NotificationsCenterScreen extends ConsumerStatefulWidget {
  const NotificationsCenterScreen({super.key, this.initialTab = 4});

  final int initialTab;

  @override
  ConsumerState<NotificationsCenterScreen> createState() =>
      _NotificationsCenterScreenState();
}

class _NotificationsCenterScreenState
    extends ConsumerState<NotificationsCenterScreen> {
  List<Map<String, dynamic>> _notifications = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchNotifications();
  }

  Future<void> _fetchNotifications() async {
    setState(() => _isLoading = true);

    try {
      final api = ref.read(apiClientProvider);
      final response = await api.get(
        '/notifications/my',
        queryParameters: {'limit': 120},
      );

      if (response.statusCode == 200 && mounted) {
        final List<dynamic> items = response.data['data'] ?? [];
        setState(() {
          _notifications = items.map<Map<String, dynamic>>((item) {
            return {
              'id': item['_id']?.toString() ?? '',
              'title': item['title']?.toString() ?? '',
              'body': item['body']?.toString() ?? '',
              'type': item['type']?.toString() ?? 'general',
              'isRead': item['isRead'] == true,
              'createdAt': item['createdAt'],
              'data': item['data'],
            };
          }).toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching notifications: $e');
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  IconData _getIconForType(String type) {
    switch (type) {
      case 'order':
        return HugeIcons.strokeRoundedShoppingBag01;
      case 'payment':
        return HugeIcons.strokeRoundedCheckmarkBadge01;
      case 'shipping':
        return HugeIcons.strokeRoundedTruckDelivery;
      case 'negotiation':
        return HugeIcons.strokeRoundedAgreement02;
      case 'promotion':
        return HugeIcons.strokeRoundedMegaphone01;
      case 'price_change_campaign_started':
      case 'price_change_campaign_12h':
      case 'price_change_campaign_6h':
      case 'price_change_campaign_20m':
      case 'price_change_campaign_3h':
      case 'price_change_campaign_1h':
      case 'price_change_campaign_5m':
      case 'price_change_campaign_applied':
        return HugeIcons.strokeRoundedClock01;
      case 'system':
        return HugeIcons.strokeRoundedInformationCircle;
      default:
        return HugeIcons.strokeRoundedNotification02;
    }
  }

  String _formatTime(String? createdAt) {
    final l10n = context.l10n;
    if (createdAt == null) return l10n.notificationsJustNow;

    try {
      final date = DateTime.parse(createdAt);
      final now = DateTime.now();
      final diff = now.difference(date);

      if (diff.inMinutes < 1) {
        return l10n.notificationsJustNow;
      } else if (diff.inMinutes < 60) {
        return l10n.notificationsMinutesAgo('${diff.inMinutes}');
      } else if (diff.inHours < 24) {
        return l10n.notificationsHoursAgo('${diff.inHours}');
      } else if (diff.inDays < 7) {
        return l10n.notificationsDaysAgo('${diff.inDays}');
      } else {
        return '${date.day}/${date.month}/${date.year}';
      }
    } catch (e) {
      return l10n.notificationsJustNow;
    }
  }

  @override
  Widget build(BuildContext context) {
    final Widget content;
    if (_isLoading) {
      content = ListView.separated(
        key: const ValueKey('loading'),
        physics: const NeverScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        itemCount: 6,
        separatorBuilder: (_, _) => const SizedBox(height: 10),
        itemBuilder: (_, _) => const _NotificationSkeleton(),
      );
    } else if (_notifications.isEmpty) {
      content = KeyedSubtree(
        key: const ValueKey('empty'),
        child: _buildEmptyState(),
      );
    } else {
      content = RefreshIndicator(
        key: const ValueKey('list'),
        color: AppColors.primary,
        onRefresh: _fetchNotifications,
        child: ListView.separated(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          itemCount: _notifications.length,
          separatorBuilder: (_, _) => const SizedBox(height: 10),
          itemBuilder: (context, index) {
            final notification = _notifications[index];
            return _buildNotificationItem(notification);
          },
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppHeader(
        title: context.l10n.notificationsTitle,
        onBack: () {
          if (context.canPop()) {
            context.pop();
          } else {
            context.go('/home', extra: {'tab': 4});
          }
        },
      ),
      body: AnimatedSwitcher(
        duration: AppMotion.of(context, AppMotion.base),
        child: content,
      ),
    );
  }

  Widget _buildEmptyState() {
    return EmptyState(
      icon: HugeIcons.strokeRoundedNotification02,
      tone: ChipTone.neutral,
      title: context.l10n.notificationsEmptyTitle,
      message: context.l10n.notificationsEmptySubtitle,
    );
  }

  Widget _buildNotificationItem(Map<String, dynamic> notification) {
    final type = notification['type']?.toString() ?? 'general';
    final isRead = notification['isRead'] == true;
    final title = notification['title']?.toString() ?? '';
    final body = notification['body']?.toString() ?? '';
    final createdAt = notification['createdAt']?.toString();
    final rawData = notification['data'];
    final data = rawData is Map
        ? {
            ...rawData.map((key, value) => MapEntry(key.toString(), value)),
            'type': type,
          }
        : {'type': type};

    return Pressable(
      onTap: () {
        NotificationNavigationService.instance.openFromContext(
          context,
          data,
          isAuthenticated: ref.read(authProvider).isAuthenticated,
        );
      },
      color: isRead ? AppColors.surfaceLight : AppColors.primaryTint,
      scale: 0.985,
      borderRadius: BorderRadius.circular(AppRadius.lg),
      semanticLabel: title,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(
            color: isRead ? AppColors.border : AppColors.primarySoft,
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Icon
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: isRead ? AppColors.gray50 : AppColors.surfaceLight,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.border),
              ),
              child: Center(
                child: HugeIcon(
                  icon: _getIconForType(type),
                  color: isRead ? AppColors.textSecondary : AppColors.primary,
                  size: 20,
                ),
              ),
            ),
            const SizedBox(width: 12),
            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style: AppFonts.jakarta(
                            fontSize: 15,
                            fontWeight: isRead
                                ? FontWeight.w600
                                : FontWeight.w800,
                            color: AppColors.textPrimary,
                            height: 1.3,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _formatTime(createdAt),
                        style: AppFonts.jakarta(
                          fontSize: 12,
                          fontWeight: isRead
                              ? FontWeight.w500
                              : FontWeight.w700,
                          color: isRead
                              ? AppColors.textTertiary
                              : AppColors.primaryDeep,
                        ),
                      ),
                      // Unread indicator
                      if (!isRead) ...[
                        const SizedBox(width: 6),
                        Container(
                          width: 8,
                          height: 8,
                          margin: const EdgeInsets.only(top: 4),
                          decoration: const BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    body,
                    style: AppFonts.jakarta(
                      fontSize: 14,
                      color: AppColors.textSecondary,
                      height: 1.45,
                    ),
                  ),
                  NotificationCountdownLabel(
                    data: data,
                    color: AppColors.warning,
                    fontSize: 12,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NotificationSkeleton extends StatelessWidget {
  const _NotificationSkeleton();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.border),
      ),
      child: const SkeletonShimmer(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Skeleton(width: 40, height: 40, radius: AppRadius.pill),
            SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Skeleton(height: 14),
                  SizedBox(height: 8),
                  Skeleton(height: 11),
                  SizedBox(height: 6),
                  Skeleton(width: 160, height: 11),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
