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
  type: 'LEAD' | 'PAYMENT' | 'CHAT' | 'SYSTEM';
  title: string;
  body: string;
  timeAgo: string;
  isRead: boolean;
  targetId?: string;
}

interface ArtisanNotificationsScreenProps {
  onBack?: () => void;
  onOpenNotification?: (id: string, type: string, targetId?: string) => void;
}

export const ArtisanNotificationsScreen: React.FC<ArtisanNotificationsScreenProps> = ({
  onBack,
  onOpenNotification,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'LEADS' | 'PAYMENTS'>('ALL');

  const { data: remoteNotifications, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['artisan-notifications'],
    queryFn: () => NotificationService.getNotifications(),
  });

  const items: NotificationItem[] = Array.isArray(remoteNotifications)
    ? remoteNotifications.map((n) => {
        let mappedType: NotificationItem['type'] = 'SYSTEM';
        if (n.type === 'LEAD_DISPATCH') mappedType = 'LEAD';
        if (n.type === 'RELEASE_APPROVED' || n.type === 'MILESTONE_FUNDED') mappedType = 'PAYMENT';

        return {
          id: n.id,
          type: mappedType,
          title: n.title,
          body: n.message,
          timeAgo: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: n.isRead,
          targetId: (n as any)?.metadata?.jobId || (n as any)?.metadata?.contractId || (n as any)?.metadata?.conversationId,
        };
      })
    : [];

  const markAllRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      await queryClient.invalidateQueries({ queryKey: ['artisan-notifications'] });
    } catch {
      // Graceful fallback
    }
  };

  const filteredItems = items.filter((n) => {
    if (filter === 'LEADS') return n.type === 'LEAD';
    if (filter === 'PAYMENTS') return n.type === 'PAYMENT';
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
              <Text style={styles.backChevron}>←</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        {items.length > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markReadText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setFilter('ALL')}
          style={[styles.tabBtn, filter === 'ALL' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, filter === 'ALL' && styles.tabTextActive]}>All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFilter('LEADS')}
          style={[styles.tabBtn, filter === 'LEADS' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, filter === 'LEADS' && styles.tabTextActive]}>
            ⚡ Leads
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFilter('PAYMENTS')}
          style={[styles.tabBtn, filter === 'PAYMENTS' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, filter === 'PAYMENTS' && styles.tabTextActive]}>
            💰 Payments
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.brand.forest} />
          <Text style={styles.loadingText}>Syncing notification center...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, filteredItems.length === 0 && { flexGrow: 1, justifyContent: 'center' }]}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <View style={styles.emptyInbox}>
              <Text style={styles.emptyInboxIcon}>🔔</Text>
              <Text style={styles.emptyInboxTitle}>All Caught Up</Text>
              <Text style={styles.emptyInboxSub}>
                No new notifications right now. New radar job alerts, escrow payouts, and client chat messages will appear here in real-time.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onOpenNotification?.(item.id, item.type, item.targetId)}
              style={[styles.notifCard, !item.isRead && styles.notifUnread]}
            >
              <View style={styles.topRow}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.timeAgo}>{item.timeAgo}</Text>
              </View>
              <Text style={styles.bodyText}>{item.body}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: {
    fontSize: 20,
    color: colors.neutral[900],
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: typography.size.base + 2,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  markReadText: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: colors.brand.forest,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    paddingVertical: 10,
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: '#F3F4F6',
  },
  tabBtnActive: {
    backgroundColor: colors.brand.forest,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral[600],
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: spacing.base,
    paddingTop: 6,
    paddingBottom: 40,
    gap: 10,
  },
  notifCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.sm,
  },
  notifUnread: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.size.xs + 1,
    fontWeight: '800',
    color: colors.neutral[900],
    flex: 1,
    marginRight: 6,
  },
  timeAgo: {
    fontSize: 10,
    color: colors.neutral[400],
  },
  bodyText: {
    fontSize: typography.size.xs,
    color: colors.neutral[600],
    marginTop: 4,
    lineHeight: 18,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: 12,
    fontSize: typography.size.sm,
    color: colors.neutral[600],
    fontWeight: '500',
  },
  emptyInbox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 48,
  },
  emptyInboxIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyInboxTitle: {
    fontSize: typography.size.lg,
    fontWeight: '800',
    color: colors.neutral[900],
    marginBottom: 8,
  },
  emptyInboxSub: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 20,
  },
});
