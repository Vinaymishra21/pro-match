import React, { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMe, login, register } from '../services/apiService';
import type { AuthContextValue, AuthPayload, AuthResponse, User } from '../types';

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

  const value = useMemo(
    () => ({
      token,
      user,
      isLoading,
      signUp,
      signIn,
      signOut,
      refreshUser,
      updateLocalUser
    }),
    [token, user, isLoading, signUp, signIn, signOut, refreshUser, updateLocalUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
