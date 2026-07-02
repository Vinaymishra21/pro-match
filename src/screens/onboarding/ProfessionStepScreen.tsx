import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { authText } from '../../components/auth/AuthKit';
import { OnboardingScaffold } from './OnboardingScaffold';
import { TOTAL_STEPS, useOnboarding } from './OnboardingContext';
import { PROFESSIONS } from '../../constants/professions';
import { professionTheme } from '../../theme/professionTheme';
import { darkColors } from '../../theme/darkColors';
import { spacing } from '../../theme/spacing';

export function ProfessionStepScreen({ navigation }: any) {
  const { draft, persist } = useOnboarding();
  const [selected, setSelected] = useState(draft.profession);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function next() {
    if (!selected) return;
    try {
      setBusy(true);
      setErr('');
      await persist({ profession: selected });
      navigation.navigate('Photos');
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <OnboardingScaffold
      step={3}
      total={TOTAL_STEPS}
      title="What's your profession?"
      subtitle="Your superpower — you'll match within your field, and it becomes your signature colour across the app."
      onNext={next}
      nextLabel={selected ? `Continue as ${professionTheme(selected).emoji} ${selected}` : 'Select a profession'}
      nextDisabled={!selected}
      loading={busy}
      onBack={() => navigation.goBack()}
    >
      <View style={styles.grid}>
        {PROFESSIONS.map((profession) => {
          const theme = professionTheme(profession);
          const isSelected = selected === profession;
          return (
            <Pressable key={profession} onPress={() => setSelected(profession)} style={styles.cardWrap}>
              {isSelected ? (
                <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, styles.cardSelected]}>
                  <Text style={styles.cardEmoji}>{theme.emoji}</Text>
                  <Text style={styles.cardLabelSelected}>{profession}</Text>
                  <View style={styles.check}><Text style={styles.checkMark}>✓</Text></View>
                </LinearGradient>
              ) : (
                <View style={styles.card}>
                  <Text style={styles.cardEmoji}>{theme.emoji}</Text>
                  <Text style={styles.cardLabel}>{profession}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
      {err ? <Text style={authText.error}>{err}</Text> : null}
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.md },
  cardWrap: { width: '48%' },
  card: {
    height: 104,
    borderRadius: 20,
    backgroundColor: darkColors.surface,
    borderWidth: 1,
    borderColor: darkColors.border,
    padding: spacing.md,
    justifyContent: 'space-between'
  },
  cardSelected: {
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6
  },
  cardEmoji: { fontSize: 28 },
  cardLabel: { fontSize: 15, fontWeight: '800', color: darkColors.text },
  cardLabelSelected: { fontSize: 15, fontWeight: '900', color: '#fff' },
  check: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkMark: { color: '#fff', fontWeight: '900', fontSize: 13 }
});
