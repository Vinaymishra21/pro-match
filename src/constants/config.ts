// Single source of truth for the dev auth bypass.
//
// Production builds are ALWAYS secure: the bypass is off unless you explicitly
// opt in via the env var at start time:
//
//   EXPO_PUBLIC_DEV_BYPASS_AUTH=true npm start
//
// When on, the Welcome screen shows a "Skip login (dev)" button and the social
// buttons auto-login as a real dev user (using the backend dev OTP), so you get
// a valid token and the whole app works end to end.
export const DEV_BYPASS_AUTH = process.env.EXPO_PUBLIC_DEV_BYPASS_AUTH === 'true';

// Google Web OAuth client ID — passed as `webClientId` to google-signin so the
// native flow returns an ID token the backend verifies. Public value (safe to
// ship). Must match GOOGLE_WEB_CLIENT_ID on the backend.
export const GOOGLE_WEB_CLIENT_ID =
  '266858166964-55u47a6jscb2agplvq33o3aveik086pd.apps.googleusercontent.com';

// The phone number the dev bypass logs in as. It goes through the normal OTP
// flow against the backend (which must run with AUTH_DEV_MODE=true).
export const DEV_BYPASS_PHONE = '+910000000000';

// A fully-offline fake user used when the dev bypass can't reach the backend.
// Lets you review the design in Expo with zero backend/MongoDB setup. API-backed
// screens (Discover/Likes/Matches) will show their empty/error states, but every
// screen, theme, and layout renders. Has a profession so you land on the tabs.
export const DEV_OFFLINE_USER = {
  id: 'dev-offline-user',
  name: 'Dev Preview',
  profession: 'Software Engineer',
  age: 27,
  tier: 'free' as const,
  credits: 0,
  // A complete core profile so offline preview lands on the tabs (skips onboarding).
  photos: [
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800'
  ] as string[]
};
