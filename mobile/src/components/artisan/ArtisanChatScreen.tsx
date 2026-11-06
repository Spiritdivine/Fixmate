import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { colors, radius, spacing, typography, shadows, useTheme } from '../../theme';
import { ChatService } from '../../services/chat.service';
import { socketManager } from '../../lib/socket-manager';
import { queryClient } from '../../lib/query-client';
import { MessageRecord } from '../../types/api-contracts';

import { useAuthStore } from '../../stores/authStore';

interface ChatMessage {
  id: string;
  sender: 'ARTISAN' | 'CLIENT' | 'SYSTEM';
  text?: string;
  audioDuration?: string;
  imageUrl?: string;
  timestamp: string;
}

interface ArtisanChatScreenProps {
  conversationId?: string;
  clientName?: string;
  onBack?: () => void;
  onCallClient?: () => void;
}

export const ArtisanChatScreen: React.FC<ArtisanChatScreenProps> = ({
  conversationId: propConversationId,
  clientName: propClientName,
  onBack,
  onCallClient,
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const { user } = useAuthStore();
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);

  // If no conversationId prop, find first active conversation
  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => ChatService.getConversations(),
  });

  const activeConversation = propConversationId
    ? conversations?.find((c) => c.id === propConversationId)
    : conversations?.[0];

  const activeConversationId = propConversationId || activeConversation?.id;

  const resolvedClientName =
    propClientName ||
    (activeConversation as any)?.client?.clientProfile?.firstName ||
    (activeConversation as any)?.participant?.name ||
    'Client Workspace';

  const { data: remoteMessages } = useQuery({
    queryKey: ['chat-messages', activeConversationId],
    queryFn: () => ChatService.getMessages(activeConversationId!),
    enabled: !!activeConversationId,
  });

  useEffect(() => {
    const socket = socketManager.getSocket();
    if (!socket || !activeConversationId) return;

    socket.emit('join_conversation', { conversationId: activeConversationId });

    const handleNewMessage = (msg: MessageRecord) => {
      if (msg.conversationId === activeConversationId) {
        queryClient.invalidateQueries({ queryKey: ['chat-messages', activeConversationId] });
      }
    };

    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
      socket.emit('leave_conversation', { conversationId: activeConversationId });
    };
  }, [activeConversationId]);

  const displayMessages: ChatMessage[] = [
    ...(remoteMessages || []).map((m) => {
      const isMe = m.senderId === user?.id || (m as any).senderRole === 'ARTISAN';
      return {
        id: m.id,
        sender: (isMe ? 'ARTISAN' : 'CLIENT') as 'ARTISAN' | 'CLIENT',
        text: m.body,
        timestamp: m.createdAt
          ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Just now',
      };
    }),
    ...localMessages,
  ];

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const body = inputText.trim();
    setInputText('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: 'ARTISAN',
      text: body,
      timestamp: 'Just now',
    };
    setLocalMessages((prev) => [...prev, newMsg]);

    if (activeConversationId) {
      try {
        await ChatService.sendMessage(activeConversationId, {
          body,
          messageType: 'TEXT',
        });
        const socket = socketManager.getSocket();
        if (socket?.connected) {
          socket.emit('send_message', { conversationId: activeConversationId, body });
        }
      } catch (err) {
        // Optimistic local state remains
      }
    }
  };

  const handleVoiceNoteToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isRecording) {
      setIsRecording(true);
    } else {
      setIsRecording(false);
      const audioMsg: ChatMessage = {
        id: `m-${Date.now()}`,
        sender: 'ARTISAN',
        audioDuration: '0:12',
        timestamp: 'Just now',
      };
      setLocalMessages((prev) => [...prev, audioMsg]);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderColor: themeColors.headerBorder }]}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
              <Text style={[styles.backChevron, { color: themeColors.text }]}>←</Text>
            </TouchableOpacity>
          )}
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120',
            }}
            style={styles.avatar}
          />
          <View>
            <View style={styles.nameRow}>
              <Text style={[styles.clientName, { color: themeColors.text }]}>{resolvedClientName}</Text>
              <Text style={styles.verifiedCheck}>✓</Text>
            </View>
            <Text style={styles.onlineStatus}>🟢 Active now</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={onCallClient || (() => Alert.alert('Calling Client', `Dialing ${resolvedClientName}...`))}
          style={[styles.callButton, { backgroundColor: themeColors.surfaceSubtle }]}
        >
          <Text style={styles.callEmoji}>📞</Text>
        </TouchableOpacity>
      </View>

      {/* Pinned Milestone Context Sub-Bar */}
      <View
        style={[
          styles.milestoneContextBar,
          isDark && {
            backgroundColor: 'rgba(52, 211, 153, 0.12)',
            borderColor: 'rgba(52, 211, 153, 0.25)',
          },
        ]}
      >
        <Text style={styles.contextIcon}>⚡</Text>
        <Text style={[styles.contextText, isDark && { color: '#34D399' }]}>
          {(activeConversation as any)?.title || 'Direct Client Work Order • Smart Escrow Protected'}
        </Text>
      </View>

      {/* Message Feed */}
      <FlatList
        data={displayMessages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.messageList, displayMessages.length === 0 && { flexGrow: 1, justifyContent: 'center' }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyFeed}>
            <Text style={styles.emptyFeedIcon}>💬</Text>
            <Text style={[styles.emptyFeedTitle, { color: themeColors.text }]}>No Messages Yet</Text>
            <Text style={[styles.emptyFeedSub, { color: themeColors.textMuted }]}>
              Send a message to your client to coordinate arrival times, discuss materials, or confirm job requirements.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          if (item.sender === 'SYSTEM') {
            return (
              <View
                style={[
                  styles.systemBox,
                  isDark && {
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    borderWidth: 1,
                    borderColor: 'rgba(245, 158, 11, 0.3)',
                  },
                ]}
              >
                <Text style={[styles.systemText, isDark && { color: '#FCD34D' }]}>{item.text}</Text>
              </View>
            );
          }

          const isMe = item.sender === 'ARTISAN';
          return (
            <View style={[styles.bubbleWrapper, isMe ? styles.wrapperMe : styles.wrapperClient]}>
              <View
                style={[
                  styles.bubble,
                  isMe
                    ? [styles.bubbleMe, isDark && { backgroundColor: '#065F46' }]
                    : [
                        styles.bubbleClient,
                        {
                          backgroundColor: themeColors.surface,
                          borderColor: themeColors.border,
                          borderWidth: 1,
                        },
                      ],
                ]}
              >
                {item.text && (
                  <Text style={[styles.bubbleText, isMe ? styles.textMe : [styles.textClient, { color: themeColors.text }]]}>
                    {item.text}
                  </Text>
                )}

                {item.audioDuration && (
                  <View style={styles.audioRow}>
                    <TouchableOpacity style={styles.playBtn}>
                      <Text style={styles.playIcon}>{isMe ? '▶' : '▶'}</Text>
                    </TouchableOpacity>
                    <View style={styles.audioWaveform}>
                      <View style={[styles.waveBar, { height: 12 }]} />
                      <View style={[styles.waveBar, { height: 20 }]} />
                      <View style={[styles.waveBar, { height: 16 }]} />
                      <View style={[styles.waveBar, { height: 22 }]} />
                      <View style={[styles.waveBar, { height: 8 }]} />
                    </View>
                    <Text style={[styles.audioDurationText, isMe && styles.durationMe]}>
                      {item.audioDuration}
                    </Text>
                  </View>
                )}

                <Text style={[styles.timestampText, isMe ? styles.timeMe : [styles.timeClient, { color: themeColors.textMuted }]]}>
                  {item.timestamp}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {/* Input Toolbar */}
      <View style={[styles.inputToolbar, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
        <TouchableOpacity style={styles.cameraBtn}>
          <Text style={styles.cameraIcon}>📷</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleVoiceNoteToggle}
          style={[styles.micBtn, isRecording && styles.micBtnRecording]}
        >
          <Text style={styles.micIcon}>{isRecording ? '⏹️' : '🎙️'}</Text>
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
          placeholder={isRecording ? 'Recording voice note...' : 'Type message...'}
          placeholderTextColor={themeColors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          editable={!isRecording}
        />

        <TouchableOpacity onPress={handleSend} style={[styles.sendBtn, { backgroundColor: themeColors.primary }]}>
          <Text style={styles.sendIcon}>➔</Text>
        </TouchableOpacity>
      </View>
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
    gap: 10,
  },
  backButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: {
    fontSize: 20,
    color: colors.neutral[900],
    fontWeight: 'bold',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clientName: {
    fontSize: typography.size.sm + 1,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  verifiedCheck: {
    color: colors.brand.emerald,
    fontSize: 10,
    fontWeight: 'bold',
  },
  onlineStatus: {
    fontSize: 10,
    color: colors.neutral[500],
    marginTop: 1,
  },
  callButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callEmoji: {
    fontSize: 16,
  },
  milestoneContextBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: spacing.base,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderColor: '#BBF7D0',
    gap: 6,
  },
  contextIcon: {
    fontSize: 11,
  },
  contextText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand.forest,
  },
  messageList: {
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
    gap: 10,
  },
  systemBox: {
    alignSelf: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
    marginVertical: 4,
    maxWidth: '85%',
  },
  systemText: {
    fontSize: 10,
    color: '#92400E',
    fontWeight: '600',
    textAlign: 'center',
  },
  bubbleWrapper: {
    width: '100%',
    flexDirection: 'row',
  },
  wrapperMe: {
    justifyContent: 'flex-end',
  },
  wrapperClient: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMe: {
    backgroundColor: colors.brand.forest,
    borderBottomRightRadius: 4,
  },
  bubbleClient: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: typography.size.sm,
    lineHeight: 20,
  },
  textMe: {
    color: '#FFFFFF',
  },
  textClient: {
    color: colors.neutral[900],
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 11,
    color: '#FFFFFF',
    marginLeft: 2,
  },
  audioWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  waveBar: {
    width: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  audioDurationText: {
    fontSize: 10,
    color: '#D1FAE5',
    fontWeight: '700',
  },
  durationMe: {
    color: '#A7F3D0',
  },
  timestampText: {
    fontSize: 9,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  timeMe: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  timeClient: {
    color: colors.neutral[400],
  },
  inputToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#F3F4F6',
    gap: 8,
  },
  cameraBtn: {
    padding: 6,
  },
  cameraIcon: {
    fontSize: 20,
  },
  micBtn: {
    padding: 6,
    borderRadius: radius.full,
  },
  micBtnRecording: {
    backgroundColor: '#FEE2E2',
  },
  micIcon: {
    fontSize: 20,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: typography.size.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  emptyFeed: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyFeedIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyFeedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 8,
  },
  emptyFeedSub: {
    fontSize: 14,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 20,
  },
});
