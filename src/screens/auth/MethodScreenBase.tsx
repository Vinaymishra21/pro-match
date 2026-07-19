import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthShell, BackButton, Eyebrow } from '../../components/auth/AuthKit';
import { HeroCarousel } from '../../components/auth/HeroCarousel';
import { useAuth } from '../../hooks/useAuth';
import { DEV_BYPASS_AUTH } from '../../constants/config';
import { ThemedStatusBar, useTheme, useThemedStyles, type ThemeMode } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme/themes';
import { spacing } from '../../theme/spacing';

// Shared "choose a method" screen for both Sign up and Login.
export function MethodScreenBase({
  navigation,
  mode
}: {
  navigation: any;
  mode: 'register' | 'login';
}) {
  const { devBypass, googleSignIn } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const isRegister = mode === 'register';

  async function handleGoogle() {
    if (DEV_BYPASS_AUTH) {
      try {
        await devBypass();
      } catch (error) {
        Alert.alert('Dev login failed', (error as Error).message);
      }
      return;
    }
    try {
      await googleSignIn(); // null = user cancelled; navigation happens on session set
    } catch (error) {
      Alert.alert('Google sign-in failed', (error as Error).message);
    }
  }

  async function handleSocial() {
    if (DEV_BYPASS_AUTH) {
      try {
        await devBypass();
      } catch (error) {
        Alert.alert('Dev login failed', (error as Error).message);
      }
      return;
    }
    Alert.alert('Coming soon', `Social ${isRegister ? 'sign up' : 'login'} isn’t available yet. Please use your phone number.`);
  }

  return (
    <AuthShell hero={<HeroCarousel />}>
      <ThemedStatusBar />
      <BackButton onPress={() => navigation.goBack()} />

      <View style={styles.header}>
        <Eyebrow>{isRegister ? 'Join Wovnn' : 'Welcome back'}</Eyebrow>
        <Text style={styles.title}>{isRegister ? 'Create your\naccount' : 'Sign in to\nyour account'}</Text>
        <Text style={styles.subtitle}>Choose how you’d like to continue</Text>
      </View>

      <View style={styles.actions}>
        <MethodRow
          icon="📱"
          iconBg={colors.brandGradient}
          title="Use mobile number"
          hint={isRegister ? 'We’ll send you a verification code' : 'Sign in with a one-time code'}
          onPress={() => navigation.navigate('PhoneEntry')}
          gradientIcon
        />
        <MethodRow icon="G" iconBg={['#FFFFFF', '#F1F1F1']} iconColor="#444" title="Continue with Google" hint="Fast and secure" onPress={handleGoogle} />
        <MethodRow icon="f" iconBg={['#1877F2', '#0E5FD8']} title="Continue with Facebook" hint="Use your Facebook profile" onPress={handleSocial} />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          style={({ pressed }) => [styles.emailBtn, pressed ? styles.emailPressed : null]}
          onPress={() => navigation.navigate('Auth', { initialMode: mode })}
        >
          <Text style={styles.emailLabel}>{isRegister ? 'Sign up with Email' : 'Log in with Email'}</Text>
        </Pressable>

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>{isRegister ? 'Already have an account?' : 'New to Wovnn?'}</Text>
          <Text
            style={styles.switchAction}
            onPress={() => navigation.replace(isRegister ? 'LoginMethod' : 'SignUpMethod')}
          >
            {isRegister ? ' Sign in' : ' Create one'}
          </Text>
        </View>
      </View>
    </AuthShell>
  );
}

function MethodRow({
  icon,
  iconBg,
  iconColor = '#fff',
  title,
  hint,
  onPress,
  gradientIcon
}: {
  icon: string;
  iconBg: readonly [string, string, ...string[]];
  iconColor?: string;
  title: string;
  hint: string;
  onPress: () => void;
  gradientIcon?: boolean;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]} onPress={onPress}>
      <LinearGradient colors={iconBg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.rowIcon}>
        <Text style={[styles.rowIconText, { color: iconColor, fontSize: gradientIcon ? 20 : 18 }]}>{icon}</Text>
      </LinearGradient>
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowHint}>{hint}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

// The glass rows/buttons sit over the HeroCarousel photos, so they use
// scrim-matched translucent washes: dark keeps the original literals (card
// tint over the dark scrim); light mirrors them with warm-white glass and ink
// hairlines over the cream scrim.
const makeStyles = (c: ThemeColors, mode: ThemeMode) =>
  StyleSheet.create({
    header: { marginTop: spacing.xl, marginBottom: spacing.xl, gap: 6 },
    title: { color: c.text, fontSize: 36, fontWeight: '900', letterSpacing: -1, lineHeight: 42 },
    subtitle: { color: c.textMuted, fontSize: 15, fontWeight: '500', marginTop: 4 },
    actions: { gap: spacing.sm },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 18,
      padding: 14,
      backgroundColor: mode === 'dark' ? 'rgba(28,21,40,0.72)' : 'rgba(255,253,251,0.72)',
      borderWidth: 1,
      borderColor: mode === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(35,26,47,0.14)'
    },
    rowPressed: { backgroundColor: mode === 'dark' ? 'rgba(40,30,56,0.85)' : 'rgba(244,238,240,0.85)' },
    rowIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    rowIconText: { fontWeight: '800' },
    rowInfo: { flex: 1 },
    rowTitle: { color: c.text, fontSize: 15, fontWeight: '700', marginBottom: 2 },
    rowHint: { color: c.textMuted, fontSize: 12.5, fontWeight: '500' },
    chevron: {
      color: c.textMuted,
      fontSize: 26,
      fontWeight: '300',
      marginLeft: 8,
      textAlignVertical: 'center',
      includeFontPadding: false
    },
    dividerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs },
    dividerLine: { flex: 1, height: 1, backgroundColor: c.border },
    dividerText: { color: c.textFaint, fontSize: 13, fontWeight: '600', paddingHorizontal: spacing.md },
    emailBtn: {
      height: 54,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(35,26,47,0.7)',
      backgroundColor: mode === 'dark' ? 'rgba(28,21,40,0.55)' : 'rgba(255,253,251,0.55)'
    },
    emailPressed: { backgroundColor: mode === 'dark' ? 'rgba(40,30,56,0.75)' : 'rgba(244,238,240,0.75)' },
    emailLabel: { color: c.text, fontSize: 15, fontWeight: '700' },
    switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.sm },
    switchText: { color: c.textMuted, fontSize: 14 },
    switchAction: { color: c.brandText, fontSize: 14, fontWeight: '800' }
  });
