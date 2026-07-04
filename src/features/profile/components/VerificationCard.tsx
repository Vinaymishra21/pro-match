import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../hooks/useAuth';
import { requestProfessionVerification, uploadPhoto } from '../../../services/apiService';
import { ApiError } from '../../../services/apiClient';
import { useTheme, useThemedStyles } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme/themes';
import { fonts } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

// Profession verification is the trust anchor of the app's USP. The badge is
// granted only after an admin reviews EVIDENCE (a LinkedIn profile and/or an
// uploaded proof document). This card requests it and reflects the state
// (none / pending / verified).
export function VerificationCard({ profession }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { user, token, updateLocalUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [linkedin, setLinkedin] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [note, setNote] = useState('');
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  const verified = Boolean(user?.professionVerified);
  const pending = !verified && user?.verificationStatus === 'pending';
  const canSubmit = Boolean(linkedin.trim() || documentUrl);

  function startVerify() {
    if (!profession) {
      Alert.alert('Set your profession first', 'Choose your profession before verifying it.');
      return;
    }
    setLinkedin('');
    setDocumentUrl('');
    setNote('');
    setOpen(true);
  }

  async function pickDocument() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Allow photo access to upload your proof document.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.8 });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      if (!asset?.uri) return;
      if (!token) {
        setDocumentUrl(asset.uri); // offline/dev: keep local uri
        return;
      }
      setUploading(true);
      const { url } = await uploadPhoto(asset.uri, token);
      setDocumentUrl(url);
    } catch (err) {
      Alert.alert('Upload failed', (err as Error)?.message || 'Could not upload document.');
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (!canSubmit) return;
    try {
      setBusy(true);
      if (!token) {
        await updateLocalUser({ ...(user || {}), verificationStatus: 'pending' });
      } else {
        const res = await requestProfessionVerification(token, {
          linkedinUrl: linkedin.trim(),
          documentUrl,
          note: note.trim()
        });
        await updateLocalUser(res.user);
      }
      setOpen(false);
      Alert.alert('Request submitted ✓', 'Your profession is under review. You’ll get the verified badge once approved.');
    } catch (err) {
      const e = err as ApiError;
      Alert.alert('Could not submit', e?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  // ————— Verified: blue tick badge —————
  if (verified) {
    return (
      <LinearGradient colors={['#2E7CF6', '#1E5FD8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.verifiedCard}>
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedCheck}>✓</Text>
        </View>
        <View style={styles.verifiedTextWrap}>
          <Text style={styles.verifiedTitle}>Verified {profession}</Text>
          <Text style={styles.verifiedSub}>Your profession is verified. People trust the blue tick.</Text>
        </View>
      </LinearGradient>
    );
  }

  // ————— Pending review —————
  if (pending) {
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.shieldCircle}>
            <Text style={styles.shield}>⏳</Text>
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.title}>Verification under review</Text>
            <Text style={styles.sub}>We’re reviewing your {profession} evidence. You’ll get the blue tick once approved.</Text>
          </View>
        </View>
      </View>
    );
  }

  // ————— Not verified: CTA + evidence modal —————
  return (
    <>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.shieldCircle}>
            <Text style={styles.shield}>🛡️</Text>
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.title}>Get the verified badge</Text>
            <Text style={styles.sub}>Prove your profession with LinkedIn or a document. Verified profiles stand out.</Text>
          </View>
        </View>
        <Pressable style={styles.cta} onPress={startVerify}>
          <Text style={styles.ctaText}>Request verification</Text>
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.sheetTitle}>Verify your profession</Text>
              <Text style={styles.sheetSub}>
                Add at least one — your LinkedIn profile or a proof document (work ID, license, degree). Our team reviews every request.
              </Text>

              <Text style={styles.label}>LinkedIn URL</Text>
              <TextInput
                value={linkedin}
                onChangeText={setLinkedin}
                placeholder="linkedin.com/in/your-name"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="url"
                style={styles.input}
              />

              <Text style={styles.label}>Proof document</Text>
              <Text style={styles.hint}>A work ID, license, degree, or badge showing you’re a {profession || 'professional'}.</Text>
              {documentUrl ? (
                <View style={styles.docPreviewWrap}>
                  <Image source={{ uri: documentUrl }} style={styles.docPreview} resizeMode="cover" />
                  <Pressable style={styles.docReplace} onPress={pickDocument} disabled={uploading}>
                    <Text style={styles.docReplaceText}>{uploading ? 'Uploading…' : 'Replace'}</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable style={styles.uploadBtn} onPress={pickDocument} disabled={uploading}>
                  {uploading ? (
                    <ActivityIndicator color={colors.text} />
                  ) : (
                    <Text style={styles.uploadText}>＋ Upload document</Text>
                  )}
                </Pressable>
              )}

              <Text style={styles.label}>Note (optional)</Text>
              <TextInput
                value={note}
                onChangeText={(t) => setNote(t.slice(0, 500))}
                placeholder="Anything that helps us verify you"
                placeholderTextColor={colors.textMuted}
                multiline
                style={[styles.input, styles.noteInput]}
              />

              <Pressable onPress={submit} disabled={!canSubmit || busy} style={{ marginTop: spacing.md }}>
                <LinearGradient
                  colors={canSubmit ? ['#2E7CF6', '#1E5FD8'] : ['#3A3444', '#2C2738']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submit}
                >
                  {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit for review</Text>}
                </LinearGradient>
              </Pressable>
              {!canSubmit ? <Text style={styles.reqHint}>Add a LinkedIn URL or a document to continue.</Text> : null}
              <Pressable onPress={() => setOpen(false)} style={styles.cancel}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: '#F5C56B',
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: spacing.md
  },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  shieldCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(251,191,36,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  shield: { fontSize: 22 },
  textWrap: { flex: 1 },
  title: { ...typography.body, fontFamily: fonts.sansExtraBold, color: c.text },
  sub: { ...typography.caption, color: c.textMuted, marginTop: 2 },
  cta: {
    backgroundColor: c.primary,
    borderRadius: 12,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center'
  },
  ctaText: { fontFamily: fonts.sansExtraBold, color: c.white, fontSize: 14 },

  // Verified (blue tick)
  verifiedCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: spacing.md, marginBottom: spacing.md },
  verifiedBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  verifiedCheck: { color: '#1E5FD8', fontSize: 24, fontWeight: '900' },
  verifiedTextWrap: { flex: 1 },
  verifiedTitle: { ...typography.body, fontFamily: fonts.sansExtraBold, color: c.white },
  verifiedSub: { ...typography.caption, color: 'rgba(255,255,255,0.92)', marginTop: 2 },

  // Modal sheet
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: c.card,
    borderTopWidth: 1,
    borderColor: c.border,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    maxHeight: '88%'
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, marginBottom: spacing.md },
  sheetTitle: { ...typography.subtitle, fontFamily: fonts.sansExtraBold, color: c.text },
  sheetSub: { ...typography.caption, color: c.textMuted, marginTop: 4, marginBottom: spacing.md, lineHeight: 19 },
  label: { fontFamily: fonts.sansBold, color: c.textMuted, fontSize: 12.5, letterSpacing: 0.3, textTransform: 'uppercase', marginTop: spacing.md, marginBottom: spacing.sm },
  hint: { ...typography.caption, color: c.textMuted, marginTop: -spacing.xs, marginBottom: spacing.sm },
  input: {
    backgroundColor: c.inputBg,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: c.text,
    fontSize: 15,
    fontFamily: fonts.sans
  },
  noteInput: { minHeight: 72, textAlignVertical: 'top', paddingTop: 12 },
  uploadBtn: {
    borderWidth: 1.5,
    borderColor: c.border,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 22,
    alignItems: 'center',
    backgroundColor: c.surface
  },
  uploadText: { fontFamily: fonts.sansBold, color: c.text, fontSize: 14 },
  docPreviewWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  docPreview: { width: 84, height: 84, borderRadius: 12, borderWidth: 1, borderColor: c.border },
  docReplace: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface },
  docReplaceText: { fontFamily: fonts.sansBold, color: c.text, fontSize: 13 },
  submit: { height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  submitText: { fontFamily: fonts.sansExtraBold, color: '#fff', fontSize: 15 },
  reqHint: { ...typography.caption, color: c.textMuted, textAlign: 'center', marginTop: spacing.sm },
  cancel: { alignItems: 'center', paddingVertical: spacing.md, marginTop: 2 },
  cancelText: { fontFamily: fonts.sansBold, color: c.textMuted, fontSize: 14 }
});
