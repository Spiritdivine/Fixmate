import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  FlatList,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  Send,
  Paperclip,
  Mic,
  Square,
  X,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Star,
  MapPin,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  Package,
  Wrench,
  ArrowRight,
  User,
  MessageSquare,
  MapPinOff,
  FileText,
  History,
  Plus,
  Clock,
} from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { Storage } from '../../lib/storage';
import { AiService } from '../../services/ai.service';
import { ChatService } from '../../services/chat.service';
import { LocationProvider } from '../../lib/location-provider';
import { AudioRecorder } from '../../lib/audio-recorder';
import { DiagnosticBOMItem, MatchedArtisanDossier } from '../../types/ai-contracts';

export interface OgaJohnAiStudioScreenProps {
  onBack?: () => void;
  onPostJobWithDiagnosis?: (diagnosis: {
    issueTitle: string;
    trade: string;
    costMin?: number;
    costMax?: number;
    preferredArtisanId?: string;
    billOfMaterials?: DiagnosticBOMItem[];
    description?: string;
  }) => void;
  onViewArtisanProfile?: (artisanId: string) => void;
  onBookArtisanChat?: (artisanId: string, conversationId?: string, artisanName?: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text?: string;
  imageUris?: string[];
  audioUri?: string;
  audioDurationSeconds?: number;
  safetyWarning?: string;
  billOfMaterials?: DiagnosticBOMItem[];
  isBomExpanded?: boolean;
  matchedArtisans?: MatchedArtisanDossier[];
  isArtisansExpanded?: boolean;
  showArtisanMatch?: boolean;
  showZeroMatchPostJob?: boolean;
  clarificationOptions?: string[];
  isResolved?: boolean;
  detectedTrade?: string;
  diagnosticTitle?: string;
  costMin?: number;
  costMax?: number;
  timestamp: string;
}

const LAST_SESSION_STORAGE_KEY = 'last_active_oga_john_session_id';

const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  sender: 'assistant',
  text: "Hello! I am Oga John, your Artifix technical advisor.\n\nDescribe any fault or repair in your home, attach photos or record a voice note, and I will diagnose the issue and guide you on what to do.",
  timestamp: 'Just now',
};

// Module-level in-memory cache to retain active consultation across screen unmounts / navigation
let cachedActiveSessionId: string | null = null;
let cachedGuestAccessToken: string | null = null;
let cachedMessages: ChatMessage[] | null = null;
let cachedSessionBom: DiagnosticBOMItem[] = [];

export const OgaJohnAiStudioScreen: React.FC<OgaJohnAiStudioScreenProps> = ({
  onBack,
  onPostJobWithDiagnosis,
  onViewArtisanProfile,
  onBookArtisanChat,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (cachedMessages && cachedMessages.length > 0) {
      return cachedMessages;
    }
    return [DEFAULT_WELCOME_MESSAGE];
  });
  const [inputText, setInputText] = useState('');
  const [attachedPhotos, setAttachedPhotos] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  const [recordedAudioSeconds, setRecordedAudioSeconds] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => cachedActiveSessionId);
  const [guestAccessToken, setGuestAccessToken] = useState<string | null>(() => cachedGuestAccessToken);
  const [sessionBom, setSessionBom] = useState<DiagnosticBOMItem[]>(() => cachedSessionBom);
  const [bookingArtisanId, setBookingArtisanId] = useState<string | null>(null);

  // Conversation history & memory management
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const audioRecorderRef = useRef<AudioRecorder>(new AudioRecorder());
  const timerRef = useRef<any>(null);

  // Synchronize component state with module-level retention cache & persistent storage
  useEffect(() => {
    cachedMessages = messages;
  }, [messages]);

  useEffect(() => {
    cachedActiveSessionId = activeSessionId;
    if (activeSessionId) {
      Storage.setItem(LAST_SESSION_STORAGE_KEY, activeSessionId).catch(() => {});
    }
  }, [activeSessionId]);

  useEffect(() => {
    cachedGuestAccessToken = guestAccessToken;
  }, [guestAccessToken]);

  useEffect(() => {
    cachedSessionBom = sessionBom;
  }, [sessionBom]);

  // Auto-restore last session on mount if in-memory cache has not yet been loaded
  useEffect(() => {
    const autoRestoreLastSession = async () => {
      // If we already have in-memory messages with user turns, keep them intact
      if (cachedMessages && cachedMessages.length > 1) {
        return;
      }

      try {
        let lastSessionId = await Storage.getItem(LAST_SESSION_STORAGE_KEY);
        if (!lastSessionId) {
          const history = await AiService.getUserHistory();
          if (history && history.length > 0 && history[0].id) {
            lastSessionId = history[0].id;
          }
        }

        if (lastSessionId) {
          await loadSessionById(lastSessionId, true);
        }
      } catch (err) {
        console.warn('[OgaJohn] Failed to auto-restore last session:', err);
      }
    };

    autoRestoreLastSession();
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fetchHistoryList = async () => {
    setIsLoadingHistory(true);
    try {
      const history = await AiService.getUserHistory();
      setRecentSessions(history);
    } catch (err) {
      console.warn('[OgaJohn] Failed to load chat history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleOpenHistory = () => {
    setShowHistoryModal(true);
    fetchHistoryList();
  };

  const handleStartNewChat = () => {
    cachedActiveSessionId = null;
    cachedGuestAccessToken = null;
    cachedMessages = null;
    cachedSessionBom = [];
    Storage.removeItem(LAST_SESSION_STORAGE_KEY).catch(() => {});

    setActiveSessionId(null);
    setGuestAccessToken(null);
    setSessionBom([]);
    setMessages([DEFAULT_WELCOME_MESSAGE]);
    setShowHistoryModal(false);
  };

  const loadSessionById = async (sessionId: string, isAutoRestore = false) => {
    if (!isAutoRestore && sessionId === activeSessionId) {
      setShowHistoryModal(false);
      return;
    }
    setIsLoadingSession(true);
    try {
      const sessionData = await AiService.getSession(sessionId);
      if (!sessionData) {
        if (!isAutoRestore) {
          Alert.alert('Session Not Found', 'Could not retrieve this past diagnostic conversation.');
        }
        return;
      }

      setActiveSessionId(sessionData.id);
      cachedActiveSessionId = sessionData.id;
      await Storage.setItem(LAST_SESSION_STORAGE_KEY, sessionData.id).catch(() => {});

      if (sessionData.estimatedBOM && Array.isArray(sessionData.estimatedBOM)) {
        setSessionBom(sessionData.estimatedBOM);
        cachedSessionBom = sessionData.estimatedBOM;
      } else {
        setSessionBom([]);
        cachedSessionBom = [];
      }

      // Transform any persistent recommendations from the database as fallback/supplement
      const fallbackArtisans: MatchedArtisanDossier[] = (sessionData.recommendations || []).map((r: any) => ({
        id: r.artisan?.id || r.artisanProfileId,
        userId: r.artisan?.userId || r.artisan?.user?.id,
        name: `${r.artisan?.firstName || ''} ${r.artisan?.lastName || ''}`.trim() || r.artisan?.businessName || 'Verified Specialist',
        businessName: r.artisan?.businessName || undefined,
        tradeCategory: sessionData.category?.name || undefined,
        ratingAvg: Number(r.artisan?.ratingAvg || 5.0),
        completedJobsCount: Number(r.artisan?.completedJobsCount || 0),
        distanceKm: r.distanceKm ? Number(r.distanceKm) : undefined,
        hourlyRate: r.artisan?.hourlyRate ? Number(r.artisan?.hourlyRate) : undefined,
        avatarUrl: r.artisan?.user?.avatarUrl || undefined,
        matchScore: r.matchScore ? Number(r.matchScore) : undefined,
      }));

      if (sessionData.turns && sessionData.turns.length > 0) {
        const restored: ChatMessage[] = sessionData.turns.map((turn: any, index: number) => {
          const isAssistant = turn.role === 'assistant';
          const sd = turn.structuredDecision || {};
          let matchedArtisans: MatchedArtisanDossier[] = sd.matchedArtisans || [];

          // If turn didn't save matchedArtisans in sd, fallback to sessionData.recommendations
          if (matchedArtisans.length === 0 && fallbackArtisans.length > 0 && isAssistant) {
            const isLastAssistant = !sessionData.turns.slice(index + 1).some((t: any) => t.role === 'assistant');
            if (isLastAssistant || sd.intent === 'MATCH_REQUESTED' || sd.intent === 'MATCH_ONLY' || sd.intent === 'PROCEED_DISPATCH') {
              matchedArtisans = fallbackArtisans;
            }
          }

          const hasPros = matchedArtisans.length > 0;
          return {
            id: turn.id || `turn_${index}_${Date.now()}`,
            sender: isAssistant ? 'assistant' : 'user',
            text: turn.content,
            timestamp: turn.createdAt
              ? new Date(turn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Earlier',
            safetyWarning: sd.safetyWarning || undefined,
            billOfMaterials: sd.estimatedBOM || sd.billOfMaterials || undefined,
            isBomExpanded: Boolean((sd.estimatedBOM || sd.billOfMaterials) && (sd.estimatedBOM || sd.billOfMaterials).length > 0),
            matchedArtisans: hasPros ? matchedArtisans : undefined,
            showArtisanMatch: hasPros,
            clarificationOptions: sd.clarificationOptions || [],
            isResolved: Boolean(sd.isResolved),
            detectedTrade: sd.detectedTrade || sessionData.category?.name,
            diagnosticTitle: sd.diagnosticTitle || sessionData.diagnosticTitle,
            costMin: sd.costMin || sessionData.estimatedLaborMin,
            costMax: sd.costMax || sessionData.estimatedLaborMax,
          };
        });
        setMessages(restored);
        cachedMessages = restored;
      } else {
        const singleMsg: ChatMessage[] = [
          {
            id: `restored_${sessionData.id}`,
            sender: 'assistant',
            text: sessionData.explanation || sessionData.diagnosticTitle || 'Previous consultation loaded.',
            timestamp: 'Earlier',
            detectedTrade: sessionData.category?.name,
            diagnosticTitle: sessionData.diagnosticTitle,
            matchedArtisans: fallbackArtisans.length > 0 ? fallbackArtisans : undefined,
            showArtisanMatch: fallbackArtisans.length > 0,
          },
        ];
        setMessages(singleMsg);
        cachedMessages = singleMsg;
      }
      setShowHistoryModal(false);
    } catch (err) {
      console.warn('[OgaJohn] Error loading session:', err);
      if (!isAutoRestore) {
        Alert.alert('Error', 'Failed to load consultation session.');
      }
    } finally {
      setIsLoadingSession(false);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    loadSessionById(sessionId, false);
  };

  // Helper to detect if user explicitly asked for BOM/materials
  const isBomRequested = (text?: string): boolean => {
    if (!text) return false;
    const pattern = /(bill\s*of\s*materials?|\bbom\b|\bparts?\b|\bmaterials?\b|cost\s*(of\s*)?(parts|materials)|price\s*(of\s*)?(parts|materials)|what\s*(do\s*i\s*)?(need\s*to\s*)?buy|pricing\s*breakdown|cost\s*breakdown|list\s*(of\s*)?(parts|materials))/i;
    return pattern.test(text);
  };

  // Helper to detect if user explicitly asked for an artisan/professional
  const isArtisanRequested = (text?: string): boolean => {
    if (!text) return false;
    const lower = text.toLowerCase();
    const proWords = /(artisan|plumber|electrician|carpenter|specialist|mechanic|technician|professional|expert|handyman|worker)/;
    const actionWords = /(recommend|find|send|hire|book|match|get|call|look\s*for|need|want|show|give|connect|assign|contact)/;
    if (actionWords.test(lower) && proWords.test(lower)) return true;
    if (/(professional|artisan|specialist|technician)s?\s*(nearby|available|around|close)/.test(lower)) return true;
    if (/someone\s*to\s*(fix|repair|help|come)/.test(lower)) return true;
    if (/(can\s*you\s*(match|find|recommend)|who\s*can\s*fix)/.test(lower)) return true;
    return false;
  };

  // Synthesize rich pre-filled job description from chat session facts
  const generatePrefilledDescription = (msg?: ChatMessage): string => {
    const parts: string[] = [];
    if (msg?.diagnosticTitle) {
      parts.push(`Fault / Issue: ${msg.diagnosticTitle}`);
    }
    if (msg?.detectedTrade) {
      parts.push(`Trade Category: ${msg.detectedTrade}`);
    }
    const userNotes = messages
      .filter((m) => m.sender === 'user' && m.text)
      .map((m) => m.text)
      .join(' | ');
    if (userNotes) {
      parts.push(`Client Reported Symptoms: ${userNotes}`);
    }
    if (msg?.safetyWarning) {
      parts.push(`Safety Consideration: ${msg.safetyWarning}`);
    }
    if (sessionBom && sessionBom.length > 0) {
      const itemsList = sessionBom.map((b) => `${b.quantity || 1}x ${b.name}`).join(', ');
      parts.push(`Identified Materials Needed: ${itemsList}`);
    }
    return parts.join('\n\n');
  };

  // Handle Book button click on specialist card -> resolve conversation and direct to chat
  const handleBookArtisan = async (artisanId: string, artisanName: string) => {
    try {
      setBookingArtisanId(artisanId);
      const conversation = await ChatService.getOrCreateArtisanConversation(artisanId);
      if (onBookArtisanChat) {
        onBookArtisanChat(artisanId, conversation?.id, artisanName);
      }
    } catch (err: any) {
      console.error('[OgaJohn] Error starting conversation with artisan:', err);
      if (onBookArtisanChat) {
        onBookArtisanChat(artisanId, undefined, artisanName);
      }
    } finally {
      setBookingArtisanId(null);
    }
  };

  // Toggle BOM breakdown in chat bubble
  const toggleBom = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, isBomExpanded: !msg.isBomExpanded } : msg
      )
    );
  };

  // Toggle Artisan cards in chat bubble
  const toggleArtisans = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, isArtisansExpanded: !msg.isArtisansExpanded } : msg
      )
    );
  };

  // Image Selection Handler (Up to 4 images)
  const handleSelectPhotos = async () => {
    if (attachedPhotos.length >= 4) {
      Alert.alert('Maximum Reached', 'You can attach up to 4 photos per diagnosis.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 4 - attachedPhotos.length,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const uris = result.assets.map((asset) => asset.uri);
        setAttachedPhotos((prev) => [...prev, ...uris].slice(0, 4));
      }
    } catch {
      Alert.alert('Permission Error', 'Unable to access photo library.');
    }
  };

  // Voice Note Recording
  const handleStartRecording = async () => {
    try {
      await audioRecorderRef.current.startRecording((status) => {
        if (status.isRecording) {
          const secs = Math.floor((status.durationMillis || 0) / 1000);
          setRecordingSeconds(secs);
        }
      });
      setIsRecording(true);
      setRecordingSeconds(0);
    } catch (err: any) {
      Alert.alert('Microphone Access', err.message || 'Microphone permission denied.');
    }
  };

  const handleStopRecording = async () => {
    try {
      const res = await audioRecorderRef.current.stopRecording();
      setRecordedAudioUri(res.uri);
      setRecordedAudioSeconds(recordingSeconds);
      setIsRecording(false);
    } catch {
      setIsRecording(false);
    }
  };

  const handleCancelRecording = async () => {
    try {
      await audioRecorderRef.current.stopRecording();
    } catch {
      // ignore
    }
    setIsRecording(false);
    setRecordedAudioUri(null);
    setRecordedAudioSeconds(0);
    setRecordingSeconds(0);
  };

  // Submit Message & Trigger Diagnostic Engine
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (typeof customText === 'string' ? customText : inputText).trim();
    const photosToSend = [...attachedPhotos];
    const voiceToSend = recordedAudioUri;
    const voiceDuration = recordedAudioSeconds;

    if (!textToSend && photosToSend.length === 0 && !voiceToSend) {
      return;
    }

    // Add user message to stream
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend || undefined,
      imageUris: photosToSend.length > 0 ? photosToSend : undefined,
      audioUri: voiceToSend || undefined,
      audioDurationSeconds: voiceToSend ? voiceDuration : undefined,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setAttachedPhotos([]);
    setRecordedAudioUri(null);
    setRecordedAudioSeconds(0);
    setIsSending(true);

    try {
      const location = await LocationProvider.getCurrentLocation();
      const bomAsked = isBomRequested(textToSend);
      const artisanAsked = isArtisanRequested(textToSend);

      // If we already have an active diagnostic session, continue the conversation
      if (activeSessionId) {
        const historyPayload = messages
          .filter((m) => m.text)
          .map((m) => ({
            role: m.sender,
            text: m.text!,
          }));

        const chatRes = await AiService.sendChatMessage(activeSessionId, {
          message: textToSend || (photosToSend.length > 0 ? 'I have attached photos of the fault for inspection.' : 'I have attached a voice note of the fault.'),
          history: historyPayload,
          latitude: location.latitude,
          longitude: location.longitude,
          imageUris: photosToSend.length > 0 ? photosToSend : undefined,
          audioUri: voiceToSend || undefined,
          guestAccessToken: guestAccessToken || undefined,
        });

        const returnedBom = chatRes.billOfMaterials && chatRes.billOfMaterials.length > 0
          ? chatRes.billOfMaterials
          : sessionBom;

        if (chatRes.billOfMaterials && chatRes.billOfMaterials.length > 0) {
          setSessionBom(chatRes.billOfMaterials);
        }

        const shouldShowBom = bomAsked && returnedBom.length > 0;
        const proRequested =
          artisanAsked ||
          chatRes.intent === 'MATCH_REQUESTED' ||
          chatRes.intent === 'EMERGENCY_DISPATCH' ||
          (chatRes.severity as string) === 'LIFE_SAFETY_EMERGENCY';
        const hasMatchedArtisans = Boolean(chatRes.matchedArtisans && chatRes.matchedArtisans.length > 0);

        setMessages((prev) => [
          ...prev,
          {
            id: `asst_${Date.now()}`,
            sender: 'assistant',
            text: chatRes.reply,
            safetyWarning: chatRes.safetyWarning,
            billOfMaterials: shouldShowBom ? returnedBom : undefined,
            isBomExpanded: shouldShowBom, // Strictly restricted to when user explicitly asked!
            matchedArtisans: proRequested && hasMatchedArtisans ? chatRes.matchedArtisans : undefined,
            showArtisanMatch: proRequested && hasMatchedArtisans,
            showZeroMatchPostJob: proRequested && !hasMatchedArtisans,
            clarificationOptions: chatRes.clarificationOptions || [],
            isResolved: chatRes.isResolved,
            detectedTrade: chatRes.detectedTrade,
            diagnosticTitle: chatRes.updatedProbableCause || chatRes.detectedTrade || 'Diagnostic Assessment',
            costMin: chatRes.costRange?.min,
            costMax: chatRes.costRange?.max,
            timestamp: 'Just now',
          },
        ]);
      } else {
        // Run initial diagnostic (Turn 1)
        const diagRes = await AiService.diagnose({
          promptText: textToSend || (photosToSend.length > 0 ? 'I have attached photos of the fault for inspection.' : 'I have attached a voice note of the fault.'),
          imageUris: photosToSend,
          audioUri: voiceToSend || undefined,
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.addressName,
        });

        if (diagRes?.id) {
          setActiveSessionId(diagRes.id);
          setGuestAccessToken(diagRes.guestAccessToken || null);
        }

        const bomItems = diagRes.billOfMaterials || [];
        if (bomItems.length > 0) {
          setSessionBom(bomItems);
        }

        const shouldShowBom = bomAsked && bomItems.length > 0;
        const proRequested =
          artisanAsked ||
          (diagRes.severity as string) === 'LIFE_SAFETY_EMERGENCY';
        const hasMatchedArtisans = Boolean(diagRes.matchedArtisans && diagRes.matchedArtisans.length > 0);

        const assistantMsg: ChatMessage = {
          id: `asst_${Date.now()}`,
          sender: 'assistant',
          text: diagRes.conversationalReply || diagRes.explanation || 'Diagnosis completed.',
          safetyWarning: diagRes.hazardWarning,
          billOfMaterials: shouldShowBom ? bomItems : undefined,
          isBomExpanded: shouldShowBom, // Strictly restricted to when asked!
          matchedArtisans: proRequested && hasMatchedArtisans ? diagRes.matchedArtisans : undefined,
          showArtisanMatch: proRequested && hasMatchedArtisans,
          showZeroMatchPostJob: proRequested && !hasMatchedArtisans,
          clarificationOptions: diagRes.clarificationOptions || [],
          isResolved: diagRes.isResolved,
          detectedTrade: diagRes.detectedTrade,
          diagnosticTitle: diagRes.explanation?.slice(0, 40) || 'Diagnostic Assessment',
          costMin: diagRes.costRange?.min,
          costMax: diagRes.costRange?.max,
          timestamp: 'Just now',
        };

        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err: any) {
      console.error('[OgaJohn] Diagnostic error:', err);
      const apiMsg = err?.response?.data?.message || err?.message;
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'assistant',
          text: apiMsg
            ? `Diagnostic request could not be completed: ${apiMsg}`
            : "I couldn't process the diagnosis right now. Please check your network connection or try providing more details.",
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>Oga John AI</Text>
            <View style={styles.onlineDot} />
          </View>
          <Text style={styles.headerSubtitle}>Technical Diagnostic Advisor</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={handleOpenHistory}
            accessibilityLabel="Chat History"
          >
            <History size={18} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={handleStartNewChat}
            accessibilityLabel="New Consultation"
          >
            <Plus size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Message Stream */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageRow,
              item.sender === 'user' ? styles.userRow : styles.assistantRow,
            ]}
          >
            {item.sender === 'assistant' && (
              <View style={styles.avatarPill}>
                <Sparkles size={14} color="#FFF" />
              </View>
            )}

            <View
              style={[
                styles.bubble,
                item.sender === 'user' ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              {/* Uploaded Images Preview */}
              {item.imageUris && item.imageUris.length > 0 && (
                <View style={styles.bubbleImagesGrid}>
                  {item.imageUris.map((uri: string, idx: number) => (
                    <Image key={idx} source={{ uri }} style={styles.bubbleImage} />
                  ))}
                </View>
              )}

              {/* Audio Indicator */}
              {item.audioUri && (
                <View style={styles.voiceNoteBubble}>
                  <Mic size={14} color="#FFF" />
                  <Text style={styles.voiceNoteText}>
                    Voice note attached {item.audioDurationSeconds ? `(0:${item.audioDurationSeconds < 10 ? `0${item.audioDurationSeconds}` : item.audioDurationSeconds})` : ''}
                  </Text>
                </View>
              )}

              {/* Plain Conversational Text */}
              {item.text && (
                <Text
                  style={[
                    styles.messageText,
                    item.sender === 'user' ? styles.userText : styles.assistantText,
                  ]}
                >
                  {item.text}
                </Text>
              )}

              {/* Safety Alert (Only rendered if an active safety hazard exists) */}
              {item.safetyWarning && (
                <View style={styles.safetyBox}>
                  <AlertTriangle size={15} color="#DC2626" />
                  <View style={styles.safetyTextWrap}>
                    <Text style={styles.safetyTitle}>Safety Caution</Text>
                    <Text style={styles.safetyText}>{item.safetyWarning}</Text>
                  </View>
                </View>
              )}

              {/* Stage F Post-Repair Resolution Banner */}
              {item.isResolved && (
                <View style={styles.resolvedBanner}>
                  <View style={styles.resolvedBannerHeader}>
                    <ShieldCheck size={16} color="#059669" />
                    <Text style={styles.resolvedBannerTitle}>Issue Resolved 🎉</Text>
                  </View>
                  <Text style={styles.resolvedBannerText}>
                    Glad the repair worked out! If anything else comes up later, Oga John is always on standby.
                  </Text>
                </View>
              )}

              {/* Interactive Clarification Option Chips */}
              {item.clarificationOptions && item.clarificationOptions.length > 0 && (
                <View style={styles.clarificationOptionsWrap}>
                  <Text style={styles.optionsPromptLabel}>Select an option or tap to reply:</Text>
                  <View style={styles.optionsChipsRow}>
                    {item.clarificationOptions.map((opt: string, optIdx: number) => (
                      <TouchableOpacity
                        key={optIdx}
                        style={styles.clarificationChip}
                        onPress={() => handleSendMessage(opt)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.clarificationChipText}>{opt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Bill of Materials (Strictly restricted to when explicitly asked) */}
              {item.billOfMaterials && item.billOfMaterials.length > 0 && item.isBomExpanded && (
                <View style={styles.bomSectionWrap}>
                  <View style={styles.bomCard}>
                    <TouchableOpacity
                      style={styles.bomCardHeader}
                      onPress={() => toggleBom(item.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.bomHeaderLeft}>
                        <Package size={14} color="#065F46" />
                        <Text style={styles.bomCardTitle}>
                          Bill of Materials ({item.billOfMaterials.length} items)
                        </Text>
                      </View>
                      <ChevronUp size={16} color="#065F46" />
                    </TouchableOpacity>

                    <View style={styles.bomTable}>
                      <View style={styles.bomTableHeader}>
                        <Text style={[styles.bomColHeader, { flex: 2 }]}>Item / Spec</Text>
                        <Text style={[styles.bomColHeader, { flex: 1, textAlign: 'center' }]}>Qty</Text>
                        <Text style={[styles.bomColHeader, { flex: 1.5, textAlign: 'right' }]}>Est. Price</Text>
                      </View>
                      {item.billOfMaterials.map((bom: DiagnosticBOMItem, bIdx: number) => {
                        const costMin = bom.estimatedCostRange?.min || (bom as any).minCost || 0;
                        const costMax = bom.estimatedCostRange?.max || (bom as any).maxCost || costMin;
                        return (
                          <View key={bIdx} style={styles.bomTableRow}>
                            <View style={{ flex: 2 }}>
                              <Text style={styles.bomItemName}>{bom.name || (bom as any).item}</Text>
                              {bom.specification && (
                                <Text style={styles.bomItemSpec}>{bom.specification}</Text>
                              )}
                            </View>
                            <Text style={styles.bomItemQty}>
                              {bom.quantity ? `${bom.quantity}x` : '1x'}
                            </Text>
                            <Text style={styles.bomItemPrice}>
                              {formatCurrency(costMin)}
                              {costMax > costMin ? ` – ${formatCurrency(costMax)}` : ''}
                            </Text>
                          </View>
                        );
                      })}
                    </View>

                    <View style={styles.bomDisclaimer}>
                      <ShieldCheck size={12} color="#059669" />
                      <Text style={styles.bomDisclaimerText}>
                        Market prices calibrated with verified supplier indices.
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Matched Verified Specialists (Rendered strictly when requested by user) */}
              {item.showArtisanMatch && item.matchedArtisans && item.matchedArtisans.length > 0 && (
                <View style={styles.artisanSectionWrap}>
                  <View style={styles.specialistsCard}>
                    <View style={styles.specialistsCardHeader}>
                      <View style={styles.specialistHeaderLeft}>
                        <Wrench size={14} color="#1E40AF" />
                        <Text style={styles.specialistsTitle}>
                          Recommended Specialists ({item.matchedArtisans.length})
                        </Text>
                      </View>
                    </View>

                    {item.matchedArtisans.map((artisanMatch: MatchedArtisanDossier) => (
                      <View key={artisanMatch.artisanId} style={styles.specialistRow}>
                        <View style={styles.specialistInfo}>
                          <Text style={styles.specialistName}>{artisanMatch.name}</Text>
                          <View style={styles.specialistMeta}>
                            <Star size={11} color="#F59E0B" fill="#F59E0B" />
                            <Text style={styles.specialistRating}>
                              {artisanMatch.rating} ({artisanMatch.completedJobsCount} jobs)
                            </Text>
                            <Text style={styles.dot}>•</Text>
                            <MapPin size={11} color="#6B7280" />
                            <Text style={styles.specialistDist}>
                              {artisanMatch.distanceKm} km away
                            </Text>
                          </View>
                        </View>

                        <View style={styles.specialistActions}>
                          <TouchableOpacity
                            style={styles.profileButton}
                            onPress={() => onViewArtisanProfile && onViewArtisanProfile(artisanMatch.artisanId)}
                            activeOpacity={0.7}
                          >
                            <User size={12} color="#184530" />
                            <Text style={styles.profileButtonText}>Profile</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.bookButton}
                            onPress={() => handleBookArtisan(artisanMatch.artisanId, artisanMatch.name)}
                            activeOpacity={0.7}
                            disabled={bookingArtisanId === artisanMatch.artisanId}
                          >
                            {bookingArtisanId === artisanMatch.artisanId ? (
                              <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                              <>
                                <MessageSquare size={12} color="#FFF" />
                                <Text style={styles.bookButtonText}>Book</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Zero-Match Nearby (25km) Fallback -> Offer Pre-filled Job Post synthesized from chat */}
              {item.sender === 'assistant' && item.showZeroMatchPostJob && (
                <View style={styles.noMatchCard}>
                  <View style={styles.noMatchHeader}>
                    <MapPinOff size={15} color="#B45309" />
                    <Text style={styles.noMatchTitle}>No Specialists Nearby (Within 25km)</Text>
                  </View>
                  <Text style={styles.noMatchText}>
                    There are currently no verified {item.detectedTrade || 'specialist'} professionals within a 25km radius. You can post a job with these diagnostic findings so verified professionals in the area can bid on your repair.
                  </Text>
                  <TouchableOpacity
                    style={styles.postJobWithDiagBtn}
                    onPress={() => {
                      if (onPostJobWithDiagnosis) {
                        onPostJobWithDiagnosis({
                          issueTitle: item.diagnosticTitle || (item.detectedTrade ? `${item.detectedTrade} Repair` : 'Maintenance Repair'),
                          trade: item.detectedTrade || 'Specialist',
                          costMin: item.costMin,
                          costMax: item.costMax,
                          billOfMaterials: item.billOfMaterials || sessionBom,
                          description: generatePrefilledDescription(item),
                        });
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <FileText size={13} color="#FFF" />
                    <Text style={styles.postJobWithDiagBtnText}>Post Job with Diagnostic Findings</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
      />

      {/* Sending Spinner */}
      {isSending && (
        <View style={styles.sendingContainer}>
          <ActivityIndicator size="small" color="#184530" />
          <Text style={styles.sendingText}>Oga John is inspecting fault...</Text>
        </View>
      )}

      {/* Bottom Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 84 : 0}
      >
        {/* Attached Photo Preview Chips */}
        {attachedPhotos.length > 0 && (
          <View style={styles.photoPreviewRow}>
            {attachedPhotos.map((uri, idx) => (
              <View key={idx} style={styles.photoThumbWrap}>
                <Image source={{ uri }} style={styles.photoThumb} />
                <TouchableOpacity
                  style={styles.photoRemoveBtn}
                  onPress={() =>
                    setAttachedPhotos((prev) => prev.filter((_, i) => i !== idx))
                  }
                >
                  <X size={11} color="#FFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Attached Voice Note Preview Chip */}
        {recordedAudioUri && !isRecording && (
          <View style={styles.audioPreviewRow}>
            <View style={styles.audioPreviewChip}>
              <Mic size={14} color="#047857" />
              <Text style={styles.audioPreviewText}>
                Voice note attached (0:{recordedAudioSeconds < 10 ? `0${recordedAudioSeconds}` : recordedAudioSeconds})
              </Text>
            </View>
            <TouchableOpacity
              style={styles.audioRemoveBtn}
              onPress={() => {
                setRecordedAudioUri(null);
                setRecordedAudioSeconds(0);
              }}
            >
              <X size={13} color="#6B7280" />
            </TouchableOpacity>
          </View>
        )}

        {/* Audio Recording Dock OR Multimodal Input Bar */}
        {isRecording ? (
          <View style={styles.recordingDock}>
            <View style={styles.recordingTimerWrap}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingTimerText}>
                Recording... 0:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
              </Text>
            </View>
            <View style={styles.recordingButtons}>
              <TouchableOpacity onPress={handleCancelRecording} style={styles.cancelRecButton}>
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleStopRecording} style={styles.stopRecButton}>
                <Square size={12} color="#FFF" fill="#FFF" />
                <Text style={styles.stopRecText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            {/* Paperclip / Photo Attachment */}
            <TouchableOpacity
              onPress={handleSelectPhotos}
              style={styles.iconButton}
              accessibilityLabel="Attach photo"
            >
              <Paperclip size={20} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Mic / Audio Attachment */}
            <TouchableOpacity
              onPress={handleStartRecording}
              style={styles.iconButton}
              accessibilityLabel="Record voice note"
            >
              <Mic size={20} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Text Input */}
            <TextInput
              style={styles.textInput}
              placeholder="Describe the fault or ask Oga John..."
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={300}
            />

            {/* Send Button */}
            <TouchableOpacity
              onPress={() => handleSendMessage()}
              style={[
                styles.sendButton,
                !inputText.trim() && attachedPhotos.length === 0 && !recordedAudioUri
                  ? styles.sendButtonDisabled
                  : null,
              ]}
              disabled={!inputText.trim() && attachedPhotos.length === 0 && !recordedAudioUri}
              accessibilityLabel="Send message"
            >
              <Send size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Consultation History Modal */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.historyModalContent}>
            <View style={styles.historyModalHeader}>
              <View style={styles.historyModalHeaderLeft}>
                <History size={20} color={colors.primary} />
                <Text style={styles.historyModalTitle}>Consultation History</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowHistoryModal(false)}
                style={styles.historyCloseBtn}
                accessibilityLabel="Close History"
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {isLoadingHistory || isLoadingSession ? (
              <View style={styles.historyLoadingWrap}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.historyLoadingText}>
                  {isLoadingSession ? 'Loading consultation...' : 'Fetching your past consultations...'}
                </Text>
              </View>
            ) : recentSessions.length === 0 ? (
              <View style={styles.historyEmptyWrap}>
                <Clock size={36} color={colors.textMuted} />
                <Text style={styles.historyEmptyTitle}>No Past Consultations</Text>
                <Text style={styles.historyEmptySub}>
                  Consultations with Oga John are automatically remembered so you can resume anytime.
                </Text>
              </View>
            ) : (
              <FlatList
                data={recentSessions}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.historyList}
                renderItem={({ item }) => {
                  const isActive = item.id === activeSessionId;
                  const dateStr = item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Recent';
                  const title = item.diagnosticTitle || item.category?.name || 'Home Technical Diagnosis';
                  return (
                    <TouchableOpacity
                      style={[styles.historyItemRow, isActive && styles.historyItemActive]}
                      onPress={() => handleSelectSession(item.id)}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={styles.historyItemHeaderRow}>
                          <Text style={styles.historyItemTitle} numberOfLines={1}>
                            {title}
                          </Text>
                          {isActive && (
                            <View style={styles.activeSessionBadge}>
                              <Text style={styles.activeSessionBadgeText}>Active</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.historyItemMetaRow}>
                          <Text style={styles.historyItemDate}>{dateStr}</Text>
                          {item.category?.name && (
                            <View style={styles.historyTradePill}>
                              <Text style={styles.historyTradePillText}>{item.category.name}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <ArrowRight size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            <TouchableOpacity
              style={styles.newChatModalBtn}
              onPress={handleStartNewChat}
            >
              <Plus size={18} color="#FFF" />
              <Text style={styles.newChatModalBtnText}>Start New Consultation</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerTextWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    ...typography.h3,
    fontSize: 16,
    color: colors.text,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  headerSubtitle: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
  },
  messageList: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  avatarPill: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#184530',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginTop: 2,
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  userBubble: {
    backgroundColor: '#184530',
    borderBottomRightRadius: 2,
  },
  assistantBubble: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderBottomLeftRadius: 2,
    ...shadows.sm,
  },
  messageText: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#FFF',
  },
  assistantText: {
    color: colors.text,
  },
  bubbleImagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.xs,
  },
  bubbleImage: {
    width: 65,
    height: 65,
    borderRadius: radius.sm,
  },
  voiceNoteBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    marginBottom: 4,
  },
  voiceNoteText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  sendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    backgroundColor: '#ECFDF5',
    gap: 6,
  },
  sendingText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '500',
  },
  safetyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: spacing.sm,
    borderRadius: radius.sm,
    gap: 8,
    marginTop: spacing.xs,
  },
  safetyTextWrap: {
    flex: 1,
  },
  safetyTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 2,
  },
  safetyText: {
    fontSize: 11,
    color: '#7F1D1D',
    lineHeight: 16,
  },
  clarificationOptionsWrap: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  optionsPromptLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  optionsChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  clarificationChip: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: radius.full || 9999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  clarificationChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  resolvedBanner: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  resolvedBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  resolvedBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  resolvedBannerText: {
    fontSize: 11,
    color: '#047857',
    lineHeight: 16,
  },
  bookingHandoffCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
    gap: 8,
  },
  bookingHandoffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookingHandoffIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingHandoffTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  bookingHandoffSubtitle: {
    fontSize: 10,
    color: '#64748B',
  },
  bookingHandoffBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#184530',
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  bookingHandoffBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    marginTop: spacing.xs,
    gap: 6,
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
    flex: 1,
  },
  artisanPill: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  bomSectionWrap: {
    marginTop: spacing.xs,
  },
  bomCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  bomCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 6,
  },
  bomHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bomCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  bomTable: {
    gap: 4,
  },
  bomTableHeader: {
    flexDirection: 'row',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  bomColHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  bomTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  bomItemName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
  },
  bomItemSpec: {
    fontSize: 9,
    color: '#6B7280',
  },
  bomItemQty: {
    flex: 1,
    fontSize: 11,
    textAlign: 'center',
    color: '#4B5563',
  },
  bomItemPrice: {
    flex: 1.5,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
    color: '#065F46',
  },
  bomDisclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  bomDisclaimerText: {
    fontSize: 9,
    color: '#6B7280',
  },
  artisanSectionWrap: {
    marginTop: spacing.xs,
  },
  specialistsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  specialistsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 6,
  },
  specialistHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  specialistsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
  specialistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 4,
  },
  specialistInfo: {
    flex: 1,
  },
  specialistName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  specialistMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  specialistRating: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4B5563',
  },
  dot: {
    fontSize: 9,
    color: '#9CA3AF',
  },
  specialistDist: {
    fontSize: 10,
    color: '#6B7280',
  },
  specialistActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  profileButtonText: {
    color: '#184530',
    fontSize: 11,
    fontWeight: '700',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#184530',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  noMatchCard: {
    marginTop: spacing.sm,
    backgroundColor: '#FFFBEB',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FCD34D',
    padding: spacing.sm,
  },
  noMatchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  noMatchTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  noMatchText: {
    fontSize: 11,
    color: '#78350F',
    lineHeight: 16,
    marginBottom: 8,
  },
  postJobWithDiagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#184530',
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
  },
  postJobWithDiagBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 6,
  },
  iconButton: {
    padding: 6,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    fontSize: 13,
    color: colors.text,
    maxHeight: 90,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#184530',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  photoPreviewRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: '#FFF',
    gap: spacing.xs,
  },
  photoThumbWrap: {
    position: 'relative',
  },
  photoThumb: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#DC2626',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: '#ECFDF5',
    borderTopWidth: 1,
    borderTopColor: '#A7F3D0',
  },
  audioPreviewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  audioPreviewText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
  },
  audioRemoveBtn: {
    padding: 4,
  },
  recordingDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FEF2F2',
    borderTopWidth: 1,
    borderTopColor: '#FECACA',
  },
  recordingTimerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#DC2626',
  },
  recordingTimerText: {
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '600',
  },
  recordingButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cancelRecButton: {
    padding: 4,
  },
  stopRecButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 4,
  },
  stopRecText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  historyModalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingBottom: 24,
  },
  historyModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  historyModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyModalTitle: {
    ...typography.h3,
    fontSize: 16,
    color: colors.text,
  },
  historyCloseBtn: {
    padding: 4,
  },
  historyLoadingWrap: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  historyLoadingText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  historyEmptyWrap: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  historyEmptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginTop: 4,
  },
  historyEmptySub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.md,
  },
  historyList: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  historyItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  historyItemActive: {
    borderColor: colors.primary,
    backgroundColor: '#F0FDF4',
  },
  historyItemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  historyItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  activeSessionBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    marginLeft: 6,
  },
  activeSessionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  historyItemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyItemDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  historyTradePill: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  historyTradePillText: {
    fontSize: 11,
    color: '#4338CA',
    fontWeight: '500',
  },
  newChatModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingVertical: 12,
    borderRadius: radius.md,
    gap: 6,
  },
  newChatModalBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
