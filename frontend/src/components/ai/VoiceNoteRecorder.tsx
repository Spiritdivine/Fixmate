import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Volume2, Loader2 } from 'lucide-react';

interface VoiceNoteRecorderProps {
  onAudioReady: (audioFile: File | null) => void;
  disabled?: boolean;
}

export const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({
  onAudioReady,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Clean up timer and animation on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Visualizer loop for canvas
  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.9;
        
        // Gradient color for sound wave
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#10b981'); // Emerald 500
        gradient.addColorStop(1, '#06b6d4'); // Cyan 500

        ctx.fillStyle = gradient;
        ctx.fillRect(x, (canvas.height - barHeight) / 2, barWidth - 1, Math.max(barHeight, 2));
        x += barWidth;
      }
    };

    render();
  };

  // Start recording
  const startRecording = async () => {
    setPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Setup Web Audio Analyser
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      drawWaveform();

      // Determine supported MIME type
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const audioFile = new File([audioBlob], `voicenote_${Date.now()}.${extension}`, {
          type: mimeType,
        });
        onAudioReady(audioFile);

        // Stop all tracks on the stream
        stream.getTracks().forEach((track) => track.stop());

        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(() => {});
        }
      };

      mediaRecorder.start(200); // Collect data every 200ms
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: unknown) {
      const error = err as { name?: string; message?: string };
      console.error('Microphone access denied:', error);
      if (error?.name === 'NotAllowedError') {
        setPermissionError('Microphone access was denied. Please allow microphone permissions in your browser.');
      } else {
        setPermissionError('Could not initialize microphone. Please check your audio device.');
      }
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  };

  // Discard recording
  const discardRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setIsPlaying(false);
    setRecordingDuration(0);
    setPlaybackTime(0);
    onAudioReady(null);
  };

  // Play / Pause preview
  const togglePlayback = () => {
    if (!audioElementRef.current && audioUrl) {
      const audio = new Audio(audioUrl);
      audioElementRef.current = audio;
      audio.ontimeupdate = () => setPlaybackTime(Math.round(audio.currentTime));
      audio.onended = () => {
        setIsPlaying(false);
        setPlaybackTime(0);
      };
    }

    if (audioElementRef.current) {
      if (isPlaying) {
        audioElementRef.current.pause();
        setIsPlaying(false);
      } else {
        audioElementRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-slate-200">
      {permissionError && (
        <div className="p-2 mb-2 text-xs bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg">
          {permissionError}
        </div>
      )}

      {!isRecording && !audioUrl && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Record Voice Note</p>
              <p className="text-[11px] text-slate-400">Speak in English, Pidgin, or your local trade dialect</p>
            </div>
          </div>

          <button
            type="button"
            onClick={startRecording}
            disabled={disabled}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow cursor-pointer"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Record</span>
          </button>
        </div>
      )}

      {/* Active Recording State */}
      {isRecording && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
              <span className="text-xs font-bold text-red-400">
                Recording ({formatSeconds(recordingDuration)} / 1:00)
              </span>
            </div>

            <button
              type="button"
              onClick={stopRecording}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Finish</span>
            </button>
          </div>

          {/* Real-time Web Audio Waveform Canvas */}
          <canvas
            ref={canvasRef}
            width={360}
            height={40}
            className="w-full h-10 bg-slate-900 rounded-lg border border-slate-800"
          />
        </div>
      )}

      {/* Recorded Audio Preview State */}
      {audioUrl && !isRecording && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-1">
            <button
              type="button"
              onClick={togglePlayback}
              className="p-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg transition cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
            <div className="flex-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <Volume2 className="w-3 h-3" /> Voice Note Attached
                </span>
                <span>
                  {formatSeconds(playbackTime)} / {formatSeconds(recordingDuration)}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full transition-all"
                  style={{
                    width: `${recordingDuration > 0 ? (playbackTime / recordingDuration) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={discardRecording}
            className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            title="Delete Voice Note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
