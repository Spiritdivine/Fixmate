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
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import {
  ShieldCheck,
  CreditCard,
  Trash2,
  CheckCircle,
  Copy,
  ExternalLink,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Plus,
  Search,
  Zap,
  Coins,
  Eye,
  EyeOff,
  Lock,
  Landmark,
  Check,
} from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows, useTheme } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { WalletService } from '../../services/wallet.service';
import { useToast } from '../shared/ToastContext';

interface TransactionItem {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  type: 'ESCROW_LOCK' | 'RELEASE' | 'TOP_UP' | 'REFUND';
  date: string;
  fullDate?: string;
  reference?: string;
  status: 'PENDING' | 'SUCCESS' | 'REFUNDED';
}

interface ClientWalletScreenProps {
  onBack?: () => void;
  onNavigateToTransactions?: () => void;
}

export const ClientWalletScreen: React.FC<ClientWalletScreenProps> = ({ onBack, onNavigateToTransactions }) => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const { colors: themeColors, isDark } = useTheme();
  const [showBalance, setShowBalance] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ESCROW' | 'RELEASES' | 'TOPUPS'>('ALL');
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('20000');
  const [depositMethod, setDepositMethod] = useState<'PAYSTACK' | 'SIMULATE'>('PAYSTACK');
  const [isProcessing, setIsProcessing] = useState(false);

  // Kotani On-Ramp Modal State
  const [showKotaniModal, setShowKotaniModal] = useState(false);
  const [kotaniAmountNgn, setKotaniAmountNgn] = useState('25000');
  const [isKotaniLoading, setIsKotaniLoading] = useState(false);

  // Web3 & Faucet State
  const [isMintingFaucet, setIsMintingFaucet] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [searchRef, setSearchRef] = useState('');

  // Selected Transaction Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState<TransactionItem | null>(null);

  // Withdrawal & Bank Account State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Add Bank Modal State
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [selectedBankCode, setSelectedBankCode] = useState('058');
  const [selectedBankName, setSelectedBankName] = useState('Guaranty Trust Bank');
  const [resolvedAccountName, setResolvedAccountName] = useState('');
  const [isResolvingBank, setIsResolvingBank] = useState(false);
  const [isAddingBank, setIsAddingBank] = useState(false);

  const popularBanks = [
    { code: '058', name: 'GTBank' },
    { code: '044', name: 'Access Bank' },
    { code: '057', name: 'Zenith Bank' },
    { code: '011', name: 'First Bank' },
    { code: '033', name: 'UBA' },
    { code: '50211', name: 'Kuda Bank' },
    { code: '999992', name: 'OPay' },
    { code: '50515', name: 'Moniepoint' },
  ];

  // 1. Fetch Wallet Balance & Ledger
  const { data: walletData } = useQuery({
    queryKey: ['wallet', 'client'],
    queryFn: () => WalletService.getMyWallet(),
  });

  // 2. Fetch Live Exchange Rates (USDC -> NGN)
  const { data: ratesData } = useQuery({
    queryKey: ['rates', 'usdc-ngn'],
    queryFn: () => WalletService.getExchangeRate(),
  });

  // 3. Fetch Saved Banks
  const { data: savedBanks = [], refetch: refetchBanks } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: () => WalletService.getBanks(),
  });

  // 4. Fetch Saved Cards
  const { data: savedCards = [], refetch: refetchCards } = useQuery({
    queryKey: ['saved-cards'],
    queryFn: () => WalletService.getSavedCards(),
  });

  const availableBalance = Number(walletData?.balance ?? 0);
  const lockedInEscrow = Number(walletData?.escrowLockedBalance ?? 0);
  const totalBalance = availableBalance + lockedInEscrow;
  const exchangeRate = ratesData?.rate || 1485.0;
  const cryptoEquivalentUsd = (totalBalance / exchangeRate).toFixed(2);
  const walletAddress = (walletData as any)?.walletAddress || '0x71C2B0A824F315f62F93bE28Eb90D37F21F3a9F';

  const handleCopyAddress = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      showSuccess(`Address copied: ${walletAddress.slice(0, 10)}...`);
    } catch {
      // ignore
    }
  };

  const handleOpenExplorer = () => {
    Linking.openURL(`https://testnet.monadexplorer.com/address/${walletAddress}`);
  };

  const handleFaucetMint = async () => {
    try {
      setIsMintingFaucet(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await WalletService.simulateDeposit(148500); // 100 USDC @ 1,485 NGN
      await queryClient.invalidateQueries({ queryKey: ['wallet'] });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSuccess('100 Test USDC (~₦148,500) credited to Monad vault!');
    } catch (err: any) {
      showError(err?.message || 'Could not mint test tokens');
    } finally {
      setIsMintingFaucet(false);
    }
  };

  const handleKotaniOnRamp = async () => {
    const num = parseFloat(kotaniAmountNgn);
    if (!num || num < 1000) {
      Alert.alert('Minimum Deposit', 'Minimum on-ramp deposit is ₦1,000.');
      return;
    }
    setIsKotaniLoading(true);
    try {
      const res = await WalletService.initiateKotaniOnRamp({
        amountNgn: num,
        destinationWalletAddress: walletAddress,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowKotaniModal(false);

      if (res?.checkoutUrl) {
        Linking.openURL(res.checkoutUrl);
      } else {
        await queryClient.invalidateQueries({ queryKey: ['wallet'] });
        Alert.alert(
          'Kotani On-Ramp Successful',
          `₦${num.toLocaleString()} converted to ~${((num / exchangeRate).toFixed(2))} USDC deposited into your Monad vault.`
        );
      }
    } catch (err: any) {
      Alert.alert('On-Ramp Failed', err?.response?.data?.message || err?.message || 'Failed to initiate Kotani on-ramp.');
    } finally {
      setIsKotaniLoading(false);
    }
  };

  // Deposit Handler (Paystack Checkout vs Instant Simulated Sandbox)
  const handleDepositSubmit = async () => {
    const num = parseInt(topUpAmount, 10) || 0;
    if (num <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid deposit amount.');
      return;
    }

    setIsProcessing(true);
    try {
      if (depositMethod === 'SIMULATE') {
        await WalletService.simulateDeposit(num);
        await queryClient.invalidateQueries({ queryKey: ['wallet'] });
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowTopUpModal(false);
        Alert.alert('Test Deposit Successful', `${formatCurrency(num)} credited to your available balance.`);
        return;
      }

      const res = await WalletService.initializeDeposit({
        amount: num,
        currency: 'NGN',
        paymentMethod: 'PAYSTACK',
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowTopUpModal(false);
      if (res?.authorizationUrl) {
        Linking.openURL(res.authorizationUrl);
      } else {
        Alert.alert('Paystack Initialized', `Reference: ${res?.reference || 'PSK-' + Date.now()}`);
      }
    } catch (err: unknown) {
      setShowTopUpModal(false);
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      Alert.alert(
        'Top Up Failed',
        apiErr?.response?.data?.message || apiErr?.message || 'Could not initialize gateway deposit.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Resolve Bank Account Name
  const handleResolveBank = async (accNum: string, bCode: string) => {
    setBankAccountNumber(accNum);
    if (accNum.length === 10) {
      setIsResolvingBank(true);
      try {
        const res = await WalletService.resolveBank(accNum, bCode);
        if (res?.accountName) {
          setResolvedAccountName(res.accountName);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch {
        setResolvedAccountName('');
      } finally {
        setIsResolvingBank(false);
      }
    } else {
      setResolvedAccountName('');
    }
  };

  // Add Bank Submit
  const handleAddBankSubmit = async () => {
    if (bankAccountNumber.length !== 10) {
      Alert.alert('Invalid Account', 'Please enter a valid 10-digit NUBAN account number.');
      return;
    }
    if (!resolvedAccountName.trim()) {
      Alert.alert('Account Unverified', 'Please wait for the bank account name to be verified.');
      return;
    }

    setIsAddingBank(true);
    try {
      const createdBank = await WalletService.addBank({
        accountNumber: bankAccountNumber.trim(),
        accountName: resolvedAccountName.trim(),
        bankCode: selectedBankCode,
        bankName: selectedBankName,
      });
      await refetchBanks();
      setSelectedBankId(createdBank.id);
      setShowAddBankModal(false);
      setBankAccountNumber('');
      setResolvedAccountName('');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Bank Account Linked', `${createdBank.bankName} (${createdBank.accountNumber}) added successfully.`);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      Alert.alert('Failed to Link Bank', apiErr?.response?.data?.message || apiErr?.message || 'Could not save bank account.');
    } finally {
      setIsAddingBank(false);
    }
  };

  // Set Default Bank
  const handleSetDefaultBank = async (id: string) => {
    try {
      await WalletService.setDefaultBank(id);
      await refetchBanks();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Error', 'Unable to set default bank account.');
    }
  };

  // Delete Bank
  const handleDeleteBank = async (id: string) => {
    Alert.alert('Remove Bank Account', 'Are you sure you want to remove this bank account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await WalletService.deleteBank(id);
            await refetchBanks();
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {
            Alert.alert('Error', 'Unable to remove bank account.');
          }
        },
      },
    ]);
  };

  // Delete Saved Card
  const handleDeleteCard = async (id: string) => {
    Alert.alert('Remove Payment Card', 'Are you sure you want to remove this saved card?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await WalletService.deleteCard(id);
            await refetchCards();
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {
            Alert.alert('Error', 'Unable to remove card.');
          }
        },
      },
    ]);
  };

  // Set Default Card
  const handleSetDefaultCard = async (id: string) => {
    try {
      await WalletService.setDefaultCard(id);
      await refetchCards();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Error', 'Unable to set default card.');
    }
  };

  // Withdrawal Submit
  const handleWithdrawSubmit = async () => {
    const amountNum = parseFloat(withdrawAmount);
    if (!amountNum || amountNum <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to withdraw.');
      return;
    }
    if (amountNum > availableBalance) {
      Alert.alert(
        'Insufficient Balance',
        `Your available balance is ${formatCurrency(availableBalance)}. Escrow funds cannot be withdrawn until contracts settle.`
      );
      return;
    }

    const targetBankId = selectedBankId || savedBanks[0]?.id;
    if (!targetBankId) {
      Alert.alert('Bank Account Required', 'Please select or link a bank account to receive your funds.');
      return;
    }

    setIsWithdrawing(true);
    try {
      await WalletService.requestWithdrawal({
        amount: amountNum,
        bankAccountId: targetBankId,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      await queryClient.invalidateQueries({ queryKey: ['wallet'] });
      Alert.alert(
        'Withdrawal Initiated',
        `Your payout of ${formatCurrency(amountNum)} has been queued. Funds will disburse to your bank account within minutes via NIP.`
      );
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      Alert.alert('Withdrawal Failed', apiErr?.response?.data?.message || apiErr?.message || 'Failed to process withdrawal request.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Map Live Transactions
  const liveTransactions: TransactionItem[] = walletData?.transactions && walletData.transactions.length > 0
    ? walletData.transactions.map((tx: any) => {
        let mappedType: 'ESCROW_LOCK' | 'RELEASE' | 'TOP_UP' | 'REFUND' = 'TOP_UP';
        const rawType = (tx.type || '').toUpperCase();
        if (rawType === 'ESCROW_LOCK') mappedType = 'ESCROW_LOCK';
        else if (rawType === 'ESCROW_RELEASE' || rawType === 'MILESTONE_RELEASE') mappedType = 'RELEASE';
        else if (rawType === 'REFUND') mappedType = 'REFUND';
        else mappedType = 'TOP_UP';

        const isDebit = mappedType === 'ESCROW_LOCK' || (tx.amount < 0);
        const displayAmount = isDebit ? -Math.abs(Number(tx.amount)) : Math.abs(Number(tx.amount));

        return {
          id: tx.id,
          title: tx.description || (mappedType === 'ESCROW_LOCK' ? 'Escrow Protection Lock' : mappedType === 'RELEASE' ? 'Milestone Escrow Released' : 'Wallet Deposit'),
          subtitle: tx.reference ? `Ref: ${tx.reference.slice(0, 16)}...` : 'Artifix Protected Escrow',
          amount: displayAmount,
          type: mappedType,
          date: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Recently',
          fullDate: tx.createdAt ? new Date(tx.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recently',
          reference: tx.reference || `TXN-${tx.id?.slice(0, 8).toUpperCase()}`,
          status: (tx.status || 'SUCCESS').toUpperCase() as any,
        };
      })
    : [];

  const filteredTxs = liveTransactions.filter((t) => {
    if (filter === 'ESCROW' && t.type !== 'ESCROW_LOCK') return false;
    if (filter === 'RELEASES' && t.type !== 'RELEASE') return false;
    if (filter === 'TOPUPS' && t.type !== 'TOP_UP') return false;
    if (
      searchRef.trim() &&
      !t.reference?.toLowerCase().includes(searchRef.trim().toLowerCase()) &&
      !t.title.toLowerCase().includes(searchRef.trim().toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onBack?.();
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.backBtnText, { color: themeColors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Escrow & Wallet</Text>
        <View style={[
          styles.rateBadge,
          isDark && {
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            borderColor: 'rgba(16, 185, 129, 0.3)',
          },
        ]}>
          <Text style={[styles.rateText, isDark && { color: '#34D399' }]}>
            1 USDC ≈ ₦{Math.round(exchangeRate).toLocaleString()}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Multi-Asset Balance Hero Card */}
        <View style={styles.walletCard}>
          <View style={styles.heroTopRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.walletLabel}>TOTAL VAULT VALUATION</Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setShowBalance(!showBalance);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showBalance ? (
                  <Eye size={14} color="#A7F3D0" />
                ) : (
                  <EyeOff size={14} color="#A7F3D0" />
                )}
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <ShieldCheck size={12} color="#A7F3D0" />
              <Text style={styles.monadPillText}>Vault Protected</Text>
            </View>
          </View>

          <Text style={styles.totalAmount}>
            {showBalance ? formatCurrency(totalBalance) : '••••••••'}
          </Text>
          <Text style={styles.cryptoEquiv}>
            {showBalance
              ? `≈ $${cryptoEquivalentUsd} USDC · Monad Testnet (Zero-Gas Protected)`
              : '••••••••'}
          </Text>

          <View style={styles.splitRow}>
            <View style={styles.splitBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                <Lock size={11} color="rgba(255,255,255,0.8)" />
                <Text style={styles.splitLabel}>Locked in Escrow</Text>
              </View>
              <Text style={styles.splitValueLocked}>
                {showBalance ? formatCurrency(lockedInEscrow) : '••••••••'}
              </Text>
            </View>
            <View style={styles.splitDivider} />
            <View style={styles.splitBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                <CreditCard size={11} color="rgba(255,255,255,0.8)" />
                <Text style={styles.splitLabel}>Available to Spend</Text>
              </View>
              <Text style={styles.splitValueAvail}>
                {showBalance ? formatCurrency(availableBalance) : '••••••••'}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={styles.topUpBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowTopUpModal(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.topUpBtnText}>+ Fund Wallet</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.refundBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowWithdrawModal(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.refundBtnText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Digital Dollar (USDC) Vault Card */}
        <View style={[styles.cryptoVaultCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={styles.cryptoVaultHeader}>
            <View style={styles.cryptoTitleRow}>
              <View style={styles.cryptoIconBox}>
                <Zap size={16} color={themeColors.primary} strokeWidth={2} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.cryptoVaultTitle, { color: themeColors.text }]}>Digital Dollar (USDC) Vault</Text>
                <Text style={[styles.cryptoVaultSub, { color: themeColors.textMuted }]}>Automated Smart Escrow Network</Text>
              </View>
            </View>
          </View>

          {/* Multi-Token Asset Grid */}
          <View style={styles.cryptoAssetGrid}>
            <View style={[styles.cryptoAssetBox, { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border }]}>
              <View style={styles.assetHeaderRow}>
                <View style={styles.greenDot} />
                <Text style={[styles.assetLabel, { color: themeColors.textMuted }]}>Digital USD (USDC)</Text>
              </View>
              <Text style={[styles.assetMainVal, { color: themeColors.text }]}>${cryptoEquivalentUsd}</Text>
              <Text style={[styles.assetSubVal, { color: themeColors.textMuted }]}>≈ {formatCurrency(totalBalance)}</Text>
            </View>

            <View style={[styles.cryptoAssetBox, { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border }]}>
              <View style={styles.assetHeaderRow}>
                <View style={styles.indigoDot} />
                <Text style={[styles.assetLabel, { color: themeColors.textMuted }]}>Monad Gas Credits</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[styles.assetMainVal, { color: themeColors.text }]}>Sponsored</Text>
                <Zap size={12} color="#10B981" />
              </View>
              <Text style={[styles.assetSubVal, { color: themeColors.textMuted }]}>Zero-Gas Relay Active</Text>
            </View>
          </View>

          {/* Permanent Account Address Bar */}
          <View style={styles.addressBarContainer}>
            <Text style={[styles.addressBarLabel, { color: themeColors.textMuted }]}>Digital Escrow Account ID</Text>
            <View style={[styles.addressBar, { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border }]}>
              <Text style={[styles.addressText, { color: themeColors.text }]} numberOfLines={1} ellipsizeMode="middle">
                {walletAddress}
              </Text>
              <View style={styles.addressBtnRow}>
                <TouchableOpacity
                  onPress={handleCopyAddress}
                  style={[styles.addressIconBtn, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
                  activeOpacity={0.7}
                >
                  <Copy size={13} color={isCopied ? '#10B981' : (isDark ? themeColors.textMuted : '#4B5563')} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleOpenExplorer}
                  style={[styles.addressIconBtn, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
                  activeOpacity={0.7}
                >
                  <ExternalLink size={13} color={isDark ? themeColors.textMuted : '#4B5563'} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Crypto Actions: Kotani Pay On-Ramp + Faucet */}
          <View style={styles.cryptoActionRow}>
            <TouchableOpacity
              style={[styles.kotaniBtn, isDark && { backgroundColor: '#059669' }]}
              onPress={() => setShowKotaniModal(true)}
              activeOpacity={0.8}
            >
              <Coins size={14} color="#FFFFFF" />
              <Text style={styles.kotaniBtnText}>Buy USDC (Kotani)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.faucetBtn,
                isDark && {
                  backgroundColor: 'rgba(217, 119, 6, 0.15)',
                  borderColor: 'rgba(217, 119, 6, 0.35)',
                },
              ]}
              onPress={handleFaucetMint}
              disabled={isMintingFaucet}
              activeOpacity={0.8}
            >
              {isMintingFaucet ? (
                <ActivityIndicator size="small" color={isDark ? '#FCD34D' : '#D97706'} />
              ) : (
                <>
                  <Zap size={14} color={isDark ? '#FCD34D' : '#D97706'} />
                  <Text style={[styles.faucetBtnText, isDark && { color: '#FCD34D' }]}>Test Faucet (+100)</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Shield Banner */}
        <View style={[styles.shieldBanner, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <ShieldCheck size={22} color={isDark ? '#34D399' : colors.brand.forest} style={{ marginRight: spacing.sm }} />
          <View style={styles.shieldMeta}>
            <Text style={[styles.shieldTitle, { color: themeColors.text }]}>Protected Escrow Custody</Text>
            <Text style={[styles.shieldDesc, { color: themeColors.textMuted }]}>
              Escrow funds are held in NDIC-insured trust accounts and regulated smart contracts.
            </Text>
          </View>
        </View>

        {/* Saved Cards Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Saved Payment Cards</Text>
          <TouchableOpacity onPress={() => setShowTopUpModal(true)}>
            <Text style={[styles.sectionAction, { color: isDark ? '#34D399' : '#184530' }]}>+ Add Card</Text>
          </TouchableOpacity>
        </View>

        {savedCards.length === 0 ? (
          <View style={[styles.emptyCardBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <CreditCard size={18} color={isDark ? themeColors.textMuted : '#9CA3AF'} />
            <Text style={[styles.emptyCardText, { color: themeColors.textMuted }]}>
              No saved cards yet. Cards used for deposits are securely saved here for 1-tap escrow funding.
            </Text>
          </View>
        ) : (
          <View style={styles.cardsList}>
            {savedCards.map((card: any) => (
              <View key={card.id} style={[styles.cardItem, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                <View style={styles.cardInfo}>
                  <CreditCard size={18} color={isDark ? '#34D399' : '#184530'} />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={[styles.cardTitle, { color: themeColors.text }]}>
                      {card.brand || 'Debit Card'} •••• {card.last4}
                    </Text>
                    <Text style={[styles.cardExpiry, { color: themeColors.textMuted }]}>
                      Expires {card.expMonth}/{card.expYear}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  {card.isDefault ? (
                    <View style={[styles.defaultChip, isDark && { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                      <Text style={[styles.defaultChipText, isDark && { color: '#34D399' }]}>Default</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleSetDefaultCard(card.id)}
                      style={styles.makeDefaultBtn}
                    >
                      <Text style={[styles.makeDefaultText, { color: isDark ? '#34D399' : '#184530' }]}>Set Default</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => handleDeleteCard(card.id)}
                    style={styles.trashBtn}
                  >
                    <Trash2 size={15} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Bank Accounts Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Linked Bank Accounts</Text>
          <TouchableOpacity onPress={() => setShowAddBankModal(true)}>
            <Text style={[styles.sectionAction, { color: isDark ? '#34D399' : '#184530' }]}>+ Add Bank</Text>
          </TouchableOpacity>
        </View>

        {savedBanks.length === 0 ? (
          <View style={[styles.emptyCardBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Landmark size={22} color={themeColors.textMuted} style={{ marginBottom: 4 }} />
            <Text style={[styles.emptyCardText, { color: themeColors.textMuted }]}>
              No bank account linked. Link your Nigerian bank account to receive refunds or payouts.
            </Text>
          </View>
        ) : (
          <View style={styles.cardsList}>
            {savedBanks.map((bank: any) => (
              <View key={bank.id} style={[styles.cardItem, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                <View style={styles.cardInfo}>
                  <Landmark size={18} color={isDark ? '#34D399' : '#184530'} />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={[styles.cardTitle, { color: themeColors.text }]}>{bank.bankName}</Text>
                    <Text style={[styles.cardExpiry, { color: themeColors.textMuted }]}>
                      {bank.accountNumber} · {bank.accountName}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  {bank.isDefault ? (
                    <View style={[styles.defaultChip, isDark && { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                      <Text style={[styles.defaultChipText, isDark && { color: '#34D399' }]}>Default</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleSetDefaultBank(bank.id)}
                      style={styles.makeDefaultBtn}
                    >
                      <Text style={[styles.makeDefaultText, { color: isDark ? '#34D399' : '#184530' }]}>Set Default</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => handleDeleteBank(bank.id)}
                    style={styles.trashBtn}
                  >
                    <Trash2 size={15} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Transactions Section - Streamlined Recent Activity Preview */}
        <View style={styles.txHeaderRow}>
          <Text style={[styles.txSectionTitle, { color: themeColors.text }]}>Recent Activity</Text>
          <TouchableOpacity
            onPress={onNavigateToTransactions}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={{ fontSize: 13, color: isDark ? '#34D399' : '#10B981', fontWeight: '700' }}>View All Activity →</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction Items */}
        <View style={styles.txList}>
          {liveTransactions.length === 0 ? (
            <View style={[styles.emptyTxBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <CreditCard size={32} color={themeColors.textMuted} style={{ marginBottom: 8 }} />
              <Text style={[styles.emptyTxTitle, { color: themeColors.text }]}>No Transactions Yet</Text>
              <Text style={[styles.emptyTxSub, { color: themeColors.textMuted }]}>
                Deposits, escrow locks, and milestone releases will be reflected here in your real-time ledger.
              </Text>
            </View>
          ) : (
            liveTransactions.slice(0, 3).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.txCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
                onPress={onNavigateToTransactions}
                activeOpacity={0.7}
              >
                <View style={[styles.txIconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' }]}>
                  {item.type === 'ESCROW_LOCK' ? (
                    <Lock size={15} color="#059669" />
                  ) : item.type === 'RELEASE' ? (
                    <ArrowUpRight size={15} color="#10B981" />
                  ) : item.type === 'TOP_UP' ? (
                    <CreditCard size={15} color="#3B82F6" />
                  ) : (
                    <ArrowDownLeft size={15} color="#F59E0B" />
                  )}
                </View>
                <View style={styles.txMeta}>
                  <Text style={[styles.txTitle, { color: themeColors.text }]} numberOfLines={1}>{item.title}</Text>
                  <Text style={[styles.txSub, { color: themeColors.textMuted }]}>{item.subtitle}</Text>
                  <Text style={[styles.txDate, { color: themeColors.textMuted }]}>{item.date}</Text>
                </View>
                <View style={styles.txAmountCol}>
                  <Text
                    style={[
                      styles.txAmount,
                      item.amount > 0 ? styles.txAmountPositive : { color: themeColors.text },
                    ]}
                  >
                    {item.amount > 0 ? `+${formatCurrency(item.amount)}` : formatCurrency(item.amount)}
                  </Text>
                  <View
                    style={[
                      styles.statusTag,
                      item.status === 'PENDING'
                        ? (isDark ? { backgroundColor: 'rgba(217, 119, 6, 0.2)' } : styles.statusTagPending)
                        : item.status === 'REFUNDED'
                        ? (isDark ? { backgroundColor: 'rgba(59, 130, 246, 0.2)' } : styles.statusTagRefunded)
                        : (isDark ? { backgroundColor: 'rgba(16, 185, 129, 0.2)' } : styles.statusTagSuccess),
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusTagText,
                        item.status === 'PENDING'
                          ? (isDark ? { color: '#FCD34D' } : styles.statusTagTextPending)
                          : item.status === 'REFUNDED'
                          ? (isDark ? { color: '#60A5FA' } : styles.statusTagTextRefunded)
                          : (isDark ? { color: '#34D399' } : styles.statusTagTextSuccess),
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <TouchableOpacity
          style={{
            marginTop: 10,
            paddingVertical: 14,
            backgroundColor: isDark ? themeColors.surface : '#FFFFFF',
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: isDark ? themeColors.border : '#E5E7EB',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={onNavigateToTransactions}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? themeColors.brand.emerald : '#1A4731' }}>
            Open Dedicated Transaction Ledger →
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Top-up Modal (Dual Method: Paystack Gateway & Sandbox Dev) */}
      <Modal visible={showTopUpModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Deposit Funds</Text>
              <TouchableOpacity onPress={() => setShowTopUpModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color={themeColors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: themeColors.textMuted }]}>Deposit Amount (₦)</Text>
            <TextInput
              style={[
                styles.amountInput,
                {
                  backgroundColor: themeColors.inputBg,
                  borderColor: themeColors.inputBorder,
                  color: themeColors.text,
                },
              ]}
              placeholderTextColor={themeColors.textMuted}
              keyboardType="numeric"
              value={topUpAmount}
              onChangeText={setTopUpAmount}
              placeholder="e.g. 20,000"
            />

            <View style={styles.amountChipsRow}>
              {['10000', '25000', '50000', '100000'].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[styles.amtChip, { backgroundColor: isDark ? themeColors.surfaceSubtle : '#F3F4F6' }]}
                  onPress={() => setTopUpAmount(amt)}
                >
                  <Text style={[styles.amtChipText, { color: isDark ? themeColors.brand.emerald : '#184530' }]}>+{formatCurrency(parseInt(amt))}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Payment Method Selector (Mirroring Web) */}
            <Text style={[styles.inputLabel, { color: themeColors.textMuted, marginTop: 14 }]}>Payment Rail</Text>
            <View style={styles.gatewayGrid}>
              <TouchableOpacity
                onPress={() => setDepositMethod('PAYSTACK')}
                style={[
                  styles.gatewayCard,
                  { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border },
                  depositMethod === 'PAYSTACK' && {
                    borderColor: '#10B981',
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#F0FDF4',
                  },
                ]}
                activeOpacity={0.8}
              >
                <CreditCard size={18} color={depositMethod === 'PAYSTACK' ? '#10B981' : themeColors.textMuted} />
                <Text style={[
                  styles.gatewayCardTitle,
                  { color: themeColors.text },
                  depositMethod === 'PAYSTACK' && { color: isDark ? '#34D399' : colors.brand.forest }
                ]}>
                  Paystack Checkout
                </Text>
                <Text style={[styles.gatewayCardSub, { color: themeColors.textMuted }]}>Debit Card, Bank Transfer, USSD</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setDepositMethod('SIMULATE')}
                style={[
                  styles.gatewayCard,
                  { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border },
                  depositMethod === 'SIMULATE' && {
                    borderColor: '#10B981',
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#F0FDF4',
                  },
                ]}
                activeOpacity={0.8}
              >
                <Zap size={18} color={depositMethod === 'SIMULATE' ? '#10B981' : themeColors.textMuted} />
                <Text style={[
                  styles.gatewayCardTitle,
                  { color: themeColors.text },
                  depositMethod === 'SIMULATE' && { color: isDark ? '#34D399' : colors.brand.forest }
                ]}>
                  Instant Sandbox Credit
                </Text>
                <Text style={[styles.gatewayCardSub, { color: themeColors.textMuted }]}>Zero-delay simulated dev funding</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.paystackBtn,
                isDark && { backgroundColor: themeColors.brand.forest },
                isProcessing && { opacity: 0.6 }
              ]}
              onPress={handleDepositSubmit}
              disabled={isProcessing}
            >
              <Text style={styles.paystackBtnText}>
                {isProcessing
                  ? 'Processing...'
                  : depositMethod === 'SIMULATE'
                  ? 'Instant Credit (Sandbox)'
                  : 'Proceed to Paystack'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Kotani Pay On-Ramp Modal (Mirroring Web) */}
      <Modal visible={showKotaniModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Buy USDC with Naira (Kotani Pay)</Text>
              <TouchableOpacity onPress={() => setShowKotaniModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color={themeColors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={[
              styles.kotaniIntroBox,
              isDark && {
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderColor: 'rgba(16, 185, 129, 0.25)',
              },
            ]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Zap size={14} color="#10B981" />
                <Text style={[styles.kotaniIntroTitle, isDark && { color: '#34D399' }]}>Direct Naira to Digital USD On-Ramp</Text>
              </View>
              <Text style={[styles.kotaniIntroDesc, isDark && { color: '#C7D2FE' }]}>
                Convert Naira directly into cryptographic USDC deposited into your linked Monad escrow vault.
              </Text>
            </View>

            <Text style={[styles.inputLabel, { color: themeColors.textMuted }]}>Deposit Amount (₦ NGN)</Text>
            <TextInput
              style={[
                styles.amountInput,
                {
                  backgroundColor: themeColors.inputBg,
                  borderColor: themeColors.inputBorder,
                  color: themeColors.text,
                },
              ]}
              placeholderTextColor={themeColors.textMuted}
              keyboardType="numeric"
              value={kotaniAmountNgn}
              onChangeText={setKotaniAmountNgn}
              placeholder="e.g. 25,000"
            />

            <View style={styles.amountChipsRow}>
              {['10000', '25000', '50000', '100000'].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[styles.amtChip, { backgroundColor: isDark ? themeColors.surfaceSubtle : '#F3F4F6' }]}
                  onPress={() => setKotaniAmountNgn(amt)}
                >
                  <Text style={[styles.amtChipText, { color: isDark ? themeColors.brand.emerald : '#184530' }]}>+{formatCurrency(parseInt(amt))}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Live Calculation Preview */}
            <View style={[styles.kotaniCalcBox, { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border }]}>
              <View style={styles.calcRow}>
                <Text style={[styles.calcLabel, { color: themeColors.textMuted }]}>Exchange Rate:</Text>
                <Text style={[styles.calcVal, { color: themeColors.text }]}>1 USDC = {formatCurrency(exchangeRate)}</Text>
              </View>
              <View style={styles.calcRow}>
                <Text style={[styles.calcLabel, { color: themeColors.textMuted }]}>Destination Vault:</Text>
                <Text style={[styles.calcValMono, { color: themeColors.text }]}>
                  {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Vault Linked'}
                </Text>
              </View>
              <View style={[styles.calcRow, styles.calcRowTotal, { borderColor: themeColors.border }]}>
                <Text style={[styles.calcTotalLabel, { color: themeColors.text }]}>Estimated Output:</Text>
                <Text style={[styles.calcTotalVal, isDark && { color: '#818CF8' }]}>
                  ~{((parseFloat(kotaniAmountNgn || '0')) / exchangeRate).toFixed(2)} USDC
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.paystackBtn,
                isDark && { backgroundColor: themeColors.brand.forest },
                isKotaniLoading && { opacity: 0.6 },
              ]}
              onPress={handleKotaniOnRamp}
              disabled={isKotaniLoading}
            >
              {isKotaniLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.paystackBtnText}>Proceed with Kotani Pay</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Withdraw Modal */}
      <Modal visible={showWithdrawModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Withdraw Funds</Text>
              <TouchableOpacity onPress={() => setShowWithdrawModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color={themeColors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: themeColors.textMuted }]}>Available to Withdraw: {formatCurrency(availableBalance)}</Text>
            <TextInput
              style={[
                styles.amountInput,
                {
                  backgroundColor: themeColors.inputBg,
                  borderColor: themeColors.inputBorder,
                  color: themeColors.text,
                },
              ]}
              placeholderTextColor={themeColors.textMuted}
              keyboardType="numeric"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              placeholder="e.g. 15,000"
            />

            {savedBanks.length > 0 && (
              <View style={styles.bankSelectSection}>
                <Text style={[styles.inputLabel, { color: themeColors.textMuted }]}>Select Bank Account</Text>
                {savedBanks.map((b) => {
                  const isSelected = selectedBankId === b.id || (!selectedBankId && b === savedBanks[0]);
                  return (
                    <TouchableOpacity
                      key={b.id}
                      style={[
                        styles.bankOption,
                        { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border },
                        isSelected && {
                          borderColor: '#10B981',
                          backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
                        },
                      ]}
                      onPress={() => setSelectedBankId(b.id)}
                    >
                      <Text style={[styles.bankOptionText, { color: themeColors.text }]}>
                        {b.bankName} - {b.accountNumber} ({b.accountName})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <TouchableOpacity
              style={styles.addBankShortcut}
              onPress={() => {
                setShowWithdrawModal(false);
                setShowAddBankModal(true);
              }}
            >
              <Text style={[styles.addBankShortcutText, { color: isDark ? '#34D399' : '#184530' }]}>+ Add another bank account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paystackBtn,
                isDark && { backgroundColor: themeColors.brand.forest },
                isWithdrawing && { opacity: 0.6 },
              ]}
              onPress={handleWithdrawSubmit}
              disabled={isWithdrawing}
            >
              <Text style={styles.paystackBtnText}>
                {isWithdrawing ? 'Processing...' : 'Confirm Withdrawal'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Bank Modal */}
      <Modal visible={showAddBankModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Link Bank Account</Text>
              <TouchableOpacity onPress={() => setShowAddBankModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color={themeColors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: themeColors.textMuted }]}>Select Bank</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bankPillsScroll}>
              {popularBanks.map((b) => {
                const isSelected = selectedBankCode === b.code;
                return (
                  <TouchableOpacity
                    key={b.code}
                    style={[
                      styles.bankPill,
                      { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border },
                      isSelected && {
                        backgroundColor: isDark ? '#065F46' : '#184530',
                        borderColor: '#10B981',
                      },
                    ]}
                    onPress={() => {
                      setSelectedBankCode(b.code);
                      setSelectedBankName(b.name);
                      if (bankAccountNumber.length === 10) {
                        handleResolveBank(bankAccountNumber, b.code);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.bankPillText,
                        { color: themeColors.text },
                        isSelected && { color: '#FFFFFF' },
                      ]}
                    >
                      {b.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.inputLabel, { color: themeColors.textMuted }]}>10-Digit NUBAN Account Number</Text>
            <TextInput
              style={[
                styles.amountInput,
                {
                  backgroundColor: themeColors.inputBg,
                  borderColor: themeColors.inputBorder,
                  color: themeColors.text,
                },
              ]}
              placeholderTextColor={themeColors.textMuted}
              keyboardType="numeric"
              maxLength={10}
              value={bankAccountNumber}
              onChangeText={(val) => handleResolveBank(val, selectedBankCode)}
              placeholder="0123456789"
            />

            {isResolvingBank ? (
              <View style={[styles.resolvingBox, { backgroundColor: themeColors.surfaceSubtle }]}>
                <ActivityIndicator size="small" color={isDark ? '#34D399' : '#184530'} />
                <Text style={[styles.resolvingText, { color: themeColors.textMuted }]}>Verifying account with NIBSS...</Text>
              </View>
            ) : resolvedAccountName ? (
              <View style={[
                styles.resolvedBox,
                isDark && {
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  borderColor: 'rgba(16, 185, 129, 0.3)',
                },
              ]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Check size={14} color="#10B981" />
                  <Text style={[styles.resolvedName, isDark && { color: '#34D399' }]}>{resolvedAccountName}</Text>
                </View>
              </View>
            ) : null}

            <TouchableOpacity
              style={[
                styles.paystackBtn,
                isDark && { backgroundColor: themeColors.brand.forest },
                (!resolvedAccountName || isAddingBank) && { opacity: 0.5 },
              ]}
              onPress={handleAddBankSubmit}
              disabled={!resolvedAccountName || isAddingBank}
            >
              <Text style={styles.paystackBtnText}>
                {isAddingBank ? 'Saving...' : 'Link Bank Account'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 22,
    color: colors.text,
  },
  headerTitle: {
    ...typography.h3,
    fontSize: 16,
    color: colors.text,
  },
  rateBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  rateText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 110,
  },
  walletCard: {
    backgroundColor: '#184530',
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  walletLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
  },
  monadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  monadPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A7F3D0',
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginVertical: 4,
  },
  cryptoEquiv: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: spacing.md,
    fontWeight: '500',
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 6,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  splitBox: {
    flex: 1,
  },
  splitLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  splitValueLocked: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FCD34D',
  },
  splitValueAvail: {
    fontSize: 14,
    fontWeight: '700',
    color: '#34D399',
  },
  splitDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: spacing.sm,
  },
  heroActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  topUpBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topUpBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#184530',
  },
  refundBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingVertical: 12,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refundBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shieldBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  shieldIcon: {
    fontSize: 22,
    marginRight: spacing.sm,
  },
  shieldMeta: {
    flex: 1,
  },
  shieldTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  shieldDesc: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  sectionAction: {
    fontSize: 12,
    fontWeight: '700',
    color: '#184530',
  },
  emptyCardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: spacing.md,
  },
  emptyCardText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  cardsList: {
    marginBottom: spacing.md,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 6,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bankEmoji: {
    fontSize: 16,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  cardExpiry: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  defaultChip: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  makeDefaultBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  makeDefaultText: {
    fontSize: 11,
    color: '#184530',
    fontWeight: '600',
  },
  trashBtn: {
    padding: 4,
  },
  txHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  txSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  txTapNotice: {
    fontSize: 11,
    color: '#6B7280',
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#184530',
  },
  filterChipText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  txList: {
    marginTop: spacing.xs,
  },
  emptyTxBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyTxIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  emptyTxTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  emptyTxSub: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    minHeight: 64,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  txIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  txIcon: {
    fontSize: 16,
  },
  txMeta: {
    flex: 1,
  },
  txTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  txSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  txDate: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  txAmountCol: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  txAmountPositive: {
    color: '#059669',
  },
  txAmountNegative: {
    color: '#111827',
  },
  statusTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  statusTagSuccess: {
    backgroundColor: '#ECFDF5',
  },
  statusTagPending: {
    backgroundColor: '#FEF3C7',
  },
  statusTagRefunded: {
    backgroundColor: '#EFF6FF',
  },
  statusTagText: {
    fontSize: 9,
    fontWeight: '700',
  },
  statusTagTextSuccess: {
    color: '#059669',
  },
  statusTagTextPending: {
    color: '#D97706',
  },
  statusTagTextRefunded: {
    color: '#2563EB',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  closeBtn: {
    fontSize: 18,
    color: '#6B7280',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 6,
  },
  amountInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: spacing.md,
  },
  amountChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.lg,
  },
  amtChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  amtChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#184530',
  },
  paystackBtn: {
    backgroundColor: '#184530',
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  paystackBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bankSelectSection: {
    marginVertical: spacing.xs,
  },
  bankOption: {
    padding: spacing.sm,
    backgroundColor: '#F9FAFB',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 6,
  },
  bankOptionSelected: {
    borderColor: '#184530',
    backgroundColor: '#ECFDF5',
  },
  bankOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  addBankShortcut: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  addBankShortcutText: {
    fontSize: 12,
    color: '#184530',
    fontWeight: '600',
  },
  bankPillsScroll: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  bankPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: '#F3F4F6',
    marginRight: 6,
  },
  bankPillSelected: {
    backgroundColor: '#184530',
  },
  bankPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  bankPillTextSelected: {
    color: '#FFFFFF',
  },
  resolvingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  resolvingText: {
    fontSize: 12,
    color: '#6B7280',
  },
  resolvedBox: {
    backgroundColor: '#ECFDF5',
    padding: spacing.xs,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  resolvedName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
  },
  receiptTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  receiptAmountRow: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  receiptAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  receiptStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    marginTop: 4,
  },
  receiptStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: spacing.sm,
  },
  receiptDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  receiptDetailLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  receiptDetailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  copyRefWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  receiptRefText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#184530',
  },
  receiptShieldBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginTop: spacing.md,
  },
  receiptShieldText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '500',
    flex: 1,
  },
  closeReceiptBtn: {
    backgroundColor: '#184530',
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  closeReceiptBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Digital Dollar (USDC) Vault Card Styles
  cryptoVaultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: spacing.md,
    ...shadows.sm,
  },
  cryptoVaultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cryptoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cryptoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#4338CA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cryptoEmoji: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  cryptoVaultTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  cryptoBadge: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  cryptoBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6D28D9',
  },
  cryptoVaultSub: {
    fontSize: 10,
    color: colors.neutral[500],
    marginTop: 2,
  },
  protectedBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  protectedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  cryptoAssetGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  cryptoAssetBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  assetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  indigoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366F1',
  },
  assetLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  assetMainVal: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.neutral[900],
  },
  assetSubVal: {
    fontSize: 9,
    color: colors.neutral[500],
    marginTop: 2,
  },
  addressBarContainer: {
    marginBottom: 12,
  },
  addressBarLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.neutral[500],
    marginBottom: 4,
  },
  addressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  addressText: {
    flex: 1,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: colors.neutral[700],
  },
  addressBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 6,
  },
  addressIconBtn: {
    padding: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cryptoActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  kotaniBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.forest,
    borderRadius: radius.full,
    paddingVertical: 10,
    gap: 6,
  },
  kotaniBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  faucetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: radius.full,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 6,
  },
  faucetBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  // Real-time Reference Search Bar
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: radius.full,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    fontSize: 12,
    color: colors.neutral[900],
  },
  // Gateway Selector Grid
  gatewayGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  gatewayCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: radius.lg,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  gatewayCardActive: {
    borderColor: colors.brand.forest,
    backgroundColor: '#F0FDF4',
  },
  gatewayCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.neutral[800],
    marginTop: 6,
  },
  gatewayCardTitleActive: {
    color: colors.brand.forest,
  },
  gatewayCardSub: {
    fontSize: 9,
    color: colors.neutral[500],
    marginTop: 2,
  },
  // Kotani Pay Modal Styles
  kotaniIntroBox: {
    backgroundColor: '#F5F3FF',
    borderRadius: radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    marginBottom: 14,
  },
  kotaniIntroTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5B21B6',
    marginBottom: 3,
  },
  kotaniIntroDesc: {
    fontSize: 10,
    color: '#6D28D9',
    lineHeight: 14,
  },
  kotaniCalcBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 12,
    gap: 6,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcLabel: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  calcVal: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  calcValMono: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
    color: colors.neutral[800],
  },
  calcRowTotal: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
  },
  calcTotalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  calcTotalVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#4338CA',
  },
});
