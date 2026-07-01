import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { getReportReasons, reportUser } from '../services/apiService';
import { colorsDark as colors } from '../theme/colorsDark';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const FALLBACK_REASONS = [
  'Harassment or bullying',
  'Fake profile',
  'Inappropriate photos',
  'Spam or scam',
  'Underage',
  'Other'
];

type Props = {
  visible: boolean;
  userId?: string;
  name: string;
  onClose: () => void;
  // Called after a successful report; tells the parent whether the user blocked too.
  onReported?: (blocked: boolean) => void;
};

// Bottom-sheet to report a user: pick a reason, optional note, and choose
// whether to also block them.
export function ReportSheet({ visible, userId, name, onClose, onReported }: Props) {
  const { token } = useAuth();
  const [reasons, setReasons] = useState<string[]>(FALLBACK_REASONS);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true); // safer default; user can turn off
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible || !token) return;
    getReportReasons(token)
      .then((r) => {
        if (r.reasons?.length) setReasons(r.reasons);
      })
      .catch(() => {
        /* keep fallback */
      });
  }, [visible, token]);

  // Reset form each time it opens.
  useEffect(() => {
    if (visible) {
      setReason('');
      setNote('');
      setAlsoBlock(true);
    }
  }, [visible]);

  async function submit() {
    if (!reason) {
      Alert.alert('Pick a reason', 'Please choose why you’re reporting this person.');
      return;
    }
    if (!userId) {
      Alert.alert('Unavailable', 'Reopen this chat from Matches to report.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await reportUser({ userId, reason, note: note.trim(), alsoBlock }, token);
      onClose();
      onReported?.(res.blocked);
      Alert.alert(
        'Report submitted',
        res.blocked
          ? `Thanks for keeping Pro Match safe. ${name} has been blocked.`
          : 'Thanks for keeping Pro Match safe. Our team will review this.'
      );
    } catch (err) {
      Alert.alert('Could not submit', (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.handle} />
            <Text style={styles.title}>Report {name}</Text>
            <Text style={styles.sub}>This is anonymous. They won’t know you reported them.</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
              {reasons.map((r) => {
                const active = r === reason;
                return (
                  <Pressable
                    key={r}
                    style={[styles.reason, active ? styles.reasonActive : null]}
                    onPress={() => setReason(r)}
                  >
                    <Text style={[styles.reasonText, active ? styles.reasonTextActive : null]}>{r}</Text>
                    {active ? <Text style={styles.reasonCheck}>✓</Text> : null}
                  </Pressable>
                );
              })}

              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Add details (optional)"
                placeholderTextColor={colors.textMuted}
                multiline
                style={styles.note}
                maxLength={1000}
              />

              <Pressable style={styles.blockRow} onPress={() => setAlsoBlock((v) => !v)}>
                <View style={[styles.checkbox, alsoBlock ? styles.checkboxOn : null]}>
                  {alsoBlock ? <Text style={styles.checkboxTick}>✓</Text> : null}
                </View>
                <Text style={styles.blockLabel}>Also block {name}</Text>
              </Pressable>
            </ScrollView>

            <Pressable
              style={[styles.submit, !reason ? styles.submitDisabled : null]}
              onPress={submit}
              disabled={submitting || !reason}
            >
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitText}>Submit report</Text>
              )}
            </Pressable>
            <Pressable onPress={onClose} style={styles.cancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderColor: colors.border,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    maxHeight: '85%'
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md
  },
  title: { ...typography.subtitle, color: colors.text, fontWeight: '900' },
  sub: { ...typography.caption, color: colors.textMuted, marginTop: 2, marginBottom: spacing.md },
  scroll: { maxHeight: 380 },
  reason: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.sm
  },
  reasonActive: { borderColor: colors.primary, backgroundColor: 'rgba(232,65,90,0.15)' },
  reasonText: { ...typography.body, color: colors.text, fontWeight: '600' },
  reasonTextActive: { color: colors.primary, fontWeight: '800' },
  reasonCheck: { color: colors.primary, fontWeight: '900', fontSize: 16 },
  note: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    padding: spacing.md,
    minHeight: 70,
    textAlignVertical: 'top',
    color: colors.text,
    fontSize: 14,
    marginTop: spacing.xs,
    marginBottom: spacing.md
  },
  blockRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxTick: { color: colors.white, fontWeight: '900', fontSize: 14 },
  blockLabel: { ...typography.body, color: colors.text, fontWeight: '600' },
  submit: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  cancel: { alignItems: 'center', paddingVertical: spacing.md },
  cancelText: { ...typography.body, color: colors.textMuted, fontWeight: '700' }
});
