// @ts-nocheck
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme, useThemedStyles, type ThemeMode } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme/themes';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

function AnimatedProgressRing({ percent }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const animated = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animated, {
      toValue: percent,
      useNativeDriver: false,
      tension: 30,
      friction: 10
    }).start();
  }, [animated, percent]);

  const width = animated.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp'
  });

  const barColor = percent >= 80 ? colors.secondary : percent >= 50 ? '#F4A261' : colors.primary;

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, { width, backgroundColor: barColor }]} />
    </View>
  );
}

export function ProfileHeaderCard({ completion, mode, onModeChange }) {
  const styles = useThemedStyles(makeStyles);
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true
      })
    ]).start();
  }, [scaleAnim, opacityAnim]);

  const isComplete = completion.percent === 100;

  return (
    <Animated.View style={[styles.card, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.topRow}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>{isComplete ? '\u2728' : '\uD83D\uDCDD'}</Text>
        </View>
        <View style={styles.topTextWrap}>
          <Text style={styles.title}>{isComplete ? 'Profile Complete!' : 'Build Your Best Profile'}</Text>
          <Text style={styles.subtitle}>
            {isComplete
              ? 'You\'re ready to get matched with professionals.'
              : 'Stronger profiles get better profession matches.'}
          </Text>
        </View>
      </View>

      <AnimatedProgressRing percent={completion.percent} />
      <View style={styles.progressRow}>
        <Text style={styles.progressPercent}>{completion.percent}%</Text>
        <Text style={styles.progressMeta}>
          {completion.completed}/{completion.total} fields
        </Text>
      </View>

      {completion.missing?.length ? (
        <View style={styles.missingWrap}>
          <Text style={styles.missingLabel}>Complete these next:</Text>
          <View style={styles.badgesWrap}>
            {completion.missing.slice(0, 4).map((item) => (
              <View key={item} style={styles.badge}>
                <Text style={styles.badgeText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.doneBadge}>
          <Text style={styles.doneText}>All sections filled in</Text>
        </View>
      )}

      <View style={styles.toggleRow}>
        <Pressable
          onPress={() => onModeChange('edit')}
          style={[styles.toggle, mode === 'edit' ? styles.toggleActive : null]}
        >
          <Text style={[styles.toggleLabel, mode === 'edit' ? styles.toggleLabelActive : null]}>Edit</Text>
        </Pressable>
        <Pressable
          onPress={() => onModeChange('preview')}
          style={[styles.toggle, mode === 'preview' ? styles.toggleActive : null]}
        >
          <Text style={[styles.toggleLabel, mode === 'preview' ? styles.toggleLabelActive : null]}>Preview</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const makeStyles = (c: ThemeColors, mode: ThemeMode) => StyleSheet.create({
  card: {
    // Light mode uses a clean warm-white card — the translucent-ink surface +
    // grey border read as a clunky grey box on cream. Dark stays byte-identical.
    backgroundColor: mode === 'dark' ? c.surface : c.card,
    borderWidth: mode === 'dark' ? 1 : 0,
    borderColor: c.border,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: c.brandSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm
  },
  iconEmoji: {
    fontSize: 22
  },
  topTextWrap: {
    flex: 1
  },
  title: {
    ...typography.subtitle,
    color: c.text,
    fontWeight: '700'
  },
  subtitle: {
    ...typography.caption,
    color: c.textMuted,
    marginTop: 2
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: c.border,
    overflow: 'hidden'
  },
  progressFill: {
    height: 8,
    borderRadius: 999
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs
  },
  progressPercent: {
    ...typography.subtitle,
    color: c.text,
    fontWeight: '700',
    fontSize: 16
  },
  progressMeta: {
    ...typography.caption,
    color: c.textMuted
  },
  missingWrap: {
    marginTop: spacing.md
  },
  missingLabel: {
    ...typography.caption,
    color: c.textMuted,
    fontWeight: '600',
    marginBottom: spacing.xs
  },
  badgesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs
  },
  badge: {
    backgroundColor: 'rgba(232,65,90,0.12)',
    borderColor: '#F4A261',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6
  },
  badgeText: {
    ...typography.caption,
    color: c.gold,
    fontWeight: '600',
    fontSize: 12
  },
  doneBadge: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(52,211,153,0.18)',
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 8
  },
  doneText: {
    ...typography.caption,
    color: c.secondary,
    fontWeight: '700'
  },
  toggleRow: {
    marginTop: spacing.md,
    backgroundColor: c.inputBg,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.border,
    flexDirection: 'row',
    padding: 4
  },
  toggle: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center'
  },
  toggleActive: {
    backgroundColor: c.primary,
    shadowColor: c.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2
  },
  toggleLabel: {
    ...typography.caption,
    color: c.textMuted,
    fontWeight: '700'
  },
  toggleLabelActive: {
    color: c.white
  }
});
