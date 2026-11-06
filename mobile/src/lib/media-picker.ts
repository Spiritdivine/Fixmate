import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { UploadService } from '../services/upload.service';

export interface PickedMediaResult {
  url: string;
  uri: string;
  width?: number;
  height?: number;
}

export class MediaPicker {
  static async pickImage(): Promise<PickedMediaResult | null> {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Permission to access media library is required to send images.');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      const uploadedUrl = await UploadService.uploadImage(
        asset.uri,
        'chat',
        asset.fileName || 'chat_image.jpg',
        asset.mimeType || 'image/jpeg'
      );

      return {
        url: uploadedUrl,
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      };
    } catch (err: any) {
      Alert.alert('Upload Failed', err?.message || 'Failed to upload selected image');
      return null;
    }
  }

  static async takePhoto(): Promise<PickedMediaResult | null> {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera access is required to capture project photos.');
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      const uploadedUrl = await UploadService.uploadImage(
        asset.uri,
        'chat',
        asset.fileName || 'camera_capture.jpg',
        asset.mimeType || 'image/jpeg'
      );

      return {
        url: uploadedUrl,
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      };
    } catch (err: any) {
      Alert.alert('Capture Failed', err?.message || 'Failed to capture and upload photo');
      return null;
    }
  }
}
