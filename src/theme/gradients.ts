// Shared brand gradients for the PRISM design system. Tuples are typed for
// expo-linear-gradient's `colors` prop.

export const gradients = {
  // Signature brand gradient — warm sunset, used on primary CTAs & hero.
  brand: ['#FF6B8A', '#E76F51', '#F4A261'] as [string, string, string],
  // Premium / Pro — gold lux.
  gold: ['#F59E0B', '#FBBF24', '#FCD34D'] as [string, string, string],
  // Cool aurora — used on the Likes "locked" mystery state.
  aurora: ['#6366F1', '#8B5CF6', '#22D3EE'] as [string, string, string],
  // Soft light surface gradient for screen backgrounds.
  surface: ['#F4F8FF', '#EAF1F8'] as [string, string],
  // Dark romantic overlay for image-backed hero screens.
  nightFade: ['rgba(8,4,7,0)', 'rgba(8,4,7,0.85)'] as [string, string]
} as const;
