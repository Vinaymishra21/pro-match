import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { FieldLabel, useAuthText } from '../../components/auth/AuthKit';
import { OnboardingScaffold, OnbInput } from './OnboardingScaffold';
import { TOTAL_STEPS, useOnboarding, type OnboardingDraft } from './OnboardingContext';
import { useTheme, useThemedStyles, type ThemeMode } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme/themes';
import { spacing } from '../../theme/spacing';
import { fonts } from '../../theme/typography';

// Turns a reverse-geocode result into a friendly "City, Region" label.
function placeLabel(place?: Location.LocationGeocodedAddress | null): string {
  if (!place) return '';
  const city = place.city || place.district || place.subregion || '';
  const region = place.region && place.region !== city ? place.region : place.country;
  if (city) return region ? `${city}, ${region}` : city;
  return place.region || place.country || '';
}

// Required step: we need EITHER a GPS fix (best — powers "X km away" and a
// nearby-first deck) OR at least a typed city before the user can continue.
export function LocationStepScreen({ navigation }: any) {
  const { draft, persist } = useOnboarding();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const authText = useAuthText();
  const [city, setCity] = useState(draft.location);
  const [coords, setCoords] = useState<[number, number] | undefined>(draft.coordinates);
  const [detecting, setDetecting] = useState(false);
  const [manual, setManual] = useState(false);
  const [hint, setHint] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const detected = !!coords && !!city.trim() && !manual;
  const valid = !!coords || city.trim().length >= 2;

  // Primary path: permission → GPS fix → reverse-geocode to a city label.
  // Every failure degrades gracefully into the manual city input.
  async function detect() {
    if (detecting) return;
    try {
      setDetecting(true);
      setHint('');
      setErr('');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setManual(true);
        setHint(
          "No location access — that's okay. Type your city to continue. Precise distances need location access, which you can grant later in Settings."
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = pos.coords;
      setCoords([longitude, latitude]); // backend expects [lng, lat]
      let label = '';
      try {
        const places = await Location.reverseGeocodeAsync({ latitude, longitude });
        label = placeLabel(places[0]);
      } catch {
        // GPS fix is safe — only the city name lookup failed.
      }
      if (label) {
        setCity(label);
        setManual(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setManual(true);
        setHint("Got your location — we just couldn't name your city. Type it below.");
      }
    } catch {
      setManual(true);
      setHint("We couldn't get a GPS fix right now. Type your city to continue.");
    } finally {
      setDetecting(false);
    }
  }

  // "Not quite right?" — drop the GPS fix and let them type the city instead.
  function editManually() {
    setCoords(undefined);
    setManual(true);
    setHint('');
  }

  async function next() {
    if (!valid) return;
    try {
      setBusy(true);
      setErr('');
      const patch: Partial<OnboardingDraft> = {};
      if (city.trim()) patch.location = city.trim();
      if (coords) patch.coordinates = coords;
      await persist(patch);
      navigation.navigate('Gender');
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <OnboardingScaffold
      step={5}
      total={TOTAL_STEPS}
      title="Where are you based?"
      subtitle="Your matches start in your city — see how far away everyone is and meet people actually near you."
      onNext={next}
      nextDisabled={!valid}
      loading={busy}
      onBack={() => navigation.goBack()}
    >
      {detected ? (
        // Confirmation: we have a GPS fix and a friendly city label.
        <View style={styles.detectedCard}>
          <View style={styles.detectedIconWrap}>
            <Text style={styles.detectedIcon}>📍</Text>
          </View>
          <View style={styles.detectedTextWrap}>
            <Text style={styles.detectedCity} numberOfLines={1}>{city}</Text>
            <Text style={styles.detectedSub}>Location set — you'll see people nearby first</Text>
          </View>
          <Text style={styles.detectedTick}>✓</Text>
        </View>
      ) : (
        <Pressable
          onPress={detect}
          disabled={detecting}
          style={({ pressed }) => [styles.detectCard, pressed && !detecting ? styles.detectCardPressed : null]}
        >
          <View style={styles.detectIconWrap}>
            <Text style={styles.detectIcon}>📍</Text>
          </View>
          <View style={styles.detectTextWrap}>
            <Text style={styles.detectTitle}>Use my location</Text>
            <Text style={styles.detectSub}>Fast, precise, and private — we never show your exact spot</Text>
          </View>
          {detecting ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.detectChevron}>›</Text>
          )}
        </Pressable>
      )}

      {detected ? (
        <Pressable onPress={editManually} hitSlop={8} style={styles.altLink}>
          <Text style={styles.altLinkText}>Not quite right? Type your city</Text>
        </Pressable>
      ) : !manual ? (
        <Pressable onPress={() => setManual(true)} hitSlop={8} style={styles.altLink}>
          <Text style={styles.altLinkText}>Prefer to type your city?</Text>
        </Pressable>
      ) : null}

      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      {manual ? (
        <View style={styles.manualWrap}>
          <FieldLabel>Your city</FieldLabel>
          <OnbInput
            value={city}
            onChangeText={setCity}
            placeholder="e.g. New Delhi"
            autoCapitalize="words"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={next}
          />
        </View>
      ) : null}

      {err ? <Text style={authText.error}>{err}</Text> : null}
    </OnboardingScaffold>
  );
}

// The "detected" card uses success-tinted washes: dark keeps the original
// rgba(52,211,153,…) literals (darkTheme.success #34D399); light mirrors the
// same opacities with lightTheme.success #047857 → rgb(4,120,87).
const makeStyles = (c: ThemeColors, mode: ThemeMode) =>
  StyleSheet.create({
    detectCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.brandBorder,
      borderRadius: 18,
      padding: spacing.md
    },
    detectCardPressed: { backgroundColor: c.surfaceStrong },
    detectIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.brandSoft,
      alignItems: 'center',
      justifyContent: 'center'
    },
    detectIcon: { fontSize: 20 },
    detectTextWrap: { flex: 1 },
    detectTitle: { fontFamily: fonts.sansBold, color: c.text, fontSize: 16, fontWeight: '700' },
    detectSub: {
      fontFamily: fonts.sansMedium,
      color: c.textMuted,
      fontSize: 12,
      lineHeight: 17,
      marginTop: 2
    },
    detectChevron: { color: c.brandText, fontSize: 26, fontWeight: '700', marginLeft: spacing.xs },
    detectedCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: mode === 'dark' ? 'rgba(52,211,153,0.1)' : 'rgba(4,120,87,0.1)',
      borderWidth: 1.5,
      borderColor: mode === 'dark' ? 'rgba(52,211,153,0.4)' : 'rgba(4,120,87,0.4)',
      borderRadius: 18,
      padding: spacing.md
    },
    detectedIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: mode === 'dark' ? 'rgba(52,211,153,0.15)' : 'rgba(4,120,87,0.15)',
      alignItems: 'center',
      justifyContent: 'center'
    },
    detectedIcon: { fontSize: 20 },
    detectedTextWrap: { flex: 1 },
    detectedCity: { fontFamily: fonts.sansBold, color: c.text, fontSize: 16, fontWeight: '700' },
    detectedSub: {
      fontFamily: fonts.sansMedium,
      color: c.textMuted,
      fontSize: 12,
      lineHeight: 17,
      marginTop: 2
    },
    detectedTick: { color: c.success, fontSize: 20, fontWeight: '900', marginLeft: spacing.xs },
    altLink: { alignSelf: 'center', marginTop: spacing.md },
    altLinkText: { fontFamily: fonts.sansBold, color: c.textMuted, fontSize: 13, fontWeight: '700' },
    hint: {
      fontFamily: fonts.sansMedium,
      color: c.textDim,
      fontSize: 13,
      lineHeight: 19,
      marginTop: spacing.md
    },
    manualWrap: { marginTop: spacing.lg }
  });
