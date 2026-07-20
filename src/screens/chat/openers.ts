// Conversation openers for an empty chat. Two kinds, per the product goal of
// giving anyone (esp. a first mover) a better start than "hi":
//   1. Prompt openers — riff on something from THEIR profile (Hinge-style).
//   2. Icebreakers — a few tasteful canned lines when their profile is sparse.
import type { DiscoverProfile } from '../../types';

export interface PromptOpener {
  id: string;
  label: string; // what the prompt is about, shown on the card
  answer: string; // their answer, shown quoted
}

// Generic, low-effort-to-answer, non-creepy. Shown to everyone.
export const ICEBREAKERS: string[] = [
  'If you could teleport anywhere right now, where would you go?',
  "What's made you smile this week?",
  'Ideal first meet — coffee, cocktails, or a walk?',
  "What are you weirdly passionate about?",
  "Two truths and a lie — I'll guess 👀",
  "What's top of your list this year?"
];

// Pull answered profile prompts into opener cards (max 4, keeps the panel short).
export function buildPromptOpeners(other?: DiscoverProfile | null): PromptOpener[] {
  if (!other) return [];

  const openers: PromptOpener[] = [];

  for (const p of other.customPrompts || []) {
    if (p?.answer?.trim()) openers.push({ id: `cp-${openers.length}`, label: p.prompt || 'Their prompt', answer: p.answer.trim() });
  }
  if (other.firstDateIdea?.trim()) openers.push({ id: 'first-date', label: 'Ideal first date', answer: other.firstDateIdea.trim() });
  if (other.weekendVibe?.trim()) openers.push({ id: 'weekend', label: 'Perfect weekend', answer: other.weekendVibe.trim() });
  if (other.professionWhy?.trim()) openers.push({ id: 'why-work', label: 'Why they love their work', answer: other.professionWhy.trim() });

  return openers.slice(0, 4);
}

// Pre-fill text when tapping a prompt opener: quote their words and leave the
// user to add their reaction/question. They can edit before sending.
export function promptPrefill(o: PromptOpener): string {
  return `"${o.answer}" — `;
}
