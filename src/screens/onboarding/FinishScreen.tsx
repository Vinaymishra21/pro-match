import React, { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DarkBackground } from '../../components/DarkBackground';
import { useOnboarding } from './OnboardingContext';
import { useAuth } from '../../hooks/useAuth';
import { professionTheme } from '../../theme/professionTheme';
import { darkColors } from '../../theme/darkColors';
import { spacing } from '../../theme/spacing';

export function FinishScreen() {
  const { draft, finish } = useOnboarding();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, Platform.OS === 'android' ? 28 : 0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const theme = professionTheme(draft.profession || user?.profession || null);
  const name = (draft.name || user?.name || '').split(' ')[0];

  async function start() {
    try {
      setBusy(true);
      setErr('');
      await finish(); // pulls the completed profile into the app → RootNavigator switches to the tabs
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <DarkBackground orbColor={theme.accent + '55'}>
      <StatusBar style="light" />
      <View style={[styles.root, { paddingTop: topPad, paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.center}>
          <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.badge}>
            <Text style={styles.badgeEmoji}>{theme.emoji}</Text>
          </LinearGradient>
          <Text style={styles.title}>You're all set{name ? `, ${name}` : ''}! 🎉</Text>
          <Text style={styles.subtitle}>
            Your profile is live. Start discovering people in {draft.profession || 'your field'} and beyond.
          </Text>
          {err ? <Text style={styles.err}>{err}</Text> : null}
        </View>

        <Pressable onPress={start} disabled={busy}>
          <LinearGradient colors={darkColors.brandGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Start swiping</Text>}
          </LinearGradient>
        </Pressable>
      </View>
    </DarkBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  badge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8
  },
  badgeEmoji: { fontSize: 46 },
  title: { fontSize: 30, fontWeight: '900', color: darkColors.text, letterSpacing: -0.8, textAlign: 'center' },
  subtitle: { color: darkColors.textMuted, fontSize: 15, lineHeight: 23, textAlign: 'center', marginTop: spacing.md, paddingHorizontal: spacing.md },
  err: { color: darkColors.danger, marginTop: spacing.md, textAlign: 'center' },
  cta: {
    height: 56,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: darkColors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});
