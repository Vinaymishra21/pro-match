// Native Google Sign-In → returns the Google ID token for the backend to verify.
// NOTE: this is a native module — it only runs in a real build (EAS / dev
// client), NOT in Expo Go.
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID } from '../constants/config';

let configured = false;

function ensureConfigured() {
  if (configured) return;
  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
  configured = true;
}

// Opens the Google sheet and returns the ID token, or null if the user cancelled.
export async function signInWithGoogle(): Promise<string | null> {
  ensureConfigured();
  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response)) return null; // user dismissed the sheet
  const idToken = response.data.idToken;
  if (!idToken) throw new Error('Google did not return an ID token');
  return idToken;
}
