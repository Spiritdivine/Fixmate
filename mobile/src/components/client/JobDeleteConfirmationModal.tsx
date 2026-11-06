import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { AlertTriangle, Trash2, X, Edit3, ShieldAlert, CheckCircle2 } from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows, touchTargets, useTheme } from '../../theme';
import { formatCurrency } from '../../lib/formatters';

interface JobDeleteConfirmationModalProps {
  visible: boolean;
  jobTitle: string;
  jobBudget?: number;
  bidsCount?: number;
  isDeleting: boolean;
  onClose: () => void;
  onConfirmDelete: (reason: string) => void;
  onEditInstead?: () => void;
}

const CANCELLATION_REASONS = [
  'Found an artisan outside Artifix',
  'Repaired / Solved problem myself',
  'Mistake in scope or budget (will repost)',
  'Plans postponed / No longer needed',
  'Quotes received were out of budget',
  'Other reason',
];

export const JobDeleteConfirmationModal: React.FC<JobDeleteConfirmationModalProps> = ({
  visible,
  jobTitle,
  jobBudget = 0,
  bidsCount = 0,
  isDeleting,
  onClose,
  onConfirmDelete,
  onEditInstead,
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const [selectedReason, setSelectedReason] = useState<string>(CANCELLATION_REASONS[0]);

  const handleOpen = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  };

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    onConfirmDelete(selectedReason);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onShow={handleOpen}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={styles.backdropTouch}
          activeOpacity={1}
          onPress={isDeleting ? undefined : onClose}
        />

        <View style={[styles.sheetContainer, { backgroundColor: themeColors.surface }]}>
          {/* Top Drag Handle */}
          <View style={[styles.sheetHandle, { backgroundColor: themeColors.border }]} />

          {/* Header */}
          <View style={[styles.sheetHeader, { borderBottomColor: themeColors.border }]}>
            <View style={styles.warningIconBadge}>
              <AlertTriangle size={20} color="#DC2626" />
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={[styles.sheetTitle, { color: themeColors.text }]}>Cancel & Delete Job?</Text>
              <Text style={[styles.sheetSub, { color: themeColors.textMuted }]} numberOfLines={1}>
                {jobTitle} • {formatCurrency(jobBudget)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              disabled={isDeleting}
              hitSlop={touchTargets.hitSlop}
              style={styles.closeBtn}
            >
              <X size={20} color={themeColors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* 1. Impact / Consequence Checklist (Laws of UX: Common Region) */}
            <View
              style={[
                styles.consequenceCard,
                isDark
                  ? { backgroundColor: '#451A03', borderColor: '#78350F' }
                  : { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
              ]}
            >
              <Text style={[styles.consequenceHeader, isDark && { color: '#FCD34D' }]}>BEFORE YOU PROCEED:</Text>

              <View style={styles.consequenceItem}>
                <ShieldAlert size={16} color="#DC2626" style={styles.consequenceIcon} />
                <Text style={[styles.consequenceText, isDark && { color: '#FDE68A' }]}>
                  <Text style={[styles.consequenceHighlight, isDark && { color: '#FCD34D' }]}>
                    {bidsCount} {bidsCount === 1 ? 'artisan proposal' : 'artisan proposals'}
                  </Text>{' '}
                  will be closed and automatically withdrawn.
                </Text>
              </View>

              <View style={styles.consequenceItem}>
                <CheckCircle2 size={16} color="#16A34A" style={styles.consequenceIcon} />
                <Text style={[styles.consequenceText, isDark && { color: '#FDE68A' }]}>
                  <Text style={[styles.consequenceHighlight, isDark && { color: '#FCD34D' }]}>₦0 Charged</Text>: No escrow funds were
                  locked or charged for this job posting.
                </Text>
              </View>

              <View style={styles.consequenceItem}>
                <Trash2 size={16} color="#B45309" style={styles.consequenceIcon} />
                <Text style={[styles.consequenceText, isDark && { color: '#FDE68A' }]}>
                  This repair request will be immediately removed from the active artisan marketplace.
                </Text>
              </View>
            </View>

            {/* 2. Alternative "Edit Instead" Escape Hatch */}
            {onEditInstead && (
              <TouchableOpacity
                style={[
                  styles.editInsteadCard,
                  isDark
                    ? { backgroundColor: '#064E3B', borderColor: '#059669' }
                    : { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
                ]}
                onPress={() => {
                  onClose();
                  onEditInstead();
                }}
                disabled={isDeleting}
                activeOpacity={0.8}
              >
                <View style={[styles.editIconBox, isDark && { backgroundColor: '#022C22' }]}>
                  <Edit3 size={16} color={isDark ? '#34D399' : colors.brand.forest} />
                </View>
                <View style={styles.editTextWrap}>
                  <Text style={[styles.editCardTitle, isDark && { color: '#34D399' }]}>Want to change details instead?</Text>
                  <Text style={[styles.editCardSub, isDark && { color: '#A7F3D0' }]}>Update your budget, scope, or address without deleting.</Text>
                </View>
                <Text style={[styles.editCardChevron, isDark && { color: '#34D399' }]}>Edit ›</Text>
              </TouchableOpacity>
            )}

            {/* 3. Reason for Cancellation (Telemetry) */}
            <Text style={[styles.reasonHeader, { color: themeColors.textMuted }]}>REASON FOR CANCELLATION (OPTIONAL)</Text>
            <View style={styles.reasonList}>
              {CANCELLATION_REASONS.map((reason) => {
                const isSelected = selectedReason === reason;
                return (
                  <TouchableOpacity
                    key={reason}
                    style={[
                      styles.reasonChip,
                      { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border },
                      isSelected && [
                        styles.reasonChipSelected,
                        isDark && { backgroundColor: '#450A0A', borderColor: '#EF4444' },
                      ],
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setSelectedReason(reason);
                    }}
                    disabled={isDeleting}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected && <View style={styles.radioInnerDot} />}
                    </View>
                    <Text
                      style={[
                        styles.reasonText,
                        { color: themeColors.text },
                        isSelected && [styles.reasonTextSelected, isDark && { color: '#FCA5A5' }],
                      ]}
                    >
                      {reason}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Sticky Dual-Button Actions (Fitts's Law) */}
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={[styles.keepJobBtn, { backgroundColor: themeColors.primary }]}
              onPress={onClose}
              disabled={isDeleting}
              activeOpacity={0.85}
            >
              <Text style={styles.keepJobBtnText}>Keep My Job Request</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteBtn, isDeleting && styles.deleteBtnDisabled]}
              onPress={handleConfirm}
              disabled={isDeleting}
              activeOpacity={0.85}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={styles.deleteBtnContent}>
                  <Trash2 size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.deleteBtnText}>Permanently Delete Job</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  backdropTouch: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    maxHeight: '88%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    ...shadows.lg,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: radius.full,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  warningIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm + 2,
  },
  headerTextWrap: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: typography.size.base + 1,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  sheetSub: {
    fontSize: typography.size.xs + 1,
    color: colors.neutral[500],
    marginTop: 2,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  scrollBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  consequenceCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: spacing.md,
  },
  consequenceHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#991B1B',
    letterSpacing: 0.8,
    marginBottom: spacing.xs + 2,
  },
  consequenceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  consequenceIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  consequenceText: {
    flex: 1,
    fontSize: typography.size.xs + 1,
    color: '#7F1D1D',
    lineHeight: 18,
  },
  consequenceHighlight: {
    fontWeight: '800',
    color: '#991B1B',
  },
  editInsteadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  editIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  editTextWrap: {
    flex: 1,
  },
  editCardTitle: {
    fontSize: typography.size.xs + 1,
    fontWeight: '800',
    color: colors.brand.forest,
  },
  editCardSub: {
    fontSize: 11,
    color: colors.neutral[600],
    marginTop: 2,
  },
  editCardChevron: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.brand.forest,
    marginLeft: 6,
  },
  reasonHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.neutral[500],
    letterSpacing: 0.8,
    marginBottom: spacing.xs + 2,
    marginTop: spacing.xs,
  },
  reasonList: {
    gap: 8,
  },
  reasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  reasonChipSelected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioCircleSelected: {
    borderColor: '#DC2626',
  },
  radioInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
  },
  reasonText: {
    fontSize: typography.size.xs + 1,
    color: colors.neutral[700],
    fontWeight: '500',
    flex: 1,
  },
  reasonTextSelected: {
    color: '#991B1B',
    fontWeight: '700',
  },
  footerActions: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    gap: 10,
  },
  keepJobBtn: {
    backgroundColor: colors.brand.forest,
    borderRadius: radius.xl,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  keepJobBtnText: {
    color: '#FFFFFF',
    fontSize: typography.size.sm + 1,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  deleteBtn: {
    backgroundColor: '#DC2626',
    borderRadius: radius.xl,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnDisabled: {
    opacity: 0.6,
  },
  deleteBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontSize: typography.size.sm,
    fontWeight: '700',
  },
});
