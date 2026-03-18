import { DefaultTheme } from '@react-navigation/native';
import { colors } from './colors';

export const appTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    primary: colors.primary,
    border: colors.border,
    notification: colors.secondary
  }
};
