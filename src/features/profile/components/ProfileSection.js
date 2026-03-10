import React, { useCallback, useRef, useState } from 'react';
import { Animated, LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

export function ProfileSection({ title, subtitle, icon, children, collapsible = false, defaultExpanded = true }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const rotation = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;
  const isOpen = collapsible ? expanded : true;

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const next = !expanded;
    setExpanded(next);
    Animated.spring(rotation, {
      toValue: next ? 1 : 0,
      useNativeDriver: true,
      tension: 200,
      friction: 15
    }).start();
  }, [expanded, rotation]);

  const rotateZ = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });

  return (
    <View style={styles.section}>
      <Pressable
        disabled={!collapsible}
        onPress={toggle}
        style={({ pressed }) => [styles.headerRow, pressed && collapsible ? styles.headerPressed : null]}
      >
        <View style={styles.headerLeft}>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>
        {collapsible ? (
          <Animated.View style={{ transform: [{ rotateZ }] }}>
            <View style={styles.chevronCircle}>
              <Text style={styles.chevron}>&#x2303;</Text>
            </View>
          </Animated.View>
        ) : null}
      </Pressable>
      {isOpen ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerPressed: {
    opacity: 0.7
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.sm
  },
  icon: {
    fontSize: 22,
    marginRight: spacing.sm
  },
  headerTextWrap: {
    flex: 1
  },
  title: {
    ...typography.subtitle,
    color: colors.text,
    fontWeight: '700'
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2
  },
  chevronCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center'
  },
  chevron: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '700',
    marginTop: 4
  },
  content: {
    marginTop: spacing.md
  }
});
