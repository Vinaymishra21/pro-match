import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === 'register';
  const isDisabled = isSubmitting || !email || !password || (isRegister && !name);

  async function handleSubmit() {
    try {
      setIsSubmitting(true);
      setError('');

      if (isRegister) {
        await signUp({ name, email, password });
      } else {
        await signIn({ email, password });
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenContainer>
      <Text style={styles.heading}>{isRegister ? 'Create Account' : 'Welcome Back'}</Text>
      <Text style={styles.caption}>Professional matches only.</Text>

      {isRegister ? <AppInput value={name} onChangeText={setName} placeholder="Full name" /> : null}

      <AppInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <AppInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AppButton
        title={isSubmitting ? 'Please wait...' : isRegister ? 'Register' : 'Login'}
        onPress={handleSubmit}
        disabled={isDisabled}
      />

      {isSubmitting ? <ActivityIndicator color={colors.secondary} style={styles.loader} /> : null}

      <View style={styles.switchWrap}>
        <Text style={styles.switchText}>
          {isRegister ? 'Already have an account?' : 'New here?'}
        </Text>
        <Text style={styles.switchAction} onPress={() => setMode(isRegister ? 'login' : 'register')}>
          {isRegister ? ' Login' : ' Register'}
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heading: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.xs
  },
  caption: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.lg
  },
  error: {
    color: '#FCA5A5',
    marginBottom: spacing.md
  },
  loader: {
    marginTop: spacing.md
  },
  switchWrap: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    justifyContent: 'center'
  },
  switchText: {
    color: colors.textMuted
  },
  switchAction: {
    color: colors.secondary,
    fontWeight: '700'
  }
});
