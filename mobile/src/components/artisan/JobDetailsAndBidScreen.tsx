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
  Modal,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { ProposalService } from '../../services/proposal.service';
import { JobService } from '../../services/job.service';
import { JobRecord } from '../../types/api-contracts';
import { queryClient } from '../../lib/query-client';
import { useArtisanProposals } from '../../hooks';

interface JobDetailsAndBidScreenProps {
  jobId?: string;
  job?: JobRecord;
  onBack?: () => void;
  onSubmitSuccess?: () => void;
}

interface MilestoneDraft {
  id: string;
  title: string;
  amount: number;
  estimatedDays: number;
}

export const JobDetailsAndBidScreen: React.FC<JobDetailsAndBidScreenProps> = ({
  jobId,
  job: passedJob,
  onBack,
  onSubmitSuccess,
}) => {
  const [fetchedJob, setFetchedJob] = useState<JobRecord | null>(null);
  const [loadingJob, setLoadingJob] = useState<boolean>(!passedJob && !!jobId);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  React.useEffect(() => {
    if (passedJob && !fetchedJob) {
      setFetchedJob(passedJob);
    }
    if (!jobId) return;

    let isMounted = true;
    (async () => {
      try {
        if (!passedJob) setLoadingJob(true);
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
  }, [jobId]);

  const activeJob = fetchedJob || passedJob;
  const initialBudget = Number(activeJob?.budget ?? (activeJob as any)?.budgetMax ?? 30000);

  const [milestones, setMilestones] = useState<MilestoneDraft[]>([
    {
      id: 'm1',
      title: 'Milestone 1: Diagnostics & Mobilization',
      amount: Math.round(initialBudget * 0.4),
      estimatedDays: 1,
    },
    {
      id: 'm2',
      title: 'Milestone 2: Execution & Quality Handover',
      amount: Math.round(initialBudget * 0.6),
      estimatedDays: 1,
    },
  ]);

  const [timelineDays, setTimelineDays] = useState<number>(2);
  const [pitchNote, setPitchNote] = useState<string>(
    'Certified artisan with proven experience handling this specific repair. Available to inspect site and complete scope with guaranteed quality.'
  );
  const { submitProposalMutation } = useArtisanProposals();
  const isSubmitting = submitProposalMutation.isPending;

  const quoteAmount = milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

  React.useEffect(() => {
    if (activeJob?.budget) {
      const b = Number(activeJob.budget);
      setMilestones([
        {
          id: 'm1',
          title: 'Milestone 1: Diagnostics & Mobilization',
          amount: Math.round(b * 0.4),
          estimatedDays: 1,
        },
        {
          id: 'm2',
          title: 'Milestone 2: Execution & Quality Handover',
          amount: Math.round(b * 0.6),
          estimatedDays: 1,
        },
      ]);
    }
  }, [activeJob?.budget]);

  const bumpQuote = (increment: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMilestones((prev) => {
      if (prev.length === 0) return prev;
      const lastIdx = prev.length - 1;
      return prev.map((m, idx) =>
        idx === lastIdx ? { ...m, amount: Math.max(0, m.amount + increment) } : m
      );
    });
  };

  const handleUpdateMilestone = (id: string, field: 'title' | 'amount' | 'estimatedDays', value: any) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleAddMilestone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newId = `m${Date.now()}`;
    const nextOrder = milestones.length + 1;
    setMilestones((prev) => [
      ...prev,
      {
        id: newId,
        title: `Milestone ${nextOrder}: Finishing Stage`,
        amount: 5000,
        estimatedDays: 1,
      },
    ]);
  };

  const handleRemoveMilestone = (id: string) => {
    if (milestones.length <= 1) {
      Alert.alert('Notice', 'At least one milestone is required for your bid proposal.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSubmit = async () => {
    const activeJobId = jobId || activeJob?.id;
    if (!activeJobId) {
      Alert.alert('Error', 'Invalid job selected. Please select a valid job from the marketplace.');
      return;
    }

    if (quoteAmount <= 0) {
      Alert.alert('Invalid Bid', 'Please ensure your milestones total a positive bid amount.');
      return;
    }

    if (!pitchNote.trim() || pitchNote.trim().length < 20) {
      Alert.alert('Pitch Note Required', 'Please provide a cover letter pitch of at least 20 characters.');
      return;
    }

    submitProposalMutation.mutate(
      {
        jobId: activeJobId,
        bidAmount: quoteAmount,
        estimatedDays: timelineDays,
        coverLetter: pitchNote.trim(),
        milestones: milestones.map((m, idx) => ({
          stepOrder: idx + 1,
          title: m.title.trim() || `Milestone ${idx + 1}`,
          amount: Number(m.amount),
          estimatedDays: Number(m.estimatedDays || 1),
        })),
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['marketplace-jobs'] });
        },
        onError: (err: any) => {
          const errMsg = err?.response?.data?.message || err?.message || 'Could not submit proposal. Please try again.';
          Alert.alert('Submission Error', errMsg);
        },
      }
    );

    // Optimistically transition immediately (<16ms)
    onSubmitSuccess?.();
  };

  const clientProfile = (activeJob as any)?.client?.clientProfile;
  const clientName = clientProfile?.firstName
    ? `${clientProfile.firstName} ${clientProfile.lastName || ''}`.trim()
    : 'Verified Client';

  const jobUrgency = activeJob?.urgency || 'HIGH';

  if (!loadingJob && !activeJob) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
            <Text style={styles.backChevron}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Job Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>Job No Longer Available</Text>
          <Text style={styles.emptySub}>
            This repair request has either been assigned, cancelled by the client, or expired.
          </Text>
          <TouchableOpacity onPress={onBack} style={styles.emptyBackBtn} activeOpacity={0.85}>
            <Text style={styles.emptyBackBtnText}>Back to Marketplace</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
              : jobUrgency === 'URGENT' || (jobUrgency as string) === 'HIGH'
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

          {/* Client Attachments / Defect Photos */}
          {activeJob?.attachments && activeJob.attachments.length > 0 && (
            <View style={{ marginTop: 14 }}>
              <Text style={[styles.sectionHeading, { fontSize: 12, marginBottom: 8 }]}>
                Site & Defect Photos ({activeJob.attachments.length})
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {activeJob.attachments.map((att: any, idx: number) => {
                  const imgUri = att.fileUrl || att.url;
                  if (!imgUri) return null;
                  return (
                    <TouchableOpacity
                      key={att.id || idx}
                      activeOpacity={0.8}
                      onPress={() => setPreviewImageUrl(imgUri)}
                      style={styles.attachmentThumbBox}
                    >
                      <Image source={{ uri: imgUri }} style={styles.attachmentThumb} resizeMode="cover" />
                      <View style={styles.zoomBadge}>
                        <Text style={styles.zoomIcon}>🔍</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Client Budget Context */}
        <View style={styles.budgetCard}>
          <View style={styles.budgetLeft}>
            <Text style={styles.budgetHeading}>Client's Stated Budget</Text>
            <Text style={styles.budgetAmount}>
              {(activeJob as any)?.budgetMin && (activeJob as any)?.budgetMax && (activeJob as any).budgetMin !== (activeJob as any).budgetMax
                ? `${formatCurrency(Number((activeJob as any).budgetMin))} - ${formatCurrency(Number((activeJob as any).budgetMax))}`
                : initialBudget > 0
                ? formatCurrency(initialBudget)
                : 'Negotiable'}
            </Text>
          </View>
          <View style={styles.escrowLockedPill}>
            <Text style={styles.lockIcon}>🛡️</Text>
            <Text style={styles.escrowLockedText}>Escrow Protected Upon Hire</Text>
          </View>
        </View>

        {/* PROPOSAL BIDDING FORM */}
        <View style={styles.bidFormCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={styles.bidFormTitle}>Milestone Breakdown & Bid</Text>
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeText}>Total: {formatCurrency(quoteAmount)}</Text>
            </View>
          </View>

          {/* Quick-Bump Chips */}
          <Text style={styles.inputLabel}>Quick Budget Adjustment</Text>
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

          {/* Dynamic Milestones List */}
          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Scope Milestones ({milestones.length})</Text>
          <View style={styles.milestonesList}>
            {milestones.map((m, idx) => (
              <View key={m.id} style={styles.milestoneCard}>
                <View style={styles.milestoneCardHeader}>
                  <Text style={styles.milestoneOrderBadge}>#{idx + 1}</Text>
                  <TextInput
                    style={styles.milestoneTitleInput}
                    value={m.title}
                    onChangeText={(val) => handleUpdateMilestone(m.id, 'title', val)}
                    placeholder="Milestone title..."
                  />
                  {milestones.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveMilestone(m.id)}
                      style={styles.removeMilestoneBtn}
                    >
                      <Text style={styles.removeMilestoneText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.milestoneInputsRow}>
                  <View style={{ flex: 1.2 }}>
                    <Text style={styles.miniLabel}>Payout (₦)</Text>
                    <View style={styles.amountInputWrap}>
                      <Text style={styles.miniNaira}>₦</Text>
                      <TextInput
                        style={styles.amountInput}
                        keyboardType="numeric"
                        value={String(m.amount)}
                        onChangeText={(val) => {
                          const num = parseInt(val, 10) || 0;
                          handleUpdateMilestone(m.id, 'amount', num);
                        }}
                      />
                    </View>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.miniLabel}>Timeline (Days)</Text>
                    <View style={styles.daysInputWrap}>
                      <TextInput
                        style={styles.daysInput}
                        keyboardType="numeric"
                        value={String(m.estimatedDays)}
                        onChangeText={(val) => {
                          const num = parseInt(val, 10) || 1;
                          handleUpdateMilestone(m.id, 'estimatedDays', num);
                        }}
                      />
                      <Text style={styles.daysSuffix}>d</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}

            <TouchableOpacity onPress={handleAddMilestone} style={styles.addMilestoneBtn} activeOpacity={0.7}>
              <Text style={styles.addMilestoneBtnText}>+ Add Another Milestone</Text>
            </TouchableOpacity>
          </View>

          {/* Overall Estimated Timeline */}
          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Overall Completion Turnaround</Text>
          <View style={styles.timelineRow}>
            {[1, 2, 3, 5, 7].map((days) => (
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
                  {days}d
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cover Pitch */}
          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Pitch / Method Statement to Client</Text>
          <TextInput
            style={styles.pitchInput}
            multiline
            numberOfLines={4}
            value={pitchNote}
            onChangeText={setPitchNote}
            placeholder="Explain why you are the best fit for this repair..."
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
            {isSubmitting ? 'Submitting Bid...' : `Submit Proposal (${formatCurrency(quoteAmount)})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Full Image Preview Modal */}
      {previewImageUrl && (
        <Modal visible={!!previewImageUrl} transparent animationType="fade">
          <View style={styles.imageModalBackdrop}>
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setPreviewImageUrl(null)}>
              <Text style={styles.closeModalText}>✕ Close</Text>
            </TouchableOpacity>
            <Image source={{ uri: previewImageUrl }} style={styles.fullModalImage} resizeMode="contain" />
          </View>
        </Modal>
      )}
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
  attachmentThumbBox: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E5E7EB',
  },
  attachmentThumb: {
    width: '100%',
    height: '100%',
  },
  zoomBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radius.full,
    padding: 3,
  },
  zoomIcon: {
    fontSize: 10,
  },
  totalBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  totalBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.brand.forest,
  },
  milestonesList: {
    gap: 10,
    marginTop: 6,
  },
  milestoneCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.lg,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  milestoneCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  milestoneOrderBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.brand.forest,
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  milestoneTitleInput: {
    flex: 1,
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: colors.neutral[900],
    paddingVertical: 4,
  },
  removeMilestoneBtn: {
    padding: 4,
  },
  removeMilestoneText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  milestoneInputsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  miniLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.neutral[500],
    marginBottom: 3,
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: radius.md,
    paddingHorizontal: 8,
  },
  miniNaira: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.neutral[700],
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutral[900],
    paddingVertical: 6,
  },
  daysInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: radius.md,
    paddingHorizontal: 8,
  },
  daysInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutral[900],
    paddingVertical: 6,
  },
  daysSuffix: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[500],
  },
  addMilestoneBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.brand.forest,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  addMilestoneBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.brand.forest,
  },
  imageModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  closeModalBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    zIndex: 10,
  },
  closeModalText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  fullModalImage: {
    width: '100%',
    height: '80%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: '800',
    color: colors.neutral[900],
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  emptyBackBtn: {
    backgroundColor: colors.brand.forest,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.full,
  },
  emptyBackBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
