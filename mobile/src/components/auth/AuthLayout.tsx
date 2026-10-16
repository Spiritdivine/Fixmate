import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { BrandLogo } from '../shared/BrandLogo';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  onBack?: () => void;
  error?: string | null;
  footerDisclaimer?: React.ReactNode;
  showcaseBadge?: string;
  showcasePills?: string[];
}

const DEFAULT_PILLS = [
  'Escrow Milestones',
  'Verified Artisans',
  'Instant Payouts',
  'Smart Escrow',
];

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  onBack,
  error,
  footerDisclaimer,
  showcaseBadge,
  showcasePills = DEFAULT_PILLS,
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Header Bar */}
        <View style={styles.topHeader}>
          {onBack ? (
            <TouchableOpacity
              onPress={onBack}
              style={styles.backBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowLeft size={20} color="#1C1917" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}

          <BrandLogo variant="full" theme="light" size={32} />

          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Optional Trust Pill Banner */}
          {showcaseBadge && (
            <View style={styles.trustBadge}>
              <ShieldCheck size={14} color="#059669" />
              <Text style={styles.trustBadgeText}>{showcaseBadge.toUpperCase()}</Text>
            </View>
          )}

          {/* Header Title & Subtitle */}
          <View style={styles.headerSection}>
            <h1 style={{ display: 'none' }}>{title}</h1>
            <Text style={styles.titleText}>{title}</Text>
            {subtitle ? <View style={styles.subtitleWrap}>{subtitle}</View> : null}
          </View>

          {/* Error Alert Banner */}
          {error ? (
            <View style={styles.errorAlert}>
              <Text style={styles.errorAlertText}>{error}</Text>
            </View>
          ) : null}

          {/* Form Content */}
          <View style={styles.formContainer}>{children}</View>

          {/* Feature Badges Strip (matching web showcase pills) */}
          {showcasePills && showcasePills.length > 0 && (
            <View style={styles.pillsContainer}>
              {showcasePills.map((pill, idx) => (
                <View key={idx} style={styles.pillChip}>
                  <Text style={styles.pillText}>{pill}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Footer Disclaimer */}
          {footerDisclaimer ? (
            <View style={styles.footerWrap}>{footerDisclaimer}</View>
          ) : (
            <View style={styles.footerWrap}>
              <Text style={styles.disclaimerText}>
                By continuing you agree to our{' '}
                <Text style={styles.disclaimerLink}>terms of use</Text> and{' '}
                <Text style={styles.disclaimerLink}>privacy policy</Text>.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F4', // stone-100
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5', // emerald-50
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  trustBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46', // emerald-800
    letterSpacing: 0.5,
  },
  headerSection: {
    marginBottom: 20,
  },
  titleText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1C1917', // stone-900
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  subtitleWrap: {
    marginTop: 6,
  },
  errorAlert: {
    backgroundColor: '#FFF1F2', // rose-50
    borderWidth: 1,
    borderColor: '#FECDD3', // rose-200
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  errorAlertText: {
    fontSize: 12,
    color: '#BE123C', // rose-700
    fontWeight: '500',
    lineHeight: 18,
  },
  formContainer: {
    width: '100%',
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F4',
  },
  pillChip: {
    backgroundColor: '#F5F5F4', // stone-100
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#57534E', // stone-600
  },
  footerWrap: {
    marginTop: 20,
    alignItems: 'center',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#A8A29E', // stone-400
    textAlign: 'center',
    lineHeight: 18,
  },
  disclaimerLink: {
    color: '#57534E', // stone-600
    textDecorationLine: 'underline',
  },
});
