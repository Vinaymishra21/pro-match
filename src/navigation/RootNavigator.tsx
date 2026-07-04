import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { useAuth } from '../hooks/useAuth';
import { hasCoreProfile } from '../utils/onboarding';
import { MainTabNavigator } from './MainTabNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { AuthNavigator } from './AuthNavigator';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { PaywallScreen } from '../screens/billing/PaywallScreen';
import { SettingsScreen } from '../screens/main/SettingsScreen';
import { useTheme } from '../theme/ThemeProvider';
import type { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, isLoading } = useAuth();
  const { colors } = useTheme();
  const hasAccess = Boolean(user);
  // New members complete a step-by-step onboarding (name, DOB, profession,
  // 2+ photos) before entering the app.
  const needsOnboarding = Boolean(user) && !hasCoreProfile(user);

  if (isLoading) {
    return <SplashScreen onComplete={() => {}} />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg }
      }}
    >
      {!hasAccess ? (
        <Stack.Screen name="AuthFlow" component={AuthNavigator} />
      ) : needsOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Paywall"
            component={PaywallScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
