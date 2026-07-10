import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DarkBackground } from '../../components/DarkBackground';
import { ThemedStatusBar, useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme/themes';
import { spacing } from '../../theme/spacing';
import { fonts } from '../../theme/typography';

// One consistent frame for every onboarding step: progress bar + back/skip in
// the header, a big title/subtitle, the step's content, and a sticky primary
// button. Keeps the whole wizard feeling like one premium flow.
export function OnboardingScaffold({
  step,
  total,
  title,
  subtitle,
  children,
  onNext,
  nextLabel = 'Continue',
  nextDisabled,
  loading,
  onBack,
  onSkip,
  scroll = true
}: {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
  onBack?: () => void;
  onSkip?: () => void;
  scroll?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const topPad = Math.max(insets.top, Platform.OS === 'android' ? 28 : 0);
  const progress = Math.min(1, Math.max(0, step / total));

  const Body = scroll ? ScrollView : View;

  return (
    <DarkBackground>
      <ThemedStatusBar />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.root, { paddingTop: topPad + spacing.sm }]}
      >
        {/* Header: back · progress · skip */}
        <View style={styles.header}>
          {onBack ? (
            <Pressable onPress={onBack} hitSlop={12} style={styles.iconBtn}>
              <Text style={styles.backIcon}>←</Text>
            </Pressable>
          ) : (
            <View style={styles.iconBtn} />
          )}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          {onSkip ? (
            <Pressable onPress={onSkip} hitSlop={12} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          ) : (
            <View style={styles.iconBtn} />
          )}
        </View>

        <Body
          style={styles.body}
          {...(scroll
            ? { contentContainerStyle: styles.bodyContent, showsVerticalScrollIndicator: false, keyboardShouldPersistTaps: 'handled' as const }
            : {})}
        >
          <Text style={styles.stepLabel}>STEP {step} OF {total}</Text>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={styles.content}>{children}</View>
        </Body>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
          <Pressable onPress={onNext} disabled={nextDisabled || loading}>
            <LinearGradient
              colors={colors.brandGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.cta, nextDisabled ? styles.ctaDisabled : null]}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>{nextLabel}</Text>}
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </DarkBackground>
  );
}

// Themed glass text input used across the steps.
export function OnbInput(props: TextInputProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return <TextInput placeholderTextColor={colors.textFaint} {...props} style={[styles.input, props.style]} />;
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, paddingHorizontal: spacing.lg },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
    iconBtn: { width: 44, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
    backIcon: {
      fontSize: 24,
      lineHeight: 40,
      color: c.text,
      textAlign: 'center',
      textAlignVertical: 'center',
      includeFontPadding: false
    },
    // Track color == c.border (dark value is the same rgba(255,255,255,0.1) literal).
    progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: c.border, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3, backgroundColor: c.primary },
    skipBtn: { width: 44, height: 40, alignItems: 'flex-end', justifyContent: 'center' },
    skipText: { fontFamily: fonts.sansBold, color: c.textMuted, fontSize: 14, fontWeight: '700' },
    body: { flex: 1 },
    bodyContent: { paddingBottom: spacing.xl },
    stepLabel: {
      fontFamily: fonts.sansExtraBold,
      color: c.brandText,
      fontWeight: '800',
      fontSize: 11,
      lineHeight: 15,
      letterSpacing: 1.6
    },
    title: {
      fontFamily: fonts.displayBold,
      fontSize: 30,
      fontWeight: '700',
      color: c.text,
      letterSpacing: -0.5,
      marginTop: 6,
      lineHeight: 38
    },
    subtitle: {
      fontFamily: fonts.sans,
      color: c.textMuted,
      fontSize: 15,
      letterSpacing: 0.1,
      marginTop: spacing.sm,
      lineHeight: 22
    },
    content: { marginTop: spacing.xl },
    input: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      paddingHorizontal: spacing.md,
      paddingVertical: 16,
      color: c.text,
      fontSize: 16,
      fontFamily: fonts.sans
    },
    footer: { paddingTop: spacing.sm },
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
    ctaText: { fontFamily: fonts.sansExtraBold, color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 }
  });
