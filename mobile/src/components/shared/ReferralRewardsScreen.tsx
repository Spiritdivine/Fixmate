import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Gift,
  Share2,
  Copy,
  Award,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  QrCode,
  Zap,
  Download,
  Check,
  Users,
  ArrowUpRight,
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { ShareableProfileCardModal } from './ShareableProfileCardModal';
import {
  ProfileCardView,
  CARD_COLORS,
  CARD_PATTERNS,
  CardColorOption,
  CardPatternId,
} from './ProfileCardView';
import { saveProfileCard, shareProfileCard } from '../../lib/card-exporter';
import { useLoyaltyStore } from '../../stores/loyaltyStore';
import { useAuthStore } from '../../stores/authStore';
import { LoyaltyService, ReferralActivityItem } from '../../services/loyalty.service';
import { useToast } from '../shared/ToastContext';
import { colors, radius, spacing, typography, useTheme } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ReferralRewardsScreenProps {
  onBack?: () => void;
  onScanQr?: () => void;
}

type TabType = 'REWARDS' | 'SHARE_CARD' | 'LEDGER';

export const ReferralRewardsScreen: React.FC<ReferralRewardsScreenProps> = ({ onBack, onScanQr }) => {
  const { colors: themeColors, isDark } = useTheme();
  const { user } = useAuthStore();
  const {
    points,
    tier,
    referral,
    ledgerItems,
    isLoading,
    isLedgerLoading,
    fetchProfile,
    fetchLedger,
    purchaseBoost,
  } = useLoyaltyStore();
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('REWARDS');
  const [isBoosting, setIsBoosting] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [previewColor, setPreviewColor] = useState<CardColorOption>(CARD_COLORS[0]);
  const [previewPattern, setPreviewPattern] = useState<CardPatternId>('solid');
  const screenCardRef = useRef<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'SAVE' | 'SHARE' | null>(null);

  // Referral Activity Feed State
  const [activityItems, setActivityItems] = useState<ReferralActivityItem[]>([]);
  const [isActivityLoading, setIsActivityLoading] = useState(false);

  const fetchActivity = async () => {
    try {
      setIsActivityLoading(true);
      const data = await LoyaltyService.getReferralActivity();
      setActivityItems(data.items || []);
    } catch {
      // ignore
    } finally {
      setIsActivityLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchLedger();
    fetchActivity();
  }, []);

  const handleCopyCode = async () => {
    if (!referral.code) return;
    await Clipboard.setStringAsync(referral.code);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showSuccess('Referral code copied to clipboard!');
  };

  const handleSaveCardDirect = async () => {
    try {
      setIsExporting(true);
      setExportType('SAVE');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const result = await saveProfileCard({
        cardRef: screenCardRef,
        user,
        referralCode: referral.code,
        shareUrl: referral.shareUrl,
        selectedColorHex: previewColor.hex,
        selectedPattern: previewPattern,
      });

      if (result.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (result.message) showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (err: any) {
      console.error('[ReferralRewardsScreen] Error saving card:', err);
      showError(`Failed to save card: ${err.message || 'Export error'}`);
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const handleShareCardDirect = async () => {
    try {
      setIsExporting(true);
      setExportType('SHARE');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const result = await shareProfileCard({
        cardRef: screenCardRef,
        user,
        referralCode: referral.code,
        shareUrl: referral.shareUrl,
        selectedColorHex: previewColor.hex,
        selectedPattern: previewPattern,
      });

      if (result.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (result.message) showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (err: any) {
      console.error('[ReferralRewardsScreen] Error sharing card:', err);
      showError(`Failed to share card: ${err.message || 'Export error'}`);
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const handleNativeShare = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const isArtisan = user?.role === 'ARTISAN';

    const shareMessage = isArtisan
      ? `Hello bro! I get verified repair jobs with 100% pre-funded escrow on Artifix.\nRegister with my artisan invite link (${referral.code}) to unlock 0% commission on your first jobs:\n${referral.shareUrl}`
      : `Hey! I use Artifix to find verified plumbers, electricians, and AC technicians in Lagos with 100% money-back escrow protection.\nUse my invite code ${referral.code} to get ₦750 (150 pts) bonus on your first repair:\n${referral.shareUrl}`;

    try {
      await Share.share({
        message: shareMessage,
        title: 'Invite to Artifix Escrow & Rewards',
      });
    } catch (err: any) {
      console.warn('Share dismissed or failed:', err.message);
    }
  };

  const handleBoostDirectory = async () => {
    if (points.available < 500) {
      showError('You need at least 500 points to activate a 7-day Directory Spotlight.');
      return;
    }

    try {
      setIsBoosting(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await purchaseBoost(7);
      showSuccess('7-Day Directory Spotlight activated! Your profile is now featured.');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Could not activate directory boost.');
    } finally {
      setIsBoosting(false);
    }
  };

  const progressPercent = Math.min(
    100,
    Math.round((tier.tierPoints / (tier.tierPoints + tier.pointsToNextTier || 1)) * 100)
  );

  const ngnValue = (points.available * 5).toLocaleString('en-NG');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      {/* 1. Header Bar */}
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.headerBorder }]}>
        {onBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowLeft size={22} color={themeColors.text} />
          </TouchableOpacity>
        )}
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Rewards & Loyalty Hub</Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.textMuted }]}>Earn points, boost rank & get fee discounts</Text>
        </View>
      </View>

      {/* 2. Sub-Tabs */}
      <View style={[styles.tabBar, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'REWARDS' && [styles.tabButtonActive, { borderBottomColor: themeColors.primary }]]}
          onPress={() => {
            Haptics.selectionAsync();
            setActiveTab('REWARDS');
          }}
        >
          <Text style={[styles.tabButtonText, { color: themeColors.textMuted }, activeTab === 'REWARDS' && [styles.tabButtonTextActive, { color: isDark ? '#34D399' : '#1A4731' }]]}>
            Rewards & Tier
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'SHARE_CARD' && [styles.tabButtonActive, { borderBottomColor: themeColors.primary }]]}
          onPress={() => {
            Haptics.selectionAsync();
            setActiveTab('SHARE_CARD');
          }}
        >
          <Text style={[styles.tabButtonText, { color: themeColors.textMuted }, activeTab === 'SHARE_CARD' && [styles.tabButtonTextActive, { color: isDark ? '#34D399' : '#1A4731' }]]}>
            Share & QR Card
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'LEDGER' && [styles.tabButtonActive, { borderBottomColor: themeColors.primary }]]}
          onPress={() => {
            Haptics.selectionAsync();
            setActiveTab('LEDGER');
          }}
        >
          <Text style={[styles.tabButtonText, { color: themeColors.textMuted }, activeTab === 'LEDGER' && [styles.tabButtonTextActive, { color: isDark ? '#34D399' : '#1A4731' }]]}>
            Ledger History
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Main Body Content */}
      <ScrollView
        style={[styles.scrollArea, { backgroundColor: themeColors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeColors.primary} />
            <Text style={[styles.loadingText, { color: themeColors.textMuted }]}>Loading rewards profile...</Text>
          </View>
        ) : activeTab === 'REWARDS' ? (
          /* TAB 1: REWARDS & TIER */
          <View>
            {/* Tier Hero Card */}
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View style={styles.tierPill}>
                  <Award size={16} color="#F59E0B" />
                  <Text style={styles.tierPillText}>{tier.current} TIER</Text>
                </View>
                <View style={styles.rateBadge}>
                  <Text style={styles.rateBadgeText}>1 pt = ₦5.00</Text>
                </View>
              </View>

              <View style={styles.balanceContainer}>
                <Text style={styles.balanceLabel}>Available Balance</Text>
                <Text style={styles.balancePoints}>{points.available.toLocaleString()} pts</Text>
                <Text style={styles.balanceFiat}>≈ ₦{ngnValue} platform credit value</Text>
              </View>

              {/* Progress Bar (Goal-Gradient Effect) */}
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressTitle}>Progress to {tier.nextTierThreshold} pts</Text>
                  <Text style={styles.progressPercent}>{progressPercent}%</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                </View>
                <Text style={styles.pointsNeededText}>
                  {tier.pointsToNextTier > 0
                    ? `${tier.pointsToNextTier} points needed to reach next tier level`
                    : 'Maximum Guild status achieved!'}
                </Text>
              </View>
            </View>

            {/* Active Tier Privileges */}
            <View style={[styles.benefitsCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <Text style={[styles.sectionHeading, { color: themeColors.text }]}>Your Active Tier Benefits</Text>

              <View style={styles.benefitRow}>
                <CheckCircle2 size={18} color="#10B981" />
                <Text style={[styles.benefitText, { color: themeColors.text }]}>
                  <Text style={[styles.benefitBold, { color: isDark ? '#34D399' : '#111827' }]}>{tier.feeDiscountPercent}% discount</Text> on all
                  escrow commission fees
                </Text>
              </View>

              <View style={styles.benefitRow}>
                <CheckCircle2 size={18} color="#10B981" />
                <Text style={[styles.benefitText, { color: themeColors.text }]}>
                  <Text style={[styles.benefitBold, { color: isDark ? '#34D399' : '#111827' }]}>{tier.multiplier}x multiplier</Text> on all job
                  completion reward points
                </Text>
              </View>

              {user?.role === 'ARTISAN' && (
                <View style={styles.benefitRow}>
                  <CheckCircle2 size={18} color="#10B981" />
                  <Text style={[styles.benefitText, { color: themeColors.text }]}>
                    <Text style={[styles.benefitBold, { color: isDark ? '#34D399' : '#111827' }]}>+{tier.searchBoostPercent}% search boost</Text> in
                    homeowner discovery listings
                  </Text>
                </View>
              )}
            </View>

            {/* Artisan Spotlight Burn Action */}
            {user?.role === 'ARTISAN' && (
              <View style={[styles.boostCard, isDark && { backgroundColor: '#451A03', borderColor: '#78350F' }]}>
                <View style={styles.boostHeader}>
                  <Zap size={20} color="#F59E0B" />
                  <Text style={[styles.boostTitle, isDark && { color: '#FCD34D' }]}>Featured Directory Spotlight</Text>
                </View>
                <Text style={[styles.boostSubtitle, isDark && { color: '#FDE68A' }]}>
                  Burn 500 points to place your business at the top of client search results for 7
                  days.
                </Text>
                <TouchableOpacity
                  style={[
                    styles.boostButton,
                    points.available < 500 && styles.boostButtonDisabled,
                  ]}
                  onPress={handleBoostDirectory}
                  disabled={isBoosting || points.available < 500}
                >
                  {isBoosting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Sparkles size={16} color="#FFFFFF" />
                      <Text style={styles.boostButtonText}>
                        {points.available >= 500 ? 'Burn 500 Points for 7-Day Boost' : 'Need 500 Pts'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : activeTab === 'SHARE_CARD' ? (
          /* TAB 2: SHARE & DIGITAL PROFILE CARD */
          <View>
            {/* Minimalist Dual-Tone Profile Card Display */}
            <View style={styles.cardPreviewContainer}>
              <ViewShot ref={screenCardRef} options={{ format: 'png', quality: 1 }}>
                <ProfileCardView
                  user={user}
                  referralCode={referral.code}
                  shareUrl={referral.shareUrl}
                  selectedColor={previewColor}
                  selectedPattern={previewPattern}
                  cardWidth={Math.min(SCREEN_WIDTH - 64, 305)}
                />
              </ViewShot>
            </View>

            {/* Quick Palette Customizer Bar */}
            <View style={[styles.quickCustomizer, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <Text style={[styles.quickCustomizerLabel, { color: themeColors.textMuted }]}>THEME COLOR</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickSwatchRow}
              >
                {CARD_COLORS.map((c) => {
                  const isSelected = previewColor.id === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.quickColorSwatch,
                        { backgroundColor: c.hex },
                        isSelected && styles.quickColorSwatchActive,
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setPreviewColor(c);
                      }}
                      activeOpacity={0.8}
                    >
                      {isSelected && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={[styles.quickCustomizerLabel, { color: themeColors.textMuted, marginTop: 10 }]}>BACKGROUND PATTERN</Text>
              <View style={styles.quickPatternRow}>
                {CARD_PATTERNS.map((p) => {
                  const isSelected = previewPattern === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.quickPatternPill,
                        { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border },
                        isSelected && {
                          backgroundColor: previewColor.hex,
                          borderColor: previewColor.hex,
                        },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setPreviewPattern(p.id);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.quickPatternText,
                          { color: themeColors.text },
                          isSelected && { color: '#FFFFFF' },
                        ]}
                      >
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Direct Image Download & Share Action Buttons */}
            <View style={styles.screenCardActions}>
              <TouchableOpacity
                style={[
                  styles.screenCardBtn,
                  styles.screenSaveBtn,
                  isDark && { backgroundColor: '#064E3B', borderColor: '#059669' },
                ]}
                onPress={handleSaveCardDirect}
                disabled={isExporting}
                activeOpacity={0.8}
              >
                {isExporting && exportType === 'SAVE' ? (
                  <ActivityIndicator size="small" color={isDark ? '#A7F3D0' : '#1A4731'} />
                ) : (
                  <>
                    <Download size={18} color={isDark ? '#A7F3D0' : '#1A4731'} />
                    <Text style={[styles.screenSaveBtnText, isDark && { color: '#A7F3D0' }]}>Save to Photos</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.screenCardBtn,
                  styles.screenShareBtn,
                  { backgroundColor: previewColor.hex },
                ]}
                onPress={handleShareCardDirect}
                disabled={isExporting}
                activeOpacity={0.8}
              >
                {isExporting && exportType === 'SHARE' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Share2 size={18} color="#FFFFFF" />
                    <Text style={styles.screenShareBtnText}>Share Card</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {onScanQr && (
              <TouchableOpacity
                style={[
                  styles.exportCardBtn,
                  { marginTop: 6 },
                  isDark
                    ? { backgroundColor: '#064E3B', borderColor: '#059669' }
                    : { backgroundColor: '#ECFDF5', borderColor: '#10B981' },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onScanQr();
                }}
                activeOpacity={0.8}
              >
                <QrCode size={18} color={isDark ? '#34D399' : '#059669'} />
                <Text style={[styles.exportCardBtnText, { color: isDark ? '#34D399' : '#059669' }]}>Scan a Friend's Profile / Job QR</Text>
              </TouchableOpacity>
            )}

            {/* Referral Sharing Action Box */}

            <View style={[styles.shareActionCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <Text style={[styles.shareTitle, { color: themeColors.text }]}>Give 150 Points, Get 250 Points</Text>
              <Text style={[styles.shareSub, { color: themeColors.textMuted }]}>
                Share your unique code with clients or fellow artisans. Both parties earn reward points
                when they complete their first verified job.
              </Text>

              {/* Code Copy Field */}
              <View style={[styles.codeField, { backgroundColor: themeColors.surfaceSubtle }]}>
                <Text style={[styles.codeDisplay, { color: isDark ? '#34D399' : '#1A4731' }]}>{referral.code || 'FIX-ARTISAN'}</Text>
                <TouchableOpacity style={styles.copyBtn} onPress={handleCopyCode} activeOpacity={0.7}>
                  <Copy size={16} color="#FFFFFF" />
                  <Text style={styles.copyBtnText}>Copy</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.shareBtn}
                onPress={handleNativeShare}
                activeOpacity={0.8}
              >
                <Share2 size={18} color="#FFFFFF" />
                <Text style={styles.shareBtnText}>Share Invite via WhatsApp / SMS</Text>
              </TouchableOpacity>
            </View>

            {/* Funnel Metrics */}
            <View style={[styles.funnelCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <View style={styles.funnelItem}>
                <Text style={[styles.funnelNumber, { color: isDark ? '#34D399' : '#1A4731' }]}>{referral.totalInvited}</Text>
                <Text style={[styles.funnelLabel, { color: themeColors.textMuted }]}>Invited</Text>
              </View>
              <View style={[styles.funnelDivider, { backgroundColor: themeColors.border }]} />
              <View style={styles.funnelItem}>
                <Text style={[styles.funnelNumber, { color: isDark ? '#34D399' : '#1A4731' }]}>{referral.totalQualified}</Text>
                <Text style={[styles.funnelLabel, { color: themeColors.textMuted }]}>Completed</Text>
              </View>
              <View style={[styles.funnelDivider, { backgroundColor: themeColors.border }]} />
              <View style={styles.funnelItem}>
                <Text style={[styles.funnelNumber, { color: isDark ? '#34D399' : '#1A4731' }]}>{referral.pendingBonusPoints}</Text>
                <Text style={[styles.funnelLabel, { color: themeColors.textMuted }]}>Pending Pts</Text>
              </View>
            </View>

            {/* Referral Friends & Real-time Activity Feed */}
            <View style={styles.activitySection}>
              <View style={styles.activityHeaderRow}>
                <Text style={[styles.activitySectionTitle, { color: themeColors.text }]}>Friends Joined via Your Code</Text>
                <Text style={[styles.activityValueNote, isDark && { backgroundColor: '#064E3B', color: '#34D399' }]}>
                  1 pt = ₦5.00
                </Text>
              </View>

              {isActivityLoading ? (
                <ActivityIndicator size="small" color={themeColors.primary} style={{ marginVertical: 18 }} />
              ) : activityItems.length === 0 ? (
                <View style={[styles.activityEmptyWrap, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                  <Users size={32} color={themeColors.textMuted} />
                  <Text style={[styles.activityEmptyTitle, { color: themeColors.text }]}>No Friends Joined Yet</Text>
                  <Text style={[styles.activityEmptySub, { color: themeColors.textMuted }]}>
                    Share your card or code above with clients or artisans. When someone registers, their status will show up here!
                  </Text>
                </View>
              ) : (
                activityItems.map((item) => {
                  const isQualified = item.status === 'REWARD_DISBURSED';
                  return (
                    <View key={item.id} style={[styles.activityItemCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                      <View style={styles.activityAvatarCircle}>
                        <Text style={styles.activityAvatarText}>
                          {(item.refereeName || 'M').slice(0, 2).toUpperCase()}
                        </Text>
                      </View>

                      <View style={styles.activityInfoCol}>
                        <View style={styles.activityNameRow}>
                          <Text style={[styles.activityItemName, { color: themeColors.text }]}>{item.refereeName}</Text>
                          <Text style={styles.activityRoleBadge}>
                            {item.role === 'ARTISAN' ? 'Artisan' : 'Client'}
                          </Text>
                        </View>
                        <Text style={[styles.activityItemDate, { color: themeColors.textMuted }]}>
                          Joined {new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </Text>
                      </View>

                      <View style={styles.activityRewardCol}>
                        {isQualified ? (
                          <>
                            <Text style={styles.activityRewardEarned}>+250 pts</Text>
                            <Text style={styles.activityNairaEarned}>+₦1,250</Text>
                          </>
                        ) : (
                          <>
                            <View style={styles.pendingPill}>
                              <Text style={styles.pendingPillText}>1st Job Pending</Text>
                            </View>
                            <Text style={styles.pendingPointsHint}>+250 pts on finish</Text>
                          </>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        ) : (
          /* TAB 3: LEDGER HISTORY */
          <View>
            <Text style={[styles.sectionHeading, { color: themeColors.text }]}>Transaction Journal</Text>
            {isLedgerLoading ? (
              <ActivityIndicator size="small" color={themeColors.primary} style={{ marginTop: 20 }} />
            ) : ledgerItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Clock size={36} color={themeColors.textMuted} />
                <Text style={[styles.emptyStateTitle, { color: themeColors.text }]}>No Point Transactions Yet</Text>
                <Text style={[styles.emptyStateSub, { color: themeColors.textMuted }]}>
                  Complete your first job or invite friends to start earning reward points.
                </Text>
              </View>
            ) : (
              ledgerItems.map((entry) => {
                const isCredit = entry.amount > 0;
                return (
                  <View key={entry.id} style={[styles.ledgerItem, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                    <View style={styles.ledgerLeft}>
                      <Text style={[styles.ledgerDescription, { color: themeColors.text }]}>{entry.description}</Text>
                      <Text style={[styles.ledgerDate, { color: themeColors.textMuted }]}>
                        {new Date(entry.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.amountPill,
                        isCredit ? styles.amountPillCredit : styles.amountPillDebit,
                      ]}
                    >
                      <Text
                        style={[
                          styles.amountPillText,
                          isCredit ? styles.amountCreditText : styles.amountDebitText,
                        ]}
                      >
                        {isCredit ? `+${entry.amount}` : entry.amount} pts
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Shareable Profile Card Export Modal */}
      <ShareableProfileCardModal
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
        user={user}
        referralCode={referral.code}
        shareUrl={referral.shareUrl}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F7F4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#1A4731',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabButtonTextActive: {
    color: '#1A4731',
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  heroCard: {
    backgroundColor: '#1A4731',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#123424',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  tierPillText: {
    color: '#F59E0B',
    fontWeight: '700',
    fontSize: 12,
  },
  rateBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  rateBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  balanceContainer: {
    marginTop: spacing.md,
  },
  balanceLabel: {
    color: '#A7F3D0',
    fontSize: 13,
    fontWeight: '500',
  },
  balancePoints: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    marginTop: 4,
  },
  balanceFiat: {
    color: '#E5E7EB',
    fontSize: 13,
    marginTop: 4,
  },
  progressSection: {
    marginTop: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressTitle: {
    color: '#D1FAE5',
    fontSize: 12,
  },
  progressPercent: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#123424',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  pointsNeededText: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 6,
  },
  benefitsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  benefitText: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
  },
  benefitBold: {
    fontWeight: '700',
    color: '#111827',
  },
  boostCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: spacing.md,
  },
  boostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  boostTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
  },
  boostSubtitle: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 16,
    marginBottom: 12,
  },
  boostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1A4731',
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  boostButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  boostButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  cardPreviewContainer: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  quickCustomizer: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickCustomizerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  quickSwatchRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  quickColorSwatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  quickColorSwatchActive: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  quickPatternRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickPatternPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickPatternText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  exportCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#10B981',
    paddingVertical: 12,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  exportCardBtnText: {
    color: '#1A4731',
    fontSize: 14,
    fontWeight: '700',
  },
  screenCardActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: spacing.md,
  },
  screenCardBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  screenSaveBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  screenSaveBtnText: {
    color: '#1A4731',
    fontWeight: '700',
    fontSize: 13,
  },
  screenShareBtn: {
    backgroundColor: '#1A4731',
  },
  screenShareBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  shareActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: spacing.md,
  },
  shareTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  shareSub: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 14,
  },
  codeField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  codeDisplay: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#1A4731',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1A4731',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  funnelCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  funnelItem: {
    flex: 1,
    alignItems: 'center',
  },
  funnelNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A4731',
  },
  funnelLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  funnelDivider: {
    width: 1,
    height: '70%',
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
  },
  ledgerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ledgerLeft: {
    flex: 1,
    marginRight: 10,
  },
  ledgerDescription: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  ledgerDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 3,
  },
  amountPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  amountPillCredit: {
    backgroundColor: '#ECFDF5',
  },
  amountPillDebit: {
    backgroundColor: '#FEE2E2',
  },
  amountPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  amountCreditText: {
    color: '#059669',
  },
  amountDebitText: {
    color: '#DC2626',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginTop: 10,
  },
  emptyStateSub: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  activitySection: {
    marginTop: 18,
    marginBottom: 24,
  },
  activityHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  activitySectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  activityValueNote: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  activityEmptyWrap: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activityEmptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginTop: 8,
  },
  activityEmptySub: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  activityItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activityAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1A4731',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  activityAvatarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  activityInfoCol: {
    flex: 1,
  },
  activityNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activityItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  activityRoleBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: '#065F46',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  activityItemDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  activityRewardCol: {
    alignItems: 'flex-end',
  },
  activityRewardEarned: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
  activityNairaEarned: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  pendingPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  pendingPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  pendingPointsHint: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
