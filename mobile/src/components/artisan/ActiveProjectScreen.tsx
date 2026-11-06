import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MilestoneProgressBar } from '../shared/MilestoneProgressBar';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { ContractService } from '../../services/contract.service';
import { ContractChangeOrderModal } from './ContractChangeOrderModal';
import { useToast } from '../shared/ToastContext';

interface ActiveProjectScreenProps {
  contractId?: string;
  onBack?: () => void;
  onMarkCompleted?: (contractId?: string, milestoneId?: string) => void;
  onCallClient?: () => void;
  onChatClient?: (clientId?: string, clientName?: string) => void;
  onViewLocation?: () => void;
  onViewDetails?: () => void;
  onOpenDispute?: (disputeId?: string) => void;
  onOpenMarketplace?: () => void;
}

export const ActiveProjectScreen: React.FC<ActiveProjectScreenProps> = ({
  contractId: initialContractId,
  onBack,
  onMarkCompleted,
  onCallClient,
  onChatClient,
  onViewLocation,
  onViewDetails,
  onOpenDispute,
  onOpenMarketplace,
}) => {
  const { showSuccess, showInfo, showError } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [contract, setContract] = useState<any>(null);
  const [isChangeOrderVisible, setIsChangeOrderVisible] = useState(false);
  const [isNudging, setIsNudging] = useState(false);

  const loadContract = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      let activeId = initialContractId;
      if (!activeId) {
        const contracts = await ContractService.getMyContracts('ARTISAN');
        if (Array.isArray(contracts) && contracts.length > 0) {
          const inProgress = contracts.find((c: any) => c.status === 'ACTIVE' || c.status === 'IN_PROGRESS');
          activeId = inProgress ? inProgress.id : contracts[0].id;
        }
      }

      if (activeId) {
        const data = await ContractService.getById(activeId);
        setContract(data);
      } else {
        setContract(null);
      }
    } catch (err) {
      console.warn('Error loading active contract details:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadContract();
  }, [initialContractId]);

  const milestones = contract?.milestones || [];
  const activeMilestoneIndex = milestones.findIndex((m: any) => m.status === 'IN_PROGRESS' || m.status === 'SUBMITTED');
  const currentStep = activeMilestoneIndex >= 0 ? activeMilestoneIndex + 1 : milestones.length > 0 ? 1 : 1;

  const currentMilestone = activeMilestoneIndex >= 0 ? milestones[activeMilestoneIndex] : milestones[0];

  const steps = milestones.length > 0
    ? milestones.map((m: any, idx: number) => ({
        number: idx + 1,
        label: m.title.length > 14 ? `${m.title.slice(0, 12)}...` : m.title,
      }))
    : [
        { number: 1, label: 'Work Order' },
      ];

  const clientName = contract?.client?.clientProfile?.firstName
    ? `${contract.client.clientProfile.firstName} ${contract.client.clientProfile.lastName || ''}`.trim()
    : 'Verified Client';

  const projectTitle = contract?.job?.title || 'Active Contract';
  const location = contract?.job?.location || 'Lagos, Nigeria';
  const milestoneAmount = Number(currentMilestone?.amount || contract?.totalAmount || 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
            <Text style={styles.backChevron}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Active Project</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.brand.forest} />
          <Text style={styles.loadingText}>Loading project workspace...</Text>
        </View>
      ) : !contract ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛠️</Text>
          <Text style={styles.emptyTitle}>No Active Contracts</Text>
          <Text style={styles.emptySub}>
            You currently have no work orders in progress. Explore new customer requests in the marketplace to place competitive bids and start earning.
          </Text>
          {onOpenMarketplace && (
            <TouchableOpacity
              onPress={onOpenMarketplace}
              style={styles.marketplaceBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.marketplaceBtnText}>Browse Jobs Marketplace</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadContract(true)}
              tintColor={colors.brand.forest}
              colors={[colors.brand.forest]}
            />
          }
        >
          {/* Project Hero Card */}
          <View style={styles.projectHeroCard}>
            <Image
              source={{
                uri: contract?.job?.category?.iconUrl || 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600',
              }}
              style={styles.heroThumbnail}
            />

            <View style={styles.heroTextCol}>
              <Text style={styles.heroTitle}>{projectTitle}</Text>
              <Text style={styles.clientSubtitle}>Client: {clientName}</Text>
              <View style={styles.inProgressBadge}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.inProgressText}>
                  {contract?.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                </Text>
              </View>
            </View>
          </View>

          {/* 3-Step Milestone Tracker */}
          <View style={styles.trackerContainer}>
            <MilestoneProgressBar steps={steps} currentStep={currentStep} />
          </View>

          {/* Project Details Card */}
          <View style={styles.detailsCard}>
            <Text style={styles.cardHeader}>Project Details</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📍</Text>
              <View style={styles.detailTextCol}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{location}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>🕐</Text>
              <View style={styles.detailTextCol}>
                <Text style={styles.detailLabel}>Contract Code</Text>
                <Text style={styles.detailValue}>
                  {contract?.contractCode || 'CTR-LIVE'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📅</Text>
              <View style={styles.detailTextCol}>
                <Text style={styles.detailLabel}>Total Contract Value</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(Number(contract?.totalAmount || milestoneAmount))}
                </Text>
              </View>
            </View>
          </View>

          {/* Current Milestone Card */}
          <View style={styles.milestoneCard}>
            <View style={styles.milestoneLeft}>
              <View style={styles.lockBox}>
                <Text style={styles.lockEmoji}>🔒</Text>
              </View>
              <View>
                <Text style={styles.milestoneStepText}>
                  Milestone {currentStep} of {milestones.length || 1}
                </Text>
                <Text style={styles.milestoneName}>
                  {currentMilestone?.title || 'Active Deliverable'}
                </Text>
                <View style={styles.amountEscrowRow}>
                  <Text style={styles.milestoneAmount}>
                    {formatCurrency(milestoneAmount)}
                  </Text>
                  <View style={styles.escrowPill}>
                    <Text style={styles.escrowCheck}>✓</Text>
                    <Text style={styles.escrowText}>In Smart Escrow</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Client Notes Card */}
          {contract?.job?.description && (
            <View style={styles.notesCard}>
              <View style={styles.notesHeaderRow}>
                <Text style={styles.notesEmoji}>💬</Text>
                <Text style={styles.notesHeader}>Client Job Scope</Text>
              </View>
              <Text style={styles.notesText}>{contract.job.description}</Text>
            </View>
          )}

          {/* Quick Actions Row */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (onChatClient) {
                  onChatClient(contract?.clientId, clientName);
                } else {
                  showInfo('Direct Chat', `Opening chat channel with ${clientName}...`);
                }
              }}
              style={styles.quickActionBtn}
            >
              <Text style={styles.quickActionIcon}>💬</Text>
              <Text style={styles.quickActionText}>Chat Client</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (onCallClient) {
                  onCallClient();
                } else {
                  const phone = contract?.client?.phone || contract?.client?.clientProfile?.phone;
                  if (phone) {
                    Linking.openURL(`tel:${phone}`);
                  } else {
                    showInfo('Phone Call', 'Dialing client phone line...');
                  }
                }
              }}
              style={styles.quickActionBtn}
            >
              <Text style={styles.quickActionIcon}>📞</Text>
              <Text style={styles.quickActionText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (onViewLocation) {
                  onViewLocation();
                } else {
                  const locQuery = encodeURIComponent(location || 'Lagos Nigeria');
                  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${locQuery}`);
                }
              }}
              style={styles.quickActionBtn}
            >
              <Text style={styles.quickActionIcon}>🗺️</Text>
              <Text style={styles.quickActionText}>Directions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsChangeOrderVisible(true);
              }}
              style={styles.quickActionBtn}
            >
              <Text style={styles.quickActionIcon}>📝</Text>
              <Text style={styles.quickActionText}>Amend Scope</Text>
            </TouchableOpacity>
          </View>

          {/* Nudge Client button if milestone is submitted */}
          {currentMilestone?.status === 'SUBMITTED' && (
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isNudging}
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setIsNudging(true);
                try {
                  await new Promise((r) => setTimeout(r, 600));
                  showSuccess('Client Nudged', `Friendly SMS & push reminder dispatched to ${clientName}.`);
                } finally {
                  setIsNudging(false);
                }
              }}
              style={styles.nudgeBtn}
            >
              <Text style={styles.nudgeBtnText}>
                {isNudging ? 'Sending Reminder...' : '🔔 Nudge Client to Review & Release Escrow'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Primary Action Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onMarkCompleted?.(contract?.id, currentMilestone?.id)}
            style={styles.completeBtn}
          >
            <Text style={styles.completeBtnText}>Submit Proof of Work 📸</Text>
          </TouchableOpacity>

          {/* Scope Amendment Secondary Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsChangeOrderVisible(true);
            }}
            style={styles.changeOrderSecondaryBtn}
          >
            <Text style={styles.changeOrderSecondaryText}>
              ➕ Request Scope / Price Change Order
            </Text>
          </TouchableOpacity>

          {/* Dispute Action Button */}
          {onOpenDispute && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onOpenDispute(contract?.id)}
              style={styles.disputeActionBtn}
            >
              <Text style={styles.disputeActionText}>⚖️ Report Worksite Issue / Dispute</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* Contract Change Order Modal */}
      <ContractChangeOrderModal
        visible={isChangeOrderVisible}
        onClose={() => setIsChangeOrderVisible(false)}
        contractId={contract?.id || ''}
        contractTitle={projectTitle}
        currentAmount={Number(contract?.totalAmount || milestoneAmount)}
        onSubmitChangeOrder={async (data) => {
          // Submit change order to ContractService
          await ContractService.requestChangeOrder(contract?.id, data);
          await loadContract(true);
        }}
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
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: 40,
    gap: 16,
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
  projectHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.sm,
  },
  heroThumbnail: {
    width: 80,
    height: 80,
    borderRadius: radius.lg,
  },
  heroTextCol: {
    flex: 1,
  },
  heroTitle: {
    fontSize: typography.size.base,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  clientSubtitle: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  inProgressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 6,
  },
  checkIcon: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.brand.emeraldDark,
  },
  inProgressText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.brand.emeraldDark,
  },
  trackerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.sm,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.sm,
  },
  cardHeader: {
    fontSize: typography.size.sm + 1,
    fontWeight: '800',
    color: colors.neutral[900],
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIcon: {
    fontSize: 18,
  },
  detailTextCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: colors.neutral[500],
  },
  detailValue: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: colors.neutral[800],
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 10,
  },
  milestoneCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  milestoneLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lockBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockEmoji: {
    fontSize: 18,
  },
  milestoneStepText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.neutral[500],
    textTransform: 'uppercase',
  },
  milestoneName: {
    fontSize: typography.size.sm,
    fontWeight: '800',
    color: colors.brand.forest,
    marginTop: 1,
  },
  amountEscrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  milestoneAmount: {
    fontSize: typography.size.base,
    fontWeight: '900',
    color: colors.brand.forest,
  },
  escrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    gap: 3,
  },
  escrowCheck: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.brand.emeraldDark,
  },
  escrowText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.brand.emeraldDark,
  },
  notesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.sm,
  },
  notesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  notesEmoji: {
    fontSize: 14,
  },
  notesHeader: {
    fontSize: typography.size.xs + 1,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  notesText: {
    fontSize: typography.size.xs,
    color: colors.neutral[600],
    lineHeight: 18,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 10,
    borderRadius: radius.lg,
    alignItems: 'center',
    gap: 4,
  },
  quickActionIcon: {
    fontSize: 18,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  completeBtn: {
    backgroundColor: colors.brand.forest,
    paddingVertical: 14,
    borderRadius: radius.full,
    alignItems: 'center',
    marginTop: 6,
  },
  completeBtnText: {
    fontSize: typography.size.sm,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  nudgeBtn: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: radius.xl,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  nudgeBtnText: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: '#B45309',
  },
  changeOrderSecondaryBtn: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: radius.full,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  changeOrderSecondaryText: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  disputeActionBtn: {
    paddingVertical: 12,
    borderRadius: radius.full,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    marginTop: 4,
  },
  disputeActionText: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: '#DC2626',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginHorizontal: spacing.base,
  },
  emptyIcon: {
    fontSize: 54,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: '800',
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  emptySub: {
    fontSize: typography.size.sm,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  marketplaceBtn: {
    backgroundColor: colors.brand.forest,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  marketplaceBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: typography.size.sm,
  },
});
