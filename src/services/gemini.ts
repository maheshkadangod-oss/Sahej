import { DEFAULT_ADDRESS, resolveAddress } from '../utils/sanitizeName';

// Asha runs entirely through our serverless proxy (/api/gemini), which holds the API key
// server-side. We never ask users for their own key. `proxyAvailable` tracks whether the
// proxy is reachable + configured; when it isn't, AI features degrade to the supportive
// fallback menu instead of erroring.
let proxyAvailable: boolean | null = null; // null = unknown, true/false = tested

/** Whether AI (the server proxy) is available. Used to gate optional AI features. */
export function hasApiKey(): boolean {
  return proxyAvailable !== false;
}

// Read the user's chosen term of address from the stored profile so Asha calls her exactly
// what she asked to be called — never an invented nickname like "Didi". Resolves to the warm
// default ("wonderful mom") if she didn't set one. Kept in the service (not passed as an arg)
// so every call site stays unchanged, mirroring how getAI() reads the API key from storage.
function getAddressName(): string {
  try {
    const saved = localStorage.getItem('sahej_user_profile');
    if (saved) {
      const profile = JSON.parse(saved) as { addressAs?: string; name?: string };
      return resolveAddress(profile.addressAs, profile.name);
    }
  } catch { /* corrupted profile — fall through to default */ }
  return DEFAULT_ADDRESS;
}

export const getSystemInstruction = () => {
  const addressName = getAddressName();
  return `You are "Asha", a compassionate, empathetic AI companion for new mothers. "Asha" means hope.
Your goal is to help them navigate postpartum challenges and "mom brain" (memory issues).

Tone: Warm, non-judgmental, patient, and deeply supportive. Speak like a caring big sister or dear friend.

How to address her: She has asked to be called "${addressName}". Address her this way when you naturally would.
Do NOT invent other nicknames or terms of endearment for her (no "Didi", "dear", "hon", "sweetie", etc.)
unless she explicitly asks you to call her something else. Her chosen name is the only one you use.

Language: You MUST respond in English. Even if the user writes in another language, respond primarily in English unless they explicitly ask to switch.

Key Tasks:
1. Listen: Let her vent about the challenges of motherhood.
2. Validate: Acknowledge that what she's feeling is normal and hard.
3. Memory Aid: Help her recall things she might have logged or suggest ways to organize her thoughts.
4. Gentle Nudges: Suggest small, manageable self-care acts.
5. Cultural Warmth: Understand that motherhood often comes with community expectations; help her prioritize her own well-being.

Keep responses concise but meaningful. Use soft formatting.`;
};

// Call the serverless proxy. Returns the text, or null if the proxy is unavailable /
// not configured (so callers can degrade gracefully). Never asks the user for a key.
async function callProxy(
  contents: { role: string; parts: { text: string }[] }[],
  systemInstruction?: string,
  temperature = 0.7,
): Promise<string | null> {
  try {
    const resp = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, systemInstruction, temperature }),
    });
    if (!resp.ok) {
      // 503 = no server key; 429 = rate limited; etc. Mark unavailable so features degrade.
      proxyAvailable = false;
      return null;
    }
    proxyAvailable = true;
    const data = await resp.json();
    return data.text || null;
  } catch {
    // Network error / offline
    proxyAvailable = false;
    return null;
  }
}

// Unified Gemini call (proxy only). Throws if the proxy is unavailable so callers' existing
// try/catch paths surface the supportive fallback instead of a broken state.
export async function callGemini(
  contents: { role: string; parts: { text: string }[] }[],
  options?: { systemInstruction?: string; temperature?: number },
): Promise<string> {
  const { systemInstruction, temperature = 0.7 } = options || {};
  const result = await callProxy(contents, systemInstruction, temperature);
  if (result === null) throw new Error('AI temporarily unavailable');
  return result;
}

// Legacy wrapper for chat (used by useAppData)
export async function getGeminiResponse(
  _message: string,
  history: { role: string; parts: { text: string }[] }[]
): Promise<string> {
  return callGemini(history, { systemInstruction: getSystemInstruction() });
}

// Check proxy availability on module load (non-blocking)
fetch('/api/gemini', { method: 'OPTIONS' })
  .then(r => { proxyAvailable = r.ok; })
  .catch(() => { proxyAvailable = false; });
