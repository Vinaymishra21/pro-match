import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { AuthStackParamList } from '../../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'OtpVerification'>;

const SKIP_AUTH_FOR_TESTING = true;

export function OtpVerificationScreen({ navigation, route }: Props) {
  const { updateLocalUser } = useAuth();
  const { countryCode, phoneNumber } = route.params;
  const [otp, setOtp] = useState('');

  const canContinue = useMemo(() => otp.trim().length >= 4, [otp]);

  async function handleNext() {
    if (!canContinue) {
      return;
    }

    if (SKIP_AUTH_FOR_TESTING) {
      await updateLocalUser({
        name: 'Test User',
        phone: `${countryCode} ${phoneNumber}`,
        profession: 'Not set'
      });
      return;
    }
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <View>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
            <Text style={styles.backLabel}>←</Text>
          </Pressable>

          <Text style={styles.title}>Enter the OTP</Text>
          <Text style={styles.description}>
            We sent a verification code to {countryCode} {phoneNumber}
          </Text>

          <Text style={styles.inputLabel}>Verification code</Text>
          <TextInput
            value={otp}
            onChangeText={(next) => setOtp(next.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            placeholder="Enter OTP"
            placeholderTextColor={colors.textMuted}
            style={styles.otpInput}
            autoFocus
          />
        </View>

        <View style={styles.footer}>
          <View style={styles.noteRow}>
            <Text style={styles.noteArrow}>→</Text>
            <Text style={styles.noteText}>
              We never share this with anyone and it won&apos;t be on your profile.
            </Text>
          </View>

          <Pressable
            disabled={!canContinue}
            onPress={handleNext}
            style={({ pressed }) => [
              styles.nextButton,
              !canContinue ? styles.nextButtonDisabled : null,
              pressed && canContinue ? styles.nextButtonPressed : null
            ]}
          >
            <Text style={styles.nextArrow}>→</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between'
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl
  },
  backLabel: {
    fontSize: 22,
    color: colors.text
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textMuted,
    marginBottom: spacing.xl,
    maxWidth: 310
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.sm
  },
  otpInput: {
    height: 62,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    fontSize: 24,
    letterSpacing: 6,
    color: colors.text
  },
  footer: {
    gap: spacing.lg
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm
  },
  noteArrow: {
    fontSize: 18,
    lineHeight: 24,
    color: colors.secondary,
    fontWeight: '700'
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted
  },
  nextButton: {
    alignSelf: 'flex-end',
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 6
  },
  nextButtonDisabled: {
    opacity: 0.4
  },
  nextButtonPressed: {
    transform: [{ scale: 0.98 }]
  },
  nextArrow: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '700'
  }
});
