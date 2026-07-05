import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { professionTheme } from '../theme/professionTheme';
import { useThemedStyles } from '../theme/ThemeProvider';
import type { ThemeColors } from '../theme/themes';
import { spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';

const { width } = Dimensions.get('window');

export type MatchInfo = {
  name?: string;
  profession?: string;
  photo?: string;
  myPhoto?: string;
  /**
   * Super-like context for the match: 'them' = they super liked me (the most
   * flattering framing wins), 'you' = my swipe was the super like.
   */
  superLike?: 'them' | 'you' | null;
};

// The celebration is a dark takeover in BOTH modes, so — like the whites in
// the styles below — the super-match gold is a fixed literal, not a palette
// read (the light theme's deepened gold would look muddy on the night scrim).
const SUPER_GOLD_GRADIENT: [string, string] = ['#FBBF24', '#F59E0B'];
const SUPER_GOLD_TEXT = '#FCD34D';

// Twinkle layout for the super-match sparkles around the avatars: position
// within the avatar stage, glyph size, and per-star loop delay for a live,
// non-synchronised shimmer.
const SPARKLES = [
  { style: { top: -18, left: '14%' as const }, size: 16, delay: 0 },
  { style: { top: 6, right: '8%' as const }, size: 12, delay: 350 },
  { style: { bottom: -12, left: '6%' as const }, size: 11, delay: 650 },
  { style: { bottom: 4, right: '16%' as const }, size: 15, delay: 950 },
  { style: { top: -26, right: '30%' as const }, size: 10, delay: 1250 }
];

// Full-screen "It's a Match!" celebration. Shown when a swipe creates a match.
export function MatchCelebration({
  match,
  onSendMessage,
  onKeepSwiping
}: {
  match: MatchInfo;
  onSendMessage: () => void;
  onKeepSwiping: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const theme = professionTheme(match.profession);

  const superContext = match.superLike ?? null;
  const isSuper = superContext === 'them' || superContext === 'you';
  const name = match.name || 'someone';

  const pop = useRef(new Animated.Value(0)).current;
  const title = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const sparkles = useRef(SPARKLES.map(() => new Animated.Value(0))).current;

  // Entry: title lands first, avatars pop in on its heels, actions rise last —
  // staggered but overlapping so the sequence reads as one continuous motion.
  useEffect(() => {
    const entry = Animated.stagger(130, [
      Animated.timing(title, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true
      }),
      Animated.spring(pop, { toValue: 1, friction: 7, tension: 68, useNativeDriver: true }),
      Animated.timing(rise, {
        toValue: 1,
        duration: 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      })
    ]);
    entry.start();
    return () => entry.stop();
  }, [pop, title, rise]);

  // Super-match ambience: a slow-breathing gold halo + softly twinkling stars.
  // Loops, so they must be stopped on unmount.
  useEffect(() => {
    if (!isSuper) return undefined;
    const halo = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ])
    );
    const twinkles = sparkles.map((value, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(SPARKLES[i].delay),
          Animated.timing(value, { toValue: 1, duration: 620, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(value, { toValue: 0.15, duration: 780, easing: Easing.in(Easing.quad), useNativeDriver: true })
        ])
      )
    );
    halo.start();
    twinkles.forEach((t) => t.start());
    return () => {
      halo.stop();
      twinkles.forEach((t) => t.stop());
    };
  }, [isSuper, glow, sparkles]);

  const kicker = isSuper ? '⭐ Super Match' : `${theme.emoji} ${match.profession || 'Connection'}`;
  const sub =
    superContext === 'them'
      ? `⭐ ${name} Super Liked you!`
      : superContext === 'you'
      ? `You Super Liked ${name} — and it's mutual`
      : `You and ${name} liked each other`;

  // Rendered inside a Modal so it lives in its own native window above ALL app
  // content. On Android, sibling views with `elevation` (e.g. the swipe action
  // buttons) would otherwise paint over — and steal touches from — an inline
  // absolute-positioned overlay, regardless of zIndex.
  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onKeepSwiping}
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={['rgba(14,11,20,0.94)', 'rgba(14,11,20,0.985)']}
          style={StyleSheet.absoluteFill}
        />

        <Animated.View
          style={{
            opacity: title,
            transform: [
              { translateY: title.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
              { scale: title.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }
            ],
            alignItems: 'center'
          }}
        >
          <Text style={[styles.kicker, isSuper && styles.kickerSuper]}>{kicker}</Text>
          <LinearGradient
            colors={isSuper ? SUPER_GOLD_GRADIENT : theme.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.titlePill}
          >
            <Text style={[styles.title, isSuper && styles.titleSuper]}>It's a Match!</Text>
          </LinearGradient>
          <Text style={[styles.sub, superContext === 'them' && styles.subSuper]}>{sub}</Text>
        </Animated.View>

        {/* Paired avatars (with a breathing gold halo + sparkles on super matches) */}
        <Animated.View style={[styles.avatarStage, { transform: [{ scale: pop }], opacity: pop }]}>
          {isSuper ? (
            <Animated.View
              style={[
                styles.glowRing,
                {
                  opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
                  transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }]
                }
              ]}
            />
          ) : null}
          <View style={styles.avatarRow}>
            <Avatar photo={match.myPhoto} theme={theme} flip gold={isSuper} />
            <View style={styles.heartBadge}>
              <Text style={[styles.heart, isSuper && styles.heartSuper]}>{isSuper ? '★' : '♥'}</Text>
            </View>
            <Avatar photo={match.photo} theme={theme} gold={isSuper} />
          </View>
          {isSuper
            ? SPARKLES.map((s, i) => (
                <Animated.Text
                  key={i}
                  style={[
                    styles.sparkle,
                    s.style,
                    {
                      fontSize: s.size,
                      opacity: sparkles[i].interpolate({ inputRange: [0, 1], outputRange: [0.1, 1] }),
                      transform: [
                        { scale: sparkles[i].interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.15] }) },
                        { translateY: sparkles[i].interpolate({ inputRange: [0, 1], outputRange: [1, -3] }) }
                      ]
                    }
                  ]}
                >
                  ✦
                </Animated.Text>
              ))
            : null}
        </Animated.View>

        <Animated.View
          style={[
            styles.actions,
            {
              opacity: rise,
              transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }]
            }
          ]}
        >
          <Pressable onPress={onSendMessage} style={styles.primaryWrap}>
            <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primary}>
              <Text style={styles.primaryText}>Send a message</Text>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={onKeepSwiping} style={styles.secondary}>
            <Text style={styles.secondaryText}>Keep swiping</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

function Avatar({
  photo,
  theme,
  flip,
  gold
}: {
  photo?: string;
  theme: ReturnType<typeof professionTheme>;
  flip?: boolean;
  gold?: boolean;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View
      style={[
        styles.avatar,
        { borderColor: gold ? '#FBBF24' : '#fff', transform: [{ rotate: flip ? '-7deg' : '7deg' }] }
      ]}
    >
      {photo ? (
        <Image source={{ uri: photo }} style={styles.avatarImg} />
      ) : (
        <LinearGradient colors={theme.gradient} style={styles.avatarImg}>
          <Text style={styles.avatarEmoji}>{theme.emoji}</Text>
        </LinearGradient>
      )}
    </View>
  );
}

const AV = Math.min(130, width * 0.34);
const GLOW = AV * 1.8;

// The celebration is deliberately a dark, dramatic full-screen takeover in BOTH
// modes (the near-opaque night scrim + white text stay as-is) — only the brand
// heart reads from the palette, and c.primary is identical in light and dark.
const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  kicker: { ...typography.eyebrow, color: 'rgba(255,255,255,0.85)', marginBottom: spacing.sm },
  kickerSuper: { color: SUPER_GOLD_TEXT },
  titlePill: { paddingHorizontal: 26, paddingVertical: 10, borderRadius: 999 },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 38,
    lineHeight: 48,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.6
  },
  // Dark espresso ink on the gold pill — white would wash out on amber.
  titleSuper: { color: '#2A1704' },
  sub: {
    fontFamily: fonts.sansSemiBold,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    letterSpacing: 0.1,
    marginTop: spacing.md
  },
  // "{name} Super Liked you!" — the flattering line gets the gold spotlight.
  subSuper: { color: SUPER_GOLD_TEXT, fontFamily: fonts.sansBold, fontWeight: '700', fontSize: 16 },
  avatarStage: { alignItems: 'center', justifyContent: 'center', marginVertical: spacing.xxl },
  avatarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  glowRing: {
    position: 'absolute',
    width: GLOW,
    height: GLOW,
    borderRadius: GLOW / 2,
    backgroundColor: 'rgba(251,191,36,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.28)',
    shadowColor: '#FBBF24',
    shadowOpacity: 0.45,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 }
  },
  sparkle: { position: 'absolute', color: SUPER_GOLD_TEXT },
  avatar: { width: AV, height: AV, borderRadius: AV / 2, borderWidth: 4, overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 48 },
  heartBadge: {
    width: 54, height: 54, borderRadius: 27, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', marginHorizontal: -14, zIndex: 2,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6
  },
  heart: { color: c.primary, fontSize: 28 },
  heartSuper: { color: '#F59E0B', fontSize: 26, fontWeight: '900' },
  actions: { width: '100%', maxWidth: 360, gap: spacing.sm },
  primaryWrap: { borderRadius: 16, overflow: 'hidden' },
  primary: { paddingVertical: 16, alignItems: 'center', borderRadius: 16 },
  primaryText: { fontFamily: fonts.sansExtraBold, color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },
  secondary: { paddingVertical: 14, alignItems: 'center' },
  secondaryText: { fontFamily: fonts.sansBold, color: 'rgba(255,255,255,0.9)', fontWeight: '700', fontSize: 15, letterSpacing: 0.2 }
  });
