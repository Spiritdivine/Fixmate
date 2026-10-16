import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors, radius, spacing } from '../../theme';

export interface AuthInputProps extends TextInputProps {
  label?: string;
  labelAction?: React.ReactNode;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  labelAction,
  helperText,
  error,
  leftIcon,
  secureTextEntry,
  containerStyle,
  style,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPassword = Boolean(secureTextEntry);
  const computedSecure = isPassword ? !showPassword : false;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {/* Label and optional top-right action */}
      {(label || labelAction) && (
        <View style={styles.labelRow}>
          {label ? <Text style={styles.label}>{label}</Text> : <View />}
          {labelAction && <View>{labelAction}</View>}
        </View>
      )}

      {/* Input container */}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          Boolean(error) && styles.inputError,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            leftIcon ? { paddingLeft: 0 } : null,
            isPassword ? { paddingRight: 40 } : null,
            style,
          ]}
          secureTextEntry={computedSecure}
          placeholderTextColor="#A8A29E"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {/* Password toggle icon */}
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            {showPassword ? (
              <EyeOff size={18} color="#78716C" />
            ) : (
              <Eye size={18} color="#78716C" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Error or Helper text */}
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1917', // stone-900
    letterSpacing: -0.1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4', // stone-200
    borderRadius: 16,
    height: 50,
    paddingHorizontal: 16,
    position: 'relative',
  },
  inputFocused: {
    borderColor: '#0E3524', // signature dark forest
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#F43F5E',
    backgroundColor: '#FFF1F2',
  },
  leftIcon: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1C1917',
    paddingVertical: 0,
    height: '100%',
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperText: {
    fontSize: 11,
    color: '#78716C', // stone-500
    marginTop: 4,
    paddingHorizontal: 2,
  },
  errorText: {
    fontSize: 11,
    color: '#E11D48', // rose-600
    fontWeight: '500',
    marginTop: 4,
    paddingHorizontal: 2,
  },
});
