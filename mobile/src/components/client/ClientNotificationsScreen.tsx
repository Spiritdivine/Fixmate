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
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { NotificationService } from '../../services/notification.service';
import { queryClient } from '../../lib/query-client';

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

  const handleMarkAllRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch {
      // Graceful fallback
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'BIDS') return n.type === 'BID';
    if (filter === 'MILESTONES') return n.type === 'MILESTONE';
    if (filter === 'PAYMENTS') return n.type === 'PAYMENT';
    return true;
  });

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>Alerts, milestones & escrow updates</Text>
        </View>
        <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.7}>
          <Text style={styles.markReadText}>Mark all</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {(['ALL', 'BIDS', 'MILESTONES', 'PAYMENTS'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
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
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={{ marginTop: 8, color: colors.textMuted }}>Checking notification feed...</Text>
            </View>
          ) : (
            <View style={{ alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>🔔</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
                No Notifications
              </Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', maxWidth: 280, lineHeight: 18 }}>
                You're all caught up! Updates regarding incoming artisan proposals, milestone proofs, and escrow releases will appear here.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const icon =
            item.type === 'BID'
              ? '⚡'
              : item.type === 'MILESTONE'
              ? '📸'
              : item.type === 'PAYMENT'
              ? '🛡️'
              : '🤖';

          return (
            <TouchableOpacity
              style={[styles.card, !item.isRead && styles.cardUnread]}
              onPress={() => onSelectNotification?.(item)}
              activeOpacity={0.7}
            >
              <View style={styles.iconWrap}>
                <Text style={styles.iconText}>{icon}</Text>
              </View>
              <View style={styles.metaCol}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>{item.title}</Text>
                  {!item.isRead && <View style={styles.unreadDot} />}
                  <Text style={styles.timeText}>{item.time}</Text>
                </View>
                <Text style={styles.message}>{item.message}</Text>
                {item.actionText && (
                  <View style={styles.actionBtn}>
                    <Text style={styles.actionBtnText}>{item.actionText} →</Text>
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
