import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Artifix Network Configuration Engine
 * Dynamically resolves API and WebSocket base URLs across:
 * - iOS Simulator (localhost)
 * - Android Emulator (10.0.2.2)
 * - Physical Testing Devices in Expo Go (via Metro hostUri LAN IP)
 * - Production Cloud Gateway
 */

const CLOUD_API_URL = 'https://fixmate-backend-a6t1.onrender.com/api/v1';
const DEFAULT_LOCAL_PORT = 5050; // Artifix backend running port

/**
 * Extract Metro server host IP (e.g. 192.168.1.232) from Expo Constants.
 * Populated automatically when running in Expo Go or Expo Dev Client.
 */
export function getDevHostIp(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;

  if (hostUri && typeof hostUri === 'string') {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return ip;
    }
  }
  return null;
}

/**
 * Resolves a URL containing localhost or 127.0.0.1 to the proper network address
 * depending on whether the app is running on Web, Simulator, Android Emulator,
 * or a physical phone connected over LAN via Expo Go.
 */
function resolveUrl(rawUrl?: string): string {
  if (!rawUrl) {
    const devHostIp = getDevHostIp();
    if (devHostIp) {
      return `http://${devHostIp}:${DEFAULT_LOCAL_PORT}/api/v1`;
    }
    if (Platform.OS === 'android' && !Constants.isDevice) {
      return `http://10.0.2.2:${DEFAULT_LOCAL_PORT}/api/v1`;
    }
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return `http://localhost:${DEFAULT_LOCAL_PORT}/api/v1`;
    }
    return __DEV__ ? `http://localhost:${DEFAULT_LOCAL_PORT}/api/v1` : CLOUD_API_URL;
  }

  // If already pointing to an external domain or specific LAN IP, leave it as is
  if (!rawUrl.includes('localhost') && !rawUrl.includes('127.0.0.1')) {
    return rawUrl;
  }

  // Web browsers run on the same machine, so localhost works
  if (Platform.OS === 'web') {
    return rawUrl;
  }

  // On physical devices (Expo Go / standalone) or simulators on LAN, prioritize Metro's host IP
  const devHostIp = getDevHostIp();
  if (devHostIp) {
    return rawUrl.replace(/localhost|127\.0\.0\.1/g, devHostIp);
  }

  // Android Emulator fallback
  if (Platform.OS === 'android' && !Constants.isDevice) {
    return rawUrl.replace(/localhost|127\.0\.0\.1/g, '10.0.2.2');
  }

  return rawUrl;
}

export function getBaseApiUrl(): string {
  return resolveUrl(process.env.EXPO_PUBLIC_API_URL);
}

export function getSocketBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_SOCKET_URL) {
    return resolveUrl(process.env.EXPO_PUBLIC_SOCKET_URL).replace(/\/api\/v1\/?$/, '');
  }
  const apiUrl = getBaseApiUrl();
  return apiUrl.replace(/\/api\/v1\/?$/, '');
}
