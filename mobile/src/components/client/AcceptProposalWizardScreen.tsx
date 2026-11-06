import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Award, Check, CheckCircle2, ShieldCheck, Lock, Star, ChevronLeft } from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows, useTheme } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { ContractService } from '../../services/contract.service';
import { WalletService } from '../../services/wallet.service';
import { LoyaltyService } from '../../services/loyalty.service';
import { useLoyaltyStore } from '../../stores/loyaltyStore';
import { ProposalItem } from './JobDetailsAndProposalsScreen';
import { queryClient } from '../../lib/query-client';
import { useToast } from '../shared/ToastContext';

interface AcceptProposalWizardScreenProps {
  proposal?: ProposalItem;
  jobId?: string;
  onBack?: () => void;
  onSuccess?: (contractId?: string) => void;
}

export const AcceptProposalWizardScreen: React.FC<AcceptProposalWizardScreenProps> = ({
  proposal,
  jobId,
  onBack,
  onSuccess,
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const { showError, showWarning } = useToast();
  const [selectedPayment, setSelectedPayment] = useState<'PAYSTACK' | 'WALLET' | 'USDT'>('PAYSTACK');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdContractId, setCreatedContractId] = useState<string | undefined>();
  const [applyPointsDiscount, setApplyPointsDiscount] = useState<boolean>(false);

  const { points: loyaltyPoints, fetchProfile: fetchLoyaltyProfile } = useLoyaltyStore();

  React.useEffect(() => {
    fetchLoyaltyProfile().catch(() => {});
  }, [fetchLoyaltyProfile]);

  const { data: walletData } = useQuery({
    queryKey: ['my-wallet'],
    queryFn: () => WalletService.getMyWallet(),
  });
  const clientWalletBalance = Number(walletData?.balance ?? 0);

  const subtotal = proposal ? proposal.bidAmount : 0;
  const serviceFee = Math.round(subtotal * 0.03);

  // Available points can discount up to 50% of the platform escrow commission fee
  const availablePoints = loyaltyPoints.available || 0;
  const maxEligibleDiscount = Math.min(availablePoints, Math.floor(serviceFee * 0.5));
  const appliedDiscount = applyPointsDiscount ? maxEligibleDiscount : 0;

  const totalEscrow = subtotal + serviceFee - appliedDiscount;
  const isWalletSufficient = clientWalletBalance >= totalEscrow;

  const rawMilestones = (proposal as any)?.rawMilestones;
  const milestonesList = Array.isArray(rawMilestones) && rawMilestones.length > 0
    ? rawMilestones.map((m: any, idx: number) => ({
        id: m.id || `m${idx + 1}`,
        title: m.title || `Milestone ${idx + 1}`,
        amount: Number(m.amount),
        timeline: m.estimatedDays ? `${m.estimatedDays} days` : `Stage ${idx + 1}`,
      }))
    : [
        {
          id: 'm1',
          title: 'Milestone 1: Mobilization & Materials Procurement',
          amount: proposal?.partsAmount || Math.round(subtotal * 0.5),
          timeline: 'Initial Stage',
        },
        {
          id: 'm2',
          title: 'Milestone 2: Execution & Final Quality Handover',
          amount: proposal?.laborAmount || Math.round(subtotal * 0.5),
          timeline: 'Final Stage',
        },
      ];

  const proposalData = {
    artisanName: proposal?.artisanName || 'Verified Artisan',
    trade: proposal?.trade || 'Licensed Specialist',
    rating: proposal?.rating || 5.0,
    jobTitle: 'Repair Service Contract',
    subtotal,
    serviceFee,
    appliedDiscount,
    totalEscrow,
    milestones: milestonesList,
  };

  const handleConfirmAndLock = async () => {
    if (!agreeTerms) return;
    if (selectedPayment === 'WALLET' && !isWalletSufficient) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showWarning(
        'Insufficient Wallet Balance',
        `Your wallet has ${formatCurrency(clientWalletBalance)}, but ${formatCurrency(totalEscrow)} is required. Please fund your wallet or select Paystack.`
      );
      return;
    }

    setIsProcessing(true);
    try {
      if (proposal?.id) {
        // Reserve loyalty points discount if opted in
        if (applyPointsDiscount && appliedDiscount > 0) {
          const discountRef = `ESC-DISC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          try {
            await LoyaltyService.reserveEscrowDiscount(appliedDiscount, discountRef);
          } catch (discErr) {
            console.warn('Loyalty reservation notice:', discErr);
          }
        }

        const created = await ContractService.acceptProposal(proposal.id);
        if (created?.id) {
          setCreatedContractId(created.id);
        }
        await queryClient.invalidateQueries({ queryKey: ['contracts'] });
        await queryClient.invalidateQueries({ queryKey: ['client-active-contract'] });
        await queryClient.invalidateQueries({ queryKey: ['my-wallet'] });
        await queryClient.invalidateQueries({ queryKey: ['jobs'] });
        await queryClient.invalidateQueries({ queryKey: ['client-jobs'] });
        fetchLoyaltyProfile().catch(() => {});
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccessModal(true);
    } catch (err: unknown) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = apiErr.response?.data?.message || apiErr.message || 'Failed to initialize escrow contract. Please try again.';
      showError('Contract Activation Error', msg);
    } finally {
      setIsProcessing(false);
    }
  };


  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.headerBorder }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onBack?.();
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={20} color={themeColors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Fund Escrow & Hire</Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.textMuted }]}>Step 2 of 2: Contract Commitment</Text>
        </View>
        <ShieldCheck size={18} color="#10B981" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Selected Artisan Card */}
        <View style={[styles.artisanCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={[styles.avatar, isDark && { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
            <Text style={[styles.avatarText, isDark && { color: '#34D399' }]}>
              {proposalData.artisanName
                .split(' ')
                .filter(Boolean)
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'AR'}
            </Text>
          </View>
          <View style={styles.artisanInfo}>
            <Text style={[styles.artisanName, { color: themeColors.text }]}>{proposalData.artisanName}</Text>
            <Text style={[styles.trade, { color: themeColors.textMuted }]}>{proposalData.trade}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Star size={11} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.rating}>{proposalData.rating} Rating</Text>
            </View>
          </View>
        </View>

        {/* Escrow Guarantee Banner */}
        <View style={[styles.escrowBanner, isDark && { backgroundColor: 'rgba(52, 211, 153, 0.12)', borderColor: 'rgba(52, 211, 153, 0.25)' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <ShieldCheck size={16} color="#10B981" />
            <Text style={[styles.escrowBannerTitle, isDark && { color: '#34D399' }]}>Artifix Escrow Guarantee</Text>
          </View>
          <Text style={[styles.escrowBannerBody, { color: themeColors.text }]}>
            Funds are locked in a neutral escrow vault. The artisan will NOT receive payment until
            you personally inspect and approve each completed milestone.
          </Text>
        </View>

        {/* Milestone Schedule */}
        <View style={[styles.sectionCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Milestone Payment Schedule</Text>
          {proposalData.milestones.map((m, idx) => (
            <View key={m.id} style={styles.milestoneRow}>
              <View style={[styles.milestoneIndex, isDark && { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
                <Text style={[styles.milestoneIndexText, isDark && { color: '#34D399' }]}>{idx + 1}</Text>
              </View>
              <View style={styles.milestoneDetails}>
                <Text style={[styles.milestoneTitle, { color: themeColors.text }]}>{m.title}</Text>
                <Text style={[styles.milestoneTimeline, { color: themeColors.textMuted }]}>Due: {m.timeline}</Text>
              </View>
              <Text style={[styles.milestoneAmount, { color: isDark ? '#34D399' : themeColors.text }]}>{formatCurrency(m.amount)}</Text>
            </View>
          ))}

          {/* Pricing Ledger */}
          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: themeColors.textMuted }]}>Artisan Fee (Milestones)</Text>
            <Text style={[styles.summaryValue, { color: themeColors.text }]}>{formatCurrency(proposalData.subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: themeColors.textMuted }]}>Escrow Protection & Platform (3%)</Text>
            <Text style={[styles.summaryValue, { color: themeColors.text }]}>{formatCurrency(proposalData.serviceFee)}</Text>
          </View>

          {/* Loyalty Points Discount Option */}
          {maxEligibleDiscount > 0 && (
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.loyaltyDiscountBox,
                isDark && { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' },
                applyPointsDiscount && [
                  styles.loyaltyDiscountBoxActive,
                  isDark && { backgroundColor: 'rgba(52, 211, 153, 0.12)', borderColor: 'rgba(52, 211, 153, 0.3)' },
                ],
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setApplyPointsDiscount((prev) => !prev);
              }}
            >
              <View style={styles.loyaltyDiscountLeft}>
                <View style={[styles.loyaltyIconBadge, applyPointsDiscount && styles.loyaltyIconBadgeActive]}>
                  <Sparkles size={16} color={applyPointsDiscount ? '#059669' : '#D97706'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.loyaltyDiscountTitle, { color: themeColors.text }]}>
                    Redeem {maxEligibleDiscount} Points
                  </Text>
                  <Text style={[styles.loyaltyDiscountSub, { color: themeColors.textMuted }]}>
                    Balance: {availablePoints} pts • Save ₦{maxEligibleDiscount.toLocaleString()} (50% fee off)
                  </Text>
                </View>
              </View>
              <View style={[styles.loyaltyCheckbox, applyPointsDiscount && styles.loyaltyCheckboxActive]}>
                {applyPointsDiscount && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
              </View>
            </TouchableOpacity>
          )}

          {applyPointsDiscount && appliedDiscount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: '#059669', fontWeight: '600' }]}>
                Loyalty Points Discount
              </Text>
              <Text style={[styles.summaryValue, { color: '#059669', fontWeight: '700' }]}>
                -{formatCurrency(appliedDiscount)}
              </Text>
            </View>
          )}

          <View style={[styles.totalRow, { borderTopColor: themeColors.border }]}>
            <Text style={[styles.totalLabel, { color: themeColors.text }]}>Total Escrow Deposit</Text>
            <Text style={[styles.totalValue, isDark && { color: '#34D399' }]}>{formatCurrency(proposalData.totalEscrow)}</Text>
          </View>
        </View>

        {/* Payment Channels */}
        <View style={[styles.sectionCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Select Funding Source</Text>

          {/* Paystack Card */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border },
              selectedPayment === 'PAYSTACK' && [
                styles.paymentOptionActive,
                isDark && { backgroundColor: 'rgba(52, 211, 153, 0.12)', borderColor: themeColors.primary },
              ],
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedPayment('PAYSTACK');
            }}
          >
            <View style={styles.radio}>
              {selectedPayment === 'PAYSTACK' && <View style={styles.radioDot} />}
            </View>
            <View style={styles.paymentInfo}>
              <Text style={[styles.paymentTitle, { color: themeColors.text }]}>Debit Card / Bank Transfer (Paystack)</Text>
              <Text style={[styles.paymentSub, { color: themeColors.textMuted }]}>Instant lock with Mastercard, Visa, Verve</Text>
            </View>
            <Text style={[styles.paymentTag, { backgroundColor: themeColors.surfaceSubtle, color: themeColors.textMuted }]}>Instant</Text>
          </TouchableOpacity>

          {/* Artifix Wallet */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border },
              selectedPayment === 'WALLET' && [
                styles.paymentOptionActive,
                isDark && { backgroundColor: 'rgba(52, 211, 153, 0.12)', borderColor: themeColors.primary },
              ],
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedPayment('WALLET');
            }}
          >
            <View style={styles.radio}>
              {selectedPayment === 'WALLET' && <View style={styles.radioDot} />}
            </View>
            <View style={styles.paymentInfo}>
              <Text style={[styles.paymentTitle, { color: themeColors.text }]}>Artifix In-App Wallet</Text>
              <Text style={[styles.paymentSub, { color: themeColors.textMuted }]}>Available Balance: {formatCurrency(clientWalletBalance)}</Text>
            </View>
            <Text style={[styles.walletReadyTag, !isWalletSufficient && { backgroundColor: '#FEE2E2', color: '#DC2626' }]}>
              {isWalletSufficient ? 'Sufficient' : 'Top-Up Needed'}
            </Text>
          </TouchableOpacity>

          {/* Web3 / USDT */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border },
              selectedPayment === 'USDT' && [
                styles.paymentOptionActive,
                isDark && { backgroundColor: 'rgba(52, 211, 153, 0.12)', borderColor: themeColors.primary },
              ],
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedPayment('USDT');
            }}
          >
            <View style={styles.radio}>
              {selectedPayment === 'USDT' && <View style={styles.radioDot} />}
            </View>
            <View style={styles.paymentInfo}>
              <Text style={[styles.paymentTitle, { color: themeColors.text }]}>Crypto Stablecoin (USDT / USDC)</Text>
              <Text style={[styles.paymentSub, { color: themeColors.textMuted }]}>Polygon Network Smart Contract Escrow</Text>
            </View>
            <Text style={[styles.paymentTag, { backgroundColor: themeColors.surfaceSubtle, color: themeColors.textMuted }]}>Web3</Text>
          </TouchableOpacity>
        </View>

        {/* Agreement Checkbox */}
        <TouchableOpacity
          style={styles.termsRow}
          onPress={() => {
            Haptics.selectionAsync();
            setAgreeTerms(!agreeTerms);
          }}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, agreeTerms && styles.checkboxActive]}>
            {agreeTerms && <Check size={12} color="#FFFFFF" strokeWidth={2.8} />}
          </View>
          <Text style={[styles.termsText, { color: themeColors.textMuted }]}>
            I authorize Artifix to lock {formatCurrency(proposalData.totalEscrow)} into the secure
            escrow smart contract until milestone completion is verified.
          </Text>
        </TouchableOpacity>

        {/* Submit CTA */}
        <TouchableOpacity
          style={[styles.submitButton, (!agreeTerms || isProcessing) && styles.submitButtonDisabled]}
          onPress={handleConfirmAndLock}
          disabled={!agreeTerms || isProcessing}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>
            {isProcessing
              ? 'Locking in Escrow...'
              : `Lock ${formatCurrency(proposalData.totalEscrow)} & Activate Job`}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: themeColors.surface }]}>
            <View style={styles.modalIconBox}>
              <CheckCircle2 size={36} color="#10B981" strokeWidth={2} />
            </View>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Escrow Locked & Job Started!</Text>
            <Text style={[styles.modalBody, { color: themeColors.textMuted }]}>
              {formatCurrency(proposalData.totalEscrow)} has been securely vaulted. {proposalData.artisanName} has been notified and is preparing to head to your location.
            </Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => {
                setShowSuccessModal(false);
                onSuccess?.(createdContractId);
              }}
            >
              <Text style={styles.modalBtnText}>Open Job Workspace & Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  backBtnText: {
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
  secureBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  secureBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  artisanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: 'bold',
  },
  artisanInfo: {
    flex: 1,
  },
  artisanName: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  trade: {
    ...typography.caption,
    color: colors.textMuted,
  },
  rating: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '600',
    marginTop: 2,
  },
  escrowBanner: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  escrowBannerTitle: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  escrowBannerBody: {
    ...typography.caption,
    color: colors.text,
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  milestoneIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  milestoneIndexText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
  },
  milestoneDetails: {
    flex: 1,
  },
  milestoneTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  milestoneTimeline: {
    ...typography.caption,
    color: colors.textMuted,
  },
  milestoneAmount: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  summaryValue: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text,
  },
  totalValue: {
    ...typography.h2,
    fontWeight: 'bold',
    color: colors.primary,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    minHeight: 64,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  paymentOptionActive: {
    borderColor: colors.primary,
    backgroundColor: '#F0FDF4',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  paymentSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  paymentTag: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textMuted,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  walletReadyTag: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.primary,
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
  },
  checkboxCheck: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  termsText: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    minHeight: 52,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...typography.body,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    width: '100%',
    ...shadows.lg,
  },
  modalIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalIcon: {
    fontSize: 32,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  modalBody: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  modalBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    ...typography.body,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loyaltyDiscountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: spacing.sm,
  },
  loyaltyDiscountBoxActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  loyaltyDiscountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    marginRight: spacing.sm,
  },
  loyaltyIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loyaltyIconBadgeActive: {
    backgroundColor: '#D1FAE5',
  },
  loyaltyDiscountTitle: {
    fontSize: 13,
    fontFamily: typography.fonts.semiBold,
    color: colors.neutral[900],
  },
  loyaltyDiscountSub: {
    fontSize: 11,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[600],
    marginTop: 2,
  },
  loyaltyCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loyaltyCheckboxActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
});

