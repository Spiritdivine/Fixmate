import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { ProposalService } from '../../services/proposal.service';
import { JobRecord } from '../../types/api-contracts';

export interface ProposalItem {
  id: string;
  artisanId: string;
  artisanName: string;
  avatarUrl?: string;
  rating: number;
  reviewsCount: number;
  trade: string;
  distance: string;
  bidAmount: number;
  laborAmount: number;
  partsAmount: number;
  duration: string;
  coverNote: string;
  milestonesCount: number;
  isVerified: boolean;
  timeAgo: string;
}

import { JobService } from '../../services/job.service';

interface JobDetailsAndProposalsScreenProps {
  jobId?: string;
  job?: JobRecord;
  onBack?: () => void;
  onSelectProposal?: (proposal: ProposalItem) => void;
  onViewArtisan?: (artisanId: string) => void;
  onChatWithArtisan?: (artisanId: string) => void;
}

export const JobDetailsAndProposalsScreen: React.FC<JobDetailsAndProposalsScreenProps> = ({
  jobId,
  job: initialJob,
  onBack,
  onSelectProposal,
  onViewArtisan,
  onChatWithArtisan,
}) => {
  const [activeTab, setActiveTab] = useState<'PROPOSALS' | 'DETAILS'>('PROPOSALS');
  const [isDeletingJob, setIsDeletingJob] = useState(false);
  const [rejectingProposalId, setRejectingProposalId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleDeleteJob = () => {
    const targetJobId = activeJob?.id || jobId;
    if (!targetJobId) return;
    Alert.alert(
      'Cancel Job Request',
      'Are you sure you want to cancel this job request? This will close the job and dismiss all incoming artisan bids.',
      [
        { text: 'Keep Job', style: 'cancel' },
        {
          text: 'Yes, Cancel Job',
          style: 'destructive',
          onPress: async () => {
            setIsDeletingJob(true);
            try {
              await JobService.delete(targetJobId);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await queryClient.invalidateQueries({ queryKey: ['client-jobs'] });
              await queryClient.invalidateQueries({ queryKey: ['jobs'] });
              Alert.alert('Job Cancelled', 'Your job request was cancelled and removed.');
              onBack?.();
            } catch (err: unknown) {
              const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
              Alert.alert('Error', apiErr?.response?.data?.message || apiErr?.message || 'Failed to cancel job.');
            } finally {
              setIsDeletingJob(false);
            }
          },
        },
      ]
    );
  };

  const handleRejectProposal = (prop: ProposalItem) => {
    Alert.alert(
      'Decline Proposal',
      `Are you sure you want to decline this ₦${prop.bidAmount.toLocaleString()} bid from ${prop.artisanName}?`,
      [
        { text: 'Keep Bid', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setRejectingProposalId(prop.id);
            try {
              await ProposalService.updateStatus(prop.id, 'REJECTED');
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await queryClient.invalidateQueries({ queryKey: ['job-proposals', jobId] });
              Alert.alert('Bid Declined', `The bid from ${prop.artisanName} was declined.`);
            } catch (err: unknown) {
              const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
              Alert.alert('Error', apiErr?.response?.data?.message || apiErr?.message || 'Failed to decline proposal.');
            } finally {
              setRejectingProposalId(null);
            }
          },
        },
      ]
    );
  };

  const { data: remoteJob } = useQuery({
    queryKey: ['job-details', jobId],
    queryFn: () => JobService.getById(jobId!),
    enabled: !!jobId && !initialJob,
  });

  const activeJob = initialJob || remoteJob;

  const { data: remoteProposals, isLoading } = useQuery({
    queryKey: ['job-proposals', jobId],
    queryFn: () => ProposalService.getJobProposals(jobId!),
    enabled: !!jobId,
  });

  const displayProposals: ProposalItem[] = remoteProposals
    ? remoteProposals.map((p) => {
        const artisanProfile = p.artisan?.artisanProfile;
        const total = p.amount;
        const labor = Math.round(total * 0.75);
        const parts = total - labor;
        return {
          id: p.id,
          artisanId: p.artisanId,
          artisanName: artisanProfile?.businessName || (p.artisan as any)?.clientProfile?.firstName || artisanProfile?.title || 'Verified Artisan',
          avatarUrl: p.artisan?.avatarUrl || artisanProfile?.avatarUrl,
          rating: artisanProfile?.rating || 4.9,
          reviewsCount: artisanProfile?.reviewCount || 12,
          trade: artisanProfile?.trade || activeJob?.trade || 'Electrician',
          distance: 'Nearby',
          bidAmount: p.amount,
          laborAmount: labor,
          partsAmount: parts,
          duration: `${p.durationDays} ${p.durationDays === 1 ? 'day' : 'days'}`,
          coverNote: p.coverLetter,
          milestonesCount: p.milestones?.length || 1,
          isVerified: artisanProfile?.isVerified ?? true,
          timeAgo: 'Recently',
        };
      })
    : [];

  const jobTitle = activeJob?.title || 'Job Request';
  const rawTrade = (activeJob as any)?.category?.name || activeJob?.trade;
  const jobTrade = rawTrade ? `⚡ ${rawTrade}` : '⚡ Repair Request';
  const rawLocation = (activeJob as any)?.address || activeJob?.location || ((activeJob as any)?.lgaCity ? `${(activeJob as any).lgaCity}, ${(activeJob as any).state || 'Lagos'}` : undefined);
  const jobLocation = rawLocation ? `📍 ${rawLocation}` : '📍 Lagos, Nigeria';
  const jobBudget = Number(activeJob?.budget ?? (activeJob as any)?.budgetMax ?? (activeJob as any)?.budgetMin ?? 0);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Job Proposals</Text>
          <Text style={styles.headerSubtitle}>{jobTitle}</Text>
        </View>
        <View style={styles.headerRightActions}>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>{displayProposals.length} Bids</Text>
          </View>
          <TouchableOpacity
            style={styles.headerTrashBtn}
            onPress={handleDeleteJob}
            disabled={isDeletingJob}
            activeOpacity={0.7}
          >
            <Text style={styles.headerTrashIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Job Overview Card */}
        <View style={styles.jobCard}>
          <View style={styles.jobBadgeRow}>
            <View style={styles.tradeBadge}>
              <Text style={styles.tradeBadgeText}>{jobTrade}</Text>
            </View>
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentBadgeText}>🔥 Urgent Lead</Text>
            </View>
          </View>
          <Text style={styles.jobTitle}>{jobTitle}</Text>
          <Text style={styles.jobLocation}>{jobLocation}</Text>

          <View style={styles.budgetRow}>
            <View>
              <Text style={styles.budgetLabel}>Target Budget</Text>
              <Text style={styles.budgetValue}>{formatCurrency(jobBudget)}</Text>
            </View>
            <View style={styles.escrowNotice}>
              <Text style={styles.escrowNoticeText}>🛡️ Escrow Protected</Text>
            </View>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'PROPOSALS' && styles.tabButtonActive]}
            onPress={() => setActiveTab('PROPOSALS')}
          >
            <Text style={[styles.tabText, activeTab === 'PROPOSALS' && styles.tabTextActive]}>
              Proposals ({displayProposals.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'DETAILS' && styles.tabButtonActive]}
            onPress={() => setActiveTab('DETAILS')}
          >
            <Text style={[styles.tabText, activeTab === 'DETAILS' && styles.tabTextActive]}>
              Full Job Details
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'PROPOSALS' ? (
          <View style={styles.proposalsContainer}>
            <Text style={styles.sectionHeader}>Review & Select Best Artisan</Text>
            {isLoading && (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
            )}
            {displayProposals.length === 0 && !isLoading ? (
              <View style={styles.emptyProposalsBox}>
                <Text style={styles.emptyProposalsIcon}>⏳</Text>
                <Text style={styles.emptyProposalsTitle}>Awaiting Artisan Bids</Text>
                <Text style={styles.emptyProposalsSub}>
                  Verified artisans near {jobLocation.replace('📍 ', '')} are reviewing your request. New quotes will appear here automatically.
                </Text>
              </View>
            ) : (
              displayProposals.map((prop) => (
                <View key={prop.id} style={styles.proposalCard}>
                  {/* Artisan Head Row */}
                  <View style={styles.artisanHeadRow}>
                    <View style={styles.artisanAvatar}>
                      <Text style={styles.artisanAvatarText}>
                        {prop.artisanName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </Text>
                    </View>
                    <View style={styles.artisanMeta}>
                      <View style={styles.nameRow}>
                        <Text style={styles.artisanName}>{prop.artisanName}</Text>
                        {prop.isVerified && (
                          <View style={styles.verifiedTag}>
                            <Text style={styles.verifiedTagText}>✓ NIN</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.artisanTrade}>{prop.trade}</Text>
                      <View style={styles.statsRow}>
                        <Text style={styles.ratingText}>⭐ {prop.rating}</Text>
                        <Text style={styles.dotSeparator}>•</Text>
                        <Text style={styles.reviewsText}>({prop.reviewsCount} reviews)</Text>
                        <Text style={styles.dotSeparator}>•</Text>
                        <Text style={styles.distanceText}>{prop.distance}</Text>
                      </View>
                    </View>
                    <Text style={styles.timeAgo}>{prop.timeAgo}</Text>
                  </View>

                  {/* Cover Note */}
                  <View style={styles.coverBox}>
                    <Text style={styles.coverText}>"{prop.coverNote}"</Text>
                  </View>

                  {/* Bid Breakdown */}
                  <View style={styles.bidBreakdown}>
                    <View style={styles.breakdownItem}>
                      <Text style={styles.breakdownLabel}>Total Bid</Text>
                      <Text style={styles.breakdownValueTotal}>
                        {formatCurrency(prop.bidAmount)}
                      </Text>
                    </View>
                    <View style={styles.breakdownDivider} />
                    <View style={styles.breakdownItem}>
                      <Text style={styles.breakdownLabel}>Labor / Parts</Text>
                      <Text style={styles.breakdownSub}>
                        {formatCurrency(prop.laborAmount)} / {formatCurrency(prop.partsAmount)}
                      </Text>
                    </View>
                    <View style={styles.breakdownDivider} />
                    <View style={styles.breakdownItem}>
                      <Text style={styles.breakdownLabel}>Est. Time</Text>
                      <Text style={styles.breakdownSub}>{prop.duration}</Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.outlineActionBtn}
                      onPress={() => onViewArtisan?.(prop.artisanId)}
                    >
                      <Text style={styles.outlineActionText}>Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.outlineActionBtn}
                      onPress={() => onChatWithArtisan?.(prop.artisanId)}
                    >
                      <Text style={styles.outlineActionText}>💬 Chat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.declineActionBtn}
                      onPress={() => handleRejectProposal(prop)}
                      disabled={rejectingProposalId === prop.id}
                      activeOpacity={0.7}
                    >
                      {rejectingProposalId === prop.id ? (
                        <ActivityIndicator size="small" color="#DC2626" />
                      ) : (
                        <Text style={styles.declineActionText}>✕ Decline</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.primaryActionBtn}
                      onPress={() => onSelectProposal?.(prop)}
                    >
                      <Text style={styles.primaryActionText}>Accept & Fund</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={styles.detailsContainer}>
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Issue Description</Text>
              <Text style={styles.detailBody}>
                {activeJob?.description || 'No detailed description provided for this job request.'}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Scope & Category</Text>
              <Text style={styles.detailBody}>
                Trade: {activeJob?.trade || 'General Handyman'}{'\n'}
                Urgency: {activeJob?.urgency || 'Standard'}{'\n'}
                Location: {jobLocation.replace('📍 ', '')}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Payment & Escrow Terms</Text>
              <View style={styles.aiDiagnosticBox}>
                <Text style={styles.aiDiagnosticBadge}>🛡️ Monad Smart Escrow</Text>
                <Text style={styles.aiDiagnosticText}>
                  Your target budget is {formatCurrency(jobBudget)}. Funds are locked safely in smart escrow upon accepting a bid and released only when you approve completed milestones.
                </Text>
              </View>
            </View>

            {/* Cancel / Withdraw Job Option */}
            <View style={styles.cancelSection}>
              <TouchableOpacity
                style={[styles.cancelJobBtn, isDeletingJob && { opacity: 0.6 }]}
                onPress={handleDeleteJob}
                disabled={isDeletingJob}
                activeOpacity={0.8}
              >
                {isDeletingJob ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <Text style={styles.cancelJobBtnText}>🗑️ Cancel & Remove Job Request</Text>
                )}
              </TouchableOpacity>
              <Text style={styles.cancelJobHint}>
                Canceling will close this job request and permanently remove all incoming artisan bids.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  backButtonText: {
    fontSize: 22,
    color: colors.text,
    fontWeight: 'bold',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  statusPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusPillText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  jobCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  jobBadgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  tradeBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  tradeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4F46E5',
  },
  urgentBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  urgentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },
  jobTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: 4,
    marginBottom: 4,
  },
  jobLocation: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  budgetLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  budgetValue: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: 'bold',
  },
  escrowNotice: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  escrowNoticeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  proposalsContainer: {
    gap: spacing.md,
  },
  proposalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  artisanHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artisanAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  artisanAvatarText: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: 'bold',
  },
  artisanMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  artisanName: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  verifiedTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  artisanTrade: {
    ...typography.caption,
    color: colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  dotSeparator: {
    marginHorizontal: 4,
    color: colors.textMuted,
  },
  reviewsText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  distanceText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  timeAgo: {
    ...typography.caption,
    color: colors.textMuted,
  },
  coverBox: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  coverText: {
    ...typography.caption,
    color: colors.text,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  bidBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  breakdownLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 2,
  },
  breakdownValueTotal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
  },
  breakdownSub: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  outlineActionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  outlineActionText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text,
  },
  primaryActionBtn: {
    flex: 1.5,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  primaryActionText: {
    ...typography.caption,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailsContainer: {
    gap: spacing.md,
  },
  detailSection: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailSectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  detailBody: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },
  aiDiagnosticBox: {
    backgroundColor: colors.primaryLight,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    marginTop: spacing.xs,
  },
  aiDiagnosticBadge: {
    ...typography.caption,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  aiDiagnosticText: {
    ...typography.body,
    color: colors.text,
    marginBottom: 4,
  },
  aiPriceRange: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyProposalsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.md,
  },
  emptyProposalsIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyProposalsTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 4,
  },
  emptyProposalsSub: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerTrashBtn: {
    padding: 6,
    borderRadius: radius.full,
    backgroundColor: '#FEE2E2',
  },
  headerTrashIcon: {
    fontSize: 14,
  },
  declineActionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineActionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  cancelSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  cancelJobBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  cancelJobBtnText: {
    ...typography.body,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  cancelJobHint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: spacing.md,
  },
});
