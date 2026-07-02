import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { professionTheme } from '../theme/professionTheme';
import { colorsDark as colors } from '../theme/colorsDark';
import { spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';

const { width } = Dimensions.get('window');

export type MatchInfo = {
  name?: string;
  profession?: string;
  photo?: string;
  myPhoto?: string;
};

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
  const theme = professionTheme(match.profession);
  const pop = useRef(new Animated.Value(0)).current;
  const title = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(title, { toValue: 1, duration: 360, easing: Easing.out(Easing.back(1.6)), useNativeDriver: true }),
      Animated.spring(pop, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true })
    ]).start();
  }, [pop, title]);

  return (
    <View
      style={styles.overlay}
      // Absorb all touches so swipes/taps don't fall through to the deck behind
      // the overlay — the buttons (Pressables) still win via responder bubbling.
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
    >
      <LinearGradient
        colors={['rgba(14,11,20,0.94)', 'rgba(14,11,20,0.985)']}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={{
          opacity: title,
          transform: [
            { scale: title.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }
          ],
          alignItems: 'center'
        }}
      >
        <Text style={styles.kicker}>{theme.emoji} {match.profession || 'Connection'}</Text>
        <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.titlePill}>
          <Text style={styles.title}>It's a Match!</Text>
        </LinearGradient>
        <Text style={styles.sub}>You and {match.name || 'someone'} liked each other</Text>
      </Animated.View>

      {/* Paired avatars */}
      <Animated.View style={[styles.avatarRow, { transform: [{ scale: pop }], opacity: pop }]}>
        <Avatar photo={match.myPhoto} theme={theme} flip />
        <View style={styles.heartBadge}>
          <Text style={styles.heart}>♥</Text>
        </View>
        <Avatar photo={match.photo} theme={theme} />
      </Animated.View>

      <Animated.View style={[styles.actions, { opacity: pop }]}>
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
  );
}

function Avatar({ photo, theme, flip }: { photo?: string; theme: ReturnType<typeof professionTheme>; flip?: boolean }) {
  return (
    <View style={[styles.avatar, { borderColor: '#fff', transform: [{ rotate: flip ? '-7deg' : '7deg' }] }]}>
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

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 100, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  kicker: { ...typography.eyebrow, color: 'rgba(255,255,255,0.85)', marginBottom: spacing.sm },
  titlePill: { paddingHorizontal: 26, paddingVertical: 10, borderRadius: 999 },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 38,
    lineHeight: 48,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.6
  },
  sub: {
    fontFamily: fonts.sansSemiBold,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    letterSpacing: 0.1,
    marginTop: spacing.md
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: spacing.xxl },
  avatar: { width: AV, height: AV, borderRadius: AV / 2, borderWidth: 4, overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 48 },
  heartBadge: {
    width: 54, height: 54, borderRadius: 27, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', marginHorizontal: -14, zIndex: 2,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6
  },
  heart: { color: colors.primary, fontSize: 28 },
  actions: { width: '100%', maxWidth: 360, gap: spacing.sm },
  primaryWrap: { borderRadius: 16, overflow: 'hidden' },
  primary: { paddingVertical: 16, alignItems: 'center', borderRadius: 16 },
  primaryText: { fontFamily: fonts.sansExtraBold, color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },
  secondary: { paddingVertical: 14, alignItems: 'center' },
  secondaryText: { fontFamily: fonts.sansBold, color: 'rgba(255,255,255,0.9)', fontWeight: '700', fontSize: 15, letterSpacing: 0.2 }
});
