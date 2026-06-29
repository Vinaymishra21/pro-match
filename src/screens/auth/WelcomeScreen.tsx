import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthShell, GradientButton, OutlineButton } from '../../components/auth/AuthKit';
import { HeroCarousel } from '../../components/auth/HeroCarousel';
import { useAuth } from '../../hooks/useAuth';
import { DEV_BYPASS_AUTH } from '../../constants/config';
import { darkColors } from '../../theme/darkColors';
import { spacing } from '../../theme/spacing';
import type { AuthStackParamList } from '../../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const HIGHLIGHTS = [
  { icon: '💼', text: 'Match within your profession' },
  { icon: '🛡️', text: 'Verified, trusted members' },
  { icon: '✨', text: 'Deeper, ambitious connections' }
];

export function WelcomeScreen({ navigation }: Props) {
  const { devBypass } = useAuth();

  async function handleDevSkip() {
    try {
      await devBypass();
    } catch (error) {
      Alert.alert('Dev login failed', `${(error as Error).message}\n\nIs the backend running?`);
    }
  }

  return (
    <AuthShell hero={<HeroCarousel />}>
      <StatusBar style="light" />
      <View style={styles.screen}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.logoGlow}>
            <LinearGradient
              colors={darkColors.brandGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoBadge}
            >
              <Text style={styles.logoHeart}>♥</Text>
            </LinearGradient>
          </View>

          <Text style={styles.brand}>
            Pro <Text style={styles.brandAccent}>Match</Text>
          </Text>
          <Text style={styles.tagline}>Where ambition meets attraction.</Text>

          <View style={styles.highlights}>
            {HIGHLIGHTS.map((h) => (
              <View key={h.text} style={styles.hRow}>
                <Text style={styles.hIcon}>{h.icon}</Text>
                <Text style={styles.hText}>{h.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <GradientButton title="Create an account" onPress={() => navigation.navigate('SignUpMethod')} />
          <OutlineButton title="I already have an account" onPress={() => navigation.navigate('LoginMethod')} />

          {DEV_BYPASS_AUTH ? (
            <Pressable style={styles.devButton} onPress={handleDevSkip}>
              <Text style={styles.devLabel}>Skip login (dev)</Text>
            </Pressable>
          ) : null}

          <Text style={styles.legal}>
            By continuing you agree to our Terms & Privacy Policy.
          </Text>
        </View>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'space-between', paddingTop: spacing.xxl },
  hero: { alignItems: 'center', marginTop: spacing.xxl },
  logoGlow: {
    shadowColor: darkColors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 28,
    elevation: 12,
    marginBottom: spacing.lg
  },
  logoBadge: { width: 78, height: 78, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  logoHeart: { color: '#fff', fontSize: 40 },
  brand: { color: darkColors.text, fontSize: 44, fontWeight: '900', letterSpacing: -1.4 },
  brandAccent: { color: darkColors.primary },
  tagline: {
    color: darkColors.textDim,
    fontSize: 17,
    fontWeight: '500',
    marginTop: spacing.sm,
    textAlign: 'center'
  },
  highlights: { marginTop: spacing.xl, gap: spacing.sm, alignSelf: 'stretch', paddingHorizontal: spacing.md },
  hRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: spacing.md
  },
  hIcon: { fontSize: 18 },
  hText: { color: darkColors.textDim, fontSize: 14.5, fontWeight: '600' },
  actions: { gap: spacing.sm },
  devButton: {
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkColors.surface,
    borderWidth: 1,
    borderColor: darkColors.border,
    borderStyle: 'dashed',
    marginTop: spacing.xs
  },
  devLabel: { color: darkColors.textMuted, fontSize: 13, fontWeight: '600' },
  legal: { color: darkColors.textFaint, fontSize: 12, textAlign: 'center', marginTop: spacing.sm, lineHeight: 18 }
});
