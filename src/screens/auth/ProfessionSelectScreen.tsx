import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton } from '../../components/GradientButton';
import { PrismBackground } from '../../components/PrismBackground';
import { PROFESSIONS } from '../../constants/professions';
import { useAuth } from '../../hooks/useAuth';
import { updateProfession } from '../../services/apiService';
import { professionTheme } from '../../theme/professionTheme';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function ProfessionSelectScreen() {
  const { token, updateLocalUser, user } = useAuth();
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
    <PrismBackground tint={activeTheme.gradient}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>STEP 1 OF 1</Text>
        <Text style={styles.heading}>Pick your profession</Text>
        <Text style={styles.caption}>
          {user?.name ? `${user.name}, you'll ` : 'You\'ll '}match with people in your field. This becomes
          your signature colour.
        </Text>

        <View style={styles.grid}>
          {PROFESSIONS.map((profession) => {
            const theme = professionTheme(profession);
            const isSelected = selected === profession;

            return (
              <Pressable
                key={profession}
                onPress={() => setSelected(profession)}
                style={styles.cardWrap}
              >
                {isSelected ? (
                  <LinearGradient
                    colors={theme.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.card, styles.cardSelected]}
                  >
                    <Text style={styles.cardEmoji}>{theme.emoji}</Text>
                    <Text style={styles.cardLabelSelected}>{profession}</Text>
                    <View style={styles.check}>
                      <Text style={styles.checkMark}>✓</Text>
                    </View>
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

      <View style={styles.footer}>
        {isSubmitting ? (
          <ActivityIndicator color={activeTheme.accent} />
        ) : (
          <GradientButton
            title={selected ? `Continue as ${professionTheme(selected).emoji} ${selected}` : 'Select a profession'}
            onPress={handleSubmit}
            disabled={!selected}
            colors={activeTheme.gradient}
          />
        )}
      </View>
    </PrismBackground>
  );
}

const CARD_BASIS = '48%';

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingTop: spacing.xxl, paddingBottom: spacing.xxl },
  kicker: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '800',
    letterSpacing: 1.5,
    fontSize: 12
  },
  heading: { fontSize: 32, fontWeight: '900', color: colors.text, letterSpacing: -1, marginTop: 4 },
  caption: { ...typography.body, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 22 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    rowGap: spacing.md
  },
  cardWrap: { width: CARD_BASIS },
  card: {
    height: 110,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    justifyContent: 'space-between'
  },
  cardSelected: {
    borderWidth: 0,
    shadowColor: '#16324F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6
  },
  cardEmoji: { fontSize: 30 },
  cardLabel: { fontSize: 15, fontWeight: '800', color: colors.text },
  cardLabelSelected: { fontSize: 15, fontWeight: '900', color: colors.white },
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
  checkMark: { color: colors.white, fontWeight: '900', fontSize: 13 },
  error: { color: '#DC2626', marginTop: spacing.lg, textAlign: 'center' },
  footer: { padding: spacing.lg }
});
