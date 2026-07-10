import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { updateProfession, updateProfile } from '../../services/apiService';

// The data collected across the onboarding wizard. Held here (not in the auth
// user) so RootNavigator doesn't flip to the main app mid-flow — each step
// persists to the backend, but we only refresh the local user at the very end.
export type OnboardingDraft = {
  name: string;
  dob: string; // ISO date string
  profession: string;
  photos: string[];
  location: string; // friendly city label, e.g. "New Delhi, Delhi"
  coordinates?: [number, number]; // [lng, lat] — GPS fix; absent if typed manually
  gender: string;
  genderPreference: string[];
  bio: string;
};

type OnboardingContextValue = {
  draft: OnboardingDraft;
  update: (patch: Partial<OnboardingDraft>) => void;
  persist: (patch: Partial<OnboardingDraft>) => Promise<void>;
  finish: () => Promise<void>;
};

// Total steps in the wizard (used for the progress bar).
export const TOTAL_STEPS = 8;

const Ctx = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user, token, refreshUser } = useAuth();
  const [draft, setDraft] = useState<OnboardingDraft>(() => ({
    name: user?.name && user.name.toLowerCase() !== 'new user' ? user.name : '',
    dob: user?.dob || '',
    profession: user?.profession || '',
    photos: user?.photos || [],
    location: user?.location || '',
    coordinates: undefined, // raw coords are never returned by the API
    gender: user?.gender || '',
    genderPreference: user?.genderPreference || [],
    bio: user?.bio || ''
  }));

  const update = (patch: Partial<OnboardingDraft>) => setDraft((d) => ({ ...d, ...patch }));

  // Save a step to the backend (profession has its own endpoint). Intentionally
  // does NOT touch the local auth user, so gating stays on onboarding until finish.
  async function persist(patch: Partial<OnboardingDraft>) {
    update(patch);
    if (!token) return; // offline dev — draft only

    if (patch.profession !== undefined) {
      await updateProfession(patch.profession, token);
    }
    const profilePatch: Record<string, unknown> = {};
    if (patch.name !== undefined) profilePatch.name = patch.name;
    if (patch.dob !== undefined) profilePatch.dob = patch.dob;
    if (patch.photos !== undefined) profilePatch.photos = patch.photos;
    if (patch.location !== undefined) profilePatch.location = patch.location;
    if (patch.coordinates !== undefined) profilePatch.coordinates = patch.coordinates;
    if (patch.gender !== undefined) profilePatch.gender = patch.gender;
    if (patch.genderPreference !== undefined) profilePatch.genderPreference = patch.genderPreference;
    if (patch.bio !== undefined) profilePatch.bio = patch.bio;
    if (Object.keys(profilePatch).length) {
      await updateProfile(profilePatch, token);
    }
  }

  // Pull the now-complete profile into the auth user → RootNavigator enters the app.
  async function finish() {
    await refreshUser();
  }

  const value = useMemo(() => ({ draft, update, persist, finish }), [draft]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useOnboarding must be used inside OnboardingProvider');
  return ctx;
}
