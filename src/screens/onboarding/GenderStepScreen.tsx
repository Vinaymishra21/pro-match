import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FieldLabel, authText } from '../../components/auth/AuthKit';
import { OnboardingScaffold } from './OnboardingScaffold';
import { TOTAL_STEPS, useOnboarding } from './OnboardingContext';
import { genderOptions } from '../../features/profile/constants/profileOptions';
import { darkColors } from '../../theme/darkColors';
import { spacing } from '../../theme/spacing';

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, on ? styles.chipOn : null]}>
      <Text style={[styles.chipText, on ? styles.chipTextOn : null]}>{label}</Text>
    </Pressable>
  );
}

export function GenderStepScreen({ navigation }: any) {
  const { draft, persist } = useOnboarding();
  const [gender, setGender] = useState(draft.gender);
  const [pref, setPref] = useState<string[]>(draft.genderPreference || []);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  function togglePref(opt: string) {
    setPref((p) => (p.includes(opt) ? p.filter((x) => x !== opt) : [...p, opt]));
  }

  async function save(goNext: () => void) {
    try {
      setBusy(true);
      setErr('');
      await persist({ gender, genderPreference: pref });
      goNext();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <OnboardingScaffold
      step={6}
      total={TOTAL_STEPS}
      title="You & who you'd like to meet"
      subtitle="This powers your matches. You can change it anytime — or skip for now."
      onNext={() => save(() => navigation.navigate('About'))}
      loading={busy}
      onBack={() => navigation.goBack()}
      onSkip={() => navigation.navigate('About')}
    >
      <FieldLabel>I am</FieldLabel>
      <View style={styles.wrap}>
        {genderOptions.map((g) => (
          <Chip key={g} label={g} on={gender === g} onPress={() => setGender(gender === g ? '' : g)} />
        ))}
      </View>

      <View style={{ height: spacing.lg }} />

      <FieldLabel>Interested in</FieldLabel>
      <View style={styles.wrap}>
        {genderOptions.map((g) => (
          <Chip key={g} label={g} on={pref.includes(g)} onPress={() => togglePref(g)} />
        ))}
      </View>
      {err ? <Text style={authText.error}>{err}</Text> : null}
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1.5,
    borderColor: darkColors.border,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: darkColors.surface
  },
  chipOn: { borderColor: darkColors.primary, backgroundColor: 'rgba(232,65,90,0.15)' },
  chipText: { color: darkColors.textMuted, fontWeight: '700', fontSize: 14 },
  chipTextOn: { color: darkColors.primary }
});
