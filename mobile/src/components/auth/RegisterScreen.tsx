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
import * as Haptics from 'expo-haptics';
import { Wallet } from 'lucide-react-native';

interface RegisterScreenProps {
  initialRole?: 'CLIENT' | 'ARTISAN';
  onBack?: () => void;
  onProceedToOtp: (registrationData: {
    fullName: string;
    phone: string;
    email: string;
    role: 'CLIENT' | 'ARTISAN';
  }) => void;
  onNavigateToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  initialRole = 'CLIENT',
  onBack,
  onProceedToOtp,
  onNavigateToLogin,
}) => {
  const [role, setRole] = useState<'CLIENT' | 'ARTISAN'>(initialRole);
  const [formData, setFormData] = useState({
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const registerStore = useAuthStore((s) => s.register);

  const handleRegister = async () => {
    if (!formData.email.trim()) {
      setErrorMessage('Please enter your email address');
      return;
    }

    if (!formData.phoneNumber.trim()) {
      setErrorMessage('Please enter your phone number');
      return;
    }

    if (formData.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      let formattedPhone = formData.phoneNumber.trim();
      if (!formattedPhone.startsWith('+')) {
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '+234' + formattedPhone.slice(1);
        } else {
          formattedPhone = '+234' + formattedPhone;
        }
      }

      await registerStore({
        email: formData.email.trim().toLowerCase(),
        phoneNumber: formattedPhone,
        password: formData.password,
        role,
        firstName: role === 'CLIENT' ? 'Client' : 'Artisan',
        lastName: 'Member',
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onProceedToOtp({
        fullName: role === 'CLIENT' ? 'Client Member' : 'Artisan Member',
        phone: formattedPhone,
        email: formData.email.trim().toLowerCase(),
        role,
      });
    } catch (err: unknown) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        apiErr.response?.data?.message ||
        apiErr.message ||
        'Registration failed. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle={
        <Text style={styles.subtitleText}>
          Already with us?{' '}
          <Text style={styles.boldLink} onPress={onNavigateToLogin}>
            Sign in
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
          By signing up you agree to our{' '}
          <Text style={styles.disclaimerLink}>terms of use</Text> and{' '}
          <Text style={styles.disclaimerLink}>privacy policy</Text>.
        </Text>
      }
    >
      <View style={styles.form}>
        {/* Minimalist Role Selector (matching web grid grid-cols-2 p-1 rounded-full bg-stone-100) */}
        <View style={styles.roleSelectorContainer}>
          <TouchableOpacity
            style={[styles.roleTab, role === 'CLIENT' && styles.roleTabActive]}
            onPress={() => setRole('CLIENT')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.roleTabText,
                role === 'CLIENT' && styles.roleTabTextActive,
              ]}
            >
              I want to Hire
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleTab, role === 'ARTISAN' && styles.roleTabActive]}
            onPress={() => setRole('ARTISAN')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.roleTabText,
                role === 'ARTISAN' && styles.roleTabTextActive,
              ]}
            >
              I am an Artisan
            </Text>
          </TouchableOpacity>
        </View>

        {/* Work Email */}
        <AuthInput
          label="Work email"
          placeholder="you@company.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
        />

        {/* Phone Number */}
        <AuthInput
          label="Phone number"
          placeholder="08012345678"
          keyboardType="phone-pad"
          autoComplete="tel"
          value={formData.phoneNumber}
          onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
        />

        {/* Password */}
        <AuthInput
          label="Password"
          placeholder="At least 8 characters"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          value={formData.password}
          onChangeText={(text) => setFormData({ ...formData, password: text })}
          helperText="Use 8+ characters with a number and a symbol"
        />

        {/* Confirm Password */}
        <AuthInput
          label="Confirm password"
          placeholder="Repeat it"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          value={formData.confirmPassword}
          onChangeText={(text) =>
            setFormData({ ...formData, confirmPassword: text })
          }
          error={
            formData.confirmPassword &&
            formData.password !== formData.confirmPassword
              ? 'Passwords do not match'
              : undefined
          }
        />

        {/* Monad Embedded Smart Escrow Wallet Trust Callout */}
        <View style={styles.walletCallout}>
          <View style={styles.walletIconWrap}>
            <Wallet size={16} color="#047857" />
          </View>
          <View style={styles.walletTextWrap}>
            <Text style={styles.walletTitle}>Automated Smart Escrow Wallet:</Text>
            <Text style={styles.walletSub}>
              A secure non-custodial embedded wallet is automatically generated and secured for your account.
            </Text>
          </View>
        </View>

        {/* Primary Submit Button: signature web rounded-full bg-[#cbf7d2] text-[#153e2d] */}
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#153e2d" />
              <Text style={styles.submitButtonText}>Creating account...</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>Create account</Text>
          )}
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
    paddingTop: 4,
  },
  roleSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F4', // stone-100
    borderWidth: 1,
    borderColor: '#E7E5E4', // stone-200
    borderRadius: 9999,
    padding: 4,
    marginBottom: 20,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
  },
  roleTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  roleTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#78716C', // stone-500
  },
  roleTabTextActive: {
    color: '#1C1917', // stone-900
    fontWeight: '700',
  },
  walletCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#ECFDF5', // emerald-50
    borderWidth: 1,
    borderColor: '#A7F3D0', // emerald-200
    borderRadius: 14,
    padding: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  walletIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  walletTextWrap: {
    flex: 1,
  },
  walletTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#064E3B', // emerald-950
    marginBottom: 2,
  },
  walletSub: {
    fontSize: 11,
    color: '#047857', // emerald-700
    lineHeight: 16,
  },
  submitButton: {
    width: '100%',
    height: 52,
    borderRadius: 9999,
    backgroundColor: '#CBF7D2', // signature web mint button
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
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
  disclaimerText: {
    fontSize: 12,
    color: '#A8A29E',
    textAlign: 'center',
    lineHeight: 18,
  },
  disclaimerLink: {
    color: '#57534E',
    textDecorationLine: 'underline',
  },
});
