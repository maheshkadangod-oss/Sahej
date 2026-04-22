// Crisis keyword detection
// Conservative high-precision list — we'd rather miss some than false-alarm.
// These phrases indicate an immediate safety concern and short-circuit the AI
// to deliver a specific, human-reviewed supportive message.
//
// IMPORTANT: This is not a diagnostic tool. It's a safety net.
// The response is always "I hear you" — never minimizing, never lecturing,
// never prescribing.

export type CrisisSeverity = 'crisis' | 'watchful' | null;

interface CrisisMatch {
  severity: CrisisSeverity;
  matchedPhrase: string;
}

// High-confidence crisis phrases — trigger emergency surface
const CRISIS_PHRASES: string[] = [
  'hurt myself',
  'hurt my baby',
  'harm myself',
  'harm my baby',
  'harming myself',
  'harming my baby',
  'kill myself',
  'kill my baby',
  'killing myself',
  'end it all',
  'end my life',
  'want to die',
  'wanna die',
  'suicide',
  'suicidal',
  "don't want to live",
  'dont want to live',
  "don't want to be here",
  'dont want to be here',
  "can't go on",
  'cant go on',
  'better off without me',
  'better off dead',
  'everyone would be better off',
  "i want to disappear",
  'shake my baby',
  'shake the baby',
  'drop my baby',
  'drown my baby',
];

// Lower-confidence phrases — acknowledge distress gently but don't crisis-route
const WATCHFUL_PHRASES: string[] = [
  'hate my baby',
  'hate being a mom',
  'regret having',
  "can't do this anymore",
  'cant do this anymore',
  "i'm broken",
  'im broken',
  'no one cares',
  'nobody cares',
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ').trim();
}

export function detectCrisis(message: string): CrisisMatch {
  if (!message) return { severity: null, matchedPhrase: '' };
  const norm = normalize(message);

  for (const phrase of CRISIS_PHRASES) {
    if (norm.includes(phrase)) {
      return { severity: 'crisis', matchedPhrase: phrase };
    }
  }
  for (const phrase of WATCHFUL_PHRASES) {
    if (norm.includes(phrase)) {
      return { severity: 'watchful', matchedPhrase: phrase };
    }
  }

  return { severity: null, matchedPhrase: '' };
}

// Canned response for crisis — never AI-generated, always human-reviewed.
// The tone: short, present, non-judgmental, action-oriented.
export const CRISIS_RESPONSE = `I hear you. What you're feeling is real, and you don't have to carry it alone right now.

Please reach out to someone who can stay with you through this moment — a crisis helpline, your partner, a trusted person, or your doctor.

The helplines below are free and confidential. They will not judge you. They will not take your baby. They are trained to listen.

You matter. Your baby needs you here. Help is one tap away.`;

export const WATCHFUL_RESPONSE = `That sounds really heavy. What you're feeling is valid — you're not broken for feeling this way.

If this is getting harder to carry, the helplines below are free and safe to call. No one will judge you.

Do you want to tell me more about what's happening? I'm here.`;

// Fire-and-forget anonymous log of crisis event (for founders to see aggregate frequency).
// No user content, no identifiers — just a timestamped count.
export async function logCrisisEvent(severity: 'crisis' | 'watchful'): Promise<void> {
  try {
    await fetch('/api/crisis-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ severity }),
    });
  } catch {
    // Silently fail — logging is best-effort
  }
}
