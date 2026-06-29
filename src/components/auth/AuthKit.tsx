import React, { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DarkBackground } from '../DarkBackground';
import { darkColors } from '../../theme/darkColors';
import { spacing } from '../../theme/spacing';

// Shared luxury-dark building blocks for the whole auth flow, so every screen
// (Welcome, method pickers, phone, OTP, email, profession) feels like one
// cohesive premium product.

// Full-screen dark auth shell with safe-area padding + glow orbs.
export function AuthShell({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, Platform.OS === 'android' ? 28 : 0);
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
  return (
    <Pressable onPress={onPress} hitSlop={12} style={shell.back}>
      <Text style={shell.backIcon}>←</Text>
    </Pressable>
  );
}

// The Pro Match wordmark with a gradient heart badge.
export function BrandMark({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const big = size === 'lg';
  return (
    <View style={shell.brandRow}>
      <LinearGradient
        colors={darkColors.brandGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[shell.brandBadge, big ? shell.brandBadgeLg : null]}
      >
        <Text style={[shell.brandHeart, big ? { fontSize: 26 } : null]}>♥</Text>
      </LinearGradient>
      <Text style={[shell.brandText, big ? { fontSize: 30 } : null]}>
        Pro <Text style={shell.brandAccent}>Match</Text>
      </Text>
    </View>
  );
}

// A small uppercase eyebrow with a brand dot.
export function Eyebrow({ children }: { children: ReactNode }) {
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
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={({ pressed }) => [pressed && !disabled ? { transform: [{ scale: 0.99 }] } : null, style]}>
      <LinearGradient
        colors={darkColors.brandGradient}
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
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [shell.outline, pressed ? shell.outlinePressed : null, style]}>
      <Text style={shell.outlineText}>{title}</Text>
    </Pressable>
  );
}

// Round gradient "next" FAB (used on phone/OTP).
export function NextFab({ onPress, disabled, loading }: { onPress: () => void; disabled?: boolean; loading?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={shell.fabWrap}>
      <LinearGradient
        colors={darkColors.brandGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[shell.fab, disabled ? shell.fabDisabled : null]}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={shell.fabIcon}>→</Text>}
      </LinearGradient>
    </Pressable>
  );
}

// A dark glass input wrapper (consumers put a TextInput inside).
export function FieldLabel({ children }: { children: ReactNode }) {
  return <Text style={shell.fieldLabel}>{children}</Text>;
}

export const authText = {
  title: { fontSize: 32, lineHeight: 38, fontWeight: '800', color: darkColors.text, letterSpacing: -0.8 },
  desc: { fontSize: 15, lineHeight: 23, color: darkColors.textMuted, marginTop: spacing.sm },
  error: { color: darkColors.danger, fontSize: 13, fontWeight: '600', marginTop: spacing.sm }
} as const;

const shell = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: spacing.lg },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkColors.surface,
    borderWidth: 1,
    borderColor: darkColors.border
  },
  backIcon: { fontSize: 22, color: darkColors.text, marginTop: -2 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandBadge: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  brandBadgeLg: { width: 48, height: 48, borderRadius: 24 },
  brandHeart: { color: '#fff', fontSize: 20 },
  brandText: { color: darkColors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.6 },
  brandAccent: { color: darkColors.primary },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  eyebrowDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: darkColors.primary, marginRight: spacing.sm },
  eyebrow: { fontSize: 12, fontWeight: '800', color: darkColors.brandText, textTransform: 'uppercase', letterSpacing: 1 },
  cta: {
    height: 56,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: darkColors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8
  },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  outline: {
    height: 56,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: darkColors.borderStrong,
    backgroundColor: darkColors.surface
  },
  outlinePressed: { backgroundColor: darkColors.surfaceStrong },
  outlineText: { color: darkColors.text, fontSize: 16, fontWeight: '700' },
  fabWrap: { alignSelf: 'flex-end' },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: darkColors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 8
  },
  fabDisabled: { opacity: 0.4 },
  fabIcon: { color: '#fff', fontSize: 28, fontWeight: '800' },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: darkColors.textMuted,
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
    textTransform: 'uppercase'
  }
});
