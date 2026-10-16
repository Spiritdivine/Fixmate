import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { ProposalService } from '../../services/proposal.service';
import { JobService } from '../../services/job.service';
import { JobRecord } from '../../types/api-contracts';
import { queryClient } from '../../lib/query-client';

interface JobDetailsAndBidScreenProps {
  jobId?: string;
  job?: JobRecord;
  onBack?: () => void;
  onSubmitSuccess?: () => void;
}

export const JobDetailsAndBidScreen: React.FC<JobDetailsAndBidScreenProps> = ({
  jobId,
  job: passedJob,
  onBack,
  onSubmitSuccess,
}) => {
  const [fetchedJob, setFetchedJob] = useState<JobRecord | null>(null);
  const [loadingJob, setLoadingJob] = useState<boolean>(!passedJob && !!jobId);

  React.useEffect(() => {
    if (passedJob) {
      setFetchedJob(passedJob);
      return;
    }
    if (!jobId) return;

    let isMounted = true;
    (async () => {
      try {
        setLoadingJob(true);
        const data = await JobService.getById(jobId);
        if (isMounted) setFetchedJob(data);
      } catch (err) {
        console.warn('Failed to load job details:', err);
      } finally {
        if (isMounted) setLoadingJob(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [jobId, passedJob]);

  const activeJob = fetchedJob || passedJob;
  const initialBudget = activeJob?.budget || 30000;
  const [quoteAmount, setQuoteAmount] = useState<number>(initialBudget);
  const [laborFee, setLaborFee] = useState<number>(Math.round(initialBudget * 0.7));
  const [materialsCost, setMaterialsCost] = useState<number>(Math.round(initialBudget * 0.3));
  const [timelineDays, setTimelineDays] = useState<number>(1);
  const [pitchNote, setPitchNote] = useState<string>(
    'Professional artisan with proven track record in diagnosing and fixing this scope. Available to start work immediately with quality tools and parts.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (activeJob?.budget && quoteAmount === 30000) {
      setQuoteAmount(activeJob.budget);
      setLaborFee(Math.round(activeJob.budget * 0.7));
      setMaterialsCost(Math.round(activeJob.budget * 0.3));
    }
  }, [activeJob?.budget]);

  const bumpQuote = (amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuoteAmount((prev) => prev + amount);
    setLaborFee((prev) => prev + amount);
  };

  const handleSubmit = async () => {
    const activeJobId = jobId || activeJob?.id;
    if (!activeJobId) {
      Alert.alert('Error', 'Invalid job selected. Please select a valid job from the marketplace.');
      return;
    }

    if (quoteAmount <= 0) {
      Alert.alert('Invalid Bid', 'Please enter a valid bid amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await ProposalService.submit({
        jobId: activeJobId,
        amount: quoteAmount,
        durationDays: timelineDays,
        coverLetter: pitchNote,
        milestones: [
          {
            title: 'Milestone 1: Parts & Work Commencement',
            amount: materialsCost,
          },
          {
            title: 'Milestone 2: Completion & Testing',
            amount: laborFee,
          },
        ],
      });
      await queryClient.invalidateQueries({ queryKey: ['my-proposals'] });
      await queryClient.invalidateQueries({ queryKey: ['marketplace-jobs'] });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Proposal Submitted',
        `Your bid of ${formatCurrency(quoteAmount)} has been submitted to the client. You will receive an instant push notification when accepted.`,
        [{ text: 'View My Bids', onPress: onSubmitSuccess }]
      );
    } catch (err: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errMsg = err?.response?.data?.message || err?.message || 'Could not submit proposal. Please try again.';
      Alert.alert('Submission Error', errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clientProfile = (activeJob as any)?.client?.clientProfile;
  const clientName = clientProfile?.firstName
    ? `${clientProfile.firstName} ${clientProfile.lastName || ''}`.trim()
    : 'Verified Client';

  const jobUrgency = activeJob?.urgency || 'HIGH';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
          <Text style={styles.backChevron}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details & Bid</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Urgency Badge & Title */}
        <View style={styles.urgencyBadge}>
          <Text style={styles.urgencyZap}>⚡</Text>
          <Text style={styles.urgencyText}>
            {jobUrgency === 'EMERGENCY'
              ? 'Emergency Dispatch Lead'
              : jobUrgency === 'HIGH'
              ? 'High Priority Request'
              : 'Verified Standard Scope'}
          </Text>
        </View>

        <Text style={styles.jobTitle}>{activeJob?.title || 'Certified Work Order'}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaLocation}>📍 {activeJob?.location || 'Lagos, Nigeria'}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaTrade}>⚡ {activeJob?.trade || 'Artisan Service'}</Text>
        </View>

        {/* Client Trust Card */}
        <View style={styles.clientCard}>
          <Image
            source={{
              uri: (activeJob as any)?.client?.avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
            }}
            style={styles.clientAvatar}
          />
          <View style={styles.clientInfo}>
            <View style={styles.clientNameRow}>
              <Text style={styles.clientName}>{clientName}</Text>
              <View style={styles.verifiedPill}>
                <Text style={styles.verifiedCheck}>✓</Text>
                <Text style={styles.verifiedText}>Verified Client</Text>
              </View>
            </View>
            <Text style={styles.clientRating}>★ 4.9 (Verified Hirer)</Text>
          </View>
        </View>

        {/* Job Scope Description */}
        <View style={styles.scopeCard}>
          <Text style={styles.sectionHeading}>Job Description</Text>
          <Text style={styles.scopeBody}>
            {activeJob?.description ||
              'Client requested an experienced specialist for diagnostic inspection and repair. Review the budget below and submit your competitive bid.'}
          </Text>
        </View>

        {/* Client Budget Context */}
        <View style={styles.budgetCard}>
          <View style={styles.budgetLeft}>
            <Text style={styles.budgetHeading}>Client's Budget</Text>
            <Text style={styles.budgetAmount}>₦28,000</Text>
          </View>
          <View style={styles.escrowLockedPill}>
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={styles.escrowLockedText}>100% Escrow Funded</Text>
          </View>
        </View>

        {/* PROPOSAL BIDDING FORM */}
        <View style={styles.bidFormCard}>
          <Text style={styles.bidFormTitle}>Submit Your Proposal</Text>

          {/* Quote Input */}
          <Text style={styles.inputLabel}>Total Bid Amount (NGN)</Text>
          <View style={styles.quoteInputContainer}>
            <Text style={styles.nairaPrefix}>₦</Text>
            <TextInput
              style={styles.quoteInput}
              keyboardType="numeric"
              value={String(quoteAmount)}
              onChangeText={(val) => {
                const num = parseInt(val, 10) || 0;
                setQuoteAmount(num);
              }}
            />
          </View>

          {/* Quick-Bump Chips */}
          <View style={styles.bumpChipsRow}>
            <TouchableOpacity onPress={() => bumpQuote(2000)} style={styles.bumpChip}>
              <Text style={styles.bumpText}>+₦2,000</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => bumpQuote(5000)} style={styles.bumpChip}>
              <Text style={styles.bumpText}>+₦5,000</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => bumpQuote(10000)} style={styles.bumpChip}>
              <Text style={styles.bumpText}>+₦10,000</Text>
            </TouchableOpacity>
          </View>

          {/* Fee Breakdown: Labor vs Materials */}
          <View style={styles.feeBreakdown}>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Labor Fee:</Text>
              <Text style={styles.feeValue}>{formatCurrency(laborFee)}</Text>
            </View>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Estimated Materials / Parts:</Text>
              <Text style={styles.feeValue}>{formatCurrency(materialsCost)}</Text>
            </View>
          </View>

          {/* Estimated Completion Timeline */}
          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Estimated Time to Finish</Text>
          <View style={styles.timelineRow}>
            {[1, 2, 3].map((days) => (
              <TouchableOpacity
                key={days}
                onPress={() => setTimelineDays(days)}
                style={[
                  styles.timelinePill,
                  timelineDays === days && styles.timelinePillActive,
                ]}
              >
                <Text
                  style={[
                    styles.timelineText,
                    timelineDays === days && styles.timelineTextActive,
                  ]}
                >
                  {days} {days === 1 ? 'Day' : 'Days'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cover Pitch */}
          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Pitch to Client</Text>
          <TextInput
            style={styles.pitchInput}
            multiline
            numberOfLines={3}
            value={pitchNote}
            onChangeText={setPitchNote}
          />
        </View>
      </ScrollView>

      {/* Sticky Bottom Submit Button */}
      <View style={styles.stickyFooter}>
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={isSubmitting}
          onPress={handleSubmit}
          style={styles.submitButton}
        >
          <Text style={styles.submitButtonText}>
            Submit Proposal ({formatCurrency(quoteAmount)})
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
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: {
    fontSize: 22,
    color: colors.neutral[900],
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: typography.size.base,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  placeholder: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: 110,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    marginTop: spacing.base,
    gap: 4,
  },
  urgencyZap: {
    fontSize: 12,
  },
  urgencyText: {
    color: '#DC2626',
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
  },
  jobTitle: {
    fontSize: typography.size.xl,
    fontWeight: '900',
    color: colors.neutral[900],
    marginTop: 8,
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  metaLocation: {
    fontSize: typography.size.xs + 1,
    color: colors.neutral[600],
  },
  metaDot: {
    color: colors.neutral[400],
  },
  metaTrade: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: colors.brand.emeraldDark,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: radius.xl,
    padding: spacing.md,
    marginTop: spacing.base,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  clientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E7EB',
  },
  clientInfo: {
    flex: 1,
  },
  clientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clientName: {
    fontSize: typography.size.sm + 1,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    gap: 3,
  },
  verifiedCheck: {
    color: colors.brand.emerald,
    fontSize: 9,
    fontWeight: '900',
  },
  verifiedText: {
    color: colors.brand.emeraldDark,
    fontSize: 9,
    fontWeight: '700',
  },
  clientRating: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  scopeCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.xl,
    padding: spacing.base,
    marginTop: spacing.base,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeading: {
    fontSize: typography.size.sm,
    fontWeight: '800',
    color: colors.neutral[900],
    marginBottom: 6,
  },
  scopeBody: {
    fontSize: typography.size.sm,
    color: colors.neutral[700],
    lineHeight: 20,
  },
  budgetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderRadius: radius.xl,
    padding: spacing.base,
    marginTop: spacing.base,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  budgetLeft: {},
  budgetHeading: {
    fontSize: typography.size.xs,
    color: colors.neutral[600],
  },
  budgetAmount: {
    fontSize: typography.size.lg,
    fontWeight: '900',
    color: colors.brand.forest,
    marginTop: 2,
  },
  escrowLockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 4,
  },
  lockIcon: {
    fontSize: 10,
  },
  escrowLockedText: {
    color: colors.brand.emeraldDark,
    fontSize: 10,
    fontWeight: '700',
  },
  bidFormCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.base,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.sm,
  },
  bidFormTitle: {
    fontSize: typography.size.base,
    fontWeight: '800',
    color: colors.neutral[900],
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: colors.neutral[700],
    marginBottom: 6,
  },
  quoteInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.brand.forest,
    paddingHorizontal: 12,
  },
  nairaPrefix: {
    fontSize: typography.size.lg,
    fontWeight: '800',
    color: colors.brand.forest,
    marginRight: 6,
  },
  quoteInput: {
    flex: 1,
    fontSize: typography.size.lg,
    fontWeight: '800',
    color: colors.brand.forest,
    paddingVertical: 10,
  },
  bumpChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  bumpChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  bumpText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  feeBreakdown: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    gap: 4,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  feeLabel: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  feeValue: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timelinePill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timelinePillActive: {
    backgroundColor: colors.brand.forest,
    borderColor: colors.brand.forest,
  },
  timelineText: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  timelineTextActive: {
    color: '#FFFFFF',
  },
  pitchInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 10,
    fontSize: typography.size.xs + 1,
    color: colors.neutral[800],
    lineHeight: 18,
    textAlignVertical: 'top',
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
  submitButton: {
    backgroundColor: colors.brand.emerald,
    paddingVertical: 15,
    borderRadius: radius.full,
    alignItems: 'center',
    ...shadows.base,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: typography.size.sm + 1,
    fontWeight: '800',
  },
});
