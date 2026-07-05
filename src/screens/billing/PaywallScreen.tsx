import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DarkBackground } from '../../components/DarkBackground';
import { GradientButton } from '../../components/GradientButton';
import { useAuth } from '../../hooks/useAuth';
import { devGrant, getBillingCatalog } from '../../services/apiService';
import { gradients } from '../../theme/gradients';
import { ThemedStatusBar, useTheme, useThemedStyles, type ThemeMode } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme/themes';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import type { BillingCatalog, CreditPack, ProPlan, RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Paywall'>;

type Perk = { icon: string; text: string };

// Every perk maps to a real Pro entitlement (backend/src/config/monetization.js).
// Super Like / Boost counts come from the live catalog so the copy can never
// drift from what the server actually grants.
function buildProPerks(catalog: BillingCatalog): Perk[] {
  const perks: Perk[] = [
    { icon: '👀', text: 'See everyone who likes you — instantly unblurred' },
    {
      icon: '⭐',
      text:
        catalog.superLike && catalog.superLike.proWeekly > 0
          ? `${catalog.superLike.proWeekly} Super Likes every week — get noticed first`
          : 'More Super Likes every week — get noticed first'
    }
  ];
  if (catalog.boost && catalog.boost.proWeekly > 0) {
    perks.push({
      icon: '🚀',
      text: `Free weekly Boost — ${catalog.boost.durationMinutes} min at the front of the deck`
    });
  }
  perks.push(
    { icon: '🌐', text: 'Explore unlimited professions, not just 1 a week' },
    { icon: '💬', text: 'Chat with your cross-profession matches' },
    { icon: '↩', text: 'Unlimited rewinds — undo any swipe' }
  );
  return perks;
}

// Price of a plan expressed per week, for like-for-like comparison.
const perWeekOf = (p: ProPlan) => (p.priceInr * 7) / p.periodDays;

export function PaywallScreen({ navigation, route }: Props) {
  const focus = route.params?.focus ?? 'pro';
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { token, refreshUser } = useAuth();
  const [catalog, setCatalog] = useState<BillingCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('');

  const load = useCallback(async () => {
    try {
      const res = await getBillingCatalog(token);
      setCatalog(res);
      // Default-select the "popular" plan (monthly), else the first.
      const def = res.proPlans.find((p) => p.popular) || res.proPlans[0];
      if (def) setSelectedPlan(def.id);
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function purchase(type: 'pro' | 'credits', opts?: { packId?: string; planId?: string }) {
    if (!catalog) return;
    const key = opts?.packId || opts?.planId || type;
    try {
      setBusy(key);
      if (catalog.devMode) {
        // Stub billing: grant immediately so the whole flow is testable.
        await devGrant({ type, packId: opts?.packId, planId: opts?.planId }, token);
      } else {
        // Live Razorpay checkout is wired here once the native SDK is added.
        Alert.alert('Payments coming soon', 'Real payments will be enabled shortly.');
        return;
      }
      await refreshUser();
      Alert.alert(
        type === 'pro' ? 'Welcome to Pro ⭐' : 'Credits added 🪙',
        type === 'pro' ? 'You now have full access.' : 'Your credits are ready to spend.',
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Purchase failed', (err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const activePlan = catalog?.proPlans.find((p) => p.id === selectedPlan) || null;

  // The most expensive per-week rate in the catalog (normally the shortest
  // plan) — the baseline every "Save X%" is measured against.
  const baselinePerWeek =
    catalog && catalog.proPlans.length > 0 ? Math.max(...catalog.proPlans.map(perWeekOf)) : 0;

  return (
    <DarkBackground orbColor="rgba(251,191,36,0.22)">
      <ThemedStatusBar />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.close}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.crown}>⭐</Text>
          <Text style={styles.heroTitle}>Pro Match Pro</Text>
          <Text style={styles.heroSub}>
            See who already likes you, stand out with Super Likes, and date across every profession.
          </Text>
        </View>

        {loading || !catalog ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <>
            {/* PRO CARD */}
            <LinearGradient
              colors={gradients.gold}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.proCard, focus === 'pro' ? styles.focused : null]}
            >
              <Text style={styles.proName}>EVERYTHING IN PRO</Text>

              <View style={styles.perks}>
                {buildProPerks(catalog).map((p) => (
                  <View key={p.text} style={styles.perkRow}>
                    <Text style={styles.perkIcon}>{p.icon}</Text>
                    <Text style={styles.perkText}>{p.text}</Text>
                  </View>
                ))}
              </View>

              {/* Plan selector. Savings are derived from the catalog: each plan's
                  per-week rate vs the most expensive per-week plan (the shortest). */}
              <View style={styles.planRow}>
                {catalog.proPlans.map((plan) => {
                  const active = plan.id === selectedPlan;
                  const perWeek = perWeekOf(plan);
                  const savings =
                    baselinePerWeek > 0 ? Math.round((1 - perWeek / baselinePerWeek) * 100) : 0;
                  return (
                    <Pressable
                      key={plan.id}
                      onPress={() => setSelectedPlan(plan.id)}
                      style={[styles.planCard, active ? styles.planCardActive : null]}
                    >
                      {plan.popular ? (
                        <View style={styles.popularTag}>
                          <Text style={styles.popularText}>MOST POPULAR</Text>
                        </View>
                      ) : null}
                      {active ? (
                        <View style={styles.planCheck}>
                          <Text style={styles.planCheckText}>✓</Text>
                        </View>
                      ) : null}
                      <Text style={styles.planLabel}>{plan.label}</Text>
                      <Text style={styles.planPrice}>₹{plan.priceInr}</Text>
                      <Text style={styles.planPer}>≈ ₹{Math.round(perWeek)}/week</Text>
                      {savings >= 5 ? (
                        <View style={styles.savePill}>
                          <Text style={styles.saveText}>SAVE {savings}%</Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>

              <GradientButton
                title={
                  busy === selectedPlan
                    ? 'Activating…'
                    : activePlan
                    ? `Go Pro · ₹${activePlan.priceInr} ${activePlan.label.toLowerCase()}`
                    : 'Go Pro'
                }
                loading={busy === selectedPlan}
                onPress={() => activePlan && purchase('pro', { planId: activePlan.id })}
                colors={['#1F2937', '#374151']}
                style={{ marginTop: spacing.md }}
              />
              {/* Pro is a fixed period (grantPro stacks days) — nothing recurring. */}
              <Text style={styles.ctaNote}>One-time payment · no auto-renewal</Text>
            </LinearGradient>

            {/* CREDITS */}
            <View style={[styles.creditsHeader, focus === 'credits' ? styles.focusedText : null]}>
              <Text style={styles.sectionTitle}>Or pay as you go 🪙</Text>
              <Text style={styles.sectionSub}>
                No subscription — credits work anytime. Reveal a like for 10
                {catalog.superLike ? `, a Super Like for ${catalog.superLike.costCredits}` : ''}
                {catalog.boost ? `, a Boost for ${catalog.boost.costCredits}` : ''} credits. 1 credit
                = ₹{catalog.creditValueInr}.
              </Text>
            </View>

            <View style={styles.packs}>
              {catalog.creditPacks.map((pack: CreditPack) => {
                const bonus = pack.credits - pack.priceInr / Math.max(catalog.creditValueInr, 1);
                return (
                  <Pressable
                    key={pack.id}
                    style={styles.packCard}
                    onPress={() => purchase('credits', { packId: pack.id })}
                    disabled={busy !== null}
                  >
                    <View style={styles.packLeft}>
                      <Text style={styles.packCredits}>{pack.credits} 🪙</Text>
                      {bonus >= 1 ? (
                        <Text style={styles.packBonus}>+{Math.round(bonus)} bonus</Text>
                      ) : null}
                    </View>
                    <View style={styles.packPriceWrap}>
                      {busy === pack.id ? (
                        <ActivityIndicator color={colors.primary} />
                      ) : (
                        <Text style={styles.packPrice}>₹{pack.priceInr}</Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {catalog.devMode ? (
              <Text style={styles.devNote}>Dev mode — purchases are simulated (no real charge).</Text>
            ) : null}

            <Text style={styles.legal}>
              Same-profession matching is always free and unlimited. Pro & credits unlock cross-profession
              discovery and reveals.
            </Text>
          </>
        )}
      </ScrollView>
    </DarkBackground>
  );
}

const makeStyles = (c: ThemeColors, mode: ThemeMode) =>
  StyleSheet.create({
    scroll: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl },
    close: {
      alignSelf: 'flex-end',
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border
    },
    closeText: { fontSize: 18, color: c.text, fontWeight: '700' },
    hero: { alignItems: 'center', marginBottom: spacing.xl },
    crown: { fontSize: 52, marginBottom: spacing.sm },
    heroTitle: {
      fontFamily: fonts.displayBold,
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '700',
      color: c.text,
      letterSpacing: -0.5
    },
    heroSub: {
      ...typography.tagline,
      color: c.textMuted,
      marginTop: 4,
      textAlign: 'center',
      paddingHorizontal: spacing.md
    },
    center: { paddingVertical: spacing.xxl, alignItems: 'center' },
    // Gold card keeps its own on-gradient palette (dark-amber text, gold glow).
    proCard: {
      borderRadius: 26,
      padding: spacing.lg,
      marginBottom: spacing.xl,
      shadowColor: '#F59E0B',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.32,
      shadowRadius: 22,
      elevation: 8
    },
    // A white focus ring is invisible against the cream bg — use ink in light.
    focused: { borderWidth: 2, borderColor: mode === 'dark' ? '#FFFFFF' : c.text },
    focusedText: {},
    // Small-caps eyebrow — the hero directly above already carries the product
    // name, so the card frames the perk list instead of repeating it.
    proName: { fontSize: 13, fontWeight: '900', color: '#5C4500', letterSpacing: 1.6 },
    planRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
    planCard: {
      flex: 1,
      borderRadius: 16,
      padding: spacing.md,
      backgroundColor: 'rgba(255,255,255,0.55)',
      borderWidth: 2,
      borderColor: 'transparent',
      alignItems: 'center'
    },
    planCardActive: {
      backgroundColor: '#FFFFFF',
      borderColor: '#1F2937',
      shadowColor: '#2A1C00',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 3
    },
    // Selected-plan checkmark, corner of the card.
    planCheck: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: '#1F2937',
      alignItems: 'center',
      justifyContent: 'center'
    },
    planCheckText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
    popularTag: {
      position: 'absolute',
      top: -10,
      backgroundColor: '#1F2937',
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 2
    },
    popularText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
    planLabel: { fontSize: 13, fontWeight: '800', color: '#5C4500', marginTop: 2 },
    planPrice: { fontSize: 24, fontWeight: '900', color: '#2A1C00', marginTop: 4 },
    planPer: { fontSize: 11, fontWeight: '700', color: '#7A6020', marginTop: 2 },
    // Savings vs the priciest per-week plan (computed from the catalog).
    savePill: {
      marginTop: 6,
      backgroundColor: 'rgba(4,120,87,0.14)',
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 2
    },
    saveText: { color: '#047857', fontSize: 10, fontWeight: '900', letterSpacing: 0.4 },
    ctaNote: {
      marginTop: spacing.sm,
      textAlign: 'center',
      color: '#5C4500',
      fontSize: 11,
      fontWeight: '700'
    },
    perks: { marginTop: spacing.md, gap: spacing.sm },
    // Top-aligned with a fixed icon column so two-line perks stay tidy.
    perkRow: { flexDirection: 'row', alignItems: 'flex-start' },
    perkIcon: { fontSize: 15, lineHeight: 20, width: 26 },
    perkText: { flex: 1, color: '#2A1C00', fontWeight: '700', fontSize: 14, lineHeight: 20 },
    creditsHeader: { marginBottom: spacing.md },
    sectionTitle: { fontFamily: fonts.display, fontSize: 20, lineHeight: 26, fontWeight: '600', color: c.text, letterSpacing: -0.3 },
    sectionSub: { ...typography.caption, color: c.textMuted, marginTop: 4, lineHeight: 19 },
    packs: { gap: spacing.sm },
    packCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 18,
      padding: spacing.md
    },
    packLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    packCredits: { fontSize: 18, fontWeight: '900', color: c.text },
    packBonus: {
      color: c.gold,
      fontWeight: '800',
      fontSize: 12,
      backgroundColor: 'rgba(251,191,36,0.15)',
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 2
    },
    packPriceWrap: { minWidth: 56, alignItems: 'flex-end' },
    packPrice: { fontSize: 18, fontWeight: '900', color: c.primary },
    devNote: {
      ...typography.caption,
      color: c.textMuted,
      textAlign: 'center',
      marginTop: spacing.lg,
      fontStyle: 'italic'
    },
    legal: {
      ...typography.caption,
      color: c.textMuted,
      textAlign: 'center',
      marginTop: spacing.md,
      lineHeight: 18,
      fontSize: 12
    }
  });
