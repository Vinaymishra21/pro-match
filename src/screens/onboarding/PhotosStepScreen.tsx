import React, { useState } from 'react';
import { Text } from 'react-native';
import { useAuthText } from '../../components/auth/AuthKit';
import { OnboardingScaffold } from './OnboardingScaffold';
import { TOTAL_STEPS, useOnboarding } from './OnboardingContext';
import { ProfilePhotoGallery } from '../../features/profile/components/ProfilePhotoGallery';
import { useAuth } from '../../hooks/useAuth';

export function PhotosStepScreen({ navigation }: any) {
  const { draft, persist } = useOnboarding();
  const { token } = useAuth();
  const authText = useAuthText();
  const [photos, setPhotos] = useState<string[]>(draft.photos || []);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const valid = photos.length >= 2;

  async function next() {
    if (!valid) return;
    try {
      setBusy(true);
      setErr('');
      await persist({ photos });
      navigation.navigate('Location');
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <OnboardingScaffold
      step={4}
      total={TOTAL_STEPS}
      title="Add your photos"
      subtitle="Add at least 2. Real, clear photos of you get far more matches — no group shots or filters."
      onNext={next}
      nextLabel={valid ? 'Continue' : `Add ${2 - photos.length} more photo${2 - photos.length === 1 ? '' : 's'}`}
      nextDisabled={!valid}
      loading={busy}
      onBack={() => navigation.goBack()}
    >
      <ProfilePhotoGallery photos={photos} onChange={setPhotos} token={token} />
      {err ? <Text style={authText.error}>{err}</Text> : null}
    </OnboardingScaffold>
  );
}
