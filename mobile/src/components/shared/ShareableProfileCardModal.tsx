import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  ScrollView,
} from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import {
  X,
  Download,
  Share2,
  Check,
  Palette,
} from 'lucide-react-native';
import { radius, spacing, useTheme } from '../../theme';
import { useToast } from './ToastContext';
import {
  ProfileCardView,
  CARD_COLORS,
  CARD_PATTERNS,
  CardColorOption,
  CardPatternId,
} from './ProfileCardView';
import { saveProfileCard, shareProfileCard } from '../../lib/card-exporter';

export { CARD_COLORS, CARD_PATTERNS, CardColorOption, CardPatternId };

interface ShareableProfileCardModalProps {
  visible: boolean;
  onClose: () => void;
  user: any;
  referralCode: string;
  shareUrl: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 64, 300);

export const ShareableProfileCardModal: React.FC<ShareableProfileCardModalProps> = ({
  visible,
  onClose,
  user,
  referralCode,
  shareUrl,
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const cardRef = useRef<any>(null);
  const { showSuccess, showError } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'SAVE' | 'SHARE' | null>(null);

  // Customization State
  const [selectedColor, setSelectedColor] = useState<CardColorOption>(CARD_COLORS[0]);
  const [selectedPattern, setSelectedPattern] = useState<CardPatternId>('solid');

  const handleSaveToGallery = async () => {
    try {
      setIsExporting(true);
      setExportType('SAVE');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const result = await saveProfileCard({
        cardRef,
        user,
        referralCode,
        shareUrl,
        selectedColorHex: selectedColor.hex,
        selectedPattern,
      });

      if (result.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (result.message) showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (err: any) {
      console.error('[CardModal] Error saving card:', err);
      showError(`Failed to save card: ${err.message || 'Export error'}`);
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const handleShareImage = async () => {
    try {
      setIsExporting(true);
      setExportType('SHARE');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const result = await shareProfileCard({
        cardRef,
        user,
        referralCode,
        shareUrl,
        selectedColorHex: selectedColor.hex,
        selectedPattern,
      });

      if (result.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (result.message) showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (err: any) {
      console.error('[CardModal] Error sharing card:', err);
      showError(`Failed to share card: ${err.message || 'Export error'}`);
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <Palette size={18} color={isDark ? '#34D399' : '#1A4731'} />
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Your Profile Card</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={20} color={themeColors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Centered High-Res Card Snapshot Target */}
            <View style={styles.cardWrapper}>
              <ViewShot ref={cardRef} options={{ format: 'png', quality: 1 }}>
                <ProfileCardView
                  user={user}
                  referralCode={referralCode}
                  shareUrl={shareUrl}
                  selectedColor={selectedColor}
                  selectedPattern={selectedPattern}
                  cardWidth={CARD_WIDTH}
                />
              </ViewShot>
            </View>

            {/* Customization Controls */}
            <View style={[styles.customizationPanel, { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border }]}>
              {/* Color Selector */}
              <Text style={[styles.controlLabel, { color: themeColors.textMuted }]}>CARD THEME COLOR</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.swatchRow}
              >
                {CARD_COLORS.map((colorItem) => {
                  const isSelected = selectedColor.id === colorItem.id;
                  return (
                    <TouchableOpacity
                      key={colorItem.id}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: colorItem.hex },
                        isSelected && styles.colorSwatchActive,
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedColor(colorItem);
                      }}
                      activeOpacity={0.8}
                    >
                      {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Pattern Selector */}
              <Text style={[styles.controlLabel, { color: themeColors.textMuted, marginTop: 12 }]}>BACKGROUND PATTERN</Text>
              <View style={styles.patternPillRow}>
                {CARD_PATTERNS.map((p) => {
                  const isSelected = selectedPattern === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.patternPill,
                        { backgroundColor: themeColors.surface, borderColor: themeColors.border },
                        isSelected && {
                          backgroundColor: selectedColor.hex,
                          borderColor: selectedColor.hex,
                        },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedPattern(p.id);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.patternPillText,
                          { color: themeColors.text },
                          isSelected && styles.patternPillTextActive,
                        ]}
                      >
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Export Buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.saveBtn,
                  isDark && { backgroundColor: '#064E3B', borderColor: '#059669' },
                ]}
                onPress={handleSaveToGallery}
                disabled={isExporting}
                activeOpacity={0.8}
              >
                {isExporting && exportType === 'SAVE' ? (
                  <ActivityIndicator size="small" color={isDark ? '#A7F3D0' : '#1A4731'} />
                ) : (
                  <>
                    <Download size={18} color={isDark ? '#A7F3D0' : '#1A4731'} />
                    <Text style={[styles.saveBtnText, isDark && { color: '#A7F3D0' }]}>Save to Photos</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.shareBtn,
                  { backgroundColor: selectedColor.hex },
                ]}
                onPress={handleShareImage}
                disabled={isExporting}
                activeOpacity={0.8}
              >
                {isExporting && exportType === 'SHARE' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Share2 size={18} color="#FFFFFF" />
                    <Text style={styles.shareBtnText}>Share Card</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius['2xl'],
    paddingTop: spacing.base,
    paddingBottom: spacing.base,
    paddingHorizontal: spacing.base,
    width: '100%',
    maxWidth: 390,
    maxHeight: SCREEN_HEIGHT * 0.92,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.xs,
    paddingHorizontal: 4,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  cardWrapper: {
    marginVertical: spacing.xs,
    alignItems: 'center',
  },
  customizationPanel: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: radius.lg,
    padding: 12,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  controlLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchActive: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  patternPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  patternPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  patternPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  patternPillTextActive: {
    color: '#FFFFFF',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  saveBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  saveBtnText: {
    color: '#1A4731',
    fontWeight: '700',
    fontSize: 13,
  },
  shareBtn: {
    backgroundColor: '#1A4731',
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
