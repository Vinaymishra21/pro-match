import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { WovnnMark } from './WovnnMark';
import { useThemedStyles } from '../theme/ThemeProvider';
import type { ThemeColors } from '../theme/themes';
import { spacing } from '../theme/spacing';
import { fonts } from '../theme/typography';

/**
 * Branded loading state: the woven mark breathing gently.
 *
 * If the wait drags past `slowAfterMs`, a second line appears explaining the
 * delay. The free-tier backend sleeps and takes ~30s to wake, so a silent
 * spinner reads as "broken" — this reads as "working on it".
 */
export function WovnnLoader({
  size = 56,
  message,
  slowMessage = 'Still connecting — the server may be waking up.',
  slowAfterMs = 3500
}: {
  size?: number;
  message?: string;
  slowMessage?: string;
  slowAfterMs?: number;
}) {
  const styles = useThemedStyles(makeStyles);
  const pulse = useRef(new Animated.Value(0)).current;
  const slowFade = useRef(new Animated.Value(0)).current;
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  // Only surface the explanation once the wait is actually long.
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), slowAfterMs);
    return () => clearTimeout(timer);
  }, [slowAfterMs]);

  useEffect(() => {
    if (!slow) return;
    Animated.timing(slowFade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [slow, slowFade]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.06] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });

  return (
    <View style={styles.wrap}>
      <Animated.View style={{ transform: [{ scale }], opacity }}>
        <WovnnMark size={size} />
      </Animated.View>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {slow ? (
        <Animated.Text style={[styles.slow, { opacity: slowFade }]}>{slowMessage}</Animated.Text>
      ) : null}
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl },
    message: {
      fontFamily: fonts.sansSemiBold,
      color: c.textDim,
      fontSize: 14,
      fontWeight: '600',
      marginTop: spacing.md,
      textAlign: 'center'
    },
    slow: {
      fontFamily: fonts.sansMedium,
      color: c.textMuted,
      fontSize: 12.5,
      lineHeight: 18,
      marginTop: spacing.sm,
      textAlign: 'center',
      maxWidth: 260
    }
  });
