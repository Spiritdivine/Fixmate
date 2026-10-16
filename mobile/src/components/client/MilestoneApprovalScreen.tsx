import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SlideToReleaseButton } from '../shared/SlideToReleaseButton';
import { MilestoneProgressBar } from '../shared/MilestoneProgressBar';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { EscrowService } from '../../services/escrow.service';
import { ContractService } from '../../services/contract.service';
import { AiService } from '../../services/ai.service';

interface MilestoneApprovalScreenProps {
  contractId?: string;
  milestoneId?: string;
  onBack?: () => void;
  onRaiseDispute?: (contractId?: string, milestoneId?: string) => void;
  onReleaseSuccess?: (contractId?: string, artisanId?: string) => void;
}

export const MilestoneApprovalScreen: React.FC<MilestoneApprovalScreenProps> = ({
  contractId,
  milestoneId: initialMilestoneId,
  onBack,
  onRaiseDispute,
  onReleaseSuccess,
}) => {
  const [loading, setLoading] = useState<boolean>(!!contractId);
  const [contractData, setContractData] = useState<any>(null);
  const [releasing, setReleasing] = useState<boolean>(false);

  // Phase 5 Hardening: Non-Visual OTP Handshake
  const [showOtpModal, setShowOtpModal] = useState<boolean>(false);
  const [otpTab, setOtpTab] = useState<'ENTER_PIN' | 'MY_PIN'>('ENTER_PIN');
  const [otpInput, setOtpInput] = useState<string>('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpExpiry, setOtpExpiry] = useState<string | null>(null);
  const [isGeneratingOtp, setIsGeneratingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);

  // Phase 5 Hardening: BOM Material Invoice Variance Audit
  const [showVarianceCard, setShowVarianceCard] = useState<boolean>(false);
  const [invoiceAmountInput, setInvoiceAmountInput] = useState<string>('');
  const [varianceResult, setVarianceResult] = useState<{
    varianceAmount?: number;
    variancePercent?: number;
    isFlagged?: boolean;
    recommendation?: string;
  } | null>(null);
  const [isEvaluatingVariance, setIsEvaluatingVariance] = useState<boolean>(false);


  useEffect(() => {
    if (!contractId) return;

    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await ContractService.getById(contractId);
        if (isMounted) setContractData(data);
      } catch (err: any) {
        console.warn('Failed to load contract details for approval:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [contractId]);

  const milestones = contractData?.milestones || [];
  const activeMilestone = milestones.find((m: any) => m.id === initialMilestoneId) ||
    milestones.find((m: any) => m.status === 'SUBMITTED') ||
    milestones[0];

  const milestoneId = activeMilestone?.id || initialMilestoneId || '';
  const milestoneTitle = activeMilestone?.title || contractData?.title || 'Contract Milestone';
  const milestoneAmount = Number(activeMilestone?.amount ?? (contractData?.totalAmount ?? 0));
  const stepNumber = activeMilestone?.stepOrder || 1;
  const totalSteps = milestones.length || 1;

  const currentStep = activeMilestone?.status === 'RELEASED' ? 3 : 2;

  const steps = [
    { number: 1, label: 'Funded' },
    { number: 2, label: 'Work Submitted' },
    { number: 3, label: 'Release' },
  ];

  const proofAttachments: Array<{ url: string; tag?: string; title?: string }> =
    activeMilestone?.proofAttachments || activeMilestone?.proofFiles || [];

  const beforePhoto = proofAttachments.find((p) => p.tag === 'BEFORE') || proofAttachments[0];
  const afterPhoto = proofAttachments.find((p) => p.tag === 'AFTER') || (proofAttachments.length > 1 ? proofAttachments[1] : undefined);

  const handleRelease = async () => {
    if (!milestoneId) {
      Alert.alert('Selection Error', 'No active milestone selected for approval.');
      return;
    }

    try {
      setReleasing(true);
      await EscrowService.approveRelease(milestoneId);
      Alert.alert(
        'Funds Released! 🎉',
        `${formatCurrency(milestoneAmount)} has been safely transferred from escrow to the artisan's wallet. Thank you for using Fixmate!`,
        [{ text: 'Great', onPress: () => onReleaseSuccess?.(contractId, contractData?.artisanId) }]
      );
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      const errorMsg = apiErr.response?.data?.message || apiErr.message || 'Could not release escrow funds';
      Alert.alert('Release Error', errorMsg);
    } finally {
      setReleasing(false);
    }
  };

  const handleGenerateOtp = async () => {
    if (!milestoneId) return;
    try {
      setIsGeneratingOtp(true);
      const res = await AiService.generateNonVisualOtp(milestoneId);
      setGeneratedOtp(res.otpCode);
      setOtpExpiry(res.expiresAt);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert('PIN Generation Failed', err?.response?.data?.message || err?.message || 'Could not generate verification PIN');
    } finally {
      setIsGeneratingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!milestoneId) return;
    if (!otpInput || otpInput.trim().length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a valid 6-digit verification PIN.');
      return;
    }
    try {
      setIsVerifyingOtp(true);
      await AiService.verifyNonVisualOtp(milestoneId, otpInput.trim());
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowOtpModal(false);
      Alert.alert(
        'Milestone Verified & Released! 🎉',
        'Non-visual physical test passed. Escrow funds transferred to the artisan.',
        [{ text: 'Great', onPress: () => onReleaseSuccess?.(contractId, contractData?.artisanId) }]
      );
    } catch (err: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Verification Failed', err?.response?.data?.message || err?.message || 'Invalid or expired confirmation PIN.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleEvaluateVariance = async () => {
    if (!milestoneId) return;
    const amt = parseFloat(invoiceAmountInput);
    if (!amt || amt <= 0) {
      Alert.alert('Amount Required', 'Please enter the total from the merchant counter invoice.');
      return;
    }
    try {
      setIsEvaluatingVariance(true);
      const res = await AiService.evaluateInvoiceVariance(milestoneId, amt);
      setVarianceResult(res);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err: any) {
      Alert.alert('Audit Error', err?.response?.data?.message || err?.message || 'Could not evaluate invoice variance.');
    } finally {
      setIsEvaluatingVariance(false);
    }
  };

  const handleDispute = () => {
    Alert.alert(
      'Raise Dispute',
      'Are you sure you want to flag this milestone? An arbiter will review the before/after evidence and freeze escrow release.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Proceed', style: 'destructive', onPress: () => onRaiseDispute?.(contractId, milestoneId) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Navigation */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
          <Text style={styles.backChevron}>←</Text>
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.screenTitle}>
            Milestone {stepNumber} of {totalSteps}
          </Text>
          <Text style={styles.screenSubtitle} numberOfLines={1}>
            {milestoneTitle}
          </Text>
        </View>

        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>
            {activeMilestone?.status === 'RELEASED' ? 'Released' : 'Review'}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.brand.forest} />
          <Text style={styles.loadingText}>Loading milestone evidence...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Milestone Steps Bar */}
          <MilestoneProgressBar steps={steps} currentStep={currentStep} />

          {/* Before & After Photos Card Container */}
          <View style={styles.cardContainer}>
            <Text style={styles.sectionTitle}>Before & After Proof of Work</Text>
            <Text style={styles.sectionSubtitle}>Photos submitted on-site by verified artisan</Text>

            {/* Side-by-Side Photos */}
            {beforePhoto?.url || afterPhoto?.url ? (
              <View style={styles.photosGrid}>
                {beforePhoto?.url && (
                  <TouchableOpacity activeOpacity={0.9} style={styles.photoCard}>
                    <Image
                      source={{ uri: beforePhoto.url }}
                      style={styles.photoImage}
                    />
                    <View style={styles.photoMeta}>
                      <Text style={styles.photoLabel}>Before (Initial State)</Text>
                      <Text style={styles.photoDate}>Site Inspection</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {afterPhoto?.url && (
                  <TouchableOpacity activeOpacity={0.9} style={styles.photoCard}>
                    <Image
                      source={{ uri: afterPhoto.url }}
                      style={styles.photoImage}
                    />
                    <View style={styles.photoMeta}>
                      <Text style={styles.photoLabel}>After (Completed Work)</Text>
                      <Text style={styles.photoDate}>Submitted Proof</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={[styles.notesBox, { alignItems: 'center', paddingVertical: 18, marginTop: 8 }]}>
                <Text style={{ fontSize: 24, marginBottom: 4 }}>📸</Text>
                <Text style={{ fontSize: 13, color: colors.neutral[600], fontWeight: '500', textAlign: 'center' }}>
                  No photo attachments uploaded for this milestone yet.
                </Text>
              </View>
            )}

            {/* Work Notes */}
            {activeMilestone?.workNotes && (
              <View style={styles.notesBox}>
                <Text style={styles.notesLabel}>Artisan Work Notes:</Text>
                <Text style={styles.notesBody}>"{activeMilestone.workNotes}"</Text>
              </View>
            )}

            {/* Non-Visual Verification Banner */}
            <View style={styles.nonVisualBanner}>
              <View style={styles.nonVisualTextCol}>
                <Text style={styles.nonVisualTitle}>Hidden or Non-Visual Repair?</Text>
                <Text style={styles.nonVisualSubtitle}>
                  For conduit wiring, pipes, or pressure tests that can't be checked by photos.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowOtpModal(true);
                  if (!generatedOtp) handleGenerateOtp();
                }}
                style={styles.otpLaunchBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.otpLaunchBtnText}>🔑 6-Digit PIN</Text>
              </TouchableOpacity>
            </View>

            {/* Materials Counter-Invoice Audit Accordion */}
            <TouchableOpacity
              onPress={() => setShowVarianceCard(!showVarianceCard)}
              style={styles.varianceToggle}
              activeOpacity={0.8}
            >
              <View style={styles.varianceToggleLeft}>
                <Text style={styles.varianceToggleEmoji}>🧾</Text>
                <View>
                  <Text style={styles.varianceToggleTitle}>Materials Counter-Invoice Audit</Text>
                  <Text style={styles.varianceToggleSub}>Check merchant pricing against market BOM</Text>
                </View>
              </View>
              <Text style={styles.varianceToggleArrow}>{showVarianceCard ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showVarianceCard && (
              <View style={styles.varianceAuditBox}>
                <Text style={styles.varianceInputLabel}>Merchant Invoice Total (NGN)</Text>
                <View style={styles.varianceInputRow}>
                  <TextInput
                    style={styles.varianceTextInput}
                    value={invoiceAmountInput}
                    onChangeText={setInvoiceAmountInput}
                    placeholder="e.g. 45000"
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    onPress={handleEvaluateVariance}
                    disabled={isEvaluatingVariance}
                    style={styles.auditActionBtn}
                  >
                    {isEvaluatingVariance ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.auditActionBtnText}>Audit BOM</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {varianceResult && (
                  <View
                    style={[
                      styles.varianceResultCard,
                      varianceResult.isFlagged
                        ? styles.varianceFlaggedCard
                        : styles.varianceApprovedCard,
                    ]}
                  >
                    <Text
                      style={[
                        styles.varianceResultTitle,
                        varianceResult.isFlagged
                          ? styles.varianceFlaggedText
                          : styles.varianceApprovedText,
                      ]}
                    >
                      {varianceResult.isFlagged
                        ? `⚠️ Caution: ${varianceResult.variancePercent ?? 0}% Above Market BOM`
                        : `✅ Verified: Within ${varianceResult.variancePercent ?? 0}% Market Tolerance`}
                    </Text>
                    {varianceResult.recommendation && (
                      <Text style={styles.varianceRecText}>
                        {varianceResult.recommendation}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Milestone Amount Card */}
          <View style={styles.amountCard}>
            <View style={styles.shieldIconBox}>
              <Text style={styles.shieldEmoji}>🛡️</Text>
            </View>

            <View style={styles.amountTextContainer}>
              <Text style={styles.amountLabel}>Milestone Release Amount</Text>
              <Text style={styles.amountValue}>{formatCurrency(milestoneAmount)}</Text>
            </View>

            <View style={styles.escrowPill}>
              <Text style={styles.escrowCheck}>✓</Text>
              <Text style={styles.escrowPillText}>In Monad Escrow</Text>
            </View>
          </View>

          {/* Platform Guarantee Card */}
          <View style={styles.guaranteeCard}>
            <View style={styles.lockIconBox}>
              <Text style={styles.lockEmoji}>🔒</Text>
            </View>
            <View style={styles.guaranteeTextContainer}>
              <Text style={styles.guaranteeTitle}>Smart Escrow Guarantee</Text>
              <Text style={styles.guaranteeSubtitle}>
                Only slide to release when you have inspected the worksite and are satisfied with the deliverable.
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Sticky Bottom Actions */}
      <View style={styles.stickyActions}>
        <SlideToReleaseButton
          label={releasing ? 'Authorizing Release...' : 'Slide to Release Funds to Artisan  >>>'}
          onRelease={handleRelease}
        />

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={handleDispute}
          style={styles.disputeButton}
        >
          <Text style={styles.disputeWarningIcon}>⚠️</Text>
          <Text style={styles.disputeButtonText}>Raise Issue / Request Correction</Text>
        </TouchableOpacity>
      </View>

      {/* Non-Visual Repair OTP Modal */}
      <Modal
        visible={showOtpModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOtpModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Non-Visual Handshake PIN</Text>
              <TouchableOpacity onPress={() => setShowOtpModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalTabRow}>
              <TouchableOpacity
                onPress={() => setOtpTab('ENTER_PIN')}
                style={[styles.modalTab, otpTab === 'ENTER_PIN' && styles.modalTabActive]}
              >
                <Text style={[styles.modalTabText, otpTab === 'ENTER_PIN' && styles.modalTabTextActive]}>
                  Verify Artisan PIN
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setOtpTab('MY_PIN')}
                style={[styles.modalTab, otpTab === 'MY_PIN' && styles.modalTabActive]}
              >
                <Text style={[styles.modalTabText, otpTab === 'MY_PIN' && styles.modalTabTextActive]}>
                  My Client PIN
                </Text>
              </TouchableOpacity>
            </View>

            {otpTab === 'ENTER_PIN' ? (
              <View style={styles.tabContent}>
                <Text style={styles.tabDescription}>
                  Enter the 6-digit confirmation PIN provided by the artisan after you test and verify the repair in person.
                </Text>
                <TextInput
                  style={styles.pinInput}
                  value={otpInput}
                  onChangeText={setOtpInput}
                  placeholder="000000"
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity
                  onPress={handleVerifyOtp}
                  disabled={isVerifyingOtp}
                  style={styles.pinSubmitBtn}
                >
                  {isVerifyingOtp ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.pinSubmitBtnText}>Verify PIN & Release Funds</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.tabContent}>
                <Text style={styles.tabDescription}>
                  Share this 6-digit PIN with the artisan only after you physically confirm the repair is fully operational.
                </Text>
                {isGeneratingOtp ? (
                  <ActivityIndicator size="large" color={colors.brand.forest} style={{ marginVertical: 20 }} />
                ) : (
                  <View style={styles.generatedPinBox}>
                    <Text style={styles.generatedPinText}>{generatedOtp || '------'}</Text>
                    {otpExpiry && (
                      <Text style={styles.pinExpiryText}>Valid for 15 minutes</Text>
                    )}
                  </View>
                )}
                <TouchableOpacity
                  onPress={handleGenerateOtp}
                  disabled={isGeneratingOtp}
                  style={styles.pinRegenBtn}
                >
                  <Text style={styles.pinRegenBtnText}>🔄 Generate New PIN</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: {
    fontSize: 22,
    color: colors.neutral[900],
    fontWeight: 'bold',
  },
  titleContainer: {
    flex: 1,
    marginLeft: 10,
  },
  screenTitle: {
    fontSize: typography.size.md,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  screenSubtitle: {
    fontSize: typography.size.xs + 1,
    color: colors.neutral[500],
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand.emeraldDark,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.brand.emeraldDark,
    textTransform: 'uppercase',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: 130,
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
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: typography.size.base,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  sectionSubtitle: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
    marginTop: 2,
    marginBottom: 12,
  },
  photosGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  photoCard: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  photoImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  photoMeta: {
    padding: 8,
    backgroundColor: '#F9FAFB',
  },
  photoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  photoDate: {
    fontSize: 9,
    color: colors.neutral[400],
    marginTop: 2,
  },
  notesBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    padding: 10,
    marginTop: 12,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.neutral[600],
    marginBottom: 2,
  },
  notesBody: {
    fontSize: typography.size.xs,
    color: colors.neutral[800],
    fontStyle: 'italic',
  },
  amountCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shieldIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldEmoji: {
    fontSize: 22,
  },
  amountTextContainer: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.neutral[600],
    textTransform: 'uppercase',
  },
  amountValue: {
    fontSize: typography.size.xl,
    fontWeight: '900',
    color: colors.brand.forest,
    marginTop: 2,
  },
  escrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 4,
  },
  escrowCheck: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.brand.emeraldDark,
  },
  escrowPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.brand.emeraldDark,
  },
  guaranteeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lockIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockEmoji: {
    fontSize: 18,
  },
  guaranteeTextContainer: {
    flex: 1,
  },
  guaranteeTitle: {
    fontSize: typography.size.xs + 1,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  guaranteeSubtitle: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
    lineHeight: 15,
  },
  stickyActions: {
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
    gap: 10,
  },
  disputeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
    gap: 6,
  },
  disputeWarningIcon: {
    fontSize: 14,
  },
  disputeButtonText: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: '#DC2626',
  },
  // Non-Visual OTP Banner & Modal Styles
  nonVisualBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: radius.lg,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 10,
  },
  nonVisualTextCol: {
    flex: 1,
  },
  nonVisualTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0369A1',
  },
  nonVisualSubtitle: {
    fontSize: 10,
    color: '#0284C7',
    marginTop: 2,
    lineHeight: 14,
  },
  otpLaunchBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.md,
  },
  otpLaunchBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  // Variance Audit Accordion
  varianceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: radius.lg,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  varianceToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  varianceToggleEmoji: {
    fontSize: 18,
  },
  varianceToggleTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  varianceToggleSub: {
    fontSize: 10,
    color: colors.neutral[500],
    marginTop: 1,
  },
  varianceToggleArrow: {
    fontSize: 10,
    color: colors.neutral[400],
    marginLeft: 8,
  },
  varianceAuditBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.lg,
    padding: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  varianceInputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral[700],
    marginBottom: 6,
  },
  varianceInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  varianceTextInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: typography.size.sm,
    color: colors.neutral[900],
  },
  auditActionBtn: {
    backgroundColor: colors.brand.forest,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  auditActionBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  varianceResultCard: {
    borderRadius: radius.md,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
  },
  varianceFlaggedCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  varianceApprovedCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  varianceResultTitle: {
    fontSize: 11,
    fontWeight: '800',
  },
  varianceFlaggedText: {
    color: '#DC2626',
  },
  varianceApprovedText: {
    color: colors.brand.forest,
  },
  varianceRecText: {
    fontSize: 10,
    color: colors.neutral[600],
    marginTop: 4,
    lineHeight: 14,
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    padding: spacing.lg,
    paddingBottom: 36,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: typography.size.md,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  closeBtn: {
    fontSize: 18,
    color: colors.neutral[400],
    padding: 4,
  },
  modalTabRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: radius.md,
    padding: 3,
    marginBottom: 16,
  },
  modalTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  modalTabActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  modalTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  modalTabTextActive: {
    color: colors.neutral[900],
    fontWeight: '800',
  },
  tabContent: {
    paddingVertical: 8,
  },
  tabDescription: {
    fontSize: 12,
    color: colors.neutral[600],
    lineHeight: 18,
    marginBottom: 16,
  },
  pinInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.brand.forest,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 10,
    textAlign: 'center',
    paddingVertical: 14,
    color: colors.brand.forest,
    marginBottom: 20,
  },
  pinSubmitBtn: {
    backgroundColor: colors.brand.forest,
    borderRadius: radius.full,
    paddingVertical: 14,
    alignItems: 'center',
  },
  pinSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: typography.size.sm,
    fontWeight: '800',
  },
  generatedPinBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: radius.xl,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  generatedPinText: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 8,
    color: colors.brand.forest,
  },
  pinExpiryText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.brand.emeraldDark,
    marginTop: 6,
  },
  pinRegenBtn: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: radius.full,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  pinRegenBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[700],
  },
});
