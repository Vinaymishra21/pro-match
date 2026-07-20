import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthShell, BackButton, Eyebrow, GradientButton, useAuthText } from '../../components/auth/AuthKit';
import { useAuth } from '../../hooks/useAuth';
import { forgotPassword, resetPassword } from '../../services/apiService';
import { ThemedStatusBar, useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme/themes';
import { spacing } from '../../theme/spacing';
import type { AuthStackParamList } from '../../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ route, navigation }: Props) {
  const { signIn } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const authText = useAuthText();

  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [devCode, setDevCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function requestCode() {
    if (!email.trim()) return;
    try {
      setBusy(true);
      setError('');
      const res = await forgotPassword(email.trim());
      // Dev mode returns the code directly (no real email sent) — prefill it.
      if (res.devCode) {
        setDevCode(res.devCode);
        setCode(res.devCode);
      }
      setStep('reset');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submitReset() {
    if (!code.trim() || newPassword.length < 6) {
      setError('Enter the code and a new password (min 6 characters).');
      return;
    }
    try {
      setBusy(true);
      setError('');
      await resetPassword(email.trim(), code.trim(), newPassword);
      // Sign straight in with the new password — the navigator swaps to Main.
      await signIn({ email: email.trim(), password: newPassword });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const requesting = step === 'request';

  return (
    <AuthShell>
      <ThemedStatusBar />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
          <BackButton onPress={() => (requesting ? navigation.goBack() : setStep('request'))} />

          <View style={styles.head}>
            <Eyebrow>Password reset</Eyebrow>
            <Text style={authText.title}>{requesting ? 'Forgot password?' : 'Enter your code'}</Text>
            <Text style={authText.desc}>
              {requesting
                ? 'We’ll email you a 6-digit code to reset your password.'
                : `Enter the code sent to ${email} and choose a new password.`}
            </Text>
          </View>

          {requesting ? (
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={colors.textFaint}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          ) : (
            <View style={styles.fields}>
              {devCode ? <Text style={styles.devHint}>Dev code: {devCode}</Text> : null}
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="6-digit code"
                placeholderTextColor={colors.textFaint}
                style={styles.input}
                keyboardType="number-pad"
              />
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="New password"
                placeholderTextColor={colors.textFaint}
                style={styles.input}
                secureTextEntry
              />
            </View>
          )}

          {error ? <Text style={authText.error}>{error}</Text> : null}

          <GradientButton
            title={busy ? 'Please wait…' : requesting ? 'Send reset code' : 'Reset & sign in'}
            onPress={requesting ? requestCode : submitReset}
            disabled={busy || (requesting ? !email.trim() : !code.trim() || newPassword.length < 6)}
            loading={busy}
            style={{ marginTop: spacing.lg }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthShell>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    head: { marginTop: spacing.xl, marginBottom: spacing.lg },
    fields: { gap: spacing.sm },
    input: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      paddingHorizontal: spacing.md,
      paddingVertical: 15,
      color: c.text,
      fontSize: 15,
      fontWeight: '600'
    },
    devHint: { color: c.brandText, fontSize: 13, fontWeight: '700' }
  });
