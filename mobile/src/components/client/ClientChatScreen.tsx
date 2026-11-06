import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  BadgeCheck,
  Phone,
  MessageSquare,
  ShieldCheck,
  Play,
  Camera,
  Mic,
  Send,
} from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows, useTheme } from '../../theme';
import { ChatService } from '../../services/chat.service';
import { socketManager } from '../../lib/socket-manager';
import { queryClient } from '../../lib/query-client';
import { MessageRecord } from '../../types/api-contracts';
import { useAuthStore } from '../../stores/authStore';
import { UserAvatar } from '../shared/UserAvatar';

interface MessageItem {
  id: string;
  sender: 'client' | 'artisan' | 'system';
  text: string;
  timestamp: string;
  type?: 'text' | 'image' | 'voice' | 'milestone_alert';
  duration?: string;
}

interface ClientChatScreenProps {
  conversationId?: string;
  artisanName?: string;
  onBack?: () => void;
  onCall?: () => void;
  onOpenMilestoneReview?: () => void;
}

export const ClientChatScreen: React.FC<ClientChatScreenProps> = ({
  conversationId,
  artisanName = 'Assigned Artisan',
  onBack,
  onCall,
  onOpenMilestoneReview,
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const { user } = useAuthStore();
  const [inputText, setInputText] = useState('');
  const [localMessages, setLocalMessages] = useState<MessageItem[]>([]);

  const { data: conversationsList } = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: () => ChatService.getConversations(),
  });

  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(conversationId);

  useEffect(() => {
    if (conversationId) {
      setActiveConversationId(conversationId);
    } else if (Array.isArray(conversationsList) && conversationsList.length > 0 && !activeConversationId) {
      setActiveConversationId(conversationsList[0].id);
    }
  }, [conversationId, conversationsList]);

  const targetConversationId = activeConversationId || conversationId;

  const currentConv = (conversationsList || []).find((c: any) => c.id === targetConversationId);
  const otherParticipant = currentConv?.participants?.find((p: any) => p.userId !== user?.id) || (currentConv as any)?.artisan;
  const resolvedArtisanName = otherParticipant?.user?.clientProfile?.firstName
    ? `${otherParticipant.user.clientProfile.firstName} ${otherParticipant.user.clientProfile.lastName || ''}`.trim()
    : otherParticipant?.artisanProfile?.businessName ||
      otherParticipant?.businessName ||
      artisanName;
  const resolvedArtisanAvatar = otherParticipant?.user?.avatarUrl || otherParticipant?.avatarUrl || otherParticipant?.artisanProfile?.avatarUrl;

  const { data: remoteMessages } = useQuery({
    queryKey: ['chat-messages', targetConversationId],
    queryFn: () => ChatService.getMessages(targetConversationId!),
    enabled: !!targetConversationId,
  });

  useEffect(() => {
    const socket = socketManager.getSocket();
    if (!socket || !targetConversationId) return;

    socket.emit('join_conversation', { conversationId: targetConversationId });

    const handleNewMessage = (msg: MessageRecord) => {
      if (msg.conversationId === targetConversationId) {
        queryClient.invalidateQueries({ queryKey: ['chat-messages', targetConversationId] });
      }
    };

    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
      socket.emit('leave_conversation', { conversationId: targetConversationId });
    };
  }, [targetConversationId]);

  const artisanInitials = resolvedArtisanName
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'AR';

  const displayMessages: MessageItem[] = [
    ...(remoteMessages || []).map((m) => {
      const isClient = m.senderId === user?.id;
      return {
        id: m.id,
        sender: (isClient ? 'client' : 'artisan') as 'client' | 'artisan',
        text: m.body || '',
        timestamp: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
        type: (m.messageType === 'AUDIO' ? 'voice' : 'text') as 'voice' | 'text',
      };
    }),
    ...localMessages,
  ];

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const body = inputText.trim();
    setInputText('');

    const newMsg: MessageItem = {
      id: Date.now().toString(),
      sender: 'client',
      text: body,
      timestamp: 'Just now',
      type: 'text',
    };
    setLocalMessages((prev) => [...prev, newMsg]);

    if (targetConversationId) {
      try {
        await ChatService.sendMessage(targetConversationId, {
          body,
          messageType: 'TEXT',
        });
        const socket = socketManager.getSocket();
        if (socket?.connected) {
          socket.emit('send_message', { conversationId: targetConversationId, body });
        }
      } catch (err) {
        // Optimistic UI remains intact
      }
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.headerBorder }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ChevronLeft size={22} color={themeColors.text} />
        </TouchableOpacity>
        <View style={styles.artisanHead}>
          <UserAvatar
            avatarUrl={resolvedArtisanAvatar}
            name={resolvedArtisanName}
            size={36}
            role="ARTISAN"
            style={{ marginRight: 8 }}
          />
          <View style={styles.nameMeta}>
            <Text style={[styles.artisanName, { color: themeColors.text }]}>{resolvedArtisanName}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <BadgeCheck size={12} color={themeColors.primary} />
              <Text style={[styles.artisanSub, { color: themeColors.primary, marginTop: 0 }]}>Verified Artisan</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={[styles.callBtn, { backgroundColor: themeColors.surfaceSubtle }]} onPress={onCall} activeOpacity={0.7}>
          <Phone size={18} color={themeColors.primary} />
        </TouchableOpacity>
      </View>

      {/* Active Conversation Threads Bar */}
      {conversationsList && conversationsList.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.threadsScroll, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}
          contentContainerStyle={styles.threadsScrollContent}
        >
          {conversationsList.map((c: any) => {
            const isSel = c.id === targetConversationId;
            const p = c.participants?.find((part: any) => part.userId !== user?.id) || c.artisan;
            const pName = p?.user?.clientProfile?.firstName || p?.artisanProfile?.businessName || 'Artisan';
            return (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.threadPill,
                  { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border },
                  isSel && { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : colors.primaryLight, borderColor: themeColors.primary },
                ]}
                onPress={() => setActiveConversationId(c.id)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MessageSquare size={13} color={isSel ? themeColors.primary : themeColors.textMuted} />
                  <Text
                    style={[
                      styles.threadPillText,
                      { color: themeColors.textMuted },
                      isSel && { color: themeColors.primary, fontWeight: '700' },
                    ]}
                  >
                    {pName}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Pinned Live Status & Milestone Shortcut Bar */}
      <View
        style={[
          styles.pinnedBanner,
          isDark && {
            backgroundColor: 'rgba(52, 211, 153, 0.12)',
            borderBottomColor: 'rgba(52, 211, 153, 0.25)',
          },
        ]}
      >
        <View style={styles.bannerLeft}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <ShieldCheck size={14} color={isDark ? '#34D399' : '#10B981'} />
            <Text style={[styles.bannerTitle, isDark && { color: '#34D399' }]}>Artifix Escrow Protected</Text>
          </View>
          <Text style={[styles.bannerSubtitle, { color: themeColors.textMuted }]}>Direct encrypted workspace dialogue</Text>
        </View>
        {onOpenMilestoneReview && (
          <TouchableOpacity
            style={[styles.milestoneReviewBtn, { backgroundColor: themeColors.primary }]}
            onPress={onOpenMilestoneReview}
            activeOpacity={0.8}
          >
            <Text style={styles.milestoneReviewBtnText}>Milestones</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Message List */}
      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={displayMessages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.messageList, displayMessages.length === 0 && { flex: 1, justifyContent: 'center' }]}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
              <MessageSquare size={36} color={themeColors.textMuted} style={{ marginBottom: 8 }} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: themeColors.text, marginBottom: 4 }}>
                No messages yet
              </Text>
              <Text style={{ fontSize: 13, color: themeColors.textMuted, textAlign: 'center', maxWidth: 280, lineHeight: 18 }}>
                Discuss project specifications, arrival times, and site instructions with your artisan here.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            if (item.sender === 'system') {
              return (
                <View style={[styles.systemMsgWrap, isDark && { backgroundColor: themeColors.surfaceSubtle }]}>
                  <Text style={[styles.systemMsgText, { color: themeColors.textMuted }]}>{item.text}</Text>
                </View>
              );
            }

            const isClient = item.sender === 'client';
            return (
              <View
                style={[
                  styles.msgRow,
                  isClient ? styles.msgRowClient : styles.msgRowArtisan,
                ]}
              >
                {!isClient && (
                  <View style={[styles.miniAvatar, isDark && { backgroundColor: 'rgba(52, 211, 153, 0.2)' }]}>
                    <Text style={[styles.miniAvatarText, isDark && { color: '#34D399' }]}>{artisanInitials}</Text>
                  </View>
                )}
                <View
                  style={[
                    styles.msgBubble,
                    isClient
                      ? [styles.msgBubbleClient, isDark && { backgroundColor: '#065F46' }]
                      : [styles.msgBubbleArtisan, { backgroundColor: themeColors.surface, borderColor: themeColors.border }],
                  ]}
                >
                  {item.type === 'voice' ? (
                    <View style={styles.voiceNoteWrap}>
                      <Play size={14} color={isClient ? '#FFFFFF' : themeColors.text} fill={isClient ? '#FFFFFF' : themeColors.text} />
                      <View style={styles.waveformPlaceholder}>
                        <View style={[styles.waveBar, { height: 12, backgroundColor: isDark ? '#34D399' : colors.primary }]} />
                        <View style={[styles.waveBar, { height: 20, backgroundColor: isDark ? '#34D399' : colors.primary }]} />
                        <View style={[styles.waveBar, { height: 16, backgroundColor: isDark ? '#34D399' : colors.primary }]} />
                        <View style={[styles.waveBar, { height: 24, backgroundColor: isDark ? '#34D399' : colors.primary }]} />
                        <View style={[styles.waveBar, { height: 14, backgroundColor: isDark ? '#34D399' : colors.primary }]} />
                        <View style={[styles.waveBar, { height: 18, backgroundColor: isDark ? '#34D399' : colors.primary }]} />
                      </View>
                      <Text style={[styles.voiceDuration, { color: isClient ? 'rgba(255,255,255,0.85)' : themeColors.textMuted }]}>{item.duration}</Text>
                    </View>
                  ) : (
                    <Text
                      style={[
                        styles.msgText,
                        isClient ? styles.msgTextClient : [styles.msgTextArtisan, { color: themeColors.text }],
                      ]}
                    >
                      {item.text}
                    </Text>
                  )}
                  <Text
                    style={[
                      styles.timestampText,
                      isClient ? styles.timestampClient : [styles.timestampArtisan, { color: themeColors.textMuted }],
                    ]}
                  >
                    {item.timestamp}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        {/* Input Bar */}
        <View style={[styles.inputContainer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
          <TouchableOpacity style={styles.attachBtn} activeOpacity={0.7}>
            <Camera size={20} color={themeColors.textMuted} />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: themeColors.inputBg,
                borderColor: themeColors.inputBorder,
                color: themeColors.text,
              },
            ]}
            placeholder="Type a message or instruction..."
            placeholderTextColor={themeColors.textMuted}
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity style={styles.micBtn} activeOpacity={0.7}>
            <Mic size={20} color={themeColors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: themeColors.primary },
              !inputText.trim() && [styles.sendBtnDisabled, isDark && { backgroundColor: themeColors.border }],
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
            activeOpacity={0.8}
          >
            <Send size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    marginRight: spacing.xs,
  },
  backBtnText: {
    fontSize: 22,
    color: colors.text,
    fontWeight: 'bold',
  },
  artisanHead: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
    position: 'relative',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  nameMeta: {
    flex: 1,
  },
  artisanName: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text,
  },
  artisanSub: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
  },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callBtnText: {
    fontSize: 18,
  },
  threadsScroll: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    maxHeight: 44,
  },
  threadsScrollContent: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    flexDirection: 'row',
    gap: 8,
  },
  threadPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  threadPillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  threadPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
  },
  threadPillTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  pinnedBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: '#A7F3D0',
  },
  bannerLeft: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
  },
  bannerSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
  },
  milestoneReviewBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  milestoneReviewBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  chatArea: {
    flex: 1,
  },
  messageList: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  systemMsgWrap: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    alignSelf: 'center',
    marginVertical: 4,
    maxWidth: '90%',
  },
  systemMsgText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: '500',
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 3,
  },
  msgRowClient: {
    justifyContent: 'flex-end',
  },
  msgRowArtisan: {
    justifyContent: 'flex-start',
  },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    marginBottom: 4,
  },
  miniAvatarText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.primary,
  },
  msgBubble: {
    maxWidth: '78%',
    padding: spacing.sm,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  msgBubbleClient: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 2,
  },
  msgBubbleArtisan: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  msgText: {
    ...typography.body,
    lineHeight: 20,
  },
  msgTextClient: {
    color: '#FFFFFF',
  },
  msgTextArtisan: {
    color: colors.text,
  },
  timestampText: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timestampClient: {
    color: 'rgba(255,255,255,0.7)',
  },
  timestampArtisan: {
    color: colors.textMuted,
  },
  voiceNoteWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  voiceIcon: {
    fontSize: 16,
  },
  waveformPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  waveBar: {
    width: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  voiceDuration: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  attachBtn: {
    padding: spacing.xs,
  },
  attachIcon: {
    fontSize: 20,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.xs,
  },
  micBtn: {
    padding: spacing.xs,
  },
  micIcon: {
    fontSize: 18,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  sendIcon: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
