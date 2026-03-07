import React, { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';
import { updateProfile } from '../../services/apiService';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function ProfileScreen() {
  const { user, token, updateLocalUser, signOut } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    try {
      setIsSaving(true);
      const payload = {
        name,
        bio,
        age: age ? Number(age) : undefined
      };
      const response = await updateProfile(payload, token);
      await updateLocalUser(response.user);
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScreenContainer>
      <Text style={styles.heading}>Profile</Text>
      <Text style={styles.meta}>Profession: {user?.profession}</Text>

      <AppInput value={name} onChangeText={setName} placeholder="Full name" />
      <AppInput value={age} onChangeText={setAge} placeholder="Age" keyboardType="number-pad" />
      <AppInput
        value={bio}
        onChangeText={setBio}
        placeholder="Bio"
        multiline
        numberOfLines={4}
        style={styles.bioInput}
      />

      <AppButton title={isSaving ? 'Saving...' : 'Save Profile'} onPress={handleSave} disabled={isSaving} />

      <Text style={styles.logout} onPress={signOut}>
        Logout
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heading: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.xs
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.lg
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top'
  },
  logout: {
    marginTop: spacing.lg,
    color: '#FCA5A5',
    textAlign: 'center',
    fontWeight: '700'
  }
});
