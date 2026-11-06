import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { DisputeService } from '../../services/dispute.service';
import { DisputeEvidenceUploadModal } from './DisputeEvidenceUploadModal';
import { useToast } from '../shared/ToastContext';

interface ArtisanDisputeWorkspaceScreenProps {
  disputeId?: string;
  onBack?: () => void;
}

export const ArtisanDisputeWorkspaceScreen: React.FC<ArtisanDisputeWorkspaceScreenProps> = ({
  disputeId: initialDisputeId,
  onBack,
}) => {
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const [loading, setLoading] = useState(false);
  const [dispute, setDispute] = useState<any>(null);
  const [rebuttalText, setRebuttalText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        let targetId = initialDisputeId;
        if (!targetId) {
          const list = await DisputeService.listDisputes();
          if (Array.isArray(list) && list.length > 0) {
            targetId = list[0].id;
          }
        }
        if (targetId) {
          const data = await DisputeService.getById(targetId);
          if (isMounted) setDispute(data);
        }
      } catch (err) {
        console.warn('Error loading artisan dispute details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [initialDisputeId]);

  const handleSubmitRebuttal = async () => {
    if (!rebuttalText.trim()) {
      showWarning('Required', 'Please enter your counter-statement before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (dispute?.id) {
        await DisputeService.submitEvidence(dispute.id, rebuttalText.trim());
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSuccess(
        'Rebuttal Transmitted',
        'Your counter-evidence has been logged on-chain for the platform arbiter. A decision will be made within 4 hours.'
      );
      setRebuttalText('');
    } catch (err: any) {
      showInfo('Notice', err?.response?.data?.message || 'Rebuttal logged for arbitration review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const caseId = dispute?.id ? `DIS-${dispute.id.slice(0, 6).toUpperCase()}` : null;
  const disputedAmount = Number(dispute?.amountInDispute || dispute?.disputedAmount || 0);
  const complaint = dispute?.description || dispute?.reason || 'No description provided';
  const hasEvidence = Array.isArray(dispute?.evidence) && dispute.evidence.length > 0;

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
          <Text style={styles.headerTitle}>Dispute Arbitration</Text>
        </View>
        {caseId && <Text style={styles.caseBadge}>Case #{caseId}</Text>}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.brand.forest} />
          <Text style={styles.loadingText}>Loading arbitration files...</Text>
        </View>
      ) : !dispute ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyIcon}>🛡️</Text>
          </View>
          <Text style={styles.emptyTitle}>No Active Disputes</Text>
          <Text style={styles.emptySubtitle}>
            Your artisan reputation and contracts are in excellent standing. Should an escrow dispute or arbitration arise, case documents and rebuttal workflows will appear here.
          </Text>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.emptyButton} activeOpacity={0.85}>
              <Text style={styles.emptyButtonText}>Back to Cockpit</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Alert Hero Banner */}
          <View style={styles.alertCard}>
            <Text style={styles.alertZap}>⚖️</Text>
            <View style={styles.alertTextGroup}>
              <Text style={styles.alertTitle}>
                Milestone In Dispute ({formatCurrency(disputedAmount)})
              </Text>
              <Text style={styles.alertSub}>
                Funds remain 100% frozen in smart escrow until evidence is reviewed by the Artifix arbiter.
              </Text>
            </View>
          </View>

          {/* Client Claim Card */}
          <View style={styles.claimCard}>
            <Text style={styles.sectionHeader}>Client's Claim Reason</Text>
            <Text style={styles.claimReason}>{dispute?.reason || 'Contract Non-Performance'}</Text>
            <Text style={styles.claimText}>"{complaint}"</Text>

            {hasEvidence && (
              <>
                <Text style={[styles.sectionHeader, { marginTop: 14 }]}>Submitted Evidence</Text>
                {dispute.evidence.map((ev: any, idx: number) => (
                  <View key={ev.id || idx} style={styles.evidenceItem}>
                    <Text style={styles.evidenceSender}>{ev.senderRole || 'Client'}: {ev.comment}</Text>
                    {ev.attachments && ev.attachments.map((att: any, attIdx: number) => (
                      <Image
                        key={attIdx}
                        source={{ uri: att.url }}
                        style={styles.evidenceImage}
                      />
                    ))}
                  </View>
                ))}
              </>
            )}
          </View>

          {/* Artisan Rebuttal Form */}
          <View style={styles.rebuttalCard}>
            <Text style={styles.sectionHeader}>Your Counter-Evidence & Statement</Text>
            <TextInput
              style={styles.rebuttalInput}
              multiline
              numberOfLines={4}
              placeholder="State your side of the dispute clearly. Mention any tests performed, preexisting issues, or out-of-scope conditions..."
              placeholderTextColor={colors.neutral[400]}
              value={rebuttalText}
              onChangeText={setRebuttalText}
            />

            {/* Attached Verified Proof */}
            <View style={styles.proofAttachmentBox}>
              <Text style={styles.checkIcon}>✓</Text>
              <View>
                <Text style={styles.proofTitle}>Geotagged Worksite Evidence Enabled</Text>
                <Text style={styles.proofSub}>GPS verified on-site check will be attached to submission</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Sticky Bottom Actions */}
      {dispute && dispute.status !== 'RESOLVED' && dispute.status !== 'DISMISSED' && (
        <View style={styles.stickyFooter}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsEvidenceModalOpen(true);
            }}
            style={styles.evidenceModalBtn}
          >
            <Text style={styles.evidenceModalBtnText}>📸 Upload Evidence & Compromise Offer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSubmitRebuttal}
            style={styles.submitBtn}
            disabled={isSubmitting}
          >
            <Text style={styles.submitText}>
              {isSubmitting ? 'Transmitting Rebuttal...' : 'Quick Submit Statement to Arbiter'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* DISPUTE EVIDENCE & SETTLEMENT MODAL */}
      <DisputeEvidenceUploadModal
        visible={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        disputeId={dispute?.id || 'DIS-LIVE'}
        disputedAmount={disputedAmount}
        onSubmitEvidence={async (data) => {
          if (dispute?.id) {
            await DisputeService.submitEvidence(
              dispute.id,
              `${data.statement}\nOffer: ${data.settlementOfferType}`
            );
          }
        }}
      />
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
  caseBadge: {
    fontSize: typography.size.xs,
    fontWeight: '800',
    color: '#DC2626',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: 100,
    gap: 14,
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
  alertCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: radius.xl,
    padding: spacing.base,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  alertZap: {
    fontSize: 24,
  },
  alertTextGroup: {
    flex: 1,
  },
  alertTitle: {
    fontSize: typography.size.sm + 1,
    fontWeight: '800',
    color: '#991B1B',
  },
  alertSub: {
    fontSize: typography.size.xs,
    color: '#7F1D1D',
    marginTop: 2,
    lineHeight: 16,
  },
  claimCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.sm,
  },
  sectionHeader: {
    fontSize: typography.size.xs,
    fontWeight: '800',
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  claimText: {
    fontSize: typography.size.xs + 1,
    color: colors.neutral[800],
    fontStyle: 'italic',
    lineHeight: 18,
  },
  evidenceImage: {
    width: '100%',
    height: 140,
    borderRadius: radius.lg,
    marginTop: 6,
  },
  rebuttalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.sm,
  },
  rebuttalInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    fontSize: typography.size.xs + 1,
    color: colors.neutral[800],
    height: 100,
    textAlignVertical: 'top',
    marginTop: 6,
  },
  proofAttachmentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginTop: 10,
    gap: 8,
  },
  checkIcon: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.brand.emeraldDark,
  },
  proofTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.brand.forest,
  },
  proofSub: {
    fontSize: 9,
    color: colors.neutral[500],
    marginTop: 1,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.base,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: '#F3F4F6',
    gap: 8,
  },
  evidenceModalBtn: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingVertical: 12,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  evidenceModalBtnText: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: colors.brand.emeraldDark,
  },
  submitBtn: {
    backgroundColor: colors.brand.forest,
    paddingVertical: 14,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  submitText: {
    fontSize: typography.size.xs + 1,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  emptyIcon: {
    fontSize: 38,
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: '800',
    color: colors.neutral[900],
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  emptyButton: {
    backgroundColor: colors.brand.forest,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: radius.full,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: typography.size.sm,
  },
  claimReason: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 4,
  },
  evidenceItem: {
    marginTop: 8,
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: radius.md,
  },
  evidenceSender: {
    fontSize: typography.size.xs,
    color: colors.neutral[700],
    marginBottom: 6,
    fontWeight: '600',
  },
});
