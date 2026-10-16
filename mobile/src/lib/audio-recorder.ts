import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export class AudioRecorder {
  private recording: Audio.Recording | null = null;

  async startRecording(onStatusUpdate?: (status: Audio.RecordingStatus) => void): Promise<void> {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Microphone permission denied');
    }

    if (Platform.OS !== 'web') {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    }

    const recordingInstance = new Audio.Recording();
    const options = {
      ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
      web: {
        mimeType: 'audio/webm',
        bitsPerSecond: 128000,
      },
    };

    await recordingInstance.prepareToRecordAsync(options);
    if (onStatusUpdate) {
      recordingInstance.setOnRecordingStatusUpdate(onStatusUpdate);
      recordingInstance.setProgressUpdateInterval(200);
    }

    await recordingInstance.startAsync();
    this.recording = recordingInstance;
  }

  async stopRecording(): Promise<{ uri: string; durationMs: number }> {
    if (!this.recording) {
      throw new Error('No active recording');
    }

    await this.recording.stopAndUnloadAsync();
    const uri = this.recording.getURI();
    if (!uri) throw new Error('Recording URI is null');

    const status = await this.recording.getStatusAsync();
    const durationMs = status.durationMillis || 0;

    this.recording = null;

    return {
      uri,
      durationMs,
    };
  }

  isRecording(): boolean {
    return this.recording !== null;
  }
}
