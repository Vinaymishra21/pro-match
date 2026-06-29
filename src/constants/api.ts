// API base URL resolution, in priority order:
//   1. EXPO_PUBLIC_API_URL env var (set it when running `npm start`)
//   2. Android emulator loopback (10.0.2.2)
//   3. LAN IP fallback for physical devices on the same Wi-Fi
//
// Physical device (Expo Go): start the app with your machine's LAN IP, e.g.
//   EXPO_PUBLIC_API_URL=http://192.168.1.18:4000 npm start
import { Platform } from 'react-native';

const ENV_URL = process.env.EXPO_PUBLIC_API_URL;

// Default LAN IP detected on the dev machine; change if your network differs.
const LAN_FALLBACK = 'http://192.168.1.22:4000';

export const API_BASE_URL =
  ENV_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:4000' : LAN_FALLBACK);
