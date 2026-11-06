import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Modal,
  RefreshControl,
  Share,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft,
  Search,
  CheckCircle,
  Copy,
  Share2,
  X,
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  CreditCard,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { radius, spacing, typography, shadows, touchTargets } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { WalletService } from '../../services/wallet.service';
import { useToast } from '../shared/ToastContext';

export interface TransactionItem {
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

interface ClientTransactionActivityScreenProps {
  onBack: () => void;
}

export const ClientTransactionActivityScreen: React.FC<ClientTransactionActivityScreenProps> = ({ onBack }) => {
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const { showSuccess } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ESCROW' | 'RELEASES' | 'TOPUPS'>('ALL');
  const [selectedReceipt, setSelectedReceipt] = useState<TransactionItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // 1. Fetch wallet & transaction ledger from shared cache
  const { data: walletData, isLoading } = useQuery({
    queryKey: ['wallet', 'client'],
    queryFn: () => WalletService.getMyWallet(),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['wallet'] });
    setRefreshing(false);
  };

  // 2. Normalize transaction records
  const liveTransactions: TransactionItem[] = useMemo(() => {
    if (!walletData?.transactions || walletData.transactions.length === 0) return [];
    return walletData.transactions.map((tx: any) => {
      let mappedType: 'ESCROW_LOCK' | 'RELEASE' | 'TOP_UP' | 'REFUND' = 'TOP_UP';
      const rawType = (tx.type || '').toUpperCase();
      if (rawType === 'ESCROW_LOCK') mappedType = 'ESCROW_LOCK';
      else if (rawType === 'ESCROW_RELEASE' || rawType === 'MILESTONE_RELEASE') mappedType = 'RELEASE';
      else if (rawType === 'REFUND') mappedType = 'REFUND';

      const isDebit = mappedType === 'ESCROW_LOCK';
      const rawAmount = Math.abs(Number(tx.amount || 0));
      const displayAmount = isDebit ? -rawAmount : rawAmount;

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
    });
  }, [walletData]);

  // 3. Filter and search
  const filteredTransactions = useMemo(() => {
    return liveTransactions.filter((tx) => {
      if (activeFilter === 'ESCROW' && tx.type !== 'ESCROW_LOCK') return false;
      if (activeFilter === 'RELEASES' && tx.type !== 'RELEASE') return false;
      if (activeFilter === 'TOPUPS' && tx.type !== 'TOP_UP') return false;

      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesRef = tx.reference?.toLowerCase().includes(query);
        const matchesTitle = tx.title.toLowerCase().includes(query);
        if (!matchesRef && !matchesTitle) return false;
      }
      return true;
    });
  }, [liveTransactions, activeFilter, searchQuery]);

  const handleCopyReference = (ref: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showSuccess(`Reference copied: ${ref}`);
  };

  const handleShareReceipt = async (item: TransactionItem) => {
    try {
      await Share.share({
        title: 'Artifix Transaction Receipt',
        message: `Artifix Verified Receipt\nType: ${item.title}\nAmount: ${formatCurrency(item.amount)}\nRef: ${item.reference}\nStatus: ${item.status}\nDate: ${item.fullDate}`,
      });
    } catch {
      // ignore
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBorder }]}>
        <TouchableOpacity onPress={onBack} hitSlop={touchTargets.hitSlop} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Transaction Activity</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>
            {filteredTransactions.length} recorded escrow settlements & top-ups
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchBox, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
        <Search size={16} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search by reference or description..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={touchTargets.hitSlop}>
            <X size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.chipRow}>
        {(['ALL', 'ESCROW', 'RELEASES', 'TOPUPS'] as const).map((chip) => {
          const isActive = activeFilter === chip;
          return (
            <TouchableOpacity
              key={chip}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive ? colors.primary : colors.surface,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setActiveFilter(chip);
              }}
            >
              <Text style={[styles.chipText, { color: isActive ? '#FFFFFF' : colors.textMuted }]}>
                {chip === 'ALL' ? 'All Activity' : chip === 'ESCROW' ? 'Escrow Locked' : chip === 'RELEASES' ? 'Releases' : 'Top-ups'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Transaction List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredTransactions.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <CreditCard size={36} color={colors.textMuted} style={{ marginBottom: 8 }} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Transactions Found</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              {searchQuery ? 'No matching references found. Try another query.' : 'Your escrow deposits, releases, and refunds will appear here in real time.'}
            </Text>
          </View>
        ) : (
          filteredTransactions.map((tx) => (
            <TouchableOpacity
              key={tx.id}
              style={[styles.txCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setSelectedReceipt(tx);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, { backgroundColor: colors.surfaceSubtle }]}>
                {tx.type === 'ESCROW_LOCK' && <Lock size={18} color="#D97706" />}
                {tx.type === 'RELEASE' && <ArrowUpRight size={18} color="#10B981" />}
                {tx.type === 'TOP_UP' && <ArrowDownLeft size={18} color="#3B82F6" />}
                {tx.type === 'REFUND' && <RotateCcw size={18} color="#8B5CF6" />}
              </View>
              <View style={styles.txMeta}>
                <Text style={[styles.txTitle, { color: colors.text }]} numberOfLines={1}>{tx.title}</Text>
                <Text style={[styles.txRef, { color: colors.textMuted }]} numberOfLines={1}>{tx.subtitle}</Text>
                <Text style={[styles.txDate, { color: colors.textMuted }]}>{tx.date}</Text>
              </View>
              <View style={styles.amountCol}>
                <Text style={[styles.amountText, { color: tx.amount < 0 ? '#DC2626' : '#10B981' }]}>
                  {tx.amount > 0 ? `+${formatCurrency(tx.amount)}` : formatCurrency(tx.amount)}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: tx.status === 'SUCCESS' ? colors.successBg : colors.warningBg }]}>
                  <Text style={[styles.statusText, { color: tx.status === 'SUCCESS' ? colors.success : colors.warning }]}>
                    {tx.status}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Transaction Receipt Modal */}
      <Modal visible={!!selectedReceipt} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.receiptCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.receiptTopRow}>
              <Text style={[styles.receiptHeader, { color: colors.text }]}>Transaction Receipt</Text>
              <TouchableOpacity onPress={() => setSelectedReceipt(null)} hitSlop={touchTargets.hitSlop}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {selectedReceipt && (
              <>
                <View style={styles.receiptAmountRow}>
                  <Text style={[styles.receiptAmount, { color: colors.text }]}>
                    {selectedReceipt.amount > 0 ? `+${formatCurrency(selectedReceipt.amount)}` : formatCurrency(selectedReceipt.amount)}
                  </Text>
                  <View style={[styles.receiptStatusBadge, { backgroundColor: colors.successBg }]}>
                    <CheckCircle size={12} color={colors.success} />
                    <Text style={[styles.receiptStatusText, { color: colors.success }]}>{selectedReceipt.status}</Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Description</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{selectedReceipt.title}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Date & Time</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{selectedReceipt.fullDate || selectedReceipt.date}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Reference</Text>
                  <TouchableOpacity
                    style={styles.refRow}
                    onPress={() => selectedReceipt.reference && handleCopyReference(selectedReceipt.reference)}
                  >
                    <Text style={[styles.refText, { color: colors.primary }]}>{selectedReceipt.reference}</Text>
                    <Copy size={12} color={colors.primary} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.shareBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleShareReceipt(selectedReceipt)}
                >
                  <Share2 size={16} color="#FFFFFF" />
                  <Text style={styles.shareBtnText}>Share Official Receipt</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: { marginRight: spacing.sm },
  headerTitleWrap: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 1 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: 13 },
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    marginVertical: spacing.md,
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.base, paddingBottom: 40, gap: spacing.sm },
  emptyBox: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: spacing.xl,
  },
  emptyIcon: { fontSize: 32, marginBottom: spacing.sm },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: spacing.xs },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    ...shadows.sm,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  txMeta: { flex: 1, marginRight: spacing.sm },
  txTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  txRef: { fontSize: 11, marginBottom: 2 },
  txDate: { fontSize: 11 },
  amountCol: { alignItems: 'flex-end' },
  amountText: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.xs },
  statusText: { fontSize: 10, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  receiptCard: {
    width: '100%',
    borderRadius: radius['2xl'],
    padding: spacing.lg,
    borderWidth: 1,
    ...shadows.lg,
  },
  receiptTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  receiptHeader: { fontSize: 16, fontWeight: '700' },
  receiptAmountRow: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  receiptAmount: { fontSize: 28, fontWeight: '800', marginBottom: spacing.xs },
  receiptStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  receiptStatusText: { fontSize: 11, fontWeight: '700' },
  divider: { height: 1, marginVertical: spacing.md },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: { fontSize: 13 },
  detailValue: { fontSize: 13, fontWeight: '600' },
  refRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  refText: { fontSize: 13, fontWeight: '700' },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 48,
    borderRadius: radius.xl,
    marginTop: spacing.lg,
  },
  shareBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
