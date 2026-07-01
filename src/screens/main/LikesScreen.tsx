import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { DarkBackground } from '../../components/DarkBackground';
import { GradientButton } from '../../components/GradientButton';
import { useAuth } from '../../hooks/useAuth';
import { getIncomingLikes, revealLiker } from '../../services/apiService';
import { professionTheme } from '../../theme/professionTheme';
import { gradients } from '../../theme/gradients';
import { colorsDark as colors } from '../../theme/colorsDark';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { IncomingLike, MainTabParamList, RootStackParamList } from '../../types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Likes'>,
  NativeStackScreenProps<RootStackParamList>
>;

const COLUMN_GAP = spacing.md;
const CARD_WIDTH = (Dimensions.get('window').width - spacing.lg * 2 - COLUMN_GAP) / 2;

export function LikesScreen({ navigation }: Props) {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const [likes, setLikes] = useState<IncomingLike[]>([]);
  const [isPro, setIsPro] = useState(false);
  const [credits, setCredits] = useState(0);
  const [revealCost, setRevealCost] = useState(10);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [revealingId, setRevealingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await getIncomingLikes(token);
      setLikes(res.likes || []);
      setIsPro(res.isPro);
      setCredits(res.credits);
      setRevealCost(res.revealCost);
    } catch (err) {
      // Quietly ignore; pull-to-refresh lets the user retry.
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function confirmReveal(like: IncomingLike) {
    if (credits < revealCost) {
      Alert.alert(
        'Not enough credits',
        `Revealing one person costs ${revealCost} credits (you have ${credits}). Buy credits or go Pro to see everyone.`,
        [
          { text: 'Maybe later', style: 'cancel' },
          { text: 'Get credits', onPress: () => navigation.navigate('Paywall', { focus: 'credits' }) }
        ]
      );
      return;
    }

    Alert.alert(
      'Reveal this person?',
      `Spend ${revealCost} credits to see who in ${like.profession} liked you.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: `Reveal (${revealCost})`, onPress: () => doReveal(like) }
      ]
    );
  }

  async function doReveal(like: IncomingLike) {
    try {
      setRevealingId(like.likerId);
      const res = await revealLiker(like.likerId, token);
      setCredits(res.credits);
      setLikes((prev) => prev.map((l) => (l.likerId === like.likerId ? res.liker : l)));
    } catch (err) {
      Alert.alert('Could not reveal', (err as Error).message);
    } finally {
      setRevealingId(null);
    }
  }

  const blurredCount = likes.filter((l) => l.blurred).length;

  return (
    <DarkBackground orbColor="rgba(139,92,246,0.22)">
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.md }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.kicker}>WHO LIKES YOU</Text>
          <Text style={styles.title}>
            {likes.length > 0 ? `${likes.length} ` : ''}
            {likes.length === 1 ? 'person likes you' : 'people like you'} 💘
          </Text>
          {!isPro ? (
            <View style={styles.creditChip}>
              <Text style={styles.creditChipText}>🪙 {credits} credits</Text>
            </View>
          ) : (
            <View style={[styles.creditChip, styles.proChip]}>
              <Text style={styles.creditChipText}>⭐ PRO · everyone unlocked</Text>
            </View>
          )}
        </View>

        {/* Pro upsell banner (only when there are blurred likes) */}
        {!isPro && blurredCount > 0 ? (
          <Pressable onPress={() => navigation.navigate('Paywall', { focus: 'pro' })}>
            <LinearGradient
              colors={gradients.gold}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.upsell}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.upsellTitle}>See everyone at once ⭐</Text>
                <Text style={styles.upsellSub}>
                  Go Pro to unblur all {blurredCount} {blurredCount === 1 ? 'like' : 'likes'} instantly.
                </Text>
              </View>
              <Text style={styles.upsellArrow}>→</Text>
            </LinearGradient>
          </Pressable>
        ) : null}

        {/* Content */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : likes.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🫶</Text>
            <Text style={styles.emptyTitle}>No likes yet</Text>
            <Text style={styles.emptyText}>
              Keep showing up on Discover — when someone likes you, they'll appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {likes.map((like) => (
              <LikeCard
                key={like.likerId}
                like={like}
                revealing={revealingId === like.likerId}
                revealCost={revealCost}
                onReveal={() => confirmReveal(like)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </DarkBackground>
  );
}

function LikeCard({
  like,
  revealing,
  revealCost,
  onReveal
}: {
  like: IncomingLike;
  revealing: boolean;
  revealCost: number;
  onReveal: () => void;
}) {
  const theme = professionTheme(like.profession);

  if (like.blurred) {
    return (
      <Pressable style={styles.card} onPress={onReveal} disabled={revealing}>
        <LinearGradient colors={theme.gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        {/* Mystery silhouette */}
        <View style={styles.mystery}>
          <Text style={styles.mysteryEmoji}>{theme.emoji}</Text>
        </View>
        {/* Frosted lock overlay */}
        <BlurView intensity={38} tint="light" style={styles.lockOverlay}>
          {revealing ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.lockTeaser} numberOfLines={2}>
                Someone in {like.profession} liked you
              </Text>
              {like.crossProfession ? (
                <View style={styles.crossTag}>
                  <Text style={styles.crossTagText}>cross-profession</Text>
                </View>
              ) : null}
              <View style={styles.revealBtn}>
                <Text style={styles.revealBtnText}>Reveal · {revealCost} 🪙</Text>
              </View>
            </>
          )}
        </BlurView>
      </Pressable>
    );
  }

  // Revealed card
  const photo = like.photos && like.photos.length > 0 ? like.photos[0] : null;
  return (
    <View style={styles.card}>
      {photo ? (
        <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <LinearGradient colors={theme.gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.mystery}>
            <Text style={styles.avatarLetter}>{(like.name || '?').charAt(0).toUpperCase()}</Text>
          </View>
        </LinearGradient>
      )}
      <LinearGradient colors={['transparent', 'rgba(8,12,24,0.85)']} style={styles.captionFade}>
        <Text style={styles.cardName} numberOfLines={1}>
          {like.name}
          {like.age ? `, ${like.age}` : ''}
        </Text>
        <View style={styles.cardProfRow}>
          <Text style={styles.cardProfEmoji}>{theme.emoji}</Text>
          <Text style={styles.cardProf} numberOfLines={1}>
            {like.profession}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { marginBottom: spacing.lg },
  kicker: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '800',
    letterSpacing: 1.5,
    fontSize: 12,
    marginBottom: 4
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.8,
    marginBottom: spacing.sm
  },
  creditChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7
  },
  proChip: {
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderColor: 'rgba(251,191,36,0.5)'
  },
  creditChipText: { fontWeight: '800', color: colors.text, fontSize: 13 },
  upsell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 5
  },
  upsellTitle: { color: '#3A2A00', fontWeight: '900', fontSize: 16 },
  upsellSub: { color: '#5C4500', fontWeight: '600', fontSize: 13, marginTop: 2 },
  upsellArrow: { color: '#3A2A00', fontSize: 24, fontWeight: '900', marginLeft: spacing.sm },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: COLUMN_GAP
  },
  card: {
    width: CARD_WIDTH,
    aspectRatio: 0.74,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.card,
    shadowColor: '#16324F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4
  },
  mystery: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mysteryEmoji: { fontSize: 64, opacity: 0.5 },
  avatarLetter: { fontSize: 56, fontWeight: '900', color: 'rgba(255,255,255,0.85)' },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm
  },
  lockIcon: { fontSize: 26, marginBottom: 6 },
  lockTeaser: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: spacing.sm
  },
  crossTag: {
    backgroundColor: 'rgba(99,102,241,0.18)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: spacing.sm
  },
  crossTagText: { color: '#4F46E5', fontWeight: '800', fontSize: 10, letterSpacing: 0.3 },
  revealBtn: {
    backgroundColor: colors.text,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  revealBtnText: { color: colors.white, fontWeight: '800', fontSize: 12 },
  captionFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm
  },
  cardName: { color: colors.white, fontWeight: '900', fontSize: 16 },
  cardProfRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  cardProfEmoji: { fontSize: 12, marginRight: 4 },
  cardProf: { color: 'rgba(255,255,255,0.9)', fontWeight: '700', fontSize: 12, flex: 1 },
  center: { paddingVertical: spacing.xxl, alignItems: 'center' },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg
  },
  emptyEmoji: { fontSize: 56, marginBottom: spacing.md },
  emptyTitle: { ...typography.subtitle, fontWeight: '900', color: colors.text, marginBottom: spacing.xs },
  emptyText: { ...typography.caption, color: colors.textMuted, textAlign: 'center', lineHeight: 20 }
});
