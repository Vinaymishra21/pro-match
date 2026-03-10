import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { AppHeader } from '../../components/AppHeader';
import { FilterModal } from '../../components/FilterModal';
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
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(FilterModal.DEFAULT_FILTERS);

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

  function handleApplyFilters(next) {
    setFilters(next);
  }

  const activeFilterCount = countActiveFilters(filters);

  if (isLoading) {
    return (
      <ScreenContainer>
        <AppHeader onSettingsPress={() => setShowFilters(true)} />
        <View style={styles.center}>
          <ActivityIndicator color={colors.secondary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <AppHeader
        onSettingsPress={() => setShowFilters(true)}
        trailing={
          activeFilterCount > 0 ? (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          ) : null
        }
      />

      <Text style={styles.professionTag}>{user?.profession || 'All Professions'}</Text>

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

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={handleApplyFilters}
      />
    </ScreenContainer>
  );
}

function countActiveFilters(filters) {
  const defaults = FilterModal.DEFAULT_FILTERS;
  let count = 0;
  if (filters.ageRange[0] !== defaults.ageRange[0] || filters.ageRange[1] !== defaults.ageRange[1]) count++;
  if (filters.distance !== defaults.distance) count++;
  if (filters.gender !== defaults.gender) count++;
  if (filters.activity !== defaults.activity) count++;
  if (filters.verified !== defaults.verified) count++;
  if (filters.lookingFor.length > 0) count++;
  if (!filters.showProfessionOnly && filters.professions.length > 0) count++;
  if (filters.showProfessionOnly !== defaults.showProfessionOnly) count++;
  return count;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  professionTag: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    backgroundColor: '#FDEEE8',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: spacing.md
  },
  filterBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -6,
    right: -6
  },
  filterBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800'
  },
  error: {
    color: '#FCA5A5',
    marginBottom: spacing.md
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1
  },
  name: {
    ...typography.subtitle,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.xs
  },
  profession: {
    ...typography.body,
    color: colors.secondary,
    fontWeight: '600',
    marginBottom: spacing.sm
  },
  bio: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 20,
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
    borderRadius: 18,
    padding: spacing.lg
  },
  emptyTitle: {
    ...typography.subtitle,
    color: colors.text,
    fontWeight: '700',
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
