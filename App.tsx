import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useFonts } from 'expo-font';
import {
  Fraunces_500Medium_Italic,
  Fraunces_600SemiBold,
  Fraunces_700Bold
} from '@expo-google-fonts/fraunces';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold
} from '@expo-google-fonts/plus-jakarta-sans';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SplashScreen } from './src/screens/auth/SplashScreen';
import { navThemeDark, navThemeLight } from './src/theme/theme';
import { ThemedStatusBar, ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { AuthProvider } from './src/context/AuthContext';
import { UnreadProvider } from './src/context/UnreadContext';

function ThemedApp() {
  const { mode } = useTheme();

  // Brand typography: Fraunces (editorial serif display) + Plus Jakarta Sans
  // (geometric UI sans). Family names must match `fonts` in src/theme/typography.ts.
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_500Medium_Italic,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold
  });

  // Hold on the branded splash while fonts stream in; if loading fails we
  // continue anyway (system fonts render as a graceful fallback).
  if (!fontsLoaded && !fontError) {
    return <SplashScreen />;
  }

  return (
    <AuthProvider>
      <UnreadProvider>
        <NavigationContainer theme={mode === 'dark' ? navThemeDark : navThemeLight}>
          <ThemedStatusBar />
          <RootNavigator />
        </NavigationContainer>
      </UnreadProvider>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <ThemeProvider>
          <ThemedApp />
        </ThemeProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
