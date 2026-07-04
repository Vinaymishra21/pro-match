import React, { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import type { ThemeColors } from '../theme/themes';

// The full-screen app backdrop: a diagonal gradient with two soft orbs (brand
// pink top-left, violet bottom-right). In dark mode this renders the original
// premium night design pixel-for-pixel; in light mode the same geometry gets a
// cream wash and gentler blush/lilac orbs. `orbColor` lets a screen tint the
// top orb to the active profession for the PRISM touch.
export function DarkBackground({
  children,
  orbColor
}: {
  children: ReactNode;
  orbColor?: string;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  // Default top-orb tint comes from the palette (dark value is the exact
  // 'rgba(232,65,90,0.15)' this component always used).
  const topOrbColor = orbColor ?? colors.orbTop;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={colors.bgGradient}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* glowing orbs */}
      <View style={[styles.orb, styles.orbTop, { backgroundColor: 'transparent' }]}>
        <LinearGradient
          colors={[topOrbColor, 'transparent']}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={styles.orbFill}
        />
      </View>
      <View style={[styles.orb, styles.orbBottom]}>
        <LinearGradient
          colors={[colors.orbBottom, 'transparent']}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={styles.orbFill}
        />
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    content: { flex: 1 },
    orb: { position: 'absolute', borderRadius: 999, overflow: 'hidden' },
    orbFill: { flex: 1, borderRadius: 999 },
    orbTop: { top: -90, left: -90, width: 280, height: 280 },
    orbBottom: { bottom: 80, right: -90, width: 300, height: 300 }
  });
