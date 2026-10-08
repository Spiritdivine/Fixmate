import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Wrench,
  ShieldAlert,
  CheckCircle,
  Package,
  Award,
  Volume2,
  Lock,
  Coins,
  Siren,
  Loader2,
  ArrowRight,
  User,
  ShieldCheck,
  Paperclip,
  Mic,
  Square,
  Image as ImageIcon,
  RotateCcw,
  Star,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../lib/api-client';
import ReactMarkdown from 'react-markdown';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';

interface BOMItem {
  item: string;
  estimatedCostMin?: number;
  estimatedCostMax?: number;
  minCost?: number;
  maxCost?: number;
  cost?: number;
}

interface ArtisanData {
  id: string;
  name: string;
  avatarUrl?: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  kycVerified: boolean;
  state?: string;
  lgaCity?: string;
}

interface MatchItem {
  artisanProfileId: string;
  artisan: ArtisanData;
  distanceKm: number;
  matchScore: number;
  rationale?: string;
}

interface EscrowMilestone {
  order?: number;
  stepOrder?: number;
  title: string;
  description?: string;
  amountNgn: number;
  amountUsdc?: number;
  amountCryptoUsdc?: number;
  percentage?: number;
  releaseCondition?: string;
  type?: string;
}

interface EscrowPlan {
  sessionId: string;
  diagnosticTitle?: string;
  totalEstimatedNgn?: number;
  totalEstimatedCryptoUsdc?: number;
  exchangeRateNgnUsdc?: number;
  pricingSummary?: {
    totalNgn: number;
    platformFeeNgn?: number;
    netTotalNgn?: number;
    totalUsdc: number;
    platformFeeUsdc?: number;
    netTotalUsdc?: number;
    exchangeRate?: string;
  };
  milestones: EscrowMilestone[];
}

interface DiagnosticResponse {
  session: {
    id: string;
    diagnosticTitle: string;
    probableCause: string;
    severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    urgency: 'ROUTINE' | 'SCHEDULED' | 'URGENT' | 'EMERGENCY';
    isHazardous: boolean;
    safetyInstructions: string[] | string;
    diyAllowed: boolean;
    diyGuide?: string | null;
    clarificationQuestion?: string | null;
    clarificationOptions?: string[];
    clarificationAnswer?: string | null;
    artisanAudioScript?: string | null;
    estimatedBOM: BOMItem[];
    estimatedLaborMin?: number;
    estimatedLaborMax?: number;
    currency: string;
  };
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  conversationalReply?: string;
  diyRecommended?: boolean;
  matchedArtisans?: MatchItem[];
  preliminaryArtisans?: MatchItem[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  text?: string;
  isThinking?: boolean;
  photos?: string[]; // URLs or local preview URLs
  voiceUrl?: string;
  diagnostic?: DiagnosticResponse;
  matchedArtisans?: MatchItem[];
  escrowPlan?: EscrowPlan;
  diyRecommended?: boolean;
  isEmergency?: boolean;
  clarificationSubmitted?: boolean;
}

interface AiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  initialAttachments?: {
    photos?: File[];
    voice?: Blob | null;
  };
  onSelectArtisan?: (artisanId: string, sessionId: string) => void;
}

export const AiChatModal: React.FC<AiChatModalProps> = ({
  isOpen,
  onClose,
  initialPrompt = '',
  initialAttachments,
  onSelectArtisan,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [preferredRail, setPreferredRail] = useState<'FIAT_NGN' | 'CRYPTO_MONAD_USDC'>('FIAT_NGN');
  const [bookingArtisanId, setBookingArtisanId] = useState<string | null>(null);
  const [creatingContractArtisanId, setCreatingContractArtisanId] = useState<string | null>(null);
  const [createdContractId, setCreatedContractId] = useState<string | null>(null);
  const [sosDispatching, setSosDispatching] = useState(false);
  const [sosDispatched, setSosDispatched] = useState(false);
  const [submittingClarification, setSubmittingClarification] = useState(false);

  // File Upload & Voice Note State (ChatGPT Style)
  const [attachedPhotos, setAttachedPhotos] = useState<File[]>([]);
  const [attachedVoice, setAttachedVoice] = useState<Blob | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializedPromptRef = useRef<string | null>(null);

  const {
    isRecording,
    recordingSeconds,
    audioBlob: recorderAudioBlob,
    audioUrl: recorderAudioUrl,
    startRecording,
    stopRecording,
    cancelRecording,
    clearAudio,
  } = useAudioRecorder();

  // Sync recorderAudioBlob to attachedVoice
  useEffect(() => {
    if (recorderAudioBlob) {
      setAttachedVoice(recorderAudioBlob);
    }
  }, [recorderAudioBlob]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending, attachedPhotos, attachedVoice, isRecording]);

  // Handle Photo Selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).slice(0, 4);
      setAttachedPhotos((prev) => [...prev, ...files].slice(0, 4));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachedPhoto = (index: number) => {
    setAttachedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Reset trigger state on modal close
  useEffect(() => {
    if (!isOpen) {
      initializedPromptRef.current = null;
    }
  }, [isOpen]);

  // When modal opens with initial prompt or attachments, trigger initial diagnosis
  useEffect(() => {
    const hasAttachments = !!initialAttachments?.photos?.length || !!initialAttachments?.voice;
    const triggerKey = `${initialPrompt || ''}_${initialAttachments?.photos?.length || 0}_${initialAttachments?.voice ? 'voice' : 'novoice'}`;

    if (isOpen && (initialPrompt || hasAttachments) && initializedPromptRef.current !== triggerKey) {
      initializedPromptRef.current = triggerKey;
      startInitialDiagnosis(initialPrompt, initialAttachments);
    }
  }, [isOpen, initialPrompt, initialAttachments]);

  const startInitialDiagnosis = async (
    promptText: string,
    attachments?: { photos?: File[]; voice?: Blob | null }
  ) => {
    const userMsgId = 'user-' + Date.now();
    const thinkingMsgId = 'thinking-' + Date.now();

    const photoPreviews = attachments?.photos?.map((f) => URL.createObjectURL(f)) || [];
    const voicePreviewUrl = attachments?.voice ? URL.createObjectURL(attachments.voice) : undefined;

    setMessages([
      {
        id: userMsgId,
        sender: 'user',
        timestamp: new Date(),
        text: promptText || (photoPreviews.length ? 'Analyzing attached media' : 'Voice fault briefing'),
        photos: photoPreviews,
        voiceUrl: voicePreviewUrl,
      },
      {
        id: thinkingMsgId,
        sender: 'assistant',
        timestamp: new Date(),
        isThinking: true,
      },
    ]);

    setIsSending(true);

    try {
      const formData = new FormData();
      if (promptText) formData.append('textPrompt', promptText);

      if (attachments?.photos) {
        attachments.photos.forEach((photo) => {
          formData.append('photos', photo);
        });
      }

      if (attachments?.voice) {
        formData.append('voice', attachments.voice, 'voice-note.webm');
      }

      // Geo coordinates if allowed
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            formData.append('latitude', pos.coords.latitude.toString());
            formData.append('longitude', pos.coords.longitude.toString());
          },
          () => {}
        );
      }

      const res = await apiClient.post<{ data: DiagnosticResponse }>('/ai/diagnose', formData);
      const diagnosticData = res.data.data;
      const sid = diagnosticData.session.id;
      setSessionId(sid);

      // Fetch escrow milestone breakdown
      let fetchedEscrowPlan: EscrowPlan | undefined = undefined;
      try {
        const escrowRes = await apiClient.get<{ data: EscrowPlan }>(`/ai/session/${sid}/escrow-plan`);
        fetchedEscrowPlan = escrowRes.data.data;
      } catch (err) {
        console.warn('Escrow plan fetch warning:', err);
      }

      const isDiy =
        !!diagnosticData.diyRecommended ||
        (diagnosticData.session.diyAllowed &&
          (!diagnosticData.matchedArtisans || diagnosticData.matchedArtisans.length === 0));

      setMessages((prev) =>
        prev
          .filter((m) => m.id !== thinkingMsgId)
          .concat({
            id: 'asst-' + Date.now(),
            sender: 'assistant',
            timestamp: new Date(),
            text:
              diagnosticData.conversationalReply ||
              diagnosticData.session.probableCause ||
              diagnosticData.session.diagnosticTitle ||
              'I have analyzed your inquiry. How can I help you resolve this?',
            diagnostic: diagnosticData,
            matchedArtisans: isDiy ? [] : diagnosticData.matchedArtisans || [],
            escrowPlan: fetchedEscrowPlan,
            diyRecommended: isDiy,
            isEmergency:
              diagnosticData.session.urgency === 'EMERGENCY' || diagnosticData.session.isHazardous,
          })
      );
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errText =
        error?.response?.data?.message ||
        'Sorry, I encountered an issue analyzing this fault. Please try again or provide more details.';
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== thinkingMsgId)
          .concat({
            id: 'err-' + Date.now(),
            sender: 'assistant',
            timestamp: new Date(),
            text: errText,
          })
      );
    } finally {
      setIsSending(false);
    }
  };

  // User sends follow-up conversational message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputVal.trim();
    if ((!query && attachedPhotos.length === 0 && !attachedVoice) || isSending) return;

    const currentPhotos = [...attachedPhotos];
    const currentVoice = attachedVoice;

    setInputVal('');
    setAttachedPhotos([]);
    setAttachedVoice(null);
    clearAudio();

    const userMsgId = 'user-' + Date.now();
    const thinkingMsgId = 'thinking-' + Date.now();

    const photoPreviews = currentPhotos.map((f) => URL.createObjectURL(f));
    const voicePreviewUrl = currentVoice ? URL.createObjectURL(currentVoice) : undefined;

    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        timestamp: new Date(),
        text: query || (photoPreviews.length ? 'Uploaded additional inspection photos' : 'Voice note'),
        photos: photoPreviews,
        voiceUrl: voicePreviewUrl,
      },
      {
        id: thinkingMsgId,
        sender: 'assistant',
        timestamp: new Date(),
        isThinking: true,
      },
    ]);

    setIsSending(true);

    try {
      if (sessionId) {
        // Conversational follow-up with multi-turn history (supporting text, photos, and voice notes)
        const conversationHistory = messages
          .filter((m) => !m.isThinking && m.text)
          .map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          }));

        let res;
        if (currentPhotos.length > 0 || currentVoice) {
          const chatFormData = new FormData();
          if (query) chatFormData.append('message', query);
          chatFormData.append('history', JSON.stringify(conversationHistory));
          currentPhotos.forEach((photo) => chatFormData.append('photos', photo));
          if (currentVoice) {
            chatFormData.append('voice', currentVoice, 'voice-note.webm');
          }

          res = await apiClient.post<{
            data: {
              reply: string;
              intent: string;
              matchedArtisans?: MatchItem[];
              diyRecommended?: boolean;
            };
          }>(`/ai/session/${sessionId}/message`, chatFormData);
        } else {
          res = await apiClient.post<{
            data: {
              reply: string;
              intent: string;
              matchedArtisans?: MatchItem[];
              diyRecommended?: boolean;
            };
          }>(`/ai/session/${sessionId}/message`, {
            message: query,
            history: conversationHistory,
          });
        }

        const result = res.data.data;
        const hasArtisans = result.matchedArtisans && result.matchedArtisans.length > 0;

        setMessages((prev) =>
          prev
            .filter((m) => m.id !== thinkingMsgId)
            .concat({
              id: 'asst-' + Date.now(),
              sender: 'assistant',
              timestamp: new Date(),
              text: result.reply,
              matchedArtisans: hasArtisans ? result.matchedArtisans : undefined,
              diyRecommended: result.diyRecommended,
            })
        );
      } else {
        // New or initial media-enhanced diagnostic request
        await startInitialDiagnosis(query, { photos: currentPhotos, voice: currentVoice });
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== thinkingMsgId)
          .concat({
            id: 'err-' + Date.now(),
            sender: 'assistant',
            timestamp: new Date(),
            text: error?.response?.data?.message || 'Failed to process message. Please try again.',
          })
      );
    } finally {
      setIsSending(false);
    }
  };

  // Client explicitly insists on hiring an artisan
  const handleInsistOnArtisan = async () => {
    if (!sessionId) return;
    const userMsgId = 'user-' + Date.now();
    const thinkingMsgId = 'thinking-' + Date.now();

    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        timestamp: new Date(),
        text: "I prefer to hire a verified specialist for this job.",
      },
      {
        id: thinkingMsgId,
        sender: 'assistant',
        timestamp: new Date(),
        isThinking: true,
      },
    ]);

    setIsSending(true);

    try {
      const res = await apiClient.post<{
        data: {
          reply: string;
          intent: string;
          matchedArtisans: MatchItem[];
          diyRecommended: boolean;
        };
      }>(`/ai/session/${sessionId}/message`, {
        message: 'Please match me with an artisan to fix this',
      });

      const result = res.data.data;
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== thinkingMsgId)
          .concat({
            id: 'asst-' + Date.now(),
            sender: 'assistant',
            timestamp: new Date(),
            text: result.reply,
            matchedArtisans: result.matchedArtisans,
            diyRecommended: false,
          })
      );
    } catch (err: unknown) {
      console.error('Match artisan insistence failed:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Convert Diagnostic Session into Active Job
  const handleConvertToJob = async (artisanId?: string) => {
    if (!sessionId) return;
    setBookingArtisanId(artisanId || 'pending');

    try {
      const payload: Record<string, unknown> = {
        title: messages.find((m) => m.diagnostic)?.diagnostic?.session.diagnosticTitle || 'Diagnostic Job',
      };
      if (artisanId) payload.selectedArtisanId = artisanId;

      const res = await apiClient.post<{ data: { job: { id: string } } }>(
        `/ai/session/${sessionId}/convert-to-job`,
        payload
      );

      const jobId = res.data.data.job.id;
      setMessages((prev) => [
        ...prev,
        {
          id: 'job-created-' + Date.now(),
          sender: 'assistant',
          timestamp: new Date(),
          text: `✅ Job created successfully (ID: ${jobId}). You can view the job posting and proposals in your dashboard.`,
        },
      ]);
      if (artisanId && onSelectArtisan) {
        onSelectArtisan(artisanId, sessionId);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error?.response?.data?.message || 'Failed to convert session into a job.');
    } finally {
      setBookingArtisanId(null);
    }
  };

  // Create Escrow Contract
  const handleCreateEscrowContract = async (artisanId: string) => {
    if (!sessionId) return;
    setCreatingContractArtisanId(artisanId);

    try {
      const res = await apiClient.post<{
        data: { contract: { id: string; contractNumber: string } };
      }>(`/ai/session/${sessionId}/create-escrow-contract`, {
        artisanId,
        paymentRail: preferredRail,
      });

      const contract = res.data.data.contract;
      setCreatedContractId(contract.id);

      setMessages((prev) => [
        ...prev,
        {
          id: 'contract-created-' + Date.now(),
          sender: 'assistant',
          timestamp: new Date(),
          text: `🔒 Milestone Escrow Contract created (${contract.contractNumber}). Funds are locked securely under Artifix Escrow rules.`,
        },
      ]);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error?.response?.data?.message || 'Failed to instantiate Escrow contract.');
    } finally {
      setCreatingContractArtisanId(null);
    }
  };

  // Trigger Emergency SOS
  const handleEmergencySos = async () => {
    if (!sessionId || sosDispatching || sosDispatched) return;
    setSosDispatching(true);

    try {
      await apiClient.post(`/ai/session/${sessionId}/emergency-sos`, {
        reason: 'Immediate safety or structural hazard',
      });
      setSosDispatched(true);
      setMessages((prev) => [
        ...prev,
        {
          id: 'sos-alert-' + Date.now(),
          sender: 'assistant',
          timestamp: new Date(),
          text: '🚨 Emergency SOS broadcast active! Verified emergency technicians within 5km have been alerted for priority dispatch.',
        },
      ]);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error?.response?.data?.message || 'Failed to broadcast Emergency SOS.');
    } finally {
      setSosDispatching(false);
    }
  };

  // Reset conversation
  const handleResetChat = () => {
    setMessages([]);
    setSessionId(null);
    setInputVal('');
    setAttachedPhotos([]);
    setAttachedVoice(null);
    initializedPromptRef.current = null;
  };

  // Voice narration of audio briefing script
  const playAudioScript = (script?: string | null) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this device.');
      return;
    }
    const textToSpeak = script || 'Verified job briefing for client. Payment is protected in Artifix escrow.';
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      {/* Responsive Shell: Full-screen on mobile (<sm), elegant floating modal on tablet & desktop */}
      <div className="relative w-full h-[100dvh] sm:h-[88vh] sm:max-h-[780px] sm:max-w-3xl bg-[#FAF7F0] sm:border border-[#D6DFD9] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#141A16]">
        
        {/* ============================================================ */}
        {/* 1. BESPOKE EDITORIAL HEADER (Non-Generic)                     */}
        {/* ============================================================ */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white border-b border-[#E2E8E4] z-10 shrink-0">
          <div className="flex items-center gap-3">
            {/* Website Brand Icon */}
            <img
              src="/brand/artifix-icon-transparent.png"
              alt="Artifix"
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-xl shadow-2xs shrink-0"
            />
            <div>
              <h3 className="font-bold text-[14px] sm:text-[16px] text-[#141A16] leading-tight">
                Talk to Oga John
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleResetChat}
                className="p-2 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition cursor-pointer text-xs flex items-center gap-1"
                title="Reset conversation"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-medium">New</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition cursor-pointer"
              title="Close workspace"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. CHAT STREAM (ChatGPT Style Conversation Flow)             */}
        {/* ============================================================ */}
        <div className="flex-1 overflow-y-auto px-3.5 sm:px-6 py-4 space-y-4 touch-auto">
          
          {/* Welcome Screen if empty */}
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-500 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 flex items-center justify-center text-[#123E2A] shadow-xs">
                <Wrench className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-[#141A16]">What issue are you experiencing?</h4>
              <p className="text-xs max-w-md text-stone-600 leading-relaxed">
                Describe the symptoms, attach fault photos, or record a voice note below. Artifix will analyze the fault, check safety hazards, and provide DIY fixes or match you with top verified specialists.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 sm:gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* Assistant Monogram Avatar */}
              {msg.sender === 'assistant' && (
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#123E2A] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-1 shadow-2xs">
                  <span>A</span>
                </div>
              )}

              {/* Message Bubble Container */}
              <div
                className={`max-w-[92%] sm:max-w-[82%] rounded-2xl p-3.5 sm:p-4 text-[13px] sm:text-[14px] leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#123E2A] text-white rounded-br-xs shadow-xs'
                    : 'bg-white border border-[#E0E7E2] text-[#141A16] rounded-bl-xs shadow-2xs space-y-3'
                }`}
              >
                {/* User Media Attachments (Photos / Voice) */}
                {msg.photos && msg.photos.length > 0 && (
                  <div className="flex flex-wrap gap-2 pb-1.5">
                    {msg.photos.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt="Fault attachment"
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-white/20 shadow-2xs"
                      />
                    ))}
                  </div>
                )}

                {msg.voiceUrl && (
                  <div className="flex items-center gap-2 p-2 bg-black/20 rounded-xl mb-1 text-xs">
                    <Volume2 className="w-4 h-4 text-emerald-300" />
                    <span>Voice Note Attached</span>
                    <audio src={msg.voiceUrl} controls className="h-6 w-36 ml-auto" />
                  </div>
                )}

                {/* Thinking Indicator */}
                {msg.isThinking && (
                  <div className="flex items-center gap-2 py-1 text-stone-500">
                    <Loader2 className="w-4 h-4 animate-spin text-[#123E2A]" />
                    <span className="text-xs font-medium text-stone-600">
                      Analyzing technical symptoms & verifying safety checks...
                    </span>
                  </div>
                )}

                {/* Dynamic Conversational Message (Rendered with ReactMarkdown) */}
                {msg.text && (
                  <div className="leading-relaxed text-[13px] sm:text-[14px] space-y-2">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2 pl-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2 pl-1">{children}</ol>,
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                )}

                {/* Emergency Hazard Warning if Detected */}
                {msg.isEmergency && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-900 mt-2">
                    <Siren className="w-5 h-5 text-red-600 shrink-0 mt-0.5 animate-bounce" />
                    <div className="flex-1 text-xs">
                      <p className="font-bold">Urgent Safety Warning</p>
                      <p className="mt-0.5 leading-relaxed">
                        Potential high-voltage, fire, or flooding hazard detected. Please isolate your main power/water supply before touching any fitting.
                      </p>
                      <button
                        type="button"
                        onClick={handleEmergencySos}
                        disabled={sosDispatching || sosDispatched}
                        className="mt-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Siren className="w-3.5 h-3.5" />
                        <span>
                          {sosDispatched
                            ? '✓ SOS Dispatched'
                            : sosDispatching
                            ? 'Dispatching...'
                            : '1-Tap Emergency SOS'}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Subtle Prompt to Match Specialist if Desired */}
                {msg.diyRecommended && (!msg.matchedArtisans || msg.matchedArtisans.length === 0) && (
                  <div className="pt-2.5 border-t border-stone-200/60 flex flex-col xs:flex-row xs:items-center justify-between gap-2 text-xs text-stone-500">
                    <span>💡 Simple troubleshooting.</span>
                    <button
                      type="button"
                      onClick={handleInsistOnArtisan}
                      className="text-[#123E2A] hover:underline font-semibold cursor-pointer text-left xs:text-right"
                    >
                      Prefer a specialist to fix it? Match artisans →
                    </button>
                  </div>
                )}

                {/* Matched Artisans List */}
                {msg.matchedArtisans && msg.matchedArtisans.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#123E2A]">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Recommended Verified Specialists</span>
                      </div>
                      <span className="text-[11px] text-stone-500">5-Pillar Ranked</span>
                    </div>

                    <div className="space-y-2.5">
                      {msg.matchedArtisans.map((match) => (
                        <div
                          key={match.artisanProfileId}
                          className="p-3 bg-stone-50 hover:bg-white border border-stone-200/90 rounded-xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-[#123E2A] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                              {match.artisan.avatarUrl ? (
                                <img
                                  src={match.artisan.avatarUrl}
                                  alt={match.artisan.name}
                                  className="w-full h-full object-cover rounded-full"
                                />
                              ) : (
                                match.artisan.name.slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs sm:text-[13px] text-stone-900">
                                  {match.artisan.name}
                                </span>
                                {match.artisan.kycVerified && (
                                  <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                                    KYC ✓
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                                <span className="flex items-center gap-0.5 text-amber-700 font-semibold">
                                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                  {match.artisan.rating} ({match.artisan.reviewCount})
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-0.5">
                                  <MapPin className="w-3 h-3 text-stone-400" />
                                  {match.distanceKm} km away
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => handleConvertToJob(match.artisanProfileId)}
                              disabled={bookingArtisanId === match.artisanProfileId}
                              className="px-3 py-1.5 bg-[#123E2A] hover:bg-[#0E3222] disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
                            >
                              {bookingArtisanId === match.artisanProfileId ? 'Booking...' : 'Book Artisan'}
                            </button>
                            <Link
                              to={`/artisans/${match.artisanProfileId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                              title="View artisan public profile"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
                              <span>Profile</span>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar */}
              {msg.sender === 'user' && (
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-stone-200 text-stone-700 flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* ============================================================ */}
        {/* 3. MULTIMODAL CHAT INPUT BAR (ChatGPT Style at Bottom)       */}
        {/* ============================================================ */}
        <div className="p-3 sm:p-4 bg-white border-t border-[#E2E8E4] shrink-0">
          
          {/* Hidden File Input for Paperclip */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={handlePhotoSelect}
            className="hidden"
          />

          {/* Media Attachments Preview Chips */}
          {(attachedPhotos.length > 0 || attachedVoice) && (
            <div className="flex flex-wrap items-center gap-2 mb-2 p-2 bg-stone-50 border border-stone-200 rounded-xl shadow-2xs">
              {attachedPhotos.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs text-stone-700 shadow-2xs"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-stone-500" />
                  <span className="max-w-[100px] truncate text-[11px] font-medium">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachedPhoto(idx)}
                    className="text-stone-400 hover:text-stone-700 ml-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {attachedVoice && (
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1 text-xs text-emerald-800">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                  <span className="text-[11px] font-semibold">Voice note recorded</span>
                  <button
                    type="button"
                    onClick={() => setAttachedVoice(null)}
                    className="text-emerald-600 hover:text-emerald-900 ml-1 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Textbox Container */}
          <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
            
            {/* Active Voice Recording Bar */}
            {isRecording ? (
              <div className="flex-1 flex items-center justify-between px-3 py-2 bg-rose-50 rounded-full border border-rose-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                  <span className="text-xs font-semibold text-rose-800">
                    Recording audio... 0:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={cancelRecording}
                    className="p-1 text-stone-400 hover:text-stone-700 transition cursor-pointer"
                    title="Cancel recording"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-full transition flex items-center gap-1 cursor-pointer"
                  >
                    <Square className="w-3 h-3 fill-white" />
                    <span>Done</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center bg-[#FAF7F0] border border-[#CCD7D0] focus-within:border-[#123E2A] focus-within:ring-1 focus-within:ring-[#123E2A] rounded-full px-2 sm:px-3 py-1 transition">
                
                {/* Paperclip Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 text-stone-400 hover:text-[#123E2A] hover:bg-stone-200/50 rounded-full transition cursor-pointer shrink-0"
                  title="Attach photos (max 4)"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Input Text Field */}
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Ask follow-up, describe symptoms, or type 'match me'..."
                  disabled={isSending}
                  className="w-full bg-transparent px-2.5 py-1.5 text-xs sm:text-sm text-[#141A16] placeholder-[#8A9A90] focus:outline-none"
                />

                {/* Microphone Button */}
                <button
                  type="button"
                  onClick={startRecording}
                  className="p-1.5 text-stone-400 hover:text-[#123E2A] hover:bg-stone-200/50 rounded-full transition cursor-pointer shrink-0"
                  title="Record voice note"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Send Button */}
            <button
              type="submit"
              disabled={(!inputVal.trim() && attachedPhotos.length === 0 && !attachedVoice) || isSending}
              className="p-2.5 sm:p-3 bg-[#123E2A] hover:bg-[#0E3222] disabled:opacity-40 text-white rounded-full transition shadow-xs active:scale-95 shrink-0 cursor-pointer"
              title="Send message"
            >
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </form>

          {/* Subtext instruction */}
          <div className="flex items-center justify-between text-[10.5px] text-[#86968B] mt-1.5 px-3">
            <span>Powered by Artifix 5-Pillar Specialist Matching</span>
            <span className="hidden xs:inline">Press Enter to send</span>
          </div>
        </div>

      </div>
    </div>
  );
};
