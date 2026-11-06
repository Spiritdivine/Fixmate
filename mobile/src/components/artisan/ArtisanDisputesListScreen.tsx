import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  TextInput,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Scale,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { useToast } from '../shared/ToastContext';

export interface ArtisanDisputeCase {
  id: string;
  contractId: string;
  jobTitle: string;
  clientName: string;
  disputedAmount: number;
  reason: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'MEDIATION' | 'RESOLVED';
  createdAt: string;
  lastUpdate: string;
  initiator: 'CLIENT' | 'ARTISAN';
}

const MOCK_DISPUTES: ArtisanDisputeCase[] = [
  {
    id: 'disp-101',
    contractId: 'ctr-881',
    jobTitle: 'Living Room POP Ceiling & Recessed Lighting',
    clientName: 'Chief Olumide Balogun',
    disputedAmount: 45000,
    reason: 'Client claims paint tint does not match swatch specifications.',
    status: 'MEDIATION',
    createdAt: '14 Oct 2026',
    lastUpdate: 'Artifix mediator requested counter-photos of the paint can batch numbers.',
    initiator: 'CLIENT',
  },
  {
    id: 'disp-092',
    contractId: 'ctr-710',
    jobTitle: 'Dual Inverter AC Piping & Gas Refill',
    clientName: 'Dr. Chinyere Eke',
    disputedAmount: 28000,
    reason: 'Client unresponsive after work completed and verified via proof photos.',
    status: 'OPEN',
    createdAt: '11 Oct 2026',
    lastUpdate: 'Automated 72-hour escrow release countdown activated.',
    initiator: 'ARTISAN',
  },
  {
    id: 'disp-055',
    contractId: 'ctr-430',
    jobTitle: 'Kitchen Cabinetry & Granite Countertop',
    clientName: 'Mrs. Kemi Johnson',
    disputedAmount: 60000,
    reason: 'Dispute over plumbing seal beneath the sink.',
    status: 'RESOLVED',
    createdAt: '28 Sep 2026',
    lastUpdate: 'Mutual compromise accepted: ₦10,000 allowance for replacement seal released.',
    initiator: 'CLIENT',
  },
];

interface ArtisanDisputesListScreenProps {
  onBack?: () => void;
  onSelectDispute?: (disputeId: string) => void;
  onOpenDispute?: (disputeId: string) => void;
}

export const ArtisanDisputesListScreen: React.FC<ArtisanDisputesListScreenProps> = ({
  onBack,
  onSelectDispute,
  onOpenDispute,
}) => {
  const handleOpen = onSelectDispute || onOpenDispute || (() => {});
  const { showInfo } = useToast();
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'RESOLVED'>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [disputes, setDisputes] = useState<ArtisanDisputeCase[]>(MOCK_DISPUTES);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
    } finally {
      setIsRefreshing(false);
    }
  };

  const activeCases = disputes.filter((d) => d.status !== 'RESOLVED');
  const resolvedCases = disputes.filter((d) => d.status === 'RESOLVED');

  const displayedCases = (activeTab === 'ACTIVE' ? activeCases : resolvedCases).filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchJob = c.jobTitle.toLowerCase().includes(q);
      const matchClient = c.clientName.toLowerCase().includes(q);
      const matchReason = c.reason.toLowerCase().includes(q);
      if (!matchJob && !matchClient && !matchReason) return false;
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onBack();
            }}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={22} color={colors.neutral[100]} />
          </TouchableOpacity>
        )}
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>Dispute Center</Text>
          <Text style={styles.headerSubtitle}>Neutral mediation & escrow defense</Text>
        </View>
        <View style={styles.scaleBadge}>
          <Scale size={16} color="#10B981" />
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Search size={16} color={colors.neutral[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search dispute cases or clients..."
          placeholderTextColor={colors.neutral[500]}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs Segment */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('ACTIVE');
          }}
          style={[styles.tabItem, activeTab === 'ACTIVE' && styles.tabItemActive]}
          activeOpacity={0.8}
        >
          <View style={styles.tabLabelRow}>
            <Text style={[styles.tabText, activeTab === 'ACTIVE' && styles.tabTextActive]}>
              Active Cases ({activeCases.length})
            </Text>
            {activeCases.length > 0 && <View style={styles.activeDot} />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('RESOLVED');
          }}
          style={[styles.tabItem, activeTab === 'RESOLVED' && styles.tabItemActive]}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'RESOLVED' && styles.tabTextActive]}>
            Resolved / Settled ({resolvedCases.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Cases List */}
      <FlatList
        data={displayedCases}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#10B981"
            colors={['#10B981']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ShieldAlert size={48} color={colors.neutral[600]} />
            <Text style={styles.emptyTitle}>
              {activeTab === 'ACTIVE' ? 'No Active Disputes' : 'No Settled Cases'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'ACTIVE'
                ? 'All your active client contracts are in good standing with zero open mediation claims.'
                : 'Resolved escrow arbitration and settlement records will appear here for your archive.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleOpen(item.id);
            }}
            style={styles.caseCard}
            activeOpacity={0.8}
          >
            <View style={styles.caseCardHeader}>
              <View style={styles.statusBadgeRow}>
                {item.status === 'RESOLVED' ? (
                  <View style={[styles.statusBadge, { backgroundColor: '#10B98120', borderColor: '#10B98150' }]}>
                    <CheckCircle2 size={12} color="#10B981" />
                    <Text style={[styles.statusBadgeText, { color: '#10B981' }]}>Settled & Closed</Text>
                  </View>
                ) : item.status === 'MEDIATION' ? (
                  <View style={[styles.statusBadge, { backgroundColor: '#F59E0B20', borderColor: '#F59E0B50' }]}>
                    <Clock size={12} color="#F59E0B" />
                    <Text style={[styles.statusBadgeText, { color: '#F59E0B' }]}>In Neutral Mediation</Text>
                  </View>
                ) : (
                  <View style={[styles.statusBadge, { backgroundColor: '#3B82F620', borderColor: '#3B82F650' }]}>
                    <AlertCircle size={12} color="#3B82F6" />
                    <Text style={[styles.statusBadgeText, { color: '#3B82F6' }]}>Awaiting Client Response</Text>
                  </View>
                )}

                <Text style={styles.disputeDate}>{item.createdAt}</Text>
              </View>

              <Text style={styles.caseJobTitle} numberOfLines={1}>
                {item.jobTitle}
              </Text>
              <Text style={styles.caseClientName}>Client: {item.clientName}</Text>
            </View>

            {/* Financial and Reason Details */}
            <View style={styles.caseDetailsBox}>
              <View style={styles.disputedAmountRow}>
                <Text style={styles.disputedAmountLabel}>Escrow Held in Dispute:</Text>
                <Text style={styles.disputedAmountVal}>{formatCurrency(item.disputedAmount)}</Text>
              </View>
              <Text style={styles.reasonText} numberOfLines={2}>
                "{item.reason}"
              </Text>
            </View>

            {/* Mediator update note */}
            <View style={styles.mediatorNoteRow}>
              <Text style={styles.mediatorNoteText} numberOfLines={2}>
                💬 {item.lastUpdate}
              </Text>
              <ChevronRight size={18} color="#10B981" />
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#071A11',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#143825',
    gap: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: '#0E291D',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1D4E35',
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[100],
  },
  headerSubtitle: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
    marginTop: 1,
  },
  scaleBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: '#10B98115',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#10B98140',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E291D',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#1D4E35',
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: colors.neutral[100],
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0E291D',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    padding: 3,
    borderWidth: 1,
    borderColor: '#19452F',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  tabItemActive: {
    backgroundColor: '#10B981',
  },
  tabLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: colors.neutral[400],
  },
  tabTextActive: {
    color: '#071A11',
    fontFamily: typography.fonts.bold,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
    backgroundColor: '#EF4444',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 40,
    gap: spacing.md,
  },
  caseCard: {
    backgroundColor: '#0E291D',
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#1D4E35',
    ...shadows.sm,
  },
  caseCardHeader: {
    marginBottom: spacing.xs,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: typography.fonts.bold,
  },
  disputeDate: {
    fontSize: 11,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
  },
  caseJobTitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[100],
    marginBottom: 2,
  },
  caseClientName: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: '#10B981',
  },
  caseDetailsBox: {
    backgroundColor: '#071A11',
    padding: spacing.sm,
    borderRadius: radius.lg,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: '#173E28',
    gap: 4,
  },
  disputedAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disputedAmountLabel: {
    fontSize: 11,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
  },
  disputedAmountVal: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.bold,
    color: '#F59E0B',
  },
  reasonText: {
    fontSize: 11,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[300],
    fontStyle: 'italic',
    lineHeight: 16,
  },
  mediatorNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  mediatorNoteText: {
    flex: 1,
    fontSize: 11,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[300],
    marginRight: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[200],
  },
  emptySubtitle: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 18,
  },
});
