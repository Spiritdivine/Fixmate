import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ShieldAlert, Scale, Clock, Bot, X } from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows, useTheme } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { DisputeService } from '../../services/dispute.service';
import { ContractService } from '../../services/contract.service';
import { useQuery } from '@tanstack/react-query';
import { SkeletonPlaceholder } from '../shared';

interface ClientDisputeWorkspaceScreenProps {
  disputeId?: string;
  contractId?: string;
  onBack?: () => void;
}

export const ClientDisputeWorkspaceScreen: React.FC<ClientDisputeWorkspaceScreenProps> = ({
  disputeId: initialDisputeId,
  contractId,
  onBack,
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const [showFileModal, setShowFileModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState('POOR_QUALITY');
  const [claimDescription, setClaimDescription] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeDispute, setActiveDispute] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string | undefined>(contractId);

  const { data: myContracts } = useQuery({
    queryKey: ['contracts', 'client-disputes'],
    queryFn: () => ContractService.getMyContracts('CLIENT'),
  });

  const [chatLog, setChatLog] = useState<Array<{ sender: string; name: string; time: string; text: string }>>([]);

  const loadDispute = async () => {
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
        setActiveDispute(data);
        const evidenceList = (data as any)?.evidenceStatements;
        if (evidenceList && Array.isArray(evidenceList)) {
          setChatLog(
            evidenceList.map((e: any) => ({
              sender: e.submittedBy === 'CLIENT' ? 'client' : e.submittedBy === 'ARBITER' ? 'arbiter' : 'artisan',
              name: e.submittedBy === 'CLIENT' ? 'You (Client)' : e.submittedBy === 'ARBITER' ? 'Official Arbiter' : 'Artisan',
              time: e.createdAt ? new Date(e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
              text: e.statement || e.text || '',
            }))
          );
        } else if (data?.description) {
          setChatLog([
            {
              sender: 'client',
              name: 'You (Dispute Opened)',
              time: 'Case Opened',
              text: data.description,
            },
          ]);
        }
      }
    } catch (err) {
      console.warn('Could not load dispute details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDispute();
  }, [initialDisputeId]);

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatLog((prev) => [
      ...prev,
      {
        sender: 'client',
        name: 'You (Client)',
        time: 'Just now',
        text: msg,
      },
    ]);
    setChatInput('');

    if (activeDispute?.id) {
      try {
        await DisputeService.submitEvidence(activeDispute.id, msg);
      } catch (err) {
        console.warn('Failed to transmit evidence statement to backend:', err);
      }
    }
  };

  const handleFileClaim = async () => {
    const targetContractId = contractId || selectedContractId || myContracts?.[0]?.id || activeDispute?.contractId;
    if (!targetContractId) {
      Alert.alert('Contract Required', 'Please select an active contract to file this dispute claim.');
      return;
    }
    if (!claimDescription.trim()) {
      Alert.alert('Required', 'Please enter a description for your dispute claim.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await DisputeService.create({
        contractId: targetContractId,
        reason: selectedReason as any,
        description: claimDescription.trim(),
        category: 'QUALITY_DEFECT',
        requestedResolution: 'FORCE_COMPLETION',
      });
      setShowFileModal(false);
      setClaimDescription('');
      setActiveDispute(res);
      Alert.alert(
        'Dispute Claim Lodged',
        'Your dispute has been assigned to an official Artifix arbitrator. Escrow funds are frozen.'
      );
      loadDispute();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      Alert.alert('Dispute Submission Error', apiErr?.response?.data?.message || apiErr?.message || 'Failed to file dispute claim.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const caseId = activeDispute?.id ? `ARB-${activeDispute.id.slice(0, 6).toUpperCase()}` : 'ARB-PENDING';
  const disputedAmount = Number(activeDispute?.disputedAmount || activeDispute?.contract?.totalAmount || 0);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.headerBorder }]}>
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <Text style={[styles.backBtnText, { color: themeColors.text }]}>←</Text>
          </TouchableOpacity>
        )}
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Dispute Workspace</Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.textMuted }]}>Case #{caseId} • Escrow Protected</Text>
        </View>
        <TouchableOpacity
          style={[styles.fileNewBtn, isDark && { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}
          onPress={() => setShowFileModal(true)}
          activeOpacity={0.8}
        >
          <Text style={[styles.fileNewBtnText, isDark && { color: '#EF4444' }]}>+ File Claim</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.scrollContent}>
          {/* Dispute Status Card Shimmer */}
          <View style={[styles.statusCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <SkeletonPlaceholder width={110} height={20} borderRadius={radius.full} />
              <SkeletonPlaceholder width={80} height={18} borderRadius={radius.full} />
            </View>
            <View style={{ marginTop: 14 }}>
              <SkeletonPlaceholder width="75%" height={18} borderRadius={radius.sm} />
              <SkeletonPlaceholder width="95%" height={13} borderRadius={radius.sm} style={{ marginTop: 6 }} />
              <SkeletonPlaceholder width="60%" height={13} borderRadius={radius.sm} style={{ marginTop: 6 }} />
            </View>
          </View>

          {/* Evidence Card Shimmer */}
          <View style={[styles.aiInsightBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <SkeletonPlaceholder width={140} height={16} borderRadius={radius.sm} />
            <SkeletonPlaceholder width="100%" height={80} borderRadius={radius.md} style={{ marginTop: 12 }} />
          </View>

          {/* Action Box Shimmer */}
          <View style={[styles.aiInsightBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <SkeletonPlaceholder width={120} height={16} borderRadius={radius.sm} />
            <SkeletonPlaceholder width="100%" height={46} borderRadius={radius.md} style={{ marginTop: 12 }} />
          </View>
        </View>
      ) : !activeDispute ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
          <ShieldAlert size={48} color={themeColors.textMuted} style={{ marginBottom: 12 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: themeColors.text, marginBottom: 8, textAlign: 'center' }}>
            No Active Disputes
          </Text>
          <Text style={{ fontSize: 14, color: themeColors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 24, maxWidth: 320 }}>
            All your service contracts are in good standing with zero-trust escrow protection. If an artisan defaults or work has serious defects, you can file a mediation claim here.
          </Text>
          <TouchableOpacity
            style={[styles.fileNewBtn, { paddingHorizontal: 20, paddingVertical: 12 }, isDark && { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}
            onPress={() => setShowFileModal(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.fileNewBtnText, { fontSize: 14 }, isDark && { color: '#EF4444' }]}>+ File Dispute Claim</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Dispute Status Banner */}
          <View style={[styles.statusCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={styles.statusHeaderRow}>
              <View style={[styles.statusBadge, isDark && { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Scale size={13} color={isDark ? '#FBBF24' : '#D97706'} />
                  <Text style={[styles.statusBadgeText, isDark && { color: '#FBBF24' }]}>
                    {activeDispute?.status?.replace('_', ' ') || 'MEDIATION IN PROGRESS'}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Clock size={12} color={themeColors.textMuted} />
                <Text style={[styles.timerText, { color: themeColors.textMuted }]}>SLA: Active Arbitration</Text>
              </View>
            </View>

            <Text style={[styles.caseTitle, { color: themeColors.text }]}>
              {activeDispute?.title || activeDispute?.reason || 'Service Scope & Quality Review'}
            </Text>
            <Text style={[styles.contractRef, { color: themeColors.textMuted }]}>
              Contract: {activeDispute?.contract?.title || 'Protected Service Agreement'}
            </Text>

            <View style={[styles.escrowHoldBox, isDark && { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
              <Text style={[styles.escrowHoldLabel, isDark && { color: '#EF4444' }]}>FROZEN DISPUTED FUNDS</Text>
              <Text style={[styles.escrowHoldAmount, isDark && { color: '#F87171' }]}>{formatCurrency(disputedAmount)}</Text>
              <Text style={[styles.escrowHoldSub, isDark && { color: '#FCA5A5' }]}>
                Funds cannot be disbursed to artisan until arbitration concludes or mutual agreement is reached.
              </Text>
            </View>
          </View>

          {/* AI Oga John Mediation Recommendation */}
          {activeDispute?.aiRecommendation ? (
            <View style={[styles.aiInsightBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <View style={styles.aiHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Bot size={14} color="#10B981" />
                  <Text style={[styles.aiBadge, isDark && { color: '#34D399' }]}>Oga John AI Mediation Insight</Text>
                </View>
              </View>
              <Text style={[styles.aiText, { color: themeColors.text }]}>{activeDispute.aiRecommendation}</Text>
            </View>
          ) : (
            <View style={[styles.aiInsightBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <View style={styles.aiHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Bot size={14} color="#10B981" />
                  <Text style={[styles.aiBadge, isDark && { color: '#34D399' }]}>Oga John AI Mediation Protocol</Text>
                </View>
              </View>
              <Text style={[styles.aiText, { color: themeColors.text }]}>
                Escrow vault is locked. Both client and artisan evidence statements and site photos are being audited by human arbitration officers.
              </Text>
            </View>
          )}

          {/* 3-Party Arbitration Chat Room */}
          <View style={[styles.chatSection, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Text style={[styles.chatSectionTitle, { color: themeColors.textMuted }]}>Arbitration Dialogue</Text>

            {chatLog.length === 0 ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: themeColors.textMuted }}>No statements submitted yet. Send a message below.</Text>
              </View>
            ) : (
              chatLog.map((c, i) => (
                <View
                  key={i}
                  style={[
                    styles.bubble,
                    c.sender === 'client'
                      ? [styles.bubbleClient, isDark && { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)' }]
                      : c.sender === 'arbiter'
                      ? [styles.bubbleArbiter, isDark && { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' }]
                      : [styles.bubbleArtisan, { backgroundColor: themeColors.surfaceSubtle }],
                  ]}
                >
                  <View style={styles.bubbleHead}>
                    <Text
                      style={[
                        styles.senderName,
                        { color: themeColors.text },
                        c.sender === 'arbiter' && [styles.arbiterName, isDark && { color: '#FBBF24' }],
                      ]}
                    >
                      {c.name}
                    </Text>
                    <Text style={[styles.msgTime, { color: themeColors.textMuted }]}>{c.time}</Text>
                  </View>
                  <Text style={[styles.msgText, { color: themeColors.text }]}>{c.text}</Text>
                </View>
              ))
            )}

            {/* Chat Input */}
            <View style={[styles.chatInputRow, { borderTopColor: themeColors.border }]}>
              <TextInput
                style={[styles.chatInput, {
                  backgroundColor: themeColors.inputBg,
                  borderColor: themeColors.inputBorder,
                  color: themeColors.text,
                  borderWidth: 1,
                }]}
                placeholder="Type response to arbiter & contractor..."
                placeholderTextColor={themeColors.textMuted}
                value={chatInput}
                onChangeText={setChatInput}
              />
              <TouchableOpacity
                style={styles.sendBtn}
                onPress={handleSendChat}
                activeOpacity={0.8}
              >
                <Text style={styles.sendBtnText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* File Claim Modal */}
      <Modal visible={showFileModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: themeColors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>File Dispute Claim</Text>
              <TouchableOpacity onPress={() => setShowFileModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color={themeColors.textMuted} />
              </TouchableOpacity>
            </View>

            {!contractId && (
              <>
                <Text style={[styles.inputLabel, { color: themeColors.textMuted }]}>SELECT CONTRACT</Text>
                {myContracts && myContracts.length > 0 ? (
                  <ScrollView style={styles.contractPickerScroll} nestedScrollEnabled>
                    {myContracts.map((c: any) => {
                      const isSel = (selectedContractId || myContracts[0]?.id) === c.id;
                      return (
                        <TouchableOpacity
                          key={c.id}
                          style={[
                            styles.contractPickerItem,
                            { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border },
                            isSel && [styles.contractPickerItemActive, isDark && { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#EF4444' }],
                          ]}
                          onPress={() => setSelectedContractId(c.id)}
                        >
                          <Text style={[styles.contractPickerTitle, { color: themeColors.text }, isSel && styles.contractPickerTitleActive]}>
                            {c.title}
                          </Text>
                          <Text style={[styles.contractPickerMeta, { color: themeColors.textMuted }]}>
                            {formatCurrency(c.totalAmount || 0)} • {c.status}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                ) : (
                  <Text style={[styles.noContractsText, { color: themeColors.textMuted }]}>No active contracts found to lodge a claim.</Text>
                )}
              </>
            )}

            <Text style={[styles.inputLabel, { color: themeColors.textMuted }]}>Select Reason</Text>
            <View style={styles.reasonRow}>
              {[
                { label: 'Defect in Work', val: 'POOR_QUALITY' },
                { label: 'No-Show / Abandoned', val: 'ABANDONMENT' },
                { label: 'Price Alteration', val: 'PRICE_DISPUTE' },
              ].map((r) => (
                <TouchableOpacity
                  key={r.val}
                  style={[
                    styles.reasonChip,
                    { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border },
                    selectedReason === r.val && [styles.reasonChipActive, isDark && { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#EF4444' }],
                  ]}
                  onPress={() => setSelectedReason(r.val)}
                >
                  <Text
                    style={[
                      styles.reasonChipText,
                      { color: themeColors.textMuted },
                      selectedReason === r.val && styles.reasonChipTextActive,
                    ]}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { color: themeColors.textMuted }]}>Describe the defect or violation</Text>
            <TextInput
              style={[styles.descInput, {
                backgroundColor: themeColors.inputBg,
                borderColor: themeColors.inputBorder,
                color: themeColors.text,
                borderWidth: 1,
              }]}
              multiline
              numberOfLines={4}
              placeholder="Provide exact details of what was not completed according to the contract..."
              placeholderTextColor={themeColors.textMuted}
              value={claimDescription}
              onChangeText={setClaimDescription}
            />

            <TouchableOpacity
              style={styles.submitClaimBtn}
              onPress={handleFileClaim}
              disabled={isSubmitting}
            >
              <Text style={styles.submitClaimText}>
                {isSubmitting ? 'Transmitting Claim...' : 'Submit Claim & Freeze Escrow'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  fileNewBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  fileNewBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  scrollContent: {
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
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statusBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  timerText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
  },
  caseTitle: {
    ...typography.body,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
  },
  contractRef: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  escrowHoldBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  escrowHoldLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  escrowHoldAmount: {
    fontSize: typography.h2.fontSize,
    fontWeight: '900',
    color: '#991B1B',
    marginTop: 2,
  },
  escrowHoldSub: {
    fontSize: 10,
    color: '#7F1D1D',
    marginTop: 4,
    lineHeight: 14,
  },
  aiInsightBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  aiHeader: {
    marginBottom: spacing.xs,
  },
  aiBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  aiText: {
    ...typography.caption,
    color: colors.text,
    lineHeight: 18,
    marginTop: 2,
  },
  aiSplitProposal: {
    backgroundColor: colors.primaryLight,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  aiProposalText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    lineHeight: 16,
  },
  chatSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  chatSectionTitle: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bubble: {
    padding: spacing.sm,
    borderRadius: radius.md,
    maxWidth: '92%',
  },
  bubbleClient: {
    backgroundColor: '#F0FDF4',
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  bubbleArtisan: {
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
  },
  bubbleArbiter: {
    backgroundColor: '#FEF3C7',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
    width: '100%',
  },
  bubbleHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
  },
  arbiterName: {
    color: '#B45309',
  },
  msgTime: {
    fontSize: 9,
    color: colors.textMuted,
  },
  msgText: {
    ...typography.caption,
    color: colors.text,
    lineHeight: 18,
  },
  chatInputRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  chatInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: 12,
    color: colors.text,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    justifyContent: 'center',
  },
  sendBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: 40,
    gap: spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
  },
  closeBtn: {
    fontSize: 20,
    color: colors.textMuted,
  },
  inputLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  reasonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  reasonChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reasonChipActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  reasonChipText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  reasonChipTextActive: {
    color: '#DC2626',
    fontWeight: '700',
  },
  descInput: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.sm,
    height: 90,
    textAlignVertical: 'top',
    fontSize: 12,
    color: colors.text,
  },
  submitClaimBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    borderRadius: radius.full,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  submitClaimText: {
    ...typography.caption,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  contractPickerScroll: {
    maxHeight: 120,
    marginBottom: spacing.xs,
  },
  contractPickerItem: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xs + 2,
    borderRadius: radius.md,
    marginBottom: 4,
  },
  contractPickerItemActive: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  contractPickerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  contractPickerTitleActive: {
    color: '#DC2626',
    fontWeight: '700',
  },
  contractPickerMeta: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  noContractsText: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginBottom: spacing.xs,
  },
});
