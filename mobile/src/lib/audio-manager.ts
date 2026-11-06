import { Alert } from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  createAudioPlayer,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
  AudioPlayer,
} from 'expo-audio';
import { UploadService } from '../services/upload.service';

export interface VoiceNoteResult {
  url: string;
  durationSeconds: number;
}

export class AudioManager {
  private static recorderInstance: any = null;
  private static activePlayer: AudioPlayer | null = null;
  private static activePlayerUrl: string | null = null;
  private static recordingStartTime = 0;
  private static statusSubscription: any = null;

  static async startRecording(): Promise<boolean> {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Microphone Access Needed', 'Please allow microphone access to record voice notes.');
        return false;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      if (this.recorderInstance) {
        try {
          await this.recorderInstance.stop();
        } catch {}
        this.recorderInstance = null;
      }

      const recorder = new AudioModule.AudioRecorder(RecordingPresets.HIGH_QUALITY);
      await recorder.prepareToRecordAsync();
      recorder.record();

      this.recorderInstance = recorder;
      this.recordingStartTime = Date.now();
      return true;
    } catch (err: any) {
      Alert.alert('Recording Error', err?.message || 'Could not start recording audio');
      return false;
    }
  }

  static async stopRecording(): Promise<VoiceNoteResult | null> {
    if (!this.recorderInstance) return null;

    try {
      const durationSeconds = Math.max(1, Math.round((Date.now() - this.recordingStartTime) / 1000));
      await this.recorderInstance.stop();
      const uri = this.recorderInstance.uri;
      this.recorderInstance = null;

      // Reset audio mode for playback
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });

      if (!uri) return null;

      const uploadedUrl = await UploadService.uploadImage(
        uri,
        'chat',
        `voice_${Date.now()}.m4a`,
        'audio/m4a'
      );

      return {
        url: uploadedUrl,
        durationSeconds,
      };
    } catch (err: any) {
      Alert.alert('Voice Note Failed', err?.message || 'Failed to upload voice note');
      this.recorderInstance = null;
      return null;
    }
  }

  static async cancelRecording(): Promise<void> {
    if (!this.recorderInstance) return;
    try {
      await this.recorderInstance.stop();
      this.recorderInstance = null;
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
    } catch {
      this.recorderInstance = null;
    }
  }

  static async playSound(
    url: string,
    onStatusUpdate?: (status: { isPlaying: boolean; positionMillis: number; durationMillis: number; didJustFinish: boolean }) => void
  ): Promise<void> {
    try {
      if (this.activePlayer) {
        if (this.activePlayerUrl === url) {
          if (this.activePlayer.playing) {
            this.activePlayer.pause();
            return;
          } else {
            this.activePlayer.play();
            return;
          }
        }
        await this.stopSound();
      }

      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });

      const player = createAudioPlayer(url);
      this.activePlayer = player;
      this.activePlayerUrl = url;

      if (onStatusUpdate) {
        try {
          this.statusSubscription = player.addListener('playbackStatusUpdate', (status: any) => {
            const isPlaying = status?.playing ?? player.playing;
            const positionMillis = Math.round((status?.currentTime ?? player.currentTime ?? 0) * 1000);
            const durationMillis = Math.round((status?.duration ?? player.duration ?? 0) * 1000);
            const didJustFinish = status?.didJustFinish ?? (durationMillis > 0 && positionMillis >= durationMillis);

            onStatusUpdate({
              isPlaying,
              positionMillis,
              durationMillis,
              didJustFinish,
            });

            if (didJustFinish) {
              this.activePlayer = null;
              this.activePlayerUrl = null;
            }
          });
        } catch {}
      }

      player.play();
    } catch (err: any) {
      Alert.alert('Playback Error', 'Could not play voice note: ' + err.message);
    }
  }

  static async stopSound(): Promise<void> {
    if (this.statusSubscription) {
      try {
        this.statusSubscription.remove();
      } catch {}
      this.statusSubscription = null;
    }
    if (this.activePlayer) {
      try {
        this.activePlayer.pause();
        this.activePlayer.release();
      } catch {}
      this.activePlayer = null;
      this.activePlayerUrl = null;
    }
  }
}
