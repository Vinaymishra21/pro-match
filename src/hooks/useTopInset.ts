import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Top padding that clears the status bar.
 *
 * Android edge-to-edge reports `insets.top === 0`, which would tuck content
 * under the status bar — so fall back to the standard 24dp there.
 */
export function useTopInset(): number {
  const insets = useSafeAreaInsets();
  return Math.max(insets.top, Platform.OS === 'android' ? 24 : 0);
}
