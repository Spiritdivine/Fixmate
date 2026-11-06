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
  Circle,
  Rect,
} from 'react-native-svg';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme';

export type ClientTabKey =
  | 'CLIENT_HOME'
  | 'CLIENT_MY_JOBS'
  | 'CLIENT_OGA_JOHN'
  | 'CLIENT_CHAT'
  | 'CLIENT_WALLET';

interface ClientBottomBarProps {
  currentScreen: string;
  onTabPress: (screen: any) => void;
  unreadCount?: number;
}

/**
 * Exact vector icons extracted from the design specification
 */
const HomeIcon = ({ active, isDark }: { active: boolean; isDark?: boolean }) => {
  const color = active ? (isDark ? '#34D399' : '#0D3F2E') : (isDark ? '#9CA3AF' : '#2D3E4E');
  if (active) {
    // Solid / Filled silhouette with arched doorway cutout
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill={color}>
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2.5L2.5 10.5C2.1 10.8 1.9 11.3 2.1 11.8C2.3 12.3 2.7 12.6 3.2 12.6H4V20C4 20.8 4.7 21.5 5.5 21.5H9C9.6 21.5 10 21.1 10 20.5V15.5C10 14.4 10.9 13.5 12 13.5C13.1 13.5 14 14.4 14 15.5V20.5C14 21.1 14.4 21.5 15 21.5H18.5C19.3 21.5 20 20.8 20 20V12.6H20.8C21.3 12.6 21.7 12.3 21.9 11.8C22.1 11.3 21.9 10.8 21.5 10.5L12 2.5Z"
        />
      </Svg>
    );
  }
  return (
    <Svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M3 10.5L12 3L21 10.5V20C21 20.6 20.6 21 20 21H15V15.5C15 14.7 14.3 14 13.5 14H10.5C9.7 14 9 14.7 9 15.5V21H4C3.4 21 3 20.6 3 20V10.5Z" />
    </Svg>
  );
};

const JobsIcon = ({ active, isDark }: { active: boolean; isDark?: boolean }) => {
  const color = active ? (isDark ? '#34D399' : '#0D3F2E') : (isDark ? '#9CA3AF' : '#2D3E4E');
  return (
    <Svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Briefcase Handle */}
      <Path d="M8.5 6V4C8.5 3.4 9 3 9.6 3H14.4C15 3 15.5 3.4 15.5 4V6" />
      {/* Body */}
      <Rect x="2.5" y="6" width="19" height="14" rx="3" />
      {/* Seam line */}
      <Path d="M2.5 12H21.5" />
      {/* Center clasp */}
      <Rect x="10" y="10.5" width="4" height="3.5" rx="0.75" />
    </Svg>
  );
};

const MessagesIcon = ({ active, isDark }: { active: boolean; isDark?: boolean }) => {
  const color = active ? (isDark ? '#34D399' : '#0D3F2E') : (isDark ? '#9CA3AF' : '#2D3E4E');
  return (
    <Svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M19 4H5C3.9 4 3 4.9 3 6V15C3 16.1 3.9 17 5 17H6.5V20.5L10.5 17H19C20.1 17 21 16.1 21 15V6C21 4.9 20.1 4 19 4Z" />
    </Svg>
  );
};

const WalletIcon = ({ active, isDark }: { active: boolean; isDark?: boolean }) => {
  const color = active ? (isDark ? '#34D399' : '#0D3F2E') : (isDark ? '#9CA3AF' : '#2D3E4E');
  return (
    <Svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Wallet body */}
      <Path d="M3 8V18.5C3 19.9 4.1 21 5.5 21H18.5C19.9 21 21 19.9 21 18.5V8.5" />
      {/* Curved top flap */}
      <Path d="M3 9.5L16 5.5C17.5 5 19.5 5.8 20.5 7.2L21 8" />
      {/* Side clasp tab */}
      <Path d="M16 11H20.5C21.3 11 22 11.7 22 12.5V15.5C22 16.3 21.3 17 20.5 17H16V11Z" />
      <Circle cx="18.5" cy="14" r="1.2" fill={color} />
    </Svg>
  );
};

/**
 * High-precision Brain AI Icon matching the reference image emblem
 */
const BrainAiIcon = () => {
  return (
    <Svg
      width={36}
      height={36}
      viewBox="0 0 40 40"
      fill="none"
      stroke="#FFFFFF"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Left hemisphere outer lobes */}
      <Path
        d="M 19 9.5 C 17 5.5, 11 5, 8.5 8.5 C 5 12.5, 4 17, 7 20.5 C 3 23, 3 29, 6.5 32 C 4.5 35, 7.5 38.5, 12 37.5"
        strokeWidth={1.9}
      />
      {/* Left hemisphere inner sulci */}
      <Path d="M 8.5 8.5 C 10.5 11, 14 11, 15 14" strokeWidth={1.7} />
      <Path d="M 7 20.5 C 10.5 21.5, 13 24, 12 27" strokeWidth={1.7} />
      {/* Left bottom stem and loop */}
      <Path
        d="M 14.5 33 V 36.5 C 14.5 37.8, 16.5 37.8, 16.5 36.5 V 32"
        strokeWidth={1.8}
      />

      {/* Right hemisphere outer lobes (mirror) */}
      <Path
        d="M 21 9.5 C 23 5.5, 29 5, 31.5 8.5 C 35 12.5, 36 17, 33 20.5 C 37 23, 37 29, 33.5 32 C 35.5 35, 32.5 38.5, 28 37.5"
        strokeWidth={1.9}
      />
      {/* Right hemisphere inner sulci */}
      <Path d="M 31.5 8.5 C 29.5 11, 26 11, 25 14" strokeWidth={1.7} />
      <Path d="M 33 20.5 C 29.5 21.5, 27 24, 28 27" strokeWidth={1.7} />
      {/* Right bottom stem and loop */}
      <Path
        d="M 25.5 33 V 36.5 C 25.5 37.8, 23.5 37.8, 23.5 36.5 V 32"
        strokeWidth={1.8}
      />

      {/* Center "AI" Letterforms */}
      {/* A */}
      <Path d="M 14.8 25.5 L 18 16 L 21.2 25.5" strokeWidth={2.2} />
      <Path d="M 16 22.5 H 20" strokeWidth={2} />
      {/* I */}
      <Path d="M 24.5 16 V 25.5" strokeWidth={2.2} />
    </Svg>
  );
};

export const ClientBottomBar: React.FC<ClientBottomBarProps> = ({
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

  const isTabActive = (tab: ClientTabKey) => {
    if (tab === 'CLIENT_HOME') {
      return (
        currentScreen === 'CLIENT_HOME' ||
        currentScreen === 'CLIENT_POPULAR' ||
        currentScreen === 'CLIENT_SAVED' ||
        currentScreen === 'CLIENT_NOTIFICATIONS'
      );
    }
    if (tab === 'CLIENT_MY_JOBS') {
      return (
        currentScreen === 'CLIENT_MY_JOBS' ||
        currentScreen === 'CLIENT_POST_JOB' ||
        currentScreen === 'CLIENT_PROPOSALS' ||
        currentScreen === 'CLIENT_PROPOSAL_DETAILS' ||
        currentScreen === 'CLIENT_ACCEPT_PROPOSAL' ||
        currentScreen === 'CLIENT_CONTRACTS' ||
        currentScreen === 'CLIENT_CONTRACT_DETAILS'
      );
    }
    if (tab === 'CLIENT_OGA_JOHN') {
      return currentScreen === 'CLIENT_OGA_JOHN';
    }
    if (tab === 'CLIENT_CHAT') {
      return currentScreen === 'CLIENT_CHAT' || currentScreen === 'CLIENT_CHAT_THREAD';
    }
    if (tab === 'CLIENT_WALLET') {
      return (
        currentScreen === 'CLIENT_WALLET' ||
        currentScreen === 'CLIENT_TRANSACTION_ACTIVITY' ||
        currentScreen === 'CLIENT_DISPUTE' ||
        currentScreen === 'CLIENT_DISPUTES_LIST'
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

  const handlePress = (tab: ClientTabKey) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onTabPress(tab);
  };

  const handleAiPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    onTabPress('CLIENT_OGA_JOHN');
  };

  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.dockContainer, { height: layoutHeight }]}>
      {/* Background SVG with contoured hump, top border and bottom safe area fill */}
      <Svg
        width={barWidth}
        height={totalBarHeight}
        viewBox={`0 0 ${barWidth} ${totalBarHeight}`}
        style={[styles.svgBackground, { top: -crestRise, height: totalBarHeight }]}
      >
        {/* Dynamic solid body filling down to bottom edge */}
        <Path d={fillPath} fill={isDark ? colors.bottomBarBg : '#FFFFFF'} />

        {/* Continuous crisp top border contour */}
        <Path
          d={strokePath}
          fill="none"
          stroke={isDark ? colors.bottomBarBorder : '#E5E7EB'}
          strokeWidth={1}
        />
      </Svg>

      {/* 5-Item Navigation Row Overlay */}
      <View style={[styles.itemsRow, { top: 0, height: barHeight }]}>
        {/* Tab 1: Home */}
        <View style={styles.tabSlot}>
          <TouchableOpacity
            onPress={() => handlePress('CLIENT_HOME')}
            style={[
              styles.tabTouch,
              isTabActive('CLIENT_HOME') && styles.activePill,
              isTabActive('CLIENT_HOME') && isDark && { backgroundColor: 'rgba(52, 211, 153, 0.15)' },
            ]}
            activeOpacity={0.75}
          >
            <HomeIcon active={isTabActive('CLIENT_HOME')} isDark={isDark} />
            <Text
              style={[
                styles.tabLabel,
                isTabActive('CLIENT_HOME')
                  ? (isDark ? { color: '#34D399', fontWeight: '700' } : styles.activeTabLabel)
                  : (isDark ? { color: '#9CA3AF', fontWeight: '600' } : styles.inactiveTabLabel),
              ]}
            >
              Home
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 2: My Jobs */}
        <View style={styles.tabSlot}>
          <TouchableOpacity
            onPress={() => handlePress('CLIENT_MY_JOBS')}
            style={[
              styles.tabTouch,
              isTabActive('CLIENT_MY_JOBS') && styles.activePill,
              isTabActive('CLIENT_MY_JOBS') && isDark && { backgroundColor: 'rgba(52, 211, 153, 0.15)' },
            ]}
            activeOpacity={0.75}
          >
            <JobsIcon active={isTabActive('CLIENT_MY_JOBS')} isDark={isDark} />
            <Text
              style={[
                styles.tabLabel,
                isTabActive('CLIENT_MY_JOBS')
                  ? (isDark ? { color: '#34D399', fontWeight: '700' } : styles.activeTabLabel)
                  : (isDark ? { color: '#9CA3AF', fontWeight: '600' } : styles.inactiveTabLabel),
              ]}
            >
              My Jobs
            </Text>
          </TouchableOpacity>
        </View>

        {/* Center Tab: AI Hero Action Button */}
        <View style={styles.centerSlot}>
          <TouchableOpacity
            onPress={handleAiPress}
            style={[
              styles.aiButton,
              {
                backgroundColor: isDark ? colors.brand.emerald : colors.brand.forest,
                borderColor: isDark ? 'rgba(52, 211, 153, 0.4)' : '#123424',
              },
            ]}
            activeOpacity={0.85}
          >
            <BrainAiIcon />
          </TouchableOpacity>
        </View>

        {/* Tab 4: Messages */}
        <View style={styles.tabSlot}>
          <TouchableOpacity
            onPress={() => handlePress('CLIENT_CHAT')}
            style={[
              styles.tabTouch,
              isTabActive('CLIENT_CHAT') && styles.activePill,
              isTabActive('CLIENT_CHAT') && isDark && { backgroundColor: 'rgba(52, 211, 153, 0.15)' },
            ]}
            activeOpacity={0.75}
          >
            <View style={styles.badgeAnchor}>
              <MessagesIcon active={isTabActive('CLIENT_CHAT')} isDark={isDark} />
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
                isTabActive('CLIENT_CHAT')
                  ? (isDark ? { color: '#34D399', fontWeight: '700' } : styles.activeTabLabel)
                  : (isDark ? { color: '#9CA3AF', fontWeight: '600' } : styles.inactiveTabLabel),
              ]}
            >
              Messages
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 5: Wallet */}
        <View style={styles.tabSlot}>
          <TouchableOpacity
            onPress={() => handlePress('CLIENT_WALLET')}
            style={[
              styles.tabTouch,
              isTabActive('CLIENT_WALLET') && styles.activePill,
              isTabActive('CLIENT_WALLET') && isDark && { backgroundColor: 'rgba(52, 211, 153, 0.15)' },
            ]}
            activeOpacity={0.75}
          >
            <WalletIcon active={isTabActive('CLIENT_WALLET')} isDark={isDark} />
            <Text
              style={[
                styles.tabLabel,
                isTabActive('CLIENT_WALLET')
                  ? (isDark ? { color: '#34D399', fontWeight: '700' } : styles.activeTabLabel)
                  : (isDark ? { color: '#9CA3AF', fontWeight: '600' } : styles.inactiveTabLabel),
              ]}
            >
              Wallet
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
  aiButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    // Elevate so it nestles inside the center hump contour
    transform: [{ translateY: -14 }],
    borderWidth: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 6,
  },
});

export default ClientBottomBar;
