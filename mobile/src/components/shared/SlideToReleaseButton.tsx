import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  PanResponder,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography } from '../../theme';

interface SlideToReleaseButtonProps {
  label?: string;
  onRelease: () => Promise<void>;
  disabled?: boolean;
}

const BUTTON_HEIGHT = 58;
const THUMB_SIZE = 46;
const TRACK_PADDING = 6;

export const SlideToReleaseButton: React.FC<SlideToReleaseButtonProps> = ({
  label = 'Slide to Release Funds to Artisan  >>>',
  onRelease,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [released, setReleased] = useState(false);
  const [containerWidth, setContainerWidth] = useState(320);

  const maxSlide = Math.max(0, containerWidth - THUMB_SIZE - TRACK_PADDING * 2);
  const slideAnim = useState(new Animated.Value(0))[0];

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled && !loading && !released,
    onMoveShouldSetPanResponder: () => !disabled && !loading && !released,
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dx > 0) {
        slideAnim.setValue(Math.min(gestureState.dx, maxSlide));
      }
    },
    onPanResponderRelease: async (_, gestureState) => {
      // Trigger threshold: 75% of maximum track length
      if (gestureState.dx >= maxSlide * 0.75) {
        Animated.spring(slideAnim, {
          toValue: maxSlide,
          useNativeDriver: true,
        }).start();

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setLoading(true);

        try {
          await onRelease();
          setReleased(true);
        } catch (error) {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        } finally {
          setLoading(false);
        }
      } else {
        // Snap back if released before threshold
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  return (
    <View
      style={[
        styles.track,
        disabled && styles.trackDisabled,
        released && styles.trackReleased,
      ]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {/* Background Label */}
      <View style={styles.textContainer}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : released ? (
          <Text style={styles.releasedText}>✓ Funds Successfully Released</Text>
        ) : (
          <Text style={styles.label}>{label}</Text>
        )}
      </View>

      {/* Draggable Circle Thumb */}
      {!released && !loading && (
        <Animated.View
          style={[
            styles.thumb,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <Text style={styles.arrowIcon}>➔</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    height: BUTTON_HEIGHT,
    backgroundColor: colors.brand.forest,
    borderRadius: radius.full,
    padding: TRACK_PADDING,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  trackDisabled: {
    opacity: 0.5,
  },
  trackReleased: {
    backgroundColor: colors.brand.emeraldDark,
  },
  textContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 30,
  },
  label: {
    color: '#FFFFFF',
    fontSize: typography.size.sm + 1,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  releasedText: {
    color: '#FFFFFF',
    fontSize: typography.size.base,
    fontWeight: 'bold',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radius.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  arrowIcon: {
    color: colors.brand.forest,
    fontSize: 18,
    fontWeight: '900',
  },
});
