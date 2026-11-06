import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors, radius, typography, useTheme } from '../../theme';

interface Step {
  number: number;
  label: string;
}

interface MilestoneProgressBarProps {
  steps: Step[];
  currentStep: number; // 1-indexed
}

export const MilestoneProgressBar: React.FC<MilestoneProgressBarProps> = ({
  steps,
  currentStep,
}) => {
  const { colors: themeColors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {steps.map((step, index) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;

          return (
            <React.Fragment key={step.number}>
              {/* Step Circle */}
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.circle,
                    isCompleted && styles.circleCompleted,
                    isCurrent && [styles.circleCurrent, isDark && { backgroundColor: themeColors.primary }],
                    !isCompleted && !isCurrent && [styles.circleUpcoming, { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border }],
                  ]}
                >
                  {isCompleted ? (
                    <Check size={11} color="#FFFFFF" strokeWidth={3} />
                  ) : (
                    <Text
                      style={[
                        styles.numberText,
                        isCurrent && styles.numberCurrent,
                        !isCurrent && [styles.numberUpcoming, { color: themeColors.textMuted }],
                      ]}
                    >
                      {step.number}
                    </Text>
                  )}
                </View>

                {/* Label */}
                <Text
                  style={[
                    styles.labelText,
                    { color: themeColors.textMuted },
                    isCurrent && [styles.labelCurrent, { color: themeColors.text }],
                    isCompleted && [styles.labelCompleted, isDark && { color: '#34D399' }],
                  ]}
                  numberOfLines={2}
                >
                  {step.label}
                </Text>
              </View>

              {/* Connecting Line between steps */}
              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.connectorLine,
                    { backgroundColor: themeColors.border },
                    step.number < currentStep && styles.connectorCompleted,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  circleCompleted: {
    backgroundColor: colors.brand.emeraldDark,
  },
  circleCurrent: {
    backgroundColor: colors.brand.forest,
  },
  circleUpcoming: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  numberText: {
    fontSize: typography.size.sm,
    fontWeight: 'bold',
  },
  numberCurrent: {
    color: '#FFFFFF',
  },
  numberUpcoming: {
    color: '#9CA3AF',
  },
  labelText: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
    textAlign: 'center',
    fontWeight: '500',
  },
  labelCurrent: {
    color: colors.neutral[900],
    fontWeight: '700',
  },
  labelCompleted: {
    color: colors.brand.emeraldDark,
    fontWeight: '600',
  },
  connectorLine: {
    height: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 22,
  },
  connectorCompleted: {
    backgroundColor: colors.brand.emeraldDark,
  },
});
