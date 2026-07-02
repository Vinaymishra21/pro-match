import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FieldLabel, authText } from '../../components/auth/AuthKit';
import { OnboardingScaffold, OnbInput } from './OnboardingScaffold';
import { TOTAL_STEPS, useOnboarding } from './OnboardingContext';
import { darkColors } from '../../theme/darkColors';

const MAX = 500;

export function AboutStepScreen({ navigation }: any) {
  const { draft, persist } = useOnboarding();
  const [bio, setBio] = useState(draft.bio);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function save(goNext: () => void) {
    try {
      setBusy(true);
      setErr('');
      await persist({ bio: bio.trim() });
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
      title="Write a short bio"
      subtitle="A line or two about you — what you're into, what a good match looks like. You can skip and add it later."
      onNext={() => save(() => navigation.navigate('Finish'))}
      loading={busy}
      onBack={() => navigation.goBack()}
      onSkip={() => navigation.navigate('Finish')}
    >
      <FieldLabel>About you</FieldLabel>
      <OnbInput
        value={bio}
        onChangeText={(t) => setBio(t.slice(0, MAX))}
        placeholder="e.g. Architect who over-orders at restaurants. Looking for someone to explore the city with."
        multiline
        style={styles.textarea}
      />
      <View style={styles.counterRow}>
        <Text style={styles.counter}>{bio.length}/{MAX}</Text>
      </View>
      {err ? <Text style={authText.error}>{err}</Text> : null}
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  textarea: { minHeight: 130, textAlignVertical: 'top', paddingTop: 14 },
  counterRow: { alignItems: 'flex-end', marginTop: 6 },
  counter: { color: darkColors.textFaint, fontSize: 12, fontWeight: '600' }
});
