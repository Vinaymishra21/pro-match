import React, { useMemo, useState } from 'react';
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
import { ScreenContainer } from '../../components/ScreenContainer';
import { COUNTRY_CODES, type CountryCodeOption } from '../../constants/countryCodes';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { AuthStackParamList } from '../../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'PhoneEntry'>;

export function PhoneEntryScreen({ navigation }: Props) {
  const [countryCode, setCountryCode] = useState<CountryCodeOption>({
    code: '+91',
    country: 'India'
  });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [query, setQuery] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const sanitized = useMemo(() => phoneNumber.replace(/\D/g, ''), [phoneNumber]);
  const canContinue = sanitized.length >= 8;
  const filteredCountries = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return COUNTRY_CODES;
    }

    return COUNTRY_CODES.filter(
      (item) => item.country.toLowerCase().includes(term) || item.code.toLowerCase().includes(term)
    );
  }, [query]);

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 24}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.top}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
              <Text style={styles.backLabel}>←</Text>
            </Pressable>

            <View style={styles.heroCard}>
              <View style={styles.eyebrowRow}>
                <View style={styles.eyebrowDot} />
                <Text style={styles.eyebrow}>Create an account</Text>
              </View>

              <Text style={styles.title}>What&apos;s your mobile number?</Text>
              <Text style={styles.description}>
                We only use phone numbers to make sure everyone on Bumble is real.
              </Text>

              <View style={styles.formCard}>
                <Text style={styles.fieldLabel}>Mobile number</Text>

                <View style={styles.inputRow}>
                  <Pressable style={styles.countryButton} onPress={() => setIsPickerOpen(true)}>
                    <Text style={styles.countryCode}>{countryCode.code}</Text>
                    <Text style={styles.countryName} numberOfLines={1}>
                      {countryCode.country}
                    </Text>
                    <Text style={styles.countryChevron}>▾</Text>
                  </Pressable>

                  <View style={styles.phoneFieldWrap}>
                    <TextInput
                      value={phoneNumber}
                      onChangeText={(next) => setPhoneNumber(next.replace(/\D/g, ''))}
                      keyboardType="phone-pad"
                      placeholder="Phone number"
                      placeholderTextColor={colors.textMuted}
                      style={styles.phoneInput}
                      returnKeyType="done"
                    />
                  </View>
                </View>

                <View style={styles.helperStrip}>
                  <Text style={styles.helperText}>Use a number you can receive a code on right now.</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.noteRow}>
              <View style={styles.noteBadge}>
                <Text style={styles.noteBadgeText}>→</Text>
              </View>
              <Text style={styles.noteText}>
                We never share this with anyone and it won&apos;t be on your profile.
              </Text>
            </View>

            <Pressable
              disabled={!canContinue}
              onPress={() =>
                navigation.navigate('OtpVerification', {
                  countryCode: countryCode.code,
                  phoneNumber: sanitized
                })
              }
              style={({ pressed }) => [
                styles.nextButton,
                !canContinue ? styles.nextButtonDisabled : null,
                pressed && canContinue ? styles.nextButtonPressed : null
              ]}
            >
              <Text style={styles.nextArrow}>→</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={isPickerOpen} animationType="slide" transparent onRequestClose={() => setIsPickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select country code</Text>
              <Pressable onPress={() => setIsPickerOpen(false)} hitSlop={12}>
                <Text style={styles.modalClose}>Close</Text>
              </Pressable>
            </View>

            <View style={styles.searchWrap}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search country or code"
                placeholderTextColor={colors.textMuted}
                style={styles.searchInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => `${item.country}-${item.code}`}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const active = item.code === countryCode.code && item.country === countryCode.country;
                return (
                  <Pressable
                    style={[styles.optionRow, active ? styles.optionRowActive : null]}
                    onPress={() => {
                      setCountryCode(item);
                      setIsPickerOpen(false);
                      setQuery('');
                    }}
                  >
                    <View>
                      <Text style={styles.optionCountry}>{item.country}</Text>
                      <Text style={styles.optionCode}>{item.code}</Text>
                    </View>
                    {active ? <Text style={styles.optionCheck}>✓</Text> : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: spacing.lg
  },
  top: {
    paddingTop: spacing.sm
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8E2EE',
    marginBottom: spacing.xl,
    shadowColor: '#11233B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2
  },
  backLabel: {
    fontSize: 22,
    color: colors.text
  },
  heroCard: {
    borderRadius: 32,
    padding: 24,
    backgroundColor: '#F9FCFF',
    borderWidth: 1,
    borderColor: '#DCE8F3'
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  eyebrowDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginRight: spacing.sm
  },
  eyebrow: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    color: '#10263E',
    letterSpacing: -1.2,
    marginBottom: spacing.sm
  },
  description: {
    fontSize: 16,
    lineHeight: 25,
    color: '#51667F',
    marginBottom: spacing.xl
  },
  formCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2EBF4'
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B8097',
    marginBottom: spacing.sm,
    letterSpacing: 0.3
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'stretch'
  },
  countryButton: {
    width: 122,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F4F8FC',
    borderWidth: 1,
    borderColor: '#D8E4F0',
    marginRight: spacing.sm
  },
  countryCode: {
    fontSize: 18,
    fontWeight: '800',
    color: '#112A43'
  },
  countryName: {
    fontSize: 12,
    color: '#64778D',
    marginTop: 3
  },
  countryChevron: {
    position: 'absolute',
    top: 14,
    right: 12,
    fontSize: 14,
    color: '#64778D'
  },
  phoneFieldWrap: {
    flex: 1
  },
  phoneInput: {
    height: 72,
    borderRadius: 18,
    backgroundColor: '#F4F8FC',
    borderWidth: 1,
    borderColor: '#D8E4F0',
    paddingHorizontal: 18,
    fontSize: 24,
    fontWeight: '700',
    color: '#112A43'
  },
  helperStrip: {
    marginTop: spacing.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#EFF7F4'
  },
  helperText: {
    color: '#43665B',
    fontSize: 13,
    lineHeight: 19
  },
  footer: {
    paddingTop: spacing.xl,
    gap: spacing.lg
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  noteBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F3EF',
    marginRight: spacing.sm
  },
  noteBadgeText: {
    color: colors.secondary,
    fontSize: 15,
    fontWeight: '800'
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: '#5E738A'
  },
  nextButton: {
    alignSelf: 'flex-end',
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 6
  },
  nextButtonDisabled: {
    opacity: 0.38
  },
  nextButtonPressed: {
    transform: [{ scale: 0.98 }]
  },
  nextArrow: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 16, 28, 0.35)',
    justifyContent: 'flex-end'
  },
  modalSheet: {
    height: '78%',
    backgroundColor: '#FCFEFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#112A43'
  },
  modalClose: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary
  },
  searchWrap: {
    marginBottom: spacing.md
  },
  searchInput: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#F3F7FB',
    borderWidth: 1,
    borderColor: '#D8E4F0',
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7'
  },
  optionRowActive: {
    backgroundColor: '#F7FBFF'
  },
  optionCountry: {
    fontSize: 16,
    fontWeight: '700',
    color: '#112A43'
  },
  optionCode: {
    marginTop: 2,
    fontSize: 13,
    color: '#6B8097'
  },
  optionCheck: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary
  }
});
