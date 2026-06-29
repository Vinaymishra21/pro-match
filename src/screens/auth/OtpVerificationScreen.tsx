import React, { useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthShell, BackButton, Eyebrow, NextFab, authText } from '../../components/auth/AuthKit';
import { useAuth } from '../../hooks/useAuth';
import { darkColors } from '../../theme/darkColors';
import { spacing } from '../../theme/spacing';
import type { AuthStackParamList } from '../../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'OtpVerification'>;

const LEN = 6;

export function OtpVerificationScreen({ navigation, route }: Props) {
  const { verifyOtp } = useAuth();
  const { countryCode, phoneNumber } = route.params;
  const fullPhone = `${countryCode}${phoneNumber}`;
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const canContinue = useMemo(() => otp.trim().length >= 4 && !isSubmitting, [otp, isSubmitting]);

  async function handleNext() {
    if (!canContinue) return;
    try {
      setIsSubmitting(true);
      setError('');
      await verifyOtp(fullPhone, otp.trim());
    } catch (verifyError) {
      setError((verifyError as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const cells = Array.from({ length: LEN }, (_, i) => otp[i] || '');

  return (
    <AuthShell>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <View>
          <BackButton onPress={() => navigation.goBack()} />

          <View style={styles.head}>
            <Eyebrow>One last step</Eyebrow>
            <Text style={authText.title}>Enter the code</Text>
            <Text style={authText.desc}>
              We sent a 6-digit code to{' '}
              <Text style={styles.phone}>{countryCode} {phoneNumber}</Text>
            </Text>
          </View>

          {/* Segmented code display (taps focus the hidden input) */}
          <Pressable style={styles.cellsRow} onPress={() => inputRef.current?.focus()}>
            {cells.map((c, i) => {
              const filled = Boolean(c);
              const isCursor = i === otp.length;
              return (
                <View key={i} style={[styles.cell, filled ? styles.cellFilled : null, isCursor ? styles.cellActive : null]}>
                  <Text style={styles.cellText}>{c}</Text>
                </View>
              );
            })}
          </Pressable>

          {/* Hidden input that actually captures the code */}
          <TextInput
            ref={inputRef}
            value={otp}
            onChangeText={(next) => setOtp(next.replace(/\D/g, '').slice(0, LEN))}
            keyboardType="number-pad"
            style={styles.hiddenInput}
            autoFocus
            maxLength={LEN}
          />

          {error ? <Text style={authText.error}>{error}</Text> : null}

          <Text style={styles.resend}>
            Didn’t get it? <Text style={styles.resendLink} onPress={() => navigation.goBack()}>Change number</Text>
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.noteRow}>
            <Text style={styles.shield}>🔒</Text>
            <Text style={styles.noteText}>We never share this with anyone and it won’t be on your profile.</Text>
          </View>
          <NextFab onPress={handleNext} disabled={!canContinue} loading={isSubmitting} />
        </View>
      </KeyboardAvoidingView>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between' },
  head: { marginTop: spacing.xl, marginBottom: spacing.xl },
  phone: { color: darkColors.text, fontWeight: '800' },
  cellsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.xs },
  cell: {
    flex: 1,
    height: 60,
    borderRadius: 14,
    backgroundColor: darkColors.surface,
    borderWidth: 1.5,
    borderColor: darkColors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cellFilled: { borderColor: darkColors.primary, backgroundColor: 'rgba(232,65,90,0.12)' },
  cellActive: { borderColor: darkColors.brandText },
  cellText: { fontSize: 26, fontWeight: '800', color: darkColors.text },
  hiddenInput: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  resend: { marginTop: spacing.lg, color: darkColors.textMuted, fontSize: 14, textAlign: 'center' },
  resendLink: { color: darkColors.brandText, fontWeight: '800' },
  footer: { gap: spacing.lg },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  shield: { fontSize: 15 },
  noteText: { flex: 1, fontSize: 13.5, lineHeight: 21, color: darkColors.textMuted }
});
