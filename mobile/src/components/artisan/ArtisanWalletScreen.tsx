import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Eye, EyeOff, ShieldCheck, Building2, Receipt } from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows, useTheme } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { WalletService } from '../../services/wallet.service';
import { TransactionReceiptModal, WalletTransactionItem } from './TransactionReceiptModal';
import { BankManagementModal, SettlementBankAccount } from './BankManagementModal';
import { useToast } from '../shared/ToastContext';

const NIGERIAN_BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '058', name: 'GTBank (Guaranty Trust)' },
  { code: '057', name: 'Zenith Bank' },
  { code: '033', name: 'United Bank for Africa (UBA)' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '090267', name: 'Kuda Bank' },
  { code: '999992', name: 'OPay' },
  { code: '999991', name: 'PalmPay' },
  { code: '221', name: 'Stanbic IBTC' },
];

interface Transaction {
  id: string;
  type: 'CREDIT_RELEASE' | 'DEBIT_PAYOUT' | 'TIP';
  title: string;
  amount: number;
  date: string;
  reference: string;
  bankName?: string;
  accountNumber?: string;
  rail?: 'FIAT_PAYSTACK' | 'MONAD_USDC';
}

interface ArtisanWalletScreenProps {
  onBack?: () => void;
  onViewProposals?: () => void;
}

export const ArtisanWalletScreen: React.FC<ArtisanWalletScreenProps> = ({ onBack, onViewProposals }) => {
  const queryClient = useQueryClient();
  const { showSuccess, showError, showWarning } = useToast();
  const { colors: themeColors, isDark } = useTheme();

  const [isBalanceMasked, setIsBalanceMasked] = useState(false);
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<WalletTransactionItem | null>(null);
  const [isBankManagementOpen, setIsBankManagementOpen] = useState(false);

  const [isPayoutModalVisible, setIsPayoutModalVisible] = useState(false);
  const [isAddBankModalVisible, setIsAddBankModalVisible] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<string>('50000');
  const [isProcessing, setIsProcessing] = useState(false);

  // Bank Account Form State
  const [selectedBankCode, setSelectedBankCode] = useState(NIGERIAN_BANKS[0].code);
  const [accountNumberInput, setAccountNumberInput] = useState('');
  const [resolvedAccountName, setResolvedAccountName] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [isSavingBank, setIsSavingBank] = useState(false);

  // Live Query: Artisan Wallet Ledger
  const { data: walletData } = useQuery({
    queryKey: ['wallet', 'artisan'],
    queryFn: () => WalletService.getMyWallet(),
  });

  // Live Query: Saved Bank Accounts
  const { data: bankAccounts } = useQuery({
    queryKey: ['wallet', 'banks'],
    queryFn: () => WalletService.getBanks(),
  });

  const availableBalance = walletData?.balance || 0;
  const lockedInEscrow = walletData?.escrowLockedBalance || 0;

  const liveTransactions: Transaction[] = walletData?.transactions && walletData.transactions.length > 0
    ? walletData.transactions.map((tx: any) => {
        let mappedType: 'CREDIT_RELEASE' | 'DEBIT_PAYOUT' | 'TIP' = 'CREDIT_RELEASE';
        const rawType = (tx.type || '').toUpperCase();
        if (rawType === 'WITHDRAWAL') mappedType = 'DEBIT_PAYOUT';
        else if (rawType === 'TIP') mappedType = 'TIP';
        else mappedType = 'CREDIT_RELEASE';

        const isDebit = mappedType === 'DEBIT_PAYOUT' || (tx.amount < 0);
        const displayAmount = isDebit ? -Math.abs(Number(tx.amount)) : Math.abs(Number(tx.amount));

        return {
          id: tx.id,
          type: mappedType,
          title: tx.description || (mappedType === 'DEBIT_PAYOUT' ? 'Withdrawal to Bank' : 'Milestone Escrow Released'),
          amount: displayAmount,
          date: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Recently',
          reference: tx.reference ? `Ref: ${tx.reference.slice(0, 10)}...` : 'Artifix Escrow',
        };
      })
    : [];

  const todayEarnings = liveTransactions
    .filter((t) => t.amount > 0 && t.type === 'CREDIT_RELEASE')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleResolveBank = async () => {
    if (accountNumberInput.trim().length !== 10) {
      showWarning('Invalid Account', 'Please enter a 10-digit NUBAN account number.');
      return;
    }

    setIsResolving(true);
    try {
      const res = await WalletService.resolveBank(accountNumberInput.trim(), selectedBankCode);
      setResolvedAccountName(res.accountName);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSuccess('Account Verified', `Resolved: ${res.accountName}`);
    } catch (err: any) {
      showError('Verification Failed', err?.response?.data?.message || 'Could not resolve account name. Please verify bank and number.');
    } finally {
      setIsResolving(false);
    }
  };

  const handleSaveBank = async () => {
    if (!resolvedAccountName) {
      showWarning('Verification Required', 'Please verify your account number first.');
      return;
    }

    setIsSavingBank(true);
    try {
      const bankObj = NIGERIAN_BANKS.find((b) => b.code === selectedBankCode) || NIGERIAN_BANKS[0];
      await WalletService.addBank({
        accountNumber: accountNumberInput.trim(),
        accountName: resolvedAccountName,
        bankCode: selectedBankCode,
        bankName: bankObj.name,
      });

      await queryClient.invalidateQueries({ queryKey: ['wallet', 'banks'] });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsAddBankModalVisible(false);
      setAccountNumberInput('');
      setResolvedAccountName('');
      showSuccess('Bank Account Linked', 'Your settlement bank account has been connected.');
    } catch (err: any) {
      showError('Error', err?.response?.data?.message || 'Failed to link bank account.');
    } finally {
      setIsSavingBank(false);
    }
  };

  const handleWithdrawal = async () => {
    const num = parseInt(payoutAmount, 10) || 0;
    if (num <= 0 || num > availableBalance) {
      showWarning('Invalid Amount', 'Please enter a valid payout amount within your available balance.');
      return;
    }

    if (!bankAccounts || bankAccounts.length === 0) {
      showWarning('No Bank Linked', 'Please link your settlement bank account before initiating a withdrawal.');
      setIsBankManagementOpen(true);
      return;
    }

    setIsProcessing(true);
    try {
      const primaryBankId = bankAccounts[0].id;
      await WalletService.requestWithdrawal({
        amount: num,
        bankAccountId: primaryBankId,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      setIsPayoutModalVisible(false);

      showSuccess(
        'Payout Initiated',
        `${formatCurrency(num)} transferred to ${bankAccounts[0].bankName}. Funds arrive within 60 seconds.`
      );
    } catch (err: any) {
      showError('Withdrawal Error', err?.response?.data?.message || err?.message || 'Could not process payout.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
              <Text style={[styles.backChevron, { color: themeColors.text }]}>←</Text>
            </TouchableOpacity>
          )}
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Earnings & Wallet</Text>
        </View>
        <Text style={[styles.badgeText, isDark && { color: '#34D399' }]}>NGN Rail Active</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* WALLET HERO CARD */}
        <View style={styles.heroCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.heroSub}>Available to Cash Out</Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsBalanceMasked(!isBalanceMasked);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {isBalanceMasked ? <EyeOff size={18} color="#A7F3D0" /> : <Eye size={18} color="#A7F3D0" />}
            </TouchableOpacity>
          </View>
          <Text style={styles.heroAmount}>
            {isBalanceMasked ? '₦ ••••••••' : formatCurrency(availableBalance)}
          </Text>

          {/* Sub balances */}
          <View style={styles.subBalancesRow}>
            <View style={styles.subPillAmber}>
              <Text style={styles.lockEmoji}>🔒</Text>
              <Text style={styles.subPillTextAmber}>
                {isBalanceMasked ? '₦ ••••' : formatCurrency(lockedInEscrow)} in Escrow
              </Text>
            </View>

            <View style={styles.subPillGreen}>
              <Text style={styles.subPillTextGreen}>
                +{isBalanceMasked ? '₦ ••••' : formatCurrency(todayEarnings)} Today
              </Text>
            </View>
          </View>

          {/* Instant Payout Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              if (!bankAccounts || bankAccounts.length === 0) {
                setIsBankManagementOpen(true);
              } else {
                setIsPayoutModalVisible(true);
              }
            }}
            style={styles.payoutButton}
          >
            <Text style={styles.payoutIcon}>🏛️</Text>
            <Text style={styles.payoutText}>Instant Payout to Bank Account</Text>
          </TouchableOpacity>
        </View>

        {/* MONAD USDC ON-CHAIN ESCROW BANNER */}
        <View style={[styles.monadBannerCard, isDark && { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={styles.monadIconCircle}>
            <ShieldCheck size={20} color="#10B981" />
          </View>
          <View style={styles.monadTextCol}>
            <View style={styles.monadHeaderRow}>
              <Text style={[styles.monadTitle, { color: themeColors.text }]}>Monad USDC Escrow Enabled</Text>
              <View style={styles.testnetBadge}>
                <Text style={styles.testnetBadgeText}>Testnet Rail</Text>
              </View>
            </View>
            <Text style={[styles.monadDesc, { color: themeColors.textMuted }]}>
              Institutional multi-sig escrow with instant programmatic milestone releases.
            </Text>
          </View>
        </View>

        {/* LINKED BANK ACCOUNT OR EMPTY CTA */}
        {bankAccounts && bankAccounts.length > 0 ? (
          <View style={[styles.bankCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={styles.bankLeft}>
              <View style={[styles.bankIconBox, { backgroundColor: isDark ? themeColors.surfaceSubtle : '#E5E7EB' }]}>
                <Text style={styles.bankEmoji}>🏦</Text>
              </View>
              <View>
                <Text style={[styles.bankName, { color: themeColors.text }]}>{bankAccounts[0].bankName}</Text>
                <Text style={[styles.bankAccount, { color: themeColors.textMuted }]}>
                  •••• {bankAccounts[0].accountNumber.slice(-4)} — {bankAccounts[0].accountName}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsBankManagementOpen(true)}
              style={[styles.changeBankBtn, isDark && { borderColor: themeColors.border }]}
            >
              <Text style={[styles.changeBankText, { color: isDark ? '#34D399' : colors.neutral[700] }]}>Manage Banks</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.noBankCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={styles.noBankLeft}>
              <Text style={styles.noBankEmoji}>🏦</Text>
              <View style={styles.noBankTextCol}>
                <Text style={[styles.noBankTitle, { color: themeColors.text }]}>No Settlement Bank Linked</Text>
                <Text style={[styles.noBankSub, { color: themeColors.textMuted }]}>Link your NUBAN account to receive instant payouts.</Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setIsBankManagementOpen(true)}
              style={styles.linkBankBtn}
            >
              <Text style={styles.linkBankText}>+ Link Bank</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* RECENT TRANSACTION LEDGER */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.xs }}>
          <Text style={[styles.ledgerHeader, { color: themeColors.text }]}>Recent Transaction History</Text>
          <Text style={{ fontSize: 11, color: themeColors.textMuted }}>Tap for digital receipt</Text>
        </View>
        <View style={[styles.transactionsList, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          {liveTransactions.length === 0 ? (
            <View style={[styles.emptyTxBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <Text style={styles.emptyTxEmoji}>💳</Text>
              <Text style={[styles.emptyTxTitle, { color: themeColors.text }]}>No Transaction History</Text>
              <Text style={[styles.emptyTxSub, { color: themeColors.textMuted }]}>
                Your earnings from released milestones and payouts will be recorded here in your immutable ledger.
              </Text>
            </View>
          ) : (
            liveTransactions.map((tx) => {
              const isPositive = tx.amount > 0;
              return (
                <TouchableOpacity
                  key={tx.id}
                  activeOpacity={0.75}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedReceiptTx({
                      id: tx.id,
                      type: tx.type === 'DEBIT_PAYOUT' ? 'PAYOUT' : 'ESCROW_RELEASE',
                      title: tx.title,
                      amount: Math.abs(tx.amount),
                      date: tx.date,
                      status: 'COMPLETED',
                      reference: tx.reference,
                      rail: 'FIAT_PAYSTACK',
                      fee: tx.type === 'DEBIT_PAYOUT' ? 50 : 0,
                      bankName: bankAccounts?.[0]?.bankName,
                      accountNumber: bankAccounts?.[0]?.accountNumber,
                    });
                  }}
                  style={[styles.txRow, { borderColor: themeColors.border }]}
                >
                  <View style={[styles.txIconBox, isPositive ? (isDark ? { backgroundColor: 'rgba(16, 185, 129, 0.2)' } : styles.txBoxGreen) : (isDark ? { backgroundColor: 'rgba(255, 255, 255, 0.08)' } : styles.txBoxGrey)]}>
                    <Text style={styles.txEmoji}>{isPositive ? '⬇️' : '⬆️'}</Text>
                  </View>

                  <View style={styles.txMiddle}>
                    <Text style={[styles.txTitle, { color: themeColors.text }]}>{tx.title}</Text>
                    <Text style={[styles.txDate, { color: themeColors.textMuted }]}>{tx.date} • {tx.reference}</Text>
                  </View>

                  <Text style={[styles.txAmount, isPositive ? { color: '#10B981' } : (isDark ? { color: '#F87171' } : styles.amountNegative)]}>
                    {isPositive ? `+${formatCurrency(tx.amount)}` : formatCurrency(tx.amount)}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* PAYOUT MODAL */}
      <Modal visible={isPayoutModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Withdraw to Bank</Text>
            <Text style={[styles.modalSub, { color: themeColors.textMuted }]}>
              Available balance: {formatCurrency(availableBalance)}
            </Text>

            {/* Input */}
            <View style={[styles.inputWrapper, { backgroundColor: themeColors.inputBg, borderColor: themeColors.inputBorder }]}>
              <Text style={[styles.nairaPrefix, { color: themeColors.text }]}>₦</Text>
              <TextInput
                style={[styles.modalInput, { color: themeColors.text }]}
                keyboardType="numeric"
                value={payoutAmount}
                onChangeText={setPayoutAmount}
                placeholderTextColor={themeColors.textMuted}
              />
            </View>

            {/* Percentage shortcuts */}
            <View style={styles.shortcutsRow}>
              <TouchableOpacity
                onPress={() => setPayoutAmount(String(Math.floor(availableBalance * 0.25)))}
                style={[styles.shortcutPill, { backgroundColor: isDark ? themeColors.surfaceSubtle : '#F3F4F6' }]}
              >
                <Text style={[styles.shortcutText, isDark && { color: '#34D399' }]}>25%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPayoutAmount(String(Math.floor(availableBalance * 0.5)))}
                style={[styles.shortcutPill, { backgroundColor: isDark ? themeColors.surfaceSubtle : '#F3F4F6' }]}
              >
                <Text style={[styles.shortcutText, isDark && { color: '#34D399' }]}>50%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPayoutAmount(String(availableBalance))}
                style={[styles.shortcutPill, { backgroundColor: isDark ? themeColors.surfaceSubtle : '#F3F4F6' }]}
              >
                <Text style={[styles.shortcutText, isDark && { color: '#34D399' }]}>100% (All)</Text>
              </TouchableOpacity>
            </View>

            {/* Fee Note */}
            <View style={[styles.feeNoteBox, isDark && { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <Text style={[styles.feeNoteText, isDark && { color: '#34D399' }]}>
                Paystack NGN payout fee: ₦50. Funds arrive within 60 seconds.
              </Text>
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setIsPayoutModalVisible(false)}
                style={[styles.cancelBtn, { backgroundColor: isDark ? themeColors.surfaceSubtle : '#F3F4F6' }]}
              >
                <Text style={[styles.cancelText, { color: themeColors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={isProcessing}
                onPress={handleWithdrawal}
                style={[styles.confirmPayoutBtn, isDark && { backgroundColor: '#059669' }]}
              >
                <Text style={styles.confirmPayoutText}>
                  {isProcessing ? 'Processing...' : 'Confirm Payout'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* TRANSACTION DIGITAL RECEIPT MODAL */}
      <TransactionReceiptModal
        visible={!!selectedReceiptTx}
        onClose={() => setSelectedReceiptTx(null)}
        transaction={selectedReceiptTx}
      />

      {/* SETTLEMENT BANK MANAGEMENT MODAL */}
      <BankManagementModal
        visible={isBankManagementOpen}
        onClose={() => setIsBankManagementOpen(false)}
        accounts={
          bankAccounts && bankAccounts.length > 0
            ? bankAccounts.map((b: any, idx: number) => ({
                id: b.id,
                bankName: b.bankName,
                accountNumber: b.accountNumber,
                accountName: b.accountName,
                isPrimary: idx === 0,
              }))
            : []
        }
        onSetPrimary={async (accId) => {
          await queryClient.invalidateQueries({ queryKey: ['wallet', 'banks'] });
        }}
        onDeleteAccount={async (accId) => {
          await queryClient.invalidateQueries({ queryKey: ['wallet', 'banks'] });
        }}
        onAddAccount={async (newAcc) => {
          const bankObj = NIGERIAN_BANKS.find((b) => b.name === newAcc.bankName) || NIGERIAN_BANKS[0];
          await WalletService.addBank({
            accountNumber: newAcc.accountNumber,
            accountName: newAcc.accountName,
            bankCode: bankObj.code,
            bankName: newAcc.bankName,
          });
          await queryClient.invalidateQueries({ queryKey: ['wallet', 'banks'] });
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
  badgeText: {
    fontSize: typography.size.xs,
    color: colors.brand.emeraldDark,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: colors.brand.forest,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginTop: spacing.base,
    ...shadows.base,
  },
  heroSub: {
    color: '#A7F3D0',
    fontSize: typography.size.xs + 1,
    fontWeight: '600',
  },
  heroAmount: {
    color: '#FFFFFF',
    fontSize: typography.size['3xl'],
    fontWeight: '900',
    marginTop: 4,
  },
  subBalancesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  subPillAmber: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 4,
  },
  lockEmoji: {
    fontSize: 10,
  },
  subPillTextAmber: {
    color: '#FDE68A',
    fontSize: 10,
    fontWeight: '700',
  },
  subPillGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  subPillTextGreen: {
    color: '#D1FAE5',
    fontSize: 10,
    fontWeight: '700',
  },
  payoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.emerald,
    paddingVertical: 12,
    borderRadius: radius.full,
    marginTop: 18,
    gap: 6,
    ...shadows.sm,
  },
  payoutIcon: {
    fontSize: 14,
  },
  payoutText: {
    color: '#FFFFFF',
    fontSize: typography.size.sm,
    fontWeight: '800',
  },
  monadBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#071A11',
    borderRadius: radius.xl,
    padding: spacing.base,
    marginTop: spacing.base,
    borderWidth: 1,
    borderColor: '#1B4731',
  },
  monadIconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: '#10B98120',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#10B98150',
  },
  monadTextCol: {
    flex: 1,
  },
  monadHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  monadTitle: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: colors.neutral[100],
  },
  testnetBadge: {
    backgroundColor: '#10B98125',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#10B98160',
  },
  testnetBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10B981',
  },
  monadDesc: {
    fontSize: 11,
    color: colors.neutral[400],
    lineHeight: 15,
  },
  bankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: radius.xl,
    padding: spacing.base,
    marginTop: spacing.base,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bankIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankEmoji: {
    fontSize: 20,
  },
  bankName: {
    fontSize: typography.size.sm + 1,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  bankAccount: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
    marginTop: 1,
  },
  changeBankBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  changeBankText: {
    fontSize: 11,
    color: colors.neutral[700],
    fontWeight: '700',
  },
  ledgerHeader: {
    fontSize: typography.size.base,
    fontWeight: '800',
    color: colors.neutral[900],
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  transactionsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    gap: 12,
  },
  txIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txBoxGreen: {
    backgroundColor: '#DCFCE7',
  },
  txBoxGrey: {
    backgroundColor: '#F3F4F6',
  },
  txEmoji: {
    fontSize: 14,
  },
  txMiddle: {
    flex: 1,
  },
  txTitle: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  txDate: {
    fontSize: 10,
    color: colors.neutral[400],
    marginTop: 2,
  },
  txAmount: {
    fontSize: typography.size.sm + 1,
    fontWeight: '900',
  },
  amountPositive: {
    color: colors.brand.emeraldDark,
  },
  amountNegative: {
    color: colors.neutral[900],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    padding: spacing.xl,
  },
  modalTitle: {
    fontSize: typography.size.lg,
    fontWeight: '900',
    color: colors.neutral[900],
  },
  modalSub: {
    fontSize: typography.size.xs + 1,
    color: colors.neutral[500],
    marginTop: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.brand.forest,
    paddingHorizontal: 12,
    marginTop: spacing.base,
  },
  nairaPrefix: {
    fontSize: typography.size.xl,
    fontWeight: '900',
    color: colors.brand.forest,
    marginRight: 6,
  },
  modalInput: {
    flex: 1,
    fontSize: typography.size.xl,
    fontWeight: '900',
    color: colors.brand.forest,
    paddingVertical: 12,
  },
  shortcutsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  shortcutPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  shortcutText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  feeNoteBox: {
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: radius.md,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  feeNoteText: {
    fontSize: 11,
    color: colors.brand.emeraldDark,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.full,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelText: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  confirmPayoutBtn: {
    flex: 1.5,
    backgroundColor: colors.brand.forest,
    paddingVertical: 14,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  confirmPayoutText: {
    fontSize: typography.size.sm,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyTxBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyTxEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTxTitle: {
    fontSize: typography.size.sm + 1,
    fontWeight: '800',
    color: colors.neutral[900],
    marginBottom: 4,
  },
  emptyTxSub: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 18,
  },
  noBankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.base,
  },
  noBankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  noBankEmoji: {
    fontSize: 24,
  },
  noBankTextCol: {
    flex: 1,
  },
  noBankTitle: {
    fontSize: typography.size.xs + 1,
    fontWeight: '800',
    color: '#92400E',
  },
  noBankSub: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
  },
  linkBankBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  linkBankText: {
    color: '#FFFFFF',
    fontSize: typography.size.xs,
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: typography.size.xs,
    fontWeight: '700',
    color: colors.neutral[700],
    marginTop: 12,
    marginBottom: 6,
  },
  bankSelectScroll: {
    maxHeight: 44,
  },
  bankChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bankChipActive: {
    backgroundColor: colors.brand.forest,
    borderColor: colors.brand.forest,
  },
  bankChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  bankChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  accountNumberRow: {
    flexDirection: 'row',
    gap: 8,
  },
  accountInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: typography.size.base,
    color: colors.neutral[900],
    fontWeight: '700',
  },
  verifyBtn: {
    backgroundColor: colors.brand.forest,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyBtnText: {
    color: '#FFFFFF',
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
  },
  verifiedNameBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: radius.md,
    padding: 10,
    marginTop: 10,
  },
  verifiedNameLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.brand.emeraldDark,
    textTransform: 'uppercase',
  },
  verifiedNameText: {
    fontSize: typography.size.sm,
    fontWeight: '800',
    color: colors.brand.forest,
    marginTop: 2,
  },
});
