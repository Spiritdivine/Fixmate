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
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { ChatService } from '../../services/chat.service';
import { socketManager } from '../../lib/socket-manager';
import { queryClient } from '../../lib/query-client';
import { MessageRecord } from '../../types/api-contracts';
import { useAuthStore } from '../../stores/authStore';

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
        text: m.body,
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
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.artisanHead}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{artisanInitials}</Text>
            <View style={styles.onlineBadge} />
          </View>
          <View style={styles.nameMeta}>
            <Text style={styles.artisanName}>{resolvedArtisanName}</Text>
            <Text style={styles.artisanSub}>⚡ Verified Artisan</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.callBtn} onPress={onCall} activeOpacity={0.7}>
          <Text style={styles.callBtnText}>📞</Text>
        </TouchableOpacity>
      </View>

      {/* Active Conversation Threads Bar */}
      {conversationsList && conversationsList.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.threadsScroll}
          contentContainerStyle={styles.threadsScrollContent}
        >
          {conversationsList.map((c: any) => {
            const isSel = c.id === targetConversationId;
            const p = c.participants?.find((part: any) => part.userId !== user?.id) || c.artisan;
            const pName = p?.user?.clientProfile?.firstName || p?.artisanProfile?.businessName || 'Artisan';
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.threadPill, isSel && styles.threadPillActive]}
                onPress={() => setActiveConversationId(c.id)}
              >
                <Text style={[styles.threadPillText, isSel && styles.threadPillTextActive]}>
                  💬 {pName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Pinned Live Status & Milestone Shortcut Bar */}
      <View style={styles.pinnedBanner}>
        <View style={styles.bannerLeft}>
          <Text style={styles.bannerTitle}>🛡️ Fixmate Escrow Protected</Text>
          <Text style={styles.bannerSubtitle}>Direct encrypted workspace dialogue</Text>
        </View>
        {onOpenMilestoneReview && (
          <TouchableOpacity
            style={styles.milestoneReviewBtn}
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
              <Text style={{ fontSize: 36, marginBottom: 8 }}>💬</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
                No messages yet
              </Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', maxWidth: 280, lineHeight: 18 }}>
                Discuss project specifications, arrival times, and site instructions with your artisan here.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            if (item.sender === 'system') {
              return (
                <View style={styles.systemMsgWrap}>
                  <Text style={styles.systemMsgText}>{item.text}</Text>
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
                  <View style={styles.miniAvatar}>
                    <Text style={styles.miniAvatarText}>{artisanInitials}</Text>
                  </View>
                )}
                <View
                  style={[
                    styles.msgBubble,
                    isClient ? styles.msgBubbleClient : styles.msgBubbleArtisan,
                  ]}
                >
                  {item.type === 'voice' ? (
                    <View style={styles.voiceNoteWrap}>
                      <Text style={styles.voiceIcon}>▶️</Text>
                      <View style={styles.waveformPlaceholder}>
                        <View style={[styles.waveBar, { height: 12 }]} />
                        <View style={[styles.waveBar, { height: 20 }]} />
                        <View style={[styles.waveBar, { height: 16 }]} />
                        <View style={[styles.waveBar, { height: 24 }]} />
                        <View style={[styles.waveBar, { height: 14 }]} />
                        <View style={[styles.waveBar, { height: 18 }]} />
                      </View>
                      <Text style={styles.voiceDuration}>{item.duration}</Text>
                    </View>
                  ) : (
                    <Text
                      style={[
                        styles.msgText,
                        isClient ? styles.msgTextClient : styles.msgTextArtisan,
                      ]}
                    >
                      {item.text}
                    </Text>
                  )}
                  <Text
                    style={[
                      styles.timestampText,
                      isClient ? styles.timestampClient : styles.timestampArtisan,
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
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachBtn} activeOpacity={0.7}>
            <Text style={styles.attachIcon}>📷</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message or instruction..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity style={styles.micBtn} activeOpacity={0.7}>
            <Text style={styles.micIcon}>🎙️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim()}
            activeOpacity={0.8}
          >
            <Text style={styles.sendIcon}>➤</Text>
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
