// Unified theme palettes for the light/dark theme system.
//
// `ThemeColors` is the UNION of the keys in theme/darkColors.ts and
// theme/colorsDark.ts, so BOTH existing import styles resolve against one
// object during the phased conversion:
//
//   darkColors.bg / darkColors.brandText / ...   → colors.bg / colors.brandText
//   colorsDark.background / colorsDark.inputBg   → colors.background / colors.inputBg
//
// `darkTheme` values are copied EXACTLY from those two modules — dark mode must
// stay pixel-identical to the pre-theming app. `lightTheme` is the new premium
// light palette (warm cream, deep ink, same coral/pink brand).
//
// darkColors.ts / colorsDark.ts still exist and are still imported by the
// screens that haven't been converted yet; do not delete them until every
// screen reads from useTheme() instead.

export type ThemeColors = {
  // Backgrounds
  /** Base screen background (alias of `background`). */
  bg: string;
  /** Base screen background (alias of `bg`). */
  background: string;
  /** Full-screen backdrop gradient (see components/DarkBackground). */
  bgGradient: [string, string, string];
  /** Solid elevated card. */
  card: string;
  /** Translucent card/panel wash. */
  surface: string;
  /** Stronger translucent wash (hover/active panels). */
  surfaceStrong: string;
  /** Text-input background. */
  inputBg: string;

  // Text
  text: string;
  textDim: string;
  textMuted: string;
  /** Decorative/disabled text — intentionally below AA in both modes. */
  textFaint: string;

  // Lines
  border: string;
  borderStrong: string;

  // Brand (coral pink → magenta) — identical hue family in both modes
  primary: string;
  primary2: string;
  /** Legacy alias (colorsDark.secondary) — same value as `brandText`. */
  secondary: string;
  brandGradient: [string, string];
  /** Brand-tinted text that must stay readable on `bg`. */
  brandText: string;
  brandSoft: string;
  brandBorder: string;

  // Pro / premium gold
  gold: string;
  goldGradient: [string, string];

  // Semantic
  success: string;
  danger: string;

  white: string;

  // Ambient (DarkBackground orbs + elevation)
  /** Default tint of the top-left backdrop orb. */
  orbTop: string;
  /** Tint of the bottom-right backdrop orb. */
  orbBottom: string;
  /** shadowColor for elevation — light mode uses gentle shadows where dark uses glows. */
  shadow: string;
};

// ————————————————————————————————————————————————————————————————————————
// DARK — values copied verbatim from darkColors.ts + colorsDark.ts.
// DO NOT tweak: dark mode must render pixel-identical to the current app.
// ————————————————————————————————————————————————————————————————————————
export const darkTheme: ThemeColors = {
  // Backgrounds
  bg: '#0E0B14', // darkColors.bg
  background: '#0E0B14', // colorsDark.background
  bgGradient: ['#1A0A1E', '#0E0B14', '#1A0614'], // darkColors.bgGradient
  card: '#1C1528', // darkColors.card = colorsDark.card
  surface: 'rgba(255,255,255,0.06)', // darkColors.surface = colorsDark.surface
  surfaceStrong: 'rgba(255,255,255,0.09)', // darkColors.surfaceStrong = colorsDark.surfaceStrong
  inputBg: 'rgba(255,255,255,0.06)', // colorsDark.inputBg

  // Text
  text: '#FFFFFF', // darkColors.text = colorsDark.text
  textDim: 'rgba(255,255,255,0.7)', // darkColors.textDim
  textMuted: 'rgba(255,255,255,0.45)', // darkColors.textMuted = colorsDark.textMuted
  textFaint: 'rgba(255,255,255,0.3)', // darkColors.textFaint

  // Lines
  border: 'rgba(255,255,255,0.1)', // darkColors.border = colorsDark.border
  borderStrong: 'rgba(255,255,255,0.16)', // darkColors.borderStrong

  // Brand
  primary: '#E8415A', // darkColors.primary = colorsDark.primary
  primary2: '#C0305F', // darkColors.primary2
  secondary: '#F08090', // colorsDark.secondary (= darkColors.brandText)
  brandGradient: ['#E8415A', '#C0305F'], // darkColors.brandGradient
  brandText: '#F08090', // darkColors.brandText
  brandSoft: 'rgba(232,65,90,0.15)', // darkColors.brandSoft
  brandBorder: 'rgba(232,65,90,0.4)', // darkColors.brandBorder

  // Gold
  gold: '#FBBF24', // darkColors.gold = colorsDark.gold
  goldGradient: ['#FBBF24', '#F59E0B'], // darkColors.goldGradient

  // Semantic
  success: '#34D399', // darkColors.success
  danger: '#FB7185', // darkColors.danger

  white: '#FFFFFF', // darkColors.white = colorsDark.white

  // Ambient — the exact values DarkBackground has always hardcoded
  orbTop: 'rgba(232,65,90,0.15)',
  orbBottom: 'rgba(180,60,200,0.12)',
  shadow: '#000000'
};

// ————————————————————————————————————————————————————————————————————————
// LIGHT — new premium palette: warm editorial cream, deep plum ink, the SAME
// coral/pink brand gradient so identity is constant across modes. Translucent
// washes flip from white-on-dark to ink-on-cream. Text tiers meet WCAG AA on
// `bg` except `textFaint` (decorative, mirrors dark's 0.3 white).
// ————————————————————————————————————————————————————————————————————————
export const lightTheme: ThemeColors = {
  // Backgrounds
  bg: '#FAF6F0', // warm cream — deliberately not pure white
  background: '#FAF6F0',
  bgGradient: ['#F7EFF6', '#FAF6F0', '#FBEFEA'], // faint lilac → cream → warm blush (mirrors dark's violet → base → pink)
  card: '#FFFDFB', // warm white card, lifts off the cream bg
  surface: 'rgba(35,26,47,0.05)', // translucent INK wash (dark uses translucent white)
  surfaceStrong: 'rgba(35,26,47,0.08)',
  inputBg: 'rgba(35,26,47,0.05)', // = surface, mirroring dark where inputBg === surface

  // Text — deep plum ink, not pure black
  text: '#231A2F', // ~15.2:1 on bg
  textDim: 'rgba(35,26,47,0.78)', // ~8:1
  textMuted: 'rgba(35,26,47,0.62)', // ~4.6:1 (AA)
  textFaint: 'rgba(35,26,47,0.42)', // decorative only

  // Lines
  border: 'rgba(35,26,47,0.12)',
  borderStrong: 'rgba(35,26,47,0.2)',

  // Brand — same coral/pink as dark
  primary: '#E8415A',
  primary2: '#C0305F',
  secondary: '#C42B48', // = brandText, mirroring dark's aliasing
  brandGradient: ['#E8415A', '#C0305F'],
  brandText: '#C42B48', // deepened coral so brand TEXT stays AA on cream (~5.2:1)
  brandSoft: 'rgba(232,65,90,0.10)',
  brandBorder: 'rgba(232,65,90,0.35)',

  // Gold — deepened so premium accents read on cream (~4.7:1)
  gold: '#B45309',
  goldGradient: ['#F59E0B', '#D97706'],

  // Semantic — deepened for AA on cream
  success: '#047857', // ~5.1:1
  danger: '#BE123C', // ~5.9:1

  white: '#FFFFFF',

  // Ambient — soft blush/lilac orbs, gentle ink shadow instead of glow
  orbTop: 'rgba(232,65,90,0.09)',
  orbBottom: 'rgba(180,60,200,0.06)',
  shadow: '#2A1F35'
};
