import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppHeader } from '../../components/AppHeader';
import { DEFAULT_FILTERS, FilterModal } from '../../components/FilterModal';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';
import { getMatches } from '../../services/apiService';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { FilterState, MainTabParamList, MatchRecord, RootStackParamList } from '../../types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Matches'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function MatchesScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS as FilterState);

  const loadMatches = useCallback(async () => {
    try {
      setRefreshing(true);
      setError('');
      const response = await getMatches(token);
      setMatches(response.matches || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  return (
    <ScreenContainer>
      <AppHeader onSettingsPress={() => setShowFilters(true)} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadMatches} tintColor={colors.secondary} />}
        ListHeaderComponent={
          <Text style={styles.matchCount}>
            {matches.length ? `${matches.length} match${matches.length > 1 ? 'es' : ''}` : ''}
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No matches yet</Text>
            <Text style={styles.emptyText}>Keep swiping on Discover to find your professional match.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
            onPress={() => navigation.navigate('Chat', { matchId: item.id, matchName: item.user.name })}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>
                {(item.user.name || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.rowText}>
              <Text style={styles.name}>{item.user.name}</Text>
              <Text style={styles.meta}>{item.user.profession}</Text>
            </View>
            <Text style={styles.chevron}>{'\u203A'}</Text>
          </Pressable>
        )}
      />

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={setFilters}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  matchCount: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: spacing.sm
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1
  },
  rowPressed: {
    backgroundColor: colors.inputBg
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm
  },
  avatarLetter: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary
  },
  rowText: {
    flex: 1
  },
  name: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700'
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2
  },
  chevron: {
    fontSize: 24,
    color: colors.textMuted,
    marginLeft: spacing.xs
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: spacing.lg,
    alignItems: 'center'
  },
  emptyTitle: {
    ...typography.subtitle,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.xs
  },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center'
  },
  error: {
    color: '#FCA5A5',
    marginBottom: spacing.md
  }
});
