import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../../hooks/useAuth';
import { requestProfessionVerification } from '../../../services/apiService';
import { colorsDark as colors } from '../../../theme/colorsDark';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

// Profession verification is the trust anchor of the app's USP. The badge is
// granted only after admin review — this card lets a member REQUEST it and
// reflects the request state (none / pending / verified).
export function VerificationCard({ profession }) {
  const { user, token, updateLocalUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const verified = Boolean(user?.professionVerified);
  const pending = !verified && user?.verificationStatus === 'pending';

  async function handleVerify() {
    if (!profession) {
      Alert.alert('Set your profession first', 'Choose your profession before verifying it.');
      return;
    }
    Alert.alert(
      'Request verification',
      `Submit your ${profession} profile for review. Our team checks each request — verified members are trusted and stand out.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit request',
          onPress: async () => {
            try {
              setBusy(true);
              if (!token) {
                await updateLocalUser({ ...(user || {}), verificationStatus: 'pending' });
              } else {
                const res = await requestProfessionVerification(token);
                await updateLocalUser(res.user);
              }
              Alert.alert('Request submitted ✓', 'Your profession is under review. You’ll get the badge once approved.');
            } catch (err) {
              Alert.alert('Could not submit', err?.message || 'Please try again.');
            } finally {
              setBusy(false);
            }
          }
        }
      ]
    );
  }

  if (verified) {
    return (
      <LinearGradient
        colors={['#2A9D8F', '#1F7A6E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.verifiedCard}
      >
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedCheck}>✓</Text>
        </View>
        <View style={styles.verifiedTextWrap}>
          <Text style={styles.verifiedTitle}>Profession verified</Text>
          <Text style={styles.verifiedSub}>You're a verified {profession}. People trust verified profiles.</Text>
        </View>
      </LinearGradient>
    );
  }

  if (pending) {
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.shieldCircle}>
            <Text style={styles.shield}>⏳</Text>
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.title}>Verification under review</Text>
            <Text style={styles.sub}>Your {profession} request is being reviewed. You’ll get the badge once approved.</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.shieldCircle}>
          <Text style={styles.shield}>🛡️</Text>
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>Verify your profession</Text>
          <Text style={styles.sub}>Get a verified badge — the trust signal that sets you apart.</Text>
        </View>
      </View>
      <Pressable style={styles.cta} onPress={handleVerify} disabled={busy}>
        {busy ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.ctaText}>Request verification</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
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
  title: { ...typography.body, color: colors.text, fontWeight: '800' },
  sub: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center'
  },
  ctaText: { color: colors.white, fontWeight: '800', fontSize: 14 },
  verifiedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: spacing.md
  },
  verifiedBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  verifiedCheck: { color: colors.white, fontSize: 24, fontWeight: '900' },
  verifiedTextWrap: { flex: 1 },
  verifiedTitle: { ...typography.body, color: colors.white, fontWeight: '900' },
  verifiedSub: { ...typography.caption, color: 'rgba(255,255,255,0.9)', marginTop: 2 }
});
