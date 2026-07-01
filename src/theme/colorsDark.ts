// Drop-in DARK palette with the SAME keys as theme/colors, so a Profile-only
// component can go dark by changing just its import line:
//   import { colors } from '../../../theme/colors'
// → import { colorsDark as colors } from '../../../theme/colorsDark'
// Values are tuned to the new dark design (pink-magenta brand on #0E0B14).
export const colorsDark = {
  background: '#0E0B14',
  surface: 'rgba(255,255,255,0.06)',
  card: '#1C1528',
  primary: '#E8415A',
  secondary: '#F08090',
  text: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.45)',
  border: 'rgba(255,255,255,0.1)',
  inputBg: 'rgba(255,255,255,0.06)',
  surfaceStrong: 'rgba(255,255,255,0.09)',
  gold: '#FBBF24',
  white: '#FFFFFF'
} as const;
