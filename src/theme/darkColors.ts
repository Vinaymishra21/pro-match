// Dark premium theme tokens — used by the new dark screens (Profile edit,
// ProfileDetailModal) during the phased re-theme. Kept separate from `colors`
// (the light theme) so light screens are untouched while we roll this out.
//
// Brand accent is a pink→magenta gradient; per-profession PRISM gradients still
// drive each profession's own accent on top of this dark base.
export const darkColors = {
  // Backgrounds
  bg: '#0E0B14',
  bgGradient: ['#1A0A1E', '#0E0B14', '#1A0614'] as [string, string, string],
  card: '#1C1528',
  surface: 'rgba(255,255,255,0.06)',
  surfaceStrong: 'rgba(255,255,255,0.09)',

  // Text
  text: '#FFFFFF',
  textDim: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.45)',
  textFaint: 'rgba(255,255,255,0.3)',

  // Lines
  border: 'rgba(255,255,255,0.1)',
  borderStrong: 'rgba(255,255,255,0.16)',

  // Brand (pink → magenta) — neutral accent when no profession context
  primary: '#E8415A',
  primary2: '#C0305F',
  brandGradient: ['#E8415A', '#C0305F'] as [string, string],
  brandText: '#F08090',
  brandSoft: 'rgba(232,65,90,0.15)',
  brandBorder: 'rgba(232,65,90,0.4)',

  // Pro / premium gold
  gold: '#FBBF24',
  goldGradient: ['#FBBF24', '#F59E0B'] as [string, string],

  // Semantic
  success: '#34D399',
  danger: '#FB7185',

  white: '#FFFFFF'
} as const;

export const darkRadius = { sm: 8, md: 12, lg: 14, xl: 22, pill: 999 } as const;
