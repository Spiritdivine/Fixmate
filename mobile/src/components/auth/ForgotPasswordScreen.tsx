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
import { apiClient, getErrorMessage } from '../../lib/api-client';
import * as Haptics from 'expo-haptics';

interface ForgotPasswordScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onBack,
  onSuccess,
}) => {
  const [step, setStep] = useState<'REQUEST' | 'RESET'>('REQUEST');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRequestOtp = async () => {
    if (!identifier.trim()) {
      setErrorMessage('Please provide your registered email address or phone number');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      await apiClient.post('/auth/forgot-password', {
        identifier: identifier.trim(),
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccessMessage('Verification code sent! Please check your device.');
      setStep('RESET');
    } catch (err: unknown) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp.trim() || otp.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit verification code');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      await apiClient.post('/auth/reset-password', {
        identifier: identifier.trim(),
        otp: otp.trim(),
        newPassword,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccessMessage('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (err: unknown) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={step === 'REQUEST' ? 'Reset password' : 'Create new password'}
      subtitle={
        <Text style={styles.subtitleText}>
          {step === 'REQUEST'
            ? 'Enter your registered email or phone to receive a 6-digit code.'
            : `Enter the 6-digit code sent to ${identifier} and choose a new password.`}
        </Text>
      }
      onBack={step === 'RESET' ? () => setStep('REQUEST') : onBack}
      error={errorMessage}
      showcasePills={[
        'Instant OTP Delivery',
        'NIN/BVN Linked',
        'Encrypted Credentials',
        'Escrow Safe',
      ]}
      footerDisclaimer={
        <TouchableOpacity onPress={onBack} style={{ marginTop: 8 }}>
          <Text style={styles.backToLoginText}>
            Remember your password?{' '}
            <Text style={{ fontWeight: '700', color: '#1C1917' }}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      }
    >
      <View style={styles.form}>
        {/* Success Alert */}
        {successMessage ? (
          <View style={styles.successAlert}>
            <Text style={styles.successText}>✓ {successMessage}</Text>
          </View>
        ) : null}

        {step === 'REQUEST' ? (
          <>
            {/* Step 1: Identifier Input */}
            <AuthInput
              label="Email Address or Phone Number"
              placeholder="you@example.com or 080..."
              keyboardType="email-address"
              autoCapitalize="none"
              value={identifier}
              onChangeText={setIdentifier}
            />

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.buttonDisabled]}
              onPress={handleRequestOtp}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#153e2d" />
                  <Text style={styles.submitButtonText}>Sending code...</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>Send verification code</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Step 2: Code, New Password, Confirm Password */}
            <AuthInput
              label="6-Digit Verification Code"
              placeholder="123456"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
            />

            <AuthInput
              label="New Password"
              placeholder="At least 8 characters"
              secureTextEntry
              autoCapitalize="none"
              value={newPassword}
              onChangeText={setNewPassword}
              helperText="Must be 8+ characters long"
            />

            <AuthInput
              label="Confirm New Password"
              placeholder="Repeat new password"
              secureTextEntry
              autoCapitalize="none"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={
                confirmPassword && newPassword !== confirmPassword
                  ? 'Passwords do not match'
                  : undefined
              }
            />

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#153e2d" />
                  <Text style={styles.submitButtonText}>Resetting password...</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>Reset password</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  subtitleText: {
    fontSize: 14,
    color: '#78716C',
    lineHeight: 20,
  },
  form: {
    width: '100%',
  },
  successAlert: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  successText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
  },
  submitButton: {
    width: '100%',
    height: 52,
    borderRadius: 9999,
    backgroundColor: '#CBF7D2',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
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
    color: '#153E2D',
    letterSpacing: -0.2,
  },
  backToLoginText: {
    fontSize: 13,
    color: '#78716C',
    textAlign: 'center',
  },
});
