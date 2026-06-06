import { type ReactNode } from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

// Note: we use safe-area-context insets (not RN's SafeAreaView, which is a
// no-op on Android) plus an Android status-bar-height fallback, so content
// never slides under the clock/notch on either platform.
export function ScreenContainer({
  children,
  bottomInset = true
}: {
  children: ReactNode;
  // Tab screens set this false — the tab bar already reserves the bottom area.
  bottomInset?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0);

  return (
    <View style={[styles.safeArea, { paddingTop: topPad, paddingBottom: bottomInset ? insets.bottom : 0 }]}>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    flex: 1,
    padding: spacing.lg
  }
});
