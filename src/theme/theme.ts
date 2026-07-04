// React Navigation themes, derived from the app palettes so navigator chrome
// (default screen backgrounds, transition fills, headers) matches the active
// mode. App.tsx picks one per `useTheme().mode`.
import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
import { darkTheme, lightTheme } from './themes';

export const navThemeDark: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: darkTheme.bg,
    card: darkTheme.card,
    text: darkTheme.text,
    border: darkTheme.border,
    primary: darkTheme.primary,
    notification: darkTheme.primary
  }
};

export const navThemeLight: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: lightTheme.bg,
    card: lightTheme.card,
    text: lightTheme.text,
    border: lightTheme.border,
    primary: lightTheme.primary,
    notification: lightTheme.primary
  }
};
