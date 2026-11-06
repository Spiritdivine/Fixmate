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
  Building2,
  CheckCircle2,
  PlusCircle,
  Trash2,
  Star,
  ShieldCheck,
  CreditCard,
} from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { useToast } from '../shared/ToastContext';

export interface SettlementBankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isPrimary: boolean;
}

const SUPPORTED_BANKS = [
  'Zenith Bank',
  'GTBank (Guaranty Trust)',
  'Access Bank',
  'First Bank of Nigeria',
  'United Bank for Africa (UBA)',
  'Kuda Microfinance Bank',
  'Moniepoint MFB',
  'OPay Digital Services',
];

interface BankManagementModalProps {
  visible: boolean;
  onClose: () => void;
  accounts: SettlementBankAccount[];
  onSetPrimary: (accountId: string) => void;
  onDeleteAccount: (accountId: string) => void;
  onAddAccount: (account: Omit<SettlementBankAccount, 'id' | 'isPrimary'>) => Promise<void>;
}

export const BankManagementModal: React.FC<BankManagementModalProps> = ({
  visible,
  onClose,
  accounts: initialAccounts,
  onSetPrimary,
  onDeleteAccount,
  onAddAccount,
}) => {
  const { showSuccess, showWarning, showError } = useToast();

  const [accounts, setAccounts] = useState<SettlementBankAccount[]>(initialAccounts);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [selectedBank, setSelectedBank] = useState(SUPPORTED_BANKS[0]);
  const [accountNumber, setAccountNumber] = useState('');
  const [resolvedAccountName, setResolvedAccountName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync internal accounts if props update
  React.useEffect(() => {
    setAccounts(initialAccounts);
  }, [initialAccounts]);

  const handleAccountNumberChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 10);
    setAccountNumber(cleaned);

    if (cleaned.length === 10) {
      // Trigger instant NUBAN name resolve simulation
      setIsVerifying(true);
      setTimeout(() => {
        setIsVerifying(false);
        setResolvedAccountName('BABATUNDE ADENIYI FIXMATE');
      }, 500);
    } else {
      setResolvedAccountName('');
    }
  };

  const handleSaveNewAccount = async () => {
    if (accountNumber.length !== 10) {
      showWarning('10-Digit NUBAN Required', 'Please enter a valid 10-digit Nigerian bank account number.');
      return;
    }
    if (!resolvedAccountName) {
      showWarning('Account Name Verification', 'Please wait for the account name to resolve successfully.');
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await onAddAccount({
        bankName: selectedBank,
        accountNumber,
        accountName: resolvedAccountName,
      });
      showSuccess('Bank Account Added', `${selectedBank} linked successfully for instant withdrawals.`);
      setIsAddingNew(false);
      setAccountNumber('');
      setResolvedAccountName('');
    } catch (err: any) {
      showError('Failed to Link Account', err?.message || 'Could not verify account details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMakePrimary = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAccounts((prev) =>
      prev.map((acc) => ({
        ...acc,
        isPrimary: acc.id === id,
      }))
    );
    onSetPrimary(id);
    showSuccess('Primary Account Updated', 'Payouts will now settle to this bank by default.');
  };

  const handleDelete = (id: string, isPrimary: boolean) => {
    if (isPrimary && accounts.length > 1) {
      showWarning('Primary Account', 'Please set another account as primary before deleting this one.');
      return;
    }
    if (accounts.length <= 1) {
      showWarning('At Least One Account Required', 'You must maintain at least one linked settlement account.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAccounts((prev) => prev.filter((acc) => acc.id !== id));
    onDeleteAccount(id);
    showSuccess('Bank Account Removed', 'Account unlinked from your payout channels.');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <SafeAreaView style={styles.safeContainer}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <View>
              <Text style={styles.topBarTitle}>Settlement Bank Accounts</Text>
              <Text style={styles.topBarSubtitle}>Where your earnings are transferred</Text>
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
            {/* Accounts List */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Linked Accounts</Text>
              {!isAddingNew && (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIsAddingNew(true);
                  }}
                  style={styles.addAccountLink}
                >
                  <PlusCircle size={14} color="#10B981" />
                  <Text style={styles.addAccountLinkText}>Add New Bank</Text>
                </TouchableOpacity>
              )}
            </View>

            {accounts.map((acc) => (
              <View key={acc.id} style={styles.accountCard}>
                <View style={styles.accountCardTop}>
                  <View style={styles.bankIconCircle}>
                    <Building2 size={20} color="#10B981" />
                  </View>
                  <View style={styles.accountMetaCol}>
                    <View style={styles.bankNameRow}>
                      <Text style={styles.bankNameText}>{acc.bankName}</Text>
                      {acc.isPrimary && (
                        <View style={styles.primaryBadge}>
                          <Star size={10} color="#10B981" fill="#10B981" />
                          <Text style={styles.primaryBadgeText}>Primary</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.accountNumberText}>
                      •••• {acc.accountNumber.slice(-4)} • NUBAN
                    </Text>
                    <Text style={styles.accountHolderText}>{acc.accountName}</Text>
                  </View>
                </View>

                {/* Account Actions */}
                <View style={styles.cardActionsRow}>
                  {!acc.isPrimary && (
                    <TouchableOpacity
                      onPress={() => handleMakePrimary(acc.id)}
                      style={styles.setPrimaryBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.setPrimaryText}>Set as Primary</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => handleDelete(acc.id, acc.isPrimary)}
                    style={styles.deleteBtn}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={15} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Add New Account Form */}
            {isAddingNew && (
              <View style={styles.addFormCard}>
                <View style={styles.addFormHeader}>
                  <Text style={styles.addFormTitle}>Add Settlement Bank</Text>
                  <TouchableOpacity
                    onPress={() => setIsAddingNew(false)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={18} color={colors.neutral[400]} />
                  </TouchableOpacity>
                </View>

                {/* Bank Selector Chips */}
                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>Select Bank</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.bankChipsContainer}
                  >
                    {SUPPORTED_BANKS.map((b) => {
                      const isSelected = selectedBank === b;
                      return (
                        <TouchableOpacity
                          key={b}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedBank(b);
                          }}
                          style={[styles.bankChip, isSelected && styles.bankChipActive]}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.bankChipText,
                              isSelected && styles.bankChipTextActive,
                            ]}
                          >
                            {b.split(' ')[0]}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Account Number Input */}
                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>10-Digit Account Number (NUBAN)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    maxLength={10}
                    placeholder="e.g. 0123456789"
                    placeholderTextColor={colors.neutral[500]}
                    value={accountNumber}
                    onChangeText={handleAccountNumberChange}
                  />
                </View>

                {/* Name Resolve Box */}
                {isVerifying ? (
                  <View style={styles.verifyingBox}>
                    <ActivityIndicator size="small" color="#10B981" />
                    <Text style={styles.verifyingText}>Resolving account name via NIBSS...</Text>
                  </View>
                ) : resolvedAccountName ? (
                  <View style={styles.resolvedBox}>
                    <CheckCircle2 size={16} color="#10B981" />
                    <Text style={styles.resolvedNameText}>{resolvedAccountName}</Text>
                  </View>
                ) : null}

                {/* Submit New Bank Button */}
                <TouchableOpacity
                  onPress={handleSaveNewAccount}
                  disabled={isSubmitting || !resolvedAccountName}
                  style={[
                    styles.saveBankBtn,
                    (!resolvedAccountName || isSubmitting) && styles.saveBankBtnDisabled,
                  ]}
                  activeOpacity={0.85}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#071A11" />
                  ) : (
                    <>
                      <ShieldCheck size={16} color="#071A11" />
                      <Text style={styles.saveBankBtnText}>Verify & Link Account</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Bottom Done Button */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              style={styles.doneBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.doneBtnText}>Close</Text>
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[200],
  },
  addAccountLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addAccountLinkText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semiBold,
    color: '#10B981',
  },
  accountCard: {
    backgroundColor: '#0E291D',
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#1D4E35',
    ...shadows.sm,
  },
  accountCardTop: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  bankIconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: '#163E26',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#10B98150',
  },
  accountMetaCol: {
    flex: 1,
  },
  bankNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  bankNameText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[100],
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B98120',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#10B98150',
  },
  primaryBadgeText: {
    fontSize: 10,
    fontFamily: typography.fonts.bold,
    color: '#10B981',
  },
  accountNumberText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semiBold,
    color: colors.neutral[300],
  },
  accountHolderText: {
    fontSize: 11,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
    marginTop: 2,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#173E28',
    gap: 12,
  },
  setPrimaryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.md,
    backgroundColor: '#10B98115',
    borderWidth: 1,
    borderColor: '#10B98140',
  },
  setPrimaryText: {
    fontSize: 11,
    fontFamily: typography.fonts.semiBold,
    color: '#10B981',
  },
  deleteBtn: {
    padding: 6,
  },
  addFormCard: {
    backgroundColor: '#0E291D',
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#10B981',
    gap: spacing.sm,
  },
  addFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  addFormTitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[100],
  },
  formGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semiBold,
    color: colors.neutral[300],
  },
  bankChipsContainer: {
    gap: 6,
    paddingVertical: 2,
  },
  bankChip: {
    backgroundColor: '#071A11',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#1D4E35',
  },
  bankChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  bankChipText: {
    fontSize: 11,
    fontFamily: typography.fonts.medium,
    color: colors.neutral[300],
  },
  bankChipTextActive: {
    color: '#071A11',
    fontFamily: typography.fonts.bold,
  },
  textInput: {
    backgroundColor: '#071A11',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#1D4E35',
    paddingHorizontal: spacing.sm,
    height: 46,
    color: colors.neutral[100],
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semiBold,
  },
  verifyingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#071A11',
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  verifyingText: {
    fontSize: 11,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
  },
  resolvedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10B98115',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#10B98140',
  },
  resolvedNameText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.bold,
    color: '#10B981',
  },
  saveBankBtn: {
    height: 48,
    backgroundColor: '#10B981',
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  saveBankBtnDisabled: {
    opacity: 0.5,
  },
  saveBankBtnText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.bold,
    color: '#071A11',
  },
  bottomBar: {
    padding: spacing.md,
    backgroundColor: '#071A11',
    borderTopWidth: 1,
    borderTopColor: '#17402B',
  },
  doneBtn: {
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.bold,
    color: '#071A11',
  },
});
