import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DarkBackground } from '../../components/DarkBackground';
import { useTopInset } from '../../hooks/useTopInset';
import { API_BASE_URL } from '../../constants/api';
import { useAuth } from '../../hooks/useAuth';
import { ThemedStatusBar, useTheme, useThemedStyles, type ThemeMode, type ThemeScheme } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme/themes';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const APPEARANCE_OPTIONS: { value: ThemeScheme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' }
];

function Row({ label, sublabel, onPress, danger, last, styles }: any) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, last ? styles.rowLast : null, pressed ? styles.rowPressed : null]}
      onPress={onPress}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, danger ? styles.danger : null]}>{label}</Text>
        {sublabel ? <Text style={styles.rowSub}>{sublabel}</Text> : null}
      </View>
      <Text style={[styles.chevron, danger ? styles.danger : null]}>›</Text>
    </Pressable>
  );
}

export function SettingsScreen({ navigation }: Props) {
  const { user, signOut, deactivateAccount, deleteAccount } = useAuth();
  const { colors, mode, scheme, setScheme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const topPad = useTopInset();
  const [busy, setBusy] = useState('');

  function confirmLogout() {
    Alert.alert('Log out?', 'You can log back in anytime.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => signOut() }
    ]);
  }

  function confirmDeactivate() {
    Alert.alert(
      'Deactivate account?',
      "Your profile will be hidden and you won't appear in Discover or Matches. Log back in anytime to restore it.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              setBusy('deactivate');
              await deactivateAccount();
            } catch (e) {
              Alert.alert('Could not deactivate', (e as Error).message);
            } finally {
              setBusy('');
            }
          }
        }
      ]
    );
  }

  function confirmDelete() {
    Alert.alert(
      'Delete account permanently?',
      'This erases your profile, matches, and messages. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete forever',
          style: 'destructive',
          onPress: () =>
            // Second confirmation — destructive + irreversible.
            Alert.alert('Are you absolutely sure?', 'There is no way to recover your account after this.', [
              { text: 'Keep my account', style: 'cancel' },
              {
                text: 'Delete forever',
                style: 'destructive',
                onPress: async () => {
                  try {
                    setBusy('delete');
                    await deleteAccount();
                  } catch (e) {
                    Alert.alert('Could not delete', (e as Error).message);
                  } finally {
                    setBusy('');
                  }
                }
              }
            ])
        }
      ]
    );
  }

  // Dark keeps this screen's original stronger orb tint byte-identical; light
  // falls back to the palette's soft blush default.
  return (
    <DarkBackground orbColor={mode === 'dark' ? 'rgba(232,65,90,0.18)' : undefined}>
      <ThemedStatusBar />
      <View
        style={[
          styles.container,
          {
            paddingTop: topPad + spacing.md,
            paddingBottom: insets.bottom
          }
        ]}
      >
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.account}>{user?.name || 'Your account'}</Text>
        <Text style={styles.accountSub}>{user?.phone || user?.email || ''}</Text>

        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.card}>
          <View style={styles.segmentTrack}>
            {APPEARANCE_OPTIONS.map((option) => {
              const active = scheme === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setScheme(option.value)}
                  style={({ pressed }) => [
                    styles.segment,
                    active ? styles.segmentActive : null,
                    pressed && !active ? styles.segmentPressed : null
                  ]}
                >
                  <Text style={[styles.segmentLabel, active ? styles.segmentLabelActive : null]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.segmentHint}>System follows your device setting</Text>
        </View>

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <Row label="Log out" onPress={confirmLogout} styles={styles} />
          <Row
            label="Deactivate account"
            sublabel="Hide your profile — restore anytime by logging in"
            onPress={confirmDeactivate}
            last
            styles={styles}
          />
        </View>

        <Text style={styles.sectionTitle}>Support & Legal</Text>
        <View style={styles.card}>
          <Row
            label="Contact support"
            sublabel="wovnnsupport@gmail.com"
            onPress={() => Linking.openURL('mailto:wovnnsupport@gmail.com?subject=Wovnn%20Support')}
            styles={styles}
          />
          <Row
            label="Terms of Service"
            onPress={() => Linking.openURL(`${API_BASE_URL}/terms`)}
            styles={styles}
          />
          <Row
            label="Privacy Policy"
            onPress={() => Linking.openURL(`${API_BASE_URL}/privacy`)}
            last
            styles={styles}
          />
        </View>

        <Text style={styles.sectionTitle}>Danger zone</Text>
        <View style={styles.card}>
          <Row
            label="Delete account"
            sublabel="Permanently erase your data — cannot be undone"
            onPress={confirmDelete}
            danger
            last
            styles={styles}
          />
        </View>

        {busy ? (
          <View style={styles.busy}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.busyText}>
              {busy === 'delete' ? 'Deleting your account…' : 'Deactivating…'}
            </Text>
          </View>
        ) : null}
      </ScrollView>
      </View>
    </DarkBackground>
  );
}

const makeStyles = (c: ThemeColors, mode: ThemeMode) =>
  StyleSheet.create({
    container: { flex: 1, paddingHorizontal: spacing.lg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
    back: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    backText: {
      fontSize: 30,
      lineHeight: 32,
      color: c.text,
      textAlign: 'center',
      textAlignVertical: 'center',
      includeFontPadding: false
    },
    title: { ...typography.subtitle, color: c.text, fontWeight: '900' },
    scroll: { paddingBottom: spacing.xxl },
    account: { ...typography.title, color: c.text, fontSize: 22, lineHeight: 28 },
    accountSub: { ...typography.caption, color: c.textMuted, marginTop: 2, marginBottom: spacing.lg },
    sectionTitle: {
      ...typography.caption,
      color: c.textMuted,
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      fontSize: 12,
      marginBottom: spacing.xs,
      marginTop: spacing.md
    },
    card: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      overflow: 'hidden'
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.border
    },
    rowLast: { borderBottomWidth: 0 },
    rowPressed: { backgroundColor: c.inputBg },
    rowLabel: { ...typography.body, color: c.text, fontWeight: '700' },
    rowSub: { ...typography.caption, color: c.textMuted, marginTop: 2 },
    chevron: { fontSize: 22, color: c.textMuted },
    // '#F87171' predates the theme system; keep it byte-identical in dark,
    // use the palette's AA-checked danger tone in light.
    danger: { color: mode === 'dark' ? '#F87171' : c.danger },
    busy: { alignItems: 'center', marginTop: spacing.xl, gap: spacing.sm },
    busyText: { ...typography.caption, color: c.textMuted },
    // Appearance segmented control
    segmentTrack: {
      flexDirection: 'row',
      gap: spacing.xs,
      padding: spacing.sm
    },
    segment: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.xs + 2,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'transparent'
    },
    segmentActive: {
      backgroundColor: c.brandSoft,
      borderColor: c.brandBorder
    },
    segmentPressed: {
      backgroundColor: c.surfaceStrong
    },
    segmentLabel: { ...typography.caption, color: c.textMuted, fontWeight: '700' },
    segmentLabelActive: { color: c.brandText, fontWeight: '800' },
    segmentHint: {
      ...typography.caption,
      color: c.textFaint,
      fontSize: 12,
      lineHeight: 16,
      paddingHorizontal: spacing.sm,
      paddingBottom: spacing.sm
    }
  });
