import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Svg, { Defs, Pattern, Line, Circle, Rect } from 'react-native-svg';
import { Check, Star } from 'lucide-react-native';

export interface CardColorOption {
  id: string;
  name: string;
  hex: string;
}

export const CARD_COLORS: CardColorOption[] = [
  { id: 'forest', name: 'Forest Green', hex: '#1A4731' },
  { id: 'obsidian', name: 'Obsidian', hex: '#0F172A' },
  { id: 'navy', name: 'Royal Navy', hex: '#1E3A8A' },
  { id: 'emerald', name: 'Deep Emerald', hex: '#065F46' },
  { id: 'wine', name: 'Rich Wine', hex: '#701A75' },
  { id: 'terracotta', name: 'Terracotta', hex: '#9A3412' },
];

export type CardPatternId = 'solid' | 'grid' | 'dots' | 'diagonal' | 'rings';

export const CARD_PATTERNS: { id: CardPatternId; name: string }[] = [
  { id: 'solid', name: 'Solid' },
  { id: 'grid', name: 'Grid' },
  { id: 'dots', name: 'Dots' },
  { id: 'diagonal', name: 'Lines' },
  { id: 'rings', name: 'Rings' },
];

export interface ProfileCardViewProps {
  user: any;
  referralCode?: string;
  shareUrl?: string;
  selectedColor?: CardColorOption;
  selectedPattern?: CardPatternId;
  cardWidth?: number;
  actionText?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ProfileCardView: React.FC<ProfileCardViewProps> = ({
  user,
  referralCode = 'ARTIFIX',
  shareUrl,
  selectedColor = CARD_COLORS[0],
  selectedPattern = 'solid',
  cardWidth = Math.min(SCREEN_WIDTH - 64, 300),
  actionText = 'Scan to hire on Artifix',
}) => {
  const cardHeight = Math.round(cardWidth * 1.48);

  const isArtisan = user?.role === 'ARTISAN';
  const displayName = isArtisan
    ? user?.artisanProfile?.businessName || user?.artisanProfile?.title || 'Master Artisan'
    : user?.clientProfile?.firstName
    ? `${user.clientProfile.firstName} ${user.clientProfile.lastName || ''}`.trim()
    : 'Artifix Member';

  const tradeTitle = isArtisan
    ? user?.artisanProfile?.trade || 'Verified Professional'
    : 'Verified Client';

  const rating = Number(user?.artisanProfile?.ratingAvg || 4.9).toFixed(1);

  const avatarUrl =
    user?.avatarUrl ||
    user?.artisanProfile?.avatarUrl ||
    user?.clientProfile?.avatarUrl ||
    user?.avatar ||
    null;

  // Render SVG pattern overlay on the outer card shell
  const renderPattern = () => {
    switch (selectedPattern) {
      case 'grid':
        return (
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              <Pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                <Line x1="0" y1="0" x2="20" y2="0" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
                <Line x1="0" y1="0" x2="0" y2="20" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#gridPattern)" />
          </Svg>
        );
      case 'dots':
        return (
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              <Pattern id="dotsPattern" width="18" height="18" patternUnits="userSpaceOnUse">
                <Circle cx="9" cy="9" r="1.5" fill="rgba(255,255,255,0.2)" />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#dotsPattern)" />
          </Svg>
        );
      case 'diagonal':
        return (
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              <Pattern id="diagPattern" width="16" height="16" patternUnits="userSpaceOnUse">
                <Line x1="0" y1="16" x2="16" y2="0" stroke="rgba(255,255,255,0.16)" strokeWidth="1.2" />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#diagPattern)" />
          </Svg>
        );
      case 'rings':
        return (
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            <Circle cx={cardWidth} cy="0" r={cardWidth * 0.4} stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" fill="none" />
            <Circle cx={cardWidth} cy="0" r={cardWidth * 0.7} stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" fill="none" />
            <Circle cx={cardWidth} cy="0" r={cardWidth * 1.0} stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" fill="none" />
            <Circle cx="0" cy={cardHeight} r={cardWidth * 0.5} stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" fill="none" />
          </Svg>
        );
      case 'solid':
      default:
        return null;
    }
  };

  const qrSize = Math.max(110, Math.round(cardWidth * 0.43));
  const avatarSize = Math.max(74, Math.round(cardWidth * 0.28));

  return (
    <View
      style={[
        styles.cardOuter,
        {
          width: cardWidth,
          height: cardHeight,
          backgroundColor: selectedColor.hex,
        },
      ]}
    >
      {/* Outer Pattern Layer */}
      {renderPattern()}

      {/* Top Arch Spacing for Floating Avatar */}
      <View style={styles.topArchSpace} />

      {/* Inner White Body (Rounded Card) */}
      <View style={styles.cardInnerWhite}>
        {/* Centered Avatar Overlapping Arch */}
        <View
          style={[
            styles.avatarPod,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              top: -(avatarSize / 2),
            },
          ]}
        >
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={[styles.avatarImage, { borderRadius: avatarSize / 2 }]}
            />
          ) : (
            <View
              style={[
                styles.avatarFallback,
                {
                  backgroundColor: selectedColor.hex,
                  borderRadius: avatarSize / 2,
                },
              ]}
            >
              <Text style={styles.avatarInitials}>
                {displayName.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}

          {/* Emerald Verified Badge */}
          <View style={styles.verifiedBadge}>
            <Check size={13} color="#FFFFFF" strokeWidth={3} />
          </View>
        </View>

        {/* Core Profile Details */}
        <Text style={styles.artisanName} numberOfLines={1}>
          {displayName}
        </Text>
        <Text
          style={[styles.artisanTrade, { color: selectedColor.hex }]}
          numberOfLines={1}
        >
          {tradeTitle}
        </Text>
        <View style={styles.ratingRow}>
          <Text style={[styles.ratingNumber, { color: selectedColor.hex }]}>
            {rating}
          </Text>
          <Star size={13} color="#F59E0B" fill="#F59E0B" />
        </View>

        {/* High-Contrast Centered QR Pod */}
        <View style={styles.qrContainer}>
          <QRCode
            value={shareUrl || `https://artisan.ng/join?ref=${referralCode}`}
            size={qrSize}
            color="#111827"
            backgroundColor="#FFFFFF"
          />
        </View>

        {/* Clean Minimalist Footer Callout */}
        <Text style={styles.scanCallout}>{actionText}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardOuter: {
    borderRadius: 36,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 8,
  },
  topArchSpace: {
    height: 65,
  },
  cardInnerWhite: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    marginHorizontal: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 46,
    paddingBottom: 16,
    alignItems: 'center',
    position: 'relative',
  },
  avatarPod: {
    position: 'absolute',
    alignSelf: 'center',
    borderWidth: 3.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 24,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#10B981',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artisanName: {
    color: '#111827',
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  artisanTrade: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 3,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingNumber: {
    fontSize: 13,
    fontWeight: '700',
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D1FAE5',
    padding: 10,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  scanCallout: {
    color: '#4B5563',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 10,
    textAlign: 'center',
  },
});
