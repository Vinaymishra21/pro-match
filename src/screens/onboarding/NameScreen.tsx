import React, { useState } from 'react';
import { Text } from 'react-native';
import { FieldLabel, authText } from '../../components/auth/AuthKit';
import { OnboardingScaffold, OnbInput } from './OnboardingScaffold';
import { TOTAL_STEPS, useOnboarding } from './OnboardingContext';

export function NameScreen({ navigation }: any) {
  const { draft, persist } = useOnboarding();
  const [name, setName] = useState(draft.name);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const valid = name.trim().length >= 2;

  async function next() {
    if (!valid) return;
    try {
      setBusy(true);
      setErr('');
      await persist({ name: name.trim() });
      navigation.navigate('Dob');
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <OnboardingScaffold
      step={1}
      total={TOTAL_STEPS}
      title="What's your name?"
      subtitle="This is how you'll appear on Pro Match. Use your real first name."
      onNext={next}
      nextDisabled={!valid}
      loading={busy}
    >
      <FieldLabel>Full name</FieldLabel>
      <OnbInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Aarav Sharma"
        autoCapitalize="words"
        autoFocus
        returnKeyType="next"
        onSubmitEditing={next}
      />
      {err ? <Text style={authText.error}>{err}</Text> : null}
    </OnboardingScaffold>
  );
}
