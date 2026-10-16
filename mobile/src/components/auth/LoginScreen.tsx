import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { AuthLayout } from './AuthLayout';
import { AuthInput } from './AuthInput';
import { useAuthStore } from '../../stores/authStore';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { Fingerprint } from 'lucide-react-native';

interface LoginScreenProps {
  onBack?: () => void;
  onLoginSuccess: (role: 'CLIENT' | 'ARTISAN') => void;
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onBack,
  onLoginSuccess,
  onNavigateToRegister,
  onNavigateToForgotPassword,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loginStore = useAuthStore((s) => s.login);

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      setErrorMessage('Please provide your email address or phone number and password');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const isEmail = identifier.includes('@');
      const payload = isEmail
        ? { email: identifier.trim().toLowerCase(), password }
        : { identifier: identifier.trim(), password };

      const user = await loginStore(payload);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onLoginSuccess((user.role as 'CLIENT' | 'ARTISAN') || 'CLIENT');
    } catch (err: unknown) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        apiErr.response?.data?.message ||
        apiErr.message ||
        'Invalid credentials. Please verify your email and password.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    setErrorMessage(null);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setErrorMessage('Biometric authentication is not configured on this device.');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Sign in to Artifix',
        fallbackLabel: 'Enter Password',
      });

      if (result.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onLoginSuccess('CLIENT');
      }
    } catch {
      setErrorMessage('Biometric verification failed.');
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle={
        <Text style={styles.subtitleText}>
          Don&apos;t have an account?{' '}
          <Text style={styles.boldLink} onPress={onNavigateToRegister}>
            Sign up
          </Text>
        </Text>
      }
      onBack={onBack}
      error={errorMessage}
      showcasePills={[
        'Escrow Milestones',
        'Verified Artisans',
        'Instant Payouts',
        'Smart Escrow',
      ]}
      footerDisclaimer={
        <Text style={styles.disclaimerText}>
          By signing in you agree to our{' '}
          <Text style={styles.disclaimerLink}>terms of use</Text> and{' '}
          <Text style={styles.disclaimerLink}>privacy policy</Text>.
        </Text>
      }
    >
      <View style={styles.form}>
        {/* Email Field */}
        <AuthInput
          label="Email"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="username"
          value={identifier}
          onChangeText={setIdentifier}
        />

        {/* Password Field with Forgot Password Label Action */}
        <AuthInput
          label="Password"
          placeholder="Enter your password"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="current-password"
          value={password}
          onChangeText={setPassword}
          labelAction={
            <TouchableOpacity onPress={onNavigateToForgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>
          }
        />

        {/* Primary Submit Button: signature web rounded-full bg-[#cbf7d2] text-[#153e2d] */}
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#153e2d" />
              <Text style={styles.submitButtonText}>Signing in...</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>Sign in</Text>
          )}
        </TouchableOpacity>

        {/* Quick Biometrics Button */}
        <TouchableOpacity
          style={styles.biometricButton}
          onPress={handleBiometricAuth}
          activeOpacity={0.7}
        >
          <Fingerprint size={18} color="#0E3524" />
          <Text style={styles.biometricText}>Quick Sign in with FaceID / Biometrics</Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  subtitleText: {
    fontSize: 14,
    color: '#78716C', // stone-500
    lineHeight: 20,
  },
  boldLink: {
    fontWeight: '700',
    color: '#1C1917', // stone-900
    textDecorationLine: 'underline',
  },
  form: {
    width: '100%',
    paddingTop: 8,
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#44403C', // stone-700
    textDecorationLine: 'underline',
  },
  submitButton: {
    width: '100%',
    height: 52,
    borderRadius: 9999, // rounded-full
    backgroundColor: '#CBF7D2', // signature web mint button
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#153E2D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#153E2D', // signature dark green text
    letterSpacing: -0.2,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 9999,
    backgroundColor: '#F5F5F4',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  biometricText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0E3524',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#A8A29E', // stone-400
    textAlign: 'center',
    lineHeight: 18,
  },
  disclaimerLink: {
    color: '#57534E',
    textDecorationLine: 'underline',
  },
});
