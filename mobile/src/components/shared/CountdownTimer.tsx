import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock } from 'lucide-react-native';
import { colors, radius, typography } from '../../theme';

interface CountdownTimerProps {
  initialSeconds?: number;
  label?: string; // e.g., "to respond"
  onExpire?: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  initialSeconds = 165, // 02:45 default
  label = '',
  onExpire,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpire?.();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onExpire]);

  const minutes = Math.floor(secondsLeft / 60);
  const remainingSecs = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;

  return (
    <View style={styles.pill}>
      <Clock size={12} color="#D97706" />
      <Text style={styles.timeText}>
        {formattedTime} {label ? label : ''}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 4,
  },
  icon: {
    fontSize: 11,
  },
  timeText: {
    color: '#D97706',
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
  },
});
