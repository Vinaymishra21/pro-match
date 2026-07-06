import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { FieldLabel, useAuthText } from '../../components/auth/AuthKit';
import { OnboardingScaffold } from './OnboardingScaffold';
import { TOTAL_STEPS, useOnboarding } from './OnboardingContext';
import { ageFromDob } from '../../utils/onboarding';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme/themes';
import { spacing } from '../../theme/spacing';

// Builds a Date from D/M/Y only if it's a real calendar date (rejects 31 Feb etc).
function buildDate(d: string, m: string, y: string): Date | null {
  const dd = parseInt(d, 10);
  const mm = parseInt(m, 10);
  const yy = parseInt(y, 10);
  if (!dd || !mm || !yy || y.length !== 4) return null;
  const date = new Date(yy, mm - 1, dd);
  if (date.getFullYear() !== yy || date.getMonth() !== mm - 1 || date.getDate() !== dd) return null;
  return date;
}

export function DobScreen({ navigation }: any) {
  const { draft, persist } = useOnboarding();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const authText = useAuthText();
  const initial = draft.dob ? new Date(draft.dob) : null;
  const [day, setDay] = useState(initial ? String(initial.getDate()) : '');
  const [month, setMonth] = useState(initial ? String(initial.getMonth() + 1) : '');
  const [year, setYear] = useState(initial ? String(initial.getFullYear()) : '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);

  const date = buildDate(day, month, year);
  const age = date ? ageFromDob(date) : null;
  const valid = age !== null && age >= 18 && age <= 100;

  async function next() {
    if (!date) {
      setErr('Please enter a valid date.');
      return;
    }
    if (age === null || age < 18) {
      setErr('You must be at least 18 to use Wovnn.');
      return;
    }
    if (age > 100) {
      setErr('Please enter a valid date of birth.');
      return;
    }
    try {
      setBusy(true);
      setErr('');
      await persist({ dob: date.toISOString() });
      navigation.navigate('ProfessionStep');
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <OnboardingScaffold
      step={2}
      total={TOTAL_STEPS}
      title="When's your birthday?"
      subtitle="You must be 18+. Your age is shown on your profile — never your date of birth."
      onNext={next}
      nextDisabled={!valid}
      loading={busy}
      onBack={() => navigation.goBack()}
    >
      <FieldLabel>Date of birth</FieldLabel>
      <View style={styles.row}>
        <TextInput
          value={day}
          onChangeText={(t) => {
            const v = t.replace(/\D/g, '').slice(0, 2);
            setDay(v);
            if (v.length === 2) monthRef.current?.focus();
          }}
          placeholder="DD"
          placeholderTextColor={colors.textFaint}
          keyboardType="number-pad"
          style={[styles.cell, styles.cellSm]}
          maxLength={2}
        />
        <TextInput
          ref={monthRef}
          value={month}
          onChangeText={(t) => {
            const v = t.replace(/\D/g, '').slice(0, 2);
            setMonth(v);
            if (v.length === 2) yearRef.current?.focus();
          }}
          placeholder="MM"
          placeholderTextColor={colors.textFaint}
          keyboardType="number-pad"
          style={[styles.cell, styles.cellSm]}
          maxLength={2}
        />
        <TextInput
          ref={yearRef}
          value={year}
          onChangeText={(t) => setYear(t.replace(/\D/g, '').slice(0, 4))}
          placeholder="YYYY"
          placeholderTextColor={colors.textFaint}
          keyboardType="number-pad"
          style={[styles.cell, styles.cellLg]}
          maxLength={4}
        />
      </View>
      {valid ? <Text style={styles.ageHint}>You're {age} 🎂</Text> : null}
      {err ? <Text style={authText.error}>{err}</Text> : null}
    </OnboardingScaffold>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: spacing.sm },
    cell: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      paddingVertical: 16,
      color: c.text,
      fontSize: 20,
      fontWeight: '800',
      textAlign: 'center'
    },
    cellSm: { width: 74 },
    cellLg: { flex: 1 },
    ageHint: { color: c.brandText, fontWeight: '800', fontSize: 14, marginTop: spacing.md }
  });
