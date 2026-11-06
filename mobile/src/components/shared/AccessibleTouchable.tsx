import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { touchTargets } from '../../theme';

interface AccessibleTouchableProps extends TouchableOpacityProps {
  hapticFeedback?: 'light' | 'medium' | 'success' | 'selection' | 'none';
  minTouchSize?: number;
}

export const AccessibleTouchable: React.FC<AccessibleTouchableProps> = ({
  children,
  onPress,
  hapticFeedback = 'none',
  minTouchSize = touchTargets.min,
  style,
  hitSlop = touchTargets.hitSlop,
  activeOpacity = 0.75,
  ...rest
}) => {
  const handlePress = async (e: any) => {
    if (hapticFeedback === 'light') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } else if (hapticFeedback === 'medium') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } else if (hapticFeedback === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else if (hapticFeedback === 'selection') {
      Haptics.selectionAsync().catch(() => {});
    }
    onPress?.(e);
  };

  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      hitSlop={hitSlop}
      onPress={handlePress}
      style={[
        styles.accessibleBase,
        minTouchSize ? { minHeight: minTouchSize, minWidth: minTouchSize } : null,
        style as ViewStyle,
      ]}
      {...rest}
    >
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  accessibleBase: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
