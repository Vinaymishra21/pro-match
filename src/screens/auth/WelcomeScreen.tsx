import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthShell, GradientButton, OutlineButton } from '../../components/auth/AuthKit';
import { HeroCarousel } from '../../components/auth/HeroCarousel';
import { WovnnMark } from '../../components/WovnnMark';
import { useAuth } from '../../hooks/useAuth';
import { DEV_BYPASS_AUTH } from '../../constants/config';
import { ThemedStatusBar, useThemedStyles } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme/themes';
import { spacing } from '../../theme/spacing';
import { fonts } from '../../theme/typography';
import type { AuthStackParamList } from '../../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const HIGHLIGHTS = [
  { icon: '💼', text: 'Match within your profession' },
  { icon: '🛡️', text: 'Verified, trusted members' },
  { icon: '✨', text: 'Deeper, ambitious connections' }
];

export function WelcomeScreen({ navigation }: Props) {
  const { devBypass } = useAuth();
  const styles = useThemedStyles(makeStyles);

  async function handleDevSkip() {
    try {
      await devBypass();
    } catch (error) {
      Alert.alert('Dev login failed', `${(error as Error).message}\n\nIs the backend running?`);
    }
  }

  return (
    <AuthShell hero={<HeroCarousel />}>
      <ThemedStatusBar />
      <View style={styles.screen}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.logoGlow}>
            <WovnnMark size={78} />
          </View>

          <Text style={styles.brand}>Wovnn</Text>
          <Text style={styles.tagline}>Great connections aren't found — they're woven.</Text>

          <View style={styles.highlights}>
            {HIGHLIGHTS.map((h, index) => (
              <React.Fragment key={h.text}>
                {index > 0 ? <View style={styles.hDot} /> : null}
                <Text style={styles.hLine}>
                  <Text style={styles.hIcon}>{h.icon}</Text>
                  {'  '}
                  {h.text}
                </Text>
              </React.Fragment>
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

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, justifyContent: 'space-between', paddingTop: spacing.xxl },
    hero: { alignItems: 'center', marginTop: spacing.xxl },
    logoGlow: {
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.6,
      shadowRadius: 28,
      elevation: 12,
      marginBottom: spacing.lg
    },
    brand: {
      fontFamily: fonts.displayBold,
      color: c.text,
      fontSize: 46,
      lineHeight: 54,
      fontWeight: '700',
      letterSpacing: -1
    },
    tagline: {
      fontFamily: fonts.displayItalic,
      color: c.textDim,
      fontSize: 18,
      lineHeight: 26,
      fontWeight: '500',
      letterSpacing: 0.2,
      marginTop: spacing.sm,
      textAlign: 'center'
    },
    // Value props read as quiet manifesto lines — plain centered type separated
    // by tiny dots, deliberately free of any button-like chrome.
    highlights: { marginTop: spacing.xl, alignItems: 'center', gap: spacing.sm, alignSelf: 'stretch', paddingHorizontal: spacing.md },
    hDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: c.textFaint },
    hLine: {
      fontFamily: fonts.sansMedium,
      color: c.textDim,
      fontSize: 15,
      lineHeight: 24,
      fontWeight: '500',
      letterSpacing: 0.4,
      textAlign: 'center'
    },
    hIcon: { fontSize: 14 },
    actions: { gap: spacing.sm },
    devButton: {
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderStyle: 'dashed',
      marginTop: spacing.xs
    },
    devLabel: { fontFamily: fonts.sansSemiBold, color: c.textMuted, fontSize: 13, fontWeight: '600' },
    legal: {
      fontFamily: fonts.sansMedium,
      color: c.textFaint,
      fontSize: 12,
      letterSpacing: 0.2,
      textAlign: 'center',
      marginTop: spacing.sm,
      lineHeight: 18
    }
  });
