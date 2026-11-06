import React, { useState, useEffect, useRef } from 'react';
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
  Image,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { colors, radius, spacing, typography, shadows, useTheme } from '../../theme';
import { ChatService, SendMessagePayload } from '../../services/chat.service';
import { socketManager } from '../../lib/socket-manager';
import { queryClient } from '../../lib/query-client';
import { MessageRecord, ConversationRecord } from '../../types/api-contracts';
import { useAuthStore } from '../../stores/authStore';
import { MediaPicker } from '../../lib/media-picker';
import { AudioManager } from '../../lib/audio-manager';
import { useToast } from '../shared/ToastContext';
import { useOptimisticChat, OptimisticChatMessage } from '../../hooks';
import { UserAvatar } from '../shared/UserAvatar';

interface ChatThreadScreenProps {
  conversationId: string;
  recipientName?: string;
  recipientRole?: 'ARTISAN' | 'CLIENT';
  onBack: () => void;
  onCall?: () => void;
  onOpenMilestoneReview?: () => void;
}

type LocalMessage = OptimisticChatMessage;

export const ChatThreadScreen: React.FC<ChatThreadScreenProps> = ({
  conversationId,
  recipientName = 'Work Order Contact',
  recipientRole,
  onBack,
  onCall,
  onOpenMilestoneReview,
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const { showSuccess, showError, showInfo } = useToast();
  const { user } = useAuthStore();
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState<{ [id: string]: number }>({});

  const typingTimeoutRef = useRef<any>(null);
  const recordingTimerRef = useRef<any>(null);
  const flatListRef = useRef<FlatList>(null);

  // Fetch current conversation metadata (participants, job, contract)
  const { data: conversations } = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: () => ChatService.getConversations(),
  });

  const currentConv = conversations?.find((c) => c.id === conversationId);

  // Resolve Recipient Info
  const otherPart = currentConv?.participants?.find((p) => p.userId !== user?.id) || (currentConv as any)?.participant;
  const otherUser = otherPart?.user;
  const resolvedName =
    recipientName ||
    otherUser?.artisanProfile?.businessName ||
    (otherUser?.clientProfile?.firstName
      ? `${otherUser.clientProfile.firstName} ${otherUser.clientProfile.lastName || ''}`.trim()
      : 'Artisan Specialist');

  const initials = resolvedName
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'FX';

  // Fetch Messages for this conversation
  const { data: remoteMessages, isLoading } = useQuery({
    queryKey: ['chat-messages', conversationId],
    queryFn: () => ChatService.getMessages(conversationId),
    enabled: !!conversationId,
  });

  // Socket Room Registration & Real-Time Listeners
  useEffect(() => {
    if (!conversationId) return;

    // Join room
    socketManager.joinConversation(conversationId);
    socketManager.markRead(conversationId);
    ChatService.markAsRead(conversationId).catch(() => {});

    const socket = socketManager.getSocket();
    if (!socket) return;

    const handleNewMessage = (msg: MessageRecord) => {
      if (msg.conversationId === conversationId) {
        queryClient.invalidateQueries({ queryKey: ['chat-messages', conversationId] });
        queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
        // Mark as read immediately if chat is open
        socketManager.markRead(conversationId);
      }
    };

    const handleMessagesRead = (data: { conversationId: string; readerId: string }) => {
      if (data.conversationId === conversationId && data.readerId !== user?.id) {
        queryClient.invalidateQueries({ queryKey: ['chat-messages', conversationId] });
      }
    };

    const handleUserTyping = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === conversationId && data.userId !== user?.id) {
        setIsOtherUserTyping(true);
      }
    };

    const handleUserStopTyping = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === conversationId && data.userId !== user?.id) {
        setIsOtherUserTyping(false);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('messages_read', handleMessagesRead);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('messages_read', handleMessagesRead);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
      socketManager.leaveConversation(conversationId);
      AudioManager.stopSound().catch(() => {});
    };
  }, [conversationId, user?.id]);

  // Handle typing debounce
  const handleInputChange = (text: string) => {
    setInputText(text);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketManager.sendTyping(conversationId, true);

    typingTimeoutRef.current = setTimeout(() => {
      socketManager.sendTyping(conversationId, false);
    }, 2500);
  };

  const { sendMessage: sendOptimisticMessage } = useOptimisticChat(conversationId, user?.id);

  // Send Message Payload
  const handleSendMessage = async (payload: SendMessagePayload) => {
    socketManager.sendTyping(conversationId, false);

    try {
      await sendOptimisticMessage(payload);
    } catch (err: any) {
      showError('Send Error', err?.message || 'Could not send message. Please retry.');
    }
  };

  const handleSendText = () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');
    handleSendMessage({
      body: text,
      messageType: 'TEXT',
    });
  };

  // Image Attachment Flow
  const handleAttachmentPress = () => {
    Alert.alert('Send Image', 'Choose an attachment method:', [
      {
        text: 'Camera Photo',
        onPress: async () => {
          setIsUploadingMedia(true);
          const result = await MediaPicker.takePhoto();
          setIsUploadingMedia(false);
          if (result?.url) {
            handleSendMessage({
              body: 'Sent a project photo',
              messageType: 'IMAGE',
              attachmentUrl: result.url,
            });
          }
        },
      },
      {
        text: 'Photo Library',
        onPress: async () => {
          setIsUploadingMedia(true);
          const result = await MediaPicker.pickImage();
          setIsUploadingMedia(false);
          if (result?.url) {
            handleSendMessage({
              body: 'Sent an image attachment',
              messageType: 'IMAGE',
              attachmentUrl: result.url,
            });
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // Audio Recording Flow
  const handleStartVoiceRecording = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const started = await AudioManager.startRecording();
    if (started) {
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  const handleCancelVoiceRecording = async () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingSeconds(0);
    await AudioManager.cancelRecording();
  };

  const handleStopAndSendVoiceNote = async () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setIsUploadingMedia(true);

    const result = await AudioManager.stopRecording();
    setIsUploadingMedia(false);

    if (result?.url) {
      handleSendMessage({
        messageType: 'AUDIO',
        attachmentUrl: result.url,
        metadata: { duration: result.durationSeconds },
      });
    }
  };

  // Audio Playback
  const handleToggleAudioPlay = (msg: MessageRecord) => {
    if (!msg.attachmentUrl) return;

    if (playingAudioId === msg.id) {
      AudioManager.stopSound();
      setPlayingAudioId(null);
      return;
    }

    setPlayingAudioId(msg.id);
    AudioManager.playSound(msg.attachmentUrl, (status) => {
      if (status.durationMillis > 0) {
        setPlaybackProgress((prev) => ({
          ...prev,
          [msg.id]: status.positionMillis / status.durationMillis,
        }));
      }
      if (status.didJustFinish) {
        setPlayingAudioId(null);
        setPlaybackProgress((prev) => ({ ...prev, [msg.id]: 0 }));
      }
    });
  };

  // Message Actions (Long Press)
  const handleMessageLongPress = (msg: MessageRecord) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const isMine = msg.senderId === user?.id;

    const options: any[] = [
      {
        text: 'Copy Text',
        onPress: async () => {
          if (msg.body) {
            await Clipboard.setStringAsync(msg.body);
            showSuccess('Copied', 'Message copied to clipboard.');
          }
        },
      },
    ];

    if (isMine) {
      options.push({
        text: 'Delete Message',
        style: 'destructive',
        onPress: async () => {
          try {
            await ChatService.deleteMessage(msg.id);
            queryClient.invalidateQueries({ queryKey: ['chat-messages', conversationId] });
            showSuccess('Deleted', 'Message was removed.');
          } catch {
            showError('Error', 'Could not delete message');
          }
        },
      });
    }

    options.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Message Options', undefined, options);
  };

  const formatMessageTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Just now';
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.headerBorder }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={[styles.backBtnText, { color: themeColors.text }]}>←</Text>
        </TouchableOpacity>

        <View style={styles.participantInfo}>
          <UserAvatar
            url={otherUser?.avatarUrl}
            name={resolvedName}
            size={40}
            role={recipientRole}
          />
          <View style={[styles.nameMeta, { marginLeft: spacing.sm }]}>
            <Text style={[styles.participantName, { color: themeColors.text }]} numberOfLines={1}>
              {resolvedName}
            </Text>
            <Text style={[styles.participantSub, { color: themeColors.primary }]}>
              {recipientRole === 'ARTISAN' ? '⚡ Verified Artisan Specialist' : '🟢 Active Client Workspace'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.callBtn, { backgroundColor: themeColors.surfaceSubtle }]}
          onPress={onCall || (() => showInfo('Dialing Contact', `Initiating phone call to ${resolvedName}...`))}
          activeOpacity={0.7}
        >
          <Text style={styles.callBtnText}>📞</Text>
        </TouchableOpacity>
      </View>

      {/* Pinned Escrow & Work Order Context Bar */}
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
          <Text style={[styles.bannerTitle, isDark && { color: '#34D399' }]}>🛡️ Artifix Smart Escrow Protected</Text>
          <Text style={[styles.bannerSubtitle, { color: themeColors.textMuted }]}>
            {currentConv?.job?.title ? `Work Order: ${currentConv.job.title}` : 'Direct verified workspace dialogue'}
          </Text>
        </View>
        {onOpenMilestoneReview && (
          <TouchableOpacity
            style={[styles.milestoneBtn, { backgroundColor: themeColors.primary }]}
            onPress={onOpenMilestoneReview}
            activeOpacity={0.8}
          >
            <Text style={styles.milestoneBtnText}>Milestones</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Chat Messages List */}
      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={remoteMessages || []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.messageList,
            (!remoteMessages || remoteMessages.length === 0) && styles.emptyList,
          ]}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            isLoading ? (
              <ActivityIndicator size="small" color={themeColors.primary} style={{ marginTop: 40 }} />
            ) : (
              <View style={styles.emptyFeed}>
                <Text style={styles.emptyFeedIcon}>💬</Text>
                <Text style={[styles.emptyFeedTitle, { color: themeColors.text }]}>Start the Conversation</Text>
                <Text style={[styles.emptyFeedSub, { color: themeColors.textMuted }]}>
                  Coordinate arrival times, share photo specifications, or discuss job requirements safely inside Artifix.
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => {
            if (item.messageType === 'SYSTEM_ALERT') {
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
                  <Text style={[styles.systemText, isDark && { color: '#FCD34D' }]}>{item.body}</Text>
                </View>
              );
            }

            const isMe = item.senderId === user?.id;

            return (
              <TouchableOpacity
                activeOpacity={0.9}
                onLongPress={() => handleMessageLongPress(item)}
                style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}
              >
                {!isMe && (
                  <View style={[styles.miniAvatar, { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.2)' : colors.primaryLight }]}>
                    <Text style={[styles.miniAvatarText, { color: isDark ? '#34D399' : colors.primary }]}>{initials}</Text>
                  </View>
                )}

                <View
                  style={[
                    styles.bubble,
                    isMe
                      ? [styles.bubbleMe, isDark && { backgroundColor: '#065F46' }]
                      : [
                          styles.bubbleOther,
                          {
                            backgroundColor: themeColors.surface,
                            borderColor: themeColors.border,
                          },
                        ],
                  ]}
                >
                  {/* Image Attachment Rendering */}
                  {item.messageType === 'IMAGE' && item.attachmentUrl && (
                    <TouchableOpacity
                      onPress={() => setPreviewImageUrl(item.attachmentUrl!)}
                      activeOpacity={0.9}
                    >
                      <Image source={{ uri: item.attachmentUrl }} style={styles.attachmentImage} />
                    </TouchableOpacity>
                  )}

                  {/* Audio / Voice Note Rendering */}
                  {item.messageType === 'AUDIO' && item.attachmentUrl && (
                    <View style={styles.voiceNoteWrap}>
                      <TouchableOpacity
                        style={[styles.playBtn, isMe ? styles.playBtnMe : (isDark ? { backgroundColor: 'rgba(52, 211, 153, 0.2)' } : undefined)]}
                        onPress={() => handleToggleAudioPlay(item)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.playIcon, isDark && !isMe && { color: '#34D399' }]}>{playingAudioId === item.id ? '⏸' : '▶'}</Text>
                      </TouchableOpacity>

                      <View style={[styles.waveformContainer, isDark && { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
                        <View
                          style={[
                            styles.waveformTrack,
                            { width: `${Math.round((playbackProgress[item.id] || 0) * 100)}%` },
                          ]}
                        />
                        <View style={styles.waveBars}>
                          <View style={[styles.waveBar, { height: 10 }, isDark && { backgroundColor: '#34D399' }]} />
                          <View style={[styles.waveBar, { height: 18 }, isDark && { backgroundColor: '#34D399' }]} />
                          <View style={[styles.waveBar, { height: 14 }, isDark && { backgroundColor: '#34D399' }]} />
                          <View style={[styles.waveBar, { height: 22 }, isDark && { backgroundColor: '#34D399' }]} />
                          <View style={[styles.waveBar, { height: 16 }, isDark && { backgroundColor: '#34D399' }]} />
                          <View style={[styles.waveBar, { height: 12 }, isDark && { backgroundColor: '#34D399' }]} />
                        </View>
                      </View>

                      <Text style={[styles.voiceDuration, isMe ? styles.textMe : [styles.textOther, { color: themeColors.text }]]}>
                        {item.metadata?.duration ? `${item.metadata.duration}s` : 'Voice note'}
                      </Text>
                    </View>
                  )}

                  {/* Message Body Text */}
                  {item.body && item.messageType !== 'AUDIO' && (
                    <Text style={[styles.msgText, isMe ? styles.textMe : [styles.textOther, { color: themeColors.text }]]}>
                      {item.body}
                    </Text>
                  )}

                  {/* Footer Meta (Timestamp + Read receipt ticks) */}
                  <View style={styles.bubbleFooter}>
                    <Text style={[styles.timestamp, isMe ? styles.timestampMe : [styles.timestampOther, { color: themeColors.textMuted }]]}>
                      {formatMessageTime(item.createdAt)}
                    </Text>
                    {isMe && (
                      <Text style={[styles.tickStatus, item.isRead && styles.tickRead]}>
                        {(item as any).deliveryStatus === 'FAILED'
                          ? ' ⚠️'
                          : (item as any).deliveryStatus === 'SENDING' || item.isOptimistic
                          ? ' 🕒'
                          : item.isRead
                          ? ' ✓✓'
                          : ' ✓'}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />

        {/* Live Typing Indicator */}
        {isOtherUserTyping && (
          <View style={styles.typingBanner}>
            <Text style={styles.typingText}>⚡ {resolvedName} is typing...</Text>
          </View>
        )}

        {/* Media Uploading Overlay Banner */}
        {isUploadingMedia && (
          <View style={[styles.uploadingBanner, isDark && { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
            <ActivityIndicator size="small" color={isDark ? '#34D399' : colors.primary} />
            <Text style={[styles.uploadingText, isDark && { color: '#34D399' }]}>Uploading file securely...</Text>
          </View>
        )}

        {/* Bottom Input Bar */}
        {isRecording ? (
          <View style={[styles.recordingBar, isDark && { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderTopColor: 'rgba(239, 68, 68, 0.3)' }]}>
            <View style={styles.recordingPulse}>
              <View style={styles.redDot} />
              <Text style={[styles.recordingTimer, isDark && { color: '#F87171' }]}>Recording: {recordingSeconds}s</Text>
            </View>
            <View style={styles.recordingActions}>
              <TouchableOpacity
                onPress={handleCancelVoiceRecording}
                style={styles.cancelRecordingBtn}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelRecordingText, { color: themeColors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleStopAndSendVoiceNote}
                style={styles.sendVoiceBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.sendVoiceText}>Send Voice ➤</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={[styles.inputContainer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
            <TouchableOpacity
              style={styles.attachBtn}
              onPress={handleAttachmentPress}
              activeOpacity={0.7}
            >
              <Text style={styles.attachIcon}>📷</Text>
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
              onChangeText={handleInputChange}
              multiline
              maxLength={2000}
            />

            {inputText.trim().length === 0 ? (
              <TouchableOpacity
                style={styles.micBtn}
                onPress={handleStartVoiceRecording}
                activeOpacity={0.7}
              >
                <Text style={styles.micIcon}>🎙️</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: themeColors.primary }]}
                onPress={handleSendText}
                activeOpacity={0.8}
              >
                <Text style={styles.sendIcon}>➤</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Lightbox Image Preview Modal */}
      <Modal visible={!!previewImageUrl} transparent animationType="fade">
        <View style={styles.modalBg}>
          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={() => setPreviewImageUrl(null)}
            activeOpacity={0.8}
          >
            <Text style={styles.modalCloseText}>✕ Close</Text>
          </TouchableOpacity>
          {previewImageUrl && (
            <Image
              source={{ uri: previewImageUrl }}
              style={styles.modalFullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
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
  participantInfo: {
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
    marginRight: spacing.sm,
    position: 'relative',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    backgroundColor: colors.secondary,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  nameMeta: {
    flex: 1,
  },
  participantName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
  },
  participantSub: {
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
  milestoneBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  milestoneBtnText: {
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
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyFeed: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyFeedIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyFeedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  emptyFeedSub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 2,
  },
  msgRowMe: {
    justifyContent: 'flex-end',
  },
  msgRowOther: {
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
  bubble: {
    maxWidth: '78%',
    padding: spacing.sm,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  bubbleMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 2,
  },
  bubbleOther: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  attachmentImage: {
    width: 220,
    height: 160,
    borderRadius: radius.md,
    marginBottom: 6,
  },
  voiceNoteWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  playBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnMe: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  playIcon: {
    fontSize: 12,
    color: colors.primary,
  },
  waveformContainer: {
    width: 90,
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  waveformTrack: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.secondary,
    opacity: 0.4,
  },
  waveBars: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  waveBar: {
    width: 3,
    backgroundColor: colors.neutral[600],
    borderRadius: 1.5,
  },
  voiceDuration: {
    fontSize: 11,
    fontWeight: '700',
  },
  msgText: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  textMe: {
    color: '#FFFFFF',
  },
  textOther: {
    color: colors.text,
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 9,
  },
  timestampMe: {
    color: 'rgba(255,255,255,0.7)',
  },
  timestampOther: {
    color: colors.textMuted,
  },
  tickStatus: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
  },
  tickRead: {
    color: '#34D399',
    fontWeight: 'bold',
  },
  systemBox: {
    alignSelf: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.md,
    marginVertical: 4,
    maxWidth: '90%',
  },
  systemText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
    textAlign: 'center',
  },
  typingBanner: {
    paddingHorizontal: spacing.base,
    paddingVertical: 4,
    backgroundColor: 'transparent',
  },
  typingText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: colors.secondary,
    fontWeight: '600',
  },
  uploadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 6,
    backgroundColor: colors.primaryLight,
  },
  uploadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
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
    maxHeight: 100,
  },
  micBtn: {
    padding: spacing.xs,
  },
  micIcon: {
    fontSize: 20,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  recordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FEE2E2',
    borderTopWidth: 1,
    borderTopColor: '#FCA5A5',
  },
  recordingPulse: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  recordingTimer: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
  },
  recordingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelRecordingBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelRecordingText: {
    color: colors.neutral[600],
    fontWeight: '600',
    fontSize: 13,
  },
  sendVoiceBtn: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  sendVoiceText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    zIndex: 10,
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalFullImage: {
    width: '92%',
    height: '75%',
  },
});
