import React, { useCallback, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

const LEVELS = [
  { label: 'It pays the bills', emoji: '\uD83D\uDE10', bg: '#F0F4FA' },
  { label: 'I like it', emoji: '\uD83D\uDE42', bg: '#FFF8E1' },
  { label: 'I love it', emoji: '\uD83D\uDE0D', bg: '#FDEEE8' },
  { label: "It's my calling", emoji: '\uD83D\uDD25', bg: '#FCE4EC' }
];

function LevelOption({ level, index, selected, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
      tension: 300,
      friction: 10
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 8
    }).start();
  }, [scale]);

  return (
    <Animated.View style={[styles.optionWrap, { transform: [{ scale }] }]}>
      <Pressable
        onPress={() => onPress(level.label)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.option,
          { backgroundColor: selected ? level.bg : colors.inputBg },
          selected ? styles.optionSelected : null
        ]}
      >
        <Text style={[styles.emoji, selected ? styles.emojiSelected : null]}>{level.emoji}</Text>
        <Text style={[styles.optionLabel, selected ? styles.optionLabelSelected : null]}>{level.label}</Text>
        {selected ? <View style={styles.selectedIndicator} /> : null}
      </Pressable>
    </Animated.View>
  );
}

export function ProfessionLoveMeter({ value, onChange }) {
  const selectedIndex = LEVELS.findIndex((l) => l.label === value);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>{'\u2764\uFE0F\u200D\uD83D\uDD25'}</Text>
        <Text style={styles.title}>How much do you love your profession?</Text>
      </View>

      {selectedIndex >= 0 ? (
        <View style={styles.meterTrack}>
          <View style={[styles.meterFill, { width: `${((selectedIndex + 1) / LEVELS.length) * 100}%` }]} />
        </View>
      ) : null}

      <View style={styles.grid}>
        {LEVELS.map((level, index) => (
          <LevelOption
            key={level.label}
            level={level}
            index={index}
            selected={value === level.label}
            onPress={onChange}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  headerIcon: {
    fontSize: 20,
    marginRight: spacing.xs
  },
  title: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
    flex: 1
  },
  meterTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E8EFF8',
    overflow: 'hidden',
    marginBottom: spacing.md
  },
  meterFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs
  },
  optionWrap: {
    width: '48%',
    flexGrow: 1
  },
  option: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border
  },
  optionSelected: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2
  },
  emoji: {
    fontSize: 28,
    marginBottom: 4,
    opacity: 0.5
  },
  emojiSelected: {
    opacity: 1
  },
  optionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 12
  },
  optionLabelSelected: {
    color: colors.primary,
    fontWeight: '700'
  },
  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6
  }
});
