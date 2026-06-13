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
import { professionTheme } from '../theme/professionTheme';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import type { DiscoverProfile } from '../types';

const { width, height } = Dimensions.get('window');
const SHEET_HEIGHT = height * 0.88;

// A premium bottom-sheet profile detail. Opened by tapping a Discover card.
// Leaves the Discover screen visible (dimmed) above it; tap the backdrop to close.
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
      {/* Dimmed backdrop — tap to close. The Discover screen shows through at top. */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.sheet}>
        {/* Grab handle */}
        <View style={styles.handle} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          style={styles.sheetInner}
        >
          {/* Hero */}
          <View style={styles.hero}>
            {photos[0] ? (
              <Image source={{ uri: photos[0] }} style={styles.heroImg} resizeMode="cover" />
            ) : (
              <LinearGradient colors={theme.gradient} style={styles.heroImg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.heroEmoji}>{theme.emoji}</Text>
              </LinearGradient>
            )}

            {/* photo count pill */}
            {photos.length > 1 ? (
              <BlurView intensity={40} tint="dark" style={styles.countPill}>
                <Text style={styles.countText}>📷 {photos.length}</Text>
              </BlurView>
            ) : null}

            <LinearGradient colors={['transparent', 'rgba(8,12,24,0.92)']} style={styles.heroOverlay}>
              <ProfessionBadge profession={profile.profession} verified={profile.professionVerified} />
              <Text style={styles.name}>
                {profile.name}
                {profile.age ? `, ${profile.age}` : ''}
              </Text>
              {profile.headline ? <Text style={styles.headline}>{profile.headline}</Text> : null}
              {profile.location ? <Text style={styles.location}>📍 {profile.location}</Text> : null}
            </LinearGradient>
          </View>

          <View style={styles.body}>
            {/* About */}
            {profile.bio ? (
              <Section title="About" accent={theme.accent}>
                <Text style={styles.bodyText}>{profile.bio}</Text>
              </Section>
            ) : null}

            {/* First prompt floated up high — it's the personality hook */}
            {prompts[0] ? <PromptCard prompt={prompts[0]} accent={theme.accent} /> : null}

            {/* Work & education */}
            {profile.jobTitle || profile.company || profile.education ? (
              <Section title="Work & Education" accent={theme.accent}>
                {profile.jobTitle ? <Row icon="💼" label="Role" value={profile.jobTitle} /> : null}
                {profile.company ? <Row icon="🏢" label="Company" value={profile.company} /> : null}
                {profile.education ? <Row icon="🎓" label="Education" value={profile.education} /> : null}
              </Section>
            ) : null}

            {/* Vitals */}
            {vitals.length ? (
              <Section title="Details" accent={theme.accent}>
                {vitals.map((v) => (
                  <Row key={v.label} icon={v.icon} label={v.label} value={v.value} />
                ))}
              </Section>
            ) : null}

            {/* Interests */}
            {interests.length ? (
              <Section title="Interests" accent={theme.accent}>
                <View style={styles.chipWrap}>
                  {interests.map((it) => (
                    <View key={it} style={[styles.chip, { borderColor: theme.accent + '55' }]}>
                      <Text style={[styles.chipText, { color: theme.accent }]}>{it}</Text>
                    </View>
                  ))}
                </View>
              </Section>
            ) : null}

            {/* Lifestyle */}
            {lifestyle.length ? (
              <Section title="Lifestyle" accent={theme.accent}>
                {lifestyle.map((l) => (
                  <Row key={l.label} icon={l.icon} label={l.label} value={l.value} />
                ))}
              </Section>
            ) : null}

            {/* Remaining prompts */}
            {prompts.slice(1).map((p, i) => (
              <PromptCard key={`${p.prompt}-${i}`} prompt={p} accent={theme.accent} />
            ))}

            {/* Extra photos */}
            {photos.length > 1 ? (
              <Section title="More photos" accent={theme.accent}>
                {photos.slice(1).map((ph, i) => (
                  <Image key={i} source={{ uri: ph }} style={styles.galleryImg} resizeMode="cover" />
                ))}
              </Section>
            ) : null}

            <View style={{ height: 120 }} />
          </View>
        </ScrollView>

        {/* Sticky action bar */}
        <View style={styles.actions}>
          <Pressable style={[styles.actionBtn, styles.passBtn]} onPress={() => act(onPass)}>
            <Text style={styles.passIcon}>✕</Text>
          </Pressable>
          <Pressable style={styles.closeMid} onPress={onClose}>
            <Text style={styles.closeMidText}>Close</Text>
          </Pressable>
          <Pressable onPress={() => act(onLike)}>
            <LinearGradient
              colors={theme.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.actionBtn, styles.likeBtn]}
            >
              <Text style={styles.likeIcon}>♥</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Section({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionTick, { backgroundColor: accent }]} />
        <Text style={[styles.sectionTitle, { color: accent }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
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
      <View style={[styles.promptBar, { backgroundColor: accent }]} />
      <View style={styles.promptInner}>
        <Text style={styles.promptQ}>{prompt.prompt}</Text>
        <Text style={styles.promptA}>“{prompt.answer}”</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SHEET_HEIGHT,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
    marginTop: spacing.sm,
    position: 'absolute',
    top: 0,
    zIndex: 10
  },
  sheetInner: { flex: 1 },
  scroll: { paddingBottom: spacing.lg },
  hero: {
    width,
    height: width * 1.08,
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden'
  },
  heroImg: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 120, opacity: 0.5 },
  countPill: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  countText: { color: colors.white, fontSize: 12, fontWeight: '800' },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    gap: 6
  },
  name: { color: colors.white, fontSize: 30, fontWeight: '900', letterSpacing: -0.5, marginTop: 8 },
  headline: { color: 'rgba(255,255,255,0.95)', fontSize: 15, fontWeight: '700' },
  location: { color: 'rgba(255,255,255,0.82)', fontSize: 13, fontWeight: '600', marginTop: 2 },
  body: { padding: spacing.lg, paddingTop: spacing.xl },
  section: { marginBottom: spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  sectionTick: { width: 14, height: 4, borderRadius: 2 },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 12
  },
  bodyText: { ...typography.body, color: colors.text, lineHeight: 23 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  rowIcon: { fontSize: 16, width: 28 },
  rowLabel: { ...typography.caption, color: colors.textMuted, fontWeight: '700', width: 100 },
  rowValue: { ...typography.body, color: colors.text, fontWeight: '700', flex: 1 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  chipText: { ...typography.caption, fontWeight: '800' },
  promptCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: '#16324F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3
  },
  promptBar: { width: 5 },
  promptInner: { flex: 1, padding: spacing.md },
  promptQ: { ...typography.caption, color: colors.textMuted, fontWeight: '800', marginBottom: 6 },
  promptA: { ...typography.subtitle, color: colors.text, fontWeight: '700', lineHeight: 26 },
  galleryImg: {
    width: '100%',
    height: width * 1.05,
    borderRadius: 22,
    marginBottom: spacing.sm,
    backgroundColor: colors.card
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
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  actionBtn: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16324F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6
  },
  passBtn: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  passIcon: { fontSize: 24, color: colors.textMuted, fontWeight: '700' },
  likeBtn: {},
  likeIcon: { fontSize: 28, color: colors.white },
  closeMid: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border
  },
  closeMidText: { ...typography.caption, color: colors.textMuted, fontWeight: '800' }
});
