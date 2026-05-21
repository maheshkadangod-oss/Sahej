/**
 * Validation for the "what should Asha call you?" field — the affectionate term of address
 * the user chooses. This is shown back to the user (home greeting) and injected into Asha's
 * system prompt, so we keep it short, clean, and free of abusive language.
 *
 * This is intentionally a light client-side guard, not a content-moderation system. The field
 * is private to the user (no one else sees it), so the goal is just to stop someone setting an
 * abusive term that Asha would then warmly repeat back — which would feel awful — and to cap
 * length / strip control characters. We err toward allowing real names from any culture.
 */

/** Default term of address when the user doesn't choose one. Warm, inclusive, never wrong. */
export const DEFAULT_ADDRESS = 'wonderful mom';

/** Max length — long enough for compound names, short enough to read in a greeting. */
const MAX_LENGTH = 30;

// Unambiguous profanity matched as SUBSTRINGS (case-insensitive, post leetspeak-normalization).
// Substring matching catches inflections — "fucker", "fucking", "shitty", "bitchy" — which a
// whole-word check would miss. These stems have essentially no innocent embedding in a name.
// Since Asha repeats this term back warmly, we err toward catching abuse over being permissive.
const SUBSTRING_PROFANITY = [
  'fuck', 'shit', 'bitch', 'cunt', 'asshole', 'bastard', 'pussy',
  'slut', 'whore', 'wanker', 'bollocks', 'douche',
  'rape', 'rapist', 'molest', 'pedo', 'paedo',
  'nazi', 'hitler',
  // Common Hindi/Urdu abuses (the app's primary audience).
  'chutiya', 'chutiye', 'bhenchod', 'behenchod', 'madarchod', 'gandu', 'randi', 'gaand',
];

// Profanity that DOES embed in real names/words (Cockburn, Dickson, "prick" in… etc.), so we
// only reject these as whole words, not substrings.
const WORD_PROFANITY = ['dick', 'cock', 'prick', 'twat', 'lund'];

// Hard slurs — always rejected as substrings, no legitimate name contains these.
const HARD_SUBSTRINGS = [
  'nigger', 'nigga', 'faggot', 'retard', 'chink', 'spic', 'kike', 'tranny',
];

export interface SanitizeResult {
  ok: boolean;
  /** Cleaned value to store when ok. */
  value: string;
  /** Gentle, user-facing reason when not ok. */
  reason?: string;
}

/**
 * Validate and clean a desired term of address.
 * - Empty input is OK (caller falls back to DEFAULT_ADDRESS) and returns ok:true with value ''.
 * - Trims, collapses whitespace, strips control chars, caps length.
 * - Rejects profanity / slurs with a gentle reason.
 */
export function sanitizeAddress(raw: string): SanitizeResult {
  // Strip control characters (U+0000–U+001F and U+007F), then collapse internal whitespace.
  const controlChars = new RegExp('[\\u0000-\\u001F\\u007F]', 'g');
  const cleaned = raw.replace(controlChars, '').replace(/\s+/g, ' ').trim();

  if (cleaned === '') {
    // Empty is allowed — the caller will substitute the default.
    return { ok: true, value: '' };
  }

  if (cleaned.length > MAX_LENGTH) {
    return { ok: false, value: cleaned, reason: `Please keep it under ${MAX_LENGTH} characters.` };
  }

  const lower = cleaned.toLowerCase();

  // Normalize common leetspeak so "f@ck" / "sh1t" don't slip through.
  const normalized = lower
    .replace(/[@4]/g, 'a')
    .replace(/[1!|]/g, 'i')
    .replace(/[3]/g, 'e')
    .replace(/[0]/g, 'o')
    .replace(/[$5]/g, 's')
    .replace(/[7]/g, 't');

  const gentle = "Let's pick something kind to call you.";

  // Substring checks: hard slurs + unambiguous profanity (catches inflections).
  for (const bad of [...HARD_SUBSTRINGS, ...SUBSTRING_PROFANITY]) {
    if (normalized.includes(bad)) {
      return { ok: false, value: cleaned, reason: gentle };
    }
  }

  // Whole-word checks: profanity that can legitimately embed in names.
  const words = normalized.split(/[^a-zÀ-ɏ]+/).filter(Boolean);
  for (const word of words) {
    if (WORD_PROFANITY.includes(word)) {
      return { ok: false, value: cleaned, reason: gentle };
    }
  }

  return { ok: true, value: cleaned };
}

/**
 * Resolve the term Asha (and the home greeting) should use, given a stored profile.
 * Priority: explicit addressAs → real name (if the user gave one) → warm default.
 */
export function resolveAddress(addressAs?: string, name?: string): string {
  const a = addressAs?.trim();
  if (a) return a;
  const n = name?.trim();
  if (n && n.toLowerCase() !== 'mama') return n;
  return DEFAULT_ADDRESS;
}
