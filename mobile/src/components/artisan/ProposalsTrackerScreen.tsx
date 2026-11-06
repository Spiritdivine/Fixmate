import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Search } from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { ProposalService } from '../../services/proposal.service';
import { SkeletonProposalCard } from '../shared';
import { EditProposalModal, EditableProposalData } from './EditProposalModal';
import { ProposalDetailsModal, DetailedProposalRecord } from './ProposalDetailsModal';
import { useToast } from '../shared/ToastContext';
import { useArtisanProposals } from '../../hooks';

interface ProposalItem {
  id: string;
  jobId: string;
  jobTitle: string;
  clientName: string;
  quotedAmount: number;
  submittedAt: string;
  status: 'UNDER_REVIEW' | 'ACCEPTED' | 'DECLINED';
  lastClientActivity?: string;
  estimatedDays: number;
  contractId?: string;
  coverLetter?: string;
}

interface ProposalsTrackerScreenProps {
  onBack?: () => void;
  onOpenAcceptedContract?: (contractId?: string) => void;
  onViewJob?: (jobId: string) => void;
}

export const ProposalsTrackerScreen: React.FC<ProposalsTrackerScreenProps> = ({
  onBack,
  onOpenAcceptedContract,
  onViewJob,
}) => {
  const { showSuccess, showError, showWarning } = useToast();
  const [activeTab, setActiveTab] = useState<'UNDER_REVIEW' | 'ACCEPTED' | 'CLOSED'>('UNDER_REVIEW');
  const [searchQuery, setSearchQuery] = useState('');
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [editingProposal, setEditingProposal] = useState<EditableProposalData | null>(null);
  const [selectedDetailProposal, setSelectedDetailProposal] = useState<DetailedProposalRecord | null>(null);

  const formatRelativeTime = (dateStr?: string): string => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    } catch {
      return 'Recently';
    }
  };

  const loadProposals = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await ProposalService.getMyProposals();
      if (Array.isArray(data)) {
        const transformed: ProposalItem[] = data.map((p: any) => {
          let mappedStatus: 'UNDER_REVIEW' | 'ACCEPTED' | 'DECLINED' = 'UNDER_REVIEW';
          const raw = (p.status || '').toUpperCase();
          if (raw === 'ACCEPTED') {
            mappedStatus = 'ACCEPTED';
          } else if (raw === 'REJECTED' || raw === 'WITHDRAWN') {
            mappedStatus = 'DECLINED';
          } else {
            mappedStatus = 'UNDER_REVIEW';
          }

          const clientProfile = p.job?.client?.clientProfile;
          const clientName = clientProfile?.firstName
            ? `${clientProfile.firstName} ${clientProfile.lastName || ''}`.trim()
            : 'Verified Client';

          return {
            id: p.id,
            jobId: p.jobId,
            jobTitle: p.job?.title || 'Repair Request',
            clientName,
            quotedAmount: Number(p.bidAmount || p.amount || 0),
            submittedAt: formatRelativeTime(p.createdAt),
            status: mappedStatus,
            lastClientActivity: mappedStatus === 'ACCEPTED'
              ? 'Client accepted your bid! Escrow funded.'
              : mappedStatus === 'UNDER_REVIEW'
              ? 'Proposal under client review'
              : 'Job closed or awarded to another proposal',
            estimatedDays: p.estimatedDurationDays || p.durationDays || 1,
            contractId: p.contract?.id,
            coverLetter: p.coverLetter || p.message || 'Technical work proposal with certified materials and safety protocols.',
          };
        });
        setProposals(transformed);
      } else {
        setProposals([]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load proposals');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  const { withdrawProposal } = useArtisanProposals();

  const handleWithdraw = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const previous = [...proposals];
    setProposals((prev) => prev.filter((p) => p.id !== id));
    showSuccess('Bid Withdrawn', 'Your proposal was successfully withdrawn.');

    withdrawProposal(id, {
      onError: (err: any) => {
        setProposals(previous);
        showError('Withdrawal Failed', err?.response?.data?.message || err?.message || 'Could not withdraw proposal');
      },
    });
  };

  const underReviewCount = proposals.filter((p) => p.status === 'UNDER_REVIEW').length;
  const acceptedCount = proposals.filter((p) => p.status === 'ACCEPTED').length;
  const closedCount = proposals.filter((p) => p.status === 'DECLINED').length;

  const filteredProposals = proposals.filter((p) => {
    if (activeTab === 'UNDER_REVIEW' && p.status !== 'UNDER_REVIEW') return false;
    if (activeTab === 'ACCEPTED' && p.status !== 'ACCEPTED') return false;
    if (activeTab === 'CLOSED' && p.status !== 'DECLINED') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.jobTitle.toLowerCase().includes(q);
      const matchClient = p.clientName.toLowerCase().includes(q);
      if (!matchTitle && !matchClient) return false;
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
              <Text style={styles.backChevron}>←</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>My Proposals</Text>
        </View>
        <Text style={styles.countText}>{proposals.length} Total Bids</Text>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <Search size={16} color={colors.neutral[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by job title or client..."
          placeholderTextColor={colors.neutral[400]}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* 3-Tab Segment */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('UNDER_REVIEW');
          }}
          style={[styles.tabItem, activeTab === 'UNDER_REVIEW' && styles.tabItemActive]}
        >
          <Text style={[styles.tabLabel, activeTab === 'UNDER_REVIEW' && styles.tabLabelActive]}>
            Under Review ({underReviewCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('ACCEPTED');
          }}
          style={[styles.tabItem, activeTab === 'ACCEPTED' && styles.tabItemActive]}
        >
          <View style={styles.alertDotRow}>
            <Text style={[styles.tabLabel, activeTab === 'ACCEPTED' && styles.tabLabelActive]}>
              Accepted ({acceptedCount})
            </Text>
            {acceptedCount > 0 && <View style={styles.acceptedDot} />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('CLOSED');
          }}
          style={[styles.tabItem, activeTab === 'CLOSED' && styles.tabItemActive]}
        >
          <Text style={[styles.tabLabel, activeTab === 'CLOSED' && styles.tabLabelActive]}>
            Closed ({closedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading & Error States */}
      {loading ? (
        <View style={styles.listContent}>
          <SkeletonProposalCard />
          <SkeletonProposalCard />
          <SkeletonProposalCard />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Could not load proposals</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity onPress={() => loadProposals()} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* List Feed */
        <FlatList
          data={filteredProposals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadProposals(true)}
              tintColor={colors.brand.forest}
              colors={[colors.brand.forest]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyTitle}>
                {activeTab === 'UNDER_REVIEW'
                  ? 'No Proposals Under Review'
                  : activeTab === 'ACCEPTED'
                  ? 'No Accepted Bids Yet'
                  : 'No Closed Proposals'}
              </Text>
              <Text style={styles.emptySub}>
                {activeTab === 'UNDER_REVIEW'
                  ? 'Active proposals and quotes you submit for marketplace jobs will show here.'
                  : activeTab === 'ACCEPTED'
                  ? 'When clients accept your quote, their funded contract will appear here ready for execution.'
                  : 'Past closed or withdrawn quotes will be archived here.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedDetailProposal({
                  id: item.id,
                  jobId: item.jobId,
                  jobTitle: item.jobTitle,
                  clientName: item.clientName,
                  bidAmount: item.quotedAmount,
                  status:
                    item.status === 'UNDER_REVIEW'
                      ? 'PENDING'
                      : item.status === 'ACCEPTED'
                      ? 'ACCEPTED'
                      : 'REJECTED',
                  submittedDate: item.submittedAt,
                  turnaroundDays: item.estimatedDays,
                  coverLetter:
                    item.coverLetter ||
                    'Technical work proposal with certified materials and safety protocols.',
                  milestones: [
                    {
                      title: 'Phase 1: Initial diagnostics & materials prep',
                      amount: Math.floor(item.quotedAmount * 0.4),
                    },
                    {
                      title: 'Phase 2: Execution & safety testing',
                      amount: Math.ceil(item.quotedAmount * 0.6),
                    },
                  ],
                });
              }}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobTitle}>{item.jobTitle}</Text>
                  <Text style={styles.clientSub}>Client: {item.clientName}</Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    item.status === 'ACCEPTED'
                      ? styles.statusAccepted
                      : item.status === 'UNDER_REVIEW'
                      ? styles.statusReview
                      : styles.statusDeclined,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      item.status === 'ACCEPTED'
                        ? styles.statusAcceptedText
                        : item.status === 'UNDER_REVIEW'
                        ? styles.statusReviewText
                        : styles.statusDeclinedText,
                    ]}
                  >
                    {item.status === 'ACCEPTED'
                      ? '✓ ACCEPTED'
                      : item.status === 'UNDER_REVIEW'
                      ? 'PENDING'
                      : 'CLOSED'}
                  </Text>
                </View>
              </View>

              {/* Price & Turnaround Row */}
              <View style={styles.priceRow}>
                <View>
                  <Text style={styles.priceLabel}>Your Quoted Price</Text>
                  <Text style={styles.priceValue}>{formatCurrency(item.quotedAmount)}</Text>
                </View>

                <View style={styles.durationCol}>
                  <Text style={styles.priceLabel}>Est. Timeline</Text>
                  <Text style={styles.durationValue}>
                    {item.estimatedDays} {item.estimatedDays === 1 ? 'day' : 'days'}
                  </Text>
                </View>
              </View>

              {/* Activity Notice */}
              {item.lastClientActivity && (
                <View style={styles.activityBox}>
                  <Text style={styles.activityText}>ℹ️ {item.lastClientActivity}</Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                {item.status === 'ACCEPTED' ? (
                  <TouchableOpacity
                    style={styles.contractBtn}
                    onPress={() => onOpenAcceptedContract?.(item.contractId)}
                  >
                    <Text style={styles.contractBtnText}>Open Contract Workspace ›</Text>
                  </TouchableOpacity>
                ) : item.status === 'UNDER_REVIEW' ? (
                  <View style={{ flexDirection: 'row', gap: 10, flex: 1 }}>
                    <TouchableOpacity
                      style={styles.editBidBtn}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setEditingProposal({
                          proposalId: item.id,
                          jobId: item.jobId,
                          jobTitle: item.jobTitle,
                          currentBidAmount: item.quotedAmount,
                          currentTurnaroundDays: item.estimatedDays,
                          currentCoverLetter: item.coverLetter || '',
                        });
                      }}
                    >
                      <Text style={styles.editBidBtnText}>Edit Bid</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.withdrawBtn}
                      onPress={() => handleWithdraw(item.id)}
                    >
                      <Text style={styles.withdrawBtnText}>Withdraw</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* EDIT PROPOSAL MODAL */}
      <EditProposalModal
        visible={!!editingProposal}
        onClose={() => setEditingProposal(null)}
        proposal={editingProposal}
        onSaveProposal={async (data) => {
          await ProposalService.updateProposal(data.proposalId, {
            bidAmount: data.bidAmount,
            durationDays: data.turnaroundDays,
            coverLetter: data.coverLetter,
          });
          await loadProposals(true);
        }}
      />

      {/* PROPOSAL DETAILS MODAL */}
      <ProposalDetailsModal
        visible={!!selectedDetailProposal}
        onClose={() => setSelectedDetailProposal(null)}
        proposal={selectedDetailProposal}
        onEditProposal={(prop) => {
          setEditingProposal({
            proposalId: prop.id,
            jobId: prop.jobId,
            jobTitle: prop.jobTitle,
            currentBidAmount: prop.bidAmount,
            currentTurnaroundDays: prop.turnaroundDays,
            currentCoverLetter: prop.coverLetter,
          });
        }}
        onWithdrawProposal={async (id) => {
          await handleWithdraw(id);
        }}
        onViewJob={onViewJob}
      />
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  countText: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
    borderRadius: radius.md,
    padding: 3,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  tabLabel: {
    fontSize: typography.size.xs,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  tabLabelActive: {
    color: colors.brand.forest,
    fontWeight: '800',
  },
  alertDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  acceptedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand.emerald,
  },
  listContent: {
    paddingHorizontal: spacing.base,
    paddingTop: 14,
    paddingBottom: 40,
    gap: 12,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: 12,
    fontSize: typography.size.sm,
    color: colors.neutral[600],
    fontWeight: '500',
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: typography.size.base,
    fontWeight: '800',
    color: colors.neutral[900],
    marginBottom: 4,
  },
  errorSub: {
    fontSize: typography.size.xs,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: colors.brand.forest,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: typography.size.sm,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: typography.size.base,
    fontWeight: '800',
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  jobTitle: {
    fontSize: typography.size.base,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  clientSub: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusAccepted: {
    backgroundColor: '#DCFCE7',
  },
  statusReview: {
    backgroundColor: '#FEF3C7',
  },
  statusDeclined: {
    backgroundColor: '#F3F4F6',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusAcceptedText: {
    color: colors.brand.emeraldDark,
  },
  statusReviewText: {
    color: '#B45309',
  },
  statusDeclinedText: {
    color: colors.neutral[500],
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    paddingBottom: 10,
  },
  priceLabel: {
    fontSize: 10,
    color: colors.neutral[500],
  },
  priceValue: {
    fontSize: typography.size.base,
    fontWeight: '900',
    color: colors.brand.forest,
    marginTop: 2,
  },
  durationCol: {
    alignItems: 'flex-end',
  },
  durationValue: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: colors.neutral[800],
    marginTop: 2,
  },
  activityBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    padding: 8,
    marginTop: 10,
  },
  activityText: {
    fontSize: 11,
    color: colors.neutral[600],
  },
  actionsRow: {
    marginTop: 12,
  },
  contractBtn: {
    backgroundColor: colors.brand.forest,
    paddingVertical: 10,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  contractBtnText: {
    color: '#FFFFFF',
    fontSize: typography.size.xs + 1,
    fontWeight: '800',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: radius.full,
    paddingHorizontal: spacing.base,
    paddingVertical: 8,
    marginHorizontal: spacing.base,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.neutral[900],
    padding: 0,
  },
  editBidBtn: {
    flex: 1,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingVertical: 8,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  editBidBtnText: {
    color: colors.brand.emeraldDark,
    fontSize: typography.size.xs,
    fontWeight: '700',
  },
  withdrawBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    paddingVertical: 8,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  withdrawBtnText: {
    color: '#EF4444',
    fontSize: typography.size.xs,
    fontWeight: '700',
  },
});
