import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { BrandLogo } from '../shared/BrandLogo';

const { width } = Dimensions.get('window');

interface WelcomeSplashScreenProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const WelcomeSplashScreen: React.FC<WelcomeSplashScreenProps> = ({
  onGetStarted,
  onLogin,
}) => {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      badge: '🤖 AI Failure Diagnosis',
      title: 'Artifix with Oga John AI',
      subtitle:
        'Snap a quick photo of any electrical fault, leaking pipe, or damaged AC to get instant technical diagnosis and fair market repair estimates.',
    },
    {
      badge: '🛡️ 100% Escrow Protection',
      title: 'Smart Escrow Custody',
      subtitle:
        'Your funds remain securely locked in Artifix Escrow until you personally inspect the completed job and approve milestone release.',
    },
    {
      badge: '⚡ Verified Artisans in 3 Mins',
      title: 'NIN-Verified Tradespeople',
      subtitle:
        'Every electrician, plumber, and technician is background-checked and identity-verified. Emergency artisans arrive at your location in minutes.',
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Brand Header */}
      <View style={styles.brandRow}>
        <BrandLogo variant="full" theme="dark" size={38} />
      </View>

      {/* Hero Visual Area */}
      <View style={styles.heroArea}>
        <View style={styles.illustrationCircle}>
          <BrandLogo variant="mark" theme="dark" size={62} />
        </View>

        {/* Slide Content */}
        <View style={styles.slideCard}>
          <View style={styles.badgeWrap}>
            <Text style={styles.badgeText}>{slides[activeSlide].badge}</Text>
          </View>
          <Text style={styles.slideTitle}>{slides[activeSlide].title}</Text>
          <Text style={styles.slideSubtitle}>{slides[activeSlide].subtitle}</Text>
        </View>

        {/* Carousel Indicators */}
        <View style={styles.dotsRow}>
          {slides.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setActiveSlide(index)}
              style={[
                styles.dot,
                activeSlide === index && styles.dotActive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Bottom Action CTAs */}
      <View style={styles.bottomArea}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={onGetStarted}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={onLogin}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryBtnText}>
            I already have an account • <Text style={styles.loginHighlight}>Log In</Text>
          </Text>
        </TouchableOpacity>

        <Text style={styles.termsNotice}>
          By continuing, you agree to Fixmate's Terms of Service & Escrow Safeguard Rules.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0F2E20', // Fixmate Dark Forest Brand Green
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  logoIcon: {
    fontSize: 20,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroArea: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  illustrationCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  illustrationEmoji: {
    fontSize: 54,
  },
  slideCard: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  badgeWrap: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    marginBottom: spacing.sm,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34D399',
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  slideSubtitle: {
    ...typography.body,
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 22,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#10B981',
  },
  bottomArea: {
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  primaryBtn: {
    backgroundColor: '#CBF7D2',
    paddingVertical: 16,
    borderRadius: 9999,
    alignItems: 'center',
    shadowColor: '#153E2D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#153E2D',
  },
  secondaryBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    ...typography.caption,
    color: '#9CA3AF',
  },
  loginHighlight: {
    color: '#34D399',
    fontWeight: '700',
  },
  termsNotice: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
});
