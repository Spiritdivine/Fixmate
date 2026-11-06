import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  TextInput,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import {
  X,
  Zap,
  ZapOff,
  Scan,
  MapPin,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  User,
  ShieldCheck,
  Award,
} from 'lucide-react-native';
import { colors, radius, spacing, typography, useTheme } from '../../theme';
import { JobService } from '../../services/job.service';
import { LocationProvider } from '../../lib/location-provider';
import { useLoyaltyStore } from '../../stores/loyaltyStore';
import { useToast } from './ToastContext';
import { ReferralCapture } from '../../lib/referral-capture';

interface QRScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectArtisan?: (artisanIdOrSlug: string) => void;
  onApplyReferralCode?: (code: string) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCAN_AREA_SIZE = Math.min(SCREEN_WIDTH * 0.72, 280);

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  visible,
  onClose,
  onSelectArtisan,
  onApplyReferralCode,
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scanResult, setScanResult] = useState<{
    type: 'ARRIVAL_SUCCESS' | 'PROFILE_FOUND' | 'REFERRAL_FOUND' | 'ERROR';
    title: string;
    description: string;
    pointsAwarded?: number;
    distanceMeters?: number;
    actionPayload?: any;
  } | null>(null);

  const lastScannedTimeRef = useRef<number>(0);
  const { showSuccess, showError } = useToast();
  const fetchLoyaltyProfile = useLoyaltyStore((s) => s.fetchProfile);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    const now = Date.now();
    // Throttle duplicate reads within 2.5 seconds
    if (now - lastScannedTimeRef.current < 2500 || isProcessing) {
      return;
    }
    lastScannedTimeRef.current = now;

    if (!data || typeof data !== 'string') return;
    await processCode(data.trim());
  };

  const processCode = async (rawCode: string) => {
    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    try {
      // 1. On-Site Job Arrival Check-In
      // Formats: "artisan:checkin:<jobId>:<token>" or JSON { type: 'job_checkin', jobId, token }
      if (rawCode.startsWith('artisan:checkin:') || rawCode.includes('"job_checkin"')) {
        let jobId = '';
        let token = '';

        if (rawCode.startsWith('artisan:checkin:')) {
          const parts = rawCode.split(':');
          jobId = parts[2] || '';
          token = parts[3] || '';
        } else {
          try {
            const parsed = JSON.parse(rawCode);
            jobId = parsed.jobId;
            token = parsed.token;
          } catch {}
        }

        if (!jobId || !token) {
          throw new Error('Invalid Job Check-in QR format');
        }

        // Fetch physical GPS coordinates
        const location = await LocationProvider.getCurrentLocation(true);
        const result = await JobService.verifyArrival(jobId, token, {
          latitude: location.latitude,
          longitude: location.longitude,
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        fetchLoyaltyProfile().catch(() => {});

        setScanResult({
          type: 'ARRIVAL_SUCCESS',
          title: 'Physical Arrival Verified!',
          description: `You are on-site (${result.distanceMeters || 0}m away). Client notified and physical presence validated.`,
          pointsAwarded: result.pointsAwarded || 25,
          distanceMeters: result.distanceMeters,
        });
        return;
      }

      // 2. Artisan Profile Card Scan
      // Formats: "https://artisan.ng/p/:slug", "artisan.ng/p/:slug", "artisan:profile:<id>"
      if (rawCode.includes('/p/') || rawCode.startsWith('artisan:profile:')) {
        let artisanIdentifier = '';
        if (rawCode.startsWith('artisan:profile:')) {
          artisanIdentifier = rawCode.replace('artisan:profile:', '').trim();
        } else {
          const match = rawCode.match(/\/p\/([a-zA-Z0-9_-]+)/);
          if (match && match[1]) {
            artisanIdentifier = match[1];
          }
        }

        // Also extract ref code if present
        const refMatch = rawCode.match(/ref=([A-Z0-9-]+)/i);
        if (refMatch && refMatch[1] && onApplyReferralCode) {
          onApplyReferralCode(refMatch[1]);
        }

        if (artisanIdentifier) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          setScanResult({
            type: 'PROFILE_FOUND',
            title: 'Artisan Profile Identified',
            description: `Artisan ID / Handle: ${artisanIdentifier}`,
            actionPayload: artisanIdentifier,
          });
          return;
        }
      }

      // 3. Referral Code Scan (Direct code, custom URI, or encoded join URL)
      const extractedRef = ReferralCapture.extractFromPayload(rawCode);
      if (extractedRef) {
        await ReferralCapture.set(extractedRef);
        if (onApplyReferralCode) {
          onApplyReferralCode(extractedRef);
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setScanResult({
          type: 'REFERRAL_FOUND',
          title: 'Referral Invite Code Captured!',
          description: `Code: ${extractedRef} has been saved. 150 Welcome Points will be unlocked on your first job.`,
          actionPayload: extractedRef,
        });
        return;
      }

      // Unrecognized Code
      setScanResult({
        type: 'ERROR',
        title: 'Unrecognized Code',
        description: `Scanned code "${rawCode.substring(0, 45)}" is not a valid Artisan job or profile QR code.`,
      });
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      const msg = err?.response?.data?.message || err?.message || 'Verification failed';
      setScanResult({
        type: 'ERROR',
        title: 'Check-In Verification Failed',
        description: msg,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) return;
    setShowManualInput(false);
    processCode(manualCode.trim());
  };

  const resetScanner = () => {
    setScanResult(null);
    setManualCode('');
    setIsProcessing(false);
  };

  const handleDone = () => {
    if (scanResult?.type === 'PROFILE_FOUND' && onSelectArtisan) {
      onSelectArtisan(scanResult.actionPayload);
    } else if (scanResult?.type === 'REFERRAL_FOUND' && onApplyReferralCode) {
      onApplyReferralCode(scanResult.actionPayload);
    }
    resetScanner();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => setTorchEnabled((prev) => !prev)}
            activeOpacity={0.7}
          >
            {torchEnabled ? (
              <ZapOff size={20} color="#FBBF24" />
            ) : (
              <Zap size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          <View style={styles.titleWrap}>
            <Text style={styles.headerTitle}>Scan QR Code</Text>
            <Text style={styles.headerSubtitle}>Profiles & On-Site Arrival</Text>
          </View>

          <TouchableOpacity style={styles.controlBtn} onPress={onClose} activeOpacity={0.7}>
            <X size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Camera Feed or Permission Fallback */}
        {!permission?.granted ? (
          <View style={styles.permissionContainer}>
            <View style={styles.permissionIconWrap}>
              <Scan size={44} color={colors.primary[500]} />
            </View>
            <Text style={styles.permissionTitle}>Camera Access Needed</Text>
            <Text style={styles.permissionDescription}>
              Artifix needs camera access to scan artisan digital credential cards and verify
              on-site presence for job milestones.
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={requestPermission}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Grant Camera Permission</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => setShowManualInput(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryBtnText}>Enter Code Manually</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cameraContainer}>
            <CameraView
              style={StyleSheet.absoluteFill}
              enableTorch={torchEnabled}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={scanResult ? undefined : handleBarcodeScanned}
            />

            {/* Dark Mask Overlay around Scan Window */}
            <View style={styles.overlay}>
              <View style={styles.unfocusedContainer} />
              <View style={styles.middleRow}>
                <View style={styles.unfocusedSide} />
                <View style={styles.focusFrame}>
                  {/* High-Tech Reticle Corner Accents */}
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />

                  {isProcessing && (
                    <View style={styles.scanProcessingBackdrop}>
                      <ActivityIndicator size="large" color="#10B981" />
                      <Text style={styles.processingText}>Verifying Location & Code...</Text>
                    </View>
                  )}
                </View>
                <View style={styles.unfocusedSide} />
              </View>
              <View style={styles.unfocusedContainer} />
            </View>

            {/* Bottom Instructions and Manual Button */}
            <View style={styles.bottomControls}>
              <View style={styles.pillGuide}>
                <ShieldCheck size={16} color="#10B981" />
                <Text style={styles.pillGuideText}>Position QR code squarely inside frame</Text>
              </View>

              <TouchableOpacity
                style={styles.manualEntryBtn}
                onPress={() => setShowManualInput(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.manualEntryBtnText}>Type Code Manually</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Scan Result Modal / Card */}
        {scanResult && (
          <View style={styles.resultOverlay}>
            <View style={styles.resultCard}>
              <View
                style={[
                  styles.resultIconWrap,
                  scanResult.type === 'ERROR' ? styles.resultIconError : styles.resultIconSuccess,
                ]}
              >
                {scanResult.type === 'ERROR' ? (
                  <AlertCircle size={32} color="#EF4444" />
                ) : scanResult.type === 'ARRIVAL_SUCCESS' ? (
                  <CheckCircle size={32} color="#10B981" />
                ) : scanResult.type === 'PROFILE_FOUND' ? (
                  <User size={32} color="#10B981" />
                ) : (
                  <Award size={32} color="#F59E0B" />
                )}
              </View>

              <Text style={styles.resultTitle}>{scanResult.title}</Text>
              <Text style={styles.resultDescription}>{scanResult.description}</Text>

              {scanResult.pointsAwarded && scanResult.pointsAwarded > 0 && (
                <View style={styles.pointsBadge}>
                  <Award size={16} color="#F59E0B" />
                  <Text style={styles.pointsBadgeText}>
                    +{scanResult.pointsAwarded} Loyalty Points Awarded!
                  </Text>
                </View>
              )}

              <View style={styles.resultActions}>
                {scanResult.type === 'ERROR' ? (
                  <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={resetScanner}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.retryBtnText}>Scan Again</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={handleDone}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.confirmBtnText}>
                      {scanResult.type === 'PROFILE_FOUND'
                        ? 'View Artisan Profile'
                        : scanResult.type === 'REFERRAL_FOUND'
                        ? 'Apply Referral Code'
                        : 'Done'}
                    </Text>
                    <ArrowRight size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Manual Code Input Sheet */}
        {showManualInput && (
          <View style={styles.manualSheetBackdrop}>
            <View style={[styles.manualSheet, { backgroundColor: themeColors.surface }]}>
              <View style={styles.manualHeader}>
                <Text style={[styles.manualTitle, { color: themeColors.text }]}>Enter Code</Text>
                <TouchableOpacity
                  onPress={() => setShowManualInput(false)}
                  style={styles.closeManualBtn}
                >
                  <X size={20} color={themeColors.textMuted} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.manualSubtitle, { color: themeColors.textMuted }]}>
                Type the referral code (e.g. FIX-A8F2) or job token to process.
              </Text>
              <TextInput
                style={[
                  styles.manualInput,
                  {
                    backgroundColor: themeColors.inputBg,
                    borderColor: themeColors.inputBorder,
                    color: themeColors.text,
                  },
                ]}
                placeholder="FIX-XXXX or artisan:..."
                placeholderTextColor={themeColors.textMuted}
                value={manualCode}
                onChangeText={setManualCode}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: themeColors.primary }, !manualCode.trim() && styles.disabledBtn]}
                onPress={handleManualSubmit}
                disabled={!manualCode.trim()}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>Submit Code</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    zIndex: 10,
  },
  titleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: typography.fonts.semiBold,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: typography.fonts.regular,
    color: '#94A3B8',
  },
  controlBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
  },
  middleRow: {
    flexDirection: 'row',
    height: SCAN_AREA_SIZE,
  },
  unfocusedSide: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
  },
  focusFrame: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#10B981',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 10,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 10,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 10,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 10,
  },
  scanProcessingBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: typography.fonts.medium,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 34,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  pillGuide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: spacing.md,
  },
  pillGuideText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontFamily: typography.fonts.medium,
  },
  manualEntryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  manualEntryBtnText: {
    color: '#10B981',
    fontSize: 14,
    fontFamily: typography.fonts.semiBold,
    textDecorationLine: 'underline',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
    backgroundColor: '#0F172A',
  },
  permissionIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  permissionTitle: {
    fontSize: 20,
    fontFamily: typography.fonts.bold,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  permissionDescription: {
    fontSize: 14,
    fontFamily: typography.fonts.regular,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: colors.primary[500],
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: typography.fonts.semiBold,
  },
  secondaryBtn: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 13,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: typography.fonts.medium,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  resultOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    zIndex: 50,
  },
  resultCard: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  resultIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  resultIconSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  resultIconError: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  resultTitle: {
    fontSize: 18,
    fontFamily: typography.fonts.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  resultDescription: {
    fontSize: 13,
    fontFamily: typography.fonts.regular,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: spacing.lg,
  },
  pointsBadgeText: {
    color: '#FBBF24',
    fontSize: 13,
    fontFamily: typography.fonts.bold,
  },
  resultActions: {
    width: '100%',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: typography.fonts.semiBold,
  },
  retryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 13,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: typography.fonts.medium,
  },
  manualSheetBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
    zIndex: 60,
  },
  manualSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 36 : spacing.xl,
  },
  manualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  manualTitle: {
    fontSize: 18,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[900],
  },
  closeManualBtn: {
    padding: 4,
  },
  manualSubtitle: {
    fontSize: 13,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[500],
    marginBottom: spacing.md,
  },
  manualInput: {
    backgroundColor: colors.neutral[50],
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: typography.fonts.semiBold,
    color: colors.neutral[900],
    letterSpacing: 1.5,
    marginBottom: spacing.lg,
  },
});
