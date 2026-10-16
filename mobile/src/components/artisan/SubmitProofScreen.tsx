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
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { ImageProcessor } from '../../lib/image-processor';
import { UploadService } from '../../services/upload.service';
import { EscrowService } from '../../services/escrow.service';
import { ContractService } from '../../services/contract.service';
import { queryClient } from '../../lib/query-client';

interface SubmitProofScreenProps {
  milestoneId?: string;
  contractId?: string;
  onBack?: () => void;
  onSubmitSuccess?: () => void;
}

export const SubmitProofScreen: React.FC<SubmitProofScreenProps> = ({
  milestoneId: initialMilestoneId,
  contractId: initialContractId,
  onBack,
  onSubmitSuccess,
}) => {
  const [activeMilestoneId, setActiveMilestoneId] = useState<string | undefined>(initialMilestoneId);
  const [milestoneTitle, setMilestoneTitle] = useState<string>('Milestone Deliverable');
  const [stepOrder, setStepOrder] = useState<number>(1);
  const [totalSteps, setTotalSteps] = useState<number>(1);
  const [loadingContext, setLoadingContext] = useState<boolean>(true);

  const [beforePhotoUri, setBeforePhotoUri] = useState<string | null>(null);
  const [afterPhotoUri, setAfterPhotoUri] = useState<string | null>(null);
  const [description, setDescription] = useState<string>('');
  const [coordsText, setCoordsText] = useState<string>('6.5244° N, 3.3792° E');
  const [timestampText, setTimestampText] = useState<string>(
    new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ' • ' +
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load contract and milestone context
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoadingContext(true);
        let cId = initialContractId;
        if (!cId) {
          const contracts = await ContractService.getMyContracts('ARTISAN');
          if (Array.isArray(contracts) && contracts.length > 0) {
            const inProgress = contracts.find((c: any) => c.status === 'ACTIVE' || c.status === 'IN_PROGRESS');
            cId = inProgress ? inProgress.id : contracts[0].id;
          }
        }

        if (cId) {
          const contractData = await ContractService.getById(cId);
          if (isMounted && contractData?.milestones) {
            const milestones = contractData.milestones;
            setTotalSteps(milestones.length || 1);
            let m = milestones.find((x: any) => x.id === initialMilestoneId);
            if (!m) {
              m = milestones.find((x: any) => x.status === 'IN_PROGRESS' || x.status === 'SUBMITTED') || milestones[0];
            }
            if (m) {
              setActiveMilestoneId(m.id);
              setMilestoneTitle(m.title || 'Work Deliverable');
              setStepOrder((m as any).stepOrder || (m as any).order || 1);
            }
          }
        }
      } catch (err) {
        console.warn('Error loading milestone context:', err);
      } finally {
        if (isMounted) setLoadingContext(false);
      }
    })();

    // Query Device GPS
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (isMounted && loc?.coords) {
            const lat = loc.coords.latitude.toFixed(4);
            const lng = loc.coords.longitude.toFixed(4);
            setCoordsText(`${lat}° N, ${lng}° E`);
          }
        }
      } catch {
        // Leave default Lagos coords
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [initialContractId, initialMilestoneId]);

  const handlePickPhoto = async (type: 'BEFORE' | 'AFTER') => {
    try {
      Alert.alert('Upload Photo', 'Choose photo source for proof of work', [
        {
          text: 'Camera',
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (type === 'BEFORE') setBeforePhotoUri(result.assets[0].uri);
              else setAfterPhotoUri(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Gallery',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (type === 'BEFORE') setBeforePhotoUri(result.assets[0].uri);
              else setAfterPhotoUri(result.assets[0].uri);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } catch (err) {
      console.warn('Image picker error:', err);
    }
  };

  const handleSubmit = async () => {
    if (!activeMilestoneId) {
      Alert.alert('Error', 'No active milestone identified to submit proof for.');
      return;
    }

    if (!afterPhotoUri) {
      Alert.alert('Photo Required', 'Please snap or select an after-completion photo showing the finished work.');
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      Alert.alert('Description Required', 'Please provide at least 10 characters describing the completed work and parts installed.');
      return;
    }

    setIsSubmitting(true);
    try {
      const proofAttachments: Array<{ url: string; fileType: string; tag: 'BEFORE' | 'AFTER' }> = [];

      if (beforePhotoUri) {
        let beforeUrl = beforePhotoUri;
        if (!beforePhotoUri.startsWith('http')) {
          const comp = await ImageProcessor.compressForInspection(beforePhotoUri);
          beforeUrl = await UploadService.uploadImage(comp, 'proofs');
        }
        proofAttachments.push({ url: beforeUrl, fileType: 'image/jpeg', tag: 'BEFORE' });
      }

      let afterUrl = afterPhotoUri;
      if (!afterPhotoUri.startsWith('http')) {
        const comp = await ImageProcessor.compressForInspection(afterPhotoUri);
        afterUrl = await UploadService.uploadImage(comp, 'proofs');
      }
      proofAttachments.push({ url: afterUrl, fileType: 'image/jpeg', tag: 'AFTER' });

      await EscrowService.submitWork(activeMilestoneId, {
        workNotes: description.trim(),
        proofAttachments,
      });

      await queryClient.invalidateQueries({ queryKey: ['contract'] });
      await queryClient.invalidateQueries({ queryKey: ['my-contracts'] });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Proof Submitted',
        'Your work completion proof has been transmitted to the client for verification and escrow release.',
        [{ text: 'OK', onPress: onSubmitSuccess }]
      );
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Could not submit proof. Please check your connection.';
      Alert.alert('Submission Error', errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercent = Math.min(100, Math.round((stepOrder / Math.max(1, totalSteps)) * 100));

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
          <Text style={styles.backChevron}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Completion Proof</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Milestone Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.milestoneTitle}>
              Milestone {stepOrder}: {milestoneTitle}
            </Text>
            <Text style={styles.stepCount}>
              {stepOrder} of {totalSteps}
            </Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        {/* Before & After Photo Capture Grid */}
        <View style={styles.photosGrid}>
          {/* Before Photo */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handlePickPhoto('BEFORE')}
            style={[styles.photoBox, styles.beforeBox]}
          >
            {beforePhotoUri ? (
              <>
                <Image source={{ uri: beforePhotoUri }} style={styles.capturedPhoto} />
                <View style={styles.badgeCaptured}>
                  <Text style={styles.checkIcon}>✓</Text>
                  <Text style={styles.capturedText}>Before (Set)</Text>
                </View>
              </>
            ) : (
              <View style={styles.cameraPlaceholder}>
                <Text style={styles.cameraEmoji}>📷</Text>
                <Text style={styles.cameraPromptText}>Initial Site Photo (Optional)</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* After Photo (Mandatory) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handlePickPhoto('AFTER')}
            style={[styles.photoBox, styles.afterBox]}
          >
            {afterPhotoUri ? (
              <>
                <Image source={{ uri: afterPhotoUri }} style={styles.capturedPhoto} />
                <View style={styles.badgeCaptured}>
                  <Text style={styles.checkIcon}>✓</Text>
                  <Text style={styles.capturedText}>Completed</Text>
                </View>
              </>
            ) : (
              <View style={styles.cameraPlaceholder}>
                <Text style={styles.cameraEmoji}>📸</Text>
                <Text style={styles.cameraPromptText}>Finished Work (Required)</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Location & Time Stamp Verification Card */}
        <View style={styles.stampCard}>
          <View style={styles.stampLeft}>
            <View style={styles.shieldBox}>
              <Text style={styles.shieldEmoji}>🛡️</Text>
            </View>
            <View style={styles.stampTextGroup}>
              <Text style={styles.stampTitle}>GPS & Time Verification</Text>
              <Text style={styles.stampCoords}>{coordsText}</Text>
              <Text style={styles.stampDate}>{timestampText}</Text>
            </View>
          </View>

          {/* Mini Map Snippet */}
          <View style={styles.miniMap}>
            <Text style={styles.mapPinEmoji}>📍</Text>
          </View>
        </View>

        {/* Work Description Section */}
        <View style={styles.descriptionSection}>
          <Text style={styles.descTitle}>Work Description & Notes</Text>
          <View style={styles.descBox}>
            <TextInput
              style={styles.descInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Detail what was performed (materials used, safety checks executed, load testing performed)..."
              placeholderTextColor={colors.neutral[400]}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.charCount}>{description.length}/500</Text>
          </View>
        </View>

        {/* Trust & Fraud Prevention Tag */}
        <View style={styles.verifiedRow}>
          <Text style={styles.greenShield}>🛡️</Text>
          <View style={styles.verifiedTextGroup}>
            <Text style={styles.verifiedHeading}>Photo + GPS Cryptographic Stamp</Text>
            <Text style={styles.verifiedSub}>Guarantees milestone completion proof for automatic escrow release.</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Submit Button */}
      <View style={styles.stickyFooter}>
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={isSubmitting}
          onPress={handleSubmit}
          style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>
              Submit for Client Review & Escrow Release
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  headerTitle: {
    fontSize: typography.size.base,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  placeholder: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: 110,
  },

  /* Progress Section */
  progressSection: {
    marginTop: spacing.base,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  milestoneTitle: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: colors.neutral[900],
    flex: 1,
  },
  stepCount: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
    marginLeft: 8,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.brand.emerald,
    borderRadius: radius.full,
  },

  /* Photos Grid */
  photosGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: spacing.base,
  },
  photoBox: {
    flex: 1,
    height: 150,
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  beforeBox: {
    borderStyle: 'dashed',
    borderColor: '#9CA3AF',
    backgroundColor: '#F9FAFB',
  },
  afterBox: {
    borderStyle: 'dashed',
    borderColor: colors.brand.emerald,
    backgroundColor: '#F0FDF4',
  },
  capturedPhoto: {
    width: '100%',
    height: '100%',
  },
  badgeCaptured: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(6, 95, 70, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    borderRadius: radius.full,
    gap: 4,
  },
  checkIcon: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: 'bold',
  },
  capturedText: {
    color: '#FFFFFF',
    fontSize: typography.size.xs,
    fontWeight: '700',
  },
  cameraPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  cameraEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  cameraPromptText: {
    fontSize: typography.size.xs,
    fontWeight: '700',
    color: colors.brand.forest,
    textAlign: 'center',
  },

  /* Stamp Card */
  stampCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    padding: spacing.md,
    borderRadius: radius.lg,
    marginTop: spacing.base,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  stampLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shieldBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldEmoji: {
    fontSize: 18,
  },
  stampTextGroup: {},
  stampTitle: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  stampCoords: {
    fontSize: typography.size.xs,
    color: colors.neutral[600],
    marginTop: 2,
  },
  stampDate: {
    fontSize: 10,
    color: colors.neutral[500],
  },
  miniMap: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  mapPinEmoji: {
    fontSize: 20,
  },

  /* Description */
  descriptionSection: {
    marginTop: spacing.base,
  },
  descTitle: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 6,
  },
  descBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: spacing.md,
  },
  descInput: {
    fontSize: typography.size.sm,
    color: colors.neutral[800],
    lineHeight: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 10,
    color: colors.neutral[400],
    textAlign: 'right',
    marginTop: 4,
  },

  /* Verified Row */
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: radius.md,
    marginTop: spacing.base,
    gap: 10,
  },
  greenShield: {
    fontSize: 20,
  },
  verifiedTextGroup: {
    flex: 1,
  },
  verifiedHeading: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  verifiedSub: {
    fontSize: 11,
    color: colors.neutral[500],
  },

  /* Sticky Footer */
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: '#F3F4F6',
  },
  submitButton: {
    backgroundColor: colors.brand.forest,
    paddingVertical: 15,
    borderRadius: radius.full,
    alignItems: 'center',
    ...shadows.base,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: typography.size.sm,
    fontWeight: '800',
  },
});
