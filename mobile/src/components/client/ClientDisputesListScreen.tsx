import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import {
  ShieldAlert,
  ChevronLeft,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle,
  X,
  FileText,
  ArrowRight,
} from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows, touchTargets, useTheme } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { DisputeService } from '../../services/dispute.service';
import { ContractService } from '../../services/contract.service';
import { DisputeRecord } from '../../types/dispute-contracts';
import { useToast } from '../shared/ToastContext';
import { SkeletonPlaceholder } from '../shared/SkeletonPlaceholder';

interface ClientDisputesListScreenProps {
  onBack?: () => void;
  onSelectDispute?: (disputeId: string) => void;
}

export const ClientDisputesListScreen: React.FC<ClientDisputesListScreenProps> = ({
  onBack,
  onSelectDispute,
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'RESOLVED'>('ACTIVE');
  const [showFileModal, setShowFileModal] = useState(false);

  // File Dispute Form State
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [selectedReason, setSelectedReason] = useState('POOR_QUALITY');
  const [claimDescription, setClaimDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const {
    data: disputes = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['client-disputes-list'],
    queryFn: () => DisputeService.listDisputes(),
  });

  const { data: myContracts = [] } = useQuery({
    queryKey: ['contracts', 'client-contracts-for-dispute'],
    queryFn: () => ContractService.getMyContracts('CLIENT'),
    enabled: showFileModal,
  });

  const activeDisputes = disputes.filter(
    (d) => d.status !== 'RESOLVED' && d.status !== 'DISMISSED'
  );
  const resolvedDisputes = disputes.filter(
    (d) => d.status === 'RESOLVED' || d.status === 'DISMISSED'
  );

  const displayedDisputes = activeTab === 'ACTIVE' ? activeDisputes : resolvedDisputes;

  const handleFileDispute = async () => {
    if (!selectedContractId) {
      showError('Please select a contract for this dispute');
      return;
    }
    if (!claimDescription.trim() || claimDescription.trim().length < 20) {
      showError('Please provide a detailed claim explanation (min 20 characters)');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await DisputeService.create({
        contractId: selectedContractId,
        reason: selectedReason as any,
        description: claimDescription.trim(),
        category: 'QUALITY_DEFECT',
        requestedResolution: 'FORCE_COMPLETION',
      });

      await queryClient.invalidateQueries({ queryKey: ['client-disputes-list'] });
      await queryClient.invalidateQueries({ queryKey: ['contracts'] });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      showSuccess('Dispute claim filed. An official Artifix arbiter has been assigned.');
      setShowFileModal(false);
      setClaimDescription('');
      setSelectedContractId('');

      if (res?.id) {
        onSelectDispute?.(res.id);
      }
    } catch (err: any) {
      showError(err?.response?.data?.message || err?.message || 'Could not file dispute');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
      case 'FILED':
        return { label: 'Under Review', bg: '#FEF3C7', color: '#B45309' };
      case 'ARBITRATION':
      case 'INVESTIGATION':
        return { label: 'Arbiter Active', bg: '#DBEAFE', color: '#1D4ED8' };
      case 'RESOLVED':
        return { label: 'Resolved & Settled', bg: '#DCFCE7', color: '#15803D' };
      default:
        return { label: status, bg: '#F3F4F6', color: '#4B5563' };
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.headerBorder }]}>
        <TouchableOpacity onPress={onBack} hitSlop={touchTargets.hitSlop} style={styles.backBtn}>
          <ChevronLeft size={24} color={themeColors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Dispute Center</Text>
          <Text style={[styles.headerSub, { color: themeColors.textMuted }]}>Artifix Institutional Escrow Arbitration</Text>
        </View>

        <TouchableOpacity
          style={styles.fileNewBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setShowFileModal(true);
          }}
          activeOpacity={0.8}
        >
          <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.fileNewBtnText}>File Claim</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: themeColors.surfaceSubtle, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'ACTIVE' && [styles.tabItemActive, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.primary }]]}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            setActiveTab('ACTIVE');
          }}
        >
          <Text style={[styles.tabLabel, { color: themeColors.textMuted }, activeTab === 'ACTIVE' && [styles.tabLabelActive, { color: themeColors.text }]]}>
            Active Cases ({activeDisputes.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'RESOLVED' && [styles.tabItemActive, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.primary }]]}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            setActiveTab('RESOLVED');
          }}
        >
          <Text style={[styles.tabLabel, { color: themeColors.textMuted }, activeTab === 'RESOLVED' && [styles.tabLabelActive, { color: themeColors.text }]]}>
            Resolved Archive ({resolvedDisputes.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Disputes List */}
      {isLoading ? (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3].map((k) => (
            <View key={k} style={[styles.skeletonCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <SkeletonPlaceholder width="60%" height={16} borderRadius={4} />
              <SkeletonPlaceholder width="40%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
              <SkeletonPlaceholder width="100%" height={12} borderRadius={4} style={{ marginTop: 12 }} />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={displayedDisputes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => { refetch(); }}
              tintColor={colors.brand.forest}
              colors={[colors.brand.forest]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ShieldAlert size={44} color={themeColors.textMuted} strokeWidth={1.5} />
              <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
                {activeTab === 'ACTIVE' ? 'No Active Dispute Cases' : 'No Past Disputes on Record'}
              </Text>
              <Text style={[styles.emptySub, { color: themeColors.textMuted }]}>
                {activeTab === 'ACTIVE'
                  ? 'All your home repairs and contracts are running smoothly under Artifix Escrow Protection.'
                  : 'Resolved arbitration claims and refund records will be safely archived here.'}
              </Text>
              {activeTab === 'ACTIVE' && (
                <TouchableOpacity
                  style={styles.emptyFileBtn}
                  onPress={() => setShowFileModal(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyFileBtnText}>+ File a New Claim</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const badge = getStatusBadge(item.status);
            const dateStr = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Recently';

            return (
              <TouchableOpacity
                style={[styles.disputeCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
                onPress={() => onSelectDispute?.(item.id)}
                activeOpacity={0.85}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={[styles.caseCode, isDark && { color: '#34D399' }]}>
                      CASE #{item.id.slice(0, 8).toUpperCase()}
                    </Text>
                    <Text style={[styles.contractTitle, { color: themeColors.text }]}>
                      {(item as any).contract?.title || (item as any).contract?.contractCode || 'Contract Agreement'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : badge.bg }]}>
                    <Text style={[styles.statusText, { color: isDark ? '#34D399' : badge.color }]}>{badge.label}</Text>
                  </View>
                </View>

                <Text style={[styles.claimDesc, { color: themeColors.textMuted }]} numberOfLines={2}>
                  "{item.description || (item as any).explanation || 'No statement provided'}"
                </Text>

                <View style={[styles.cardFooter, { borderTopColor: themeColors.border }]}>
                  <View style={styles.dateWrap}>
                    <Clock size={12} color={themeColors.textMuted} />
                    <Text style={[styles.dateText, { color: themeColors.textMuted }]}>Filed on {dateStr}</Text>
                  </View>

                  <View style={styles.viewWorkspaceWrap}>
                    <Text style={[styles.viewWorkspaceText, isDark && { color: '#34D399' }]}>Open Workspace</Text>
                    <ArrowRight size={13} color={isDark ? '#34D399' : colors.brand.forest} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* File Dispute Modal */}
      <Modal visible={showFileModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.sheetContainer, { backgroundColor: themeColors.surface }]}>
            <View style={[styles.sheetHandle, { backgroundColor: themeColors.border }]} />

            <View style={styles.sheetHeader}>
              <View>
                <Text style={[styles.sheetTitle, { color: themeColors.text }]}>File Dispute Claim</Text>
                <Text style={[styles.sheetSub, { color: themeColors.textMuted }]}>Artifix Institutional Arbitration Investigation</Text>
              </View>
              <TouchableOpacity onPress={() => setShowFileModal(false)} hitSlop={touchTargets.hitSlop}>
                <X size={20} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            <View style={[styles.escrowNoticeBox, isDark && { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <AlertTriangle size={16} color={isDark ? '#FBBF24' : '#B45309'} />
              <Text style={[styles.escrowNoticeText, isDark && { color: '#FDE68A' }]}>
                Filing freezes all remaining milestone funds in smart escrow until the arbiter reaches a resolution.
              </Text>
            </View>

            {/* Select Contract */}
            <Text style={[styles.inputLabel, { color: themeColors.textMuted }]}>SELECT CONTRACT IN DISPUTE</Text>
            {myContracts.length === 0 ? (
              <Text style={[styles.noContractsNotice, { color: themeColors.textMuted }]}>No active contracts found to dispute.</Text>
            ) : (
              <View style={styles.contractOptions}>
                {myContracts.slice(0, 4).map((c: any) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.contractChip,
                      { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border },
                      selectedContractId === c.id && [styles.contractChipActive, isDark && { borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.15)' }],
                    ]}
                    onPress={() => setSelectedContractId(c.id)}
                  >
                    <Text style={[
                      styles.contractChipText,
                      { color: themeColors.text },
                      selectedContractId === c.id && [styles.contractChipTextActive, isDark && { color: '#34D399' }],
                    ]}>
                      {c.title || c.contractCode || 'Contract'} ({formatCurrency(Number(c.totalAmount || 0))})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Select Reason */}
            <Text style={[styles.inputLabel, { color: themeColors.textMuted, marginTop: 14 }]}>PRIMARY GRIEVANCE</Text>
            <View style={styles.reasonRow}>
              {[
                { id: 'POOR_QUALITY', label: 'Substandard Work' },
                { id: 'ABANDONED', label: 'Artisan Abandoned' },
                { id: 'DELAY', label: 'Severe Timeline Breach' },
                { id: 'DAMAGE', label: 'Property Damage' },
              ].map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={[
                    styles.reasonChip,
                    { backgroundColor: themeColors.surfaceSubtle },
                    selectedReason === r.id && styles.reasonChipActive,
                  ]}
                  onPress={() => setSelectedReason(r.id)}
                >
                  <Text style={[
                    styles.reasonChipText,
                    { color: themeColors.text },
                    selectedReason === r.id && styles.reasonChipTextActive,
                  ]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Description */}
            <Text style={[styles.inputLabel, { color: themeColors.textMuted, marginTop: 14 }]}>DETAILED STATEMENT (MIN 20 CHARS)</Text>
            <TextInput
              style={[styles.claimTextArea, {
                backgroundColor: themeColors.inputBg,
                borderColor: themeColors.inputBorder,
                color: themeColors.text,
              }]}
              placeholder="State exactly what went wrong, missing parts, or unfulfilled contract promises..."
              placeholderTextColor={themeColors.textMuted}
              value={claimDescription}
              onChangeText={setClaimDescription}
              multiline
              numberOfLines={4}
            />

            {/* Actions */}
            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={[styles.cancelSheetBtn, { backgroundColor: themeColors.surfaceSubtle }]}
                onPress={() => setShowFileModal(false)}
                disabled={isSubmitting}
              >
                <Text style={[styles.cancelSheetBtnText, { color: themeColors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitClaimBtn, isSubmitting && { opacity: 0.6 }]}
                onPress={handleFileDispute}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitClaimBtnText}>Submit Claim</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    padding: spacing.xs,
    marginRight: spacing.xs,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  headerSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  fileNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
  },
  fileNewBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.brand.forest,
    backgroundColor: '#FFFFFF',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.brand.forest,
    fontWeight: '700',
  },
  listContent: {
    padding: spacing.base,
    paddingBottom: 40,
  },
  skeletonContainer: {
    padding: spacing.base,
    gap: 12,
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  disputeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  caseCode: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand.forest,
    letterSpacing: 0.5,
  },
  contractTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  claimDesc: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  viewWorkspaceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewWorkspaceText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.brand.forest,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 56,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 14,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyFileBtn: {
    marginTop: 20,
    backgroundColor: '#DC2626',
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: radius.lg,
  },
  emptyFileBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 33, 22, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    padding: spacing.base,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    ...typography.h3,
    color: colors.text,
  },
  sheetSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  escrowNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: radius.md,
    marginBottom: 14,
  },
  escrowNoticeText: {
    flex: 1,
    fontSize: 11,
    color: '#92400E',
    lineHeight: 16,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  noContractsNotice: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  contractOptions: {
    gap: 6,
  },
  contractChip: {
    padding: 10,
    borderRadius: radius.md,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contractChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: colors.brand.forest,
  },
  contractChipText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  contractChipTextActive: {
    color: colors.brand.forest,
    fontWeight: '700',
  },
  reasonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  reasonChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.md,
    backgroundColor: '#F3F4F6',
  },
  reasonChipActive: {
    backgroundColor: '#DC2626',
  },
  reasonChipText: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '500',
  },
  reasonChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  claimTextArea: {
    backgroundColor: '#F3F4F6',
    borderRadius: radius.md,
    padding: 12,
    fontSize: 12,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 80,
    textAlignVertical: 'top',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  cancelSheetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelSheetBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  submitClaimBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  submitClaimBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
