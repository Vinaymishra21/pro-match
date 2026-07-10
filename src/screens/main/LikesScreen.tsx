import { useCallback, useState } from 'react';
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
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { DarkBackground } from '../../components/DarkBackground';
import { useTopInset } from '../../hooks/useTopInset';
import { MatchCelebration, type MatchInfo } from '../../components/MatchCelebration';
import { ProfileDetailModal } from '../../components/ProfileDetailModal';
import { WovnnLoader } from '../../components/WovnnLoader';
import { useAuth } from '../../hooks/useAuth';
import { getIncomingLikes, revealLiker, swipeProfile } from '../../services/apiService';
import { ApiError } from '../../services/apiClient';
import { professionTheme } from '../../theme/professionTheme';
import { gradients } from '../../theme/gradients';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme/themes';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import type { DiscoverProfile, IncomingLike, MainTabParamList, RootStackParamList } from '../../types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Likes'>,
  NativeStackScreenProps<RootStackParamList>
>;

const COLUMN_GAP = spacing.md;
const CARD_WIDTH = (Dimensions.get('window').width - spacing.lg * 2 - COLUMN_GAP) / 2;
// Explicit height (was `aspectRatio: 0.74`). The revealed card has ONLY
// absolutely-positioned children, so it has no intrinsic height — if Yoga
// doesn't resolve the aspect ratio it collapses to 0 and the card vanishes.
// The blurred card never hit this because `mystery` is an in-flow flex child.
const CARD_HEIGHT = CARD_WIDTH / 0.74;

// "An" before vowel-initial professions ("An Architect"), "A" otherwise.
// Mirrors the server's teaser phrasing — this is only the fallback.
function articleFor(word: string) {
  return /^[aeiou]/i.test(word || '') ? 'An' : 'A';
}

export function LikesScreen({ navigation }: Props) {
  const { token, user } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const topPad = useTopInset();
  const [likes, setLikes] = useState<IncomingLike[]>([]);
  const [isPro, setIsPro] = useState(false);
  const [credits, setCredits] = useState(0);
  // Fallback only — the server sends the real cost with every likes fetch.
  const [revealCost, setRevealCost] = useState(20);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [revealingId, setRevealingId] = useState<string | null>(null);
  // Tapping an unblurred card opens the full profile. These people already
  // liked you, so liking back is always a match; passing removes them.
  const [detail, setDetail] = useState<IncomingLike | null>(null);
  const [celebration, setCelebration] = useState<(MatchInfo & { matchId: string }) | null>(null);

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

  function removeLike(likerId: string) {
    setLikes((prev) => prev.filter((l) => l.likerId !== likerId));
  }

  // They already liked you → liking back always creates a match.
  async function handleLike() {
    const target = detail;
    if (!target) return;
    setDetail(null);
    try {
      const res = await swipeProfile({ toUserId: target.likerId, action: 'like' }, token);
      removeLike(target.likerId);
      if (res.matched && res.match) {
        setCelebration({
          matchId: res.match.id,
          name: target.name,
          profession: target.profession,
          photo: target.photos?.[0],
          myPhoto: user?.photos?.[0],
          superLike: res.theySuperLiked ? 'them' : (res.iSuperLiked ?? res.superLike) ? 'you' : null
        });
      }
    } catch (e) {
      Alert.alert('Could not like', (e as Error).message);
    }
  }

  // Passing drops them from your likes for good.
  async function handlePass() {
    const target = detail;
    if (!target) return;
    setDetail(null);
    try {
      await swipeProfile({ toUserId: target.likerId, action: 'pass' }, token);
      removeLike(target.likerId);
    } catch (e) {
      Alert.alert('Could not pass', (e as Error).message);
    }
  }

  function confirmReveal(like: IncomingLike) {
    if (credits < revealCost) {
      Alert.alert(
        'Not enough credits',
        `Revealing one person costs ${revealCost} credits (you have ${credits}). Pro shows everyone who likes you — no reveal costs.`,
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Get credits', onPress: () => navigation.navigate('Paywall', { focus: 'credits' }) },
          { text: 'Go Pro ⭐', onPress: () => navigation.navigate('Paywall', { focus: 'pro' }) }
        ]
      );
      return;
    }

    Alert.alert(
      'Reveal this person?',
      `Spend ${revealCost} credits to see who in ${like.profession} liked you. Pro shows everyone who likes you — no credits needed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Go Pro ⭐', onPress: () => navigation.navigate('Paywall', { focus: 'pro' }) },
        { text: `Reveal (${revealCost})`, onPress: () => doReveal(like) }
      ]
    );
  }

  async function doReveal(like: IncomingLike) {
    try {
      setRevealingId(like.likerId);
      const res = await revealLiker(like.likerId, token);
      setCredits(res.credits);
      // Optimistic: open the tapped card immediately. Merge into the LATEST list
      // by likerId so previously-revealed cards are never dropped.
      setLikes((prev) =>
        prev.map((l) => (l.likerId === like.likerId ? { ...l, ...res.liker } : l))
      );
      // Reconcile with the server (source of truth) so every already-revealed
      // like stays revealed regardless of local state.
      load();
    } catch (err) {
      const e = err as ApiError;
      // Out of credits → straight to the buy-credits / Pro paywall.
      if (e.code === 'INSUFFICIENT_CREDITS') {
        navigation.navigate('Paywall', { focus: 'credits' });
        return;
      }
      Alert.alert('Could not reveal', e.message);
    } finally {
      setRevealingId(null);
    }
  }

  const blurredCount = likes.filter((l) => l.blurred).length;

  return (
    <DarkBackground orbColor="rgba(139,92,246,0.22)">
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + spacing.md }
        ]}
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
            <Pressable
              style={({ pressed }) => [styles.creditChip, pressed ? { opacity: 0.6 } : null]}
              onPress={() => navigation.navigate('Paywall', { focus: 'credits' })}
            >
              <Text style={styles.creditChipText}>🪙 {credits} credits ›</Text>
            </Pressable>
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
            <WovnnLoader message="Loading your likes" />
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
                onOpen={() => setDetail(like)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* A revealed like IS a full public profile — the modal only reads
          profile fields, so the cast is safe. */}
      <ProfileDetailModal
        profile={(detail as unknown as DiscoverProfile) ?? null}
        visible={Boolean(detail)}
        onClose={() => setDetail(null)}
        onLike={handleLike}
        onPass={handlePass}
      />

      {celebration ? (
        <MatchCelebration
          key={celebration.matchId}
          match={celebration}
          onKeepSwiping={() => setCelebration(null)}
          onSendMessage={() => {
            const c = celebration;
            setCelebration(null);
            navigation.navigate('Chat', { matchId: c.matchId, matchName: c.name || 'Chat' });
          }}
        />
      ) : null}
    </DarkBackground>
  );
}

function LikeCard({
  like,
  revealing,
  revealCost,
  onReveal,
  onOpen
}: {
  like: IncomingLike;
  revealing: boolean;
  revealCost: number;
  onReveal: () => void;
  onOpen: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const theme = professionTheme(like.profession);
  const isSuper = Boolean(like.superLike);

  if (like.blurred) {
    return (
      <Pressable style={[styles.card, isSuper && styles.cardSuper]} onPress={onReveal} disabled={revealing}>
        <LinearGradient colors={theme.gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        {/* Mystery silhouette */}
        <View style={styles.mystery}>
          <Text style={styles.mysteryEmoji}>{theme.emoji}</Text>
        </View>
        {/* Frosted lock overlay */}
        <BlurView intensity={38} tint="dark" style={styles.lockOverlay}>
          {revealing ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.lockTeaser} numberOfLines={2}>
                {like.teaser || `${articleFor(like.profession)} ${like.profession} liked you`}
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
        {isSuper ? (
          <View style={styles.superRibbon}>
            <Text style={styles.superRibbonText}>★ SUPER LIKE</Text>
          </View>
        ) : null}
      </Pressable>
    );
  }

  // Revealed card
  const photo = like.photos && like.photos.length > 0 ? like.photos[0] : null;
  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [styles.card, isSuper && styles.cardSuper, pressed ? { opacity: 0.92 } : null]}
    >
      {/* Always paint a gradient base: a missing OR failed-to-load photo can
          then never leave a blank card. The photo simply covers it when it loads. */}
      <LinearGradient colors={theme.gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.mystery}>
          <Text style={styles.avatarLetter}>{(like.name || '?').charAt(0).toUpperCase()}</Text>
        </View>
      </LinearGradient>
      {photo ? (
        <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : null}
      {isSuper ? (
        <View style={styles.superRibbon}>
          <Text style={styles.superRibbonText}>★ SUPER LIKE</Text>
        </View>
      ) : null}
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
    </Pressable>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
    header: { marginBottom: spacing.lg },
    kicker: {
      ...typography.eyebrow,
      color: c.primary,
      marginBottom: 4
    },
    title: {
      fontFamily: fonts.displayBold,
      fontSize: 30,
      lineHeight: 38,
      fontWeight: '700',
      color: c.text,
      letterSpacing: -0.5,
      marginBottom: spacing.sm
    },
    creditChip: {
      alignSelf: 'flex-start',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 7
    },
    proChip: {
      backgroundColor: 'rgba(251,191,36,0.15)',
      borderColor: 'rgba(251,191,36,0.5)'
    },
    creditChipText: { fontWeight: '800', color: c.text, fontSize: 13 },
    // Gold banner keeps its own on-gradient palette (dark-amber text, gold glow).
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
      height: CARD_HEIGHT,
      borderRadius: 22,
      overflow: 'hidden',
      backgroundColor: c.card,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 4
    },
    cardSuper: { borderWidth: 2, borderColor: c.gold },
    // Ribbon sits ON the photo/gradient card — keep the bright gold + dark text
    // pairing byte-identical in both modes ('#FBBF24' = dark palette's gold).
    superRibbon: {
      position: 'absolute',
      top: 10,
      left: 10,
      backgroundColor: '#FBBF24',
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
      zIndex: 5
    },
    superRibbonText: { color: '#1A1206', fontWeight: '900', fontSize: 10, letterSpacing: 0.5 },
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
    // Sits inside the dark-tinted BlurView over the gradient card — stays white
    // in both modes (dark palette's text === white).
    lockTeaser: {
      color: c.white,
      fontWeight: '800',
      fontSize: 13,
      textAlign: 'center',
      marginBottom: spacing.sm
    },
    crossTag: {
      backgroundColor: 'rgba(129,140,248,0.28)',
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 2,
      marginBottom: spacing.sm
    },
    crossTagText: { color: '#C7D2FE', fontWeight: '800', fontSize: 10, letterSpacing: 0.3 },
    revealBtn: {
      backgroundColor: c.primary,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8
    },
    revealBtnText: { color: c.white, fontWeight: '800', fontSize: 12 },
    captionFade: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.xl,
      paddingBottom: spacing.sm
    },
    // On the photo's dark fade — white in both modes.
    cardName: { color: c.white, fontWeight: '900', fontSize: 16 },
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
    emptyTitle: { ...typography.subtitle, fontWeight: '900', color: c.text, marginBottom: spacing.xs },
    emptyText: { ...typography.caption, color: c.textMuted, textAlign: 'center', lineHeight: 20 }
  });
