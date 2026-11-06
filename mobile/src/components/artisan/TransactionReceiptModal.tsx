import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Share,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import {
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Share2,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { useToast } from '../shared/ToastContext';

export interface WalletTransactionItem {
  id: string;
  type: 'PAYOUT' | 'ESCROW_RELEASE' | 'BONUS' | 'REFUND';
  title: string;
  amount: number;
  date: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  reference?: string;
  bankName?: string;
  accountNumber?: string;
  rail?: 'FIAT_PAYSTACK' | 'MONAD_USDC';
  fee?: number;
}

interface TransactionReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  transaction: WalletTransactionItem | null;
}

export const TransactionReceiptModal: React.FC<TransactionReceiptModalProps> = ({
  visible,
  onClose,
  transaction,
}) => {
  const { showSuccess } = useToast();

  if (!transaction) return null;

  const isCredit = transaction.type === 'ESCROW_RELEASE' || transaction.type === 'BONUS';
  const fee = transaction.fee || 0;
  const netAmount = isCredit ? transaction.amount - fee : transaction.amount;
  const refCode = transaction.reference || `TXN-${transaction.id.slice(0, 8).toUpperCase()}`;

  const handleCopyRef = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(refCode);
    showSuccess('Copied to Clipboard', `Reference ID ${refCode} copied.`);
  };

  const handleShareReceipt = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        title: 'Artifix Transaction Receipt',
        message: `Artifix Digital Receipt\nType: ${transaction.title}\nAmount: ${formatCurrency(transaction.amount)}\nStatus: ${transaction.status}\nReference: ${refCode}\nDate: ${transaction.date}`,
      });
    } catch {
      // User cancelled
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <SafeAreaView style={styles.safeContainer}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <Text style={styles.topBarTitle}>Transaction Receipt</Text>
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
            {/* Receipt Main Card */}
            <View style={styles.receiptCard}>
              {/* Status Badge */}
              <View style={styles.statusBadgeRow}>
                {transaction.status === 'COMPLETED' ? (
                  <View style={[styles.statusPill, { backgroundColor: '#10B98120', borderColor: '#10B98150' }]}>
                    <CheckCircle2 size={14} color="#10B981" />
                    <Text style={[styles.statusText, { color: '#10B981' }]}>Payment Successful</Text>
                  </View>
                ) : transaction.status === 'PENDING' ? (
                  <View style={[styles.statusPill, { backgroundColor: '#F59E0B20', borderColor: '#F59E0B50' }]}>
                    <Clock size={14} color="#F59E0B" />
                    <Text style={[styles.statusText, { color: '#F59E0B' }]}>Processing Settlement</Text>
                  </View>
                ) : (
                  <View style={[styles.statusPill, { backgroundColor: '#EF444420', borderColor: '#EF444450' }]}>
                    <AlertCircle size={14} color="#EF4444" />
                    <Text style={[styles.statusText, { color: '#EF4444' }]}>Payment Failed</Text>
                  </View>
                )}
              </View>

              {/* Amount Display */}
              <View style={styles.amountBox}>
                <View style={styles.directionIconCircle}>
                  {isCredit ? (
                    <ArrowDownLeft size={22} color="#10B981" />
                  ) : (
                    <ArrowUpRight size={22} color="#3B82F6" />
                  )}
                </View>
                <Text style={styles.amountText}>
                  {isCredit ? '+' : '-'}{formatCurrency(transaction.amount)}
                </Text>
                <Text style={styles.transactionTitle}>{transaction.title}</Text>
              </View>

              <View style={styles.dividerDashed} />

              {/* Receipt Key-Value Rows */}
              <View style={styles.detailsList}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transaction Type</Text>
                  <Text style={styles.detailVal}>
                    {transaction.type === 'ESCROW_RELEASE'
                      ? 'Milestone Escrow Payout'
                      : transaction.type === 'PAYOUT'
                      ? 'Bank Withdrawal'
                      : 'Artifix Platform Credit'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Settlement Rail</Text>
                  <View style={styles.railTag}>
                    <ShieldCheck size={12} color="#10B981" />
                    <Text style={styles.railTagText}>
                      {transaction.rail === 'MONAD_USDC' ? 'Monad USDC Escrow' : 'Instant Fiat (Paystack)'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date & Time</Text>
                  <Text style={styles.detailVal}>{transaction.date}</Text>
                </View>

                {transaction.bankName && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Destination Bank</Text>
                    <Text style={styles.detailVal}>
                      {transaction.bankName} {transaction.accountNumber ? `(••${transaction.accountNumber.slice(-4)})` : ''}
                    </Text>
                  </View>
                )}

                {fee > 0 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Platform Service Fee</Text>
                    <Text style={styles.detailVal}>-{formatCurrency(fee)}</Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Net Credited</Text>
                  <Text style={[styles.detailVal, { color: '#10B981', fontFamily: typography.fonts.bold }]}>
                    {formatCurrency(netAmount)}
                  </Text>
                </View>

                <View style={styles.dividerSolid} />

                {/* Reference ID with Copy Button */}
                <View style={styles.referenceContainer}>
                  <View style={styles.refTextCol}>
                    <Text style={styles.refLabel}>TRANSACTION REFERENCE</Text>
                    <Text style={styles.refCode}>{refCode}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleCopyRef}
                    style={styles.copyBtn}
                    activeOpacity={0.7}
                  >
                    <Copy size={16} color="#10B981" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Bottom Actions */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              onPress={handleShareReceipt}
              style={styles.shareButton}
              activeOpacity={0.8}
            >
              <Share2 size={18} color="#10B981" />
              <Text style={styles.shareButtonText}>Share Receipt</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              style={styles.doneButton}
              activeOpacity={0.8}
            >
              <Text style={styles.doneButtonText}>Done</Text>
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
  },
  receiptCard: {
    backgroundColor: '#0E291D',
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#1D4E35',
    ...shadows.md,
  },
  statusBadgeRow: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statusText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.bold,
  },
  amountBox: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  directionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: '#163E26',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  amountText: {
    fontSize: typography.sizes['2xl'],
    fontFamily: typography.fonts.bold,
    color: colors.neutral[100],
  },
  transactionTitle: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: colors.neutral[400],
    marginTop: 2,
  },
  dividerDashed: {
    height: 1,
    backgroundColor: '#1D4E35',
    marginVertical: spacing.md,
  },
  detailsList: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
  },
  detailVal: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semiBold,
    color: colors.neutral[200],
  },
  railTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B98115',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#10B98140',
  },
  railTagText: {
    fontSize: 10,
    fontFamily: typography.fonts.semiBold,
    color: '#10B981',
  },
  dividerSolid: {
    height: 1,
    backgroundColor: '#1A432E',
    marginVertical: 4,
  },
  referenceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#071A11',
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#173E28',
  },
  refTextCol: {
    flex: 1,
  },
  refLabel: {
    fontSize: 9,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[500],
    letterSpacing: 0.5,
  },
  refCode: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.bold,
    color: '#10B981',
    marginTop: 2,
  },
  copyBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: '#163E26',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: '#071A11',
    borderTopWidth: 1,
    borderTopColor: '#17402B',
  },
  shareButton: {
    flex: 1,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: '#10B98115',
    borderWidth: 1,
    borderColor: '#10B98150',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareButtonText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semiBold,
    color: '#10B981',
  },
  doneButton: {
    flex: 1,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.bold,
    color: '#071A11',
  },
});
