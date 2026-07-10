import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DarkBackground } from '../../components/DarkBackground';
import { WovnnLoader } from '../../components/WovnnLoader';
import { useAuth } from '../../hooks/useAuth';
import { devGrant, getBillingCatalog } from '../../services/apiService';
import { ThemedStatusBar, useTheme, useThemedStyles, type ThemeMode } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme/themes';
import { spacing } from '../../theme/spacing';
import { fonts } from '../../theme/typography';
import type { BillingCatalog, CreditPack, ProPlan, RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Paywall'>;

type Perk = { icon: string; title: string; sub: string };

// Every perk maps to a real Pro entitlement (backend/src/config/monetization.js).
// Super Like / Boost counts come from the live catalog so the copy can never
// drift from what the server actually grants.
function buildProPerks(catalog: BillingCatalog): Perk[] {
  const perks: Perk[] = [
    { icon: '👀', title: 'See everyone who likes you', sub: 'instantly unblurred' },
    {
      icon: '⭐',
      title:
        catalog.superLike && catalog.superLike.proWeekly > 0
          ? `${catalog.superLike.proWeekly} Super Likes every week`
          : 'More Super Likes every week',
      sub: 'get noticed first'
    }
  ];
  if (catalog.boost && catalog.boost.proWeekly > 0) {
    perks.push({
      icon: '🚀',
      title: 'A free weekly Boost',
      sub: `${catalog.boost.durationMinutes} min at the front of the deck`
    });
  }
  perks.push(
    { icon: '🌐', title: 'Match across every profession', sub: 'not just 1 a week — and chat with them' },
    { icon: '↩', title: 'Unlimited rewinds', sub: 'never miss a match again' }
  );
  return perks;
}

// Price of a plan expressed per week, for like-for-like comparison.
const perWeekOf = (p: ProPlan) => (p.priceInr * 7) / p.periodDays;

export function PaywallScreen({ navigation, route }: Props) {
  const focus = route.params?.focus ?? 'pro';
  const { colors, mode } = useTheme();
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
        // Real payments will run through Apple IAP / Google Play Billing.
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
        contentContainerStyle={[
          styles.scroll,
          // Edge-to-edge Android can report insets.top === 0 — floor it so content
          // never sits under the status bar.
          { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 24 : 0) + spacing.md }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.close}>
          <Text style={styles.closeText}>✕  Close</Text>
        </Pressable>

        {/* Hero — gold crest + title */}
        <View style={styles.hero}>
          <View style={styles.crestWrap}>
            <View style={styles.crestGlow} pointerEvents="none" />
            <LinearGradient
              colors={colors.goldGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.crest}
            >
              <Text style={styles.crestIcon}>👑</Text>
            </LinearGradient>
          </View>
          <Text style={styles.heroTitle}>Wovnn Pro</Text>
          <Text style={styles.heroSub}>
            See who likes you, stand out with Super Likes, and date across every profession.
          </Text>
        </View>

        {loading || !catalog ? (
          <View style={styles.center}>
            <WovnnLoader message="Loading plans" />
          </View>
        ) : (
          <>
            {/* PLAN SELECTOR — savings derived from the catalog (per-week vs the
                priciest per-week plan). */}
            <View style={styles.planRow}>
              {catalog.proPlans.map((plan) => {
                const active = plan.id === selectedPlan;
                const perWeek = perWeekOf(plan);
                const savings = baselinePerWeek > 0 ? Math.round((1 - perWeek / baselinePerWeek) * 100) : 0;
                return (
                  <Pressable
                    key={plan.id}
                    onPress={() => setSelectedPlan(plan.id)}
                    style={[styles.planCard, active ? styles.planCardActive : null]}
                  >
                    {active ? (
                      <LinearGradient
                        colors={colors.brandGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.planCheck}
                      >
                        <Text style={styles.planCheckText}>✓</Text>
                      </LinearGradient>
                    ) : null}

                    <View style={styles.tagRow}>
                      {plan.popular ? (
                        <LinearGradient
                          colors={colors.brandGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.popularTag}
                        >
                          <Text style={styles.popularText}>MOST POPULAR</Text>
                        </LinearGradient>
                      ) : null}
                      {savings >= 5 ? (
                        <View style={styles.savePill}>
                          <Text style={styles.saveText}>SAVE {savings}%</Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={styles.planLabel}>{plan.label.toUpperCase()}</Text>
                    <Text style={[styles.planPrice, active ? styles.planPriceActive : null]}>
                      ₹{plan.priceInr}
                    </Text>
                    <Text style={styles.planPer}>≈ ₹{Math.round(perWeek)}/week</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* PERKS */}
            <View style={styles.perkCard}>
              <Text style={styles.perkEyebrow}>EVERYTHING IN PRO</Text>
              <View style={styles.perks}>
                {buildProPerks(catalog).map((p) => (
                  <View key={p.title} style={styles.perkRow}>
                    <View style={styles.perkIconChip}>
                      <Text style={styles.perkIcon}>{p.icon}</Text>
                    </View>
                    <View style={styles.perkTextWrap}>
                      <Text style={styles.perkTitle}>{p.title}</Text>
                      <Text style={styles.perkSub}>{p.sub}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* CTA */}
            <Pressable
              onPress={() => activePlan && purchase('pro', { planId: activePlan.id })}
              disabled={busy !== null || !activePlan}
              style={({ pressed }) => (pressed ? { opacity: 0.9 } : null)}
            >
              <LinearGradient
                colors={colors.brandGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cta}
              >
                {busy === selectedPlan ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.ctaText}>
                    👑  {activePlan ? `Go Pro · ₹${activePlan.priceInr} ${activePlan.label.toLowerCase()}` : 'Go Pro'}
                  </Text>
                )}
              </LinearGradient>
            </Pressable>
            {/* Pro is a fixed period (grantPro stacks days) — nothing recurring. */}
            <Text style={styles.ctaNote}>One-time payment · no auto-renewal</Text>

            <View style={styles.divider} />

            {/* CREDITS */}
            <View style={[styles.creditsHeader, focus === 'credits' ? styles.creditsFocused : null]}>
              <Text style={styles.sectionTitle}>Or pay as you go 🪙</Text>
              <Text style={styles.sectionSub}>
                No subscription — credits work anytime. Reveal a like for {catalog.revealCost ?? 20}
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
                      {bonus >= 1 ? <Text style={styles.packBonus}>+{Math.round(bonus)} bonus</Text> : null}
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
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
    close: { alignSelf: 'flex-start', paddingVertical: 6, paddingRight: 12 },
    closeText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: c.textMuted, fontWeight: '600' },

    // Hero
    hero: { alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.xl },
    crestWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
    crestGlow: {
      position: 'absolute',
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: 'rgba(251,191,36,0.22)'
    },
    crest: {
      width: 56,
      height: 56,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#FBBF24',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: 6
    },
    crestIcon: { fontSize: 26 },
    heroTitle: {
      fontFamily: fonts.sansExtraBold,
      fontSize: 26,
      fontWeight: '800',
      color: c.text,
      letterSpacing: -0.7,
      marginBottom: 8
    },
    heroSub: {
      fontFamily: fonts.sansMedium,
      fontSize: 13,
      lineHeight: 19,
      color: c.textMuted,
      textAlign: 'center',
      maxWidth: 290
    },
    center: { paddingVertical: spacing.xxl, alignItems: 'center' },

    // Plans
    planRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.lg },
    planCard: {
      flex: 1,
      backgroundColor: c.card,
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 16,
      padding: 14,
      paddingTop: 16
    },
    planCardActive: {
      borderWidth: 2,
      borderColor: c.primary,
      backgroundColor: mode === 'dark' ? '#25131F' : '#FFF1F2',
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 18,
      elevation: 5
    },
    planCheck: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center'
    },
    planCheckText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900', lineHeight: 20, includeFontPadding: false },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8, minHeight: 16 },
    popularTag: { borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
    popularText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.6, fontFamily: fonts.sansExtraBold },
    savePill: { backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
    saveText: { color: '#22C55E', fontSize: 9, fontWeight: '800', letterSpacing: 0.4, fontFamily: fonts.sansExtraBold },
    planLabel: {
      fontFamily: fonts.sansBold,
      fontSize: 12,
      fontWeight: '700',
      color: c.textMuted,
      letterSpacing: 0.6,
      marginBottom: 6
    },
    planPrice: { fontFamily: fonts.sansExtraBold, fontSize: 28, fontWeight: '800', color: c.text, letterSpacing: -0.8 },
    planPriceActive: { color: c.primary },
    planPer: { fontFamily: fonts.sansMedium, fontSize: 11, color: c.textMuted, marginTop: 4 },

    // Perks
    perkCard: {
      backgroundColor: mode === 'dark' ? '#160F1F' : c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 20,
      padding: 18,
      marginBottom: spacing.lg
    },
    perkEyebrow: {
      fontFamily: fonts.sansExtraBold,
      fontSize: 11,
      fontWeight: '800',
      color: c.textMuted,
      letterSpacing: 1.3,
      marginBottom: 14
    },
    perks: { gap: 14 },
    perkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    perkIconChip: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: c.brandSoft,
      alignItems: 'center',
      justifyContent: 'center'
    },
    perkIcon: { fontSize: 16 },
    perkTextWrap: { flex: 1 },
    perkTitle: { fontFamily: fonts.sansBold, fontSize: 13, fontWeight: '700', color: c.text, lineHeight: 17 },
    perkSub: { fontFamily: fonts.sansMedium, fontSize: 11, color: c.textMuted, marginTop: 2 },

    // CTA
    cta: {
      borderRadius: 999,
      paddingVertical: 15,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 24,
      elevation: 8
    },
    ctaText: { fontFamily: fonts.sansExtraBold, color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },
    ctaNote: { fontFamily: fonts.sansMedium, fontSize: 11, color: c.textMuted, textAlign: 'center', marginTop: 10 },

    divider: { height: 1, backgroundColor: c.border, marginVertical: spacing.xl },

    // Credits
    creditsHeader: { marginBottom: spacing.md },
    creditsFocused: {
      borderLeftWidth: 3,
      borderLeftColor: c.gold,
      paddingLeft: spacing.sm
    },
    sectionTitle: { fontFamily: fonts.sansExtraBold, fontSize: 18, fontWeight: '800', color: c.text, letterSpacing: -0.3 },
    sectionSub: { fontFamily: fonts.sansMedium, fontSize: 12.5, lineHeight: 18, color: c.textMuted, marginTop: 6 },
    packs: { gap: spacing.sm },
    packCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      paddingHorizontal: spacing.md,
      paddingVertical: 14
    },
    packLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    packCredits: { fontFamily: fonts.sansExtraBold, fontSize: 16, fontWeight: '800', color: c.text },
    packBonus: {
      fontFamily: fonts.sansBold,
      fontSize: 11,
      fontWeight: '700',
      color: c.gold,
      backgroundColor: 'rgba(251,191,36,0.14)',
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2
    },
    packPriceWrap: { minWidth: 54, alignItems: 'flex-end' },
    packPrice: { fontFamily: fonts.sansExtraBold, fontSize: 16, fontWeight: '800', color: c.text },

    devNote: { fontFamily: fonts.sansMedium, fontSize: 11, color: c.gold, textAlign: 'center', marginTop: spacing.md },
    legal: {
      fontFamily: fonts.sansMedium,
      fontSize: 11,
      lineHeight: 16,
      color: c.textFaint,
      textAlign: 'center',
      marginTop: spacing.lg
    }
  });
