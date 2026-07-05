// Theme engine for the light/dark system.
//
// ── The conversion pattern for every screen ─────────────────────────────────
//   1. Delete the palette import (`colorsDark as colors` / `darkColors`).
//   2. Move the module-level StyleSheet into a factory:
//        const makeStyles = (c: ThemeColors, mode: ThemeMode) =>
//          StyleSheet.create({ ... colors.X → c.X ... });
//      (`mode` is optional — use it only for hardcoded dark-only literals that
//      must stay byte-identical in dark, e.g. `mode === 'dark' ? '#F87171' : c.danger`.)
//   3. Inside the component: `const styles = useThemedStyles(makeStyles);`
//      For inline color props (ActivityIndicator, icons, gradients):
//      `const { colors } = useTheme();`
//   4. Replace `<StatusBar style="light" />` with `<ThemedStatusBar />`.
//
// Keep `makeStyles` at MODULE scope — useThemedStyles memoizes on the palette,
// not the factory, so an inline factory would defeat the memo.
// ────────────────────────────────────────────────────────────────────────────
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { Appearance } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkTheme, lightTheme, type ThemeColors } from './themes';

/** The resolved appearance actually on screen. */
export type ThemeMode = 'light' | 'dark';
/** The user's stored preference — 'system' follows the OS setting. */
export type ThemeScheme = ThemeMode | 'system';

const STORAGE_KEY = 'promatch.theme';

type ThemeContextValue = {
  colors: ThemeColors;
  mode: ThemeMode;
  scheme: ThemeScheme;
  setScheme: (scheme: ThemeScheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemModeNow(): ThemeMode {
  // Anything other than an explicit 'light' (i.e. 'dark' or null) → dark,
  // matching the app's dark-first default.
  return Appearance.getColorScheme() === 'light' ? 'light' : 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Default 'system': a fresh install follows the phone's light/dark appearance
  // (resolved via `Appearance` below). An explicit stored preference still wins —
  // the AsyncStorage restore overwrites this with any saved 'light'|'dark'|'system'.
  const [scheme, setSchemeState] = useState<ThemeScheme>('system');
  const [systemMode, setSystemMode] = useState<ThemeMode>(systemModeNow);

  // Restore the persisted preference once on mount.
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!cancelled && (stored === 'light' || stored === 'dark' || stored === 'system')) {
          setSchemeState(stored);
        }
      })
      .catch(() => {
        // Unreadable storage → stay on the dark default.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Follow OS appearance changes so scheme === 'system' live-updates.
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemMode(colorScheme === 'light' ? 'light' : 'dark');
    });
    return () => subscription.remove();
  }, []);

  const setScheme = useCallback((next: ThemeScheme) => {
    setSchemeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      // Persistence failure just means the choice lasts for this session.
    });
  }, []);

  const mode: ThemeMode = scheme === 'system' ? systemMode : scheme;

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: mode === 'dark' ? darkTheme : lightTheme,
      mode,
      scheme,
      setScheme
    }),
    [mode, scheme, setScheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return context;
}

/**
 * Theme-aware StyleSheet: pass a module-scope factory and get memoized styles
 * that rebuild only when the palette flips.
 *
 *   const styles = useThemedStyles(makeStyles);
 */
export function useThemedStyles<T>(factory: (c: ThemeColors, mode: ThemeMode) => T): T {
  const { colors, mode } = useTheme();
  // `factory` is intentionally not a dependency: it must live at module scope.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => factory(colors, mode), [colors, mode]);
}

/** Drop-in replacement for the hardcoded `<StatusBar style="light" />`. */
export function ThemedStatusBar() {
  const { mode } = useTheme();
  return <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />;
}
