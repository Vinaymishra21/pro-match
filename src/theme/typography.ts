// Pro Match type system — an editorial luxury pairing:
//
//   • Fraunces (soft "wonky" display serif)  → big emotional headings, the
//     wordmark, hero moments. Warm, high-contrast, a little romantic.
//   • Plus Jakarta Sans (geometric humanist) → body copy, labels, buttons.
//     Crisp and highly legible on the dark theme.
//
// IMPORTANT (React Native): once a specific `fontFamily` is set, `fontWeight`
// is unreliable — pick the correct family VARIANT below instead of relying on
// a weight override. All variants referenced here are loaded in App.tsx.

/** Font family name constants. Use these instead of raw strings. */
export const fonts = {
  // Fraunces — display serif
  display: 'Fraunces_600SemiBold',
  displayBold: 'Fraunces_700Bold',
  displayItalic: 'Fraunces_500Medium_Italic',
  // Plus Jakarta Sans — UI sans
  sans: 'PlusJakartaSans_400Regular',
  sansMedium: 'PlusJakartaSans_500Medium',
  sansSemiBold: 'PlusJakartaSans_600SemiBold',
  sansBold: 'PlusJakartaSans_700Bold',
  sansExtraBold: 'PlusJakartaSans_800ExtraBold'
} as const;

export const typography = {
  // ——— Display / headings (serif) ———————————————————————————————
  /** Hero moments: welcome brand, "It's a Match!", paywall hero. */
  display: {
    fontFamily: fonts.displayBold,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -0.8,
    fontWeight: '700'
  },
  /** Screen-level headline (auth titles, onboarding step titles). */
  h1: {
    fontFamily: fonts.displayBold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.6,
    fontWeight: '700'
  },
  /** Section headline / feature-tab headers. */
  h2: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.4,
    fontWeight: '600'
  },
  /** Legacy heading token (kept for existing `...typography.title` spreads). */
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
    fontWeight: '600'
  },
  /** Serif italic accent line — taglines, romantic flourishes. */
  tagline: {
    fontFamily: fonts.displayItalic,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: 0.1,
    fontWeight: '500'
  },

  // ——— Body / UI (sans) ——————————————————————————————————————————
  /** Card titles, list emphasis, empty-state titles. */
  subtitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
    fontWeight: '600'
  },
  /** Default reading text. */
  body: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.1,
    fontWeight: '400'
  },
  /** Emphasised body — names in rows, key values. */
  bodyStrong: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.1,
    fontWeight: '700'
  },
  /** Secondary/meta text. */
  caption: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
    fontWeight: '500'
  },
  /** Tiny uppercase kicker above headings (a.k.a. overline). */
  eyebrow: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    fontWeight: '800'
  },
  /** Alias of `eyebrow` for overline-style labels. */
  overline: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontWeight: '800'
  },
  /** CTA button labels. */
  button: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0.3,
    fontWeight: '800'
  }
} as const;
