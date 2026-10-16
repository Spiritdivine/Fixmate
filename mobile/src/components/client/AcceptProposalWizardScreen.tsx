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
import { useQuery } from '@tanstack/react-query';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { ContractService } from '../../services/contract.service';
import { WalletService } from '../../services/wallet.service';
import { ProposalItem } from './JobDetailsAndProposalsScreen';
import { queryClient } from '../../lib/query-client';

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
  const [selectedPayment, setSelectedPayment] = useState<'PAYSTACK' | 'WALLET' | 'USDT'>('PAYSTACK');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdContractId, setCreatedContractId] = useState<string | undefined>();

  const { data: walletData } = useQuery({
    queryKey: ['my-wallet'],
    queryFn: () => WalletService.getMyWallet(),
  });
  const clientWalletBalance = Number(walletData?.balance ?? 0);

  const subtotal = proposal ? proposal.bidAmount : 0;
  const serviceFee = Math.round(subtotal * 0.03);
  const totalEscrow = subtotal + serviceFee;
  const isWalletSufficient = clientWalletBalance >= totalEscrow;

  const proposalData = {
    artisanName: proposal?.artisanName || 'Verified Artisan',
    trade: proposal?.trade || 'Licensed Specialist',
    rating: proposal?.rating || 5.0,
    jobTitle: 'Repair Service Contract',
    subtotal,
    serviceFee,
    totalEscrow,
    milestones: [
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
    ],
  };

  const handleConfirmAndLock = async () => {
    if (!agreeTerms) return;
    if (selectedPayment === 'WALLET' && !isWalletSufficient) {
      Alert.alert(
        'Insufficient Wallet Balance',
        `Your wallet has ${formatCurrency(clientWalletBalance)}, but ${formatCurrency(totalEscrow)} is required. Please fund your wallet or select Paystack.`
      );
      return;
    }

    setIsProcessing(true);
    try {
      if (jobId && proposal?.id) {
        const created = await ContractService.create({
          jobId,
          proposalId: proposal.id,
          title: proposalData.jobTitle,
          totalAmount: totalEscrow,
          milestones: proposalData.milestones.map((m) => ({
            title: m.title,
            amount: m.amount,
          })),
        });
        if (created?.id) {
          setCreatedContractId(created.id);
        }
        await queryClient.invalidateQueries({ queryKey: ['contracts'] });
        await queryClient.invalidateQueries({ queryKey: ['client-active-contract'] });
        await queryClient.invalidateQueries({ queryKey: ['my-wallet'] });
      }
      setShowSuccessModal(true);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = apiErr.response?.data?.message || apiErr.message || 'Failed to initialize escrow contract. Please try again.';
      Alert.alert('Contract Activation Error', msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Fund Escrow & Hire</Text>
          <Text style={styles.headerSubtitle}>Step 2 of 2: Contract Commitment</Text>
        </View>
        <View style={styles.secureBadge}>
          <Text style={styles.secureBadgeText}>🔒 256-Bit SSL</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Selected Artisan Card */}
        <View style={styles.artisanCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
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
            <Text style={styles.artisanName}>{proposalData.artisanName}</Text>
            <Text style={styles.trade}>{proposalData.trade}</Text>
            <Text style={styles.rating}>⭐ {proposalData.rating} Rating</Text>
          </View>
        </View>

        {/* Escrow Guarantee Banner */}
        <View style={styles.escrowBanner}>
          <Text style={styles.escrowBannerTitle}>🛡️ Fixmate Escrow Guarantee</Text>
          <Text style={styles.escrowBannerBody}>
            Funds are locked in a neutral escrow vault. The artisan will NOT receive payment until
            you personally inspect and approve each completed milestone.
          </Text>
        </View>

        {/* Milestone Schedule */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Milestone Payment Schedule</Text>
          {proposalData.milestones.map((m, idx) => (
            <View key={m.id} style={styles.milestoneRow}>
              <View style={styles.milestoneIndex}>
                <Text style={styles.milestoneIndexText}>{idx + 1}</Text>
              </View>
              <View style={styles.milestoneDetails}>
                <Text style={styles.milestoneTitle}>{m.title}</Text>
                <Text style={styles.milestoneTimeline}>Due: {m.timeline}</Text>
              </View>
              <Text style={styles.milestoneAmount}>{formatCurrency(m.amount)}</Text>
            </View>
          ))}

          {/* Pricing Ledger */}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Artisan Fee (Milestones)</Text>
            <Text style={styles.summaryValue}>{formatCurrency(proposalData.subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Escrow Protection & Platform (3%)</Text>
            <Text style={styles.summaryValue}>{formatCurrency(proposalData.serviceFee)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Escrow Deposit</Text>
            <Text style={styles.totalValue}>{formatCurrency(proposalData.totalEscrow)}</Text>
          </View>
        </View>

        {/* Payment Channels */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Select Funding Source</Text>

          {/* Paystack Card */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedPayment === 'PAYSTACK' && styles.paymentOptionActive,
            ]}
            onPress={() => setSelectedPayment('PAYSTACK')}
          >
            <View style={styles.radio}>
              {selectedPayment === 'PAYSTACK' && <View style={styles.radioDot} />}
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>Debit Card / Bank Transfer (Paystack)</Text>
              <Text style={styles.paymentSub}>Instant lock with Mastercard, Visa, Verve</Text>
            </View>
            <Text style={styles.paymentTag}>Instant</Text>
          </TouchableOpacity>

          {/* Fixmate Wallet */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedPayment === 'WALLET' && styles.paymentOptionActive,
            ]}
            onPress={() => setSelectedPayment('WALLET')}
          >
            <View style={styles.radio}>
              {selectedPayment === 'WALLET' && <View style={styles.radioDot} />}
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>Fixmate Wallet</Text>
              <Text style={styles.paymentSub}>Available Balance: {formatCurrency(clientWalletBalance)}</Text>
            </View>
            <Text style={[styles.walletReadyTag, !isWalletSufficient && { backgroundColor: '#FEE2E2', color: '#DC2626' }]}>
              {isWalletSufficient ? 'Sufficient' : 'Top-Up Needed'}
            </Text>
          </TouchableOpacity>

          {/* Web3 / USDT */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedPayment === 'USDT' && styles.paymentOptionActive,
            ]}
            onPress={() => setSelectedPayment('USDT')}
          >
            <View style={styles.radio}>
              {selectedPayment === 'USDT' && <View style={styles.radioDot} />}
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>Crypto Stablecoin (USDT / USDC)</Text>
              <Text style={styles.paymentSub}>Polygon Network Smart Contract Escrow</Text>
            </View>
            <Text style={styles.paymentTag}>Web3</Text>
          </TouchableOpacity>
        </View>

        {/* Agreement Checkbox */}
        <TouchableOpacity
          style={styles.termsRow}
          onPress={() => setAgreeTerms(!agreeTerms)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, agreeTerms && styles.checkboxActive]}>
            {agreeTerms && <Text style={styles.checkboxCheck}>✓</Text>}
          </View>
          <Text style={styles.termsText}>
            I authorize Fixmate to lock {formatCurrency(proposalData.totalEscrow)} into the secure
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
          <View style={styles.modalCard}>
            <View style={styles.modalIconBox}>
              <Text style={styles.modalIcon}>🎉</Text>
            </View>
            <Text style={styles.modalTitle}>Escrow Locked & Job Started!</Text>
            <Text style={styles.modalBody}>
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
    padding: spacing.xs,
    marginRight: spacing.sm,
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
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  paymentOptionActive: {
    borderColor: colors.primary,
    backgroundColor: '#F0FDF4',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  paymentSub: {
    ...typography.caption,
    color: colors.textMuted,
  },
  paymentTag: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textMuted,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  walletReadyTag: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.primary,
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
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
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
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
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    width: '100%',
    alignItems: 'center',
  },
  modalBtnText: {
    ...typography.body,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
