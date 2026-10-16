import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { colors, radius, typography } from '../../theme';
import { useArtisanStatusStore } from '../../stores/artisanStatusStore';

export const DutyStatusToggle: React.FC = () => {
  const { isOnline, toggleStatus, isUpdating } = useArtisanStatusStore();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={toggleStatus}
      disabled={isUpdating}
      style={[
        styles.container,
        isOnline ? styles.containerOnline : styles.containerOffline,
      ]}
    >
      <View style={styles.labelGroup}>
        <View style={[styles.statusDot, isOnline ? styles.dotOnline : styles.dotOffline]} />
        <Text style={styles.statusText}>
          {isOnline ? 'YOU ARE ONLINE' : 'YOU ARE OFFLINE'}
        </Text>
      </View>

      <Switch
        value={isOnline}
        onValueChange={toggleStatus}
        trackColor={{ false: '#4B5563', true: colors.brand.emerald }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#4B5563"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  containerOnline: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  containerOffline: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotOnline: {
    backgroundColor: colors.brand.emerald,
  },
  dotOffline: {
    backgroundColor: '#9CA3AF',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: typography.size.sm + 1,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
