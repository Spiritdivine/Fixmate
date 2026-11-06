import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  X,
  Edit3,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  ShieldCheck,
  Clock,
} from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { useToast } from '../shared/ToastContext';

export interface ProposalMilestoneItem {
  id?: string;
  title: string;
  amount: number;
}

export interface EditableProposalData {
  proposalId: string;
  jobId: string;
  jobTitle: string;
  currentBidAmount: number;
  currentTurnaroundDays: number;
  currentCoverLetter: string;
  milestones?: ProposalMilestoneItem[];
}

interface EditProposalModalProps {
  visible: boolean;
  onClose: () => void;
  proposal: EditableProposalData | null;
  onSaveProposal: (data: {
    proposalId: string;
    bidAmount: number;
    turnaroundDays: number;
    coverLetter: string;
    milestones: ProposalMilestoneItem[];
  }) => Promise<void>;
}

export const EditProposalModal: React.FC<EditProposalModalProps> = ({
  visible,
  onClose,
  proposal,
  onSaveProposal,
}) => {
  const { showSuccess, showWarning, showError } = useToast();

  const [bidAmountText, setBidAmountText] = useState('');
  const [turnaroundDaysText, setTurnaroundDaysText] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [milestones, setMilestones] = useState<ProposalMilestoneItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state on proposal open
  React.useEffect(() => {
    if (proposal) {
      setBidAmountText(String(proposal.currentBidAmount || ''));
      setTurnaroundDaysText(String(proposal.currentTurnaroundDays || 2));
      setCoverLetter(proposal.currentCoverLetter || '');
      setMilestones(
        proposal.milestones && proposal.milestones.length > 0
          ? proposal.milestones
          : [
              { title: 'Initial diagnostics & demolition', amount: Math.floor(proposal.currentBidAmount * 0.4) },
              { title: 'Full installation & testing', amount: Math.ceil(proposal.currentBidAmount * 0.6) },
            ]
      );
    }
  }, [proposal]);

  if (!proposal) return null;

  const bidAmount = parseFloat(bidAmountText.replace(/[^0-9.]/g, '')) || 0;
  const turnaroundDays = parseInt(turnaroundDaysText.replace(/[^0-9]/g, ''), 10) || 1;

  const handleAddMilestone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMilestones((prev) => [
      ...prev,
      { title: `Milestone ${prev.length + 1}`, amount: 5000 },
    ]);
  };

  const handleRemoveMilestone = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateMilestone = (index: number, field: 'title' | 'amount', value: any) => {
    setMilestones((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSave = async () => {
    if (bidAmount <= 0) {
      showWarning('Invalid Bid', 'Please enter a valid bid amount for this job.');
      return;
    }
    if (coverLetter.trim().length < 20) {
      showWarning(
        'Pitch Required',
        'Please provide at least 20 characters explaining your technical approach.'
      );
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await onSaveProposal({
        proposalId: proposal.proposalId,
        bidAmount,
        turnaroundDays,
        coverLetter: coverLetter.trim(),
        milestones,
      });
      showSuccess('Proposal Updated', 'Your revised proposal was submitted to the homeowner.');
      onClose();
    } catch (err: any) {
      showError('Update Failed', err?.message || 'Could not update proposal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <SafeAreaView style={styles.safeContainer}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <View>
              <Text style={styles.topBarTitle}>Edit Proposal</Text>
              <Text style={styles.topBarSubtitle} numberOfLines={1}>
                {proposal.jobTitle}
              </Text>
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
            {/* Bid Amount & Turnaround Row */}
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Total Bid (₦) *</Text>
                <View style={styles.inputBox}>
                  <Text style={styles.prefixNaira}>₦</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    placeholder="35,000"
                    placeholderTextColor={colors.neutral[500]}
                    value={bidAmountText}
                    onChangeText={setBidAmountText}
                  />
                </View>
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Delivery (Days) *</Text>
                <View style={styles.inputBox}>
                  <Clock size={16} color="#10B981" />
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    placeholder="2"
                    placeholderTextColor={colors.neutral[500]}
                    value={turnaroundDaysText}
                    onChangeText={setTurnaroundDaysText}
                  />
                  <Text style={styles.suffixText}>days</Text>
                </View>
              </View>
            </View>

            {/* Cover Letter / Pitch */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Cover Letter & Strategy Pitch *</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                placeholder="Describe your tools, technical approach, and how you will resolve the issue..."
                placeholderTextColor={colors.neutral[500]}
                value={coverLetter}
                onChangeText={setCoverLetter}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>
                {coverLetter.length < 20
                  ? `${20 - coverLetter.length} more characters required`
                  : `${coverLetter.length} characters`}
              </Text>
            </View>

            {/* Milestones Schedule */}
            <View style={styles.milestonesSection}>
              <View style={styles.milestonesHeaderRow}>
                <Text style={styles.sectionTitle}>Milestone Breakdown</Text>
                <TouchableOpacity
                  onPress={handleAddMilestone}
                  style={styles.addMilestoneBtn}
                  activeOpacity={0.7}
                >
                  <Plus size={14} color="#10B981" />
                  <Text style={styles.addMilestoneText}>Add Phase</Text>
                </TouchableOpacity>
              </View>

              {milestones.map((m, idx) => (
                <View key={idx} style={styles.milestoneCard}>
                  <View style={styles.milestoneIndexBadge}>
                    <Text style={styles.milestoneIndexText}>#{idx + 1}</Text>
                  </View>

                  <View style={styles.milestoneInputCol}>
                    <TextInput
                      style={styles.milestoneTitleInput}
                      placeholder="Milestone Deliverable title..."
                      placeholderTextColor={colors.neutral[500]}
                      value={m.title}
                      onChangeText={(val) => handleUpdateMilestone(idx, 'title', val)}
                    />
                    <View style={styles.milestoneAmountRow}>
                      <Text style={styles.prefixSmall}>₦</Text>
                      <TextInput
                        style={styles.milestoneAmountInput}
                        keyboardType="numeric"
                        placeholder="Amount"
                        placeholderTextColor={colors.neutral[500]}
                        value={String(m.amount)}
                        onChangeText={(val) =>
                          handleUpdateMilestone(idx, 'amount', parseFloat(val) || 0)
                        }
                      />
                    </View>
                  </View>

                  {milestones.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveMilestone(idx)}
                      style={styles.removeMilestoneBtn}
                    >
                      <Trash2 size={15} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Bottom Action Footer */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSubmitting}
              style={[styles.saveBtn, isSubmitting && styles.saveBtnDisabled]}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#071A11" />
              ) : (
                <>
                  <ShieldCheck size={18} color="#071A11" />
                  <Text style={styles.saveBtnText}>
                    Save & Submit Revised Bid ({formatCurrency(bidAmount)})
                  </Text>
                </>
              )}
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
    maxWidth: 240,
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
  formRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  formGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semiBold,
    color: colors.neutral[300],
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E291D',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#1D4E35',
    paddingHorizontal: spacing.sm,
    height: 48,
    gap: 6,
  },
  prefixNaira: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.bold,
    color: '#10B981',
  },
  suffixText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
  },
  textInput: {
    flex: 1,
    height: '100%',
    color: colors.neutral[100],
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.semiBold,
  },
  textArea: {
    backgroundColor: '#0E291D',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#1D4E35',
    padding: spacing.sm,
    height: 100,
    color: colors.neutral[100],
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
  },
  charCount: {
    fontSize: 10,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
    textAlign: 'right',
  },
  milestonesSection: {
    gap: spacing.sm,
  },
  milestonesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[200],
  },
  addMilestoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addMilestoneText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semiBold,
    color: '#10B981',
  },
  milestoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E291D',
    borderRadius: radius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#1D4E35',
    gap: spacing.sm,
  },
  milestoneIndexBadge: {
    width: 28,
    height: 28,
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
  milestoneInputCol: {
    flex: 1,
    gap: 4,
  },
  milestoneTitleInput: {
    color: colors.neutral[100],
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    padding: 0,
  },
  milestoneAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  prefixSmall: {
    fontSize: 11,
    fontFamily: typography.fonts.bold,
    color: '#10B981',
  },
  milestoneAmountInput: {
    color: '#10B981',
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.bold,
    padding: 0,
  },
  removeMilestoneBtn: {
    padding: 6,
  },
  bottomBar: {
    padding: spacing.md,
    backgroundColor: '#071A11',
    borderTopWidth: 1,
    borderTopColor: '#17402B',
  },
  saveBtn: {
    height: 50,
    borderRadius: radius.xl,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.bold,
    color: '#071A11',
  },
});
