import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Fixmate Network Configuration Engine
 * Dynamically resolves API and WebSocket base URLs across:
 * - iOS Simulator (localhost)
 * - Android Emulator (10.0.2.2)
 * - Physical Testing Devices (via Metro hostUri IP)
 * - Production Cloud Gateway
 */

const CLOUD_API_URL = 'https://fixmate-backend-a6t1.onrender.com/api/v1';
const DEFAULT_LOCAL_PORT = 5050; // Fixmate backend running port

export function getBaseApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Browser / Web runtime on localhost
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return `http://localhost:${DEFAULT_LOCAL_PORT}/api/v1`;
    }
  }

  // Native Development runtime
  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return `http://${ip}:${DEFAULT_LOCAL_PORT}/api/v1`;
      }
    }
    if (Platform.OS === 'android') {
      return `http://10.0.2.2:${DEFAULT_LOCAL_PORT}/api/v1`;
    }
    return `http://localhost:${DEFAULT_LOCAL_PORT}/api/v1`;
  }

  // Default to live cloud backend gateway (Render) for production builds
  return CLOUD_API_URL;
}

export function getSocketBaseUrl(): string {
  const apiUrl = getBaseApiUrl();
  return apiUrl.replace('/api/v1', '');
}
