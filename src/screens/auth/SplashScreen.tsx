import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DarkBackground } from '../../components/DarkBackground';
import { WovnnMark } from '../../components/WovnnMark';
import { ThemedStatusBar, useThemedStyles } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme/themes';
import { spacing } from '../../theme/spacing';

export function SplashScreen({ onComplete }: { onComplete?: () => void }) {
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
        <View style={styles.badge}>
          <WovnnMark size={82} />
        </View>
        <Text style={styles.logo}>Wovnn</Text>
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
    badge: { alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
    logo: { fontSize: 36, fontWeight: '900', color: c.text, letterSpacing: -1 },
    accent: { color: c.primary },
    tagline: { color: c.textMuted, fontSize: 15, marginTop: spacing.sm, textAlign: 'center' }
  });
