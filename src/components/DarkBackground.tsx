import React, { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { darkColors } from '../theme/darkColors';

// The dark premium backdrop from the new design: a diagonal night gradient with
// two soft glowing orbs (brand pink top-left, violet bottom-right). Used by the
// re-themed dark screens. `orbColor` lets a screen tint the top orb to the
// active profession for the PRISM touch.
export function DarkBackground({
  children,
  orbColor = 'rgba(232,65,90,0.15)'
}: {
  children: ReactNode;
  orbColor?: string;
}) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={darkColors.bgGradient}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* glowing orbs */}
      <View style={[styles.orb, styles.orbTop, { backgroundColor: 'transparent' }]}>
        <LinearGradient
          colors={[orbColor, 'transparent']}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={styles.orbFill}
        />
      </View>
      <View style={[styles.orb, styles.orbBottom]}>
        <LinearGradient
          colors={['rgba(180,60,200,0.12)', 'transparent']}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={styles.orbFill}
        />
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: darkColors.bg },
  content: { flex: 1 },
  orb: { position: 'absolute', borderRadius: 999, overflow: 'hidden' },
  orbFill: { flex: 1, borderRadius: 999 },
  orbTop: { top: -90, left: -90, width: 280, height: 280 },
  orbBottom: { bottom: 80, right: -90, width: 300, height: 300 }
});
