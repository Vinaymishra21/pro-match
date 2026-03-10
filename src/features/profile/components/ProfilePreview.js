import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChipSelector } from './ChipSelector';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

function Row({ label, value, icon }) {
  if (!value) {
    return null;
  }

  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        {icon ? <Text style={styles.rowIcon}>{icon}</Text> : null}
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function PromptCard({ prompt, answer, accentColor, icon }) {
  if (!answer) {
    return null;
  }

  return (
    <View style={styles.promptCard}>
      <View style={[styles.promptAccent, { backgroundColor: accentColor || colors.primary }]} />
      <View style={styles.promptInner}>
        <View style={styles.promptHeader}>
          {icon ? (
            <View style={[styles.promptIconCircle, { backgroundColor: (accentColor || colors.primary) + '18' }]}>
              <Text style={styles.promptIcon}>{icon}</Text>
            </View>
          ) : null}
          <Text style={styles.promptQuestion}>{prompt}</Text>
        </View>
        <View style={styles.promptAnswerWrap}>
          <Text style={styles.promptOpenQuote}>{'\u201C'}</Text>
          <Text style={styles.promptAnswer}>{answer}</Text>
        </View>
      </View>
    </View>
  );
}

export function ProfilePreview({ form, profession }) {
  const mainPhoto = form.photos?.[0];
  const interests = Array.isArray(form.interests) ? form.interests : [];
  const gallery = Array.isArray(form.photos) ? form.photos.filter(Boolean).slice(1) : [];
  const [previewUrl, setPreviewUrl] = useState('');

  return (
    <View style={styles.root}>
      <View style={styles.heroCard}>
        {mainPhoto ? (
          <Image source={{ uri: mainPhoto }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={styles.heroPlaceholder}>
            <View style={styles.placeholderIcon}>
              <Text style={styles.placeholderEmoji}>{'\uD83D\uDCF7'}</Text>
            </View>
            <Text style={styles.heroPlaceholderText}>Add a photo to bring your profile to life</Text>
          </View>
        )}
        <View style={styles.overlay}>
          <Text style={styles.name}>
            {form.name || 'Your Name'}
            {form.age ? `, ${form.age}` : ''}
          </Text>
          {profession ? (
            <View style={styles.professionBadge}>
              <Text style={styles.professionText}>{profession}</Text>
            </View>
          ) : null}
          {form.headline ? <Text style={styles.headline}>{form.headline}</Text> : null}
        </View>
      </View>

      {form.bio ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About me</Text>
          <Text style={styles.body}>{form.bio}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick facts</Text>
        <Row label="Location" value={form.location} icon={'\uD83D\uDCCD'} />
        <Row label="Looking for" value={form.lookingFor} icon={'\u2764\uFE0F'} />
        <Row label="Job" value={form.jobTitle} icon={'\uD83D\uDCBC'} />
        <Row label="Company" value={form.company} icon={'\uD83C\uDFE2'} />
        <Row label="Education" value={form.education} icon={'\uD83C\uDF93'} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Lifestyle</Text>
        <Row label="Drinking" value={form.drinking} icon={'\uD83C\uDF77'} />
        <Row label="Smoking" value={form.smoking} icon={'\uD83D\uDEAC'} />
        <Row label="Workout" value={form.workout} icon={'\uD83D\uDCAA'} />
        <Row label="Pets" value={form.pets} icon={'\uD83D\uDC3E'} />
      </View>

      {interests.length ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Interests</Text>
          <ChipSelector options={interests} value={interests} multi disabled />
        </View>
      ) : null}

      <PromptCard
        prompt="Why I chose my profession"
        answer={form.professionWhy}
        accentColor={colors.primary}
        icon={'\uD83D\uDCBC'}
      />
      {form.professionLoveLevel ? (
        <View style={styles.loveCard}>
          <Text style={styles.loveEmoji}>
            {form.professionLoveLevel === "It's my calling" ? '\uD83D\uDD25' :
             form.professionLoveLevel === 'I love it' ? '\uD83D\uDE0D' :
             form.professionLoveLevel === 'I like it' ? '\uD83D\uDE42' : '\uD83D\uDE10'}
          </Text>
          <Text style={styles.loveLabel}>How much I love my profession</Text>
          <Text style={styles.loveValue}>{form.professionLoveLevel}</Text>
        </View>
      ) : null}
      <PromptCard
        prompt="My ideal first date"
        answer={form.firstDateIdea}
        accentColor={colors.secondary}
        icon={'\u2615'}
      />
      <PromptCard
        prompt="My weekend vibe"
        answer={form.weekendVibe}
        accentColor="#F4A261"
        icon={'\uD83C\uDF1F'}
      />

      {gallery.length ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>More photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
            {gallery.map((photo) => (
              <Pressable key={photo} onPress={() => setPreviewUrl(photo)}>
                <Image source={{ uri: photo }} style={styles.thumb} />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <Modal visible={Boolean(previewUrl)} transparent animationType="fade" onRequestClose={() => setPreviewUrl('')}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalClose} onPress={() => setPreviewUrl('')}>
            <Text style={styles.modalCloseText}>Close</Text>
          </Pressable>
          {previewUrl ? <Image source={{ uri: previewUrl }} style={styles.modalImage} resizeMode="contain" /> : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4
  },
  heroImage: {
    width: '100%',
    height: 360
  },
  heroPlaceholder: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg
  },
  placeholderIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  placeholderEmoji: {
    fontSize: 26
  },
  heroPlaceholderText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center'
  },
  overlay: {
    padding: spacing.lg
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text
  },
  professionBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    backgroundColor: '#FDEEE8',
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4
  },
  professionText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700'
  },
  headline: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontStyle: 'italic'
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1
  },
  cardTitle: {
    ...typography.subtitle,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.sm
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
    lineHeight: 24
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4FA'
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  rowIcon: {
    fontSize: 16,
    marginRight: spacing.xs
  },
  rowLabel: {
    ...typography.caption,
    color: colors.textMuted
  },
  rowValue: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700'
  },
  promptCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2
  },
  promptAccent: {
    width: 5
  },
  promptInner: {
    flex: 1,
    padding: spacing.lg
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  promptIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs
  },
  promptIcon: {
    fontSize: 16
  },
  promptQuestion: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
    flex: 1
  },
  promptAnswerWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  promptOpenQuote: {
    fontSize: 26,
    color: colors.border,
    fontWeight: '700',
    lineHeight: 30,
    marginRight: 4,
    marginTop: -2
  },
  promptAnswer: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
    lineHeight: 24,
    flex: 1
  },
  loveCard: {
    backgroundColor: '#FDEEE8',
    borderRadius: 18,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1
  },
  loveEmoji: {
    fontSize: 36,
    marginBottom: spacing.xs
  },
  loveLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs
  },
  loveValue: {
    ...typography.subtitle,
    color: colors.primary,
    fontWeight: '800'
  },
  galleryRow: {
    gap: spacing.sm
  },
  thumb: {
    width: 130,
    height: 170,
    borderRadius: 14
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg
  },
  modalImage: {
    width: '100%',
    height: '80%'
  },
  modalClose: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    marginBottom: spacing.md
  },
  modalCloseText: {
    color: colors.white,
    fontWeight: '700'
  }
});
