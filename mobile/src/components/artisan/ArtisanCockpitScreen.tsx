import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { DutyStatusToggle } from './DutyStatusToggle';
import { CountdownTimer } from '../shared/CountdownTimer';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { useAuthStore } from '../../stores/authStore';
import { WalletService } from '../../services/wallet.service';
import { ContractService } from '../../services/contract.service';
import { JobService } from '../../services/job.service';
import { triggerHaptic } from '../../lib/optimistic-helpers';

interface ArtisanCockpitScreenProps {
  onAcceptLead?: (leadId: string) => void;
  onDeclineLead?: (leadId: string) => void;
  onViewActiveProject?: (contractId?: string) => void;
  onNavigateToWallet?: () => void;
  onViewInvitations?: () => void;
  onLaunchMaps?: () => void;
  onCallClient?: () => void;
  onSnapPhoto?: (milestoneId?: string) => void;
  onAvatarPress?: () => void;
  onNotificationPress?: () => void;
  onScanQr?: () => void;
}

export const ArtisanCockpitScreen: React.FC<ArtisanCockpitScreenProps> = ({
  onAcceptLead,
  onDeclineLead,
  onViewActiveProject,
  onNavigateToWallet,
  onViewInvitations,
  onLaunchMaps,
  onCallClient,
  onSnapPhoto,
  onAvatarPress,
  onNotificationPress,
  onScanQr,
}) => {
  const { user } = useAuthStore();

  const artisanName = user?.artisanProfile?.businessName ||
    (user?.clientProfile?.firstName ? `${user.clientProfile.firstName} ${user.clientProfile.lastName || ''}`.trim() : null) ||
    user?.email?.split('@')[0] ||
    'Certified Artisan';

  const artisanTrade = user?.artisanProfile?.trade || 'Certified Master Artisan';
  const avatarUrl = user?.avatarUrl || user?.artisanProfile?.avatarUrl ||
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150';

  const {
    data: cockpitData,
    isLoading: loading,
    isRefetching: refreshing,
    refetch,
  } = useQuery({
    queryKey: ['artisan-cockpit-overview'],
    queryFn: async () => {
      const [walletRes, contractsRes, jobsRes] = await Promise.allSettled([
        WalletService.getMyWallet(),
        ContractService.getMyContracts('ARTISAN'),
        JobService.listJobs({ limit: 5 }),
      ]);

      let walletBalance = 0;
      let activeContract: any = null;
      let radarLead: any = null;

      if (walletRes.status === 'fulfilled' && walletRes.value) {
        walletBalance = (walletRes.value as any).balance || 0;
      }

      if (contractsRes.status === 'fulfilled' && Array.isArray(contractsRes.value)) {
        activeContract =
          contractsRes.value.find((c: any) => c.status === 'ACTIVE' || c.status === 'IN_PROGRESS') ||
          contractsRes.value[0] ||
          null;
      }

      if (jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value)) {
        radarLead =
          jobsRes.value.find((j: any) => j.status === 'OPEN' || j.urgency === 'EMERGENCY' || j.urgency === 'HIGH') ||
          jobsRes.value[0] ||
          null;
      }

      return { walletBalance, activeContract, radarLead };
    },
    staleTime: 1000 * 60 * 3, // 3 minutes fresh cache
  });

  const walletBalance = cockpitData?.walletBalance ?? 0;
  const activeContract = cockpitData?.activeContract ?? null;
  const radarLead = cockpitData?.radarLead ?? null;
  const [dismissedLeadId, setDismissedLeadId] = React.useState<string | null>(null);
  const visibleRadarLead = radarLead?.id === dismissedLeadId ? null : radarLead;

  const activeMilestones = activeContract?.milestones || [];
  const currentMilestone = activeMilestones.find((m: any) => m.status === 'IN_PROGRESS' || m.status === 'SUBMITTED') || activeMilestones[0];
  const stepOrder = currentMilestone?.stepOrder || 1;
  const totalSteps = activeMilestones.length || 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { refetch(); }}
            tintColor={colors.brand.mint}
            colors={[colors.brand.forest]}
          />
        }
      >
        {/* 1. FOREST GREEN DARK HEADER COCKPIT */}
        <View style={styles.darkHeader}>
          {/* Top Bar: Profile & Notification */}
          <View style={styles.profileRow}>
            <TouchableOpacity
              style={styles.profileLeft}
              onPress={onAvatarPress}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatar}
              />
              <View style={styles.nameBlock}>
                <View style={styles.nameVerifiedRow}>
                  <Text style={styles.artisanName}>{artisanName}</Text>
                  <Text style={styles.verifiedCheck}>✓</Text>
                </View>
                <Text style={styles.tradeTitle}>{artisanTrade}</Text>
              </View>
              <Text style={styles.profileChevron}>›</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {onScanQr && (
                <TouchableOpacity
                  style={styles.bellButton}
                  onPress={onScanQr}
                  activeOpacity={0.7}
                >
                  <Text style={styles.bellIcon}>📷</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.bellButton}
                onPress={onNotificationPress}
                activeOpacity={0.7}
              >
                <Text style={styles.bellIcon}>🔔</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>1</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>


          {/* ONLINE / OFFLINE TOGGLE */}
          <View style={styles.toggleWrapper}>
            <DutyStatusToggle />
          </View>

          {/* EARNINGS STATS */}
          <View style={styles.earningsBox}>
            <View style={styles.earningsGrid}>
              <View style={styles.earningsCol}>
                <Text style={styles.earningsLabel}>💼 Status</Text>
                <Text style={styles.earningsValue}>
                  {user?.isKycVerified ? 'Verified NIN' : 'Active'}
                </Text>
              </View>

              <View style={styles.dividerVertical} />

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onNavigateToWallet}
                style={styles.earningsCol}
              >
                <Text style={styles.earningsLabel}>Wallet Available</Text>
                <View style={styles.walletValueRow}>
                  <Text style={styles.earningsValue}>{formatCurrency(walletBalance)}</Text>
                  <Text style={styles.chevronSmall}>›</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Instant Payout Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onNavigateToWallet}
              style={styles.payoutButton}
            >
              <Text style={styles.payoutIcon}>🏛️</Text>
              <Text style={styles.payoutText}>Instant Payout to Bank</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. URGENT JOB LEAD (LEAD RADAR CARD) */}
        {visibleRadarLead ? (
          <View style={styles.leadCard}>
            {/* Header Row: Urgent Tag + Timer */}
            <View style={styles.leadHeaderRow}>
              <View style={styles.urgentTag}>
                <Text style={styles.urgentZap}>⚡</Text>
                <Text style={styles.urgentTagText}>
                  {visibleRadarLead.urgency === 'EMERGENCY' ? 'Emergency Radar Lead' : 'Nearby Lead'}
                </Text>
              </View>
              <CountdownTimer initialSeconds={180} />
            </View>

            {/* Issue Title */}
            <Text style={styles.leadTitle}>{visibleRadarLead.title}</Text>

            {/* Location & Distance */}
            <View style={styles.locationRow}>
              <Text style={styles.leadLocation}>
                📍 {visibleRadarLead.location || 'Lagos, Nigeria'} (Nearby)
              </Text>
            </View>

            {/* Escrow Locked Budget */}
            <View style={styles.budgetRow}>
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.budgetValue}>
                {formatCurrency(Number(visibleRadarLead.budget || visibleRadarLead.budgetMax || 25000))}
              </Text>
              <Text style={styles.budgetTag}>(Target Escrow)</Text>
            </View>

            {/* Split Buttons: Decline / Accept */}
            <View style={styles.leadActionRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  triggerHaptic('light');
                  setDismissedLeadId(visibleRadarLead.id);
                  onDeclineLead?.(visibleRadarLead.id);
                }}
                style={styles.declineButton}
              >
                <Text style={styles.declineText}>✕ Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => onAcceptLead?.(visibleRadarLead.id)}
                style={styles.acceptButton}
              >
                <Text style={styles.acceptText}>✓ View & Bid</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.radarStandbyCard}>
            <Text style={styles.radarStandbyEmoji}>📡</Text>
            <Text style={styles.radarStandbyTitle}>Radar Geofence Active</Text>
            <Text style={styles.radarStandbySub}>
              Listening for emergency repair leads within your operating radius. Turn On Duty to broadcast availability.
            </Text>
          </View>
        )}

        {/* 3. CURRENT ACTIVE PROJECT CARD */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Current Active Project</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onViewActiveProject?.(activeContract?.id)}
          >
            <Text style={styles.viewAllText}>View all ›</Text>
          </TouchableOpacity>
        </View>

        {activeContract ? (
          <View style={styles.activeProjectCard}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => onViewActiveProject?.(activeContract?.id)}
              style={styles.projectInfoRow}
            >
              <View style={styles.thumbnailContainer}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=200',
                  }}
                  style={styles.projectThumbnail}
                />
                <View style={styles.thumbnailBadge}>
                  <Text style={styles.thumbnailBadgeText}>{stepOrder}/{totalSteps}</Text>
                </View>
              </View>

              <View style={styles.projectTextContainer}>
                <Text style={styles.projectTitle}>
                  {activeContract.job?.title || 'Contract Deliverable'}
                </Text>
                <Text style={styles.projectClient}>
                  Client: {activeContract.client?.clientProfile?.firstName || 'Verified Client'}
                </Text>
                <View style={styles.progressStatusRow}>
                  <View style={styles.greenStatusDot} />
                  <Text style={styles.progressStatusText}>
                    Step {stepOrder} of {totalSteps} • {currentMilestone?.title || 'In Progress'}
                  </Text>
                </View>
              </View>

              <Text style={styles.projectChevron}>›</Text>
            </TouchableOpacity>

            {/* Quick Action Buttons */}
            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onLaunchMaps}
                style={styles.quickActionBtn}
              >
                <Text style={styles.quickActionIcon}>🗺️</Text>
                <Text style={styles.quickActionText}>Maps</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onCallClient}
                style={styles.quickActionBtn}
              >
                <Text style={styles.quickActionIcon}>📞</Text>
                <Text style={styles.quickActionText}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onSnapPhoto?.(currentMilestone?.id)}
                style={styles.quickActionBtn}
              >
                <Text style={styles.quickActionIcon}>📷</Text>
                <Text style={styles.quickActionText}>Snap Photo</Text>
              </TouchableOpacity>

              {onScanQr && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={onScanQr}
                  style={[styles.quickActionBtn, { borderColor: '#10B981', borderWidth: 1 }]}
                >
                  <Text style={styles.quickActionIcon}>⚡</Text>
                  <Text style={[styles.quickActionText, { color: '#10B981', fontWeight: '700' }]}>Arrival QR</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

        ) : (
          <View style={styles.noActiveCard}>
            <Text style={styles.noActiveEmoji}>🛠️</Text>
            <Text style={styles.noActiveTitle}>No Active Contract in Progress</Text>
            <Text style={styles.noActiveSub}>
              Accept incoming radar leads or check your submitted proposals to start work.
            </Text>
          </View>
        )}

        {/* 4. DIRECT CLIENT INVITATIONS ENTRY */}
        <TouchableOpacity
          style={styles.invitationCard}
          onPress={onViewInvitations}
          activeOpacity={0.85}
        >
          <View style={styles.invitationLeft}>
            <View style={styles.invitationIconCircle}>
              <Text style={styles.invitationIconText}>✉️</Text>
            </View>
            <View style={styles.invitationMeta}>
              <Text style={styles.invitationTitle}>Direct Job Offers</Text>
              <Text style={styles.invitationSub}>Review private invitations sent by clients</Text>
            </View>
          </View>
          <View style={styles.invitationRight}>
            <Text style={styles.invitationActionText}>View ›</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#092116',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#092116',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  darkHeader: {
    backgroundColor: '#0E3524',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius['2xl'],
    borderBottomRightRadius: radius['2xl'],
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#CBF7D2',
  },
  nameBlock: {
    justifyContent: 'center',
  },
  nameVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  artisanName: {
    fontSize: typography.size.base,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  verifiedCheck: {
    fontSize: 12,
    color: '#CBF7D2',
    fontWeight: 'bold',
  },
  tradeTitle: {
    fontSize: typography.size.xs,
    color: '#A7F3D0',
    marginTop: 1,
  },
  profileChevron: {
    fontSize: 18,
    color: '#A7F3D0',
    marginLeft: 4,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellIcon: {
    fontSize: 18,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#EF4444',
    borderRadius: 6,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  toggleWrapper: {
    marginBottom: spacing.md,
  },
  earningsBox: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  earningsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  earningsCol: {
    flex: 1,
  },
  dividerVertical: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 12,
  },
  earningsLabel: {
    fontSize: typography.size.xs,
    color: '#A7F3D0',
    marginBottom: 4,
  },
  earningsValue: {
    fontSize: typography.size.base + 2,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  walletValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chevronSmall: {
    fontSize: 16,
    color: '#CBF7D2',
    fontWeight: 'bold',
  },
  payoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CBF7D2',
    paddingVertical: 10,
    borderRadius: radius.full,
    gap: 8,
  },
  payoutIcon: {
    fontSize: 14,
  },
  payoutText: {
    fontSize: typography.size.xs + 1,
    fontWeight: '800',
    color: '#0E3524',
  },
  leadCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.base,
    marginTop: -spacing.md,
    borderRadius: radius.xl,
    padding: spacing.base,
    ...shadows.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  radarStandbyCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  radarStandbyEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  radarStandbyTitle: {
    fontSize: typography.size.base,
    fontWeight: '800',
    color: colors.neutral[900],
    marginBottom: 4,
  },
  radarStandbySub: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 18,
  },
  leadHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  urgentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 4,
  },
  urgentZap: {
    fontSize: 12,
  },
  urgentTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
    textTransform: 'uppercase',
  },
  leadTitle: {
    fontSize: typography.size.base,
    fontWeight: '800',
    color: colors.neutral[900],
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  leadLocation: {
    fontSize: typography.size.xs,
    color: colors.neutral[600],
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    gap: 6,
    marginBottom: 12,
  },
  lockIcon: {
    fontSize: 12,
  },
  budgetValue: {
    fontSize: typography.size.sm,
    fontWeight: '900',
    color: colors.brand.forest,
  },
  budgetTag: {
    fontSize: 10,
    color: colors.brand.emeraldDark,
    fontWeight: '600',
  },
  leadActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  declineButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 10,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  declineText: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: colors.neutral[600],
  },
  acceptButton: {
    flex: 1.5,
    backgroundColor: colors.brand.forest,
    paddingVertical: 10,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  acceptText: {
    fontSize: typography.size.xs + 1,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.size.sm + 1,
    fontWeight: '800',
    color: '#A7F3D0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  viewAllText: {
    fontSize: typography.size.xs,
    color: '#CBF7D2',
    fontWeight: '700',
  },
  activeProjectCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.base,
    marginTop: 8,
    borderRadius: radius.xl,
    padding: spacing.base,
    ...shadows.sm,
  },
  noActiveCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.base,
    marginTop: 8,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  noActiveEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  noActiveTitle: {
    fontSize: typography.size.sm + 1,
    fontWeight: '800',
    color: colors.neutral[900],
    marginBottom: 4,
  },
  noActiveSub: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 18,
  },
  projectInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumbnailContainer: {
    position: 'relative',
  },
  projectThumbnail: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
  },
  thumbnailBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.brand.forest,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  thumbnailBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  projectTextContainer: {
    flex: 1,
  },
  projectTitle: {
    fontSize: typography.size.sm + 1,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  projectClient: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  progressStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  greenStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand.emerald,
  },
  progressStatusText: {
    fontSize: 10,
    color: colors.brand.emeraldDark,
    fontWeight: '700',
  },
  projectChevron: {
    fontSize: 20,
    color: colors.neutral[400],
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#F3F4F6',
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 8,
    borderRadius: radius.md,
    gap: 6,
  },
  quickActionIcon: {
    fontSize: 14,
  },
  quickActionText: {
    fontSize: typography.size.xs,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  invitationCard: {
    marginHorizontal: spacing.base,
    marginTop: 12,
    backgroundColor: '#0E3524',
    borderRadius: radius.xl,
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#1C5B3E',
  },
  invitationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  invitationIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  invitationIconText: {
    fontSize: 20,
  },
  invitationMeta: {
    flex: 1,
  },
  invitationTitle: {
    fontSize: typography.size.sm + 1,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  invitationSub: {
    fontSize: typography.size.xs,
    color: colors.brand.emeraldLight,
    marginTop: 2,
  },
  invitationRight: {
    paddingLeft: 8,
  },
  invitationActionText: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: colors.brand.emeraldLight,
  },
});
