import React from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ProfessionBadge } from './ProfessionBadge';
import { VerifiedTick } from './VerifiedTick';
import { professionTheme } from '../theme/professionTheme';
import { darkColors, darkRadius } from '../theme/darkColors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import type { DiscoverProfile } from '../types';

const { width, height } = Dimensions.get('window');
const SHEET_HEIGHT = height * 0.9;

// Premium DARK bottom-sheet profile detail. Opened by tapping a Discover card.
// Dark base + the tapped person's PRISM profession gradient as the accent.
export function ProfileDetailModal({
  profile,
  visible,
  onClose,
  onLike,
  onPass
}: {
  profile: DiscoverProfile | null;
  visible: boolean;
  onClose: () => void;
  onLike: () => void;
  onPass: () => void;
}) {
  if (!profile) return null;
  const theme = professionTheme(profile.profession);
  const accent = theme.accent;
  const photos = (profile.photos || []).filter(Boolean);
  const interests = profile.interests || [];
  const languages = profile.languages || [];
  const prompts = (profile.customPrompts || []).filter((p) => p?.answer);

  const lifestyle = [
    profile.drinking ? { icon: '🍷', label: 'Drinking', value: profile.drinking } : null,
    profile.smoking ? { icon: '🚬', label: 'Smoking', value: profile.smoking } : null,
    profile.workout ? { icon: '💪', label: 'Workout', value: profile.workout } : null,
    profile.pets ? { icon: '🐾', label: 'Pets', value: profile.pets } : null
  ].filter(Boolean) as { icon: string; label: string; value: string }[];

  const vitals = [
    profile.gender ? { icon: '🧑', label: 'Gender', value: profile.gender } : null,
    profile.height ? { icon: '📏', label: 'Height', value: profile.height } : null,
    profile.religion ? { icon: '🕊️', label: 'Religion', value: profile.religion } : null,
    profile.lookingFor ? { icon: '❤️', label: 'Looking for', value: profile.lookingFor } : null,
    languages.length ? { icon: '🗣️', label: 'Languages', value: languages.join(', ') } : null
  ].filter(Boolean) as { icon: string; label: string; value: string }[];

  function act(fn: () => void) {
    onClose();
    fn();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      {/* Dimmed backdrop — tap to close; Discover shows through at the top. */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.sheet}>
        {/* dark gradient base + profession-tinted glow */}
        <LinearGradient colors={darkColors.bgGradient} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />

        {/* Grab handle (contrasting pill) */}
        <View style={styles.handle} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} style={styles.sheetInner}>
          {/* Hero */}
          <View style={styles.hero}>
            {photos[0] ? (
              <Image source={{ uri: photos[0] }} style={styles.heroImg} resizeMode="cover" />
            ) : (
              <LinearGradient colors={theme.gradient} style={styles.heroImg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.heroEmoji}>{theme.emoji}</Text>
              </LinearGradient>
            )}

            {photos.length > 1 ? (
              <BlurView intensity={30} tint="dark" style={styles.countPill}>
                <Text style={styles.countText}>📷 {photos.length}</Text>
              </BlurView>
            ) : null}

            <LinearGradient
              colors={['transparent', 'rgba(14,11,20,0.5)', 'rgba(14,11,20,0.98)']}
              style={styles.heroOverlay}
            >
              <ProfessionBadge profession={profile.profession} verified={profile.professionVerified} />
              <View style={styles.nameRow}>
                <Text style={styles.name}>
                  {profile.name}
                  {profile.age ? `, ${profile.age}` : ''}
                </Text>
                {profile.professionVerified ? <VerifiedTick size={22} /> : null}
              </View>
              {profile.headline ? <Text style={styles.headline}>{profile.headline}</Text> : null}
              {profile.location ? <Text style={styles.location}>📍 {profile.location}</Text> : null}
            </LinearGradient>
          </View>

          <View style={styles.body}>
            {/* About */}
            {profile.bio ? (
              <Section title="About" accent={accent}>
                <Text style={styles.bodyText}>{profile.bio}</Text>
              </Section>
            ) : null}

            {/* Lead prompt — personality hook */}
            {prompts[0] ? <PromptCard prompt={prompts[0]} accent={accent} /> : null}

            {/* Work & education */}
            {profile.jobTitle || profile.company || profile.education ? (
              <Section title="Work & Education" accent={accent}>
                <Card>
                  {profile.jobTitle ? <Row icon="💼" label="Role" value={profile.jobTitle} /> : null}
                  {profile.company ? <Row icon="🏢" label="Company" value={profile.company} /> : null}
                  {profile.education ? <Row icon="🎓" label="Education" value={profile.education} /> : null}
                </Card>
              </Section>
            ) : null}

            {/* Vitals */}
            {vitals.length ? (
              <Section title="Details" accent={accent}>
                <Card>
                  {vitals.map((v) => (
                    <Row key={v.label} icon={v.icon} label={v.label} value={v.value} />
                  ))}
                </Card>
              </Section>
            ) : null}

            {/* Interests */}
            {interests.length ? (
              <Section title="Interests" accent={accent}>
                <View style={styles.chipWrap}>
                  {interests.map((it) => (
                    <View key={it} style={[styles.chip, { borderColor: accent + '66', backgroundColor: accent + '1f' }]}>
                      <Text style={[styles.chipText, { color: '#fff' }]}>{it}</Text>
                    </View>
                  ))}
                </View>
              </Section>
            ) : null}

            {/* Lifestyle */}
            {lifestyle.length ? (
              <Section title="Lifestyle" accent={accent}>
                <Card>
                  {lifestyle.map((l) => (
                    <Row key={l.label} icon={l.icon} label={l.label} value={l.value} />
                  ))}
                </Card>
              </Section>
            ) : null}

            {/* Remaining prompts */}
            {prompts.slice(1).map((p, i) => (
              <PromptCard key={`${p.prompt}-${i}`} prompt={p} accent={accent} />
            ))}

            {/* Extra photos */}
            {photos.length > 1 ? (
              <Section title="More photos" accent={accent}>
                {photos.slice(1).map((ph, i) => (
                  <Image key={i} source={{ uri: ph }} style={styles.galleryImg} resizeMode="cover" />
                ))}
              </Section>
            ) : null}

            <View style={{ height: 130 }} />
          </View>
        </ScrollView>

        {/* Sticky action bar */}
        <BlurView intensity={30} tint="dark" style={styles.actions}>
          <Pressable style={[styles.actionBtn, styles.passBtn]} onPress={() => act(onPass)}>
            <Text style={styles.passIcon}>✕</Text>
          </Pressable>
          <Pressable style={styles.closeMid} onPress={onClose}>
            <Text style={styles.closeMidText}>Close</Text>
          </Pressable>
          <Pressable onPress={() => act(onLike)}>
            <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.actionBtn, styles.likeBtn]}>
              <Text style={styles.likeIcon}>♥</Text>
            </LinearGradient>
          </Pressable>
        </BlurView>
      </View>
    </Modal>
  );
}

function Section({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={[accent, accent + '55']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.sectionTick}
        />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.glassCard}>{children}</View>;
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function PromptCard({ prompt, accent }: { prompt: { prompt: string; answer: string }; accent: string }) {
  return (
    <View style={styles.promptCard}>
      <LinearGradient colors={[accent, accent + '44']} style={styles.promptBar} />
      <View style={styles.promptInner}>
        <Text style={styles.promptQ}>{prompt.prompt}</Text>
        <Text style={styles.promptA}>“{prompt.answer}”</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SHEET_HEIGHT,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    backgroundColor: darkColors.bg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 18
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginTop: spacing.sm,
    position: 'absolute',
    top: 0,
    zIndex: 10
  },
  sheetInner: { flex: 1 },
  scroll: { paddingBottom: spacing.lg },
  hero: {
    width,
    height: width * 1.12,
    backgroundColor: darkColors.card,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden'
  },
  heroImg: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 130, opacity: 0.6 },
  countPill: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    borderRadius: darkRadius.pill,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  countText: { color: darkColors.white, fontSize: 12, fontWeight: '800' },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.lg,
    gap: 6
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  name: { color: darkColors.white, fontSize: 32, fontWeight: '900', letterSpacing: -0.6 },
  headline: { color: 'rgba(255,255,255,0.92)', fontSize: 15, fontWeight: '700' },
  location: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', marginTop: 2 },
  body: { padding: spacing.lg, paddingTop: spacing.xl },
  section: { marginBottom: spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  sectionTick: { width: 18, height: 4, borderRadius: 2 },
  sectionTitle: {
    ...typography.caption,
    color: darkColors.textMuted,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 11
  },
  bodyText: { ...typography.body, color: darkColors.textDim, lineHeight: 23, fontWeight: '500' },
  glassCard: {
    backgroundColor: darkColors.surface,
    borderWidth: 1,
    borderColor: darkColors.border,
    borderRadius: darkRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
  rowIcon: { fontSize: 16, width: 28 },
  rowLabel: { ...typography.caption, color: darkColors.textMuted, fontWeight: '700', width: 100, fontSize: 13 },
  rowValue: { ...typography.body, color: darkColors.text, fontWeight: '700', flex: 1, fontSize: 14 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { borderWidth: 1, borderRadius: darkRadius.pill, paddingHorizontal: 14, paddingVertical: 9 },
  chipText: { ...typography.caption, fontWeight: '700', fontSize: 13 },
  promptCard: {
    flexDirection: 'row',
    backgroundColor: darkColors.card,
    borderWidth: 1,
    borderColor: darkColors.border,
    borderRadius: darkRadius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden'
  },
  promptBar: { width: 5 },
  promptInner: { flex: 1, padding: spacing.md },
  promptQ: { ...typography.caption, color: darkColors.textMuted, fontWeight: '800', marginBottom: 6, fontSize: 12 },
  promptA: { ...typography.subtitle, color: darkColors.text, fontWeight: '700', lineHeight: 26 },
  galleryImg: {
    width: '100%',
    height: width * 1.05,
    borderRadius: darkRadius.xl,
    marginBottom: spacing.sm,
    backgroundColor: darkColors.card
  },
  actions: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: darkColors.border,
    backgroundColor: 'rgba(14,11,20,0.85)'
  },
  actionBtn: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6
  },
  passBtn: { backgroundColor: darkColors.surfaceStrong, borderWidth: 1, borderColor: darkColors.borderStrong },
  passIcon: { fontSize: 24, color: darkColors.textDim, fontWeight: '700' },
  likeBtn: {},
  likeIcon: { fontSize: 28, color: darkColors.white },
  closeMid: {
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    borderRadius: darkRadius.pill,
    backgroundColor: darkColors.surface,
    borderWidth: 1,
    borderColor: darkColors.border
  },
  closeMidText: { ...typography.caption, color: darkColors.textMuted, fontWeight: '800' }
});
