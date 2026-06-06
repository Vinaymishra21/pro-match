import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

function Row({ label, sublabel, onPress, danger, last }: any) {
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

  return (
    <ScreenContainer>
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

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <Row label="Log out" onPress={confirmLogout} />
          <Row
            label="Deactivate account"
            sublabel="Hide your profile — restore anytime by logging in"
            onPress={confirmDeactivate}
            last
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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  back: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 30, color: colors.text, marginTop: -4 },
  title: { ...typography.subtitle, color: colors.text, fontWeight: '900' },
  scroll: { paddingBottom: spacing.xxl },
  account: { ...typography.title, color: colors.text, fontWeight: '900', fontSize: 22 },
  accountSub: { ...typography.caption, color: colors.textMuted, marginTop: 2, marginBottom: spacing.lg },
  sectionTitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontSize: 12,
    marginBottom: spacing.xs,
    marginTop: spacing.md
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    overflow: 'hidden'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  rowLast: { borderBottomWidth: 0 },
  rowPressed: { backgroundColor: colors.inputBg },
  rowLabel: { ...typography.body, color: colors.text, fontWeight: '700' },
  rowSub: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  chevron: { fontSize: 22, color: colors.textMuted },
  danger: { color: '#DC2626' },
  busy: { alignItems: 'center', marginTop: spacing.xl, gap: spacing.sm },
  busyText: { ...typography.caption, color: colors.textMuted }
});
