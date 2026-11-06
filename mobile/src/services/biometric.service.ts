import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export type BiometricAuthType = 'FACIAL_RECOGNITION' | 'FINGERPRINT' | 'IRIS' | 'NONE';

export interface BiometricCapability {
  isSupported: boolean;
  isEnrolled: boolean;
  biometricType: BiometricAuthType;
}

/**
 * BiometricService:
 * Provides cross-platform hardware-backed biometric verification
 * (Face ID, Touch ID, Android Biometric Prompt)
 */
export class BiometricService {
  /**
   * Check hardware availability and enrollment status
   */
  static async checkCapability(): Promise<BiometricCapability> {
    if (Platform.OS === 'web') {
      return {
        isSupported: false,
        isEnrolled: false,
        biometricType: 'NONE',
      };
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      let biometricType: BiometricAuthType = 'NONE';
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricType = 'FACIAL_RECOGNITION';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricType = 'FINGERPRINT';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        biometricType = 'IRIS';
      }

      return {
        isSupported: hasHardware,
        isEnrolled,
        biometricType,
      };
    } catch (err) {
      console.warn('[BiometricService] Capability check failed:', err);
      return {
        isSupported: false,
        isEnrolled: false,
        biometricType: 'NONE',
      };
    }
  }

  /**
   * Prompt user for Biometric / Device Passcode authentication
   */
  static async authenticate(
    promptMessage: string = 'Unlock Artifix',
    cancelLabel: string = 'Cancel'
  ): Promise<boolean> {
    if (Platform.OS === 'web') {
      return true;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel,
        fallbackLabel: 'Use Device Passcode',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (err) {
      console.warn('[BiometricService] Authentication error:', err);
      return false;
    }
  }
}

export default BiometricService;
