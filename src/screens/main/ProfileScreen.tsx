// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, Text, UIManager, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { Dropdown } from '../../components/Dropdown';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AnimatedProfileSection } from '../../features/profile/components/AnimatedProfileSection';
import { ChipSelector } from '../../features/profile/components/ChipSelector';
import { ProfileSection } from '../../features/profile/components/ProfileSection';
import { ProfileHeaderCard } from '../../features/profile/components/ProfileHeaderCard';
import { ProfilePhotoGallery } from '../../features/profile/components/ProfilePhotoGallery';
import { ProfilePreview } from '../../features/profile/components/ProfilePreview';
import { ProfessionLoveMeter } from '../../features/profile/components/ProfessionLoveMeter';
import { PromptField } from '../../features/profile/components/PromptField';
import { VerificationCard } from '../../features/profile/components/VerificationCard';
import { CustomPrompts } from '../../features/profile/components/CustomPrompts';
import {
  drinkingOptions,
  genderOptions,
  heightOptions,
  interestSuggestions,
  languageOptions,
  lookingForOptions,
  petOptions,
  religionOptions,
  smokingOptions,
  workoutOptions
} from '../../features/profile/constants/profileOptions';
import { getProfileCompletion } from '../../features/profile/profileCompletion';
import { buildProfileForm, parseInterestInput } from '../../features/profile/profileForm';
import { useAuth } from '../../hooks/useAuth';
import { updateProfile } from '../../services/apiService';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

// Compact stepper-based age range picker. value = [] (no preference) or [min,max].
function AgeRangePicker({ value, onChange }) {
  const hasRange = Array.isArray(value) && value.length === 2;
  const min = hasRange ? value[0] : 22;
  const max = hasRange ? value[1] : 35;

  function adjust(which, delta) {
    let nextMin = min;
    let nextMax = max;
    if (which === 'min') nextMin = Math.max(18, Math.min(nextMax, min + delta));
    else nextMax = Math.min(80, Math.max(nextMin, max + delta));
    onChange([nextMin, nextMax]);
  }

  if (!hasRange) {
    return (
      <Pressable style={ageStyles.enable} onPress={() => onChange([22, 35])}>
        <Text style={ageStyles.enableText}>+ Set an age preference</Text>
      </Pressable>
    );
  }

  return (
    <View style={ageStyles.wrap}>
      <View style={ageStyles.col}>
        <Text style={ageStyles.colLabel}>Min</Text>
        <View style={ageStyles.stepper}>
          <Pressable style={ageStyles.btn} onPress={() => adjust('min', -1)}><Text style={ageStyles.btnText}>−</Text></Pressable>
          <Text style={ageStyles.value}>{min}</Text>
          <Pressable style={ageStyles.btn} onPress={() => adjust('min', 1)}><Text style={ageStyles.btnText}>+</Text></Pressable>
        </View>
      </View>
      <View style={ageStyles.col}>
        <Text style={ageStyles.colLabel}>Max</Text>
        <View style={ageStyles.stepper}>
          <Pressable style={ageStyles.btn} onPress={() => adjust('max', -1)}><Text style={ageStyles.btnText}>−</Text></Pressable>
          <Text style={ageStyles.value}>{max}</Text>
          <Pressable style={ageStyles.btn} onPress={() => adjust('max', 1)}><Text style={ageStyles.btnText}>+</Text></Pressable>
        </View>
      </View>
      <Pressable onPress={() => onChange([])} hitSlop={8} style={ageStyles.clear}>
        <Text style={ageStyles.clearText}>Clear</Text>
      </Pressable>
    </View>
  );
}

const ageStyles = StyleSheet.create({
  enable: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: '#FDEEE8'
  },
  enableText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  wrap: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md },
  col: { alignItems: 'center' },
  colLabel: { ...typography.caption, color: colors.textMuted, fontSize: 11, marginBottom: 4 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  btn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnText: { fontSize: 18, fontWeight: '800', color: colors.text },
  value: { fontSize: 16, fontWeight: '800', color: colors.text, minWidth: 26, textAlign: 'center' },
  clear: { paddingBottom: 6, marginLeft: 'auto' },
  clearText: { color: colors.textMuted, fontWeight: '700', fontSize: 12 }
});

export function ProfileScreen() {
  const { user, token, updateLocalUser, signOut } = useAuth();
  const [form, setForm] = useState(buildProfileForm(user));
  const [interestInput, setInterestInput] = useState((form.interests || []).join(', '));
  const [mode, setMode] = useState('edit');
  const [isSaving, setIsSaving] = useState(false);
  const completion = useMemo(
    () => getProfileCompletion({ ...form, interests: parseInterestInput(interestInput) }),
    [form, interestInput]
  );

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    const next = buildProfileForm(user);
    setForm(next);
    setInterestInput((next.interests || []).join(', '));
  }, [user]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function changeMode(nextMode) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMode(nextMode);
  }

  async function handleSave() {
    try {
      const parsedAge = form.age ? Number(form.age) : null;
      if (form.age && (!Number.isInteger(parsedAge) || parsedAge < 18 || parsedAge > 80)) {
        Alert.alert('Invalid age', 'Please enter a valid age between 18 and 80.');
        return;
      }

      setIsSaving(true);
      const payload = {
        name: form.name,
        age: parsedAge,
        bio: form.bio,
        location: form.location,
        gender: form.gender,
        genderPreference: form.genderPreference,
        agePreference: form.agePreference,
        lookingFor: form.lookingFor,
        height: form.height,
        languages: form.languages,
        religion: form.religion,
        education: form.education,
        company: form.company,
        jobTitle: form.jobTitle,
        headline: form.headline,
        photos: form.photos,
        interests: parseInterestInput(interestInput),
        customPrompts: form.customPrompts,
        drinking: form.drinking,
        smoking: form.smoking,
        workout: form.workout,
        pets: form.pets,
        professionWhy: form.professionWhy,
        professionLoveLevel: form.professionLoveLevel,
        firstDateIdea: form.firstDateIdea,
        weekendVibe: form.weekendVibe
      };

      if (!token) {
        await updateLocalUser({
          ...(user || {}),
          ...payload,
          profession: user?.profession || 'Not set'
        });
        Alert.alert('Saved', 'Profile updated locally for testing.');
        return;
      }

      const response = await updateProfile(payload, token);
      await updateLocalUser(response.user);
      setForm(buildProfileForm(response.user));
      setInterestInput((response.user?.interests || []).join(', '));
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScreenContainer bottomInset={false}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.heading}>My Profile</Text>
          <View style={styles.professionRow}>
            <View style={styles.professionDot} />
            <Text style={styles.professionLabel}>{user?.profession || 'Profession not set'}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <AnimatedProfileSection index={0}>
          <ProfileHeaderCard completion={completion} mode={mode} onModeChange={changeMode} />
        </AnimatedProfileSection>

        {mode === 'preview' ? (
          <AnimatedProfileSection index={1}>
            <ProfilePreview
              form={{ ...form, interests: parseInterestInput(interestInput) }}
              profession={user?.profession}
              verified={Boolean(user?.professionVerified)}
            />
          </AnimatedProfileSection>
        ) : (
          <>
            <AnimatedProfileSection index={1}>
              <VerificationCard profession={user?.profession} />
            </AnimatedProfileSection>

            <AnimatedProfileSection index={1}>
              <ProfileSection title="Photos" subtitle="Profiles with clear photos perform best" icon={'\uD83D\uDCF8'} collapsible>
                <ProfilePhotoGallery photos={form.photos} token={token} onChange={(value) => updateField('photos', value)} />
              </ProfileSection>
            </AnimatedProfileSection>

            <AnimatedProfileSection index={2}>
              <ProfileSection title="Basics" subtitle="The essentials people see first" icon={'\uD83D\uDC64'} collapsible>
                <AppInput value={form.name} onChangeText={(value) => updateField('name', value)} placeholder="Full name" />
                <AppInput
                  value={form.age}
                  onChangeText={(value) => updateField('age', value)}
                  placeholder="Age"
                  keyboardType="number-pad"
                />
                <Text style={styles.fieldLabel}>Gender</Text>
                <Dropdown
                  value={form.gender}
                  options={genderOptions}
                  placeholder="Select your gender"
                  onChange={(value) => updateField('gender', value)}
                />
                <AppInput
                  value={form.location}
                  onChangeText={(value) => updateField('location', value)}
                  placeholder="City, Country"
                />
                <Text style={styles.fieldLabel}>Height</Text>
                <Dropdown
                  value={form.height}
                  options={heightOptions}
                  placeholder="Select your height"
                  onChange={(value) => updateField('height', value)}
                />
                <Text style={styles.fieldLabel}>Religion</Text>
                <Dropdown
                  value={form.religion}
                  options={religionOptions}
                  placeholder="Select (optional)"
                  onChange={(value) => updateField('religion', value)}
                />
                <Text style={styles.fieldLabel}>Languages you speak</Text>
                <ChipSelector
                  options={languageOptions}
                  value={form.languages}
                  onChange={(value) => updateField('languages', value)}
                  multi
                />
                <AppInput
                  value={form.headline}
                  onChangeText={(value) => updateField('headline', value)}
                  placeholder="One-line headline"
                />
                <AppInput
                  value={form.bio}
                  onChangeText={(value) => updateField('bio', value)}
                  placeholder="Short bio"
                  multiline
                  numberOfLines={4}
                  style={styles.bioInput}
                />
              </ProfileSection>
            </AnimatedProfileSection>

            <AnimatedProfileSection index={3}>
              <ProfileSection title="Dating Goals" subtitle="Be clear about what you want" icon={'\u2764\uFE0F'} collapsible>
                <Text style={styles.fieldLabel}>Looking for</Text>
                <ChipSelector
                  options={lookingForOptions}
                  value={form.lookingFor}
                  onChange={(value) => updateField('lookingFor', value)}
                />
              </ProfileSection>
            </AnimatedProfileSection>

            <AnimatedProfileSection index={3}>
              <ProfileSection
                title="Who I want to meet"
                subtitle="Your match preferences (matching stays within your profession)"
                icon={'\uD83D\uDD0E'}
                collapsible
              >
                <Text style={styles.fieldLabel}>Interested in</Text>
                <Text style={styles.fieldHint}>Pick the genders you want to be matched with</Text>
                <ChipSelector
                  options={genderOptions}
                  value={form.genderPreference}
                  onChange={(value) => updateField('genderPreference', value)}
                  multi
                />
                <Text style={styles.fieldLabel}>Preferred age range</Text>
                <AgeRangePicker
                  value={form.agePreference}
                  onChange={(value) => updateField('agePreference', value)}
                />
              </ProfileSection>
            </AnimatedProfileSection>

            <AnimatedProfileSection index={4}>
              <ProfileSection title="Work & Education" subtitle="Show your professional side" icon={'\uD83D\uDCBC'} collapsible>
                <AppInput
                  value={form.jobTitle}
                  onChangeText={(value) => updateField('jobTitle', value)}
                  placeholder="Job title"
                />
                <AppInput
                  value={form.company}
                  onChangeText={(value) => updateField('company', value)}
                  placeholder="Company"
                />
                <AppInput
                  value={form.education}
                  onChangeText={(value) => updateField('education', value)}
                  placeholder="Education"
                />
              </ProfileSection>
            </AnimatedProfileSection>

            <AnimatedProfileSection index={5}>
              <ProfileSection title="Interests" subtitle="Tap quick picks or type your own" icon={'\u2B50'} collapsible>
                <AppInput
                  value={interestInput}
                  onChangeText={setInterestInput}
                  placeholder="Travel, Coffee, Reading, Music..."
                />
                <ChipSelector
                  options={interestSuggestions}
                  value={parseInterestInput(interestInput)}
                  onChange={(value) => setInterestInput(value.join(', '))}
                  multi
                />
              </ProfileSection>
            </AnimatedProfileSection>

            <AnimatedProfileSection index={6}>
              <ProfileSection title="Lifestyle" subtitle="Compatibility details that matter" icon={'\uD83C\uDF3F'} collapsible>
                <Text style={styles.fieldLabel}>Drinking</Text>
                <ChipSelector
                  options={drinkingOptions}
                  value={form.drinking}
                  onChange={(value) => updateField('drinking', value)}
                />
                <Text style={styles.fieldLabel}>Smoking</Text>
                <ChipSelector
                  options={smokingOptions}
                  value={form.smoking}
                  onChange={(value) => updateField('smoking', value)}
                />
                <Text style={styles.fieldLabel}>Workout habit</Text>
                <ChipSelector
                  options={workoutOptions}
                  value={form.workout}
                  onChange={(value) => updateField('workout', value)}
                />
                <Text style={styles.fieldLabel}>Pets</Text>
                <ChipSelector options={petOptions} value={form.pets} onChange={(value) => updateField('pets', value)} />
              </ProfileSection>
            </AnimatedProfileSection>

            <AnimatedProfileSection index={7}>
              <View style={styles.promptsSectionHeader}>
                <Text style={styles.promptsSectionIcon}>{'\uD83D\uDCAC'}</Text>
                <View>
                  <Text style={styles.promptsSectionTitle}>Prompts</Text>
                  <Text style={styles.promptsSectionSub}>Show your personality with Hinge-style answers</Text>
                </View>
              </View>
            </AnimatedProfileSection>

            <AnimatedProfileSection index={8}>
              <PromptField
                title="Why did you choose your profession?"
                hint="Your USP question — make it count!"
                icon={'\uD83D\uDCBC'}
                accentColor={colors.primary}
                value={form.professionWhy}
                onChangeText={(value) => updateField('professionWhy', value)}
                placeholder="What drew you to this field?"
              />
            </AnimatedProfileSection>

            <AnimatedProfileSection index={9}>
              <ProfessionLoveMeter
                value={form.professionLoveLevel}
                onChange={(value) => updateField('professionLoveLevel', value)}
              />
            </AnimatedProfileSection>

            <AnimatedProfileSection index={10}>
              <Text style={styles.fieldLabel}>Your prompts</Text>
              <Text style={styles.fieldHint}>Pick up to 3 questions and answer them in your own words</Text>
              <CustomPrompts
                value={form.customPrompts}
                onChange={(value) => updateField('customPrompts', value)}
              />
            </AnimatedProfileSection>
          </>
        )}

        <Text style={styles.logout} onPress={signOut}>
          Log Out
        </Text>
      </ScrollView>

      <View style={styles.stickySaveBar}>
        <AppButton title={isSaving ? 'Saving...' : 'Save Profile'} onPress={handleSave} disabled={isSaving} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  heading: {
    ...typography.title,
    color: colors.text,
    fontWeight: '800'
  },
  professionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  professionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
    marginRight: 6
  },
  professionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600'
  },
  scrollContent: {
    paddingBottom: 110
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top'
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.xs,
    marginTop: spacing.sm
  },
  fieldHint: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.xs
  },
  promptsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.xs
  },
  promptsSectionIcon: {
    fontSize: 26,
    marginRight: spacing.sm
  },
  promptsSectionTitle: {
    ...typography.subtitle,
    color: colors.text,
    fontWeight: '800'
  },
  promptsSectionSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2
  },
  logout: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    color: '#FCA5A5',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 15
  },
  stickySaveBar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5
  }
});
