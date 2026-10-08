import React, { useState, useRef } from 'react';
import {
  Wrench,
  Camera,
  X,
  AlertTriangle,
  CheckCircle,
  MapPin,
  ArrowRight,
  ShieldAlert,
  Loader2,
  DollarSign,
  Package,
  Award,
  HelpCircle,
  Volume2,
  Siren,
  Coins,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';

interface BOMItem {
  item: string;
  estimatedCostMin: number;
  estimatedCostMax: number;
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
    safetyInstructions: string[];
    diyAllowed: boolean;
    diyGuide?: string | null;
    clarificationQuestion?: string | null;
    clarificationOptions?: string[];
    clarificationAnswer?: string | null;
    artisanAudioScript?: string | null;
    voiceAudioUrl?: string | null;
    transcribedAudio?: string | null;
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
  matchedArtisans?: MatchItem[];
  preliminaryArtisans?: Array<ArtisanData & { distanceKm: number }>;
}

interface AiDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectArtisan?: (artisanId: string, sessionId: string) => void;
}

export const AiDiagnosticModal: React.FC<AiDiagnosticModalProps> = ({
  isOpen,
  onClose,
  onSelectArtisan,
}) => {
  const [textPrompt, setTextPrompt] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [voiceNote, setVoiceNote] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [result, setResult] = useState<DiagnosticResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [bookingArtisanId, setBookingArtisanId] = useState<string | null>(null);
  const [conversionJobId, setConversionJobId] = useState<string | null>(null);
  const [submittingClarification, setSubmittingClarification] = useState(false);
  const [selectedClarification, setSelectedClarification] = useState<string | null>(null);
  const [playingAudioScript, setPlayingAudioScript] = useState(false);

  // Phase 4: Production Hardening, Escrow & Emergency SOS States
  const [escrowPlan, setEscrowPlan] = useState<EscrowPlan | null>(null);
  const [loadingEscrowPlan, setLoadingEscrowPlan] = useState(false);
  const [preferredRail, setPreferredRail] = useState<'FIAT_NGN' | 'CRYPTO_MONAD_USDC'>('FIAT_NGN');
  const [sosDispatching, setSosDispatching] = useState(false);
  const [sosDispatched, setSosDispatched] = useState(false);
  const [sosArtisansCount, setSosArtisansCount] = useState(0);
  const [createdContractId, setCreatedContractId] = useState<string | null>(null);
  const [creatingContractArtisanId, setCreatingContractArtisanId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle Photo Selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files).slice(0, 4 - photos.length);
    const newPhotos = [...photos, ...selectedFiles];
    setPhotos(newPhotos);

    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setPhotoPreviews([...photoPreviews, ...newPreviews]);
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    const updatedPreviews = photoPreviews.filter((_, i) => i !== index);
    setPhotos(updatedPhotos);
    setPhotoPreviews(updatedPreviews);
  };

  // Get current location
  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  // Submit Diagnostic
  const handleRunDiagnostic = async () => {
    if (!textPrompt.trim() && photos.length === 0 && !voiceNote) {
      setErrorMsg('Please describe what happened, attach a photo, or record a voice note.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setLoadingStep(1);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 900);

    try {
      const formData = new FormData();
      if (textPrompt.trim()) formData.append('textPrompt', textPrompt.trim());
      if (coords) {
        formData.append('latitude', coords.latitude.toString());
        formData.append('longitude', coords.longitude.toString());
      }
      photos.forEach((photo) => {
        formData.append('photos', photo);
      });
      if (voiceNote) {
        formData.append('voice', voiceNote);
      }

      const res = await apiClient.post<{ data: DiagnosticResponse }>('/ai/diagnose', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      clearInterval(stepInterval);
      const diagnosticData = res.data.data;
      setResult(diagnosticData);
      if (diagnosticData.session?.id) {
        fetchEscrowPlan(diagnosticData.session.id);
      }
    } catch (err: unknown) {
      clearInterval(stepInterval);
      const error = err as { response?: { data?: { message?: string } } };
      setErrorMsg(error?.response?.data?.message || 'Diagnostic failed. Please check your network and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Phase 4: Fetch Escrow Milestone Breakdown
  const fetchEscrowPlan = async (sessionId: string) => {
    setLoadingEscrowPlan(true);
    try {
      const res = await apiClient.get<{ data: EscrowPlan }>(`/ai/session/${sessionId}/escrow-plan`);
      setEscrowPlan(res.data.data);
    } catch (e) {
      console.warn('Could not load escrow plan preview:', e);
    } finally {
      setLoadingEscrowPlan(false);
    }
  };

  // Phase 4: 1-Tap Emergency SOS Multi-Cast Dispatch
  const handleEmergencySos = async () => {
    if (!result?.session?.id) return;
    setSosDispatching(true);
    try {
      const res = await apiClient.post<{ success: boolean; data: { dispatchedArtisans: any[] } }>(
        `/ai/session/${result.session.id}/emergency-sos`,
        {
          clientLatitude: coords?.latitude,
          clientLongitude: coords?.longitude,
        }
      );
      setSosDispatched(true);
      setSosArtisansCount(res.data?.data?.dispatchedArtisans?.length || 3);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error?.response?.data?.message || 'Emergency dispatch failed. Please try again.');
    } finally {
      setSosDispatching(false);
    }
  };

  // Phase 4: 1-Click Escrow Contract Creation
  const handleCreateEscrowContract = async (artisanId: string) => {
    if (!result?.session?.id) return;
    setCreatingContractArtisanId(artisanId);
    try {
      const res = await apiClient.post<{ data: { contract: { id: string } } }>(
        `/ai/session/${result.session.id}/create-escrow-contract`,
        {
          artisanId,
          preferredRail,
        }
      );
      setCreatedContractId(res.data.data.contract.id);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error?.response?.data?.message || 'Failed to create escrow contract directly.');
    } finally {
      setCreatingContractArtisanId(null);
    }
  };

  // Handle Clarification Answer Submission
  const handleClarificationSubmit = async (answer: string) => {
    if (!result?.session?.id) return;
    setSubmittingClarification(true);
    setSelectedClarification(answer);
    try {
      const res = await apiClient.post<{
        data: {
          session: DiagnosticResponse['session'];
          matchedArtisans: MatchItem[];
          clarificationConfirmed: boolean;
        };
      }>(`/ai/session/${result.session.id}/clarify`, { answer });

      const updatedData = res.data.data;
      setResult((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          session: {
            ...prev.session,
            ...updatedData.session,
            clarificationAnswer: answer,
          },
          matchedArtisans: updatedData.matchedArtisans || prev.matchedArtisans,
        };
      });
    } catch (err) {
      console.error('Clarification submission failed:', err);
    } finally {
      setSubmittingClarification(false);
    }
  };

  // Play / Toggle Localized Artisan Audio Briefing
  const handlePlayAudioBriefing = (artisanName: string = 'Specialist') => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis audio is not supported on this browser.');
      return;
    }

    if (playingAudioScript) {
      window.speechSynthesis.cancel();
      setPlayingAudioScript(false);
      return;
    }

    const script =
      result?.session?.artisanAudioScript ||
      `Hello Oga ${artisanName}. Verified job briefing for client. Diagnosis shows ${result?.session?.probableCause}. Please carry diagnostic tools. Payment is protected in Artifix escrow.`;

    const utterance = new SpeechSynthesisUtterance(script);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setPlayingAudioScript(false);
    utterance.onerror = () => setPlayingAudioScript(false);

    setPlayingAudioScript(true);
    window.speechSynthesis.speak(utterance);
  };

  // 1-Click Convert to Job & Book Artisan
  const handleBookArtisan = async (artisanId: string) => {
    if (!result?.session?.id) return;
    setBookingArtisanId(artisanId);
    try {
      const res = await apiClient.post(`/ai/session/${result.session.id}/convert-to-job`, {
        preferredArtisanId: artisanId,
      });
      const createdJob = res.data.data.job;
      setConversionJobId(createdJob.id);
    } catch {
      // If not authenticated or error, trigger onSelectArtisan callback
      if (onSelectArtisan) {
        onSelectArtisan(artisanId, result.session.id);
      } else {
        window.location.href = `/login?redirect=/jobs`;
      }
    } finally {
      setBookingArtisanId(null);
    }
  };

  const handleReset = () => {
    setResult(null);
    setTextPrompt('');
    setPhotos([]);
    setPhotoPreviews([]);
    setVoiceNote(null);
    setSelectedClarification(null);
    setPlayingAudioScript(false);
    setErrorMsg(null);
    setConversionJobId(null);
    setEscrowPlan(null);
    setSosDispatched(false);
    setCreatedContractId(null);
  };

  // Normalize artisan candidates from either matchedArtisans or preliminaryArtisans
  const candidateList =
    result?.matchedArtisans?.map((m) => ({
      id: m.artisanProfileId,
      name: m.artisan.name,
      avatarUrl: m.artisan.avatarUrl,
      rating: m.artisan.rating,
      reviewCount: m.artisan.reviewCount,
      completedJobs: m.artisan.completedJobs,
      kycVerified: m.artisan.kycVerified,
      distanceKm: m.distanceKm,
      matchScore: m.matchScore,
      rationale: m.rationale,
    })) ||
    result?.preliminaryArtisans?.map((a) => ({
      id: a.id,
      name: a.name,
      avatarUrl: a.avatarUrl,
      rating: a.rating,
      reviewCount: a.reviewCount,
      completedJobs: a.completedJobs,
      kycVerified: a.kycVerified,
      distanceKm: a.distanceKm,
      matchScore: 88,
      rationale: `${a.distanceKm} km away • Verified Artisan`,
    })) ||
    [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Artifix AI Diagnostic Copilot</h3>
              <p className="text-xs text-slate-400">Describe, snap, or record voice note for instant triage & 5-pillar matching</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!result && !isLoading && (
          <div className="space-y-4 mt-5">
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                {errorMsg}
              </div>
            )}

            {/* Quick Prompt Suggestions */}
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Suggestions</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  'My AC compressor is making humming noise and not cooling',
                  'Water leaking from pipe joint under the kitchen sink',
                  'Distribution breaker tripping whenever inverter starts',
                  'Generator engine surging and shaking violently',
                ].map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTextPrompt(s)}
                    className="text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700/60 transition text-left cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Describe the Fault or Symptoms
              </label>
              <textarea
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
                placeholder="What seems to be broken? E.g., spark from switch, low water pressure, strange mechanical noise..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 min-h-[90px]"
              />
            </div>

            {/* Phase 3 Voice Note Audio Recorder */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Or Explain with Voice Note (Pidgin / Vernacular Supported)
              </label>
              <VoiceNoteRecorder onAudioReady={(file) => setVoiceNote(file)} disabled={isLoading} />
            </div>

            {/* Photos Upload Grid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">
                  Attach Photos (Up to 4)
                </span>
                <span className="text-xs text-slate-500">{photos.length}/4 photos</span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {photoPreviews.map((preview, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-700">
                    <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-red-600 text-white rounded-full transition cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {photos.length < 4 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-emerald-500/70 rounded-xl text-slate-400 hover:text-emerald-400 transition bg-slate-950/50 cursor-pointer"
                  >
                    <Camera className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-medium">Add Photo</span>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>

            {/* Location Toolbar */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleGetLocation}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>
                  {locating
                    ? 'Detecting GPS...'
                    : coords
                    ? 'GPS Location Attached'
                    : 'Attach Current Location'}
                </span>
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleRunDiagnostic}
              className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition cursor-pointer"
            >
              <Wrench className="w-4 h-4" />
              <span>Diagnose Issue & Find Artisans</span>
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-4 border-slate-800 border-t-emerald-500 animate-spin" />
              <Wrench className="w-6 h-6 text-emerald-400 absolute inset-0 m-auto" />
            </div>
            <div>
              <h4 className="font-bold text-base text-white">Analyzing Your Issue</h4>
              <p className="text-xs text-slate-400 mt-1">
                {loadingStep === 1 && 'Uploading media, transcribing audio, and parsing symptoms...'}
                {loadingStep === 2 && 'Scanning for electrical, fire, and flood hazards...'}
                {loadingStep >= 3 && 'Running 5-pillar matching engine across nearby verified artisans...'}
              </p>
            </div>
          </div>
        )}

        {/* Results View */}
        {result && !isLoading && (
          <div className="mt-5 space-y-5">
            {/* Job Conversion Confirmation Banner */}
            {conversionJobId && (
              <div className="p-4 bg-emerald-950/50 border border-emerald-500/60 rounded-xl text-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <h5 className="font-bold text-sm text-emerald-300">Job Created & Artisan Dispatched!</h5>
                    <p className="text-xs text-emerald-400/90 mt-0.5">
                      Your diagnostic briefing packet has been shared with the matched artisan.
                    </p>
                  </div>
                </div>
                <a
                  href={`/jobs/${conversionJobId}`}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition"
                >
                  View Job
                </a>
              </div>
            )}

            {/* Phase 4: Direct Escrow Contract Confirmation Banner */}
            {createdContractId && (
              <div className="p-4 bg-emerald-950/60 border border-emerald-500/80 rounded-xl text-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <h5 className="font-bold text-sm text-emerald-300">Escrow Contract Created & Locked!</h5>
                    <p className="text-xs text-emerald-400/90 mt-0.5">
                      Milestones established: Materials advance & labor released upon AI post-repair verification.
                    </p>
                  </div>
                </div>
                <a
                  href={`/contracts/${createdContractId}`}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition"
                >
                  View Contract
                </a>
              </div>
            )}

            {/* Phase 4: 1-Tap Emergency SOS Multi-Cast Dispatch */}
            {(result.session.urgency === 'EMERGENCY' || result.session.isHazardous) && (
              <div className="p-4 bg-red-950/40 border-2 border-red-500/80 rounded-xl text-red-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-red-500/20 text-red-400 rounded-lg animate-pulse">
                      <Siren className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-red-300">1-Tap Emergency SOS Multi-Cast</h5>
                      <p className="text-xs text-red-400/90 mt-0.5">
                        High hazard or emergency detected. Alert the closest 3 vetted specialists via SMS & Push.
                      </p>
                    </div>
                  </div>

                  {!sosDispatched ? (
                    <button
                      type="button"
                      onClick={handleEmergencySos}
                      disabled={sosDispatching}
                      className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-900/40 flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      {sosDispatching ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Dispatching...</span>
                        </>
                      ) : (
                        <>
                          <Siren className="w-4 h-4 animate-bounce" />
                          <span>Dispatch SOS Now</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>Alert Sent to {sosArtisansCount} Specialists!</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Critical Hazard Alert */}
            {result.session.isHazardous && (
              <div className="p-4 bg-red-950/40 border border-red-500/50 rounded-xl text-red-200">
                <div className="flex items-center gap-2 font-bold text-red-400 text-sm">
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                  <span>Immediate Hazard Protocol</span>
                </div>
                <ul className="text-xs list-disc list-inside mt-2 space-y-1">
                  {Array.isArray(result.session.safetyInstructions) ? (
                    result.session.safetyInstructions.map((instruction, idx) => (
                      <li key={idx}>{instruction}</li>
                    ))
                  ) : (
                    <li>{String(result.session.safetyInstructions || 'Switch off main isolator and isolate the fault area.')}</li>
                  )}
                </ul>
              </div>
            )}

            {/* Phase 3: Interactive Clarification Check */}
            {result.session.clarificationQuestion && (
              <div className="p-4 bg-blue-950/20 border border-blue-500/40 rounded-xl text-blue-100">
                <div className="flex items-center gap-2 font-bold text-blue-400 text-xs uppercase tracking-wider mb-1.5">
                  <HelpCircle className="w-4 h-4 text-blue-400" />
                  <span>AI Clarification Check (Refines Diagnosis & Match)</span>
                </div>
                <p className="text-xs text-white font-medium mb-3">
                  {result.session.clarificationQuestion}
                </p>

                {result.session.clarificationAnswer ? (
                  <div className="flex items-center gap-2 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-2.5 rounded-lg font-medium">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Confirmed: {result.session.clarificationAnswer}</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {Array.isArray(result.session.clarificationOptions) &&
                      result.session.clarificationOptions.map((opt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleClarificationSubmit(opt)}
                          disabled={submittingClarification}
                          className="w-full text-left text-xs p-2.5 rounded-lg border border-slate-800 bg-slate-900/90 hover:border-blue-400 hover:bg-blue-950/40 text-slate-200 transition flex items-center justify-between cursor-pointer disabled:opacity-50"
                        >
                          <span>{opt}</span>
                          {submittingClarification && selectedClarification === opt ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                          ) : (
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Diagnostic Card */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  {result.category?.name || 'Diagnostic Outcome'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    result.session.severity === 'CRITICAL'
                      ? 'bg-red-500/20 text-red-300'
                      : result.session.severity === 'HIGH'
                      ? 'bg-orange-500/20 text-orange-300'
                      : 'bg-blue-500/20 text-blue-300'
                  }`}
                >
                  {result.session.severity} SEVERITY
                </span>
              </div>

              <h4 className="text-base font-bold text-white mt-2">
                {result.session.diagnosticTitle}
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {result.session.probableCause}
              </p>

              {/* Cost Estimator */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-800/80">
                <div>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Estimated Labor:
                  </span>
                  <p className="text-sm font-bold text-emerald-400 mt-0.5">
                    ₦{(Number(result.session.estimatedLaborMin) || 5000).toLocaleString()} - ₦{(Number(result.session.estimatedLaborMax) || 15000).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-400" /> DIY Feasibility:
                  </span>
                  <p className="text-sm font-semibold text-slate-200 mt-0.5">
                    {result.session.diyAllowed ? 'Safe for DIY' : 'Professional Needed'}
                  </p>
                </div>
              </div>

              {/* Bill of Materials (BOM) */}
              {Array.isArray(result.session.estimatedBOM) && result.session.estimatedBOM.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 mb-1.5">
                    <Package className="w-3.5 h-3.5 text-amber-400" /> Likely Replacement Parts (BOM):
                  </span>
                  <div className="space-y-1">
                    {result.session.estimatedBOM.map((item: any, idx: number) => {
                      const minCost = Number(item.estimatedCostMin ?? item.minCost ?? item.cost ?? 0);
                      const maxCost = Number(item.estimatedCostMax ?? item.maxCost ?? minCost);
                      return (
                        <div key={idx} className="flex items-center justify-between text-xs bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800/60">
                          <span className="text-slate-300">{item.item || item.name || 'Materials'}</span>
                          <span className="font-semibold text-slate-400">
                            ₦{minCost.toLocaleString()} - ₦{maxCost.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Phase 4: Automated Escrow Milestone Plan */}
            {escrowPlan && Array.isArray(escrowPlan.milestones) && escrowPlan.milestones.length > 0 && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                        Automated Escrow Milestone Plan
                      </h5>
                      <p className="text-[10px] text-slate-400">Funds locked until AI repair inspection passes</p>
                    </div>
                  </div>

                  {/* Dual Currency Rail Toggle */}
                  <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px] self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setPreferredRail('FIAT_NGN')}
                      className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                        preferredRail === 'FIAT_NGN'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ₦ NGN (Fiat)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreferredRail('CRYPTO_MONAD_USDC')}
                      className={`px-2.5 py-1 rounded font-semibold transition flex items-center gap-1 cursor-pointer ${
                        preferredRail === 'CRYPTO_MONAD_USDC'
                          ? 'bg-purple-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Coins className="w-3 h-3" />
                      Digital USD (USDC)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {escrowPlan.milestones.map((m: any, idx: number) => {
                    const amountNgn = Number(m.amountNgn || 0);
                    const amountUsdc = Number(m.amountCryptoUsdc ?? m.amountUsdc ?? 0);
                    const percentage = m.percentage ?? (idx === 0 ? 40 : 60);
                    return (
                      <div
                        key={m.order || m.stepOrder || idx}
                        className="p-3 bg-slate-900/70 border border-slate-800/80 rounded-xl flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{m.title}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-800 text-slate-300">
                              {percentage}%
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                            {m.releaseCondition || m.description}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">Allocation:</span>
                          <span className="text-xs font-extrabold text-emerald-400">
                            {preferredRail === 'FIAT_NGN'
                              ? `₦${amountNgn.toLocaleString()}`
                              : `$${amountUsdc.toFixed(2)} USDC`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-400">
                  <span>
                    Total Escrow Bond:{' '}
                    <strong className="text-white">
                      {preferredRail === 'FIAT_NGN'
                        ? `₦${Number(escrowPlan.totalEstimatedNgn ?? escrowPlan.pricingSummary?.totalNgn ?? 0).toLocaleString()}`
                        : `$${Number(escrowPlan.totalEstimatedCryptoUsdc ?? escrowPlan.pricingSummary?.totalUsdc ?? 0).toFixed(2)} USDC`}
                    </strong>
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Rate: {escrowPlan.pricingSummary?.exchangeRate || `1 USDC = ₦${escrowPlan.exchangeRateNgnUsdc || 1500}`} • Protected by AI Photo Inspection
                  </span>
                </div>
              </div>
            )}

            {/* Matched Artisans (Ranked by 5-Pillar Score) */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Top Recommended Artisans (5-Pillar Ranked)
                </h5>
                <span className="text-[11px] text-slate-500">Proximity • Rating • KYC • Experience</span>
              </div>

              {candidateList.length > 0 ? (
                <div className="space-y-2.5">
                  {candidateList.map((artisan) => (
                    <div
                      key={artisan.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={artisan.avatarUrl || '/avatar-placeholder.png'}
                          alt={artisan.name}
                          className="w-11 h-11 rounded-full object-cover border border-slate-700 bg-slate-800"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-white">{artisan.name}</span>
                            {artisan.kycVerified && (
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                                KYC
                              </span>
                            )}
                            {artisan.matchScore && (
                              <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                                <Award className="w-2.5 h-2.5" />
                                {artisan.matchScore}% Match
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {artisan.distanceKm} km away • ⭐ {artisan.rating} ({artisan.reviewCount} reviews) • {artisan.completedJobs} jobs
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {/* Audio Briefing Preview Button */}
                        <button
                          type="button"
                          onClick={() => handlePlayAudioBriefing(artisan.name)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 rounded-lg transition border border-slate-700 cursor-pointer"
                          title="Listen to localized audio briefing"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Direct Escrow Contract Button */}
                        <button
                          type="button"
                          onClick={() => handleCreateEscrowContract(artisan.id)}
                          disabled={creatingContractArtisanId === artisan.id}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-[11px] font-semibold text-emerald-400 border border-emerald-500/30 rounded-lg flex items-center gap-1 transition cursor-pointer"
                          title="Instantly generate structured 2-milestone escrow contract"
                        >
                          {creatingContractArtisanId === artisan.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          )}
                          <span>Direct Escrow</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleBookArtisan(artisan.id)}
                          disabled={bookingArtisanId === artisan.id}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-semibold text-white rounded-lg flex items-center gap-1.5 transition shadow cursor-pointer"
                        >
                          {bookingArtisanId === artisan.id ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Booking...</span>
                            </>
                          ) : (
                            <>
                              <span>Book via Escrow</span>
                              <ArrowRight className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-slate-950 text-slate-400 text-xs rounded-xl border border-slate-800 text-center">
                  No immediate local artisans available online in this category. We will notify on-call specialists upon job post.
                </div>
              )}
            </div>

            {/* Action Toolbar */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl transition cursor-pointer"
              >
                Diagnose Another Fault
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-6 bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-white rounded-xl transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
