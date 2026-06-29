import React, { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DarkBackground } from '../../components/DarkBackground';
import { GradientButton } from '../../components/auth/AuthKit';
import { PROFESSIONS } from '../../constants/professions';
import { useAuth } from '../../hooks/useAuth';
import { updateProfession } from '../../services/apiService';
import { professionTheme } from '../../theme/professionTheme';
import { darkColors } from '../../theme/darkColors';
import { spacing } from '../../theme/spacing';

export function ProfessionSelectScreen() {
  const { token, updateLocalUser, user } = useAuth();
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, Platform.OS === 'android' ? 28 : 0);
  const [selected, setSelected] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const activeTheme = professionTheme(selected || null);

  async function handleSubmit() {
    try {
      setIsSubmitting(true);
      setError('');
      const response = await updateProfession(selected, token);
      await updateLocalUser(response.user);
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DarkBackground orbColor={activeTheme.accent + '40'}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: topPad + spacing.lg }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>★ YOUR SUPERPOWER · STEP 1</Text>
        <Text style={styles.heading}>Pick your profession</Text>
        <Text style={styles.caption}>
          {user?.name ? `${user.name}, you'll ` : 'You’ll '}match with people in your field — and it becomes your signature colour across the app.
        </Text>

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

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        {isSubmitting ? (
          <ActivityIndicator color={activeTheme.accent} />
        ) : (
          <GradientButton
            title={selected ? `Continue as ${professionTheme(selected).emoji} ${selected}` : 'Select a profession'}
            onPress={handleSubmit}
            disabled={!selected}
          />
        )}
      </View>
    </DarkBackground>
  );
}

const CARD_BASIS = '48%';

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  kicker: { color: darkColors.brandText, fontWeight: '800', letterSpacing: 1, fontSize: 11 },
  heading: { fontSize: 32, fontWeight: '900', color: darkColors.text, letterSpacing: -1, marginTop: 6 },
  caption: { color: darkColors.textMuted, fontSize: 15, marginTop: spacing.sm, lineHeight: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: spacing.xl, rowGap: spacing.md },
  cardWrap: { width: CARD_BASIS },
  card: {
    height: 110,
    borderRadius: 22,
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
  cardEmoji: { fontSize: 30 },
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
  checkMark: { color: '#fff', fontWeight: '900', fontSize: 13 },
  error: { color: darkColors.danger, marginTop: spacing.lg, textAlign: 'center' },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm }
});
