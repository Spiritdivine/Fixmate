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
  Image,
} from 'react-native';
import { colors, radius, spacing, typography, shadows, useTheme } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { ContractService } from '../../services/contract.service';
import { SkeletonContractCard } from '../shared';
import {
  ArrowLeft,
  ShieldCheck,
  Clock,
  MessageSquare,
  ChevronRight,
  FileText,
  AlertCircle,
  Wrench,
  CheckCircle2,
  Calendar,
  User,
} from 'lucide-react-native';

interface ContractItem {
  id: string;
  contractCode: string;
  title: string;
  artisanName: string;
  trade: string;
  totalAmount: number;
  status: 'ACTIVE' | 'REVIEW' | 'COMPLETED';
  milestoneStatus: string;
  milestoneProgressText?: string;
  startDate: string;
  warrantyStatus?: string;
  imageUrl?: string | null;
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
  const { colors: themeColors, isDark } = useTheme();
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

          const completedCount = milestones.filter((m: any) => m.status === 'RELEASED').length;
          const totalMilestones = milestones.length;
          const milestoneProgressText = `${completedCount}/${totalMilestones} Milestones Released`;

          let milestoneSummary = 'No milestones scheduled';
          if (milestones.length > 0) {
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

          const rawImg = c.job?.attachments?.[0]?.fileUrl || c.job?.attachments?.[0]?.url || c.job?.coverImageUrl || null;

          return {
            id: c.id,
            contractCode: c.contractCode || `CTR-${c.id.slice(0, 8).toUpperCase()}`,
            title: c.job?.title || 'Contract Agreement',
            artisanName,
            trade: c.job?.category?.name || c.artisan?.artisanProfile?.trade || 'Services',
            totalAmount: Number(c.totalAmount || 0),
            status: mappedStatus,
            milestoneStatus: milestoneSummary,
            milestoneProgressText,
            startDate: formatDate(c.createdAt),
            warrantyStatus: isAllCompleted ? 'Warranty Active' : 'Escrow Protected',
            imageUrl: rawImg,
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
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.headerBorder }]}>
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <ArrowLeft size={22} color={themeColors.text} strokeWidth={2} />
          </TouchableOpacity>
        )}
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Contracts & Agreements</Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.textMuted }]}>Legally binding smart escrow contracts</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsWrap, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.headerBorder }]}>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            { backgroundColor: themeColors.surfaceSubtle },
            tab === 'ACTIVE' && [styles.tabBtnActive, isDark && { backgroundColor: themeColors.primary }],
          ]}
          onPress={() => setTab('ACTIVE')}
        >
          <Text style={[styles.tabText, { color: themeColors.textMuted }, tab === 'ACTIVE' && styles.tabTextActive]}>
            Active ({contracts.filter((c) => c.status === 'ACTIVE').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            { backgroundColor: themeColors.surfaceSubtle },
            tab === 'REVIEW' && [styles.tabBtnActive, isDark && { backgroundColor: themeColors.primary }],
          ]}
          onPress={() => setTab('REVIEW')}
        >
          <Text style={[styles.tabText, { color: themeColors.textMuted }, tab === 'REVIEW' && styles.tabTextActive]}>
            Under Review ({contracts.filter((c) => c.status === 'REVIEW').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            { backgroundColor: themeColors.surfaceSubtle },
            tab === 'COMPLETED' && [styles.tabBtnActive, isDark && { backgroundColor: themeColors.primary }],
          ]}
          onPress={() => setTab('COMPLETED')}
        >
          <Text style={[styles.tabText, { color: themeColors.textMuted }, tab === 'COMPLETED' && styles.tabTextActive]}>
            Archived ({contracts.filter((c) => c.status === 'COMPLETED').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.listContent}>
          <SkeletonContractCard />
          <SkeletonContractCard />
          <SkeletonContractCard />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <AlertCircle size={36} color="#DC2626" strokeWidth={1.75} style={{ marginBottom: 10 }} />
          <Text style={[styles.errorTitle, { color: themeColors.text }]}>Could not load contracts</Text>
          <Text style={[styles.errorSub, { color: themeColors.textMuted }]}>{error}</Text>
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
              tintColor={isDark ? themeColors.primary : colors.primary}
              colors={[isDark ? themeColors.primary : colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FileText size={38} color={themeColors.textMuted} strokeWidth={1.5} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
                {tab === 'ACTIVE'
                  ? 'No Active Contracts'
                  : tab === 'REVIEW'
                  ? 'No Milestones Pending Review'
                  : 'No Archived Contracts'}
              </Text>
              <Text style={[styles.emptySub, { color: themeColors.textMuted }]}>
                {tab === 'ACTIVE'
                  ? 'When you accept an artisan proposal, a legally binding contract with smart escrow custody will be created here.'
                  : tab === 'REVIEW'
                  ? 'When artisans submit proof of completed milestones, they will appear here for your verification and payment release.'
                  : 'Past completed contracts and warranty records will be safely archived in this tab.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.card,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                },
              ]}
              activeOpacity={0.92}
              onPress={() => onSelectContract?.(item.id)}
            >
              <View style={styles.cardRow}>
                {/* Left: Defect/Job Image */}
                <View style={[styles.imageCol, { backgroundColor: themeColors.surfaceSubtle }]}>
                  <Image
                    source={{
                      uri: item.imageUrl || 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=400&q=80',
                    }}
                    style={styles.contractImage}
                    resizeMode="cover"
                  />
                </View>

                {/* Right: Content Information */}
                <View style={styles.contentCol}>
                  {/* Top: Status Badge (Contract number removed) */}
                  <View style={styles.topRow}>
                    <View style={[styles.statusPill, isDark && { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
                      <View style={styles.statusDot} />
                      <Text style={[styles.statusText, isDark && { color: '#34D399' }]}>{item.status}</Text>
                    </View>
                  </View>

                  {/* Title */}
                  <Text style={[styles.titleText, { color: themeColors.text }]} numberOfLines={1}>
                    {item.title}
                  </Text>

                  {/* Contractor Name & Total Escrow (Contractor title removed) */}
                  <View style={styles.contractorEscrowRow}>
                    <View style={{ flex: 1, paddingRight: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <User size={12} color={themeColors.textMuted} style={{ marginRight: 4 }} />
                        <Text style={[styles.contractorName, { color: themeColors.text }]} numberOfLines={1}>
                          {item.artisanName}
                        </Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.metaLabel, { color: themeColors.textMuted }]}>Total Escrow</Text>
                      <Text style={[styles.totalEscrowAmount, isDark && { color: '#34D399' }]}>
                        {formatCurrency(item.totalAmount)}
                      </Text>
                    </View>
                  </View>

                  {/* Milestone Status Bar (Milestone status title removed) */}
                  <View style={[styles.milestoneBar, { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border }]}>
                    <View style={[styles.milestoneIconWrap, isDark && { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
                      <Clock size={14} color={isDark ? '#34D399' : '#0D472D'} strokeWidth={2.4} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={[styles.milestoneBarValue, { color: themeColors.text }]}>
                        {item.milestoneProgressText || item.milestoneStatus}
                      </Text>
                    </View>
                    <ChevronRight size={15} color={themeColors.textMuted} strokeWidth={2} />
                  </View>

                  {/* Footer: Date & Details Button */}
                  <View style={styles.cardFooter}>
                    <View style={styles.dateWrap}>
                      <Calendar size={12} color={themeColors.textMuted} strokeWidth={2} style={{ marginRight: 4 }} />
                      <Text style={[styles.dateLabel, { color: themeColors.textMuted }]}>Started {item.startDate}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.detailsBtn}
                      activeOpacity={0.85}
                      onPress={() => onSelectContract?.(item.id)}
                    >
                      <Text style={styles.detailsBtnText}>View Contract Details</Text>
                      <ChevronRight size={13} color="#FFFFFF" strokeWidth={2.4} style={{ marginLeft: 2 }} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  imageCol: {
    width: 104,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  contractImage: {
    width: '100%',
    height: '100%',
  },
  escrowOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 5,
    right: 5,
    backgroundColor: 'rgba(10, 58, 42, 0.92)',
    borderRadius: 16,
    paddingVertical: 3.5,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  escrowOverlayText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  contentCol: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contractCode: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
    letterSpacing: 0.3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
    textTransform: 'uppercase',
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
    marginBottom: 4,
  },
  contractorEscrowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  metaLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 1,
  },
  contractorName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#111827',
  },
  totalEscrowAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0D472D',
  },
  milestoneBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 6,
  },
  milestoneIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneBarLabel: {
    fontSize: 9,
    color: '#6B7280',
  },
  milestoneBarValue: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#111827',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  dateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D472D',
    paddingVertical: 5.5,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  detailsBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
