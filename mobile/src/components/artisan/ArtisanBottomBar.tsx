import React, { useMemo, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Circle,
  Rect,
  G,
  Line,
} from 'react-native-svg';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

export type ArtisanTabKey =
  | 'ARTISAN_PROFILE'
  | 'ARTISAN_WALLET'
  | 'ARTISAN_COCKPIT'
  | 'ARTISAN_ACTIVE'
  | 'ARTISAN_CHAT';

interface ArtisanBottomBarProps {
  currentScreen: string;
  onTabPress: (screen: any) => void;
  unreadCount?: number;
}

/**
 * Exact Vector Icons for Artisan Bottom Navigation
 * Following reference image: Profile | Earnings | Radar/Jobs | My Tasks | Messages
 */

// Tab 1: Profile
const ProfileIcon = ({ active }: { active: boolean }) => {
  const color = active ? '#0D3F2E' : '#2D3E4E';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth={2} />
      <Path
        d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Tab 2: Earnings
const EarningsIcon = ({ active }: { active: boolean }) => {
  const color = active ? '#0D3F2E' : '#2D3E4E';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      {/* Wallet Body */}
      <Path
        d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Curved Pouch/Flap */}
      <Path
        d="M16 8h5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Snap Clasp Dot */}
      <Circle cx="18" cy="12" r="1.2" fill={color} />
    </Svg>
  );
};

// Tab 3 (Center Hero Button): Radar Scanner Art
const RadarScannerArt = () => {
  return (
    <Svg width={28} height={26} viewBox="0 0 28 26">
      <G transform="translate(14, 12)">
        {/* Outer scanner ring */}
        <Circle cx={0} cy={0} r={9} fill="none" stroke="#FFFFFF" strokeWidth={1.8} />
        {/* Inner scanner ring */}
        <Circle cx={0} cy={0} r={4.6} fill="none" stroke="#FFFFFF" strokeWidth={1.6} />
        {/* Center pivot dot */}
        <Circle cx={0} cy={0} r={1.6} fill="#FFFFFF" />
        {/* 45-degree scanner sweep ray */}
        <Line
          x1={0}
          y1={0}
          x2={6.5}
          y2={-6.5}
          stroke="#FFFFFF"
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
};

// Tab 4: My Tasks (Clipboard with Checkmark)
const MyTasksIcon = ({ active }: { active: boolean }) => {
  const color = active ? '#0D3F2E' : '#2D3E4E';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      {/* Board */}
      <Rect
        x="4"
        y="4"
        width="16"
        height="17"
        rx="3"
        stroke={color}
        strokeWidth={2}
      />
      {/* Top Clip */}
      <Path
        d="M9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
        fill={active ? '#E8F8F2' : '#FFFFFF'}
      />
      {/* Checkmark */}
      <Path
        d="M8.5 13l2.5 2.5 5-5"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Tab 5: Messages (Speech Bubble)
const MessagesIcon = ({ active }: { active: boolean }) => {
  const color = active ? '#0D3F2E' : '#2D3E4E';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-2.9-.4-4.1-1.1L3 20l1.2-4.2A8.5 8.5 0 1 1 20 11.5z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const ArtisanBottomBar: React.FC<ArtisanBottomBarProps> = ({
  currentScreen,
  onTabPress,
  unreadCount = 1,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const insets = useContext(SafeAreaInsetsContext);

  // Full-width docked bar dimensions
  const barWidth = windowWidth;
  const barHeight = 64; // Standard bottom navigation bar height
  const crestRise = 20; // Height of center contour hump
  const safeBottom = Math.max(insets?.bottom ?? 0, Platform.OS === 'ios' ? 16 : 8);
  const totalBarHeight = barHeight + crestRise + safeBottom;
  const layoutHeight = barHeight + safeBottom;

  const isTabActive = (tab: ArtisanTabKey) => {
    if (tab === 'ARTISAN_PROFILE') {
      return (
        currentScreen === 'ARTISAN_PROFILE' ||
        currentScreen === 'ARTISAN_PORTFOLIO' ||
        currentScreen === 'ARTISAN_KYC' ||
        currentScreen === 'ARTISAN_REVIEWS' ||
        currentScreen === 'ARTISAN_SETTINGS'
      );
    }
    if (tab === 'ARTISAN_WALLET') {
      return (
        currentScreen === 'ARTISAN_WALLET' ||
        currentScreen === 'ARTISAN_PROPOSALS'
      );
    }
    if (tab === 'ARTISAN_COCKPIT') {
      return (
        currentScreen === 'ARTISAN_COCKPIT' ||
        currentScreen === 'ARTISAN_INCOMING' ||
        currentScreen === 'ARTISAN_MARKETPLACE' ||
        currentScreen === 'ARTISAN_BID' ||
        currentScreen === 'ARTISAN_SAVED'
      );
    }
    if (tab === 'ARTISAN_ACTIVE') {
      return (
        currentScreen === 'ARTISAN_ACTIVE' ||
        currentScreen === 'ARTISAN_PROOF' ||
        currentScreen === 'ARTISAN_CONTRACTS' ||
        currentScreen === 'ARTISAN_DISPUTE'
      );
    }
    if (tab === 'ARTISAN_CHAT') {
      return (
        currentScreen === 'ARTISAN_CHAT' ||
        currentScreen === 'ARTISAN_CHAT_THREAD'
      );
    }
    return false;
  };

  // Full-width background fill and top border stroke with center contour hump
  const { fillPath, strokePath } = useMemo(() => {
    const W = barWidth;
    const Cx = W / 2;
    const crestWidth = 100;
    const xStart = Cx - crestWidth / 2;
    const xEnd = Cx + crestWidth / 2;
    const yTop = crestRise; // Where flat top edge runs (y = 20)
    const yBot = totalBarHeight; // Screen bottom
    const yPeak = 2; // Peak of the center dome curve

    const cp1x = xStart + 22;
    const cp2x = Cx - 24;
    const cp3x = Cx + 24;
    const cp4x = xEnd - 22;

    const fill = `
      M 0 ${yTop}
      L ${xStart} ${yTop}
      C ${cp1x} ${yTop}, ${cp2x} ${yPeak}, ${Cx} ${yPeak}
      C ${cp3x} ${yPeak}, ${cp4x} ${yTop}, ${xEnd} ${yTop}
      L ${W} ${yTop}
      L ${W} ${yBot}
      L 0 ${yBot}
      Z
    `.trim();

    const stroke = `
      M 0 ${yTop}
      L ${xStart} ${yTop}
      C ${cp1x} ${yTop}, ${cp2x} ${yPeak}, ${Cx} ${yPeak}
      C ${cp3x} ${yPeak}, ${cp4x} ${yTop}, ${xEnd} ${yTop}
      L ${W} ${yTop}
    `.trim();

    return { fillPath: fill, strokePath: stroke };
  }, [barWidth, crestRise, totalBarHeight]);

  const handlePress = (tab: ArtisanTabKey) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onTabPress(tab);
  };

  const handleHeroPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    onTabPress('ARTISAN_COCKPIT');
  };

  return (
    <View style={[styles.dockContainer, { height: layoutHeight }]}>
      {/* Background SVG with contoured hump, top border and bottom safe area fill */}
      <Svg
        width={barWidth}
        height={totalBarHeight}
        viewBox={`0 0 ${barWidth} ${totalBarHeight}`}
        style={[styles.svgBackground, { top: -crestRise, height: totalBarHeight }]}
      >
        <Defs>
          {/* Center Radar Emerald Gradient */}
          <LinearGradient id="dockRadarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#059669" />
            <Stop offset="45%" stopColor="#047857" />
            <Stop offset="100%" stopColor="#023A26" />
          </LinearGradient>

          {/* Radar Button Mint Radial Glow */}
          <RadialGradient
            id="dockRadarGlow"
            cx="50%"
            cy="50%"
            rx="50%"
            ry="50%"
            fx="50%"
            fy="50%"
          >
            <Stop offset="55%" stopColor="#10B981" stopOpacity={0.28} />
            <Stop offset="100%" stopColor="#10B981" stopOpacity={0} />
          </RadialGradient>

          {/* Top Glass Gloss Reflection */}
          <LinearGradient id="dockGlassGloss" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.28} />
            <Stop offset="65%" stopColor="#FFFFFF" stopOpacity={0.05} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {/* Crisp white solid body filling down to bottom edge */}
        <Path d={fillPath} fill="#FFFFFF" />

        {/* Continuous crisp top border contour */}
        <Path
          d={strokePath}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={1}
        />

        {/* Ambient Halo Glow behind center button */}
        <Circle
          cx={barWidth / 2}
          cy={crestRise + barHeight / 2 - 2}
          r={38}
          fill="url(#dockRadarGlow)"
        />
      </Svg>

      {/* 5-Item Navigation Row Overlay */}
      <View style={[styles.itemsRow, { top: 0, height: barHeight }]}>
        {/* Tab 1: Profile */}
        <View style={styles.tabSlot}>
          <TouchableOpacity
            onPress={() => handlePress('ARTISAN_PROFILE')}
            style={[
              styles.tabTouch,
              isTabActive('ARTISAN_PROFILE') && styles.activePill,
            ]}
            activeOpacity={0.75}
          >
            <ProfileIcon active={isTabActive('ARTISAN_PROFILE')} />
            <Text
              style={[
                styles.tabLabel,
                isTabActive('ARTISAN_PROFILE')
                  ? styles.activeTabLabel
                  : styles.inactiveTabLabel,
              ]}
            >
              Profile
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 2: Earnings */}
        <View style={styles.tabSlot}>
          <TouchableOpacity
            onPress={() => handlePress('ARTISAN_WALLET')}
            style={[
              styles.tabTouch,
              isTabActive('ARTISAN_WALLET') && styles.activePill,
            ]}
            activeOpacity={0.75}
          >
            <EarningsIcon active={isTabActive('ARTISAN_WALLET')} />
            <Text
              style={[
                styles.tabLabel,
                isTabActive('ARTISAN_WALLET')
                  ? styles.activeTabLabel
                  : styles.inactiveTabLabel,
              ]}
            >
              Earnings
            </Text>
          </TouchableOpacity>
        </View>

        {/* Center Tab: Radar/Jobs Hero Button */}
        <View style={styles.centerSlot}>
          <TouchableOpacity
            onPress={handleHeroPress}
            style={styles.heroButton}
            activeOpacity={0.85}
          >
            {/* Emerald gradient circular background with gloss */}
            <Svg
              width={58}
              height={58}
              viewBox="0 0 58 58"
              style={StyleSheet.absoluteFill}
            >
              <Circle
                cx={29}
                cy={29}
                r={28}
                fill="url(#dockRadarGrad)"
                stroke="#10B981"
                strokeWidth={1}
                strokeOpacity={0.4}
              />
              {/* Gloss Arch Reflection */}
              <Path
                d="M 12 18 C 16 10, 42 10, 46 18 C 41 24, 17 24, 12 18 Z"
                fill="url(#dockGlassGloss)"
              />
            </Svg>

            {/* Radar scanner icon & internal typography */}
            <View style={styles.heroContent}>
              <RadarScannerArt />
              <Text style={styles.heroLabel}>Radar/Jobs</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Tab 4: My Tasks */}
        <View style={styles.tabSlot}>
          <TouchableOpacity
            onPress={() => handlePress('ARTISAN_ACTIVE')}
            style={[
              styles.tabTouch,
              isTabActive('ARTISAN_ACTIVE') && styles.activePill,
            ]}
            activeOpacity={0.75}
          >
            <MyTasksIcon active={isTabActive('ARTISAN_ACTIVE')} />
            <Text
              style={[
                styles.tabLabel,
                isTabActive('ARTISAN_ACTIVE')
                  ? styles.activeTabLabel
                  : styles.inactiveTabLabel,
              ]}
            >
              My Tasks
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 5: Messages */}
        <View style={styles.tabSlot}>
          <TouchableOpacity
            onPress={() => handlePress('ARTISAN_CHAT')}
            style={[
              styles.tabTouch,
              isTabActive('ARTISAN_CHAT') && styles.activePill,
            ]}
            activeOpacity={0.75}
          >
            <View style={styles.badgeAnchor}>
              <MessagesIcon active={isTabActive('ARTISAN_CHAT')} />
              {unreadCount > 0 && (
                <View style={styles.badgeCircle}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.tabLabel,
                isTabActive('ARTISAN_CHAT')
                  ? styles.activeTabLabel
                  : styles.inactiveTabLabel,
              ]}
            >
              Messages
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dockContainer: {
    width: '100%',
    overflow: 'visible',
    zIndex: 999,
    // Subtle top ambient shadow for full-width dock
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  svgBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  itemsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  tabSlot: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSlot: {
    width: 68,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    overflow: 'visible',
  },
  tabTouch: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 24,
    minWidth: 64,
  },
  activePill: {
    backgroundColor: '#E8F8F2', // Soft pastel mint from reference image
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 26,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 3,
    letterSpacing: -0.2,
  },
  activeTabLabel: {
    color: '#0D3F2E', // Deep forest green
    fontWeight: '700',
  },
  inactiveTabLabel: {
    color: '#2D3E4E', // Slate / dark grayish-teal from reference image
    fontWeight: '600',
  },
  badgeAnchor: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCircle: {
    position: 'absolute',
    top: -4,
    right: -7,
    backgroundColor: '#064E3B', // Exact deep emerald badge
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
  },
  heroButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    // Elevate so it nestles inside the center hump contour
    transform: [{ translateY: -14 }],
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  heroContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 1,
  },
  heroLabel: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginTop: -1,
  },
});

export default ArtisanBottomBar;

