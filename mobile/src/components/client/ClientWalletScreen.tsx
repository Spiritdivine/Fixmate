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
} from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { WalletService } from '../../services/wallet.service';

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
}

export const ClientWalletScreen: React.FC<ClientWalletScreenProps> = ({ onBack }) => {
  const queryClient = useQueryClient();
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
      Alert.alert('Address Copied', `${walletAddress}\n\nCopied to clipboard.`);
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
      Alert.alert('Test USDC Minted! ⚡', '100 Test USDC (~₦148,500) has been credited to your Monad escrow vault for testing.');
    } catch (err: any) {
      Alert.alert('Faucet Error', err?.message || 'Could not mint test tokens.');
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
          'Kotani On-Ramp Successful 🎉',
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
        Alert.alert('Test Deposit Successful! 💳', `${formatCurrency(num)} credited to your available balance.`);
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
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Escrow & Wallet</Text>
        <View style={styles.rateBadge}>
          <Text style={styles.rateText}>1 USDC ≈ ₦{Math.round(exchangeRate).toLocaleString()}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Multi-Asset Balance Hero Card */}
        <View style={styles.walletCard}>
          <View style={styles.heroTopRow}>
            <Text style={styles.walletLabel}>TOTAL VAULT VALUATION</Text>
            <View style={styles.monadPill}>
              <ShieldCheck size={11} color="#A7F3D0" />
              <Text style={styles.monadPillText}>Monad Protected</Text>
            </View>
          </View>

          <Text style={styles.totalAmount}>{formatCurrency(totalBalance)}</Text>
          <Text style={styles.cryptoEquiv}>
            ≈ ${cryptoEquivalentUsd} USDC · Monad Testnet (Zero-Gas 🛡️)
          </Text>

          <View style={styles.splitRow}>
            <View style={styles.splitBox}>
              <Text style={styles.splitLabel}>🔒 Locked in Escrow</Text>
              <Text style={styles.splitValueLocked}>{formatCurrency(lockedInEscrow)}</Text>
            </View>
            <View style={styles.splitDivider} />
            <View style={styles.splitBox}>
              <Text style={styles.splitLabel}>💳 Available to Spend</Text>
              <Text style={styles.splitValueAvail}>{formatCurrency(availableBalance)}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={styles.topUpBtn}
              onPress={() => setShowTopUpModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.topUpBtnText}>+ Fund Wallet</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.refundBtn}
              onPress={() => setShowWithdrawModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.refundBtnText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Digital Dollar (USDC) Vault Card (Web Mirroring) */}
        <View style={styles.cryptoVaultCard}>
          <View style={styles.cryptoVaultHeader}>
            <View style={styles.cryptoTitleRow}>
              <View style={styles.cryptoIconBox}>
                <Text style={styles.cryptoEmoji}>⚡</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.cryptoVaultTitle}>Digital Dollar (USDC) Vault</Text>
                  <View style={styles.cryptoBadge}>
                    <Text style={styles.cryptoBadgeText}>Privy Embedded</Text>
                  </View>
                </View>
                <Text style={styles.cryptoVaultSub}>Automated Smart Escrow Network</Text>
              </View>
            </View>
            <View style={styles.protectedBadge}>
              <Text style={styles.protectedBadgeText}>Protected</Text>
            </View>
          </View>

          {/* Multi-Token Asset Grid */}
          <View style={styles.cryptoAssetGrid}>
            <View style={styles.cryptoAssetBox}>
              <View style={styles.assetHeaderRow}>
                <View style={styles.greenDot} />
                <Text style={styles.assetLabel}>Digital USD (USDC)</Text>
              </View>
              <Text style={styles.assetMainVal}>${cryptoEquivalentUsd}</Text>
              <Text style={styles.assetSubVal}>≈ {formatCurrency(totalBalance)}</Text>
            </View>

            <View style={styles.cryptoAssetBox}>
              <View style={styles.assetHeaderRow}>
                <View style={styles.indigoDot} />
                <Text style={styles.assetLabel}>Monad Gas Credits</Text>
              </View>
              <Text style={styles.assetMainVal}>Sponsored ⚡</Text>
              <Text style={styles.assetSubVal}>Zero-Gas Relay Active</Text>
            </View>
          </View>

          {/* Permanent Account Address Bar */}
          <View style={styles.addressBarContainer}>
            <Text style={styles.addressBarLabel}>Digital Escrow Account ID</Text>
            <View style={styles.addressBar}>
              <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="middle">
                {walletAddress}
              </Text>
              <View style={styles.addressBtnRow}>
                <TouchableOpacity
                  onPress={handleCopyAddress}
                  style={styles.addressIconBtn}
                  activeOpacity={0.7}
                >
                  <Copy size={13} color={isCopied ? '#059669' : '#4B5563'} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleOpenExplorer}
                  style={styles.addressIconBtn}
                  activeOpacity={0.7}
                >
                  <ExternalLink size={13} color="#4B5563" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Crypto Actions: Kotani Pay On-Ramp + Faucet */}
          <View style={styles.cryptoActionRow}>
            <TouchableOpacity
              style={styles.kotaniBtn}
              onPress={() => setShowKotaniModal(true)}
              activeOpacity={0.8}
            >
              <Coins size={14} color="#FFFFFF" />
              <Text style={styles.kotaniBtnText}>Buy USDC (Kotani)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.faucetBtn}
              onPress={handleFaucetMint}
              disabled={isMintingFaucet}
              activeOpacity={0.8}
            >
              {isMintingFaucet ? (
                <ActivityIndicator size="small" color="#D97706" />
              ) : (
                <>
                  <Zap size={14} color="#D97706" />
                  <Text style={styles.faucetBtnText}>Test Faucet (+100)</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Shield Banner */}
        <View style={styles.shieldBanner}>
          <Text style={styles.shieldIcon}>🛡️</Text>
          <View style={styles.shieldMeta}>
            <Text style={styles.shieldTitle}>Protected Escrow Custody</Text>
            <Text style={styles.shieldDesc}>
              Escrow funds are held in NDIC-insured trust accounts and regulated smart contracts.
            </Text>
          </View>
        </View>

        {/* Saved Cards Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Saved Payment Cards</Text>
          <TouchableOpacity onPress={() => setShowTopUpModal(true)}>
            <Text style={styles.sectionAction}>+ Add Card</Text>
          </TouchableOpacity>
        </View>

        {savedCards.length === 0 ? (
          <View style={styles.emptyCardBox}>
            <CreditCard size={18} color="#9CA3AF" />
            <Text style={styles.emptyCardText}>
              No saved cards yet. Cards used for deposits are securely saved here for 1-tap escrow funding.
            </Text>
          </View>
        ) : (
          <View style={styles.cardsList}>
            {savedCards.map((card: any) => (
              <View key={card.id} style={styles.cardItem}>
                <View style={styles.cardInfo}>
                  <CreditCard size={18} color="#184530" />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.cardTitle}>
                      {card.brand || 'Debit Card'} •••• {card.last4}
                    </Text>
                    <Text style={styles.cardExpiry}>
                      Expires {card.expMonth}/{card.expYear}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  {card.isDefault ? (
                    <View style={styles.defaultChip}>
                      <Text style={styles.defaultChipText}>Default</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleSetDefaultCard(card.id)}
                      style={styles.makeDefaultBtn}
                    >
                      <Text style={styles.makeDefaultText}>Set Default</Text>
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
          <Text style={styles.sectionTitle}>Linked Bank Accounts</Text>
          <TouchableOpacity onPress={() => setShowAddBankModal(true)}>
            <Text style={styles.sectionAction}>+ Add Bank</Text>
          </TouchableOpacity>
        </View>

        {savedBanks.length === 0 ? (
          <View style={styles.emptyCardBox}>
            <Text style={styles.emptyCardText}>
              No bank account linked. Link your Nigerian bank account to receive refunds or payouts.
            </Text>
          </View>
        ) : (
          <View style={styles.cardsList}>
            {savedBanks.map((bank: any) => (
              <View key={bank.id} style={styles.cardItem}>
                <View style={styles.cardInfo}>
                  <Text style={styles.bankEmoji}>🏦</Text>
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.cardTitle}>{bank.bankName}</Text>
                    <Text style={styles.cardExpiry}>
                      {bank.accountNumber} · {bank.accountName}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  {bank.isDefault ? (
                    <View style={styles.defaultChip}>
                      <Text style={styles.defaultChipText}>Default</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleSetDefaultBank(bank.id)}
                      style={styles.makeDefaultBtn}
                    >
                      <Text style={styles.makeDefaultText}>Set Default</Text>
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

        {/* Transactions Section */}
        <View style={styles.txHeaderRow}>
          <Text style={styles.txSectionTitle}>Transaction Activity</Text>
          <Text style={styles.txTapNotice}>Tap transaction for receipt</Text>
        </View>

        {/* Real-time Reference Search Bar (Mirroring Web) */}
        <View style={styles.searchBarBox}>
          <Search size={14} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions by reference or description..."
            value={searchRef}
            onChangeText={setSearchRef}
            placeholderTextColor="#9CA3AF"
          />
          {searchRef.length > 0 && (
            <TouchableOpacity onPress={() => setSearchRef('')} style={{ padding: 4 }}>
              <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 'bold' }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <View style={styles.filterScroll}>
          {(['ALL', 'ESCROW', 'RELEASES', 'TOPUPS'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                {f === 'ALL'
                  ? 'All Transactions'
                  : f === 'ESCROW'
                  ? 'Locked in Escrow'
                  : f === 'RELEASES'
                  ? 'Released'
                  : 'Top-ups'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transaction Items */}
        <View style={styles.txList}>
          {filteredTxs.length === 0 ? (
            <View style={styles.emptyTxBox}>
              <Text style={styles.emptyTxIcon}>💳</Text>
              <Text style={styles.emptyTxTitle}>No Transactions Found</Text>
              <Text style={styles.emptyTxSub}>
                Deposits, escrow locks, and milestone releases will be reflected here in your real-time ledger.
              </Text>
            </View>
          ) : (
            filteredTxs.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.txCard}
                onPress={() => setSelectedReceipt(item)}
                activeOpacity={0.7}
              >
                <View style={styles.txIconWrap}>
                  <Text style={styles.txIcon}>
                    {item.type === 'ESCROW_LOCK'
                      ? '🔒'
                      : item.type === 'RELEASE'
                      ? '💸'
                      : item.type === 'TOP_UP'
                      ? '💳'
                      : '↩️'}
                  </Text>
                </View>
                <View style={styles.txMeta}>
                  <Text style={styles.txTitle}>{item.title}</Text>
                  <Text style={styles.txSub}>{item.subtitle}</Text>
                  <Text style={styles.txDate}>{item.date}</Text>
                </View>
                <View style={styles.txAmountCol}>
                  <Text
                    style={[
                      styles.txAmount,
                      item.amount > 0 ? styles.txAmountPositive : styles.txAmountNegative,
                    ]}
                  >
                    {item.amount > 0 ? `+${formatCurrency(item.amount)}` : formatCurrency(item.amount)}
                  </Text>
                  <View
                    style={[
                      styles.statusTag,
                      item.status === 'PENDING'
                        ? styles.statusTagPending
                        : item.status === 'REFUNDED'
                        ? styles.statusTagRefunded
                        : styles.statusTagSuccess,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusTagText,
                        item.status === 'PENDING'
                          ? styles.statusTagTextPending
                          : item.status === 'REFUNDED'
                          ? styles.statusTagTextRefunded
                          : styles.statusTagTextSuccess,
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
      </ScrollView>

      {/* Transaction Receipt Modal */}
      <Modal visible={!!selectedReceipt} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.receiptCard}>
            <View style={styles.receiptTopRow}>
              <Text style={styles.receiptHeader}>Transaction Receipt</Text>
              <TouchableOpacity onPress={() => setSelectedReceipt(null)}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedReceipt && (
              <>
                <View style={styles.receiptAmountRow}>
                  <Text style={styles.receiptAmount}>
                    {selectedReceipt.amount > 0
                      ? `+${formatCurrency(selectedReceipt.amount)}`
                      : formatCurrency(selectedReceipt.amount)}
                  </Text>
                  <View style={styles.receiptStatusBadge}>
                    <CheckCircle size={12} color="#059669" />
                    <Text style={styles.receiptStatusText}>{selectedReceipt.status}</Text>
                  </View>
                </View>

                <View style={styles.receiptDivider} />

                <View style={styles.receiptDetailRow}>
                  <Text style={styles.receiptDetailLabel}>Description</Text>
                  <Text style={styles.receiptDetailValue}>{selectedReceipt.title}</Text>
                </View>

                <View style={styles.receiptDetailRow}>
                  <Text style={styles.receiptDetailLabel}>Date & Time</Text>
                  <Text style={styles.receiptDetailValue}>{selectedReceipt.fullDate || selectedReceipt.date}</Text>
                </View>

                <View style={styles.receiptDetailRow}>
                  <Text style={styles.receiptDetailLabel}>Transaction Type</Text>
                  <Text style={styles.receiptDetailValue}>{selectedReceipt.type}</Text>
                </View>

                <View style={styles.receiptDetailRow}>
                  <Text style={styles.receiptDetailLabel}>Reference</Text>
                  <TouchableOpacity
                    style={styles.copyRefWrap}
                    onPress={async () => {
                      if (selectedReceipt.reference) {
                        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        Alert.alert('Reference Saved', `Reference ID: ${selectedReceipt.reference}`);
                      }
                    }}
                  >
                    <Text style={styles.receiptRefText}>{selectedReceipt.reference}</Text>
                    <Copy size={13} color="#184530" />
                  </TouchableOpacity>
                </View>

                <View style={styles.receiptShieldBanner}>
                  <ShieldCheck size={14} color="#065F46" />
                  <Text style={styles.receiptShieldText}>
                    Verified on Monad Smart Contract Escrow Registry
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.closeReceiptBtn}
                  onPress={() => setSelectedReceipt(null)}
                >
                  <Text style={styles.closeReceiptBtnText}>Done</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Top-up Modal (Dual Method: Paystack Gateway & Sandbox Dev) */}
      <Modal visible={showTopUpModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Deposit Funds</Text>
              <TouchableOpacity onPress={() => setShowTopUpModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Deposit Amount (₦)</Text>
            <TextInput
              style={styles.amountInput}
              keyboardType="numeric"
              value={topUpAmount}
              onChangeText={setTopUpAmount}
              placeholder="e.g. 20,000"
            />

            <View style={styles.amountChipsRow}>
              {['10000', '25000', '50000', '100000'].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={styles.amtChip}
                  onPress={() => setTopUpAmount(amt)}
                >
                  <Text style={styles.amtChipText}>+{formatCurrency(parseInt(amt))}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Payment Method Selector (Mirroring Web) */}
            <Text style={[styles.inputLabel, { marginTop: 14 }]}>Payment Rail</Text>
            <View style={styles.gatewayGrid}>
              <TouchableOpacity
                onPress={() => setDepositMethod('PAYSTACK')}
                style={[
                  styles.gatewayCard,
                  depositMethod === 'PAYSTACK' && styles.gatewayCardActive,
                ]}
                activeOpacity={0.8}
              >
                <CreditCard size={18} color={depositMethod === 'PAYSTACK' ? '#059669' : '#6B7280'} />
                <Text style={[styles.gatewayCardTitle, depositMethod === 'PAYSTACK' && styles.gatewayCardTitleActive]}>
                  Paystack Checkout
                </Text>
                <Text style={styles.gatewayCardSub}>Debit Card, Bank Transfer, USSD</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setDepositMethod('SIMULATE')}
                style={[
                  styles.gatewayCard,
                  depositMethod === 'SIMULATE' && styles.gatewayCardActive,
                ]}
                activeOpacity={0.8}
              >
                <Zap size={18} color={depositMethod === 'SIMULATE' ? '#059669' : '#6B7280'} />
                <Text style={[styles.gatewayCardTitle, depositMethod === 'SIMULATE' && styles.gatewayCardTitleActive]}>
                  Instant Sandbox Credit
                </Text>
                <Text style={styles.gatewayCardSub}>Zero-delay simulated dev funding</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.paystackBtn, isProcessing && { opacity: 0.6 }]}
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
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Buy USDC with Naira (Kotani Pay)</Text>
              <TouchableOpacity onPress={() => setShowKotaniModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.kotaniIntroBox}>
              <Text style={styles.kotaniIntroTitle}>⚡ Direct Naira to Digital USD On-Ramp</Text>
              <Text style={styles.kotaniIntroDesc}>
                Convert Naira directly into cryptographic USDC deposited into your linked Monad escrow vault.
              </Text>
            </View>

            <Text style={styles.inputLabel}>Deposit Amount (₦ NGN)</Text>
            <TextInput
              style={styles.amountInput}
              keyboardType="numeric"
              value={kotaniAmountNgn}
              onChangeText={setKotaniAmountNgn}
              placeholder="e.g. 25,000"
            />

            <View style={styles.amountChipsRow}>
              {['10000', '25000', '50000', '100000'].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={styles.amtChip}
                  onPress={() => setKotaniAmountNgn(amt)}
                >
                  <Text style={styles.amtChipText}>+{formatCurrency(parseInt(amt))}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Live Calculation Preview */}
            <View style={styles.kotaniCalcBox}>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Exchange Rate:</Text>
                <Text style={styles.calcVal}>1 USDC = {formatCurrency(exchangeRate)}</Text>
              </View>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Destination Vault:</Text>
                <Text style={styles.calcValMono}>
                  {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Vault Linked'}
                </Text>
              </View>
              <View style={[styles.calcRow, styles.calcRowTotal]}>
                <Text style={styles.calcTotalLabel}>Estimated Output:</Text>
                <Text style={styles.calcTotalVal}>
                  ~{((parseFloat(kotaniAmountNgn || '0')) / exchangeRate).toFixed(2)} USDC
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.paystackBtn, isKotaniLoading && { opacity: 0.6 }]}
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
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Withdraw Funds</Text>
              <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Available to Withdraw: {formatCurrency(availableBalance)}</Text>
            <TextInput
              style={styles.amountInput}
              keyboardType="numeric"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              placeholder="e.g. 15,000"
            />

            {savedBanks.length > 0 && (
              <View style={styles.bankSelectSection}>
                <Text style={styles.inputLabel}>Select Bank Account</Text>
                {savedBanks.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={[
                      styles.bankOption,
                      (selectedBankId === b.id || (!selectedBankId && b === savedBanks[0])) &&
                        styles.bankOptionSelected,
                    ]}
                    onPress={() => setSelectedBankId(b.id)}
                  >
                    <Text style={styles.bankOptionText}>
                      {b.bankName} - {b.accountNumber} ({b.accountName})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.addBankShortcut}
              onPress={() => {
                setShowWithdrawModal(false);
                setShowAddBankModal(true);
              }}
            >
              <Text style={styles.addBankShortcutText}>+ Add another bank account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paystackBtn, isWithdrawing && { opacity: 0.6 }]}
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
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Link Bank Account</Text>
              <TouchableOpacity onPress={() => setShowAddBankModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Select Bank</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bankPillsScroll}>
              {popularBanks.map((b) => (
                <TouchableOpacity
                  key={b.code}
                  style={[
                    styles.bankPill,
                    selectedBankCode === b.code && styles.bankPillSelected,
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
                      selectedBankCode === b.code && styles.bankPillTextSelected,
                    ]}
                  >
                    {b.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>10-Digit NUBAN Account Number</Text>
            <TextInput
              style={styles.amountInput}
              keyboardType="numeric"
              maxLength={10}
              value={bankAccountNumber}
              onChangeText={(val) => handleResolveBank(val, selectedBankCode)}
              placeholder="0123456789"
            />

            {isResolvingBank ? (
              <View style={styles.resolvingBox}>
                <ActivityIndicator size="small" color="#184530" />
                <Text style={styles.resolvingText}>Verifying account with NIBSS...</Text>
              </View>
            ) : resolvedAccountName ? (
              <View style={styles.resolvedBox}>
                <Text style={styles.resolvedName}>✓ {resolvedAccountName}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[
                styles.paystackBtn,
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
    padding: spacing.xs,
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
    paddingBottom: spacing.xl,
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
    borderRadius: radius.md,
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
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  topUpBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#184530',
  },
  refundBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
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
    gap: 6,
    marginVertical: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#184530',
  },
  filterChipText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
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
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  txIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    borderRadius: radius.lg,
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
