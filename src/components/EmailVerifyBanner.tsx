import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { resendEmailVerification, verifyEmail } from '../services/apiService';
import { useTheme, useThemedStyles, type ThemeMode } from '../theme/ThemeProvider';
import type { ThemeColors } from '../theme/themes';
import { spacing } from '../theme/spacing';

// Non-blocking nudge to confirm ownership of a signup email. Renders nothing
// for phone/social accounts or once verified.
export function EmailVerifyBanner() {
  const { user, token, updateLocalUser } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  if (!user?.email || user.emailVerified) return null;

  async function sendCode() {
    try {
      setBusy(true);
      setStatus('');
      const res = await resendEmailVerification(token);
      if (res.alreadyVerified) {
        await updateLocalUser({ ...user, emailVerified: true });
        return;
      }
      if (res.devCode) {
        setDevCode(res.devCode);
        setCode(res.devCode);
      }
      setOpen(true);
      setStatus('Code sent — check your email.');
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!code.trim()) return;
    try {
      setBusy(true);
      setStatus('');
      const res = await verifyEmail(code.trim(), token);
      await updateLocalUser(res.user); // emailVerified now true → banner unmounts
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.icon}>✉️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.sub} numberOfLines={1}>{user.email}</Text>
        </View>
        {!open ? (
          <Pressable onPress={sendCode} disabled={busy} style={styles.btn}>
            <Text style={styles.btnText}>{busy ? '…' : 'Send code'}</Text>
          </Pressable>
        ) : null}
      </View>

      {open ? (
        <View style={styles.entry}>
          {devCode ? <Text style={styles.dev}>Dev code: {devCode}</Text> : null}
          <View style={styles.entryRow}>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="6-digit code"
              placeholderTextColor={colors.textFaint}
              style={styles.input}
              keyboardType="number-pad"
            />
            <Pressable onPress={submit} disabled={busy || !code.trim()} style={styles.btn}>
              <Text style={styles.btnText}>{busy ? '…' : 'Verify'}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {status ? <Text style={styles.status}>{status}</Text> : null}
    </View>
  );
}

const makeStyles = (c: ThemeColors, mode: ThemeMode) =>
  StyleSheet.create({
    wrap: {
      backgroundColor: mode === 'dark' ? 'rgba(251,191,36,0.10)' : 'rgba(251,191,36,0.14)',
      borderWidth: 1,
      borderColor: 'rgba(251,191,36,0.45)',
      borderRadius: 16,
      padding: spacing.md,
      gap: spacing.sm
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    icon: { fontSize: 20 },
    title: { color: c.text, fontWeight: '800', fontSize: 14 },
    sub: { color: c.textMuted, fontSize: 12.5, fontWeight: '500' },
    btn: {
      backgroundColor: c.primary,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8
    },
    btnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
    entry: { gap: 6 },
    dev: { color: c.brandText, fontSize: 12.5, fontWeight: '700' },
    entryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    input: {
      flex: 1,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      color: c.text,
      fontSize: 15,
      fontWeight: '600'
    },
    status: { color: c.textMuted, fontSize: 12.5 }
  });
