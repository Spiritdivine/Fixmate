import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  RefreshControl,
  Image,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, radius, spacing, typography, shadows, useTheme } from '../../theme';
import { ChatService } from '../../services/chat.service';
import { socketManager } from '../../lib/socket-manager';
import { queryClient } from '../../lib/query-client';
import { ConversationRecord } from '../../types/api-contracts';
import { useAuthStore } from '../../stores/authStore';
import { UserAvatar } from '../shared/UserAvatar';

interface ChatInboxScreenProps {
  userRole?: 'CLIENT' | 'ARTISAN';
  onSelectConversation: (conversationId: string, participantName?: string) => void;
  onBack?: () => void;
  onExploreServices?: () => void;
}

type FilterTab = 'ALL' | 'ESCROW' | 'UNREAD';

export const ChatInboxScreen: React.FC<ChatInboxScreenProps> = ({
  userRole = 'CLIENT',
  onSelectConversation,
  onBack,
  onExploreServices,
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  const { data: conversations, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: () => ChatService.getConversations(),
  });

  // Real-time inbox update when any new message arrives
  useEffect(() => {
    const socket = socketManager.getSocket();
    if (!socket) return;

    const handleNewMessage = () => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    };

    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, []);

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`;
    if (diffSec < 172800) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const filteredConversations = useMemo(() => {
    if (!conversations || !Array.isArray(conversations)) return [];

    return conversations.filter((c: ConversationRecord) => {
      // Find other participant
      const otherPart = c.participants?.find((p) => p.userId !== user?.id) || (c as any).participant;
      const otherUser = otherPart?.user;
      const artisanProf = otherUser?.artisanProfile || (c as any).artisan;
      const clientProf = otherUser?.clientProfile;

      const name = userRole === 'CLIENT'
        ? artisanProf?.businessName || (artisanProf?.firstName ? `${artisanProf.firstName} ${artisanProf.lastName || ''}`.trim() : 'Artisan')
        : (clientProf?.firstName ? `${clientProf.firstName} ${clientProf.lastName || ''}`.trim() : 'Client');

      const jobTitle = c.job?.title || '';
      const matchesSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        jobTitle.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeTab === 'ESCROW') {
        return !!c.contractId || !!c.jobId;
      }
      if (activeTab === 'UNREAD') {
        return (c.unreadCount || 0) > 0;
      }

      return true;
    });
  }, [conversations, searchQuery, activeTab, user?.id, userRole]);

  const totalUnread = useMemo(() => {
    if (!conversations) return 0;
    return conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  }, [conversations]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.headerBorder }]}>
        <View style={styles.headerTitleRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
              <Text style={[styles.backBtnText, { color: themeColors.text }]}>←</Text>
            </TouchableOpacity>
          )}
          <View>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>Messages</Text>
            <Text style={[styles.headerSub, { color: themeColors.textMuted }]}>
              {userRole === 'CLIENT' ? 'Artisan Work Order Dialogues' : 'Client Discussions & Leads'}
            </Text>
          </View>
        </View>

        {totalUnread > 0 && (
          <View style={[styles.totalUnreadBadge, { backgroundColor: isDark ? '#059669' : colors.secondary }]}>
            <Text style={styles.totalUnreadText}>{totalUnread} new</Text>
          </View>
        )}
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: themeColors.surface }]}>
        <View style={[styles.searchBox, { backgroundColor: themeColors.inputBg, borderColor: themeColors.inputBorder }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: themeColors.text }]}
            placeholder="Search by name, trade, or work order..."
            placeholderTextColor={themeColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={[styles.clearSearchIcon, { color: themeColors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.tabsRow, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity
          style={[
            styles.tabPill,
            { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border },
            activeTab === 'ALL' && [
              styles.tabPillActive,
              { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : colors.primaryLight, borderColor: themeColors.primary },
            ],
          ]}
          onPress={() => setActiveTab('ALL')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              { color: themeColors.textMuted },
              activeTab === 'ALL' && [styles.tabTextActive, { color: themeColors.primary }],
            ]}
          >
            All Messages
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabPill,
            { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border },
            activeTab === 'ESCROW' && [
              styles.tabPillActive,
              { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : colors.primaryLight, borderColor: themeColors.primary },
            ],
          ]}
          onPress={() => setActiveTab('ESCROW')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              { color: themeColors.textMuted },
              activeTab === 'ESCROW' && [styles.tabTextActive, { color: themeColors.primary }],
            ]}
          >
            🛡️ Active Escrow
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabPill,
            { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border },
            activeTab === 'UNREAD' && [
              styles.tabPillActive,
              { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : colors.primaryLight, borderColor: themeColors.primary },
            ],
          ]}
          onPress={() => setActiveTab('UNREAD')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              { color: themeColors.textMuted },
              activeTab === 'UNREAD' && [styles.tabTextActive, { color: themeColors.primary }],
            ]}
          >
            Unread {totalUnread > 0 ? `(${totalUnread})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isLoading || isRefetching}
            onRefresh={() => { refetch(); }}
            tintColor={themeColors.primary}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          filteredConversations.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
              {searchQuery ? 'No matching conversations' : 'No messages yet'}
            </Text>
            <Text style={[styles.emptySub, { color: themeColors.textMuted }]}>
              {userRole === 'CLIENT'
                ? 'Contact artisans from directory or post a job to begin coordinating tasks.'
                : 'Proposals you submit and clients contacting you will appear here.'}
            </Text>
            {onExploreServices && (
              <TouchableOpacity
                style={[styles.emptyCta, { backgroundColor: themeColors.primary }]}
                onPress={onExploreServices}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyCtaText}>
                  {userRole === 'CLIENT' ? 'Find Verified Artisans' : 'Browse Available Jobs'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const otherPart = item.participants?.find((p) => p.userId !== user?.id) || (item as any).participant;
          const otherUser = otherPart?.user;
          const artisanProf = otherUser?.artisanProfile || (item as any).artisan;
          const clientProf = otherUser?.clientProfile;

          const displayName = userRole === 'CLIENT'
            ? artisanProf?.businessName ||
              (artisanProf?.firstName ? `${artisanProf.firstName} ${artisanProf.lastName || ''}`.trim() : 'Verified Artisan')
            : (clientProf?.firstName ? `${clientProf.firstName} ${clientProf.lastName || ''}`.trim() : 'Client Workspace');

          const avatarUrl = otherUser?.avatarUrl || artisanProf?.avatarUrl || clientProf?.avatarUrl;

          const lastMsg = item.messages?.[0] || item.lastMessage;
          const unreadCount = item.unreadCount || 0;

          // Snippet generation
          let snippet = 'Tap to open chat';
          if (lastMsg) {
            if (lastMsg.messageType === 'IMAGE') snippet = '📷 [Photo attachment]';
            else if (lastMsg.messageType === 'AUDIO') {
              const dur = lastMsg.metadata?.duration ? `${lastMsg.metadata.duration}s` : '';
              snippet = `🎙️ [Voice note ${dur}]`.trim();
            } else if (lastMsg.body) {
              snippet = lastMsg.body;
            }
          }

          return (
            <TouchableOpacity
              style={[
                styles.card,
                { backgroundColor: themeColors.surface, borderColor: themeColors.border },
                unreadCount > 0 && [
                  styles.cardUnread,
                  {
                    borderColor: isDark ? '#059669' : colors.secondary,
                    backgroundColor: isDark ? 'rgba(52, 211, 153, 0.05)' : '#FAFCFA',
                  },
                ],
              ]}
              onPress={() => onSelectConversation(item.id, displayName)}
              activeOpacity={0.7}
            >
              {/* Avatar */}
              <View style={styles.avatarWrap}>
                <UserAvatar
                  avatarUrl={avatarUrl}
                  name={displayName}
                  size={48}
                  role={userRole === 'CLIENT' ? 'ARTISAN' : 'CLIENT'}
                />
                <View style={[styles.onlineDot, { borderColor: themeColors.surface }]} />
              </View>

              {/* Middle content */}
              <View style={styles.cardCenter}>
                <View style={styles.cardTopRow}>
                  <Text
                    style={[
                      styles.participantName,
                      { color: themeColors.text },
                      unreadCount > 0 && [styles.nameBold, { color: isDark ? '#34D399' : colors.primaryDark }],
                    ]}
                    numberOfLines={1}
                  >
                    {displayName}
                  </Text>
                  <Text
                    style={[
                      styles.timeText,
                      { color: themeColors.textMuted },
                      unreadCount > 0 && [styles.timeActive, { color: isDark ? '#34D399' : colors.secondary }],
                    ]}
                  >
                    {formatTimeAgo(item.lastMessageAt || item.messages?.[0]?.createdAt)}
                  </Text>
                </View>

                {item.job?.title && (
                  <View
                    style={[
                      styles.jobBadge,
                      {
                        backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : '#F3F4F6',
                        borderColor: isDark ? 'rgba(52, 211, 153, 0.3)' : '#E5E7EB',
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <Text style={[styles.jobBadgeText, { color: isDark ? '#34D399' : colors.neutral[700] }]} numberOfLines={1}>
                      ⚡ {item.job.title}
                    </Text>
                  </View>
                )}

                <View style={styles.cardBottomRow}>
                  <Text
                    style={[
                      styles.snippetText,
                      { color: themeColors.textMuted },
                      unreadCount > 0 && [styles.snippetUnread, { color: themeColors.text }],
                    ]}
                    numberOfLines={1}
                  >
                    {snippet}
                  </Text>
                  {unreadCount > 0 && (
                    <View style={[styles.unreadPill, { backgroundColor: isDark ? '#059669' : colors.secondary }]}>
                      <Text style={styles.unreadPillText}>{unreadCount}</Text>
                    </View>
                  )}
                </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: spacing.xs,
  },
  backBtnText: {
    fontSize: 22,
    color: colors.text,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  headerSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  totalUnreadBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  totalUnreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text,
  },
  clearSearchIcon: {
    fontSize: 14,
    color: colors.textMuted,
    padding: 4,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabPillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  listContent: {
    padding: spacing.base,
    gap: spacing.sm,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardUnread: {
    borderColor: colors.secondary,
    backgroundColor: '#FAFCFA',
  },
  avatarWrap: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  cardCenter: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    maxWidth: '72%',
  },
  nameBold: {
    fontWeight: '800',
    color: colors.primaryDark,
  },
  timeText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  timeActive: {
    color: colors.secondary,
    fontWeight: '700',
  },
  jobBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    marginBottom: 4,
  },
  jobBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  snippetText: {
    fontSize: 13,
    color: colors.textMuted,
    flex: 1,
    marginRight: spacing.xs,
  },
  snippetUnread: {
    color: colors.text,
    fontWeight: '600',
  },
  unreadPill: {
    backgroundColor: colors.secondary,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyCta: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radius.full,
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
