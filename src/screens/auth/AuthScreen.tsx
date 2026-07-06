import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthShell, BackButton, Eyebrow, GradientButton, useAuthText } from '../../components/auth/AuthKit';
import { useAuth } from '../../hooks/useAuth';
import { ThemedStatusBar, useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme/themes';
import { spacing } from '../../theme/spacing';
import type { AuthMethod, AuthMode, AuthStackParamList } from '../../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Auth'>;

function DarkField({ value, onChangeText, placeholder, ...rest }: any) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textFaint}
      style={styles.input}
      {...rest}
    />
  );
}

export function AuthScreen({ route, navigation }: Props) {
  const { signIn, signUp } = useAuth();
  const styles = useThemedStyles(makeStyles);
  const authText = useAuthText();
  const [mode, setMode] = useState<AuthMode>(route.params?.initialMode ?? 'login');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === 'register';
  const isPhone = authMethod === 'phone';
  const isDisabled = isSubmitting || (isPhone ? false : !email || !password || (isRegister && !name));

  async function handleSubmit() {
    if (isPhone) {
      navigation.navigate('PhoneEntry');
      return;
    }
    try {
      setIsSubmitting(true);
      setError('');
      if (isRegister) await signUp({ name, email, password });
      else await signIn({ email, password });
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <ThemedStatusBar />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
          <BackButton onPress={() => navigation.goBack()} />

          <View style={styles.head}>
            <Eyebrow>{isRegister ? 'Create account' : 'Welcome back'}</Eyebrow>
            <Text style={authText.title}>{isRegister ? 'Join Wovnn' : 'Sign in'}</Text>
            <Text style={authText.desc}>Professionals matching with professionals.</Text>
          </View>

          {/* Email / Phone toggle */}
          <View style={styles.toggle}>
            <Pressable onPress={() => setAuthMethod('email')} style={[styles.tab, !isPhone ? styles.tabActive : null]}>
              <Text style={[styles.tabLabel, !isPhone ? styles.tabLabelActive : null]}>Email</Text>
            </Pressable>
            <Pressable onPress={() => setAuthMethod('phone')} style={[styles.tab, isPhone ? styles.tabActive : null]}>
              <Text style={[styles.tabLabel, isPhone ? styles.tabLabelActive : null]}>Phone</Text>
            </Pressable>
          </View>

          {isPhone ? (
            <Text style={styles.phoneHint}>We’ll verify your number with a one-time code on the next screen.</Text>
          ) : (
            <View style={styles.fields}>
              {isRegister ? <DarkField value={name} onChangeText={setName} placeholder="Full name" /> : null}
              <DarkField value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" />
              <DarkField value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
            </View>
          )}

          {error ? <Text style={authText.error}>{error}</Text> : null}

          <GradientButton
            title={isSubmitting ? 'Please wait…' : isPhone ? 'Continue' : isRegister ? 'Create account' : 'Sign in'}
            onPress={handleSubmit}
            disabled={isDisabled}
            loading={isSubmitting}
            style={{ marginTop: spacing.lg }}
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>{isRegister ? 'Already have an account?' : 'New here?'}</Text>
            <Text style={styles.switchAction} onPress={() => setMode(isRegister ? 'login' : 'register')}>
              {isRegister ? ' Sign in' : ' Create one'}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthShell>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    head: { marginTop: spacing.xl, marginBottom: spacing.lg },
    toggle: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      padding: 4,
      marginBottom: spacing.lg
    },
    tab: { flex: 1, borderRadius: 999, paddingVertical: 11, alignItems: 'center' },
    tabActive: { backgroundColor: c.primary },
    tabLabel: { color: c.textMuted, fontWeight: '700', fontSize: 14 },
    tabLabelActive: { color: '#fff' },
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
    phoneHint: { color: c.textMuted, fontSize: 14, lineHeight: 21, marginBottom: spacing.sm },
    switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
    switchText: { color: c.textMuted, fontSize: 14 },
    switchAction: { color: c.brandText, fontSize: 14, fontWeight: '800' }
  });
