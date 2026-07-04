import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DarkBackground } from '../../components/DarkBackground';
import { ThemedStatusBar, useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme/themes';
import { spacing } from '../../theme/spacing';

export function SplashScreen({ onComplete }: { onComplete?: () => void }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 900);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <DarkBackground>
      <ThemedStatusBar />
      <View style={styles.center}>
        <LinearGradient
          colors={colors.brandGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.badge}
        >
          <Text style={styles.heart}>♥</Text>
        </LinearGradient>
        <Text style={styles.logo}>
          Pro <Text style={styles.accent}>Match</Text>
        </Text>
        <Text style={styles.tagline}>Where ambition meets attraction.</Text>
      </View>
    </DarkBackground>
  );
}

// NOTE: this screen intentionally uses SYSTEM fonts — it renders while the
// custom fonts (Fraunces / Plus Jakarta Sans) are still loading in App.tsx,
// so referencing them here would warn and fall back anyway.
const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    badge: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
    heart: { color: '#fff', fontSize: 36 },
    logo: { fontSize: 36, fontWeight: '900', color: c.text, letterSpacing: -1 },
    accent: { color: c.primary },
    tagline: { color: c.textMuted, fontSize: 15, marginTop: spacing.sm, textAlign: 'center' }
  });
