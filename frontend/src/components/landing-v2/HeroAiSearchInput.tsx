import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowRight,
  Plus,
  Mic,
  Square,
  X,
  Image as ImageIcon,
  Play,
  Pause,
  AlertCircle,
} from 'lucide-react';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';

export interface HeroAiSearchInputProps {
  onDiagnose: (
    prompt: string,
    attachments?: { photos?: File[]; voice?: Blob | null }
  ) => void;
}

/**
 * HeroAiSearchInput
 * Sleek, compact pill-shaped AI input bar matching user's reference design.
 * Features:
 * - Eyebrow tagline: "Describe the issue. Get Help fast."
 * - Single-line compact pill: Plus (+) attachment button, input field, Mic icon, and circular action button
 * - Live audio recording & photo previews without bloated layout height
 * - SRP-compliant audio handling via useAudioRecorder
 */
export const HeroAiSearchInput: React.FC<HeroAiSearchInputProps> = ({ onDiagnose }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const maxLength = 120;

  const {
    isRecording,
    recordingSeconds,
    audioBlob,
    audioUrl,
    error: audioError,
    startRecording,
    stopRecording,
    cancelRecording,
    clearAudio,
  } = useAudioRecorder();

  // Clean up audio player when audioUrl changes or unmounts
  useEffect(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
      setIsPlayingVoice(false);
    }
  }, [audioUrl]);

  // Handle Photo File Selection (Max 4 photos, images only)
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = Array.from(e.target.files).filter((file) =>
        file.type.startsWith('image/')
      );
      if (validFiles.length > 0) {
        setSelectedPhotos((prev) => [...prev, ...validFiles].slice(0, 4));
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (index: number) => {
    setSelectedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveVoice = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
      setIsPlayingVoice(false);
    }
    clearAudio();
  };

  const togglePlayVoice = () => {
    if (!audioUrl) return;
    if (isPlayingVoice && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsPlayingVoice(false);
      return;
    }

    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio(audioUrl);
      audioPlayerRef.current.onended = () => setIsPlayingVoice(false);
      audioPlayerRef.current.onerror = () => setIsPlayingVoice(false);
    }
    audioPlayerRef.current
      .play()
      .then(() => {
        setIsPlayingVoice(true);
      })
      .catch(() => {
        setIsPlayingVoice(false);
      });
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() && selectedPhotos.length === 0 && !audioBlob) {
      // If user clicked while empty, start voice recording
      startRecording();
      return;
    }

    onDiagnose(prompt.trim(), {
      photos: selectedPhotos.length > 0 ? selectedPhotos : undefined,
      voice: audioBlob || undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasAttachments = selectedPhotos.length > 0 || !!audioBlob;

  return (
    <div className="w-full max-w-[520px] mx-auto md:mx-0 mt-2 mb-6 sm:mb-8 text-center md:text-left">
      {/* Hidden file input for Photo Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/png,image/jpeg,image/webp,image/heic"
        multiple
        onChange={handlePhotoSelect}
        className="hidden"
        aria-label="Upload fault photos"
      />

      {/* Eyebrow Tagline directly above the textbox */}
      <div className="text-[12.5px] sm:text-[13.5px] font-semibold text-[#184530] tracking-tight mb-2 sm:mb-2.5 flex items-center justify-center md:justify-start gap-1.5">
        <span>Describe the issue. Get Help fast.</span>
      </div>

      {/* Attachments Preview Chips (Photos & Voice Note) */}
      {hasAttachments && !isRecording && (
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 mb-2.5 px-1">
          {selectedPhotos.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-full pl-2.5 pr-1.5 py-0.5 text-xs text-stone-700 shadow-xs"
            >
              <ImageIcon className="w-3 h-3 text-stone-500 shrink-0" />
              <span className="max-w-[100px] truncate text-[11px] font-medium">{file.name}</span>
              <button
                type="button"
                onClick={() => removePhoto(idx)}
                className="text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer rounded-full"
                title="Remove photo"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {audioBlob && (
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full pl-2 pr-1.5 py-0.5 text-xs text-emerald-900 shadow-xs">
              <button
                type="button"
                onClick={togglePlayVoice}
                className="w-4 h-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center cursor-pointer shrink-0"
                title={isPlayingVoice ? 'Pause voice note' : 'Play voice note'}
              >
                {isPlayingVoice ? (
                  <Pause className="w-2 h-2" />
                ) : (
                  <Play className="w-2 h-2 fill-white ml-0.5" />
                )}
              </button>
              <span className="text-[11px] font-medium">
                Voice ({recordingSeconds > 0 ? `${recordingSeconds}s` : 'Recorded'})
              </span>
              <button
                type="button"
                onClick={handleRemoveVoice}
                className="text-emerald-700 hover:text-emerald-950 p-0.5 cursor-pointer rounded-full"
                title="Delete voice note"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Audio Error Alert if microphone access denied */}
      {audioError && (
        <div className="flex items-center gap-2 p-2 mb-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="text-[11px] leading-tight">{audioError}</span>
        </div>
      )}

      {/* Modern Rounded-2xl AI Input Container with Site Brand Green Glow */}
      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-2xl border border-[#D5DCD7] hover:border-emerald-600/50 focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-600/15 focus-within:shadow-[0_0_24px_rgba(5,150,105,0.20)] shadow-[0_2px_14px_rgba(0,0,0,0.06)] transition-all duration-300 flex items-center h-[52px] sm:h-[56px] px-2 sm:px-3"
      >
        {isRecording ? (
          /* Live Recording State inside Container */
          <div className="flex-1 flex items-center justify-between px-3">
            <div className="flex items-center gap-2 text-rose-700">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
              <span className="text-xs sm:text-sm font-semibold font-mono">
                Recording... 0:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={cancelRecording}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-full"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={stopRecording}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-full flex items-center gap-1 shadow-xs"
              >
                <Square className="w-2.5 h-2.5 fill-white" />
                <span>Done</span>
              </button>
            </div>
          </div>
        ) : (
          /* Normal Single-Line Layout with Refined Rounded Controls */
          <>
            {/* Left: Plus (+) Button for Attachments */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-stone-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer shrink-0"
              title="Attach photo or file"
              aria-label="Attach photo or file"
            >
              <Plus className="w-5 h-5 stroke-[2.2]" />
            </button>

            {/* Center: Single-Line Input Field */}
            <input
              type="text"
              value={prompt}
              maxLength={maxLength}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything"
              className="flex-1 min-w-0 bg-transparent text-[14.5px] sm:text-[15.5px] text-[#141A16] placeholder-stone-400 focus:outline-none px-2 sm:px-3 font-normal"
              aria-label="Describe the issue"
            />

            {/* Right Tools: Mic Button */}
            <button
              type="button"
              onClick={startRecording}
              disabled={isRecording}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer shrink-0"
              title="Voice note recording"
              aria-label="Record voice"
            >
              <Mic className="w-5 h-5 stroke-[1.8]" />
            </button>

            {/* Far Right: Circular/Rounded Action Button (Site Brand Green with waveform or send arrow) */}
            <button
              type="submit"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#184530] hover:bg-[#123625] active:scale-95 text-white flex items-center justify-center shadow-md shadow-emerald-950/20 transition-all cursor-pointer shrink-0 ml-1"
              title={prompt.trim() ? 'Diagnose issue' : 'Voice diagnosis mode'}
              aria-label="Diagnose"
            >
              {prompt.trim() ? (
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              ) : (
                /* Waveform icon matching reference */
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <rect x="3.5" y="8" width="2.2" height="8" rx="1.1" />
                  <rect x="8.5" y="4" width="2.2" height="16" rx="1.1" />
                  <rect x="13.5" y="6.5" width="2.2" height="11" rx="1.1" />
                  <rect x="18.5" y="8.5" width="2.2" height="7" rx="1.1" />
                </svg>
              )}
            </button>
          </>
        )}
      </form>

      {/* Subtle Bottom Sub-bar */}
      <div className="flex items-center justify-between text-[11px] text-[#6A7B70] mt-2 px-3 select-none">
        <span>No account needed yet</span>
        {prompt.length > 0 && (
          <span className="font-mono text-[10.5px] text-[#86968B]">
            {prompt.length} / {maxLength}
          </span>
        )}
      </div>
    </div>
  );
};
