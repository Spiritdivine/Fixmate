import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { AuthInput } from './AuthInput';
import { ProfileService } from '../../services/profile.service';
import { useAuthStore } from '../../stores/authStore';
import * as Haptics from 'expo-haptics';
import { ShieldCheck, CheckCircle2, Lock, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../theme';

interface ClientOnboardingScreenProps {
  onComplete: () => void;
}

export const ClientOnboardingScreen: React.FC<ClientOnboardingScreenProps> = ({
  onComplete,
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [currentStep, setCurrentStep] = useState(1);
  const [firstName, setFirstName] = useState(user?.clientProfile?.firstName || '');
  const [lastName, setLastName] = useState(user?.clientProfile?.lastName || '');
  const [city, setCity] = useState(user?.clientProfile?.city || 'Lekki Phase 1');
  const [state, setState] = useState(user?.clientProfile?.state || 'Lagos');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!firstName.trim()) {
        setErrorMessage('Please provide your first name');
        return;
      }

      setErrorMessage(null);
      setIsSubmitting(true);

      try {
        await ProfileService.updateClient({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          city,
          state,
        });

        updateUser({
          clientProfile: {
            id: user?.clientProfile?.id || '',
            userId: user?.id || '',
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            city,
            state,
          },
        });

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCurrentStep(2);
      } catch {
        // Fallback gracefully
        setCurrentStep(2);
      } finally {
        setIsSubmitting(false);
      }
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else {
      onComplete();
    }
  };

  const cities = ['Lekki Phase 1', 'Victoria Island', 'Ikoyi', 'Ikeja GRA', 'Surulere', 'Yaba'];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      {/* Top Header matching web ClientOrientation */}
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.headerBorder }]}>
        <View style={styles.brandRow}>
          <View style={styles.avatarMark}>
            <Text style={styles.avatarMarkText}>A</Text>
          </View>
          <View>
            <Text style={[styles.brandTitle, { color: themeColors.text }]}>Artifix</Text>
            <Text style={[styles.brandSub, isDark && { color: '#34D399' }]}>CLIENT ORIENTATION</Text>
          </View>
        </View>

        <TouchableOpacity onPress={onComplete} activeOpacity={0.7}>
          <Text style={[styles.skipText, { color: themeColors.textMuted }]}>Skip to dashboard →</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={[styles.stepCount, { color: themeColors.textMuted }]}>STEP {currentStep} OF 3</Text>
            <Text style={[styles.stepName, { color: isDark ? '#34D399' : '#065F46' }]}>
              {currentStep === 1 && 'Profile Details'}
              {currentStep === 2 && 'Escrow Guarantee'}
              {currentStep === 3 && 'Get Started'}
            </Text>
          </View>
          <View style={[styles.progressBarTrack, { backgroundColor: themeColors.surfaceSubtle }]}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(currentStep / 3) * 100}%`, backgroundColor: themeColors.primary },
              ]}
            />
          </View>
        </View>

        {/* Error Alert */}
        {errorMessage ? (
          <View style={styles.errorAlert}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* STEP 1: CLIENT PROFILE */}
        {currentStep === 1 && (
          <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: themeColors.text }]}>Tell us about yourself</Text>
              <Text style={[styles.cardSub, { color: themeColors.textMuted }]}>
                This helps verified artisans know who they are working with when bidding on your repair jobs.
              </Text>
            </View>

            <View style={styles.formRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <AuthInput
                  label="First name"
                  placeholder="e.g. Babatunde"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <AuthInput
                  label="Last name"
                  placeholder="e.g. Adeleke"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            <Text style={[styles.fieldLabel, { color: themeColors.text }]}>Primary District / City</Text>
            <View style={styles.chipsRow}>
              {cities.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.chip,
                    { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border },
                    city === c && [styles.chipActive, { backgroundColor: isDark ? '#064E3B' : '#ECFDF5', borderColor: themeColors.primary }],
                  ]}
                  onPress={() => setCity(c)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: themeColors.text },
                      city === c && [styles.chipTextActive, { color: isDark ? '#34D399' : '#065F46' }],
                    ]}
                  >
                    📍 {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <AuthInput
              label="State"
              value={state}
              onChangeText={setState}
              placeholder="e.g. Lagos"
            />

            <TouchableOpacity
              style={[
                styles.submitButton,
                isDark && { backgroundColor: '#10B981' },
                isSubmitting && styles.buttonDisabled,
              ]}
              onPress={handleNext}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#153e2d'} />
              ) : (
                <Text style={[styles.submitButtonText, isDark && { color: '#FFFFFF' }]}>Continue to Escrow Tour →</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: ESCROW GUARANTEE */}
        {currentStep === 2 && (
          <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.shieldBadge, isDark && { backgroundColor: '#064E3B' }]}>
                <ShieldCheck size={16} color={isDark ? '#34D399' : '#059669'} />
                <Text style={[styles.shieldBadgeText, isDark && { color: '#34D399' }]}>PEACE OF MIND</Text>
              </View>
              <Text style={[styles.cardTitle, { color: themeColors.text }]}>How Artifix Escrow Protects You</Text>
              <Text style={[styles.cardSub, { color: themeColors.textMuted }]}>
                Your repair funds stay locked in an independent vault until you personally inspect and sign off on the work.
              </Text>
            </View>

            <View style={[styles.featureItem, { backgroundColor: themeColors.surfaceSubtle }]}>
              <View style={[styles.featureIconWrap, { backgroundColor: themeColors.surface }]}>
                <Text style={[styles.featureNumber, { color: themeColors.text }]}>1</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureHeading, { color: themeColors.text }]}>Agree on Milestones</Text>
                <Text style={[styles.featureBody, { color: themeColors.textMuted }]}>
                  The artisan divides the quote into transparent parts and labor milestones.
                </Text>
              </View>
            </View>

            <View style={[styles.featureItem, { backgroundColor: themeColors.surfaceSubtle }]}>
              <View style={[styles.featureIconWrap, { backgroundColor: themeColors.surface }]}>
                <Lock size={16} color={isDark ? '#34D399' : '#0E3524'} />
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureHeading, { color: themeColors.text }]}>Fund Neutral Vault</Text>
                <Text style={[styles.featureBody, { color: themeColors.textMuted }]}>
                  Deposit with Paystack or card. The artisan cannot withdraw until authorized.
                </Text>
              </View>
            </View>

            <View style={[styles.featureItem, { backgroundColor: themeColors.surfaceSubtle }]}>
              <View style={[styles.featureIconWrap, { backgroundColor: themeColors.surface }]}>
                <CheckCircle2 size={16} color={isDark ? '#34D399' : '#059669'} />
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureHeading, { color: themeColors.text }]}>Inspect & Approve Release</Text>
                <Text style={[styles.featureBody, { color: themeColors.textMuted }]}>
                  View Before/After proof photos. One tap releases instant funds to the artisan.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                isDark && { backgroundColor: '#10B981' },
              ]}
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <Text style={[styles.submitButtonText, isDark && { color: '#FFFFFF' }]}>Got it, Finish Setup →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 3: GET STARTED */}
        {currentStep === 3 && (
          <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={[styles.successIconCircle, isDark && { backgroundColor: '#064E3B' }]}>
              <CheckCircle2 size={36} color={isDark ? '#34D399' : '#059669'} />
            </View>

            <Text style={[styles.cardTitle, { color: themeColors.text, textAlign: 'center', marginTop: 12 }]}>
              You&apos;re All Set, {firstName || 'Chief'}!
            </Text>
            <Text style={[styles.cardSub, { color: themeColors.textMuted, textAlign: 'center', marginBottom: 24 }]}>
              Your client profile is active. You can now use AI to diagnose broken items or post jobs to get competitive artisan bids in minutes.
            </Text>

            <TouchableOpacity
              style={[
                styles.submitButton,
                isDark && { backgroundColor: '#10B981' },
              ]}
              onPress={onComplete}
              activeOpacity={0.85}
            >
              <Text style={[styles.submitButtonText, isDark && { color: '#FFFFFF' }]}>Go to My Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAF7F0', // warm off-white matching web
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E7E5E4',
    backgroundColor: '#FFFFFF',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarMark: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#123E2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMarkText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#34D399',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1917',
    lineHeight: 18,
  },
  brandSub: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669',
    letterSpacing: 0.5,
  },
  skipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#78716C',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78716C',
  },
  stepName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#E7E5E4',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#123E2A',
    borderRadius: 9999,
  },
  errorAlert: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#BE123C',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 16,
  },
  shieldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  shieldBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    color: '#78716C',
    lineHeight: 18,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1917',
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    backgroundColor: '#F5F5F4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  chipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#44403C',
  },
  chipTextActive: {
    color: '#065F46',
    fontWeight: '700',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
  },
  featureIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#E7E5E4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1917',
  },
  featureContent: {
    flex: 1,
  },
  featureHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 2,
  },
  featureBody: {
    fontSize: 12,
    color: '#78716C',
    lineHeight: 16,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitButton: {
    width: '100%',
    height: 52,
    borderRadius: 9999,
    backgroundColor: '#CBF7D2',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#153E2D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#153E2D',
    letterSpacing: -0.2,
  },
});
