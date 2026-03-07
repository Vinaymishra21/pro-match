import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text } from 'react-native';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';
import { getMatches } from '../../services/apiService';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function MatchesScreen({ navigation }) {
  const { token } = useAuth();
  const [matches, setMatches] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

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
      <Text style={styles.heading}>Matches</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadMatches} tintColor={colors.secondary} />}
        ListEmptyComponent={<Text style={styles.empty}>No matches yet. Keep swiping.</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate('Chat', { matchId: item.id, matchName: item.user.name })}
          >
            <Text style={styles.name}>{item.user.name}</Text>
            <Text style={styles.meta}>{item.user.profession}</Text>
          </Pressable>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heading: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.md
  },
  row: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm
  },
  name: {
    ...typography.subtitle,
    color: colors.text
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4
  },
  empty: {
    color: colors.textMuted
  },
  error: {
    color: '#FCA5A5',
    marginBottom: spacing.md
  }
});
