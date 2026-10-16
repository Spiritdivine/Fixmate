import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { JobService } from '../../services/job.service';
import { JobUrgency } from '../../types/api-contracts';
import { LocationProvider } from '../../lib/location-provider';

interface PostJobWizardScreenProps {
  onBack?: () => void;
  onJobPublished?: (jobId: string) => void;
  initialData?: {
    title?: string;
    trade?: string;
    budget?: number;
    description?: string;
  };
}

export const PostJobWizardScreen: React.FC<PostJobWizardScreenProps> = ({
  onBack,
  onJobPublished,
  initialData,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State
  const [trade, setTrade] = useState<string>(initialData?.trade || 'Plumbing');
  const [title, setTitle] = useState<string>(initialData?.title || '');
  const [description, setDescription] = useState<string>(initialData?.description || '');
  const [locationName, setLocationName] = useState<string>('Detecting location...');
  const [coords, setCoords] = useState<{ latitude?: number; longitude?: number }>({});
  const [locationSource, setLocationSource] = useState<string | null>(null);
  const [detectingLocation, setDetectingLocation] = useState<boolean>(false);
  const [urgency, setUrgency] = useState<'NORMAL' | 'URGENT' | 'EMERGENCY'>('NORMAL');
  const [budgetAmount, setBudgetAmount] = useState<string>(
    initialData?.budget ? String(initialData.budget) : ''
  );

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const loc = await LocationProvider.getCurrentLocation();
        if (isMounted && loc.addressName) {
          setLocationName(loc.addressName);
          setCoords({ latitude: loc.latitude, longitude: loc.longitude });
          setLocationSource(loc.source || 'AUTO');
        }
      } catch (e) {
        if (isMounted) setLocationName('Ikeja, Lagos State');
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDetectGPS = async () => {
    try {
      setDetectingLocation(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const loc = await LocationProvider.getCurrentLocation();
      if (loc.addressName) {
        setLocationName(loc.addressName);
        setCoords({ latitude: loc.latitude, longitude: loc.longitude });
        setLocationSource(loc.source || 'GPS');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert('Location Notice', 'Could not lock GPS signal. You can type your address manually.');
    } finally {
      setDetectingLocation(false);
    }
  };


  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep === 1) {
      if (!title.trim()) {
        Alert.alert('Job Title Required', 'Please provide a clear title describing what needs repair.');
        return;
      }
      if (!description.trim()) {
        Alert.alert('Description Required', 'Please give a short explanation of the fault so artisans can prepare quotes.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!locationName.trim()) {
        Alert.alert('Location Required', 'Please enter the repair address or area.');
        return;
      }
      setCurrentStep(3);
    } else {
      const budgetNum = parseFloat(budgetAmount);
      if (!budgetNum || budgetNum <= 0) {
        Alert.alert('Budget Required', 'Please enter your estimated budget for this repair.');
        return;
      }
      handlePublish();
    }
  };

  const handlePublish = async () => {
    const budgetNum = parseFloat(budgetAmount);
    if (!budgetNum || budgetNum <= 0) {
      Alert.alert('Invalid Budget', 'Please provide a valid budget amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await JobService.create({
        title: title.trim(),
        description: description.trim(),
        trade,
        location: locationName.trim(),
        latitude: coords.latitude,
        longitude: coords.longitude,
        budget: budgetNum,
        budgetType: 'FIXED',
        urgency: urgency as JobUrgency,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (Platform.OS === 'web') {
        if (created?.id) {
          onJobPublished?.(created.id);
        } else {
          onBack?.();
        }
      } else {
        Alert.alert(
          'Job Request Broadcasted!',
          'Your repair request is live. Verified artisans nearby will submit quotes with milestone breakdowns.',
          [
            {
              text: 'View Job Details',
              onPress: () => {
                if (created?.id) {
                  onJobPublished?.(created.id);
                } else {
                  onBack?.();
                }
              },
            },
          ]
        );
      }
    } catch (err: unknown) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = apiErr.response?.data?.message || apiErr.message || 'Failed to post job. Please check your connection and try again.';
      Alert.alert('Could Not Post Job', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={currentStep > 1 ? () => setCurrentStep((prev) => prev - 1) : onBack}
          activeOpacity={0.7}
          style={styles.backButton}
        >
          <Text style={styles.backChevron}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post a Job Request</Text>
        <Text style={styles.stepIndicatorText}>Step {currentStep} of 3</Text>
      </View>

      {/* Progress Track */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${(currentStep / 3) * 100}%` },
          ]}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* STEP 1: SERVICE TRADE & DESCRIPTION */}
        {currentStep === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepHeading}>What needs fixing?</Text>
            <Text style={styles.stepSubtitle}>
              Select the service trade and describe the problem in detail.
            </Text>

            {/* Trade Selector */}
            <Text style={styles.inputLabel}>Trade Category</Text>
            <View style={styles.tradeGrid}>
              {['Plumbing', 'Electrical', 'Carpentry', 'Solar & Inverter', 'AC Repair', 'Painting'].map(
                (item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setTrade(item)}
                    style={[styles.tradePill, trade === item && styles.tradePillActive]}
                  >
                    <Text style={[styles.tradePillText, trade === item && styles.tradePillTextActive]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            {/* Title */}
            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Job Title</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Inverter battery not holding charge"
            />

            {/* Description */}
            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Detailed Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe symptoms, when it started, and materials on site..."
            />
          </View>
        )}

        {/* STEP 2: LOCATION & URGENCY */}
        {currentStep === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepHeading}>Location & Timing</Text>
            <Text style={styles.stepSubtitle}>
              Set the repair address and how soon you need the artisan on site.
            </Text>

            {/* Address */}
            <View style={styles.locationHeaderRow}>
              <Text style={styles.inputLabel}>Repair Address</Text>
              <TouchableOpacity
                onPress={handleDetectGPS}
                disabled={detectingLocation}
                style={styles.gpsDetectBtn}
                activeOpacity={0.7}
              >
                {detectingLocation ? (
                  <ActivityIndicator size="small" color={colors.brand.forest} />
                ) : (
                  <>
                    <Text style={styles.gpsIconText}>🎯</Text>
                    <Text style={styles.gpsDetectText}>Use My GPS</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.locationInputBox}>
              <Text style={styles.pinEmoji}>📍</Text>
              <TextInput
                style={styles.locationInput}
                value={locationName}
                onChangeText={setLocationName}
                placeholder="Enter street or neighborhood..."
              />
            </View>

            {locationSource && (
              <View style={styles.locationSourceBadge}>
                <View style={styles.locationSourceDot} />
                <Text style={styles.locationSourceText}>
                  {locationSource === 'GPS'
                    ? 'Precise GPS locked'
                    : locationSource === 'PROFILE'
                    ? 'Matched from saved profile address'
                    : locationSource === 'IP_GEOIP'
                    ? 'Detected via regional network'
                    : 'Default Lagos anchor'}
                </Text>
              </View>
            )}

            {/* Urgency */}
            <Text style={[styles.inputLabel, { marginTop: 20 }]}>Urgency Level</Text>
            <View style={styles.urgencyCol}>
              {[
                { key: 'EMERGENCY', label: '⚡ Emergency (Arrive ASAP within 1h)', sub: 'Fastest bids from nearest online artisans' },
                { key: 'URGENT', label: '🔥 Urgent (Today)', sub: 'Repair needed before end of day' },
                { key: 'NORMAL', label: '📅 Normal (Next Few Days)', sub: 'Schedule at convenient time' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => setUrgency(item.key as any)}
                  style={[styles.urgencyCard, urgency === item.key && styles.urgencyCardActive]}
                >
                  <Text style={[styles.urgencyLabel, urgency === item.key && styles.urgencyLabelActive]}>
                    {item.label}
                  </Text>
                  <Text style={styles.urgencySub}>{item.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* STEP 3: BUDGET & ESCROW SETUP */}
        {currentStep === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepHeading}>Budget & Escrow Protection</Text>
            <Text style={styles.stepSubtitle}>
              Set your target budget. Funds will only be locked in escrow when you approve a bid.
            </Text>

            {/* Budget Input */}
            <Text style={styles.inputLabel}>Target Budget (NGN)</Text>
            <View style={styles.budgetInputBox}>
              <Text style={styles.nairaPrefix}>₦</Text>
              <TextInput
                style={styles.budgetInput}
                keyboardType="numeric"
                value={budgetAmount}
                onChangeText={setBudgetAmount}
              />
            </View>

            {/* Escrow Guarantee Notice */}
            <View style={styles.escrowNoticeCard}>
              <Text style={styles.shieldEmoji}>🛡️</Text>
              <View style={styles.escrowTextCol}>
                <Text style={styles.escrowNoticeTitle}>Zero-Trust Smart Escrow</Text>
                <Text style={styles.escrowNoticeSub}>
                  You do not pay anything right now. Once artisans submit proposals, you select your
                  preferred bid and fund the first milestone into secure escrow.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Next / Publish Button */}
      <View style={styles.stickyFooter}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleNext}
          style={styles.nextBtn}
        >
          <Text style={styles.nextBtnText}>
            {currentStep === 3 ? 'Publish Job to Marketplace ›' : 'Continue to Next Step ›'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: {
    fontSize: 20,
    color: colors.neutral[900],
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: typography.size.base + 2,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  stepIndicatorText: {
    fontSize: typography.size.xs,
    color: colors.brand.emeraldDark,
    fontWeight: '700',
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#F3F4F6',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.brand.emerald,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: 100,
  },
  stepContainer: {
    marginTop: spacing.base,
  },
  stepHeading: {
    fontSize: typography.size.xl,
    fontWeight: '900',
    color: colors.neutral[900],
  },
  stepSubtitle: {
    fontSize: typography.size.xs + 1,
    color: colors.neutral[500],
    marginTop: 4,
    marginBottom: spacing.base,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: colors.neutral[700],
    marginBottom: 6,
  },
  tradeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tradePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tradePillActive: {
    backgroundColor: colors.brand.forest,
    borderColor: colors.brand.forest,
  },
  tradePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  tradePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: typography.size.sm,
    color: colors.neutral[900],
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  gpsDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 4,
  },
  gpsIconText: {
    fontSize: 11,
  },
  gpsDetectText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand.forest,
  },
  locationSourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  locationSourceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand.forest,
  },
  locationSourceText: {
    fontSize: 10,
    color: colors.neutral[500],
    fontWeight: '500',
  },
  locationInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
  },
  pinEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  locationInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: typography.size.sm,
    color: colors.neutral[900],
  },
  urgencyCol: {
    gap: 10,
  },
  urgencyCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  urgencyCardActive: {
    borderColor: colors.brand.forest,
    backgroundColor: '#F0FDF4',
  },
  urgencyLabel: {
    fontSize: typography.size.sm,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  urgencyLabelActive: {
    color: colors.brand.forest,
  },
  urgencySub: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
  budgetInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.brand.forest,
    paddingHorizontal: 14,
  },
  nairaPrefix: {
    fontSize: typography.size.xl,
    fontWeight: '900',
    color: colors.brand.forest,
    marginRight: 6,
  },
  budgetInput: {
    flex: 1,
    fontSize: typography.size.xl,
    fontWeight: '900',
    color: colors.brand.forest,
    paddingVertical: 12,
  },
  escrowNoticeCard: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    padding: spacing.base,
    borderRadius: radius.xl,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 12,
  },
  shieldEmoji: {
    fontSize: 24,
  },
  escrowTextCol: {
    flex: 1,
  },
  escrowNoticeTitle: {
    fontSize: typography.size.xs + 1,
    fontWeight: '800',
    color: colors.brand.forest,
  },
  escrowNoticeSub: {
    fontSize: 11,
    color: colors.neutral[600],
    marginTop: 2,
    lineHeight: 16,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: '#F3F4F6',
  },
  nextBtn: {
    backgroundColor: colors.brand.forest,
    paddingVertical: 14,
    borderRadius: radius.full,
    alignItems: 'center',
    ...shadows.base,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: typography.size.sm + 1,
    fontWeight: '800',
  },
});
