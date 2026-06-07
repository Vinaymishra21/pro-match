import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { PrismBackground } from '../../components/PrismBackground';
import { ProfessionBadge } from '../../components/ProfessionBadge';
import { GradientButton } from '../../components/GradientButton';
import { DEFAULT_FILTERS, FilterModal } from '../../components/FilterModal';
import { PROFESSIONS } from '../../constants/professions';
import { useAuth } from '../../hooks/useAuth';
import { getDiscoverProfiles, swipeProfile } from '../../services/apiService';
import { ApiError } from '../../services/apiClient';
import type { FilterState } from '../../types';
import { professionTheme } from '../../theme/professionTheme';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { DiscoverProfile, MainTabParamList, RootStackParamList, UnlockState } from '../../types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Discover'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function DiscoverScreen({ navigation }: Props) {
  const { token, user } = useAuth();
  const myProfession = user?.profession || '';

  const [activeProfession, setActiveProfession] = useState(myProfession);
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [unlock, setUnlock] = useState<UnlockState | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [locked, setLocked] = useState(false); // genuinely profession-locked (needs Pro)
  const [error, setError] = useState(''); // generic/network error
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS as FilterState);

  const current = profiles[0] || null;
  const viewingTheme = professionTheme(activeProfession);

  // --- Swipe-gesture animation state ---
  const SCREEN_W = Dimensions.get('window').width;
  const SWIPE_THRESHOLD = SCREEN_W * 0.28;
  const pan = useRef(new Animated.ValueXY()).current;
  // Reset the card position whenever the top card changes.
  useEffect(() => {
    pan.setValue({ x: 0, y: 0 });
  }, [current?.id, pan]);

  // Count non-default filters for the badge on the filter button.
  const activeFilterCount =
    (filters.gender.length > 0 ? 1 : 0) +
    (filters.lookingFor.length > 0 ? 1 : 0) +
    (filters.religions.length > 0 ? 1 : 0) +
    (filters.languages.length > 0 ? 1 : 0) +
    (filters.verifiedOnly ? 1 : 0) +
    (filters.ageRange[0] !== 22 || filters.ageRange[1] !== 35 ? 1 : 0) +
    (filters.heightRange[0] !== 150 || filters.heightRange[1] !== 200 ? 1 : 0);

  const load = useCallback(
    async (profession: string, activeFilters: FilterState) => {
      try {
        setLoading(true);
        setLocked(false);
        setError('');
        // Only send height bounds when the user narrowed from the full range —
        // otherwise we'd exclude profiles that simply haven't set a height.
        const heightNarrowed =
          activeFilters.heightRange[0] !== 150 || activeFilters.heightRange[1] !== 200;
        const res = await getDiscoverProfiles(token, profession || undefined, {
          minAge: activeFilters.ageRange[0],
          maxAge: activeFilters.ageRange[1],
          minHeightCm: heightNarrowed ? activeFilters.heightRange[0] : undefined,
          maxHeightCm: heightNarrowed ? activeFilters.heightRange[1] : undefined,
          genders: activeFilters.gender,
          lookingFor: activeFilters.lookingFor,
          religions: activeFilters.religions,
          languages: activeFilters.languages,
          verifiedOnly: activeFilters.verifiedOnly
        });
        setProfiles(res.profiles || []);
        if (res.unlock) setUnlock(res.unlock);
        if (typeof res.isPro === 'boolean') setIsPro(res.isPro);
      } catch (loadError) {
        setProfiles([]);
        const err = loadError as ApiError;
        // Only show the "deck locked → Go Pro" state for a real lock response.
        // Everything else (network down, auth, server) is a generic error.
        if (err.code === 'PROFESSION_LOCKED' || err.status === 403) {
          setLocked(true);
        } else {
          setError(err.message || 'Could not load profiles');
        }
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    load(activeProfession, filters);
  }, [activeProfession, filters, load]);

  function selectProfession(profession: string) {
    if (profession === activeProfession) return;

    const isOwn = profession === myProfession;
    const alreadyUnlocked = unlock?.professions.includes(profession);
    const noSlots = !isPro && !isOwn && !alreadyUnlocked && (unlock?.remaining ?? 0) <= 0;

    if (noSlots) {
      Alert.alert(
        'Weekly explores used up',
        `You've opened your ${unlock?.limit ?? 2} free professions this week. Go Pro to explore unlimited professions.`,
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Go Pro ⭐', onPress: () => navigation.navigate('Paywall', { focus: 'pro' }) }
        ]
      );
      return;
    }

    if (!isPro && !isOwn && !alreadyUnlocked) {
      Alert.alert(
        `Explore ${profession}?`,
        `This uses 1 of your ${unlock?.remaining ?? 0} free profession explores this week.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Explore', onPress: () => setActiveProfession(profession) }
        ]
      );
      return;
    }

    setActiveProfession(profession);
  }

  // Records the swipe against the backend + advances the deck. Called after the
  // card has animated off (gesture) or immediately (button + manual fling).
  const commitSwipe = useCallback(
    async (target: DiscoverProfile, action: 'like' | 'pass') => {
      try {
        const res = await swipeProfile({ toUserId: target.id, action }, token);
        setProfiles((prev) => prev.filter((p) => p.id !== target.id));
        pan.setValue({ x: 0, y: 0 });
        if (action === 'like' && res.matched) {
          Alert.alert("It's a match! 🎉", `You and ${target.name} liked each other.`);
        }
      } catch (swipeError) {
        Alert.alert('Could not swipe', (swipeError as Error).message);
        // Snap the card back if the request failed.
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
      }
    },
    [token, pan]
  );

  // Fling the top card off-screen in a direction, then commit the swipe.
  const flingOff = useCallback(
    (action: 'like' | 'pass') => {
      if (!current || submitting) return;
      setSubmitting(true);
      const toX = action === 'like' ? SCREEN_W * 1.4 : -SCREEN_W * 1.4;
      Animated.timing(pan, {
        toValue: { x: toX, y: 0 },
        duration: 250,
        useNativeDriver: false
      }).start(async () => {
        await commitSwipe(current, action);
        setSubmitting(false);
      });
    },
    [current, submitting, pan, SCREEN_W, commitSwipe]
  );

  // Button handler — same outcome as a fling.
  function handleSwipe(action: 'like' | 'pass') {
    flingOff(action);
  }

  // Keep the PanResponder (created once) calling the latest flingOff.
  const flingRef = useRef(flingOff);
  flingRef.current = flingOff;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_e, g) => {
        if (g.dx > SWIPE_THRESHOLD) {
          flingRef.current('like');
        } else if (g.dx < -SWIPE_THRESHOLD) {
          flingRef.current('pass');
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 6, useNativeDriver: false }).start();
        }
      }
    })
  ).current;

  const isOwnDeck = activeProfession === myProfession;

  return (
    <PrismBackground tint={viewingTheme.gradient} bottomInset={false}>
      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.brand}>Discover</Text>
            <Text style={styles.subtitle}>
              {isOwnDeck ? 'Your profession · always free' : `Exploring ${activeProfession}`}
            </Text>
          </View>
          <View style={styles.topRight}>
            {isPro ? (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>⭐ PRO</Text>
              </View>
            ) : unlock ? (
              <Pressable
                style={styles.exploreCounter}
                onPress={() => navigation.navigate('Paywall', { focus: 'pro' })}
              >
                <Text style={styles.exploreCounterText}>🔓 {unlock.remaining} left</Text>
              </Pressable>
            ) : null}
            <Pressable style={styles.filterBtn} onPress={() => setShowFilters(true)}>
              <Text style={styles.filterIcon}>⚙︎</Text>
              {activeFilterCount > 0 ? (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        </View>

        {/* Profession spectrum selector */}
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {[myProfession, ...PROFESSIONS.filter((p) => p !== myProfession)].map((profession) => {
              if (!profession) return null;
              const theme = professionTheme(profession);
              const active = profession === activeProfession;
              const isOwn = profession === myProfession;
              const unlocked = isPro || isOwn || unlock?.professions.includes(profession);

              return (
                <Pressable key={profession} onPress={() => selectProfession(profession)}>
                  {active ? (
                    <LinearGradient
                      colors={theme.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.chip, styles.chipActive]}
                    >
                      <Text style={styles.chipEmoji}>{theme.emoji}</Text>
                      <Text style={styles.chipTextActive}>{profession}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.chip}>
                      <Text style={styles.chipEmoji}>{theme.emoji}</Text>
                      <Text style={styles.chipText}>{profession}</Text>
                      {!unlocked ? <Text style={styles.chipLock}>🔒</Text> : null}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Card area */}
        <View style={styles.cardArea}>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={viewingTheme.accent} />
            </View>
          ) : locked ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateEmoji}>🔒</Text>
              <Text style={styles.stateTitle}>{activeProfession} is locked</Text>
              <Text style={styles.stateText}>
                You've used your free profession explores this week. Go Pro to explore unlimited
                professions.
              </Text>
              <GradientButton
                title="Go Pro ⭐"
                onPress={() => navigation.navigate('Paywall', { focus: 'pro' })}
                style={{ marginTop: spacing.md }}
              />
            </View>
          ) : error ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateEmoji}>📡</Text>
              <Text style={styles.stateTitle}>Couldn't load profiles</Text>
              <Text style={styles.stateText}>{error}</Text>
              <Pressable style={styles.refreshLink} onPress={() => load(activeProfession, filters)}>
                <Text style={styles.refreshLinkText}>Try again</Text>
              </Pressable>
            </View>
          ) : !current ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateEmoji}>{viewingTheme.emoji}</Text>
              <Text style={styles.stateTitle}>You're all caught up</Text>
              <Text style={styles.stateText}>
                No more {isOwnDeck ? 'people in your profession' : activeProfession} right now. Check back soon!
              </Text>
              <Pressable style={styles.refreshLink} onPress={() => load(activeProfession, filters)}>
                <Text style={styles.refreshLinkText}>Refresh</Text>
              </Pressable>
            </View>
          ) : (
            <Animated.View
              style={[
                styles.swipeWrap,
                {
                  transform: [
                    { translateX: pan.x },
                    { translateY: pan.y },
                    {
                      rotate: pan.x.interpolate({
                        inputRange: [-SCREEN_W, 0, SCREEN_W],
                        outputRange: ['-12deg', '0deg', '12deg']
                      })
                    }
                  ]
                }
              ]}
              {...panResponder.panHandlers}
            >
              {/* LIKE / NOPE stamps that fade in as you drag */}
              <Animated.View
                style={[
                  styles.stamp,
                  styles.stampLike,
                  { opacity: pan.x.interpolate({ inputRange: [0, SWIPE_THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' }) }
                ]}
              >
                <Text style={[styles.stampText, { color: colors.secondary }]}>LIKE</Text>
              </Animated.View>
              <Animated.View
                style={[
                  styles.stamp,
                  styles.stampNope,
                  { opacity: pan.x.interpolate({ inputRange: [-SWIPE_THRESHOLD, 0], outputRange: [1, 0], extrapolate: 'clamp' }) }
                ]}
              >
                <Text style={[styles.stampText, { color: '#EF4444' }]}>NOPE</Text>
              </Animated.View>

              <ProfileCard profile={current} />
            </Animated.View>
          )}
        </View>

        {/* Action buttons */}
        {current && !error && !locked ? (
          <View style={styles.actions}>
            <Pressable
              style={[styles.actionBtn, styles.passBtn]}
              onPress={() => handleSwipe('pass')}
              disabled={submitting}
            >
              <Text style={styles.passIcon}>✕</Text>
            </Pressable>
            <Pressable onPress={() => handleSwipe('like')} disabled={submitting}>
              <LinearGradient
                colors={viewingTheme.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.actionBtn, styles.likeBtn]}
              >
                <Text style={styles.likeIcon}>♥</Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : null}
      </View>

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={setFilters}
      />
    </PrismBackground>
  );
}

function ProfileCard({ profile }: { profile: DiscoverProfile }) {
  const theme = professionTheme(profile.profession);
  const photo = profile.photos && profile.photos.length > 0 ? profile.photos[0] : null;

  return (
    <View style={styles.card}>
      {photo ? (
        <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <LinearGradient colors={theme.gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.cardEmojiWrap}>
            <Text style={styles.cardBigEmoji}>{theme.emoji}</Text>
          </View>
        </LinearGradient>
      )}

      <LinearGradient colors={['transparent', 'rgba(8,12,24,0.92)']} style={styles.cardOverlay}>
        <ProfessionBadge profession={profile.profession} verified={profile.professionVerified} />
        <Text style={styles.cardName}>
          {profile.name}
          {profile.age ? `, ${profile.age}` : ''}
        </Text>
        {profile.headline ? <Text style={styles.cardHeadline}>{profile.headline}</Text> : null}
        {profile.bio ? (
          <Text style={styles.cardBio} numberOfLines={3}>
            {profile.bio}
          </Text>
        ) : null}
        {profile.location ? <Text style={styles.cardLocation}>📍 {profile.location}</Text> : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  brand: { fontSize: 28, fontWeight: '900', color: colors.text, letterSpacing: -0.6 },
  subtitle: { ...typography.caption, color: colors.textMuted, fontWeight: '600', marginTop: 2 },
  proBadge: {
    backgroundColor: '#FFF7E6',
    borderWidth: 1,
    borderColor: '#F5C56B',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  proBadgeText: { fontWeight: '900', color: '#B45309', fontSize: 12 },
  exploreCounter: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  exploreCounterText: { fontWeight: '800', color: colors.text, fontSize: 12 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  filterIcon: { fontSize: 18, color: colors.text },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4
  },
  filterBadgeText: { color: colors.white, fontSize: 10, fontWeight: '900' },
  chipRow: { gap: spacing.xs, paddingVertical: spacing.xs, paddingRight: spacing.lg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  chipActive: { borderWidth: 0 },
  chipEmoji: { fontSize: 14, marginRight: 6 },
  chipText: { fontWeight: '700', color: colors.textMuted, fontSize: 13 },
  chipTextActive: { fontWeight: '800', color: colors.white, fontSize: 13 },
  chipLock: { fontSize: 11, marginLeft: 6 },
  cardArea: { flex: 1, marginTop: spacing.md, marginBottom: spacing.md },
  swipeWrap: { flex: 1 },
  stamp: {
    position: 'absolute',
    top: 28,
    zIndex: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 4,
    backgroundColor: 'rgba(255,255,255,0.85)'
  },
  stampLike: { right: 24, transform: [{ rotate: '14deg' }], borderColor: colors.secondary },
  stampNope: { left: 24, transform: [{ rotate: '-14deg' }], borderColor: '#EF4444' },
  stampText: { fontSize: 26, fontWeight: '900', letterSpacing: 1 },
  card: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: colors.card,
    shadowColor: '#16324F',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 8
  },
  cardEmojiWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardBigEmoji: { fontSize: 120, opacity: 0.55 },
  cardOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    gap: 6
  },
  cardName: { color: colors.white, fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginTop: 6 },
  cardHeadline: { color: 'rgba(255,255,255,0.95)', fontSize: 15, fontWeight: '700' },
  cardBio: { color: 'rgba(255,255,255,0.82)', fontSize: 14, lineHeight: 20, marginTop: 2 },
  cardLocation: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600', marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stateCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl
  },
  stateEmoji: { fontSize: 64, marginBottom: spacing.md },
  stateTitle: { ...typography.subtitle, fontWeight: '900', color: colors.text, marginBottom: spacing.xs },
  stateText: { ...typography.caption, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  refreshLink: { marginTop: spacing.md },
  refreshLinkText: { color: colors.primary, fontWeight: '800' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
    paddingBottom: spacing.md
  },
  actionBtn: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16324F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6
  },
  passBtn: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  passIcon: { fontSize: 28, color: colors.textMuted, fontWeight: '700' },
  likeBtn: {},
  likeIcon: { fontSize: 30, color: colors.white }
});
