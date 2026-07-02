import type { User } from '../types';

// The mandatory profile a new member must complete before entering the app:
// a real name, a date of birth (18+ → age), a profession, and at least 2 photos.
// Computed (not a stored flag) so it works for existing accounts with no
// migration, and so a half-finished signup resumes onboarding on next launch.
export function hasCoreProfile(user: User | null | undefined): boolean {
  if (!user) return false;
  const name = (user.name || '').trim();
  const hasName = name.length > 0 && name.toLowerCase() !== 'new user';
  const hasAge = typeof user.age === 'number' && user.age >= 18;
  const hasProfession = Boolean((user.profession || '').trim());
  const hasPhotos = Array.isArray(user.photos) && user.photos.length >= 2;
  return hasName && hasAge && hasProfession && hasPhotos;
}

// Computes age from an ISO/date string; null if invalid.
export function ageFromDob(dob: string | Date | null | undefined): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age;
}
