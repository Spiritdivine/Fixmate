import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { AuthLayout } from './AuthLayout';
import { AuthInput } from './AuthInput';
import { useAuthStore } from '../../stores/authStore';
import { AuthService } from '../../services/auth.service';
import * as Haptics from 'expo-haptics';

interface OtpVerificationScreenProps {
  phoneNumber?: string;
  email?: string;
  onBack: () => void;
  onVerifySuccess: () => void;
  onEditPhoneNumber?: () => void;
}

export const OtpVerificationScreen: React.FC<OtpVerificationScreenProps> = ({
  phoneNumber = '+234 803 234 5678',
  email,
  onBack,
  onVerifySuccess,
  onEditPhoneNumber,
}) => {
  const [identifier, setIdentifier] = useState(email || phoneNumber);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [secondsLeft, setSecondsLeft] = useState(45);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const inputRefs = useRef<Array<TextInput | null>>([]);
  const verifyOtpStore = useAuthStore((s) => s.verifyOtp);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleOtpChange = (text: string, index: number) => {
    const updated = [...otp];
    updated[index] = text;
    setOtp(updated);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const isComplete = otp.every((d) => d.length === 1);

  const handleVerify = async () => {
    if (!isComplete) {
      setErrorMessage('Please enter the 6-digit verification code');
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsVerifying(true);

    try {
      const otpCode = otp.join('');
      await verifyOtpStore({
        identifier: identifier.trim(),
        otp: otpCode,
        purpose: 'PHONE_VERIFICATION',
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccessMessage('Code verified successfully! Redirecting...');
      setTimeout(() => {
        onVerifySuccess();
      }, 800);
    } catch (err: unknown) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        apiErr.response?.data?.message ||
        apiErr.message ||
        'Invalid or expired verification code.';
      setErrorMessage(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || isResending) return;
    setErrorMessage(null);
    setIsResending(true);

    try {
      await AuthService.resendOtp(identifier.trim(), 'PHONE_VERIFICATION');
      setSuccessMessage('A fresh 6-digit verification code has been dispatched.');
      setSecondsLeft(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(apiErr.response?.data?.message || 'Failed to resend code.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout
      title="Enter verification code"
      subtitle={
        <Text style={styles.subtitleText}>
          We&apos;ve sent a 6-digit one-time code to{' '}
          <Text style={styles.boldContact}>{identifier}</Text>. Enter it below to
          complete authorization.
        </Text>
      }
      onBack={onBack}
      error={errorMessage}
      showcaseBadge="IDENTITY & SECURITY VERIFICATION"
      showcasePills={[
        'Real-time SMS/Email',
        'Fraud Prevention',
        'KYC Compliance',
        'Bank-Grade Security',
      ]}
    >
      <View style={styles.form}>
        {/* Contact Identifier Field */}
        <AuthInput
          label="Email Address or Phone Number"
          value={identifier}
          onChangeText={setIdentifier}
          editable={false}
          style={{ color: '#78716C', backgroundColor: '#F5F5F4' }}
          labelAction={
            onEditPhoneNumber ? (
              <TouchableOpacity onPress={onEditPhoneNumber}>
                <Text style={styles.editText}>Change</Text>
              </TouchableOpacity>
            ) : null
          }
        />

        {/* Success Alert Banner */}
        {successMessage ? (
          <View style={styles.successAlert}>
            <Text style={styles.successText}>✓ {successMessage}</Text>
          </View>
        ) : null}

        {/* 6-Digit PIN Boxes */}
        <Text style={styles.pinLabel}>6-Digit Passcode</Text>
        <View style={styles.otpGrid}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[
                styles.otpBox,
                digit ? styles.otpBoxFilled : null,
                inputRefs.current[index]?.isFocused() ? styles.otpBoxActive : null,
              ]}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(text) => handleOtpChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Resend Link and Countdown */}
        <View style={styles.resendSection}>
          <Text style={styles.resendQuestion}>Didn&apos;t receive the code? </Text>
          {secondsLeft > 0 ? (
            <Text style={styles.resendCooldown}>Resend in {secondsLeft}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={isResending}>
              <Text style={styles.resendActive}>
                {isResending ? 'Sending...' : 'Resend code'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, (!isComplete || isVerifying) && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={!isComplete || isVerifying}
          activeOpacity={0.85}
        >
          {isVerifying ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#153e2d" />
              <Text style={styles.submitButtonText}>Verifying...</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>Verify & continue</Text>
          )}
        </TouchableOpacity>
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
  boldContact: {
    fontWeight: '700',
    color: '#1C1917',
  },
  form: {
    width: '100%',
  },
  editText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669', // emerald-600
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
  pinLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1917',
    marginBottom: 10,
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20,
  },
  otpBox: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E7E5E4',
    backgroundColor: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1917',
    textAlign: 'center',
  },
  otpBoxFilled: {
    borderColor: '#0E3524',
    backgroundColor: '#F9FAFB',
  },
  otpBoxActive: {
    borderColor: '#059669',
    backgroundColor: '#FFFFFF',
  },
  resendSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  resendQuestion: {
    fontSize: 13,
    color: '#78716C',
  },
  resendCooldown: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A8A29E',
  },
  resendActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E3524',
    textDecorationLine: 'underline',
  },
  submitButton: {
    width: '100%',
    height: 52,
    borderRadius: 9999,
    backgroundColor: '#CBF7D2',
    justifyContent: 'center',
    alignItems: 'center',
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
});
