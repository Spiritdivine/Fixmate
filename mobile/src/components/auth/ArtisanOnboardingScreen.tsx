import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { AuthInput } from './AuthInput';
import { ProfileService } from '../../services/profile.service';
import { useAuthStore } from '../../stores/authStore';
import { formatCurrency } from '../../lib/formatters';
import * as Haptics from 'expo-haptics';
import {
  Wrench,
  CheckCircle2,
  MapPin,
  Clock,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  DollarSign,
} from 'lucide-react-native';

interface ArtisanOnboardingScreenProps {
  onComplete: () => void;
}

const TRADES_CATALOG: Record<string, { label: string; icon: string; skills: string[] }> = {
  'solar-and-inverters': {
    label: 'Solar & Inverters',
    icon: '☀️',
    skills: ['Solar Panel Sizing', 'Lithium Battery Setup', 'Inverter Earthing', 'Charge Controllers'],
  },
  'electrical': {
    label: 'Electrical',
    icon: '⚡',
    skills: ['Conduit Wiring', 'Distribution Board', 'MCB Tripping', 'Changeover Switch', 'Fault Finding'],
  },
  'plumbing': {
    label: 'Plumbing',
    icon: '🔧',
    skills: ['PPR Pipe Welding', 'Pressure Booster Pump', 'Water Heater Repair', 'Drainage Unclogging'],
  },
  'hvac': {
    label: 'HVAC & AC Repair',
    icon: '❄️',
    skills: ['Gas Refilling', 'Compressor Replacement', 'Split Unit Installation', 'Leak Detection'],
  },
  'carpentry': {
    label: 'Carpentry',
    icon: '🪚',
    skills: ['Cabinet Making', 'Door Lock Installation', 'Roof Truss Repair', 'Furniture Polishing'],
  },
  'painting': {
    label: 'Painting & Screeding',
    icon: '🎨',
    skills: ['Wall Screeding', 'Damp Treatment', 'Exterior Coating', 'Stucco & Texturing'],
  },
};

export const ArtisanOnboardingScreen: React.FC<ArtisanOnboardingScreenProps> = ({
  onComplete,
}) => {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 1: Identity & Bio
  const [firstName, setFirstName] = useState(
    (user as any)?.firstName || user?.clientProfile?.firstName || user?.artisanProfile?.title?.split(' ')[0] || ''
  );
  const [lastName, setLastName] = useState(
    (user as any)?.lastName || user?.clientProfile?.lastName || user?.artisanProfile?.title?.split(' ')[1] || ''
  );
  const [businessName, setBusinessName] = useState(user?.artisanProfile?.businessName || '');
  const [tagline, setTagline] = useState(user?.artisanProfile?.tagline || '');
  const [bio, setBio] = useState(user?.artisanProfile?.bio || '');

  // Step 2: Trade & Skills
  const [selectedTradeKey, setSelectedTradeKey] = useState<string>(
    user?.artisanProfile?.trade?.toLowerCase() || 'electrical'
  );
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    user?.artisanProfile?.skills || []
  );

  // Step 3: Rates & Experience
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(
    user?.artisanProfile?.yearsOfExperience || 3
  );
  const [hourlyRate, setHourlyRate] = useState<string>(
    user?.artisanProfile?.hourlyRate ? String(user.artisanProfile.hourlyRate) : '5000'
  );
  const [isAvailable247, setIsAvailable247] = useState<boolean>(true);

  // Step 4: Workshop Location & Radius
  const [state, setState] = useState<string>('Lagos');
  const [lgaCity, setLgaCity] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [coverageRadiusKm, setCoverageRadiusKm] = useState<number>(15);

  const availableSkills = TRADES_CATALOG[selectedTradeKey]?.skills || [];

  const handleToggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!firstName.trim()) {
        setErrorMessage('Please enter your first name');
        return;
      }
    }

    if (currentStep < 5) {
      setErrorMessage(null);
      setCurrentStep(currentStep + 1);
      return;
    }

    // Step 5: Submit profile to backend
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const activeTrade = TRADES_CATALOG[selectedTradeKey]?.label || 'Electrical';
      await ProfileService.updateArtisan({
        trade: activeTrade,
        businessName: businessName.trim() || undefined,
        title: `${firstName.trim()} ${lastName.trim()}`.trim(),
        tagline: tagline.trim() || undefined,
        bio: bio.trim() || undefined,
        yearsOfExperience: Number(yearsOfExperience),
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : 5000,
        isAvailable: isAvailable247,
        skills: selectedSkills,
      });

      updateUser({
        artisanProfile: {
          id: user?.artisanProfile?.id || '',
          userId: user?.id || '',
          trade: activeTrade,
          businessName: businessName.trim() || undefined,
          title: `${firstName.trim()} ${lastName.trim()}`.trim(),
          tagline: tagline.trim() || undefined,
          bio: bio.trim() || undefined,
          yearsOfExperience: Number(yearsOfExperience),
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : 5000,
          startingPrice: hourlyRate ? parseFloat(hourlyRate) : 5000,
          rating: 5.0,
          reviewCount: 0,
          completedJobsCount: 0,
          isVerified: false,
          isAvailable: isAvailable247,
          skills: selectedSkills,
        },
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete();
    } catch {
      // Graceful fallback
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top Header matching web ArtisanOnboarding */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.avatarMark}>
            <Text style={styles.avatarMarkText}>A</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>Artifix</Text>
            <Text style={styles.brandSub}>ARTISAN ONBOARDING</Text>
          </View>
        </View>

        <TouchableOpacity onPress={onComplete} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip to cockpit →</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.stepCount}>STEP {currentStep} OF 5</Text>
            <Text style={styles.stepName}>
              {currentStep === 1 && 'Identity & Bio'}
              {currentStep === 2 && 'Trade & Skills'}
              {currentStep === 3 && 'Rates & Experience'}
              {currentStep === 4 && 'Workshop & Radius'}
              {currentStep === 5 && 'Review & Launch'}
            </Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(currentStep / 5) * 100}%` },
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

        {/* STEP 1: IDENTITY & BIO */}
        {currentStep === 1 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Identity & Bio</Text>
            <Text style={styles.cardSub}>
              Clients hire artisans with clear, trustworthy identity profiles and business details.
            </Text>

            <View style={styles.formRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <AuthInput
                  label="First name"
                  placeholder="e.g. Ade"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <AuthInput
                  label="Last name"
                  placeholder="e.g. Bello"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            <AuthInput
              label="Business or Workshop Name"
              placeholder="e.g. Ade Electrical Solutions"
              value={businessName}
              onChangeText={setBusinessName}
            />

            <AuthInput
              label="Professional Tagline"
              placeholder="e.g. Certified Solar & Industrial Electrician"
              value={tagline}
              onChangeText={setTagline}
            />

            <AuthInput
              label="Professional Bio"
              placeholder="Describe your trade background and certifications..."
              multiline
              numberOfLines={3}
              style={{ height: 80, textAlignVertical: 'top', paddingTop: 10 }}
              value={bio}
              onChangeText={setBio}
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <Text style={styles.submitButtonText}>Continue to Trade & Skills →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: TRADE & SKILLS */}
        {currentStep === 2 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Primary Trade & Skills</Text>
            <Text style={styles.cardSub}>
              Select your primary engineering trade and the core service tags you provide.
            </Text>

            <Text style={styles.fieldLabel}>Select Primary Trade</Text>
            <View style={styles.tradesGrid}>
              {Object.entries(TRADES_CATALOG).map(([key, data]) => {
                const isSelected = selectedTradeKey === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.tradeCard, isSelected && styles.tradeCardActive]}
                    onPress={() => setSelectedTradeKey(key)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.tradeIcon}>{data.icon}</Text>
                    <Text
                      style={[styles.tradeLabel, isSelected && styles.tradeLabelActive]}
                    >
                      {data.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Specialized Skills</Text>
            <View style={styles.chipsRow}>
              {availableSkills.map((skill) => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <TouchableOpacity
                    key={skill}
                    style={[styles.skillChip, isSelected && styles.skillChipActive]}
                    onPress={() => handleToggleSkill(skill)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.skillChipText,
                        isSelected && styles.skillChipTextActive,
                      ]}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {skill}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <Text style={styles.submitButtonText}>Continue to Rates & Experience →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 3: RATES & EXPERIENCE */}
        {currentStep === 3 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rates & Availability</Text>
            <Text style={styles.cardSub}>
              Transparent pricing gives clients confidence when accepting your quotes.
            </Text>

            <Text style={styles.fieldLabel}>Years of Active Trade Experience</Text>
            <View style={styles.experienceRow}>
              {[2, 4, 6, 8, 12].map((yr) => (
                <TouchableOpacity
                  key={yr}
                  style={[
                    styles.expChip,
                    yearsOfExperience === yr && styles.expChipActive,
                  ]}
                  onPress={() => setYearsOfExperience(yr)}
                >
                  <Text
                    style={[
                      styles.expChipText,
                      yearsOfExperience === yr && styles.expChipTextActive,
                    ]}
                  >
                    {yr}+ yrs
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <AuthInput
              label="Standard Hourly Rate (₦)"
              placeholder="5000"
              keyboardType="numeric"
              value={hourlyRate}
              onChangeText={setHourlyRate}
              helperText={`Clients will see: From ${formatCurrency(parseFloat(hourlyRate) || 0)}`}
            />

            <View style={styles.toggleRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.toggleTitle}>24/7 Emergency Dispatch</Text>
                <Text style={styles.toggleSub}>
                  Receive high-priority emergency leads at night and on weekends.
                </Text>
              </View>
              <Switch
                value={isAvailable247}
                onValueChange={setIsAvailable247}
                trackColor={{ false: '#E7E5E4', true: '#34D399' }}
                thumbColor={isAvailable247 ? '#0E3524' : '#FFFFFF'}
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <Text style={styles.submitButtonText}>Continue to Workshop Location →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 4: WORKSHOP LOCATION & RADIUS */}
        {currentStep === 4 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Workshop Location & Radar</Text>
            <Text style={styles.cardSub}>
              We notify you when new repair requests appear within your active dispatch radius.
            </Text>

            <AuthInput
              label="State"
              value={state}
              onChangeText={setState}
              placeholder="e.g. Lagos"
            />

            <AuthInput
              label="LGA or City"
              value={lgaCity}
              onChangeText={setLgaCity}
              placeholder="e.g. Ikeja"
            />

            <AuthInput
              label="Workshop / Base Address"
              value={address}
              onChangeText={setAddress}
              placeholder="e.g. 12 Awolowo Way, Ikeja"
            />

            <Text style={styles.fieldLabel}>Dispatch Radius: {coverageRadiusKm} km</Text>
            <View style={styles.radiusRow}>
              {[5, 10, 15, 25, 40].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.radiusChip,
                    coverageRadiusKm === r && styles.radiusChipActive,
                  ]}
                  onPress={() => setCoverageRadiusKm(r)}
                >
                  <Text
                    style={[
                      styles.radiusChipText,
                      coverageRadiusKm === r && styles.radiusChipTextActive,
                    ]}
                  >
                    {r} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <Text style={styles.submitButtonText}>Review & Complete →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 5: REVIEW & LAUNCH */}
        {currentStep === 5 && (
          <View style={styles.card}>
            <View style={styles.badgeBanner}>
              <ShieldCheck size={18} color="#059669" />
              <Text style={styles.badgeBannerText}>READY FOR DISPATCH</Text>
            </View>

            <Text style={styles.cardTitle}>Review Profile & Launch</Text>
            <Text style={styles.cardSub}>
              Your professional artisan docket will now be listed in the Artifix marketplace.
            </Text>

            <View style={styles.reviewBox}>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Artisan:</Text>
                <Text style={styles.reviewValue}>{firstName} {lastName}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Business:</Text>
                <Text style={styles.reviewValue}>{businessName}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Trade:</Text>
                <Text style={styles.reviewValue}>
                  {TRADES_CATALOG[selectedTradeKey]?.label} ({yearsOfExperience}+ yrs)
                </Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Rate:</Text>
                <Text style={styles.reviewValue}>
                  {formatCurrency(parseFloat(hourlyRate) || 0)} / hr
                </Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Radar:</Text>
                <Text style={styles.reviewValue}>{coverageRadiusKm} km around {lgaCity}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
              onPress={handleNext}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#153e2d" />
                  <Text style={styles.submitButtonText}>Launching profile...</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>Launch My Artisan Profile 🚀</Text>
              )}
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
    backgroundColor: '#FAF7F0',
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
    marginBottom: 16,
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
  tradesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  tradeCard: {
    width: '48%',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E7E5E4',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    gap: 6,
  },
  tradeCardActive: {
    borderColor: '#0E3524',
    backgroundColor: '#ECFDF5',
  },
  tradeIcon: {
    fontSize: 24,
  },
  tradeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#44403C',
    textAlign: 'center',
  },
  tradeLabelActive: {
    color: '#064E3B',
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  skillChip: {
    backgroundColor: '#F5F5F4',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  skillChipActive: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  skillChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#44403C',
  },
  skillChipTextActive: {
    color: '#065F46',
    fontWeight: '700',
  },
  experienceRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  expChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    backgroundColor: '#F5F5F4',
    alignItems: 'center',
  },
  expChipActive: {
    backgroundColor: '#0E3524',
    borderColor: '#0E3524',
  },
  expChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#44403C',
  },
  expChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    marginVertical: 12,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 2,
  },
  toggleSub: {
    fontSize: 11,
    color: '#78716C',
    lineHeight: 15,
  },
  radiusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  radiusChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    backgroundColor: '#F5F5F4',
    alignItems: 'center',
  },
  radiusChipActive: {
    backgroundColor: '#0E3524',
    borderColor: '#0E3524',
  },
  radiusChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#44403C',
  },
  radiusChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  badgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  badgeBannerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  reviewBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    marginVertical: 12,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reviewLabel: {
    fontSize: 13,
    color: '#78716C',
    fontWeight: '500',
  },
  reviewValue: {
    fontSize: 13,
    color: '#1C1917',
    fontWeight: '700',
  },
  submitButton: {
    width: '100%',
    height: 52,
    borderRadius: 9999,
    backgroundColor: '#CBF7D2',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
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
