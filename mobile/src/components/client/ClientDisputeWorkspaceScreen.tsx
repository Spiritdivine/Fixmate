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
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { DisputeService } from '../../services/dispute.service';
import { ContractService } from '../../services/contract.service';
import { useQuery } from '@tanstack/react-query';

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
        'Your dispute has been assigned to an official Fixmate arbitrator. Escrow funds are frozen.'
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
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
        )}
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Dispute Workspace</Text>
          <Text style={styles.headerSubtitle}>Case #{caseId} • Escrow Protected</Text>
        </View>
        <TouchableOpacity
          style={styles.fileNewBtn}
          onPress={() => setShowFileModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.fileNewBtnText}>+ File Claim</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading dispute arbitration manifest...</Text>
        </View>
      ) : !activeDispute ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
          <Text style={{ fontSize: 44, marginBottom: 12 }}>🛡️</Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8, textAlign: 'center' }}>
            No Active Disputes
          </Text>
          <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 24, maxWidth: 320 }}>
            All your service contracts are in good standing with zero-trust escrow protection. If an artisan defaults or work has serious defects, you can file a mediation claim here.
          </Text>
          <TouchableOpacity
            style={[styles.fileNewBtn, { paddingHorizontal: 20, paddingVertical: 12 }]}
            onPress={() => setShowFileModal(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.fileNewBtnText, { fontSize: 14 }]}>+ File Dispute Claim</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Dispute Status Banner */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeaderRow}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>⚖️ {activeDispute?.status?.replace('_', ' ') || 'MEDIATION IN PROGRESS'}</Text>
              </View>
              <Text style={styles.timerText}>⏳ SLA: Active Arbitration</Text>
            </View>

            <Text style={styles.caseTitle}>
              {activeDispute?.title || activeDispute?.reason || 'Service Scope & Quality Review'}
            </Text>
            <Text style={styles.contractRef}>
              Contract: {activeDispute?.contract?.title || 'Protected Service Agreement'}
            </Text>

            <View style={styles.escrowHoldBox}>
              <Text style={styles.escrowHoldLabel}>FROZEN DISPUTED FUNDS</Text>
              <Text style={styles.escrowHoldAmount}>{formatCurrency(disputedAmount)}</Text>
              <Text style={styles.escrowHoldSub}>
                Funds cannot be disbursed to artisan until arbitration concludes or mutual agreement is reached.
              </Text>
            </View>
          </View>

          {/* AI Oga John Mediation Recommendation */}
          {activeDispute?.aiRecommendation ? (
            <View style={styles.aiInsightBox}>
              <View style={styles.aiHeader}>
                <Text style={styles.aiBadge}>🤖 Oga John AI Mediation Insight</Text>
              </View>
              <Text style={styles.aiText}>{activeDispute.aiRecommendation}</Text>
            </View>
          ) : (
            <View style={styles.aiInsightBox}>
              <View style={styles.aiHeader}>
                <Text style={styles.aiBadge}>🤖 Oga John AI Mediation Protocol</Text>
              </View>
              <Text style={styles.aiText}>
                Escrow vault is locked. Both client and artisan evidence statements and site photos are being audited by human arbitration officers.
              </Text>
            </View>
          )}

          {/* 3-Party Arbitration Chat Room */}
          <View style={styles.chatSection}>
            <Text style={styles.chatSectionTitle}>Arbitration Dialogue</Text>

            {chatLog.length === 0 ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: colors.textMuted }}>No statements submitted yet. Send a message below.</Text>
              </View>
            ) : (
              chatLog.map((c, i) => (
                <View
                  key={i}
                  style={[
                    styles.bubble,
                    c.sender === 'client'
                      ? styles.bubbleClient
                      : c.sender === 'arbiter'
                      ? styles.bubbleArbiter
                      : styles.bubbleArtisan,
                  ]}
                >
                  <View style={styles.bubbleHead}>
                    <Text
                      style={[
                        styles.senderName,
                        c.sender === 'arbiter' && styles.arbiterName,
                      ]}
                    >
                      {c.name}
                    </Text>
                    <Text style={styles.msgTime}>{c.time}</Text>
                  </View>
                  <Text style={styles.msgText}>{c.text}</Text>
                </View>
              ))
            )}

            {/* Chat Input */}
            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatInput}
                placeholder="Type response to arbiter & contractor..."
                placeholderTextColor={colors.textMuted}
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
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>File Dispute Claim</Text>
              <TouchableOpacity onPress={() => setShowFileModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {!contractId && (
              <>
                <Text style={styles.inputLabel}>SELECT CONTRACT</Text>
                {myContracts && myContracts.length > 0 ? (
                  <ScrollView style={styles.contractPickerScroll} nestedScrollEnabled>
                    {myContracts.map((c: any) => {
                      const isSel = (selectedContractId || myContracts[0]?.id) === c.id;
                      return (
                        <TouchableOpacity
                          key={c.id}
                          style={[styles.contractPickerItem, isSel && styles.contractPickerItemActive]}
                          onPress={() => setSelectedContractId(c.id)}
                        >
                          <Text style={[styles.contractPickerTitle, isSel && styles.contractPickerTitleActive]}>
                            {c.title}
                          </Text>
                          <Text style={styles.contractPickerMeta}>
                            {formatCurrency(c.totalAmount || 0)} • {c.status}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                ) : (
                  <Text style={styles.noContractsText}>No active contracts found to lodge a claim.</Text>
                )}
              </>
            )}

            <Text style={styles.inputLabel}>Select Reason</Text>
            <View style={styles.reasonRow}>
              {[
                { label: 'Defect in Work', val: 'POOR_QUALITY' },
                { label: 'No-Show / Abandoned', val: 'ABANDONMENT' },
                { label: 'Price Alteration', val: 'PRICE_DISPUTE' },
              ].map((r) => (
                <TouchableOpacity
                  key={r.val}
                  style={[styles.reasonChip, selectedReason === r.val && styles.reasonChipActive]}
                  onPress={() => setSelectedReason(r.val)}
                >
                  <Text
                    style={[
                      styles.reasonChipText,
                      selectedReason === r.val && styles.reasonChipTextActive,
                    ]}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Describe the defect or violation</Text>
            <TextInput
              style={styles.descInput}
              multiline
              numberOfLines={4}
              placeholder="Provide exact details of what was not completed according to the contract..."
              placeholderTextColor={colors.textMuted}
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
