import React, { useState, useEffect, useRef } from 'react';
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
import { LoyaltyService } from '../../services/loyalty.service';
import { ReferralCapture } from '../../lib/referral-capture';
import * as Haptics from 'expo-haptics';
import { Wallet, Gift, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react-native';
import { SocialAuthButtons } from './SocialAuthButtons';

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
  onSocialLoginSuccess?: (role: 'CLIENT' | 'ARTISAN') => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  initialRole = 'CLIENT',
  onBack,
  onProceedToOtp,
  onNavigateToLogin,
  onSocialLoginSuccess,
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

  // Referral Attribution State
  const [referralCode, setReferralCode] = useState<string>('');
  const [isReferralExpanded, setIsReferralExpanded] = useState<boolean>(false);
  const [referralValidation, setReferralValidation] = useState<{
    status: 'idle' | 'validating' | 'valid' | 'invalid';
    referrerName?: string;
    message?: string;
  }>({ status: 'idle' });
  const validationTimeoutRef = useRef<any>(null);

  const registerStore = useAuthStore((s) => s.register);

  // Auto-detect cached referral code on mount
  useEffect(() => {
    let isMounted = true;
    ReferralCapture.init().then((cached) => {
      if (isMounted && cached) {
        setReferralCode(cached);
        setIsReferralExpanded(true);
        triggerReferralValidation(cached);
      }
    });
    return () => {
      isMounted = false;
      if (validationTimeoutRef.current) clearTimeout(validationTimeoutRef.current);
    };
  }, []);

  const triggerReferralValidation = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean || clean.length < 4) {
      setReferralValidation({ status: 'idle' });
      return;
    }

    setReferralValidation({ status: 'validating' });
    if (validationTimeoutRef.current) clearTimeout(validationTimeoutRef.current);

    validationTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await LoyaltyService.validateReferralCode(clean);
        if (result.isValid) {
          setReferralValidation({
            status: 'valid',
            referrerName: result.referrerName || 'Verified Member',
            message: `Referred by ${result.referrerName || 'Member'} — 150 Welcome Points will be unlocked upon your first job.`,
          });
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          setReferralValidation({
            status: 'invalid',
            message: result.message || 'Invalid or inactive referral code',
          });
        }
      } catch {
        setReferralValidation({
          status: 'invalid',
          message: 'Unable to verify referral code. You can proceed without it.',
        });
      }
    }, 450);
  };

  const handleReferralCodeChange = (text: string) => {
    const uppercase = text.toUpperCase();
    setReferralCode(uppercase);
    triggerReferralValidation(uppercase);
  };

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

      const validatedCode =
        referralValidation.status === 'valid' && referralCode.trim()
          ? referralCode.trim().toUpperCase()
          : undefined;

      await registerStore({
        email: formData.email.trim().toLowerCase(),
        phoneNumber: formattedPhone,
        password: formData.password,
        role,
        firstName: role === 'CLIENT' ? 'Client' : 'Artisan',
        lastName: 'Member',
        referralCode: validatedCode,
      });

      // Clear consumed referral cache upon successful registration
      await ReferralCapture.clear();

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

        {/* Referral / Invite Code Accordion */}
        <View style={styles.referralContainer}>
          <TouchableOpacity
            style={styles.referralToggleRow}
            onPress={() => setIsReferralExpanded(!isReferralExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.referralToggleLeft}>
              <Gift size={16} color="#047857" />
              <Text style={styles.referralToggleText}>
                {referralValidation.status === 'valid'
                  ? 'Referral Code Applied ✓'
                  : 'Have an invite or referral code?'}
              </Text>
            </View>
            {isReferralExpanded ? (
              <ChevronUp size={16} color="#78716C" />
            ) : (
              <ChevronDown size={16} color="#78716C" />
            )}
          </TouchableOpacity>

          {isReferralExpanded && (
            <View style={styles.referralInputWrap}>
              <AuthInput
                label="Referral Code (Optional)"
                placeholder="e.g. FIX-Q5AS"
                autoCapitalize="characters"
                autoCorrect={false}
                value={referralCode}
                onChangeText={handleReferralCodeChange}
                helperText="Enter your friend's code to unlock 150 loyalty points on your first completed job."
              />

              {referralValidation.status === 'validating' && (
                <View style={styles.validatingRow}>
                  <ActivityIndicator size="small" color="#047857" />
                  <Text style={styles.validatingText}>Checking referral code...</Text>
                </View>
              )}

              {referralValidation.status === 'valid' && (
                <View style={styles.validBadge}>
                  <CheckCircle2 size={16} color="#047857" style={{ marginRight: 6 }} />
                  <Text style={styles.validBadgeText}>
                    {referralValidation.message}
                  </Text>
                </View>
              )}

              {referralValidation.status === 'invalid' && (
                <Text style={styles.invalidText}>
                  {referralValidation.message}
                </Text>
              )}
            </View>
          )}
        </View>

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

        {/* Social Sign-In (Google & Apple) */}
        <SocialAuthButtons
          role={role}
          onSuccess={(loggedRole) => onSocialLoginSuccess?.(loggedRole)}
          onError={setErrorMessage}
        />
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
  referralContainer: {
    marginVertical: 10,
    backgroundColor: '#FAFAF9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    overflow: 'hidden',
  },
  referralToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  referralToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  referralToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1917',
  },
  referralInputWrap: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F4',
  },
  validatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  validatingText: {
    fontSize: 12,
    color: '#78716C',
  },
  validBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  validBadgeText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  invalidText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 6,
    fontWeight: '500',
  },
});
