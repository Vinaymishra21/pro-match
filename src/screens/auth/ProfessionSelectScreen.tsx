import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { ScreenContainer } from '../../components/ScreenContainer';
import { PROFESSIONS } from '../../constants/professions';
import { useAuth } from '../../hooks/useAuth';
import { updateProfession } from '../../services/apiService';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function ProfessionSelectScreen() {
  const { token, updateLocalUser, user } = useAuth();
  const [selectedProfession, setSelectedProfession] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    try {
      setIsSubmitting(true);
      setError('');
      const response = await updateProfession(selectedProfession, token);
      await updateLocalUser(response.user);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenContainer>
      <Text style={styles.heading}>Choose Your Profession</Text>
      <Text style={styles.caption}>{user?.name}, matches will be shown only in this profession.</Text>
      <ScrollView contentContainerStyle={styles.list}>
        {PROFESSIONS.map((profession) => {
          const isSelected = selectedProfession === profession;

          return (
            <Pressable
              key={profession}
              onPress={() => setSelectedProfession(profession)}
              style={[styles.chip, isSelected && styles.chipActive]}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{profession}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AppButton
        title={isSubmitting ? 'Saving...' : 'Finish Setup'}
        onPress={handleSubmit}
        disabled={!selectedProfession || isSubmitting}
      />

      {isSubmitting ? <ActivityIndicator color={colors.secondary} style={styles.loader} /> : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heading: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.xs
  },
  caption: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md
  },
  list: {
    paddingBottom: spacing.lg
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: '#3A1F17'
  },
  chipText: {
    ...typography.body,
    color: colors.textMuted
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: '600'
  },
  error: {
    color: '#FCA5A5',
    marginBottom: spacing.md
  },
  loader: {
    marginTop: spacing.md
  }
});
