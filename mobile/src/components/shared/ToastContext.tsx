import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';
import { colors, radius, spacing, shadows } from '../../theme';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions | string) => void;
  showSuccess: (titleOrMessage: string, message?: string) => void;
  showError: (titleOrMessage: string, message?: string) => void;
  showInfo: (titleOrMessage: string, message?: string) => void;
  showWarning: (titleOrMessage: string, message?: string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const { width } = Dimensions.get('window');

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  }, [translateY, opacity]);

  const showToast = useCallback(
    (options: ToastOptions | string) => {
      const opts = typeof options === 'string' ? { message: options, type: 'info' as ToastType } : options;
      const type = opts.type || 'info';
      const duration = opts.duration || 3200;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setToast({ message: opts.message, type });

      // Trigger sensory haptic feedback
      try {
        if (type === 'success') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        } else if (type === 'error') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        } else if (type === 'warning') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        } else {
          Haptics.selectionAsync().catch(() => {});
        }
      } catch {
        // Haptics fallback on unsupported platforms
      }

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: Platform.OS === 'ios' ? 54 : 36,
          friction: 9,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();

      timerRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    },
    [translateY, opacity, hideToast]
  );

  const formatMsg = (titleOrMsg: string, extraMsg?: string) => {
    return extraMsg ? `${titleOrMsg}: ${extraMsg}` : titleOrMsg;
  };

  const showSuccess = useCallback(
    (titleOrMsg: string, extraMsg?: string) =>
      showToast({ message: formatMsg(titleOrMsg, extraMsg), type: 'success' }),
    [showToast]
  );
  const showError = useCallback(
    (titleOrMsg: string, extraMsg?: string) =>
      showToast({ message: formatMsg(titleOrMsg, extraMsg), type: 'error' }),
    [showToast]
  );
  const showInfo = useCallback(
    (titleOrMsg: string, extraMsg?: string) =>
      showToast({ message: formatMsg(titleOrMsg, extraMsg), type: 'info' }),
    [showToast]
  );
  const showWarning = useCallback(
    (titleOrMsg: string, extraMsg?: string) =>
      showToast({ message: formatMsg(titleOrMsg, extraMsg), type: 'warning' }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo, showWarning, hideToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              transform: [{ translateY }],
              opacity,
            },
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={hideToast}
            style={[
              styles.toastBubble,
              toast.type === 'success' && styles.toastSuccess,
              toast.type === 'error' && styles.toastError,
              toast.type === 'info' && styles.toastInfo,
              toast.type === 'warning' && styles.toastWarning,
            ]}
          >
            <View style={styles.iconContainer}>
              {toast.type === 'success' && <CheckCircle2 size={18} color="#10B981" strokeWidth={2.5} />}
              {toast.type === 'error' && <AlertCircle size={18} color="#F87171" strokeWidth={2.5} />}
              {toast.type === 'info' && <Info size={18} color="#60A5FA" strokeWidth={2.5} />}
              {toast.type === 'warning' && <AlertCircle size={18} color="#FBBF24" strokeWidth={2.5} />}
            </View>

            <Text style={styles.toastText} numberOfLines={2}>
              {toast.message}
            </Text>

            <TouchableOpacity
              onPress={hideToast}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeBtn}
            >
              <X size={14} color="rgba(255, 255, 255, 0.7)" />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback dummy if outside provider
    return {
      showToast: () => {},
      showSuccess: () => {},
      showError: () => {},
      showInfo: () => {},
      showWarning: () => {},
      hideToast: () => {},
    };
  }
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999999,
    alignItems: 'center',
    paddingHorizontal: spacing.base,
  },
  toastBubble: {
    width: Math.min(width - 32, 440),
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.xl,
    ...shadows.lg,
    borderWidth: 1,
  },
  toastSuccess: {
    backgroundColor: '#0D3B29',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  toastError: {
    backgroundColor: '#450A0A',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  toastInfo: {
    backgroundColor: '#0F172A',
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  toastWarning: {
    backgroundColor: '#382504',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  iconContainer: {
    marginRight: 10,
  },
  toastText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#F9FAFB',
    lineHeight: 18,
  },
  closeBtn: {
    marginLeft: 8,
    padding: 4,
  },
});
