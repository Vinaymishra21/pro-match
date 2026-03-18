import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { AuthMethod, AuthMode, AuthStackParamList } from '../../types';

const SKIP_AUTH_FOR_TESTING = true;

type Props = NativeStackScreenProps<AuthStackParamList, 'Auth'>;

export function AuthScreen({ route }: Props) {
  const { signIn, signUp, updateLocalUser } = useAuth();
  const [mode, setMode] = useState<AuthMode>(route.params?.initialMode ?? 'login');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === 'register';
  const isPhone = authMethod === 'phone';

  const isDisabled = !SKIP_AUTH_FOR_TESTING && (
    isSubmitting ||
    (isPhone ? !phone : (!email || !password)) ||
    (isRegister && !name)
  );

  async function handleSubmit() {
    try {
      setIsSubmitting(true);
      setError('');

      if (SKIP_AUTH_FOR_TESTING) {
        await updateLocalUser({
          name: name || 'Test User',
          email: isPhone ? '' : (email || 'test@promatch.app'),
          phone: isPhone ? (phone || '+91 9999999999') : '',
          profession: 'Not set'
        });
        return;
      }

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

      <View style={styles.methodToggle}>
        <Pressable
          onPress={() => setAuthMethod('email')}
          style={[styles.methodTab, !isPhone ? styles.methodTabActive : null]}
        >
          <Text style={[styles.methodLabel, !isPhone ? styles.methodLabelActive : null]}>Email</Text>
        </Pressable>
        <Pressable
          onPress={() => setAuthMethod('phone')}
          style={[styles.methodTab, isPhone ? styles.methodTabActive : null]}
        >
          <Text style={[styles.methodLabel, isPhone ? styles.methodLabelActive : null]}>Phone</Text>
        </Pressable>
      </View>

      {isRegister ? <AppInput value={name} onChangeText={setName} placeholder="Full name" /> : null}

      {isPhone ? (
        <AppInput
          value={phone}
          onChangeText={setPhone}
          placeholder="Phone number"
          keyboardType="phone-pad"
        />
      ) : (
        <>
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
        </>
      )}

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
  methodToggle: {
    flexDirection: 'row',
    backgroundColor: colors.inputBg,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    marginBottom: spacing.lg
  },
  methodTab: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center'
  },
  methodTabActive: {
    backgroundColor: colors.primary
  },
  methodLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700'
  },
  methodLabelActive: {
    color: colors.white
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
