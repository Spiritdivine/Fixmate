import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Share,
} from 'react-native';
import {
  ArrowLeft,
  ShieldCheck,
  Star,
  Clock,
  MessageSquare,
  CheckCircle2,
  Share2,
  Calendar,
  Wrench,
  AlertCircle,
  ChevronRight,
  User,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography, shadows, useTheme } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { useToast } from '../shared/ToastContext';

export interface ProposalDetailItem {
  id: string;
  jobId: string;
  artisanId: string;
  artisanName: string;
  trade: string;
  avatarUrl?: string;
  rating: number;
  reviewsCount: number;
  completedJobsCount?: number;
  isVerified?: boolean;
  distance?: string;
  timeAgo: string;
  bidAmount: number;
  laborAmount?: number;
  partsAmount?: number;
  duration: string;
  coverNote: string;
  materialsProvidedBy?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'SHORTLISTED';
  rawMilestones?: Array<{
    id?: string;
    stepOrder?: number;
    title: string;
    description?: string;
    amount: number;
    estimatedDays?: number;
    status?: string;
  }>;
}

interface ProposalDetailsScreenProps {
  proposal: ProposalDetailItem;
  jobTitle?: string;
  onBack: () => void;
  onAccept: (proposal: ProposalDetailItem) => void;
  onDecline: (proposalId: string) => void;
  onChatWithArtisan: (artisanId: string) => void;
  onViewArtisanProfile: (artisanId: string) => void;
}

export const ProposalDetailsScreen: React.FC<ProposalDetailsScreenProps> = ({
  proposal,
  jobTitle = 'Job Request',
  onBack,
  onAccept,
  onDecline,
  onChatWithArtisan,
  onViewArtisanProfile,
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const { showSuccess, showInfo } = useToast();
  const [declining, setDeclining] = useState<boolean>(false);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Review proposal from ${proposal.artisanName} for "${jobTitle}" on Artifix: ${formatCurrency(proposal.bidAmount)} (${proposal.duration})`,
      });
    } catch {}
  };

  const handleAcceptPress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onAccept(proposal);
  };

  const handleDeclinePress = async () => {
    try {
      setDeclining(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onDecline(proposal.id);
      showInfo('Proposal Declined', `Declined quote from ${proposal.artisanName}.`);
      onBack();
    } finally {
      setDeclining(false);
    }
  };

  const milestones = proposal.rawMilestones || [];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      {/* Top Navigation Bar */}
      <View style={[styles.navBar, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.headerBorder }]}>
        <TouchableOpacity
          onPress={onBack}
          style={[styles.navButton, { backgroundColor: themeColors.surfaceSubtle }]}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={themeColors.text} strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.navCenter}>
          <Text style={[styles.navTitle, { color: themeColors.text }]} numberOfLines={1}>Proposal Inspection</Text>
          <Text style={[styles.navSubtitle, { color: themeColors.textMuted }]} numberOfLines={1}>{jobTitle}</Text>
        </View>

        <TouchableOpacity
          onPress={handleShare}
          style={[styles.navButton, { backgroundColor: themeColors.surfaceSubtle }]}
          activeOpacity={0.7}
        >
          <Share2 size={18} color={themeColors.text} strokeWidth={1.85} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Artisan Profile & Trust Card */}
        <TouchableOpacity
          style={[styles.artisanCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
          onPress={() => onViewArtisanProfile(proposal.artisanId)}
          activeOpacity={0.88}
        >
          <View style={styles.artisanAvatarWrap}>
            <View style={[styles.artisanAvatar, isDark && { backgroundColor: 'rgba(52, 211, 153, 0.15)', borderColor: 'rgba(52, 211, 153, 0.3)' }]}>
              <Text style={[styles.avatarInitials, isDark && { color: '#34D399' }]}>
                {proposal.artisanName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </Text>
            </View>
            {proposal.isVerified && (
              <View style={styles.avatarVerifiedBadge}>
                <ShieldCheck size={12} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            )}
          </View>

          <View style={styles.artisanInfo}>
            <View style={styles.artisanNameRow}>
              <Text style={[styles.artisanName, { color: themeColors.text }]} numberOfLines={1}>
                {proposal.artisanName}
              </Text>
              <ChevronRight size={16} color={themeColors.textMuted} strokeWidth={1.85} />
            </View>

            <Text style={[styles.artisanTrade, { color: themeColors.textMuted }]}>{proposal.trade}</Text>

            <View style={styles.metaPillsRow}>
              <View style={styles.ratingBadge}>
                <Star size={12} color="#F59E0B" fill="#F59E0B" strokeWidth={1.5} />
                <Text style={styles.ratingText}>
                  {proposal.rating.toFixed(1)} ({proposal.reviewsCount})
                </Text>
              </View>

              {proposal.distance && (
                <View style={[styles.distanceBadge, { backgroundColor: themeColors.surfaceSubtle }]}>
                  <Text style={[styles.distanceBadgeText, { color: themeColors.textMuted }]}>{proposal.distance} away</Text>
                </View>
              )}

              {proposal.isVerified && (
                <View style={[styles.idVerifiedPill, isDark && { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
                  <CheckCircle2 size={11} color={isDark ? '#34D399' : '#059669'} strokeWidth={2} />
                  <Text style={[styles.idVerifiedText, isDark && { color: '#34D399' }]}>Verified Pro</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* Section 2: Commercial Quotation Banner */}
        <View style={[styles.quoteCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={styles.quoteTop}>
            <View>
              <Text style={[styles.quoteLabel, { color: themeColors.textMuted }]}>Total Proposed Quotation</Text>
              <Text style={[styles.quoteAmount, isDark && { color: '#34D399' }]}>{formatCurrency(proposal.bidAmount)}</Text>
            </View>
            <View style={[styles.durationPill, isDark && { backgroundColor: 'rgba(52, 211, 153, 0.15)', borderColor: 'rgba(52, 211, 153, 0.3)' }]}>
              <Clock size={13} color={isDark ? '#34D399' : '#15803D'} strokeWidth={2} />
              <Text style={[styles.durationText, isDark && { color: '#34D399' }]}>{proposal.duration}</Text>
            </View>
          </View>

          {(proposal.laborAmount != null || proposal.partsAmount != null) && (
            <View style={[styles.breakdownRow, { borderTopColor: themeColors.border }]}>
              <View style={styles.breakdownCol}>
                <Text style={[styles.breakdownMiniLabel, { color: themeColors.textMuted }]}>Expert Labor</Text>
                <Text style={[styles.breakdownVal, { color: themeColors.text }]}>
                  {formatCurrency(proposal.laborAmount || Math.round(proposal.bidAmount * 0.7))}
                </Text>
              </View>
              <View style={[styles.breakdownDivider, { backgroundColor: themeColors.border }]} />
              <View style={styles.breakdownCol}>
                <Text style={[styles.breakdownMiniLabel, { color: themeColors.textMuted }]}>Materials & Consumables</Text>
                <Text style={[styles.breakdownVal, { color: themeColors.text }]}>
                  {formatCurrency(proposal.partsAmount || Math.round(proposal.bidAmount * 0.3))}
                </Text>
              </View>
            </View>
          )}

          <View style={[styles.escrowSafeNotice, isDark && { backgroundColor: 'rgba(52, 211, 153, 0.12)' }]}>
            <ShieldCheck size={14} color={isDark ? '#34D399' : '#059669'} strokeWidth={2} />
            <Text style={[styles.escrowSafeText, isDark && { color: '#34D399' }]}>
              Protected by Smart Escrow. Funds are released only after you approve each milestone.
            </Text>
          </View>
        </View>

        {/* Section 3: Technical Execution Approach / Cover Note */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Technical Approach & Cover Note</Text>
          <View style={[styles.bodyCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Text style={[styles.coverBodyText, { color: themeColors.text }]}>
              {proposal.coverNote || 'The artisan did not provide additional written notes for this quotation.'}
            </Text>
          </View>
        </View>

        {/* Section 4: Milestone & Payment Schedule */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Milestone Schedule ({milestones.length || 1})
            </Text>
            <Text style={[styles.sectionSubBadge, isDark && { backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34D399' }]}>Sequential Escrow</Text>
          </View>

          {milestones.length > 0 ? (
            milestones.map((m, idx) => (
              <View key={m.id || `m-${idx}`} style={[styles.milestoneCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                <View style={styles.milestoneStepCol}>
                  <View style={[styles.stepCircle, isDark && { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
                    <Text style={[styles.stepNum, isDark && { color: '#34D399' }]}>{m.stepOrder || idx + 1}</Text>
                  </View>
                  {idx < milestones.length - 1 && <View style={[styles.stepLine, { backgroundColor: themeColors.border }]} />}
                </View>

                <View style={styles.milestoneDetails}>
                  <View style={styles.milestoneTopLine}>
                    <Text style={[styles.milestoneHeading, { color: themeColors.text }]}>{m.title}</Text>
                    <Text style={[styles.milestonePrice, isDark && { color: '#34D399' }]}>{formatCurrency(Number(m.amount))}</Text>
                  </View>

                  {m.description ? (
                    <Text style={[styles.milestoneDescription, { color: themeColors.textMuted }]}>{m.description}</Text>
                  ) : null}

                  <View style={styles.milestoneMetaLine}>
                    <View style={[styles.milestoneDaysChip, { backgroundColor: themeColors.surfaceSubtle }]}>
                      <Clock size={11} color={themeColors.textMuted} strokeWidth={1.85} />
                      <Text style={[styles.milestoneDaysText, { color: themeColors.textMuted }]}>
                        Est. {m.estimatedDays || 1} day{(m.estimatedDays || 1) > 1 ? 's' : ''}
                      </Text>
                    </View>
                    <Text style={[styles.milestonePercent, { color: themeColors.textMuted }]}>
                      {Math.round((Number(m.amount) / proposal.bidAmount) * 100)}% of total
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={[styles.milestoneCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <View style={styles.milestoneStepCol}>
                <View style={[styles.stepCircle, isDark && { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
                  <Text style={[styles.stepNum, isDark && { color: '#34D399' }]}>1</Text>
                </View>
              </View>
              <View style={styles.milestoneDetails}>
                <View style={styles.milestoneTopLine}>
                  <Text style={[styles.milestoneHeading, { color: themeColors.text }]}>Full Completion & Handover</Text>
                  <Text style={[styles.milestonePrice, isDark && { color: '#34D399' }]}>{formatCurrency(proposal.bidAmount)}</Text>
                </View>
                <Text style={[styles.milestoneDescription, { color: themeColors.textMuted }]}>
                  Single milestone: Work completion, inspection, and client satisfaction handover.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Section 5: Materials & Warranty Terms */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Scope & Guarantee Terms</Text>
          <View style={[styles.termsCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={styles.termRow}>
              <Wrench size={16} color={isDark ? themeColors.primary : colors.brand.forest} strokeWidth={1.85} style={styles.termIcon} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.termLabel, { color: themeColors.textMuted }]}>Materials Responsibility</Text>
                <Text style={[styles.termValue, { color: themeColors.text }]}>
                  {proposal.materialsProvidedBy || 'Artisan provides verified parts & consumables'}
                </Text>
              </View>
            </View>

            <View style={[styles.termDivider, { backgroundColor: themeColors.border }]} />

            <View style={styles.termRow}>
              <ShieldCheck size={16} color="#059669" strokeWidth={1.85} style={styles.termIcon} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.termLabel, { color: themeColors.textMuted }]}>Artifix Guarantee</Text>
                <Text style={[styles.termValue, { color: themeColors.text }]}>
                  Includes 14-day defect liability and escrow dispute protection.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Persistent Floating Bottom Action Dock (Thumb-Zone) */}
      <View style={[styles.bottomDock, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
        <View style={styles.dockActionsRow}>
          {/* Chat Shortcut */}
          <TouchableOpacity
            style={[styles.dockChatBtn, { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border }]}
            onPress={() => onChatWithArtisan(proposal.artisanId)}
            activeOpacity={0.8}
          >
            <MessageSquare size={18} color={isDark ? themeColors.primary : colors.brand.forest} strokeWidth={2} />
            <Text style={[styles.dockChatText, isDark && { color: themeColors.primary }]}>Chat</Text>
          </TouchableOpacity>

          {/* Decline Option */}
          <TouchableOpacity
            style={[styles.dockDeclineBtn, isDark && { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}
            onPress={handleDeclinePress}
            disabled={declining}
            activeOpacity={0.7}
          >
            {declining ? (
              <ActivityIndicator size="small" color="#B91C1C" />
            ) : (
              <Text style={styles.dockDeclineText}>Decline</Text>
            )}
          </TouchableOpacity>

          {/* Primary CTA: Accept & Fund Escrow */}
          <TouchableOpacity
            style={styles.dockAcceptBtn}
            onPress={handleAcceptPress}
            activeOpacity={0.88}
          >
            <ShieldCheck size={18} color="#FFFFFF" strokeWidth={2.2} />
            <Text style={styles.dockAcceptText}>
              Accept & Fund {formatCurrency(proposal.bidAmount)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F7F4',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  navButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: '#F3F4F6',
  },
  navCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  navTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  navSubtitle: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.base,
    paddingBottom: 120,
    gap: spacing.md,
  },
  artisanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.sm,
  },
  artisanAvatarWrap: {
    position: 'relative',
    marginRight: spacing.md,
  },
  artisanAvatar: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: '#EAF2EC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.brand.forest,
  },
  avatarVerifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#059669',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  artisanInfo: {
    flex: 1,
  },
  artisanNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  artisanName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  artisanTrade: {
    fontSize: 12,
    color: colors.neutral[600],
    marginTop: 1,
  },
  metaPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  distanceBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  distanceBadgeText: {
    fontSize: 11,
    color: colors.neutral[600],
    fontWeight: '500',
  },
  idVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    gap: 3,
  },
  idVerifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  quoteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    ...shadows.sm,
  },
  quoteTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  quoteLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quoteAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.brand.forest,
    marginTop: 2,
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    gap: 4,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  breakdownRow: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  breakdownCol: {
    flex: 1,
  },
  breakdownMiniLabel: {
    fontSize: 10,
    color: colors.neutral[500],
    fontWeight: '500',
  },
  breakdownVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutral[800],
    marginTop: 2,
  },
  breakdownDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  escrowSafeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
    padding: 10,
    marginTop: 14,
    gap: 8,
  },
  escrowSafeText: {
    fontSize: 11,
    color: '#065F46',
    flex: 1,
    lineHeight: 16,
  },
  sectionContainer: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  sectionSubBadge: {
    fontSize: 11,
    color: colors.brand.forest,
    fontWeight: '700',
  },
  bodyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  coverBodyText: {
    fontSize: 13,
    color: colors.neutral[800],
    lineHeight: 21,
  },
  milestoneCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  milestoneStepCol: {
    alignItems: 'center',
    marginRight: 12,
    width: 24,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EAF2EC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  stepNum: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.brand.forest,
  },
  stepLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
  },
  milestoneDetails: {
    flex: 1,
  },
  milestoneTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  milestoneHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutral[900],
    flex: 1,
    marginRight: 8,
  },
  milestonePrice: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.brand.forest,
  },
  milestoneDescription: {
    fontSize: 12,
    color: colors.neutral[600],
    marginTop: 4,
    lineHeight: 18,
  },
  milestoneMetaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  milestoneDaysChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    gap: 4,
  },
  milestoneDaysText: {
    fontSize: 10,
    color: colors.neutral[600],
    fontWeight: '600',
  },
  milestonePercent: {
    fontSize: 10,
    color: colors.neutral[400],
    fontWeight: '500',
  },
  termsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  termRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  termIcon: {
    marginTop: 2,
  },
  termLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  termValue: {
    fontSize: 12,
    color: colors.neutral[600],
    marginTop: 2,
    lineHeight: 17,
  },
  termDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  bottomDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: spacing.base,
    paddingTop: 12,
    paddingBottom: 24,
    ...shadows.lg,
  },
  dockActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dockChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF2EC',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.md,
    gap: 6,
  },
  dockChatText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brand.forest,
  },
  dockDeclineBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockDeclineText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B91C1C',
  },
  dockAcceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 13,
    borderRadius: radius.md,
    gap: 6,
    ...shadows.sm,
  },
  dockAcceptText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
