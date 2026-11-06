import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { X, Check, SlidersHorizontal, RotateCcw } from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows, touchTargets } from '../../theme';
import { formatCurrency } from '../../lib/formatters';

interface JobsFilterModalProps {
  visible: boolean;
  onClose: () => void;
  categories: Array<{ id: number; name: string }>;
  selectedCategoryId: number | null;
  onSelectCategoryId: (id: number | null) => void;
  selectedRadiusKm: number;
  onSelectRadiusKm: (radius: number) => void;
  selectedUrgency: 'ALL' | 'EMERGENCY' | 'HIGH' | 'MEDIUM';
  onSelectUrgency: (urgency: 'ALL' | 'EMERGENCY' | 'HIGH' | 'MEDIUM') => void;
  selectedMinBudget: number;
  onSelectMinBudget: (budget: number) => void;
  onApply: () => void;
  onReset: () => void;
}

const RADIUS_OPTIONS = [5, 10, 25, 50];
const BUDGET_OPTIONS = [0, 10000, 25000, 50000, 100000];
const URGENCY_OPTIONS: Array<{ id: 'ALL' | 'EMERGENCY' | 'HIGH' | 'MEDIUM'; label: string; icon: string }> = [
  { id: 'ALL', label: 'All Urgencies', icon: '⚡' },
  { id: 'EMERGENCY', label: 'Emergency Only', icon: '🚨' },
  { id: 'HIGH', label: 'Urgent (24h)', icon: '🔥' },
  { id: 'MEDIUM', label: 'Standard', icon: '⏱️' },
];

export const JobsFilterModal: React.FC<JobsFilterModalProps> = ({
  visible,
  onClose,
  categories,
  selectedCategoryId,
  onSelectCategoryId,
  selectedRadiusKm,
  onSelectRadiusKm,
  selectedUrgency,
  onSelectUrgency,
  selectedMinBudget,
  onSelectMinBudget,
  onApply,
  onReset,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <TouchableOpacity style={styles.backdropDismiss} activeOpacity={1} onPress={onClose} />
        <SafeAreaView style={styles.sheetContainer}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <SlidersHorizontal size={20} color={colors.brand.forest} />
              <Text style={styles.title}>Filter Jobs Radar</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Section 1: Maximum Dispatch Radius */}
            <Text style={styles.sectionHeading}>MAXIMUM DISPATCH RADIUS</Text>
            <View style={styles.chipRow}>
              {RADIUS_OPTIONS.map((km) => {
                const isActive = selectedRadiusKm === km;
                return (
                  <TouchableOpacity
                    key={km}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      onSelectRadiusKm(km);
                    }}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {km} km
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Section 2: Minimum Budget Threshold */}
            <Text style={styles.sectionHeading}>MINIMUM ESTIMATED BUDGET</Text>
            <View style={styles.chipRow}>
              {BUDGET_OPTIONS.map((amount) => {
                const isActive = selectedMinBudget === amount;
                return (
                  <TouchableOpacity
                    key={amount}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      onSelectMinBudget(amount);
                    }}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {amount === 0 ? 'Any Budget' : `> ${formatCurrency(amount)}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Section 3: Urgency Priority */}
            <Text style={styles.sectionHeading}>JOB URGENCY LEVEL</Text>
            <View style={styles.urgencyGrid}>
              {URGENCY_OPTIONS.map((u) => {
                const isActive = selectedUrgency === u.id;
                return (
                  <TouchableOpacity
                    key={u.id}
                    style={[styles.urgencyCard, isActive && styles.urgencyCardActive]}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      onSelectUrgency(u.id);
                    }}
                  >
                    <Text style={styles.urgencyIcon}>{u.icon}</Text>
                    <Text style={[styles.urgencyText, isActive && styles.urgencyTextActive]}>
                      {u.label}
                    </Text>
                    {isActive && <Check size={16} color={colors.brand.forest} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Section 4: Trade Category */}
            {categories && categories.length > 0 && (
              <>
                <Text style={styles.sectionHeading}>SPECIALIZED TRADE CATEGORY</Text>
                <View style={styles.chipRow}>
                  <TouchableOpacity
                    style={[styles.chip, selectedCategoryId === null && styles.chipActive]}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      onSelectCategoryId(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedCategoryId === null && styles.chipTextActive,
                      ]}
                    >
                      All Trades
                    </Text>
                  </TouchableOpacity>
                  {categories.map((c) => {
                    const isActive = selectedCategoryId === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[styles.chip, isActive && styles.chipActive]}
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => {});
                          onSelectCategoryId(c.id);
                        }}
                      >
                        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
            <View style={{ height: spacing.xl }} />
          </ScrollView>

          {/* Bottom Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                onReset();
              }}
            >
              <RotateCcw size={16} color={colors.textMuted} />
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                onApply();
              }}
            >
              <Text style={styles.applyText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  backdropDismiss: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '85%',
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: touchTargets.minInteractive,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.brand.emerald,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  chipTextActive: {
    color: colors.brand.forest,
    fontWeight: '700',
  },
  urgencyGrid: {
    gap: spacing.xs,
  },
  urgencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: touchTargets.minInteractive,
  },
  urgencyCardActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.brand.emerald,
  },
  urgencyIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  urgencyText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  urgencyTextActive: {
    color: colors.brand.forest,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: '#F3F4F6',
    minHeight: touchTargets.minInteractive,
    justifyContent: 'center',
  },
  resetText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  applyBtn: {
    flex: 1,
    backgroundColor: colors.brand.forest,
    borderRadius: radius.md,
    paddingVertical: 14,
    minHeight: touchTargets.minInteractive,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
