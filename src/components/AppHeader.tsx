import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type AppHeaderProps = {
  onSettingsPress?: () => void;
  trailing?: ReactNode;
};

export function AppHeader({ onSettingsPress, trailing }: AppHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <View style={styles.logoMark}>
          <Text style={styles.logoLetter}>P</Text>
        </View>
        <Text style={styles.brandName}>Pro-Match</Text>
      </View>
      <View style={styles.actions}>
        {trailing}
        {onSettingsPress ? (
          <Pressable
            onPress={onSettingsPress}
            style={({ pressed }) => [styles.iconButton, pressed ? styles.iconButtonPressed : null]}
            hitSlop={8}
          >
            <View style={styles.filterIconWrap}>
              <View style={styles.filterLine}>
                <View style={[styles.filterDot, { left: '25%' }]} />
              </View>
              <View style={styles.filterLine}>
                <View style={[styles.filterDot, { left: '60%' }]} />
              </View>
              <View style={styles.filterLine}>
                <View style={[styles.filterDot, { left: '40%' }]} />
              </View>
            </View>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.md
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  logoMark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs
  },
  logoLetter: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800'
  },
  brandName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center'
  },
  iconButtonPressed: {
    backgroundColor: colors.card
  },
  filterIconWrap: {
    width: 18,
    height: 14,
    justifyContent: 'space-between'
  },
  filterLine: {
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.text,
    position: 'relative'
  },
  filterDot: {
    position: 'absolute',
    top: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.text
  }
});
