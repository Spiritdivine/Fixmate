import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Check, Plus, MessageSquare, Send, X, AlertCircle, ClipboardList } from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows, touchTargets, useTheme } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { JobService } from '../../services/job.service';
import { JobRecord } from '../../types/api-contracts';
import { SkeletonPlaceholder } from '../shared';
import { useToast } from '../shared/ToastContext';
import { useDirectJobInvitation } from '../../hooks';

interface JobInvitationModalProps {
  visible: boolean;
  artisanId: string;
  artisanName: string;
  artisanTrade?: string;
  onClose: () => void;
  onSuccess?: () => void;
  onCreateNewJob?: () => void;
}

export const JobInvitationModal: React.FC<JobInvitationModalProps> = ({
  visible,
  artisanId,
  artisanName,
  artisanTrade,
  onClose,
  onSuccess,
  onCreateNewJob,
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const [mode, setMode] = useState<'SELECT_EXISTING' | 'QUICK_POST'>('SELECT_EXISTING');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [invitationMessage, setInvitationMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Post Form State
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDescription, setQuickDescription] = useState('');
  const [quickBudget, setQuickBudget] = useState('20000');

  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const { data: clientJobs, isLoading } = useQuery({
    queryKey: ['client-open-jobs-for-invite'],
    queryFn: () => JobService.getMyJobs(),
    enabled: visible,
  });

  const openJobs: JobRecord[] = Array.isArray(clientJobs)
    ? clientJobs.filter((j) => j.status === 'OPEN')
    : [];

  const { sendInvitation } = useDirectJobInvitation();

  const handleSendInvitation = async () => {
    if (mode === 'SELECT_EXISTING') {
      if (!selectedJobId) {
        showError('Please choose one of your open job requests');
        return;
      }

      const jobIdToInvite = selectedJobId;
      const msg = invitationMessage.trim() || undefined;

      // Immediate visual completion (<16ms)
      showSuccess(`Direct invitation sent to ${artisanName}!`);
      onSuccess?.();
      onClose();

      sendInvitation(
        { jobId: jobIdToInvite, artisanId, message: msg },
        {
          onError: (err: unknown) => {
            const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
            showError(apiErr?.response?.data?.message || apiErr?.message || 'Could not send invitation');
          },
        }
      );
    } else {
      // QUICK_POST MODE
      if (!quickTitle.trim() || quickTitle.trim().length < 5) {
        showError('Please enter a job title (at least 5 characters)');
        return;
      }
      if (!quickDescription.trim() || quickDescription.trim().length < 20) {
        showError('Please describe the repair needed (at least 20 characters)');
        return;
      }
      const budgetNum = parseFloat(quickBudget.replace(/[^0-9.]/g, ''));
      if (isNaN(budgetNum) || budgetNum <= 0) {
        showError('Please enter a valid budget');
        return;
      }

      setIsSubmitting(true);
      try {
        // 1. Create Job
        const newJob = await JobService.create({
          title: quickTitle.trim(),
          description: quickDescription.trim(),
          trade: artisanTrade || 'Specialist',
          budget: budgetNum,
          budgetMin: budgetNum,
          budgetMax: budgetNum,
        });

        // 2. Invite Artisan to Newly Created Job
        if (newJob?.id) {
          await JobService.inviteArtisan(newJob.id, artisanId, invitationMessage.trim() || undefined);
        }

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await queryClient.invalidateQueries({ queryKey: ['client-jobs'] });
        await queryClient.invalidateQueries({ queryKey: ['client-my-jobs'] });

        showSuccess(`Job created & invitation sent to ${artisanName}!`);
        onSuccess?.();
        onClose();
      } catch (err: unknown) {
        const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
        showError(apiErr?.response?.data?.message || apiErr?.message || 'Failed to create job and invite');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView style={styles.safeContainer}>
          <View style={[styles.sheetContainer, { backgroundColor: themeColors.surface }]}>
            {/* Handle */}
            <View style={[styles.handleBar, { backgroundColor: themeColors.border }]} />

            {/* Header */}
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { color: themeColors.text }]}>Invite to Job</Text>
                <Text style={[styles.headerSubtitle, { color: themeColors.textMuted }]}>
                  Invite <Text style={[styles.artisanNameBold, { color: themeColors.text }]}>{artisanName}</Text> ({artisanTrade || 'Artisan'})
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={touchTargets.hitSlop}>
                <X size={20} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            {/* Mode Switcher */}
            <View style={[styles.modeTabs, { backgroundColor: themeColors.surfaceSubtle }]}>
              <TouchableOpacity
                style={[styles.modeTab, mode === 'SELECT_EXISTING' && [styles.modeTabActive, { backgroundColor: themeColors.surface }]]}
                onPress={() => setMode('SELECT_EXISTING')}
              >
                <Text
                  style={[
                    styles.modeTabText,
                    { color: themeColors.textMuted },
                    mode === 'SELECT_EXISTING' && [styles.modeTabTextActive, { color: isDark ? '#34D399' : colors.brand.forest }],
                  ]}
                >
                  My Open Jobs ({openJobs.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeTab, mode === 'QUICK_POST' && [styles.modeTabActive, { backgroundColor: themeColors.surface }]]}
                onPress={() => setMode('QUICK_POST')}
              >
                <Text
                  style={[
                    styles.modeTabText,
                    { color: themeColors.textMuted },
                    mode === 'QUICK_POST' && [styles.modeTabTextActive, { color: isDark ? '#34D399' : colors.brand.forest }],
                  ]}
                >
                  + Create 1-Step Job
                </Text>
              </TouchableOpacity>
            </View>

            {/* Body */}
            {mode === 'SELECT_EXISTING' ? (
              isLoading ? (
                <View style={{ paddingVertical: 14, gap: 10 }}>
                  <View style={[styles.jobCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                    <SkeletonPlaceholder width="75%" height={16} borderRadius={radius.sm} />
                    <SkeletonPlaceholder width="50%" height={12} borderRadius={radius.sm} style={{ marginTop: 6 }} />
                  </View>
                  <View style={[styles.jobCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                    <SkeletonPlaceholder width="80%" height={16} borderRadius={radius.sm} />
                    <SkeletonPlaceholder width="45%" height={12} borderRadius={radius.sm} style={{ marginTop: 6 }} />
                  </View>
                </View>
              ) : openJobs.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <ClipboardList size={32} color={themeColors.textMuted} style={{ marginBottom: 8 }} />
                  <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No Open Job Requests</Text>
                  <Text style={[styles.emptySubtitle, { color: themeColors.textMuted }]}>
                    You don't have any active open requests right now. Create a new request directly for {artisanName}.
                  </Text>
                  <TouchableOpacity
                    style={[styles.postJobBtn, { backgroundColor: themeColors.primary }]}
                    onPress={() => setMode('QUICK_POST')}
                    activeOpacity={0.8}
                  >
                    <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
                    <Text style={styles.postJobBtnText}>Create Job for {artisanName}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView style={styles.jobsList} showsVerticalScrollIndicator={false}>
                  <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>Select an open request to attach:</Text>
                  {openJobs.map((job) => {
                    const isSelected = selectedJobId === job.id;
                    const budget = Number(job.budget || (job as any).budgetMax || (job as any).budgetMin || 0);
                    const trade = (job as any).category?.name || job.trade || 'General Handyman';

                    return (
                      <TouchableOpacity
                        key={job.id}
                        style={[
                          styles.jobCard,
                          { backgroundColor: themeColors.surface, borderColor: themeColors.border },
                          isSelected && [styles.jobCardSelected, { backgroundColor: isDark ? '#064E3B' : 'rgba(16, 185, 129, 0.05)', borderColor: themeColors.primary }],
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                          setSelectedJobId(job.id);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.radioOuter, { borderColor: isDark ? '#34D399' : colors.brand.forest }]}>
                          {isSelected && <View style={[styles.radioInner, { backgroundColor: isDark ? '#34D399' : colors.brand.forest }]} />}
                        </View>

                        <View style={styles.jobMeta}>
                          <Text style={[styles.jobTitle, { color: themeColors.text }]}>{job.title}</Text>
                          <View style={styles.jobSubRow}>
                            <Text style={[styles.jobTrade, { color: isDark ? '#34D399' : colors.brand.forest }]}>{trade}</Text>
                            <Text style={[styles.dot, { color: themeColors.textMuted }]}>•</Text>
                            <Text style={[styles.jobBudget, { color: themeColors.text }]}>{formatCurrency(budget)}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                  {/* Personal Note Input */}
                  <View style={[styles.noteBox, { borderTopColor: themeColors.border }]}>
                    <Text style={[styles.noteLabel, { color: themeColors.textMuted }]}>Custom Note to {artisanName.split(' ')[0]} (Optional)</Text>
                    <TextInput
                      style={[styles.noteInput, { backgroundColor: themeColors.inputBg, borderColor: themeColors.inputBorder, color: themeColors.text }]}
                      placeholder="e.g. Hi, please review the specifications and give your best quote..."
                      placeholderTextColor={themeColors.textMuted}
                      value={invitationMessage}
                      onChangeText={setInvitationMessage}
                      multiline
                      numberOfLines={2}
                    />
                  </View>
                </ScrollView>
              )
            ) : (
              /* QUICK POST 1-STEP FORM */
              <ScrollView style={styles.jobsList} showsVerticalScrollIndicator={false}>
                <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>Post a new repair request directly for {artisanName}:</Text>

                <Text style={[styles.inputLabel, { color: themeColors.textMuted }]}>JOB TITLE</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: themeColors.inputBg, borderColor: themeColors.inputBorder, color: themeColors.text }]}
                  placeholder={`e.g. Need ${artisanTrade || 'repair'} inspection & fix`}
                  placeholderTextColor={themeColors.textMuted}
                  value={quickTitle}
                  onChangeText={setQuickTitle}
                />

                <Text style={[styles.inputLabel, { color: themeColors.textMuted }]}>DESCRIPTION</Text>
                <TextInput
                  style={[styles.textInput, { height: 75, textAlignVertical: 'top', backgroundColor: themeColors.inputBg, borderColor: themeColors.inputBorder, color: themeColors.text }]}
                  placeholder="Describe the issue, defect, or parts that need fixing..."
                  placeholderTextColor={themeColors.textMuted}
                  value={quickDescription}
                  onChangeText={setQuickDescription}
                  multiline
                  numberOfLines={3}
                />

                <Text style={[styles.inputLabel, { color: themeColors.textMuted }]}>ESTIMATED TARGET BUDGET (₦)</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: themeColors.inputBg, borderColor: themeColors.inputBorder, color: themeColors.text }]}
                  placeholder="e.g. 25000"
                  placeholderTextColor={themeColors.textMuted}
                  value={quickBudget}
                  onChangeText={setQuickBudget}
                  keyboardType="numeric"
                />

                <Text style={[styles.inputLabel, { color: themeColors.textMuted }]}>PERSONAL NOTE TO ARTISAN (OPTIONAL)</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: themeColors.inputBg, borderColor: themeColors.inputBorder, color: themeColors.text }]}
                  placeholder="e.g. Saw your great reviews, hope you are available this weekend!"
                  placeholderTextColor={themeColors.textMuted}
                  value={invitationMessage}
                  onChangeText={setInvitationMessage}
                />
              </ScrollView>
            )}

            {/* Action Bar */}
            <View style={[styles.actionsRow, { borderTopColor: themeColors.border }]}>
              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: themeColors.surfaceSubtle }]}
                onPress={onClose}
                disabled={isSubmitting}
              >
                <Text style={[styles.cancelBtnText, { color: themeColors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  { backgroundColor: themeColors.primary },
                  ((mode === 'SELECT_EXISTING' && !selectedJobId) || isSubmitting) && styles.sendBtnDisabled,
                ]}
                onPress={handleSendInvitation}
                disabled={isSubmitting || (mode === 'SELECT_EXISTING' && !selectedJobId)}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Send size={15} color="#FFFFFF" strokeWidth={2.2} />
                    <Text style={styles.sendBtnText}>
                      {mode === 'SELECT_EXISTING' ? 'Send Invitation' : 'Post & Invite'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 33, 22, 0.6)',
    justifyContent: 'flex-end',
  },
  safeContainer: {
    maxHeight: '90%',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    padding: spacing.base,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  artisanNameBold: {
    fontWeight: '700',
    color: colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: radius.md,
    padding: 3,
    marginBottom: 14,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  modeTabTextActive: {
    color: colors.brand.forest,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  jobsList: {
    maxHeight: 320,
    marginBottom: 14,
  },
  jobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  jobCardSelected: {
    borderColor: colors.brand.forest,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.brand.forest,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brand.forest,
  },
  jobMeta: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  jobSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 6,
  },
  jobTrade: {
    fontSize: 11,
    color: colors.brand.forest,
    fontWeight: '600',
  },
  dot: {
    color: colors.textMuted,
    fontSize: 10,
  },
  jobBudget: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  noteBox: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  noteLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 6,
  },
  noteInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: radius.md,
    padding: 10,
    fontSize: 12,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 4,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  postJobBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brand.forest,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
  },
  postJobBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  sendBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.brand.forest,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
