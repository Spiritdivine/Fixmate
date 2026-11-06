import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
} from 'expo-audio';
import { Platform } from 'react-native';

export class AudioRecorder {
  private recorder: any = null;
  private listenerSubscription: any = null;
  private timer: any = null;
  private startTime = 0;

  async startRecording(onStatusUpdate?: (status: { isRecording: boolean; durationMillis: number }) => void): Promise<void> {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Microphone permission denied');
    }

    if (Platform.OS !== 'web') {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
    }

    // Clean up any lingering recorder
    if (this.recorder) {
      try {
        await this.recorder.stop();
      } catch {}
      this.recorder = null;
    }
    this.cleanUpListeners();

    const recorder = new AudioModule.AudioRecorder(RecordingPresets.HIGH_QUALITY);
    await recorder.prepareToRecordAsync();
    this.startTime = Date.now();
    recorder.record();
    this.recorder = recorder;

    if (onStatusUpdate) {
      try {
        this.listenerSubscription = recorder.addListener('recordingStatusUpdate', (status: any) => {
          onStatusUpdate({
            isRecording: status?.isRecording ?? true,
            durationMillis: status?.durationMillis ?? (Date.now() - this.startTime),
          });
        });
      } catch {}

      // Heartbeat interval to ensure UI timer increments even if events are throttled
      this.timer = setInterval(() => {
        if (this.recorder) {
          onStatusUpdate({
            isRecording: true,
            durationMillis: Date.now() - this.startTime,
          });
        }
      }, 250);
    }
  }

  async stopRecording(): Promise<{ uri: string; durationMs: number }> {
    if (!this.recorder) {
      throw new Error('No active recording');
    }

    this.cleanUpListeners();

    const durationMs = Math.max(0, Date.now() - this.startTime);
    await this.recorder.stop();
    const uri = this.recorder.uri;
    this.recorder = null;

    if (!uri) throw new Error('Recording URI is null');

    return {
      uri,
      durationMs,
    };
  }

  private cleanUpListeners(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.listenerSubscription) {
      try {
        this.listenerSubscription.remove();
      } catch {}
      this.listenerSubscription = null;
    }
  }

  isRecording(): boolean {
    return this.recorder !== null;
  }
}
