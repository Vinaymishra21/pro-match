import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DarkBackground } from '../DarkBackground';
import { WovnnMark } from '../WovnnMark';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme/themes';
import { spacing } from '../../theme/spacing';
import { fonts } from '../../theme/typography';

// Shared luxury building blocks for the whole auth flow, so every screen
// (Welcome, method pickers, phone, OTP, email, profession) feels like one
// cohesive premium product. All colors come from the active theme.

// Full-screen themed auth shell with safe-area padding + glow orbs. Pass a
// `hero` (e.g. <HeroCarousel/>) to render full-bleed imagery behind the content.
export function AuthShell({ children, hero }: { children: ReactNode; hero?: ReactNode }) {
  const insets = useSafeAreaInsets();
  const shell = useThemedStyles(makeShellStyles);
  const topPad = Math.max(insets.top, Platform.OS === 'android' ? 28 : 0);

  if (hero) {
    return (
      <View style={shell.heroRoot}>
        {hero}
        <View style={[shell.root, { paddingTop: topPad + spacing.xs, paddingBottom: insets.bottom + spacing.md }]}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <DarkBackground>
      <View style={[shell.root, { paddingTop: topPad + spacing.xs, paddingBottom: insets.bottom + spacing.md }]}>
        {children}
      </View>
    </DarkBackground>
  );
}

// Circular glass back button.
export function BackButton({ onPress }: { onPress: () => void }) {
  const shell = useThemedStyles(makeShellStyles);
  return (
    <Pressable onPress={onPress} hitSlop={12} style={shell.back}>
      <Text style={shell.backIcon}>←</Text>
    </Pressable>
  );
}

// The Wovnn wordmark with the woven brand mark.
export function BrandMark({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const shell = useThemedStyles(makeShellStyles);
  const big = size === 'lg';
  return (
    <View style={shell.brandRow}>
      <WovnnMark size={big ? 52 : 42} />
      <Text style={[shell.brandText, big ? { fontSize: 30 } : null]}>Wovnn</Text>
    </View>
  );
}

// A small uppercase eyebrow with a brand dot.
export function Eyebrow({ children }: { children: ReactNode }) {
  const shell = useThemedStyles(makeShellStyles);
  return (
    <View style={shell.eyebrowRow}>
      <View style={shell.eyebrowDot} />
      <Text style={shell.eyebrow}>{children}</Text>
    </View>
  );
}

// Primary gradient CTA button (full width).
export function GradientButton({
  title,
  onPress,
  disabled,
  loading,
  style
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: any;
}) {
  const { colors } = useTheme();
  const shell = useThemedStyles(makeShellStyles);
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={({ pressed }) => [pressed && !disabled ? { transform: [{ scale: 0.99 }] } : null, style]}>
      <LinearGradient
        colors={colors.brandGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[shell.cta, disabled ? shell.ctaDisabled : null]}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={shell.ctaText}>{title}</Text>}
      </LinearGradient>
    </Pressable>
  );
}

// Secondary outline button.
export function OutlineButton({ title, onPress, style }: { title: string; onPress: () => void; style?: any }) {
  const shell = useThemedStyles(makeShellStyles);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [shell.outline, pressed ? shell.outlinePressed : null, style]}>
      <Text style={shell.outlineText}>{title}</Text>
    </Pressable>
  );
}

// Round gradient "next" FAB (used on phone/OTP).
export function NextFab({ onPress, disabled, loading }: { onPress: () => void; disabled?: boolean; loading?: boolean }) {
  const { colors } = useTheme();
  const shell = useThemedStyles(makeShellStyles);
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={shell.fabWrap}>
      <LinearGradient
        colors={colors.brandGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[shell.fab, disabled ? shell.fabDisabled : null]}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={shell.fabIcon}>→</Text>}
      </LinearGradient>
    </Pressable>
  );
}

// A themed glass input wrapper (consumers put a TextInput inside).
export function FieldLabel({ children }: { children: ReactNode }) {
  const shell = useThemedStyles(makeShellStyles);
  return <Text style={shell.fieldLabel}>{children}</Text>;
}

// Shared heading/description/error text styles for the auth + onboarding
// screens. Was a static `authText` object built from darkColors; now a hook so
// the colors track the active theme (memoized on the palette).
const makeAuthText = (c: ThemeColors) =>
  StyleSheet.create({
    title: {
      fontFamily: fonts.displayBold,
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '700',
      color: c.text,
      letterSpacing: -0.6
    },
    desc: {
      fontFamily: fonts.sans,
      fontSize: 15,
      lineHeight: 23,
      letterSpacing: 0.1,
      color: c.textMuted,
      marginTop: spacing.sm
    },
    error: {
      fontFamily: fonts.sansSemiBold,
      color: c.danger,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600',
      marginTop: spacing.sm
    }
  });

export function useAuthText() {
  return useThemedStyles(makeAuthText);
}

const makeShellStyles = (c: ThemeColors) =>
  StyleSheet.create({
    heroRoot: { flex: 1, backgroundColor: c.bg },
    root: { flex: 1, paddingHorizontal: spacing.lg },
    back: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border
    },
    backIcon: {
      fontSize: 22,
      lineHeight: 42,
      color: c.text,
      textAlign: 'center',
      textAlignVertical: 'center',
      includeFontPadding: false
    },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    brandText: { fontFamily: fonts.displayBold, color: c.text, fontSize: 24, fontWeight: '700', letterSpacing: -0.4 },
    eyebrowRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
    eyebrowDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.primary, marginRight: spacing.sm },
    eyebrow: {
      fontFamily: fonts.sansExtraBold,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '800',
      color: c.brandText,
      textTransform: 'uppercase',
      letterSpacing: 1.6
    },
    cta: {
      height: 56,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 8
    },
    ctaDisabled: { opacity: 0.4 },
    ctaText: { fontFamily: fonts.sansExtraBold, color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
    outline: {
      height: 56,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: c.borderStrong,
      backgroundColor: c.surface
    },
    outlinePressed: { backgroundColor: c.surfaceStrong },
    outlineText: { fontFamily: fonts.sansBold, color: c.text, fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
    fabWrap: { alignSelf: 'flex-end' },
    fab: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 18,
      elevation: 8
    },
    fabDisabled: { opacity: 0.4 },
    // includeFontPadding:false + line-height = fontSize keeps the arrow glyph
    // optically centered in the circle on Android (Android bakes extra font
    // padding that pushes single glyphs off-centre otherwise).
    fabIcon: {
      color: '#fff',
      fontSize: 26,
      fontWeight: '800',
      lineHeight: 26,
      textAlign: 'center',
      textAlignVertical: 'center',
      includeFontPadding: false
    },
    fieldLabel: {
      fontFamily: fonts.sansBold,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '700',
      color: c.textMuted,
      marginBottom: spacing.sm,
      letterSpacing: 1.1,
      textTransform: 'uppercase'
    }
  });
