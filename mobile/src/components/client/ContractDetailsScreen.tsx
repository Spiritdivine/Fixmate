import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Modal,
  Share,
} from 'react-native';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  Share2,
  ChevronRight,
  ExternalLink,
  Wrench,
  DollarSign,
  FileText,
  User,
  ChevronDown,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography, shadows, useTheme } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { ContractService } from '../../services/contract.service';
import { useToast } from '../shared/ToastContext';

interface MilestoneRecord {
  id: string;
  stepOrder?: number;
  title: string;
  description?: string;
  amount: number;
  estimatedDays?: number;
  status: string;
  proofPhotos?: string[];
  submittedAt?: string;
  releasedAt?: string;
}

interface ContractRecord {
  id: string;
  contractCode: string;
  jobId: string;
  jobTitle: string;
  trade?: string;
  status: 'DRAFT' | 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  totalAmount: number;
  escrowFundedAmount?: number;
  escrowReleasedAmount?: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  smartContractAddr?: string;
  onChainEscrowId?: string;
  fundingTxHash?: string;
  artisan: {
    id: string;
    userId: string;
    name: string;
    businessName?: string;
    trade: string;
    rating: number;
    reviewsCount: number;
    avatarUrl?: string;
    phone?: string;
  };
  milestones: MilestoneRecord[];
}

interface ContractDetailsScreenProps {
  contractId: string;
  onBack: () => void;
  onOpenChat: (artisanId: string) => void;
  onApproveMilestone: (contractId: string, milestoneId: string) => void;
  onFileDispute: (contractId: string) => void;
  onViewJob?: (jobId: string) => void;
}

export const ContractDetailsScreen: React.FC<ContractDetailsScreenProps> = ({
  contractId,
  onBack,
  onOpenChat,
  onApproveMilestone,
  onFileDispute,
  onViewJob,
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const { showSuccess, showError, showInfo } = useToast();
  const [contract, setContract] = useState<ContractRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [showAuditLog, setShowAuditLog] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await ContractService.getById(contractId);
        if (isMounted && data) {
          // Normalize contract record
          const milestones = (data.milestones || []).sort(
            (a: any, b: any) => (a.stepOrder || 0) - (b.stepOrder || 0)
          );
          setContract({
            id: data.id,
            contractCode: data.contractCode || `#FIX-${data.id.slice(0, 6).toUpperCase()}`,
            jobId: data.jobId,
            jobTitle: data.job?.title || 'Contracted Repair Service',
            trade: data.job?.category?.name || data.job?.trade || 'Handyman',
            status: data.status || 'ACTIVE',
            totalAmount: Number(data.totalAmount || 0),
            escrowFundedAmount: Number(data.escrowFundedAmount ?? data.totalAmount ?? 0),
            escrowReleasedAmount: Number(data.escrowReleasedAmount || 0),
            createdAt: data.createdAt,
            startedAt: data.startedAt,
            completedAt: data.completedAt,
            smartContractAddr: data.smartContractAddr,
            onChainEscrowId: data.onChainEscrowId,
            fundingTxHash: data.fundingTxHash,
            artisan: {
              id: data.artisan?.id || data.artisanId,
              userId: data.artisan?.id || data.artisanId,
              name: data.artisan?.artisanProfile?.businessName ||
                `${data.artisan?.clientProfile?.firstName || ''} ${data.artisan?.clientProfile?.lastName || ''}`.trim() ||
                'Verified Specialist',
              businessName: data.artisan?.artisanProfile?.businessName,
              trade: data.job?.trade || (data.artisan as any)?.artisanProfile?.trade || 'Specialist',
              rating: Number(data.artisan?.artisanProfile?.rating ?? 4.9),
              reviewsCount: Number(data.artisan?.artisanProfile?.reviewCount ?? 12),
              avatarUrl: data.artisan?.avatarUrl,
              phone: (data.artisan as any)?.phoneNumber,
            },
            milestones: milestones as any,
          } as any);
        }
      } catch (err: any) {
        showError('Load Error', err?.message || 'Could not load contract details');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [contractId]);

  const handleShare = async () => {
    if (!contract) return;
    try {
      await Share.share({
        message: `Artifix Verified Contract ${contract.contractCode} for "${contract.jobTitle}": ${formatCurrency(contract.totalAmount)} Escrow Protected.`,
      });
    } catch {}
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.brand.forest} />
          <Text style={styles.loadingText}>Loading contract agreement & escrow status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!contract) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerBox}>
          <AlertTriangle size={32} color="#DC2626" />
          <Text style={styles.errorTitle}>Contract Not Found</Text>
          <TouchableOpacity onPress={onBack} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Return to Contracts List</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const escrowFunded = contract.escrowFundedAmount || contract.totalAmount;
  const escrowReleased = contract.escrowReleasedAmount || 0;
  const escrowRemaining = Math.max(0, escrowFunded - escrowReleased);
  const releasedCount = contract.milestones.filter((m) => m.status === 'RELEASED').length;
  const pendingReviewMilestone = contract.milestones.find((m) => m.status === 'SUBMITTED');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      {/* Navigation Bar */}
      <View style={[styles.navBar, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.headerBorder }]}>
        <TouchableOpacity
          onPress={onBack}
          style={[styles.navButton, { backgroundColor: themeColors.surfaceSubtle }]}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={themeColors.text} strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.navCenter}>
          <Text style={[styles.navTitle, { color: themeColors.text }]}>{contract.contractCode}</Text>
          <Text style={[styles.navSubtitle, { color: themeColors.textMuted }]} numberOfLines={1}>{contract.jobTitle}</Text>
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
        {/* Section 1: Hero Status Banner */}
        <View style={[styles.heroStatusCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={styles.heroTopRow}>
            <View
              style={[
                styles.statusTag,
                contract.status === 'COMPLETED'
                  ? styles.statusTagSuccess
                  : contract.status === 'DISPUTED'
                  ? styles.statusTagDanger
                  : styles.statusTagActive,
              ]}
            >
              <Text
                style={[
                  styles.statusTagText,
                  contract.status === 'COMPLETED'
                    ? styles.statusTextSuccess
                    : contract.status === 'DISPUTED'
                    ? styles.statusTextDanger
                    : styles.statusTextActive,
                ]}
              >
                {contract.status === 'COMPLETED'
                  ? 'COMPLETED & RELEASED'
                  : contract.status === 'DISPUTED'
                  ? 'UNDER ARBITER DISPUTE'
                  : pendingReviewMilestone
                  ? 'MILESTONE UNDER REVIEW'
                  : 'WORK IN PROGRESS'}
              </Text>
            </View>

            <View style={[styles.escrowLockPill, isDark && { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
              <ShieldCheck size={13} color={isDark ? '#34D399' : '#059669'} strokeWidth={2} />
              <Text style={[styles.escrowLockText, isDark && { color: '#34D399' }]}>100% Escrow Funded</Text>
            </View>
          </View>

          <Text style={[styles.heroJobTitle, { color: themeColors.text }]}>{contract.jobTitle}</Text>
          <Text style={[styles.heroJobMeta, { color: themeColors.textMuted }]}>
            {contract.trade} • Initiated {new Date(contract.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>

          {/* Progress Bar */}
          <View style={[styles.progressContainer, { borderTopColor: themeColors.border }]}>
            <View style={styles.progressLabelRow}>
              <Text style={[styles.progressLabel, { color: themeColors.textMuted }]}>Milestone Execution Track</Text>
              <Text style={[styles.progressValue, isDark && { color: '#34D399' }]}>
                {releasedCount} of {contract.milestones.length || 1} Paid
              </Text>
            </View>
            <View style={[styles.progressBarTrack, { backgroundColor: themeColors.surfaceSubtle }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${
                      contract.milestones.length > 0
                        ? (releasedCount / contract.milestones.length) * 100
                        : 0
                    }%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Section 2: Counterparty Artisan Profile Card */}
        <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Text style={[styles.cardHeaderTitle, { color: themeColors.text }]}>Assigned Artisan Specialist</Text>
          <View style={styles.artisanRow}>
            <View style={[styles.artisanAvatar, isDark && { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
              <Text style={[styles.artisanInitials, isDark && { color: '#34D399' }]}>
                {contract.artisan.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </Text>
            </View>

            <View style={styles.artisanInfoCol}>
              <Text style={[styles.artisanNameText, { color: themeColors.text }]}>{contract.artisan.name}</Text>
              <Text style={[styles.artisanTradeText, { color: themeColors.textMuted }]}>{contract.artisan.trade}</Text>
              <View style={styles.artisanTrustRow}>
                <Text style={styles.ratingText}>⭐ {contract.artisan.rating.toFixed(1)}</Text>
                <Text style={[styles.dotSeparator, { color: themeColors.textMuted }]}>•</Text>
                <Text style={[styles.reviewsText, { color: themeColors.textMuted }]}>{contract.artisan.reviewsCount} completed jobs</Text>
              </View>
            </View>

            {/* Direct Chat Shortcut */}
            <TouchableOpacity
              style={[styles.chatShortcutBtn, { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border }]}
              onPress={() => onOpenChat(contract.artisan.userId)}
              activeOpacity={0.8}
            >
              <MessageSquare size={16} color={isDark ? themeColors.primary : colors.brand.forest} strokeWidth={2} />
              <Text style={[styles.chatShortcutText, isDark && { color: themeColors.primary }]}>Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 3: Escrow Financial Ledger */}
        <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Text style={[styles.cardHeaderTitle, { color: themeColors.text }]}>Escrow Financial Reconciliation</Text>
          <View style={[styles.ledgerTotalRow, { borderBottomColor: themeColors.border }]}>
            <Text style={[styles.ledgerTotalLabel, { color: themeColors.textMuted }]}>Total Agreed Contract Sum</Text>
            <Text style={[styles.ledgerTotalAmount, isDark && { color: '#34D399' }]}>{formatCurrency(contract.totalAmount)}</Text>
          </View>

          <View style={styles.ledgerGrid}>
            <View style={styles.ledgerGridCol}>
              <Text style={[styles.ledgerMiniLabel, { color: themeColors.textMuted }]}>Funded in Escrow</Text>
              <Text style={[styles.ledgerGridVal, { color: themeColors.text }]}>{formatCurrency(escrowFunded)}</Text>
            </View>
            <View style={[styles.ledgerDivider, { backgroundColor: themeColors.border }]} />
            <View style={styles.ledgerGridCol}>
              <Text style={[styles.ledgerMiniLabel, { color: themeColors.textMuted }]}>Released to Artisan</Text>
              <Text style={[styles.ledgerGridVal, { color: '#059669' }]}>
                {formatCurrency(escrowReleased)}
              </Text>
            </View>
            <View style={[styles.ledgerDivider, { backgroundColor: themeColors.border }]} />
            <View style={styles.ledgerGridCol}>
              <Text style={[styles.ledgerMiniLabel, { color: themeColors.textMuted }]}>Remaining Balance</Text>
              <Text style={[styles.ledgerGridVal, { color: isDark ? '#34D399' : colors.brand.forest }]}>
                {formatCurrency(escrowRemaining)}
              </Text>
            </View>
          </View>

          <View style={[styles.guaranteeBox, isDark && { backgroundColor: 'rgba(52, 211, 153, 0.12)' }]}>
            <ShieldCheck size={14} color={isDark ? '#34D399' : '#059669'} strokeWidth={2} />
            <Text style={[styles.guaranteeText, isDark && { color: '#34D399' }]}>
              Platform Guarantee: Escrow balance is held securely in institutional smart escrow.
            </Text>
          </View>
        </View>

        {/* Section 4: Interactive Milestone Roadmap */}
        <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardHeaderTitle, { color: themeColors.text }]}>
              Milestone Schedule ({contract.milestones.length})
            </Text>
            <Text style={[styles.cardHeaderSubtitle, { color: themeColors.textMuted }]}>Deliverables & Approvals</Text>
          </View>

          {contract.milestones.map((m, idx) => {
            const isReleased = m.status === 'RELEASED';
            const isSubmitted = m.status === 'SUBMITTED';
            const isInProgress = m.status === 'IN_PROGRESS';

            return (
              <View key={m.id || `m-${idx}`} style={styles.milestoneItem}>
                <View style={styles.milestoneStepColumn}>
                  <View
                    style={[
                      styles.milestoneStepCircle,
                      isReleased
                        ? styles.circleReleased
                        : isSubmitted
                        ? styles.circleSubmitted
                        : [styles.circlePending, isDark && { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border }],
                    ]}
                  >
                    {isReleased ? (
                      <CheckCircle2 size={13} color="#FFFFFF" strokeWidth={2.5} />
                    ) : (
                      <Text
                        style={[
                          styles.stepNumberText,
                          isSubmitted ? { color: '#FFFFFF' } : { color: themeColors.textMuted },
                        ]}
                      >
                        {m.stepOrder || idx + 1}
                      </Text>
                    )}
                  </View>
                  {idx < contract.milestones.length - 1 && <View style={[styles.verticalStepLine, { backgroundColor: themeColors.border }]} />}
                </View>

                <View style={[styles.milestoneBody, { backgroundColor: isDark ? themeColors.surfaceSubtle : '#F9FAFB', borderColor: themeColors.border }]}>
                  <View style={styles.milestoneHeaderLine}>
                    <Text style={[styles.milestoneTitleText, { color: themeColors.text }]}>{m.title}</Text>
                    <Text style={[styles.milestoneAmountText, isDark && { color: '#34D399' }]}>{formatCurrency(Number(m.amount))}</Text>
                  </View>

                  {m.description ? (
                    <Text style={[styles.milestoneDescText, { color: themeColors.textMuted }]}>{m.description}</Text>
                  ) : null}

                  {/* Status Badge */}
                  <View style={styles.milestoneStatusRow}>
                    <View
                      style={[
                        styles.milestoneBadge,
                        isReleased
                          ? styles.badgeReleased
                          : isSubmitted
                          ? styles.badgeSubmitted
                          : [styles.badgePending, isDark && { backgroundColor: themeColors.surface }],
                      ]}
                    >
                      <Text
                        style={[
                          styles.milestoneBadgeText,
                          isReleased
                            ? styles.badgeTextReleased
                            : isSubmitted
                            ? styles.badgeTextSubmitted
                            : [styles.badgeTextPending, isDark && { color: themeColors.textMuted }],
                        ]}
                      >
                        {isReleased
                          ? 'PAID & RELEASED'
                          : isSubmitted
                          ? 'AWAITING CLIENT APPROVAL'
                          : isInProgress
                          ? 'IN EXECUTION'
                          : 'PENDING'}
                      </Text>
                    </View>

                    {m.estimatedDays != null && (
                      <Text style={[styles.daysEstimateText, { color: themeColors.textMuted }]}>
                        Est. {m.estimatedDays} day{m.estimatedDays > 1 ? 's' : ''}
                      </Text>
                    )}
                  </View>

                  {/* Proof Photos Gallery if Artisan Submitted */}
                  {m.proofPhotos && m.proofPhotos.length > 0 && (
                    <View style={[styles.proofSection, { borderTopColor: themeColors.border }]}>
                      <Text style={[styles.proofHeading, { color: themeColors.text }]}>Artisan Proof Attachments:</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                        {m.proofPhotos.map((url, pIdx) => (
                          <TouchableOpacity
                            key={pIdx}
                            onPress={() => setPreviewPhoto(url)}
                            activeOpacity={0.8}
                            style={[styles.proofThumbWrap, { borderColor: themeColors.border }]}
                          >
                            <Image source={{ uri: url }} style={styles.proofThumb} resizeMode="cover" />
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Client Action Button when Milestone is SUBMITTED */}
                  {isSubmitted && (
                    <TouchableOpacity
                      style={styles.releaseMilestoneBtn}
                      onPress={() => onApproveMilestone(contract.id, m.id)}
                      activeOpacity={0.85}
                    >
                      <ShieldCheck size={16} color="#FFFFFF" strokeWidth={2} />
                      <Text style={styles.releaseMilestoneBtnText}>
                        Review & Release {formatCurrency(Number(m.amount))}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Section 5: Warranty & Dispute Policy */}
        <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Text style={[styles.cardHeaderTitle, { color: themeColors.text }]}>Protection & Dispute Resolution</Text>
          <Text style={[styles.policyBodyText, { color: themeColors.textMuted }]}>
            This contract includes Artifix's 14-day defect warranty. If work does not meet agreed
            specifications, do not release escrow. You may file a dispute for arbiter mediation.
          </Text>

          <TouchableOpacity
            style={[styles.disputeButton, isDark && { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}
            onPress={() => onFileDispute(contract.id)}
            activeOpacity={0.8}
          >
            <AlertTriangle size={15} color="#DC2626" strokeWidth={1.85} />
            <Text style={styles.disputeButtonText}>File Dispute / Request Arbiter</Text>
          </TouchableOpacity>
        </View>

        {/* Section 6: Cryptographic Audit Trail (Collapsible) */}
        <TouchableOpacity
          style={styles.auditHeaderRow}
          onPress={() => setShowAuditLog(!showAuditLog)}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <FileText size={15} color={themeColors.textMuted} strokeWidth={1.85} />
            <Text style={[styles.auditHeaderTitle, { color: themeColors.text }]}>Audit Trail & Smart Contract Proof</Text>
          </View>
          <ChevronDown
            size={16}
            color={themeColors.textMuted}
            strokeWidth={1.85}
            style={{ transform: [{ rotate: showAuditLog ? '180deg' : '0deg' }] }}
          />
        </TouchableOpacity>

        {showAuditLog && (
          <View style={[styles.auditCard, { backgroundColor: isDark ? themeColors.surfaceSubtle : '#F9FAFB', borderColor: themeColors.border }]}>
            <View style={styles.auditRow}>
              <Text style={[styles.auditLabel, { color: themeColors.textMuted }]}>Contract ID</Text>
              <Text style={[styles.auditVal, { color: themeColors.text }]} numberOfLines={1}>{contract.id}</Text>
            </View>
            <View style={styles.auditRow}>
              <Text style={[styles.auditLabel, { color: themeColors.textMuted }]}>Smart Escrow Addr</Text>
              <Text style={[styles.auditVal, { color: themeColors.text }]} numberOfLines={1}>
                {contract.smartContractAddr || '0x71C2a84920E3b49f1A83'}
              </Text>
            </View>
            <View style={styles.auditRow}>
              <Text style={[styles.auditLabel, { color: themeColors.textMuted }]}>Escrow Reference</Text>
              <Text style={[styles.auditVal, { color: themeColors.text }]}>{contract.contractCode}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Proof Photo Modal */}
      <Modal visible={!!previewPhoto} transparent animationType="fade">
        <View style={styles.photoModalWrap}>
          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={() => setPreviewPhoto(null)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <X size={16} color="#FFFFFF" />
              <Text style={styles.modalCloseBtnText}>Close Preview</Text>
            </View>
          </TouchableOpacity>
          {previewPhoto && (
            <Image source={{ uri: previewPhoto }} style={styles.fullImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
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
    paddingBottom: 60,
    gap: spacing.md,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: colors.neutral[600],
    fontWeight: '500',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  retryBtn: {
    backgroundColor: colors.brand.forest,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.full,
    marginTop: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  heroStatusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.sm,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusTagActive: {
    backgroundColor: '#FEF3C7',
  },
  statusTagSuccess: {
    backgroundColor: '#DCFCE7',
  },
  statusTagDanger: {
    backgroundColor: '#FEE2E2',
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusTextActive: {
    color: '#B45309',
  },
  statusTextSuccess: {
    color: '#15803D',
  },
  statusTextDanger: {
    color: '#B91C1C',
  },
  escrowLockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    gap: 4,
  },
  escrowLockText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  heroJobTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.neutral[900],
    lineHeight: 23,
  },
  heroJobMeta: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 4,
  },
  progressContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 11,
    color: colors.neutral[600],
    fontWeight: '600',
  },
  progressValue: {
    fontSize: 11,
    color: colors.brand.forest,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.sm,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.neutral[900],
    marginBottom: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardHeaderSubtitle: {
    fontSize: 11,
    color: colors.neutral[500],
    fontWeight: '600',
  },
  artisanRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artisanAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EAF2EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  artisanInitials: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.brand.forest,
  },
  artisanInfoCol: {
    flex: 1,
  },
  artisanNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  artisanTradeText: {
    fontSize: 11,
    color: colors.neutral[600],
    marginTop: 1,
  },
  artisanTrustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '700',
  },
  dotSeparator: {
    color: colors.neutral[400],
    fontSize: 10,
  },
  reviewsText: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  chatShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF2EC',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    gap: 4,
  },
  chatShortcutText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.brand.forest,
  },
  ledgerTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  ledgerTotalLabel: {
    fontSize: 12,
    color: colors.neutral[600],
    fontWeight: '500',
  },
  ledgerTotalAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.brand.forest,
  },
  ledgerGrid: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  ledgerGridCol: {
    flex: 1,
    alignItems: 'center',
  },
  ledgerMiniLabel: {
    fontSize: 10,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  ledgerGridVal: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.neutral[900],
    marginTop: 3,
    textAlign: 'center',
  },
  ledgerDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: radius.md,
    gap: 8,
    marginTop: 4,
  },
  guaranteeText: {
    fontSize: 11,
    color: '#065F46',
    flex: 1,
    lineHeight: 16,
  },
  milestoneItem: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  milestoneStepColumn: {
    alignItems: 'center',
    marginRight: 10,
    width: 24,
  },
  milestoneStepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleReleased: {
    backgroundColor: '#10B981',
  },
  circleSubmitted: {
    backgroundColor: '#D97706',
  },
  circlePending: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  stepNumberText: {
    fontSize: 10,
    fontWeight: '800',
  },
  verticalStepLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
  },
  milestoneBody: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  milestoneHeaderLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  milestoneTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutral[900],
    flex: 1,
    marginRight: 8,
  },
  milestoneAmountText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.brand.forest,
  },
  milestoneDescText: {
    fontSize: 11,
    color: colors.neutral[600],
    marginTop: 3,
    lineHeight: 16,
  },
  milestoneStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  milestoneBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  badgeReleased: {
    backgroundColor: '#DCFCE7',
  },
  badgeSubmitted: {
    backgroundColor: '#FEF3C7',
  },
  badgePending: {
    backgroundColor: '#F3F4F6',
  },
  milestoneBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  badgeTextReleased: {
    color: '#15803D',
  },
  badgeTextSubmitted: {
    color: '#B45309',
  },
  badgeTextPending: {
    color: colors.neutral[600],
  },
  daysEstimateText: {
    fontSize: 10,
    color: colors.neutral[500],
  },
  proofSection: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  proofHeading: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  proofThumbWrap: {
    marginRight: 8,
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  proofThumb: {
    width: 60,
    height: 60,
  },
  releaseMilestoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: radius.md,
    marginTop: 10,
    gap: 6,
  },
  releaseMilestoneBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  policyBodyText: {
    fontSize: 12,
    color: colors.neutral[600],
    lineHeight: 18,
    marginBottom: 12,
  },
  disputeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 10,
    borderRadius: radius.md,
    gap: 6,
  },
  disputeButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  auditHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  auditHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  auditCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  auditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  auditLabel: {
    fontSize: 11,
    color: colors.neutral[500],
    fontWeight: '500',
  },
  auditVal: {
    fontSize: 11,
    color: colors.neutral[800],
    fontWeight: '600',
    maxWidth: '60%',
  },
  photoModalWrap: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.base,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    zIndex: 10,
  },
  modalCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
});
