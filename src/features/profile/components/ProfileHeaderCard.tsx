// @ts-nocheck
import { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { VerifiedTick } from '../../../components/VerifiedTick';
import { professionTheme } from '../../../theme/professionTheme';
import { useTheme, useThemedStyles, type ThemeMode } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme/themes';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';

const AVATAR = 104;
const STROKE = 3.5;
const R = (AVATAR - STROKE) / 2;
const CIRC = 2 * Math.PI * R;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Avatar wrapped in an animated completion ring — the profile's premium
// centerpiece. The ring fills to `percent`; the avatar shows the main photo,
// or the initial on the profession's own gradient when there's no photo yet.
function CompletionRing({ percent, photo, initial, profession }) {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: percent, useNativeDriver: false, tension: 26, friction: 11 }).start();
  }, [anim, percent]);

  const offset = anim.interpolate({ inputRange: [0, 100], outputRange: [CIRC, 0], extrapolate: 'clamp' });

  return (
    <View style={{ width: AVATAR, height: AVATAR }}>
      <Svg width={AVATAR} height={AVATAR} style={StyleSheet.absoluteFill}>
        <Circle cx={AVATAR / 2} cy={AVATAR / 2} r={R} fill="none" stroke={colors.border} strokeWidth={STROKE} />
        <AnimatedCircle
          cx={AVATAR / 2}
          cy={AVATAR / 2}
          r={R}
          fill="none"
          stroke={colors.primary}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${AVATAR / 2} ${AVATAR / 2})`}
        />
      </Svg>
      <View style={styles.avatarInner}>
        {photo ? (
          <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={professionTheme(profession).gradient}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={[StyleSheet.absoluteFill, styles.avatarFallback]}
          >
            <Text style={styles.avatarInitial}>{initial}</Text>
          </LinearGradient>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarInner: {
    position: 'absolute',
    top: 7,
    left: 7,
    width: AVATAR - 14,
    height: AVATAR - 14,
    borderRadius: (AVATAR - 14) / 2,
    overflow: 'hidden'
  },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: fonts.display, fontSize: 34, color: '#FFFFFF' }
});

export function ProfileHeaderCard({ completion, mode, onModeChange, name, age, photo, profession, verified }) {
  const themed = useThemedStyles(makeStyles);
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true })
    ]).start();
  }, [scaleAnim, opacityAnim]);

  const hasProfession = Boolean(profession) && profession !== 'Not set';
  const initial = (String(name || '').trim()[0] || '?').toUpperCase();
  const displayName = name ? (age ? `${name}, ${age}` : name) : 'Your name';
  const isComplete = completion.percent === 100;

  return (
    <Animated.View style={[themed.card, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
      <View style={themed.identityRow}>
        <CompletionRing percent={completion.percent} photo={photo} initial={initial} profession={profession} />
        <View style={themed.identityText}>
          <View style={themed.nameRow}>
            <Text style={themed.name} numberOfLines={1}>
              {displayName}
            </Text>
            {verified ? <VerifiedTick size={18} /> : null}
          </View>

          {hasProfession ? (
            <LinearGradient
              colors={professionTheme(profession).gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={themed.professionPill}
            >
              <Text style={themed.professionText} numberOfLines={1}>
                {profession}
              </Text>
            </LinearGradient>
          ) : (
            <View style={themed.addProfession}>
              <Text style={themed.addProfessionText}>+ Add profession</Text>
            </View>
          )}

          <Text style={themed.percent}>
            {isComplete ? 'Profile complete ✨' : `${completion.percent}% complete`}
          </Text>
        </View>
      </View>

      {!isComplete && completion.missing?.length ? (
        <View style={themed.missingWrap}>
          <Text style={themed.missingLabel}>Complete these next</Text>
          <View style={themed.badgesWrap}>
            {completion.missing.slice(0, 4).map((item) => (
              <View key={item} style={themed.badge}>
                <Text style={themed.badgeText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={themed.toggleRow}>
        <Pressable
          onPress={() => onModeChange('edit')}
          style={[themed.toggle, mode === 'edit' ? themed.toggleActive : null]}
        >
          <Text style={[themed.toggleLabel, mode === 'edit' ? themed.toggleLabelActive : null]}>Edit</Text>
        </Pressable>
        <Pressable
          onPress={() => onModeChange('preview')}
          style={[themed.toggle, mode === 'preview' ? themed.toggleActive : null]}
        >
          <Text style={[themed.toggleLabel, mode === 'preview' ? themed.toggleLabelActive : null]}>Preview</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const makeStyles = (c: ThemeColors, mode: ThemeMode) =>
  StyleSheet.create({
    card: {
      backgroundColor: mode === 'dark' ? c.surface : c.card,
      borderWidth: mode === 'dark' ? 1 : 0,
      borderColor: c.border,
      borderRadius: 22,
      padding: spacing.lg,
      marginBottom: spacing.md,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 14,
      elevation: 3
    },
    identityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    identityText: { flex: 1, gap: 8, minWidth: 0 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    name: {
      fontFamily: fonts.display,
      color: c.text,
      fontSize: 25,
      letterSpacing: -0.3,
      flexShrink: 1
    },
    professionPill: {
      alignSelf: 'flex-start',
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 5
    },
    professionText: {
      fontFamily: fonts.sansBold,
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.2
    },
    addProfession: {
      alignSelf: 'flex-start',
      borderRadius: 999,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: c.border,
      paddingHorizontal: 12,
      paddingVertical: 5
    },
    addProfessionText: { fontFamily: fonts.sansBold, color: c.textMuted, fontSize: 11, fontWeight: '700' },
    percent: { fontFamily: fonts.sansBold, color: c.primary, fontSize: 11.5, fontWeight: '700' },
    missingWrap: { marginTop: spacing.md },
    missingLabel: {
      ...typography.caption,
      color: c.textMuted,
      fontWeight: '600',
      marginBottom: spacing.xs
    },
    badgesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    badge: {
      backgroundColor: 'rgba(232,65,90,0.12)',
      borderColor: '#F4A261',
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6
    },
    badgeText: { ...typography.caption, color: c.gold, fontWeight: '600', fontSize: 12 },
    toggleRow: {
      marginTop: spacing.md,
      backgroundColor: c.inputBg,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      flexDirection: 'row',
      padding: 4
    },
    toggle: { flex: 1, borderRadius: 999, paddingVertical: 10, alignItems: 'center' },
    toggleActive: {
      backgroundColor: c.primary,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 2
    },
    toggleLabel: { ...typography.caption, color: c.textMuted, fontWeight: '700' },
    toggleLabelActive: { color: '#FFFFFF' }
  });
