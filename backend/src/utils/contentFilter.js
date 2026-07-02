// Lightweight, dependency-free content filter for user-generated text (chat
// messages, bio, prompts). Targets the highest-signal abuse patterns for a
// dating app: pushing people off-platform (the #1 scammer move) and obvious
// spam/scam solicitations. Deliberately conservative to avoid false positives —
// it flags contact hand-offs and known scam terms, not ordinary chat.

// URLs / domains (http(s), www., or bare domain.tld with a common TLD).
const URL_RE = /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:com|net|org|io|in|co|xyz|link|me|app|shop|site|online|info|biz|ru|cn)\b/i;

// Email addresses.
const EMAIL_RE = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i;

// Phone numbers: 7+ digits allowing spaces / dashes / dots / parens, or a +CC form.
const PHONE_RE = /(?:\+?\d[\d\s().-]{6,}\d)/;

// Off-platform contact hand-off — the classic "let's move to WhatsApp" move.
const OFFPLATFORM_RE = /\b(whats\s?app|whatsapp|w\.?app|telegram|t\.me|insta(gram)?|snap\s?chat|snapchat|signal app|kik|hangouts?|wechat|viber|\bskype\b)\b/i;
const HANDOFF_RE = /\b(add me on|dm me on|message me on|text me on|reach me on|find me on|my (number|no|contact|handle|id) is|contact me (at|on))\b/i;

// Scam / solicitation keywords common in romance + investment scams.
const SCAM_RE = /\b(crypto|bitcoin|btc|ethereum|usdt|binance|forex|trading signals?|investment plan|double your (money|investment)|guaranteed returns?|sugar (daddy|mommy|baby)|onlyfans|only\s?fans|cash\s?app|gift ?cards?|western union|nude|nudes|sell(ing)? (pics|content)|hookup for money|escort)\b/i;

const CHECKS = [
  { code: 'link', re: URL_RE, label: 'a website link' },
  { code: 'email', re: EMAIL_RE, label: 'an email address' },
  { code: 'phone', re: PHONE_RE, label: 'a phone number' },
  { code: 'offplatform', re: OFFPLATFORM_RE, label: 'another app / social handle' },
  { code: 'handoff', re: HANDOFF_RE, label: 'off-platform contact details' },
  { code: 'scam', re: SCAM_RE, label: 'spam or scam content' }
];

// Scans a single string. Returns { clean, reasons:[{code,label}] }.
function scanText(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return { clean: true, reasons: [] };
  }
  const reasons = [];
  for (const { code, re, label } of CHECKS) {
    if (re.test(text)) reasons.push({ code, label });
  }
  return { clean: reasons.length === 0, reasons };
}

// Scans several named fields (e.g. { bio, headline }). Returns the first field
// that trips a check, so callers can surface a precise message.
function scanFields(fields) {
  for (const [field, value] of Object.entries(fields)) {
    const result = scanText(value);
    if (!result.clean) {
      return { clean: false, field, reasons: result.reasons };
    }
  }
  return { clean: true };
}

// Human-readable summary for an API error message.
function describe(reasons) {
  const labels = [...new Set((reasons || []).map((r) => r.label))];
  if (!labels.length) return 'disallowed content';
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}

module.exports = { scanText, scanFields, describe };
