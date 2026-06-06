import React, { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getMe,
  login,
  register,
  requestOtp as requestOtpApi,
  verifyOtp as verifyOtpApi,
  deactivateAccount as deactivateAccountApi,
  deleteAccount as deleteAccountApi
} from '../services/apiService';
import { DEV_BYPASS_PHONE, DEV_OFFLINE_USER } from '../constants/config';
import { registerForPushNotifications } from '../services/push';
import type { AuthContextValue, AuthPayload, AuthResponse, OtpRequestResponse, User } from '../types';

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'pro_match_token';
const USER_KEY = 'pro_match_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY)
        ]);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

          const fresh = await getMe(storedToken);
          setUser(fresh.user);
          await AsyncStorage.setItem(USER_KEY, JSON.stringify(fresh.user));
          // Refresh push registration for the restored session.
          registerForPushNotifications(storedToken);
        }
      } catch (error) {
        await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
      } finally {
        setIsLoading(false);
      }
    }

    bootstrap();
  }, []);

  const onAuthSuccess = useCallback(async (payload: AuthResponse) => {
    setToken(payload.token);
    setUser(payload.user);
    await AsyncStorage.setItem(TOKEN_KEY, payload.token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(payload.user));
    // Register this device for push notifications (non-blocking).
    registerForPushNotifications(payload.token);
  }, []);

  const signUp = useCallback(
    async (payload: AuthPayload) => {
      const response = await register(payload);
      await onAuthSuccess(response);
      return response.user;
    },
    [onAuthSuccess]
  );

  const signIn = useCallback(
    async (payload: AuthPayload) => {
      const response = await login(payload);
      await onAuthSuccess(response);
      return response.user;
    },
    [onAuthSuccess]
  );

  const requestOtp = useCallback(
    (phone: string): Promise<OtpRequestResponse> => requestOtpApi(phone),
    []
  );

  const verifyOtp = useCallback(
    async (phone: string, code: string) => {
      const response = await verifyOtpApi(phone, code);
      await onAuthSuccess(response);
      return response.user;
    },
    [onAuthSuccess]
  );

  // Dev-only shortcut: runs the real OTP flow against the backend dev code so
  // we end up with a valid token and a real user record.
  const devBypass = useCallback(async () => {
    // Try the real backend dev-OTP flow first (gives a valid token + live data).
    try {
      await requestOtpApi(DEV_BYPASS_PHONE);
      const response = await verifyOtpApi(DEV_BYPASS_PHONE, '123456');
      await onAuthSuccess(response);
      return response.user;
    } catch {
      // Backend/MongoDB not running — fall back to a fully-offline fake user so
      // the design can be reviewed in Expo with no setup. No token is set, so
      // API-backed screens will simply show their empty/error states.
      await updateLocalUser(DEV_OFFLINE_USER);
      return DEV_OFFLINE_USER;
    }
  }, [onAuthSuccess]);

  const refreshUser = useCallback(async () => {
    if (!token) {
      return;
    }

    const response = await getMe(token);
    setUser(response.user);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user));
  }, [token]);

  const updateLocalUser = useCallback(async (nextUser: User | null) => {
    setUser(nextUser);
    if (nextUser) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      return;
    }

    await AsyncStorage.removeItem(USER_KEY);
  }, []);

  const signOut = useCallback(async () => {
    setToken('');
    setUser(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  }, []);

  // Deactivate (reversible): hide the account, then sign out locally. Logging
  // back in reactivates it server-side.
  const deactivateAccount = useCallback(async () => {
    if (token) {
      await deactivateAccountApi(token);
    }
    await signOut();
  }, [token, signOut]);

  // Delete (permanent): wipe the account server-side, then sign out locally.
  const deleteAccount = useCallback(async () => {
    if (token) {
      await deleteAccountApi(token);
    }
    await signOut();
  }, [token, signOut]);

  const value = useMemo(
    () => ({
      token,
      user,
      isLoading,
      signUp,
      signIn,
      requestOtp,
      verifyOtp,
      devBypass,
      signOut,
      refreshUser,
      updateLocalUser,
      deactivateAccount,
      deleteAccount
    }),
    [
      token,
      user,
      isLoading,
      signUp,
      signIn,
      requestOtp,
      verifyOtp,
      devBypass,
      signOut,
      refreshUser,
      updateLocalUser,
      deactivateAccount,
      deleteAccount
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
