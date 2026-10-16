import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { ContractService } from '../../services/contract.service';

interface ContractItem {
  id: string;
  contractCode: string;
  title: string;
  artisanName: string;
  trade: string;
  totalAmount: number;
  status: 'ACTIVE' | 'REVIEW' | 'COMPLETED';
  milestoneStatus: string;
  startDate: string;
  warrantyStatus?: string;
}

interface ClientContractsListScreenProps {
  onBack?: () => void;
  onSelectContract?: (contractId: string) => void;
  onOpenChat?: (artisanName: string) => void;
}

export const ClientContractsListScreen: React.FC<ClientContractsListScreenProps> = ({
  onBack,
  onSelectContract,
  onOpenChat,
}) => {
  const [tab, setTab] = useState<'ACTIVE' | 'REVIEW' | 'COMPLETED'>('ACTIVE');
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  const loadContracts = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await ContractService.getMyContracts('CLIENT');
      if (Array.isArray(data)) {
        const transformed: ContractItem[] = data.map((c: any) => {
          const milestones = c.milestones || [];
          const hasSubmittedMilestone = milestones.some((m: any) => m.status === 'SUBMITTED');
          const isAllCompleted = c.status === 'COMPLETED' || (milestones.length > 0 && milestones.every((m: any) => m.status === 'RELEASED'));

          let mappedStatus: 'ACTIVE' | 'REVIEW' | 'COMPLETED' = 'ACTIVE';
          if (hasSubmittedMilestone) {
            mappedStatus = 'REVIEW';
          } else if (isAllCompleted) {
            mappedStatus = 'COMPLETED';
          } else {
            mappedStatus = 'ACTIVE';
          }

          let milestoneSummary = 'No milestones scheduled';
          if (milestones.length > 0) {
            const completedCount = milestones.filter((m: any) => m.status === 'RELEASED').length;
            const activeMilestone = milestones.find((m: any) => m.status === 'IN_PROGRESS' || m.status === 'SUBMITTED');
            if (activeMilestone) {
              milestoneSummary = `Milestone ${activeMilestone.stepOrder || 1}/${milestones.length}: ${activeMilestone.title} (${activeMilestone.status})`;
            } else if (completedCount === milestones.length) {
              milestoneSummary = `All ${milestones.length} Milestones Paid & Released`;
            } else {
              milestoneSummary = `${completedCount}/${milestones.length} Milestones Released`;
            }
          }

          const artisanName = c.artisan?.artisanProfile?.businessName ||
            c.artisan?.clientProfile?.firstName ||
            'Assigned Artisan';

          return {
            id: c.id,
            contractCode: c.contractCode || `CTR-${c.id.slice(0, 8).toUpperCase()}`,
            title: c.job?.title || 'Contract Agreement',
            artisanName,
            trade: c.job?.category?.name || c.artisan?.artisanProfile?.trade || 'Services',
            totalAmount: Number(c.totalAmount || 0),
            status: mappedStatus,
            milestoneStatus: milestoneSummary,
            startDate: formatDate(c.createdAt),
            warrantyStatus: isAllCompleted ? 'Warranty Active' : 'Escrow Protected',
          };
        });
        setContracts(transformed);
      } else {
        setContracts([]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load contracts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  const filtered = contracts.filter((c) => {
    if (tab === 'ACTIVE') return c.status === 'ACTIVE';
    if (tab === 'REVIEW') return c.status === 'REVIEW';
    if (tab === 'COMPLETED') return c.status === 'COMPLETED';
    return true;
  });

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
        )}
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Contracts & Agreements</Text>
          <Text style={styles.headerSubtitle}>Legally binding smart escrow contracts</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrap}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'ACTIVE' && styles.tabBtnActive]}
          onPress={() => setTab('ACTIVE')}
        >
          <Text style={[styles.tabText, tab === 'ACTIVE' && styles.tabTextActive]}>
            Active ({contracts.filter((c) => c.status === 'ACTIVE').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'REVIEW' && styles.tabBtnActive]}
          onPress={() => setTab('REVIEW')}
        >
          <Text style={[styles.tabText, tab === 'REVIEW' && styles.tabTextActive]}>
            Under Review ({contracts.filter((c) => c.status === 'REVIEW').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'COMPLETED' && styles.tabBtnActive]}
          onPress={() => setTab('COMPLETED')}
        >
          <Text style={[styles.tabText, tab === 'COMPLETED' && styles.tabTextActive]}>
            Archived ({contracts.filter((c) => c.status === 'COMPLETED').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching contracts...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Could not load contracts</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity onPress={() => loadContracts()} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* List */
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadContracts(true)}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📜</Text>
              <Text style={styles.emptyTitle}>
                {tab === 'ACTIVE'
                  ? 'No Active Contracts'
                  : tab === 'REVIEW'
                  ? 'No Milestones Pending Review'
                  : 'No Archived Contracts'}
              </Text>
              <Text style={styles.emptySub}>
                {tab === 'ACTIVE'
                  ? 'When you accept an artisan proposal, a legally binding contract with smart escrow custody will be created here.'
                  : tab === 'REVIEW'
                  ? 'When artisans submit proof of completed milestones, they will appear here for your verification and payment release.'
                  : 'Past completed contracts and warranty records will be safely archived in this tab.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contractCode}>{item.contractCode}</Text>
                  <Text style={styles.title}>{item.title}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    item.status === 'ACTIVE'
                      ? styles.statusActive
                      : item.status === 'REVIEW'
                      ? styles.statusReview
                      : styles.statusCompleted,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      item.status === 'ACTIVE'
                        ? styles.statusActiveText
                        : item.status === 'REVIEW'
                        ? styles.statusReviewText
                        : styles.statusCompletedText,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              {/* Artisan & Amount */}
              <View style={styles.metaRow}>
                <View style={styles.artisanCol}>
                  <Text style={styles.metaLabel}>Contractor</Text>
                  <Text style={styles.metaVal}>{item.artisanName} ({item.trade})</Text>
                </View>
                <View style={styles.amountCol}>
                  <Text style={styles.metaLabel}>Total Escrow</Text>
                  <Text style={styles.amountVal}>{formatCurrency(item.totalAmount)}</Text>
                </View>
              </View>

              {/* Milestone status indicator */}
              <View style={styles.milestoneBox}>
                <Text style={styles.milestoneBoxLabel}>Milestone Status</Text>
                <Text style={styles.milestoneBoxVal}>🔹 {item.milestoneStatus}</Text>
              </View>

              {/* Warranty Badge */}
              {item.warrantyStatus && (
                <View style={styles.warrantyRow}>
                  <Text style={styles.warrantyText}>🛡️ {item.warrantyStatus}</Text>
                  <Text style={styles.dateText}>Started {item.startDate}</Text>
                </View>
              )}

              {/* Card Actions */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.chatActionBtn}
                  onPress={() => onOpenChat?.(item.artisanName)}
                >
                  <Text style={styles.chatActionText}>💬 Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.detailsActionBtn}
                  onPress={() => onSelectContract?.(item.id)}
                >
                  <Text style={styles.detailsActionText}>View Milestones & Proof ›</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
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
  tabsWrap: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  tabBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.background,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 40,
    gap: spacing.md,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: 12,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  errorTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 4,
  },
  errorSub: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: typography.caption.fontSize,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySub: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: 8,
  },
  contractCode: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  title: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusActive: {
    backgroundColor: colors.primaryLight,
  },
  statusReview: {
    backgroundColor: '#FEF3C7',
  },
  statusCompleted: {
    backgroundColor: '#E5E7EB',
  },
  statusBadgeText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 10,
  },
  statusActiveText: {
    color: colors.primary,
  },
  statusReviewText: {
    color: '#B45309',
  },
  statusCompletedText: {
    color: colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.xs,
  },
  artisanCol: {
    flex: 1,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  metaLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  metaVal: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  amountVal: {
    ...typography.body,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
  },
  milestoneBox: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginVertical: spacing.xs,
  },
  milestoneBoxLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 2,
  },
  milestoneBoxVal: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text,
  },
  warrantyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
  },
  warrantyText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 10,
  },
  dateText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  chatActionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatActionText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text,
  },
  detailsActionBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsActionText: {
    ...typography.caption,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
