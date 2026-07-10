// @ts-nocheck
import React, { useCallback, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme, useThemedStyles } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme/themes';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

const MAX_CHARS = 300;

export function PromptField({
  title,
  hint,
  icon,
  accentColor,
  value,
  onChangeText,
  placeholder
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  // Same default as before (colors.primary), resolved from the active theme.
  const accent = accentColor ?? colors.primary;
  const scale = useRef(new Animated.Value(1)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const charCount = (value || '').length;
  const filled = charCount > 0;
  const progress = Math.min(charCount / MAX_CHARS, 1);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1.015,
        useNativeDriver: true,
        tension: 300,
        friction: 15
      }),
      Animated.timing(borderAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false
      })
    ]).start();
  }, [scale, borderAnim]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 15
      }),
      Animated.timing(borderAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false
      })
    ]).start();
  }, [scale, borderAnim]);

  const animatedBorderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, accent]
  });

  function handleEmptyPress() {
    setIsFocused(true);
    handleFocus();
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }

  return (
    <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
      <Animated.View style={[styles.cardBorder, { borderColor: animatedBorderColor }]}>
        <View style={[styles.accentStrip, { backgroundColor: accent }]} />

        <View style={styles.inner}>
          <View style={styles.headerRow}>
            {icon ? (
              <View style={[styles.iconCircle, { backgroundColor: accent + '18' }]}>
                <Text style={styles.iconEmoji}>{icon}</Text>
              </View>
            ) : null}
            <View style={styles.headerText}>
              <Text style={styles.title}>{title}</Text>
              {hint ? <Text style={[styles.hint, { color: accent }]}>{hint}</Text> : null}
            </View>
          </View>

          {!filled && !isFocused ? (
            <Pressable onPress={handleEmptyPress} style={[styles.emptyState, { borderColor: accent + '40' }]}>
              <Text style={[styles.emptyPlus, { color: accent }]}>+</Text>
              <Text style={styles.emptyLabel}>Tap to answer</Text>
            </Pressable>
          ) : null}

          {(filled || isFocused) ? (
            <>
              <View style={styles.inputWrap}>
                <Text style={styles.openQuote}>{'\u201C'}</Text>
                <TextInput
                  ref={inputRef}
                  value={value}
                  onChangeText={(text) => {
                    if (text.length <= MAX_CHARS) {
                      onChangeText(text);
                    }
                  }}
                  placeholder={placeholder}
                  // Was `colors.textMuted + '80'` — appending to an rgba()
                  // string is invalid. textFaint is the palette's placeholder tone.
                  placeholderTextColor={colors.textFaint}
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </View>

              <View style={styles.footer}>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${progress * 100}%`,
                        backgroundColor: progress > 0.9 ? '#F4A261' : accent
                      }
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.charCount,
                    charCount > MAX_CHARS * 0.9 ? { color: '#F4A261' } : null
                  ]}
                >
                  {charCount}/{MAX_CHARS}
                </Text>
              </View>
            </>
          ) : null}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2
  },
  cardBorder: {
    flexDirection: 'row',
    backgroundColor: c.card,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden'
  },
  accentStrip: {
    width: 5
  },
  inner: {
    flex: 1,
    padding: spacing.md
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm
  },
  iconEmoji: {
    fontSize: 18
  },
  headerText: {
    flex: 1
  },
  title: {
    ...typography.body,
    color: c.text,
    fontWeight: '700',
    fontSize: 15
  },
  hint: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 12,
    marginTop: 2
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: c.inputBg
  },
  emptyPlus: {
    fontSize: 22,
    fontWeight: '700',
    marginRight: spacing.xs
  },
  emptyLabel: {
    ...typography.caption,
    color: c.textMuted,
    fontWeight: '600'
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  openQuote: {
    fontSize: 28,
    color: c.border,
    fontWeight: '700',
    lineHeight: 34,
    marginRight: 4,
    marginTop: -2
  },
  input: {
    flex: 1,
    minHeight: 72,
    textAlignVertical: 'top',
    color: c.text,
    fontSize: 15,
    lineHeight: 22,
    paddingTop: 4,
    paddingBottom: spacing.xs
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm
  },
  progressBarTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#E8EFF8',
    overflow: 'hidden'
  },
  progressBarFill: {
    height: 3,
    borderRadius: 2
  },
  charCount: {
    ...typography.caption,
    color: c.textMuted,
    fontSize: 11,
    fontWeight: '600'
  }
});
