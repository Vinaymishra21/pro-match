// @ts-nocheck
import React, { useCallback, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

function AnimatedChip({ option, selected, onPress, disabled }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.92,
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
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={() => onPress(option)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        hitSlop={6}
        style={[styles.chip, selected ? styles.chipSelected : null]}
      >
        {selected && <View style={styles.checkDot} />}
        <Text style={[styles.label, selected ? styles.labelSelected : null]}>{option}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function ChipSelector({ options, value, onChange, multi = false, disabled = false }) {
  function isSelected(option) {
    if (multi) {
      return Array.isArray(value) && value.includes(option);
    }

    return value === option;
  }

  function onPress(option) {
    if (multi) {
      const current = Array.isArray(value) ? value : [];
      const next = current.includes(option) ? current.filter((item) => item !== option) : [...current, option];
      if (onChange) {
        onChange(next);
      }
      return;
    }

    if (onChange) {
      onChange(value === option ? '' : option);
    }
  }

  return (
    <View style={styles.wrap}>
      {options.map((option) => (
        <AnimatedChip
          key={option}
          option={option}
          selected={isSelected(option)}
          onPress={onPress}
          disabled={disabled}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.inputBg
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FDEEE8',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2
  },
  checkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 6
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600'
  },
  labelSelected: {
    color: colors.primary,
    fontWeight: '700'
  }
});
