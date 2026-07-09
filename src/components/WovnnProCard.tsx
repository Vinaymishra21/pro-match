import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, useThemedStyles, type ThemeMode } from '../theme/ThemeProvider';
import type { ThemeColors } from '../theme/themes';
import { spacing } from '../theme/spacing';
import { fonts } from '../theme/typography';
import { useAuth } from '../hooks/useAuth';
import { getBillingCatalog } from '../services/apiService';

// Wovnn Pro upsell card for the Profile tab — the calm, always-there entry
// point to Pro. "Go Pro" opens the full Paywall (pricing). The "from ₹X/week"
// hook is computed from the LIVE billing catalog so it can never drift.
const BENEFITS = [
  { icon: '👀', text: 'See everyone who likes you' },
  { icon: '⚡', text: 'More Super Likes & a weekly Boost' },
  { icon: '💼', text: 'Match across every profession' }
];

export function WovnnProCard({ onGoPro }: { onGoPro: () => void }) {
  const { colors, mode } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { token } = useAuth();
  const [fromPerWeek, setFromPerWeek] = useState<number | null>(null);

  // Cheapest per-week rate across the plans = the honest "from" price.
  useEffect(() => {
    let cancelled = false;
    getBillingCatalog(token)
      .then((catalog) => {
        const plans = catalog?.proPlans || [];
        if (!plans.length) return;
        const min = Math.min(...plans.map((p) => (p.priceInr * 7) / p.periodDays));
        if (!cancelled) setFromPerWeek(Math.round(min));
      })
      .catch(() => {
        /* price just won't show until the catalog loads */
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <View style={styles.card}>
      <View style={styles.glow} pointerEvents="none" />

      <LinearGradient colors={colors.goldGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.badge}>
        <Text style={styles.badgeText}>⭐ WOVNN PRO</Text>
      </LinearGradient>

      <Text style={styles.headline}>
        Get seen. <Text style={styles.headlineAccent}>Get chosen.</Text>
      </Text>
      <Text style={styles.sub}>Everything you need to stand out in a sea of profiles.</Text>

      <View style={styles.divider} />

      <View style={styles.benefits}>
        {BENEFITS.map((b) => (
          <View key={b.text} style={styles.benefitRow}>
            <View style={styles.benefitIcon}>
              <Text style={styles.benefitEmoji}>{b.icon}</Text>
            </View>
            <Text style={styles.benefitText}>{b.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      <View style={styles.priceRow}>
        {fromPerWeek ? (
          <>
            <Text style={styles.price}>from ₹{fromPerWeek}</Text>
            <Text style={styles.priceUnit}> / week</Text>
          </>
        ) : (
          <Text style={styles.price}>Unlock everything</Text>
        )}
        <View style={styles.bestValue}>
          <Text style={styles.bestValueText}>Best value</Text>
        </View>
      </View>

      <Pressable onPress={onGoPro} style={({ pressed }) => (pressed ? { opacity: 0.9 } : null)}>
        <LinearGradient colors={colors.brandGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}>
          <Text style={styles.ctaText}>⭐  Go Pro</Text>
        </LinearGradient>
      </Pressable>

      <Text style={styles.footer}>No auto-renewal · no hidden fees</Text>
    </View>
  );
}

const makeStyles = (c: ThemeColors, mode: ThemeMode) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: mode === 'dark' ? 'rgba(251,191,36,0.20)' : 'rgba(232,65,90,0.16)',
      padding: spacing.lg,
      marginBottom: spacing.md,
      overflow: 'hidden',
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: mode === 'dark' ? 0.3 : 0.08,
      shadowRadius: 16,
      elevation: 4
    },
    // Soft gold glow, top-right.
    glow: {
      position: 'absolute',
      top: -50,
      right: -50,
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: 'rgba(251,191,36,0.12)'
    },
    badge: {
      alignSelf: 'flex-start',
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
      marginBottom: spacing.md
    },
    badgeText: {
      fontFamily: fonts.sansExtraBold,
      color: '#0E0B14',
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.2
    },
    headline: {
      fontFamily: fonts.sansExtraBold,
      color: c.text,
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: -0.4,
      lineHeight: 28
    },
    headlineAccent: { color: c.primary },
    sub: {
      fontFamily: fonts.sansMedium,
      color: c.textMuted,
      fontSize: 13,
      lineHeight: 19,
      marginTop: 6
    },
    divider: {
      height: 1,
      backgroundColor: mode === 'dark' ? 'rgba(250,246,240,0.08)' : 'rgba(0,0,0,0.07)',
      marginVertical: spacing.md
    },
    benefits: { gap: spacing.sm },
    benefitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    benefitIcon: {
      width: 30,
      height: 30,
      borderRadius: 9,
      backgroundColor: c.brandSoft,
      alignItems: 'center',
      justifyContent: 'center'
    },
    benefitEmoji: { fontSize: 15 },
    benefitText: {
      fontFamily: fonts.sansMedium,
      color: c.textDim,
      fontSize: 13.5,
      fontWeight: '500',
      flexShrink: 1
    },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: spacing.md },
    price: { fontFamily: fonts.sansExtraBold, color: c.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
    priceUnit: { fontFamily: fonts.sansMedium, color: c.textMuted, fontSize: 12 },
    bestValue: {
      marginLeft: 8,
      backgroundColor: 'rgba(251,191,36,0.14)',
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 2
    },
    bestValueText: { fontFamily: fonts.sansBold, color: c.gold, fontSize: 11, fontWeight: '700' },
    cta: {
      borderRadius: 999,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center'
    },
    ctaText: { fontFamily: fonts.sansExtraBold, color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },
    footer: {
      fontFamily: fonts.sansMedium,
      color: c.textMuted,
      fontSize: 11,
      textAlign: 'center',
      marginTop: 10
    }
  });
