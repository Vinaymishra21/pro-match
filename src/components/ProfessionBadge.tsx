import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { professionTheme } from '../theme/professionTheme';
import { colors } from '../theme/colors';

// A vibrant, profession-coloured pill: emoji + label on the profession's own
// gradient. The signature recurring element of the PRISM system.
export function ProfessionBadge({
  profession,
  size = 'md',
  verified = false
}: {
  profession?: string | null;
  size?: 'sm' | 'md';
  verified?: boolean;
}) {
  const theme = professionTheme(profession);
  return (
    <LinearGradient
      colors={theme.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.pill, size === 'sm' ? styles.sm : styles.md]}
    >
      <Text style={[styles.emoji, size === 'sm' ? styles.emojiSm : null]}>{theme.emoji}</Text>
      <Text style={[styles.label, size === 'sm' ? styles.labelSm : null]} numberOfLines={1}>
        {profession || 'No profession'}
      </Text>
      {verified ? <Text style={[styles.tick, size === 'sm' ? styles.labelSm : null]}> ✓</Text> : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999
  },
  md: { paddingHorizontal: 14, paddingVertical: 7 },
  sm: { paddingHorizontal: 10, paddingVertical: 4 },
  emoji: { fontSize: 15, marginRight: 6 },
  emojiSm: { fontSize: 12, marginRight: 4 },
  label: { color: colors.white, fontWeight: '800', fontSize: 13, letterSpacing: 0.2 },
  labelSm: { fontSize: 11 },
  tick: { color: colors.white, fontWeight: '900', fontSize: 13 }
});
