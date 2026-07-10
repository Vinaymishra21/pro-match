import { useMemo, useState } from 'react';
import {
  FlatList,
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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthShell, BackButton, Eyebrow, FieldLabel, NextFab, useAuthText } from '../../components/auth/AuthKit';
import { COUNTRY_CODES, type CountryCodeOption } from '../../constants/countryCodes';
import { useAuth } from '../../hooks/useAuth';
import { ThemedStatusBar, useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme/themes';
import { spacing } from '../../theme/spacing';
import type { AuthStackParamList } from '../../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'PhoneEntry'>;

export function PhoneEntryScreen({ navigation }: Props) {
  const { requestOtp } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const authText = useAuthText();
  const [countryCode, setCountryCode] = useState<CountryCodeOption>({ code: '+91', country: 'India' });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [query, setQuery] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  const sanitized = useMemo(() => phoneNumber.replace(/\D/g, ''), [phoneNumber]);
  const canContinue = sanitized.length >= 8 && !isSending;

  async function handleContinue() {
    if (!canContinue) return;
    const fullPhone = `${countryCode.code}${sanitized}`;
    try {
      setIsSending(true);
      setError('');
      const res = await requestOtp(fullPhone);
      navigation.navigate('OtpVerification', { countryCode: countryCode.code, phoneNumber: sanitized });
      if (res.devCode) console.log(`[DEV] OTP for ${fullPhone}: ${res.devCode}`);
    } catch (sendError) {
      setError((sendError as Error).message);
    } finally {
      setIsSending(false);
    }
  }

  const filteredCountries = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return COUNTRY_CODES;
    return COUNTRY_CODES.filter(
      (item) => item.country.toLowerCase().includes(term) || item.code.toLowerCase().includes(term)
    );
  }, [query]);

  return (
    <AuthShell>
      <ThemedStatusBar />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 24}
        style={styles.kb}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View>
            <BackButton onPress={() => navigation.goBack()} />

            <View style={styles.head}>
              <Eyebrow>Verify it’s you</Eyebrow>
              <Text style={authText.title}>What’s your number?</Text>
              <Text style={authText.desc}>We use your number to keep Wovnn real — it stays private and never appears on your profile.</Text>
            </View>

            <FieldLabel>Mobile number</FieldLabel>
            <View style={styles.inputRow}>
              <Pressable style={styles.countryBtn} onPress={() => setIsPickerOpen(true)}>
                <Text style={styles.countryCode}>{countryCode.code}</Text>
                <Text style={styles.countryName} numberOfLines={1}>{countryCode.country}</Text>
                <Text style={styles.countryChevron}>▾</Text>
              </Pressable>
              <View style={styles.phoneWrap}>
                <TextInput
                  value={phoneNumber}
                  onChangeText={(next) => setPhoneNumber(next.replace(/\D/g, ''))}
                  keyboardType="phone-pad"
                  placeholder="00000 00000"
                  placeholderTextColor={colors.textFaint}
                  style={styles.phoneInput}
                  returnKeyType="done"
                />
              </View>
            </View>

            {error ? <Text style={authText.error}>{error}</Text> : null}
          </View>

          <View style={styles.footer}>
            <View style={styles.noteRow}>
              <Text style={styles.lock}>🔒</Text>
              <Text style={styles.noteText}>We never share this with anyone, and it won’t be on your profile.</Text>
            </View>
            <NextFab onPress={handleContinue} disabled={!canContinue} loading={isSending} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country picker */}
      <Modal visible={isPickerOpen} animationType="slide" transparent onRequestClose={() => setIsPickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select country</Text>
              <Pressable onPress={() => setIsPickerOpen(false)} hitSlop={12}>
                <Text style={styles.modalClose}>Close</Text>
              </Pressable>
            </View>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search country or code"
              placeholderTextColor={colors.textFaint}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => `${item.country}-${item.code}`}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const active = item.code === countryCode.code && item.country === countryCode.country;
                return (
                  <Pressable
                    style={[styles.optRow, active ? styles.optRowActive : null]}
                    onPress={() => {
                      setCountryCode(item);
                      setIsPickerOpen(false);
                      setQuery('');
                    }}
                  >
                    <View>
                      <Text style={styles.optCountry}>{item.country}</Text>
                      <Text style={styles.optCode}>{item.code}</Text>
                    </View>
                    {active ? <Text style={styles.optCheck}>✓</Text> : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </AuthShell>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    kb: { flex: 1 },
    scroll: { flexGrow: 1, justifyContent: 'space-between', paddingBottom: spacing.lg },
    head: { marginTop: spacing.xl, marginBottom: spacing.xl },
    inputRow: { flexDirection: 'row', gap: spacing.sm },
    countryBtn: {
      width: 120,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      justifyContent: 'center'
    },
    countryCode: { fontSize: 18, fontWeight: '800', color: c.text },
    countryName: { fontSize: 12, color: c.textMuted, marginTop: 3 },
    countryChevron: { position: 'absolute', top: 14, right: 12, fontSize: 14, color: c.textMuted, includeFontPadding: false },
    phoneWrap: { flex: 1 },
    phoneInput: {
      height: 70,
      borderRadius: 16,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 18,
      fontSize: 22,
      fontWeight: '700',
      color: c.text
    },
    footer: { paddingTop: spacing.xl, gap: spacing.lg },
    noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    lock: { fontSize: 15 },
    noteText: { flex: 1, fontSize: 13.5, lineHeight: 21, color: c.textMuted },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    modalSheet: {
      height: '78%',
      backgroundColor: c.card,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm
    },
    modalHandle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: c.border, marginBottom: spacing.md },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
    modalTitle: { fontSize: 20, fontWeight: '800', color: c.text },
    modalClose: { fontSize: 14, fontWeight: '700', color: c.brandText },
    searchInput: {
      height: 52,
      borderRadius: 14,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: spacing.md,
      fontSize: 16,
      color: c.text,
      marginBottom: spacing.md
    },
    optRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 6,
      borderBottomWidth: 1,
      borderBottomColor: c.border
    },
    optRowActive: { backgroundColor: c.surface },
    optCountry: { fontSize: 16, fontWeight: '700', color: c.text },
    optCode: { marginTop: 2, fontSize: 13, color: c.textMuted },
    optCheck: { fontSize: 18, fontWeight: '800', color: c.primary }
  });
