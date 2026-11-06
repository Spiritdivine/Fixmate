import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Bell, Zap, Camera, ShieldCheck, Info } from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows, useTheme } from '../../theme';
import { NotificationService } from '../../services/notification.service';
import { queryClient } from '../../lib/query-client';
import { SkeletonNotificationItem } from '../shared';
import { useClientNotifications } from '../../hooks';

interface NotificationItem {
  id: string;
  type: 'BID' | 'MILESTONE' | 'PAYMENT' | 'SYSTEM';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  actionText?: string;
  targetId?: string;
}

interface ClientNotificationsScreenProps {
  onBack?: () => void;
  onSelectNotification?: (item: NotificationItem) => void;
}

export const ClientNotificationsScreen: React.FC<ClientNotificationsScreenProps> = ({
  onBack,
  onSelectNotification,
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const [filter, setFilter] = useState<'ALL' | 'BIDS' | 'MILESTONES' | 'PAYMENTS'>('ALL');

  const { data: remoteNotifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => NotificationService.getNotifications(),
  });

  const notifications: NotificationItem[] = (remoteNotifications || []).map((n) => {
    let mappedType: NotificationItem['type'] = 'SYSTEM';
    if (n.type === 'BID_RECEIVED') mappedType = 'BID';
    if (n.type === 'PROOF_SUBMITTED' || n.type === 'MILESTONE_FUNDED') mappedType = 'MILESTONE';
    if (n.type === 'RELEASE_APPROVED') mappedType = 'PAYMENT';

    return {
      id: n.id,
      type: mappedType,
      title: n.title,
      message: n.message,
      time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
      isRead: n.isRead,
      actionText: 'View Details',
      targetId: (n as any).jobId || (n as any).contractId || (n as any).targetId || undefined,
    };
  });

  const { markAsRead, markAllAsRead } = useClientNotifications();

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'BIDS') return n.type === 'BID';
    if (filter === 'MILESTONES') return n.type === 'MILESTONE';
    if (filter === 'PAYMENTS') return n.type === 'PAYMENT';
    return true;
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.headerBorder }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ChevronLeft size={22} color={themeColors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Notifications</Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.textMuted }]}>Alerts, milestones & escrow updates</Text>
        </View>
        <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.7}>
          <Text style={[styles.markReadText, isDark && { color: '#34D399' }]}>Mark all</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={[styles.filterRow, { backgroundColor: themeColors.surfaceSubtle, borderBottomColor: themeColors.border }]}>
        {(['ALL', 'BIDS', 'MILESTONES', 'PAYMENTS'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterChip,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border, borderWidth: 1 },
              filter === f && [styles.filterChipActive, { backgroundColor: themeColors.primary, borderColor: themeColors.primary }],
            ]}
            onPress={() => setFilter(f)}
          >
            <Text style={[
              styles.filterChipText,
              { color: themeColors.textMuted },
              filter === f && styles.filterChipTextActive,
            ]}>
              {f === 'ALL'
                ? 'All'
                : f === 'BIDS'
                ? 'Proposals'
                : f === 'MILESTONES'
                ? 'Milestones'
                : 'Payments'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notifications List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, filtered.length === 0 && { flex: 1, justifyContent: 'center' }]}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ width: '100%' }}>
              <SkeletonNotificationItem />
              <SkeletonNotificationItem />
              <SkeletonNotificationItem />
              <SkeletonNotificationItem />
            </View>
          ) : (
            <View style={{ alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
              <Bell size={36} color={themeColors.textMuted} style={{ marginBottom: 8 }} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: themeColors.text, marginBottom: 4 }}>
                No Notifications
              </Text>
              <Text style={{ fontSize: 13, color: themeColors.textMuted, textAlign: 'center', maxWidth: 280, lineHeight: 18 }}>
                You're all caught up! Updates regarding incoming artisan proposals, milestone proofs, and escrow releases will appear here.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const renderTypeIcon = () => {
            switch (item.type) {
              case 'BID':
                return <Zap size={18} color="#D97706" />;
              case 'MILESTONE':
                return <Camera size={18} color="#0284C7" />;
              case 'PAYMENT':
                return <ShieldCheck size={18} color="#10B981" />;
              default:
                return <Info size={18} color={themeColors.textMuted} />;
            }
          };

          return (
            <TouchableOpacity
              style={[
                styles.card,
                { backgroundColor: themeColors.surface, borderColor: themeColors.border },
                !item.isRead && [styles.cardUnread, isDark && { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.25)' }],
              ]}
              onPress={() => {
                if (!item.isRead) markAsRead(item.id);
                onSelectNotification?.(item);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, { backgroundColor: themeColors.surfaceSubtle }]}>
                {renderTypeIcon()}
              </View>
              <View style={styles.metaCol}>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, { color: themeColors.text }]}>{item.title}</Text>
                  {!item.isRead && <View style={[styles.unreadDot, isDark && { backgroundColor: '#34D399' }]} />}
                  <Text style={[styles.timeText, { color: themeColors.textMuted }]}>{item.time}</Text>
                </View>
                <Text style={[styles.message, { color: themeColors.text }]}>{item.message}</Text>
                {item.actionText && (
                  <View style={styles.actionBtn}>
                    <Text style={[styles.actionBtnText, isDark && { color: '#34D399' }]}>{item.actionText} →</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  backBtnText: {
    fontSize: 22,
    color: colors.text,
    fontWeight: 'bold',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  markReadText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.background,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.xs,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'flex-start',
  },
  cardUnread: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  iconText: {
    fontSize: 18,
  },
  metaCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 6,
  },
  timeText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  message: {
    ...typography.caption,
    color: colors.text,
    lineHeight: 18,
  },
  actionBtn: {
    marginTop: 6,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
});
