import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';
import { getDiscoverProfiles, swipeProfile } from '../../services/apiService';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function DiscoverScreen() {
  const { token, user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const current = profiles[0] || null;

  const loadProfiles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await getDiscoverProfiles(token);
      setProfiles(response.profiles || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  async function handleSwipe(action) {
    if (!current) {
      return;
    }

    try {
      setIsSubmitting(true);
      await swipeProfile({ toUserId: current.id, action }, token);
      setProfiles((prev) => prev.slice(1));
    } catch (swipeError) {
      setError(swipeError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <ActivityIndicator color={colors.secondary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text style={styles.heading}>Discover</Text>
      <Text style={styles.caption}>Profession: {user?.profession}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!current ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No more profiles right now</Text>
          <Text style={styles.emptyText}>Check again later for new matches in your profession.</Text>
          <View style={styles.reloadButton}>
            <AppButton title="Refresh" onPress={loadProfiles} />
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.name}>{current.name}{current.age ? `, ${current.age}` : ''}</Text>
          <Text style={styles.profession}>{current.profession}</Text>
          <Text style={styles.bio}>{current.bio || 'No bio yet.'}</Text>

          <View style={styles.actions}>
            <View style={styles.actionButton}>
              <AppButton title={isSubmitting ? '...' : 'Pass'} onPress={() => handleSwipe('pass')} disabled={isSubmitting} />
            </View>
            <View style={styles.actionButton}>
              <AppButton title={isSubmitting ? '...' : 'Like'} onPress={() => handleSwipe('like')} disabled={isSubmitting} />
            </View>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
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
  error: {
    color: '#FCA5A5',
    marginBottom: spacing.md
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg
  },
  name: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.xs
  },
  profession: {
    ...typography.body,
    color: colors.secondary,
    marginBottom: spacing.sm
  },
  bio: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.lg
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  actionButton: {
    flex: 1
  },
  empty: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.lg
  },
  emptyTitle: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.xs
  },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted
  },
  reloadButton: {
    marginTop: spacing.md
  }
});
