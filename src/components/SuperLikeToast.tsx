import { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, useThemedStyles, type ThemeMode } from '../theme/ThemeProvider';
import type { ThemeColors } from '../theme/themes';
import { spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';

// How long the toast stays fully visible before it dismisses itself.
const VISIBLE_MS = 1600;

/**
 * Non-blocking "Super Like sent" confirmation. Drops in from the top with a
 * gold-star badge and a couple of drifting sparkles, then fades away on its
 * own (~1.6s) — or on tap. The wrapper is `pointerEvents="box-none"` so the
 * deck underneath stays fully swipeable the whole time.
 */
export function SuperLikeToast({
  name,
  topOffset,
  onDone
}: {
  name?: string;
  topOffset: number;
  onDone: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();

  // `enter` drives the card (0 = hidden, 1 = shown); `sparkle` drives the
  // little stars' one-shot drift. Both are cleaned up on unmount.
  const enter = useRef(new Animated.Value(0)).current;
  const sparkle = useRef(new Animated.Value(0)).current;
  const dismissedRef = useRef(false);

  // Pin the latest onDone in a ref so `dismiss` stays referentially stable —
  // otherwise every parent re-render (each subsequent swipe) would re-run the
  // mount effect and restart the auto-dismiss timer.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const dismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    Animated.timing(enter, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true
    }).start(({ finished }) => {
      if (finished) onDoneRef.current();
    });
  }, [enter]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(enter, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true
      }),
      Animated.timing(sparkle, {
        toValue: 1,
        duration: 1100,
        delay: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true
      })
    ]).start();
    const timer = setTimeout(dismiss, VISIBLE_MS);
    return () => {
      clearTimeout(timer);
      enter.stopAnimation();
      sparkle.stopAnimation();
    };
  }, [enter, sparkle, dismiss]);

  // Shared sparkle interpolations: appear, drift upward, fade out.
  const sparkleOpacity = sparkle.interpolate({
    inputRange: [0, 0.25, 0.65, 1],
    outputRange: [0, 1, 0.9, 0]
  });
  const sparkleDrift = sparkle.interpolate({ inputRange: [0, 1], outputRange: [3, -9] });

  return (
    <View style={[styles.wrap, { top: topOffset }]} pointerEvents="box-none">
      <Animated.View
        style={{
          opacity: enter,
          transform: [
            { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) },
            { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }
          ]
        }}
      >
        <Pressable onPress={dismiss} style={styles.card}>
          <View style={styles.badgeWrap}>
            <LinearGradient
              colors={colors.goldGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.badge}
            >
              <Text style={styles.badgeStar}>★</Text>
            </LinearGradient>
            {/* Three sparkles drifting off the star at slightly different angles */}
            <Animated.Text
              style={[
                styles.sparkle,
                { top: -7, right: -6, fontSize: 11 },
                { opacity: sparkleOpacity, transform: [{ translateY: sparkleDrift }] }
              ]}
            >
              ✦
            </Animated.Text>
            <Animated.Text
              style={[
                styles.sparkle,
                { top: 0, left: -9, fontSize: 8 },
                {
                  opacity: sparkleOpacity,
                  transform: [{ translateY: sparkleDrift }, { translateX: -3 }]
                }
              ]}
            >
              ✦
            </Animated.Text>
            <Animated.Text
              style={[
                styles.sparkle,
                { bottom: -6, right: -10, fontSize: 9 },
                {
                  opacity: sparkleOpacity,
                  transform: [{ translateY: sparkleDrift }, { translateX: 4 }]
                }
              ]}
            >
              ✧
            </Animated.Text>
          </View>
          <View style={styles.textCol}>
            <Text style={styles.kicker}>Super Like sent</Text>
            <Text style={styles.line} numberOfLines={1}>
              You Super Liked {name || 'them'}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const makeStyles = (c: ThemeColors, mode: ThemeMode) =>
  StyleSheet.create({
    wrap: {
      position: 'absolute',
      left: spacing.lg,
      right: spacing.lg,
      alignItems: 'center',
      // Above the deck + action buttons (Android siblings with elevation).
      zIndex: 50,
      elevation: 50
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: mode === 'dark' ? 'rgba(251,191,36,0.45)' : 'rgba(217,119,6,0.4)',
      borderRadius: 999,
      paddingVertical: 10,
      paddingLeft: 12,
      paddingRight: 20,
      maxWidth: '100%',
      // Gold-tinted glow in dark, soft ink shadow in light.
      shadowColor: mode === 'dark' ? '#FBBF24' : c.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: mode === 'dark' ? 0.35 : 0.22,
      shadowRadius: 16,
      elevation: 10
    },
    badgeWrap: { width: 36, height: 36 },
    badge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center'
    },
    badgeStar: { color: c.white, fontSize: 18, fontWeight: '900' },
    sparkle: { position: 'absolute', color: mode === 'dark' ? '#FCD34D' : '#D97706' },
    textCol: { flexShrink: 1 },
    kicker: {
      ...typography.overline,
      color: c.gold,
      marginBottom: 1
    },
    line: {
      fontFamily: fonts.sansBold,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '700',
      color: c.text
    }
  });
