import type { User } from '../types';

// Client-side mirror of the backend Pro check. Used purely for UI gating;
// the server remains the source of truth and re-enforces every rule.
export function isProUser(user: User | null | undefined): boolean {
  if (!user || user.tier !== 'pro') return false;
  if (!user.proExpiresAt) return false;
  return new Date(user.proExpiresAt).getTime() > Date.now();
}
