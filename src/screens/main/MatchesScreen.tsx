import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { PrismBackground } from '../../components/PrismBackground';
import { ReportSheet } from '../../components/ReportSheet';
import { useAuth } from '../../hooks/useAuth';
import { blockUser, getMatches, unmatch } from '../../services/apiService';
import { isProUser } from '../../utils/entitlements';
import { professionTheme } from '../../theme/professionTheme';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { MainTabParamList, MatchRecord, RootStackParamList } from '../../types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Matches'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function MatchesScreen({ navigation }: Props) {
  const { token, user } = useAuth();
  const pro = isProUser(user);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [reportTarget, setReportTarget] = useState<MatchRecord | null>(null);

  const load = useCallback(async () => {
    try {
      setRefreshing(true);
      setError('');
      const res = await getMatches(token);
      setMatches(res.matches || []);
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function openMatch(item: MatchRecord) {
    const locked = item.crossProfession && !pro;
    if (locked) {
      navigation.navigate('Paywall', { focus: 'pro' });
      return;
    }
    navigation.navigate('Chat', {
      matchId: item.id,
      matchName: item.user.name || 'Chat',
      matchUserId: item.user.id
    });
  }

  // Long-press a match → safety actions.
  function openMatchActions(item: MatchRecord) {
    const name = item.user.name || 'this person';
    Alert.alert(name, 'Manage this match', [
      { text: 'Report', onPress: () => setReportTarget(item) },
      {
        text: 'Unmatch',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Unmatch?', `You'll no longer see ${name} or your conversation.`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Unmatch', style: 'destructive', onPress: () => doUnmatch(item) }
          ])
      },
      {
        text: 'Block',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Block?', `${name} won't be able to see or contact you, and you won't see them.`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Block', style: 'destructive', onPress: () => doBlock(item) }
          ])
      },
      { text: 'Cancel', style: 'cancel' }
    ]);
  }

  async function doUnmatch(item: MatchRecord) {
    setMatches((prev) => prev.filter((m) => m.id !== item.id)); // optimistic
    try {
      await unmatch(item.id, token);
    } catch (err) {
      Alert.alert('Could not unmatch', (err as Error).message);
      load();
    }
  }

  async function doBlock(item: MatchRecord) {
    setMatches((prev) => prev.filter((m) => m.id !== item.id)); // optimistic
    try {
      await blockUser(item.user.id, token);
    } catch (err) {
      Alert.alert('Could not block', (err as Error).message);
      load();
    }
  }

  return (
    <PrismBackground bottomInset={false}>
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Matches 💞</Text>
            <Text style={styles.subtitle}>
              {matches.length
                ? `${matches.length} connection${matches.length > 1 ? 's' : ''} · long-press to block or unmatch`
                : 'Your connections live here'}
            </Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>💫</Text>
            <Text style={styles.emptyTitle}>No matches yet</Text>
            <Text style={styles.emptyText}>Keep swiping on Discover to find your professional match.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const theme = professionTheme(item.user.profession);
          const locked = item.crossProfession && !pro;
          const photo = item.user.photos && item.user.photos.length > 0 ? item.user.photos[0] : null;

          return (
            <Pressable
              style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
              onPress={() => openMatch(item)}
              onLongPress={() => openMatchActions(item)}
              delayLongPress={300}
            >
              {photo ? (
                <Image source={{ uri: photo }} style={styles.avatar} />
              ) : (
                <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
                  <Text style={styles.avatarLetter}>{(item.user.name || '?').charAt(0).toUpperCase()}</Text>
                </LinearGradient>
              )}

              <View style={styles.rowText}>
                <Text style={styles.name}>{item.user.name}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaEmoji}>{theme.emoji}</Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {item.user.profession}
                  </Text>
                </View>
              </View>

              {locked ? (
                <View style={styles.lockTag}>
                  <Text style={styles.lockTagText}>⭐ Pro to chat</Text>
                </View>
              ) : (
                <Text style={styles.chevron}>{'›'}</Text>
              )}
            </Pressable>
          );
        }}
      />

      <ReportSheet
        visible={Boolean(reportTarget)}
        userId={reportTarget?.user.id}
        name={reportTarget?.user.name || 'this person'}
        onClose={() => setReportTarget(null)}
        onReported={(blocked) => {
          if (blocked && reportTarget) {
            setMatches((prev) => prev.filter((m) => m.id !== reportTarget.id));
          }
        }}
      />
    </PrismBackground>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg },
  header: { marginBottom: spacing.md },
  title: { fontSize: 30, fontWeight: '900', color: colors.text, letterSpacing: -0.8 },
  subtitle: { ...typography.caption, color: colors.textMuted, fontWeight: '600', marginTop: 2 },
  error: { color: '#DC2626', marginTop: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    shadowColor: '#16324F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2
  },
  rowPressed: { backgroundColor: colors.inputBg },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    overflow: 'hidden'
  },
  avatarLetter: { fontSize: 22, fontWeight: '900', color: colors.white },
  rowText: { flex: 1 },
  name: { ...typography.body, color: colors.text, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  metaEmoji: { fontSize: 12, marginRight: 4 },
  meta: { ...typography.caption, color: colors.textMuted, flex: 1 },
  lockTag: {
    backgroundColor: '#FFF7E6',
    borderWidth: 1,
    borderColor: '#F5C56B',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  lockTagText: { color: '#B45309', fontWeight: '800', fontSize: 11 },
  chevron: { fontSize: 24, color: colors.textMuted, marginLeft: spacing.xs },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyEmoji: { fontSize: 56, marginBottom: spacing.md },
  emptyTitle: { ...typography.subtitle, fontWeight: '900', color: colors.text, marginBottom: spacing.xs },
  emptyText: { ...typography.caption, color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing.lg }
});
