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
  jobTitle: string;
  clientName: string;
  currentMilestoneTitle: string;
  currentMilestoneNumber: number;
  totalMilestones: number;
  escrowLockedAmount: number;
  status: 'ACTIVE' | 'SUBMITTED' | 'COMPLETED';
}

interface ArtisanContractsListScreenProps {
  onBack?: () => void;
  onOpenContract?: (contractId: string) => void;
  onSubmitProof?: (contractId: string, milestoneId?: string) => void;
}

export const ArtisanContractsListScreen: React.FC<ArtisanContractsListScreenProps> = ({
  onBack,
  onOpenContract,
  onSubmitProof,
}) => {
  const [filter, setFilter] = useState<'ACTIVE' | 'SUBMITTED' | 'COMPLETED'>('ACTIVE');
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadContracts = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await ContractService.getMyContracts('ARTISAN');
      if (Array.isArray(data)) {
        const transformed: ContractItem[] = data.map((c: any) => {
          const milestones = c.milestones || [];
          const hasSubmitted = milestones.some((m: any) => m.status === 'SUBMITTED');
          const isAllCompleted = c.status === 'COMPLETED' || (milestones.length > 0 && milestones.every((m: any) => m.status === 'RELEASED'));

          let mappedStatus: 'ACTIVE' | 'SUBMITTED' | 'COMPLETED' = 'ACTIVE';
          if (hasSubmitted) {
            mappedStatus = 'SUBMITTED';
          } else if (isAllCompleted) {
            mappedStatus = 'COMPLETED';
          } else {
            mappedStatus = 'ACTIVE';
          }

          const activeMilestone = milestones.find((m: any) => m.status === 'IN_PROGRESS' || m.status === 'SUBMITTED') || milestones[0];

          const clientProfile = c.client?.clientProfile;
          const clientName = clientProfile?.firstName
            ? `${clientProfile.firstName} ${clientProfile.lastName || ''}`.trim()
            : 'Verified Client';

          return {
            id: c.id,
            jobTitle: c.job?.title || 'Contract Agreement',
            clientName,
            currentMilestoneTitle: activeMilestone?.title || 'Project Deliverable',
            currentMilestoneNumber: activeMilestone?.stepOrder || 1,
            totalMilestones: milestones.length || 1,
            escrowLockedAmount: Number(c.totalAmount || 0),
            status: mappedStatus,
          };
        });
        setContracts(transformed);
      } else {
        setContracts([]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load artisan contracts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  const activeCount = contracts.filter((c) => c.status === 'ACTIVE').length;
  const submittedCount = contracts.filter((c) => c.status === 'SUBMITTED').length;
  const completedCount = contracts.filter((c) => c.status === 'COMPLETED').length;

  const filteredContracts = contracts.filter((c) => c.status === filter);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
              <Text style={styles.backChevron}>←</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>My Contracts</Text>
        </View>
        <Text style={styles.activePillText}>{activeCount} Active</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setFilter('ACTIVE')}
          style={[styles.tabItem, filter === 'ACTIVE' && styles.tabItemActive]}
        >
          <Text style={[styles.tabLabel, filter === 'ACTIVE' && styles.tabLabelActive]}>
            In Progress ({activeCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFilter('SUBMITTED')}
          style={[styles.tabItem, filter === 'SUBMITTED' && styles.tabItemActive]}
        >
          <Text style={[styles.tabLabel, filter === 'SUBMITTED' && styles.tabLabelActive]}>
            Awaiting Client ({submittedCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFilter('COMPLETED')}
          style={[styles.tabItem, filter === 'COMPLETED' && styles.tabItemActive]}
        >
          <Text style={[styles.tabLabel, filter === 'COMPLETED' && styles.tabLabelActive]}>
            Completed ({completedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading & Error States */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.brand.forest} />
          <Text style={styles.loadingText}>Loading assigned contracts...</Text>
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
        /* Contracts List */
        <FlatList
          data={filteredContracts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadContracts(true)}
              tintColor={colors.brand.forest}
              colors={[colors.brand.forest]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🛠️</Text>
              <Text style={styles.emptyTitle}>
                {filter === 'ACTIVE'
                  ? 'No Active Work In Progress'
                  : filter === 'SUBMITTED'
                  ? 'No Milestones Under Client Review'
                  : 'No Completed Contracts Yet'}
              </Text>
              <Text style={styles.emptySub}>
                {filter === 'ACTIVE'
                  ? 'When a client accepts your bid, your funded smart contract and milestone deliverables will appear here.'
                  : filter === 'SUBMITTED'
                  ? 'Milestone proof of work you upload will show here while awaiting client inspection and payment release.'
                  : 'Successfully delivered projects and earned payouts will be archived here.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobTitle}>{item.jobTitle}</Text>
                  <Text style={styles.clientSub}>Client: {item.clientName}</Text>
                </View>

                <View
                  style={[
                    styles.statusPill,
                    item.status === 'ACTIVE'
                      ? styles.statusPillActive
                      : item.status === 'SUBMITTED'
                      ? styles.statusPillSubmitted
                      : styles.statusPillCompleted,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      item.status === 'ACTIVE'
                        ? styles.statusPillActiveText
                        : item.status === 'SUBMITTED'
                        ? styles.statusPillSubmittedText
                        : styles.statusPillCompletedText,
                    ]}
                  >
                    {item.status === 'ACTIVE'
                      ? 'IN PROGRESS'
                      : item.status === 'SUBMITTED'
                      ? 'AWAITING APPROVAL'
                      : 'PAID & RELEASED'}
                  </Text>
                </View>
              </View>

              {/* Progress Box */}
              <View style={styles.milestoneBox}>
                <View style={styles.milestoneRow}>
                  <Text style={styles.milestoneStepText}>
                    Milestone {item.currentMilestoneNumber} of {item.totalMilestones}
                  </Text>
                  <Text style={styles.milestoneAmount}>
                    {formatCurrency(item.escrowLockedAmount)} in Escrow
                  </Text>
                </View>
                <Text style={styles.milestoneTitleText}>{item.currentMilestoneTitle}</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.openBtn}
                  onPress={() => onOpenContract?.(item.id)}
                >
                  <Text style={styles.openBtnText}>View Project Workspace</Text>
                </TouchableOpacity>

                {item.status === 'ACTIVE' && (
                  <TouchableOpacity
                    style={styles.proofBtn}
                    onPress={() => onSubmitProof?.(item.id)}
                  >
                    <Text style={styles.proofBtnText}>Submit Proof 📸</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      )}
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
  activePillText: {
    fontSize: typography.size.xs,
    fontWeight: '700',
    color: colors.brand.forest,
    backgroundColor: colors.brand.mint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
    borderRadius: radius.md,
    padding: 3,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  tabLabel: {
    fontSize: typography.size.xs,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  tabLabelActive: {
    color: colors.brand.forest,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: spacing.base,
    paddingTop: 14,
    paddingBottom: 40,
    gap: 12,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: 12,
    fontSize: typography.size.sm,
    color: colors.neutral[600],
    fontWeight: '500',
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: typography.size.base,
    fontWeight: '800',
    color: colors.neutral[900],
    marginBottom: 4,
  },
  errorSub: {
    fontSize: typography.size.xs,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: colors.brand.forest,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: typography.size.sm,
    fontWeight: '700',
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
    fontSize: typography.size.base,
    fontWeight: '800',
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  jobTitle: {
    fontSize: typography.size.base,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  clientSub: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusPillActive: {
    backgroundColor: '#DCFCE7',
  },
  statusPillSubmitted: {
    backgroundColor: '#FEF3C7',
  },
  statusPillCompleted: {
    backgroundColor: '#F3F4F6',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusPillActiveText: {
    color: colors.brand.emeraldDark,
  },
  statusPillSubmittedText: {
    color: '#B45309',
  },
  statusPillCompletedText: {
    color: colors.neutral[600],
  },
  milestoneBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    padding: 10,
    marginTop: 12,
  },
  milestoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  milestoneStepText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.neutral[500],
    textTransform: 'uppercase',
  },
  milestoneAmount: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.brand.forest,
  },
  milestoneTitleText: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#F3F4F6',
  },
  openBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 8,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  openBtnText: {
    fontSize: typography.size.xs,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  proofBtn: {
    backgroundColor: colors.brand.forest,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  proofBtnText: {
    fontSize: typography.size.xs,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
