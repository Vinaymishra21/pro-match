// PRISM design system: every profession owns a signature gradient + emoji +
// accent. This is the visual heart of the app's USP — your profession literally
// colours your experience, and exploring others shifts the spectrum.
//
// `gradient` is a 2–3 stop array consumable directly by expo-linear-gradient.
// `accent` is a solid colour for chips/borders/text on light surfaces.
// `soft` is a translucent tint for backgrounds.

export type ProfessionTheme = {
  emoji: string;
  accent: string;
  soft: string;
  gradient: [string, string, ...string[]];
};

const THEMES: Record<string, ProfessionTheme> = {
  'Software Engineer': {
    emoji: '💻',
    accent: '#4F46E5',
    soft: 'rgba(79,70,229,0.12)',
    gradient: ['#6366F1', '#22D3EE']
  },
  Doctor: {
    emoji: '🩺',
    accent: '#0EA5A4',
    soft: 'rgba(14,165,164,0.12)',
    gradient: ['#14B8A6', '#10B981']
  },
  Teacher: {
    emoji: '📚',
    accent: '#D97706',
    soft: 'rgba(217,119,6,0.12)',
    gradient: ['#F59E0B', '#FB923C']
  },
  Lawyer: {
    emoji: '⚖️',
    accent: '#475569',
    soft: 'rgba(71,85,105,0.14)',
    gradient: ['#334155', '#64748B', '#CA8A04']
  },
  Designer: {
    emoji: '🎨',
    accent: '#A21CAF',
    soft: 'rgba(162,28,175,0.12)',
    gradient: ['#D946EF', '#8B5CF6']
  },
  'Marketing Specialist': {
    emoji: '📣',
    accent: '#E11D48',
    soft: 'rgba(225,29,72,0.12)',
    gradient: ['#FB7185', '#F43F5E']
  },
  Entrepreneur: {
    emoji: '🚀',
    accent: '#EA580C',
    soft: 'rgba(234,88,12,0.12)',
    gradient: ['#F97316', '#EF4444']
  },
  'Finance Analyst': {
    emoji: '📈',
    accent: '#059669',
    soft: 'rgba(5,150,105,0.12)',
    gradient: ['#10B981', '#CA8A04']
  }
};

const DEFAULT_THEME: ProfessionTheme = {
  emoji: '✨',
  accent: '#E76F51',
  soft: 'rgba(231,111,81,0.12)',
  gradient: ['#E76F51', '#F4A261']
};

export function professionTheme(profession?: string | null): ProfessionTheme {
  if (!profession) return DEFAULT_THEME;
  return THEMES[profession] || DEFAULT_THEME;
}

export function professionEmoji(profession?: string | null): string {
  return professionTheme(profession).emoji;
}
