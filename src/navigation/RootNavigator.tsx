import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfessionSelectScreen } from '../screens/auth/ProfessionSelectScreen';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { useAuth } from '../hooks/useAuth';
import { MainTabNavigator } from './MainTabNavigator';
import { AuthNavigator } from './AuthNavigator';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { PaywallScreen } from '../screens/billing/PaywallScreen';
import { SettingsScreen } from '../screens/main/SettingsScreen';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, isLoading } = useAuth();
  const hasAccess = Boolean(user);
  const needsProfessionSetup = Boolean(user) && !user.profession;

  if (isLoading) {
    return <SplashScreen onComplete={() => {}} />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background }
      }}
    >
      {!hasAccess ? (
        <Stack.Screen name="AuthFlow" component={AuthNavigator} />
      ) : needsProfessionSetup ? (
        <Stack.Screen name="ProfessionSetup" component={ProfessionSelectScreen} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{
              headerShown: true,
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
              title: 'Chat'
            }}
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
