import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Trash2,
  Briefcase,
  ShieldCheck,
  Calendar,
  ExternalLink,
} from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { useToast } from '../shared/ToastContext';

export interface DetailedProposalRecord {
  id: string;
  jobId: string;
  jobTitle: string;
  clientName: string;
  bidAmount: number;
  clientBudget?: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  submittedDate: string;
  turnaroundDays: number;
  coverLetter: string;
  milestones?: Array<{
    id?: string;
    title: string;
    amount: number;
  }>;
}

interface ProposalDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  proposal: DetailedProposalRecord | null;
  onEditProposal?: (proposal: DetailedProposalRecord) => void;
  onWithdrawProposal?: (proposalId: string) => Promise<void>;
  onViewJob?: (jobId: string) => void;
}

export const ProposalDetailsModal: React.FC<ProposalDetailsModalProps> = ({
  visible,
  onClose,
  proposal,
  onEditProposal,
  onWithdrawProposal,
  onViewJob,
}) => {
  const { showSuccess, showWarning, showError } = useToast();

  if (!proposal) return null;

  const handleWithdraw = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      if (onWithdrawProposal) {
        await onWithdrawProposal(proposal.id);
        showSuccess('Bid Withdrawn', 'Your proposal was retracted from the client.');
        onClose();
      }
    } catch (err: any) {
      showError('Action Failed', err?.message || 'Could not withdraw proposal.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <SafeAreaView style={styles.safeContainer}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <View>
              <Text style={styles.topBarTitle}>Proposal Details</Text>
              <Text style={styles.topBarSubtitle}>Submitted on {proposal.submittedDate}</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              style={styles.closeIconButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={20} color={colors.neutral[300]} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header Card */}
            <View style={styles.headerCard}>
              <View style={styles.statusRow}>
                {proposal.status === 'ACCEPTED' ? (
                  <View style={[styles.statusPill, { backgroundColor: '#10B98120', borderColor: '#10B98150' }]}>
                    <CheckCircle2 size={13} color="#10B981" />
                    <Text style={[styles.statusText, { color: '#10B981' }]}>Proposal Accepted</Text>
                  </View>
                ) : proposal.status === 'PENDING' ? (
                  <View style={[styles.statusPill, { backgroundColor: '#F59E0B20', borderColor: '#F59E0B50' }]}>
                    <Clock size={13} color="#F59E0B" />
                    <Text style={[styles.statusText, { color: '#F59E0B' }]}>Awaiting Client Review</Text>
                  </View>
                ) : proposal.status === 'WITHDRAWN' ? (
                  <View style={[styles.statusPill, { backgroundColor: '#6B728020', borderColor: '#6B728050' }]}>
                    <AlertCircle size={13} color="#9CA3AF" />
                    <Text style={[styles.statusText, { color: '#9CA3AF' }]}>Bid Withdrawn</Text>
                  </View>
                ) : (
                  <View style={[styles.statusPill, { backgroundColor: '#EF444420', borderColor: '#EF444450' }]}>
                    <AlertCircle size={13} color="#EF4444" />
                    <Text style={[styles.statusText, { color: '#EF4444' }]}>Not Selected</Text>
                  </View>
                )}

                {onViewJob && (
                  <TouchableOpacity
                    onPress={() => {
                      onClose();
                      onViewJob(proposal.jobId);
                    }}
                    style={styles.viewJobLink}
                  >
                    <Text style={styles.viewJobLinkText}>View Job</Text>
                    <ExternalLink size={12} color="#10B981" />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.jobTitle}>{proposal.jobTitle}</Text>
              <Text style={styles.clientSubtitle}>Client: {proposal.clientName}</Text>

              {/* Financial Box */}
              <View style={styles.financialRow}>
                <View style={styles.finCol}>
                  <Text style={styles.finLabel}>Your Placed Bid</Text>
                  <Text style={styles.finBidAmount}>{formatCurrency(proposal.bidAmount)}</Text>
                </View>

                <View style={styles.finDivider} />

                <View style={styles.finCol}>
                  <Text style={styles.finLabel}>Client Budget</Text>
                  <Text style={styles.finBudgetVal}>
                    {proposal.clientBudget ? formatCurrency(proposal.clientBudget) : 'Negotiable'}
                  </Text>
                </View>

                <View style={styles.finDivider} />

                <View style={styles.finCol}>
                  <Text style={styles.finLabel}>Timeline</Text>
                  <Text style={styles.finBudgetVal}>
                    {proposal.turnaroundDays} {proposal.turnaroundDays === 1 ? 'day' : 'days'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Cover Letter */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Your Pitch & Work Strategy</Text>
              <Text style={styles.coverLetterText}>{proposal.coverLetter}</Text>
            </View>

            {/* Milestones Schedule */}
            {proposal.milestones && proposal.milestones.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Milestone Schedule</Text>
                <View style={styles.milestonesList}>
                  {proposal.milestones.map((m, idx) => (
                    <View key={m.id || idx} style={styles.milestoneItem}>
                      <View style={styles.milestoneIndex}>
                        <Text style={styles.milestoneIndexText}>#{idx + 1}</Text>
                      </View>
                      <View style={styles.milestoneInfo}>
                        <Text style={styles.milestoneTitle}>{m.title}</Text>
                        <Text style={styles.milestoneAmount}>{formatCurrency(m.amount)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Escrow Guarantee Notice */}
            <View style={styles.escrowNotice}>
              <ShieldCheck size={18} color="#10B981" />
              <Text style={styles.escrowNoticeText}>
                Once accepted by the homeowner, total bid funds are locked into Artifix Smart Escrow before you commence work.
              </Text>
            </View>
          </ScrollView>

          {/* Bottom Actions */}
          <View style={styles.bottomBar}>
            {proposal.status === 'PENDING' && onEditProposal && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onClose();
                  onEditProposal(proposal);
                }}
                style={styles.editBtn}
                activeOpacity={0.8}
              >
                <Edit3 size={16} color="#10B981" />
                <Text style={styles.editBtnText}>Edit Bid</Text>
              </TouchableOpacity>
            )}

            {proposal.status === 'PENDING' && onWithdrawProposal && (
              <TouchableOpacity
                onPress={handleWithdraw}
                style={styles.withdrawBtn}
                activeOpacity={0.8}
              >
                <Trash2 size={16} color="#EF4444" />
                <Text style={styles.withdrawBtnText}>Withdraw</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              style={styles.closeDoneBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.closeDoneBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  safeContainer: {
    flex: 1,
    backgroundColor: '#071A11',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: '#0E291D',
    borderBottomWidth: 1,
    borderBottomColor: '#17402B',
  },
  topBarTitle: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[100],
  },
  topBarSubtitle: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: '#10B981',
    marginTop: 2,
  },
  closeIconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: '#163E26',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 40,
    gap: spacing.md,
  },
  headerCard: {
    backgroundColor: '#0E291D',
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#1D4E35',
    ...shadows.sm,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontFamily: typography.fonts.bold,
  },
  viewJobLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewJobLinkText: {
    fontSize: 11,
    fontFamily: typography.fonts.semiBold,
    color: '#10B981',
  },
  jobTitle: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[100],
    marginBottom: 2,
  },
  clientSubtitle: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
    marginBottom: spacing.md,
  },
  financialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#071A11',
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#18422B',
  },
  finCol: {
    alignItems: 'center',
    flex: 1,
  },
  finLabel: {
    fontSize: 10,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
    marginBottom: 2,
  },
  finBidAmount: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.bold,
    color: '#10B981',
  },
  finBudgetVal: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semiBold,
    color: colors.neutral[200],
  },
  finDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#19422C',
  },
  sectionCard: {
    backgroundColor: '#0E291D',
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#1D4E35',
  },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[300],
    marginBottom: spacing.xs,
  },
  coverLetterText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[200],
    lineHeight: 18,
  },
  milestonesList: {
    gap: 8,
    marginTop: 4,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#071A11',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#19422C',
    gap: spacing.sm,
  },
  milestoneIndex: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    backgroundColor: '#163E26',
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneIndexText: {
    fontSize: 10,
    fontFamily: typography.fonts.bold,
    color: '#10B981',
  },
  milestoneInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  milestoneTitle: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: colors.neutral[200],
  },
  milestoneAmount: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.bold,
    color: '#10B981',
  },
  escrowNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10B98115',
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#10B98140',
  },
  escrowNoticeText: {
    flex: 1,
    fontSize: 11,
    fontFamily: typography.fonts.regular,
    color: '#A7F3D0',
    lineHeight: 16,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: '#071A11',
    borderTopWidth: 1,
    borderTopColor: '#17402B',
  },
  editBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: '#10B98115',
    borderWidth: 1,
    borderColor: '#10B98150',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  editBtnText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semiBold,
    color: '#10B981',
  },
  withdrawBtn: {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    backgroundColor: '#EF444415',
    borderWidth: 1,
    borderColor: '#EF444450',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  withdrawBtnText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semiBold,
    color: '#EF4444',
  },
  closeDoneBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeDoneBtnText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.bold,
    color: '#071A11',
  },
});
