import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { DarkBackground } from '../../components/DarkBackground';
import { darkColors } from '../../theme/darkColors';
import { spacing } from '../../theme/spacing';

export function SplashScreen({ onComplete }: { onComplete?: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 900);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <DarkBackground>
      <StatusBar style="light" />
      <View style={styles.center}>
        <LinearGradient
          colors={darkColors.brandGradient}
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

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  badge: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  heart: { color: '#fff', fontSize: 36 },
  logo: { fontSize: 36, fontWeight: '900', color: darkColors.text, letterSpacing: -1 },
  accent: { color: darkColors.primary },
  tagline: { color: darkColors.textMuted, fontSize: 15, marginTop: spacing.sm, textAlign: 'center' }
});
