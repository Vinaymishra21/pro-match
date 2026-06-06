import { type ReactNode } from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

// A soft, layered "mesh"-style backdrop: a base light gradient plus two
// profession-tinted blobs that bleed in from the corners. Gives every screen a
// vibrant, premium feel that subtly themes to the active profession.
//
// Respects the device safe area at the top (status bar / notch) so content
// never slides under the clock and signal icons. Pass `edges` to customise.
export function PrismBackground({
  tint = ['#E76F51', '#F4A261'],
  topInset = true,
  bottomInset = true,
  children
}: {
  tint?: readonly [string, string, ...string[]];
  topInset?: boolean;
  bottomInset?: boolean;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();

  // Android (esp. in Expo Go with edge-to-edge) frequently reports a top inset
  // of 0 even though the app draws behind the translucent status bar. Fall back
  // to the measured status-bar height so content never hides under the clock.
  const topPad = topInset
    ? Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0)
    : 0;
  const bottomPad = bottomInset ? insets.bottom : 0;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#F6FAFF', colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <LinearGradient
        colors={[tint[0], 'transparent']}
        style={styles.blobTop}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <LinearGradient
        colors={[tint[tint.length - 1] as string, 'transparent']}
        style={styles.blobBottom}
        start={{ x: 1, y: 1 }}
        end={{ x: 0, y: 0 }}
      />
      <View style={[styles.content, { paddingTop: topPad, paddingBottom: bottomPad }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  blobTop: {
    position: 'absolute',
    top: -120,
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 200,
    opacity: 0.22
  },
  blobBottom: {
    position: 'absolute',
    bottom: -140,
    left: -120,
    width: 340,
    height: 340,
    borderRadius: 200,
    opacity: 0.18
  }
});
