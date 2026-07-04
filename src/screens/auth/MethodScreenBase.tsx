import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthShell, BackButton, Eyebrow } from '../../components/auth/AuthKit';
import { HeroCarousel } from '../../components/auth/HeroCarousel';
import { useAuth } from '../../hooks/useAuth';
import { DEV_BYPASS_AUTH } from '../../constants/config';
import { darkColors } from '../../theme/darkColors';
import { spacing } from '../../theme/spacing';

// Shared dark "choose a method" screen for both Sign up and Login.
export function MethodScreenBase({
  navigation,
  mode
}: {
  navigation: any;
  mode: 'register' | 'login';
}) {
  const { devBypass } = useAuth();
  const isRegister = mode === 'register';

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
      <StatusBar style="light" />
      <BackButton onPress={() => navigation.goBack()} />

      <View style={styles.header}>
        <Eyebrow>{isRegister ? 'Join Pro Match' : 'Welcome back'}</Eyebrow>
        <Text style={styles.title}>{isRegister ? 'Create your\naccount' : 'Sign in to\nyour account'}</Text>
        <Text style={styles.subtitle}>Choose how you’d like to continue</Text>
      </View>

      <View style={styles.actions}>
        <MethodRow
          icon="📱"
          iconBg={darkColors.brandGradient}
          title="Use mobile number"
          hint={isRegister ? 'We’ll send you a verification code' : 'Sign in with a one-time code'}
          onPress={() => navigation.navigate('PhoneEntry')}
          gradientIcon
        />
        <MethodRow icon="G" iconBg={['#FFFFFF', '#F1F1F1']} iconColor="#444" title="Continue with Google" hint="Fast and secure" onPress={handleSocial} />
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
          <Text style={styles.switchText}>{isRegister ? 'Already have an account?' : 'New to Pro Match?'}</Text>
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

const styles = StyleSheet.create({
  header: { marginTop: spacing.xl, marginBottom: spacing.xl, gap: 6 },
  title: { color: darkColors.text, fontSize: 36, fontWeight: '900', letterSpacing: -1, lineHeight: 42 },
  subtitle: { color: darkColors.textMuted, fontSize: 15, fontWeight: '500', marginTop: 4 },
  actions: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 14,
    backgroundColor: 'rgba(28,21,40,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)'
  },
  rowPressed: { backgroundColor: 'rgba(40,30,56,0.85)' },
  rowIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  rowIconText: { fontWeight: '800' },
  rowInfo: { flex: 1 },
  rowTitle: { color: darkColors.text, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  rowHint: { color: darkColors.textMuted, fontSize: 12.5, fontWeight: '500' },
  chevron: {
    color: darkColors.textMuted,
    fontSize: 26,
    fontWeight: '300',
    marginLeft: 8,
    textAlignVertical: 'center',
    includeFontPadding: false
  },
  dividerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs },
  dividerLine: { flex: 1, height: 1, backgroundColor: darkColors.border },
  dividerText: { color: darkColors.textFaint, fontSize: 13, fontWeight: '600', paddingHorizontal: spacing.md },
  emailBtn: {
    height: 54,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    backgroundColor: 'rgba(28,21,40,0.55)'
  },
  emailPressed: { backgroundColor: 'rgba(40,30,56,0.75)' },
  emailLabel: { color: darkColors.text, fontSize: 15, fontWeight: '700' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.sm },
  switchText: { color: darkColors.textMuted, fontSize: 14 },
  switchAction: { color: darkColors.brandText, fontSize: 14, fontWeight: '800' }
});
