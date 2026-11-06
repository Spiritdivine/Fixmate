import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../stores/authStore';
import { colors, radius, spacing, typography } from '../../theme';

interface SocialAuthButtonsProps {
  onSuccess: (role: 'CLIENT' | 'ARTISAN') => void;
  onError?: (error: string) => void;
  role?: 'CLIENT' | 'ARTISAN';
}

export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({
  onSuccess,
  onError,
  role = 'CLIENT',
}) => {
  const [loadingProvider, setLoadingProvider] = useState<'GOOGLE' | 'APPLE' | null>(null);
  const socialLogin = useAuthStore((s) => s.socialLogin);

  const handleGoogleSignIn = async () => {
    setLoadingProvider('GOOGLE');
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      
      // In production, invoke @react-native-google-signin or expo-auth-session
      // Here we prepare the structured payload call to the backend
      // and support mock tokens during local development / testing
      const mockGoogleToken = `eyJhbGciOiJSUzI1NiIsImtpZCI6IjEifQ.mock-google-${role.toLowerCase()}-token`;
      
      const user = await socialLogin({
        provider: 'GOOGLE',
        idToken: mockGoogleToken,
        role,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onSuccess((user.role as 'CLIENT' | 'ARTISAN') || role);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      const msg = err.response?.data?.message || err.message || 'Google Sign-In failed';
      onError?.(msg);
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleAppleSignIn = async () => {
    setLoadingProvider('APPLE');
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      const mockAppleToken = `eyJhbGciOiJSUzI1NiIsImtpZCI6IjEifQ.mock-apple-${role.toLowerCase()}-token`;

      const user = await socialLogin({
        provider: 'APPLE',
        idToken: mockAppleToken,
        role,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onSuccess((user.role as 'CLIENT' | 'ARTISAN') || role);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      const msg = err.response?.data?.message || err.message || 'Apple Sign-In failed';
      onError?.(msg);
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.buttonsRow}>
        {/* Google Button */}
        <TouchableOpacity
          style={styles.socialButton}
          onPress={handleGoogleSignIn}
          disabled={loadingProvider !== null}
          activeOpacity={0.8}
        >
          {loadingProvider === 'GOOGLE' ? (
            <ActivityIndicator size="small" color="#1C1917" />
          ) : (
            <View style={styles.buttonContent}>
              <Text style={styles.googleIconText}>G</Text>
              <Text style={styles.buttonLabel}>Google</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Apple Button */}
        {(Platform.OS === 'ios' || Platform.OS === 'web') && (
          <TouchableOpacity
            style={[styles.socialButton, styles.appleButton]}
            onPress={handleAppleSignIn}
            disabled={loadingProvider !== null}
            activeOpacity={0.8}
          >
            {loadingProvider === 'APPLE' ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.appleIconText}></Text>
                <Text style={[styles.buttonLabel, styles.appleLabel]}>Apple</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 14,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E7E5E4', // stone-200
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A8A29E', // stone-400
    letterSpacing: 0.5,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  googleIconText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EA4335',
  },
  appleIconText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1917',
  },
  appleLabel: {
    color: '#FFFFFF',
  },
});

export default SocialAuthButtons;
