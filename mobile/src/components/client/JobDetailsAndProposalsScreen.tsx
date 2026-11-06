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
  Modal,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography, shadows, useTheme } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { ProposalService } from '../../services/proposal.service';
import { JobRecord } from '../../types/api-contracts';
import { JobService } from '../../services/job.service';
import { SkeletonProposalCard } from '../shared';
import { EditJobModal } from './EditJobModal';
import { JobDeleteConfirmationModal } from './JobDeleteConfirmationModal';
import { useToast } from '../shared/ToastContext';
import { useClientJobMutations, useClientProposalActions } from '../../hooks';
import {
  ArrowLeft,
  ShieldCheck,
  Star,
  Clock,
  Zap,
  MapPin,
  ChevronRight,
  MessageSquare,
  Trash2,
  Edit3,
  Camera,
  X,
  CheckCircle2,
  ZoomIn,
  Calendar,
  AlertTriangle,
  Lock,
} from 'lucide-react-native';

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
  status?: string;
  rawMilestones?: any[];
}

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
  const { colors: themeColors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'PROPOSALS' | 'DETAILS'>('PROPOSALS');
  const [isDeletingJob, setIsDeletingJob] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rejectingProposalId, setRejectingProposalId] = useState<string | null>(null);
  const [shortlistingProposalId, setShortlistingProposalId] = useState<string | null>(null);
  const [expandedProposalIds, setExpandedProposalIds] = useState<Record<string, boolean>>({});
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const queryClient = useQueryClient();
  const { showSuccess, showError, showWarning } = useToast();

  const { deleteJob } = useClientJobMutations();
  const { shortlistProposal, rejectProposal } = useClientProposalActions();

  const toggleExpandProposal = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedProposalIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleShortlistProposal = (prop: ProposalItem) => {
    if (!jobId) return;
    showSuccess(`Bid from ${prop.artisanName} shortlisted as a top candidate! ⭐`);
    shortlistProposal(
      { jobId, proposalId: prop.id },
      {
        onError: (err) => {
          showError('Shortlist Error', err?.message || 'Failed to shortlist proposal.');
        },
      }
    );
  };

  const handleRejectProposal = (prop: ProposalItem) => {
    if (!jobId) return;
    showSuccess(`Bid from ${prop.artisanName} was declined.`);
    rejectProposal(
      { jobId, proposalId: prop.id },
      {
        onError: (err) => {
          showError('Decline Error', err?.message || 'Could not decline proposal');
        },
      }
    );
  };

  const { data: remoteJob } = useQuery({
    queryKey: ['job-details', jobId],
    queryFn: () => JobService.getById(jobId!),
    enabled: !!jobId,
  });

  const activeJob = remoteJob || initialJob;

  const isJobInProgress =
    (activeJob?.status as string) === 'IN_PROGRESS' ||
    ((activeJob as any)?.contracts && (activeJob as any).contracts.length > 0);

  const handleDeleteJob = () => {
    if (isJobInProgress) {
      showWarning(
        'Contract Active',
        'This job already has an active contract in progress. It cannot be cancelled or deleted while work is ongoing.'
      );
      return;
    }
    setShowDeleteModal(true);
  };

  const executeDeleteJob = (reason: string) => {
    const targetJobId = activeJob?.id || jobId;
    if (!targetJobId) return;

    setShowDeleteModal(false);
    showSuccess('Job Cancelled', 'Your job request was cancelled and removed.');
    onBack?.();

    deleteJob(
      { jobId: targetJobId, reason },
      {
        onError: (err: unknown) => {
          const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
          showError('Error', apiErr?.response?.data?.message || apiErr?.message || 'Failed to cancel job.');
        },
      }
    );
  };

  const { data: remoteProposals, isLoading } = useQuery({
    queryKey: ['job-proposals', jobId],
    queryFn: () => ProposalService.getJobProposals(jobId!),
    enabled: !!jobId,
  });

  const displayProposals: ProposalItem[] = remoteProposals
    ? remoteProposals.map((p) => {
        const artisanProfile = p.artisan?.artisanProfile;
        const total = Number(p.bidAmount || p.amount || 0);

        // Derive labor/materials from real proposed milestones if present
        let labor = Math.round(total * 0.7);
        let parts = total - labor;
        if (p.milestones && p.milestones.length > 0) {
          const laborM = p.milestones.find((m: any) =>
            m.title.toLowerCase().includes('labor') ||
            m.title.toLowerCase().includes('execution') ||
            m.title.toLowerCase().includes('handover')
          );
          const partsM = p.milestones.find((m: any) =>
            m.title.toLowerCase().includes('parts') ||
            m.title.toLowerCase().includes('material') ||
            m.title.toLowerCase().includes('procurement')
          );
          if (laborM && partsM) {
            labor = Number(laborM.amount);
            parts = Number(partsM.amount);
          } else if (p.milestones.length >= 2) {
            parts = Number(p.milestones[0].amount);
            labor = total - parts;
          }
        }

        return {
          id: p.id,
          artisanId: p.artisanId,
          artisanName: artisanProfile?.businessName || (p.artisan as any)?.clientProfile?.firstName || artisanProfile?.title || 'Verified Artisan',
          avatarUrl: p.artisan?.avatarUrl || artisanProfile?.avatarUrl,
          rating: artisanProfile?.rating || 4.9,
          reviewsCount: artisanProfile?.reviewCount || 12,
          trade: artisanProfile?.trade || activeJob?.trade || 'Electrician',
          distance: 'Nearby',
          bidAmount: total,
          laborAmount: labor,
          partsAmount: parts,
          duration: `${p.estimatedDays || p.durationDays || 1} ${(p.estimatedDays || p.durationDays || 1) === 1 ? 'day' : 'days'}`,
          coverNote: p.coverLetter,
          milestonesCount: p.milestones?.length || 1,
          isVerified: artisanProfile?.isVerified ?? true,
          timeAgo: 'Recently',
          status: (p as any).status || 'PENDING',
          rawMilestones: p.milestones,
        };
      })
    : [];

  const jobTitle = activeJob?.title || 'Job Request';
  const rawTrade = (activeJob as any)?.category?.name || activeJob?.trade;
  const jobTrade = rawTrade || 'Repair Request';
  const rawLocation = (activeJob as any)?.address || activeJob?.location || ((activeJob as any)?.lgaCity ? `${(activeJob as any).lgaCity}, ${(activeJob as any).state || 'Lagos'}` : undefined);
  const jobLocation = rawLocation || 'Lagos, Nigeria';
  const jobBudget = Number(activeJob?.budget ?? (activeJob as any)?.budgetMax ?? (activeJob as any)?.budgetMin ?? 0);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.headerBorder }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={22} color={themeColors.text} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Job Proposals</Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.textMuted }]} numberOfLines={1}>{jobTitle}</Text>
        </View>
        <View style={styles.headerRightActions}>
          {!isJobInProgress && (
            <TouchableOpacity
              style={[styles.headerEditBtn, { backgroundColor: themeColors.surfaceSubtle }]}
              onPress={() => setShowEditModal(true)}
              activeOpacity={0.7}
            >
              <Edit3 size={15} color={themeColors.text} strokeWidth={2} />
            </TouchableOpacity>
          )}
          <View style={[styles.statusPill, isDark && { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
            <Text style={[styles.statusPillText, isDark && { color: '#34D399' }]}>{displayProposals.length} Bids</Text>
          </View>
          {!isJobInProgress && (
            <TouchableOpacity
              style={styles.headerTrashBtn}
              onPress={handleDeleteJob}
              disabled={isDeletingJob}
              activeOpacity={0.7}
            >
              <Trash2 size={15} color="#DC2626" strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Job Overview Card */}
        <View style={[styles.jobCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={styles.jobBadgeRow}>
            <View style={styles.tradeBadge}>
              <Zap size={11} color="#4F46E5" strokeWidth={2.2} style={{ marginRight: 4 }} />
              <Text style={styles.tradeBadgeText}>{jobTrade}</Text>
            </View>
            <View style={styles.urgentBadge}>
              <Clock size={11} color="#DC2626" strokeWidth={2.2} style={{ marginRight: 4 }} />
              <Text style={styles.urgentBadgeText}>
                {activeJob?.urgency === 'EMERGENCY' ? 'Emergency' : 'Urgent'}
              </Text>
            </View>
          </View>
          <Text style={[styles.jobTitle, { color: themeColors.text }]}>{jobTitle}</Text>
          <View style={styles.locationRow}>
            <MapPin size={13} color={themeColors.textMuted} strokeWidth={2} style={{ marginRight: 4 }} />
            <Text style={[styles.jobLocation, { color: themeColors.textMuted }]} numberOfLines={1}>{jobLocation}</Text>
          </View>

          <View style={[styles.budgetRow, { borderTopColor: themeColors.border }]}>
            <View>
              <Text style={[styles.budgetLabel, { color: themeColors.textMuted }]}>Target Budget</Text>
              <Text style={[styles.budgetValue, isDark && { color: '#34D399' }]}>{formatCurrency(jobBudget)}</Text>
            </View>
            <View style={[styles.escrowNotice, isDark && { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
              <ShieldCheck size={13} color={isDark ? '#34D399' : colors.primary} strokeWidth={2.2} style={{ marginRight: 4 }} />
              <Text style={[styles.escrowNoticeText, isDark && { color: '#34D399' }]}>Escrow Protected</Text>
            </View>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={[styles.tabsContainer, { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border }]}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'PROPOSALS' && [styles.tabButtonActive, isDark && { backgroundColor: themeColors.surface }]]}
            onPress={() => setActiveTab('PROPOSALS')}
          >
            <Text style={[styles.tabText, { color: themeColors.textMuted }, activeTab === 'PROPOSALS' && [styles.tabTextActive, isDark && { color: themeColors.text }]]}>
              Proposals ({displayProposals.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'DETAILS' && [styles.tabButtonActive, isDark && { backgroundColor: themeColors.surface }]]}
            onPress={() => setActiveTab('DETAILS')}
          >
            <Text style={[styles.tabText, { color: themeColors.textMuted }, activeTab === 'DETAILS' && [styles.tabTextActive, isDark && { color: themeColors.text }]]}>
              Scope & Specs{activeJob?.attachments && activeJob.attachments.length > 0 ? ` (${activeJob.attachments.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'PROPOSALS' ? (
          <View style={styles.proposalsContainer}>
            {activeJob?.attachments && activeJob.attachments.length > 0 && (
              <TouchableOpacity
                style={[styles.photoAlertBanner, isDark && { backgroundColor: 'rgba(52, 211, 153, 0.12)', borderColor: 'rgba(52, 211, 153, 0.25)' }]}
                onPress={() => setActiveTab('DETAILS')}
                activeOpacity={0.8}
              >
                <Camera size={15} color={isDark ? '#34D399' : colors.brand.forest} strokeWidth={2} style={{ marginRight: 6 }} />
                <Text style={[styles.photoAlertText, isDark && { color: '#34D399' }]}>
                  <Text style={{ fontWeight: '700' }}>{activeJob.attachments.length} inspection photo{activeJob.attachments.length > 1 ? 's' : ''}</Text> attached to this job request.{' '}
                  <Text style={[styles.photoAlertLink, isDark && { color: '#34D399' }]}>View Photos →</Text>
                </Text>
              </TouchableOpacity>
            )}
            <Text style={[styles.sectionHeader, { color: themeColors.text }]}>Review & Select Best Artisan</Text>
            {isLoading ? (
              <View style={{ marginTop: 8 }}>
                <SkeletonProposalCard />
                <SkeletonProposalCard />
              </View>
            ) : null}
            {displayProposals.length === 0 && !isLoading ? (
              <View style={[styles.emptyProposalsBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                <Clock size={32} color={themeColors.textMuted} strokeWidth={1.5} style={{ marginBottom: 10 }} />
                <Text style={[styles.emptyProposalsTitle, { color: themeColors.text }]}>Awaiting Artisan Bids</Text>
                <Text style={[styles.emptyProposalsSub, { color: themeColors.textMuted }]}>
                  Verified artisans near {jobLocation} are reviewing your request. New quotes will appear here automatically.
                </Text>
              </View>
            ) : (
              displayProposals.map((prop, idx) => {
                // Compute clean initials (e.g., Kelechi Woodworks & Upholstery -> KW&U)
                const getArtisanInitials = (name: string) => {
                  const parts = name.split(' ').filter(Boolean);
                  if (parts.length >= 4 && (parts[2] === '&' || parts[2] === 'and')) {
                    return `${parts[0][0]}${parts[1][0]}&${parts[3][0]}`.toUpperCase();
                  }
                  if (parts.length >= 3 && parts[1] === '&') {
                    return `${parts[0][0]}&${parts[2][0]}`.toUpperCase();
                  }
                  return parts.slice(0, 3).map((n) => n[0]).join('').toUpperCase();
                };

                return (
                  <View key={prop.id} style={[styles.proposalCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                    {/* Top Row: Green banner block on left + White info block on right */}
                    <View style={styles.proposalMainRow}>
                      {/* Left Dark Emerald Graphic Container */}
                      <View style={styles.greenBannerContainer}>
                        {/* Circular Dark Avatar */}
                        <View style={styles.artisanDarkAvatar}>
                          <Text style={styles.artisanDarkAvatarText}>
                            {getArtisanInitials(prop.artisanName)}
                          </Text>
                        </View>

                        {/* Top Recommended Pill */}
                        <View style={styles.topRecommendedPill}>
                          <Star size={9} color="#FFFFFF" fill="#FFFFFF" style={{ marginRight: 3 }} />
                          <Text style={styles.topRecommendedText}>Top Recommended</Text>
                        </View>

                        {/* Artisan Business Name */}
                        <Text style={styles.artisanWhiteName} numberOfLines={1}>
                          {prop.artisanName}
                        </Text>

                        {/* Rating, Reviews, NIN Tag */}
                        <View style={styles.artisanSubRow}>
                          <Star size={10} color="#FBBF24" fill="#FBBF24" style={{ marginRight: 3 }} />
                          <Text style={styles.artisanRatingText}>{prop.rating || '4.9'}</Text>
                          <Text style={styles.artisanReviewsText}>({prop.reviewsCount || '38'} reviews)</Text>
                          {prop.isVerified && (
                            <View style={styles.ninBadge}>
                              <Text style={styles.ninBadgeText}>NIN</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Right Meta Column */}
                      <View style={styles.proposalRightCol}>
                        {/* Delivery Time & Milestones Stats */}
                        <View style={styles.statsPillRow}>
                          <View style={styles.statItem}>
                            <Calendar size={13} color={themeColors.textMuted} strokeWidth={1.8} style={{ marginRight: 4 }} />
                            <Text style={[styles.statItemText, { color: themeColors.textMuted }]}>{prop.duration || '4 days'}</Text>
                          </View>
                          <View style={[styles.statDivider, { backgroundColor: themeColors.border }]} />
                          <View style={styles.statItem}>
                            <CheckCircle2 size={13} color={themeColors.textMuted} strokeWidth={1.8} style={{ marginRight: 4 }} />
                            <Text style={[styles.statItemText, { color: themeColors.textMuted }]}>{prop.milestonesCount || 2} Milestones</Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Bottom CTA Button: Review Full Proposal */}
                    <TouchableOpacity
                      style={styles.reviewProposalBtn}
                      activeOpacity={0.88}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                        onSelectProposal?.(prop);
                      }}
                    >
                      <Text style={styles.reviewProposalBtnText}>Review Full Proposal</Text>
                      <ChevronRight size={15} color="#FFFFFF" strokeWidth={2.4} style={{ marginLeft: 3 }} />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        ) : (
          <View style={styles.detailsContainer}>
            {/* Defect / Site Inspection Photos Gallery */}
            {activeJob?.attachments && activeJob.attachments.length > 0 && (
              <View style={[styles.detailSection, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                <Text style={[styles.detailSectionTitle, { color: themeColors.text }]}>Defect & Site Photos ({activeJob.attachments.length})</Text>
                <Text style={[styles.detailSubtext, { color: themeColors.textMuted }]}>Tap photo to inspect high-resolution site conditions</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
                  {activeJob.attachments.map((att: any, idx: number) => {
                    const imgUrl = att.fileUrl || att.url;
                    if (!imgUrl) return null;
                    return (
                      <TouchableOpacity
                        key={att.id || `att-${idx}`}
                        style={styles.photoThumbContainer}
                        onPress={() => setPreviewImageUrl(imgUrl)}
                        activeOpacity={0.8}
                      >
                        <Image source={{ uri: imgUrl }} style={styles.photoThumb} resizeMode="cover" />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <View style={[styles.detailSection, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <Text style={[styles.detailSectionTitle, { color: themeColors.text }]}>Issue Description</Text>
              <Text style={[styles.detailBody, { color: themeColors.text }]}>
                {activeJob?.description || 'No detailed description provided for this job request.'}
              </Text>
            </View>

            <View style={[styles.detailSection, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <Text style={[styles.detailSectionTitle, { color: themeColors.text }]}>Scope & Specifications</Text>
              <View style={styles.specRow}>
                <Text style={[styles.specLabel, { color: themeColors.textMuted }]}>Category / Trade:</Text>
                <Text style={[styles.specValue, { color: themeColors.text }]}>{activeJob?.trade || 'General Handyman'}</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={[styles.specLabel, { color: themeColors.textMuted }]}>Urgency Level:</Text>
                <Text style={[
                  styles.specValue,
                  activeJob?.urgency === 'EMERGENCY' ? { color: '#DC2626', fontWeight: '700' } :
                  activeJob?.urgency === 'URGENT' || (activeJob?.urgency as string) === 'HIGH' ? { color: '#D97706', fontWeight: '700' } :
                  { color: themeColors.text }
                ]}>
                  {activeJob?.urgency === 'EMERGENCY'
                    ? 'Emergency (Within 1h)'
                    : activeJob?.urgency === 'URGENT' || (activeJob?.urgency as string) === 'HIGH'
                    ? 'Urgent (Today)'
                    : 'Normal (Next Few Days)'}
                </Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Location:</Text>
                <Text style={styles.specValue}>{jobLocation.replace(/^[^\w\s]+/, '').trim()}</Text>
              </View>
              {activeJob?.expectedOutcome ? (
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Expected Outcome:</Text>
                  <Text style={styles.specValue}>{activeJob.expectedOutcome}</Text>
                </View>
              ) : null}
              {activeJob?.materialsProvidedBy ? (
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Materials:</Text>
                  <Text style={styles.specValue}>
                    {activeJob.materialsProvidedBy.toLowerCase().includes('artisan') || activeJob.materialsProvidedBy === 'ARTISAN'
                      ? 'Procured by Artisan'
                      : activeJob.materialsProvidedBy.toLowerCase().includes('client') || activeJob.materialsProvidedBy === 'CLIENT'
                      ? 'Supplied by Client'
                      : 'Split / Negotiable on site'}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={[styles.detailSection, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <Text style={[styles.detailSectionTitle, { color: themeColors.text }]}>Payment & Escrow Terms</Text>
              <View style={[styles.aiDiagnosticBox, isDark && { backgroundColor: 'rgba(52, 211, 153, 0.12)', borderColor: 'rgba(52, 211, 153, 0.3)' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <ShieldCheck size={14} color="#10B981" strokeWidth={2} />
                  <Text style={[styles.aiDiagnosticBadge, isDark && { color: '#34D399' }]}>Artifix Smart Escrow</Text>
                </View>
                <Text style={[styles.aiDiagnosticText, { color: themeColors.text }]}>
                  Your target budget is {formatCurrency(jobBudget)}. Funds are locked safely in smart escrow upon accepting a bid and released only when you approve completed milestones.
                </Text>
              </View>
            </View>

            {/* Cancel / Withdraw Job Option */}
            {!isJobInProgress ? (
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Trash2 size={15} color="#DC2626" />
                      <Text style={styles.cancelJobBtnText}>Cancel & Remove Job Request</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <Text style={styles.cancelJobHint}>
                  Canceling will close this job request and permanently remove all incoming artisan bids.
                </Text>
              </View>
            ) : (
              <View style={[styles.cancelSection, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Lock size={14} color={colors.brand.forest} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.brand.forest }}>
                    Active Contract in Progress
                  </Text>
                </View>
                <Text style={[styles.cancelJobHint, { color: colors.neutral[600], textAlign: 'center' }]}>
                  This repair request has an active artisan contract. Work milestones are locked in smart escrow.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Fullscreen Photo Inspection Modal */}
      <Modal visible={!!previewImageUrl} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <SafeAreaView style={styles.modalSafeWrap}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Site Inspection Photo</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setPreviewImageUrl(null)}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <X size={15} color="#FFFFFF" strokeWidth={2.4} />
                  <Text style={styles.modalCloseText}>Close</Text>
                </View>
              </TouchableOpacity>
            </View>
            <View style={styles.modalImageContainer}>
              {previewImageUrl ? (
                <Image
                  source={{ uri: previewImageUrl }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              ) : null}
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Edit Job Modal */}
      <EditJobModal
        visible={showEditModal}
        job={activeJob}
        onClose={() => setShowEditModal(false)}
      />

      {/* Delete Clarification Pop-Up */}
      <JobDeleteConfirmationModal
        visible={showDeleteModal}
        jobTitle={jobTitle}
        jobBudget={jobBudget}
        bidsCount={displayProposals.length}
        isDeleting={isDeletingJob}
        onClose={() => setShowDeleteModal(false)}
        onConfirmDelete={executeDeleteJob}
        onEditInstead={() => {
          setShowDeleteModal(false);
          setShowEditModal(true);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerEditBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.md,
    backgroundColor: '#F3F4F6',
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEditIcon: {
    fontSize: 14,
  },
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    padding: 10,
    ...shadows.sm,
  },
  proposalMainRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 110,
    marginBottom: 8,
  },
  greenBannerContainer: {
    flex: 1.35,
    backgroundColor: '#073B28',
    borderRadius: 16,
    padding: 12,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  artisanDarkAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#032318',
    borderWidth: 1.5,
    borderColor: '#10563A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  artisanDarkAvatarText: {
    color: '#ECFDF5',
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  topRecommendedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  topRecommendedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  artisanWhiteName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  artisanSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  artisanRatingText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FBBF24',
  },
  artisanReviewsText: {
    fontSize: 10,
    color: '#CBD5E1',
  },
  ninBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 3,
  },
  ninBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  proposalRightCol: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: 4,
    paddingLeft: 8,
  },
  recentlyPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  recentlyPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  statsPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItemText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#475569',
  },
  statDivider: {
    width: 1,
    height: 11,
    backgroundColor: '#CBD5E1',
  },
  reviewProposalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D472D',
    borderRadius: 24,
    paddingVertical: 10,
    width: '100%',
  },
  reviewProposalBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  commercialStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pricePill: {
    flexDirection: 'column',
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  priceVal: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  metaPillsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metaPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  coverExcerpt: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: 8,
    paddingHorizontal: 2,
  },
  topMatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  topMatchBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  actionsColumn: {
    gap: 8,
    marginTop: spacing.md,
  },
  actionsSecondaryRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  outlineActionBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  outlineActionText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 46,
    ...shadows.sm,
  },
  primaryActionText: {
    fontWeight: '700',
    color: '#FFFFFF',
    fontSize: 13,
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
    borderRadius: 6,
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
  milestoneAccordionContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.xs,
    marginBottom: spacing.xs,
  },
  milestoneToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  milestoneToggleText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text,
  },
  milestoneToggleIcon: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  milestonesList: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 6,
    gap: 8,
  },
  milestoneItem: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  milestoneStepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneStepNum: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.primary,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text,
  },
  milestoneDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  milestoneFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  milestoneDays: {
    fontSize: 11,
    color: colors.textMuted,
  },
  milestoneCost: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
  },
  shortlistedBanner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
    alignItems: 'center',
  },
  shortlistedBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  shortlistActionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortlistActionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#B45309',
  },
  detailSubtext: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  photosScroll: {
    marginTop: spacing.xs,
  },
  photoThumbContainer: {
    marginRight: 10,
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoThumb: {
    width: 110,
    height: 90,
  },
  zoomHintBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  zoomHintText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  specLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '500',
  },
  specValue: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
  },
  modalSafeWrap: {
    flex: 1,
    justifyContent: 'space-between',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  modalHeaderTitle: {
    ...typography.h3,
    color: '#FFFFFF',
  },
  modalCloseBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  modalCloseText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  photoAlertBanner: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  photoAlertText: {
    ...typography.caption,
    color: '#065F46',
  },
  photoAlertLink: {
    fontWeight: '700',
    color: '#059669',
    textDecorationLine: 'underline',
  },
});
