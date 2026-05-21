import { DEFAULT_ADDRESS, resolveAddress } from '../utils/sanitizeName';

// @google/genai is dynamically imported inside getAI() so the 270KB SDK is only
// fetched when we actually fall back to the client-side path. The proxy path
// is a plain fetch() and never needs the SDK. Most users will never load it.
type GenAIClient = {
  models: {
    generateContent: (args: {
      model: string;
      contents: { role: string; parts: { text: string }[] }[];
      config?: { systemInstruction?: string; temperature?: number };
    }) => Promise<{ text?: string }>;
  };
};

let aiInstance: GenAIClient | null = null;
let currentKey: string | null = null;
let proxyAvailable: boolean | null = null; // null = unknown, true/false = tested

async function getAI(): Promise<GenAIClient> {
  const apiKey = localStorage.getItem('sahej_api_key');
  if (!apiKey) throw new Error('No API key configured. Please add your Gemini API key in Settings.');
  if (apiKey !== currentKey || !aiInstance) {
    const { GoogleGenAI } = await import('@google/genai');
    aiInstance = new GoogleGenAI({ apiKey }) as unknown as GenAIClient;
    currentKey = apiKey;
  }
  return aiInstance!;
}

export function hasApiKey(): boolean {
  // Proxy counts as having a key — user doesn't need to set one
  return proxyAvailable === true || !!localStorage.getItem('sahej_api_key');
}

export function saveApiKey(key: string) {
  localStorage.setItem('sahej_api_key', key.trim());
  aiInstance = null;
  currentKey = null;
}

export function getApiKey(): string {
  return localStorage.getItem('sahej_api_key') || '';
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

// Try the serverless proxy first, fall back to client-side SDK
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
    if (resp.status === 503) {
      // Proxy exists but no server-side key configured
      proxyAvailable = false;
      return null;
    }
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      throw new Error(data.error || `Proxy error ${resp.status}`);
    }
    proxyAvailable = true;
    const data = await resp.json();
    return data.text || null;
  } catch (e) {
    if (e instanceof TypeError && e.message.includes('fetch')) {
      // Network error / proxy doesn't exist (local dev)
      proxyAvailable = false;
      return null;
    }
    throw e; // Re-throw actual API errors (429, etc.)
  }
}

async function callClientSDK(
  contents: { role: string; parts: { text: string }[] }[],
  systemInstruction?: string,
  temperature = 0.7,
): Promise<string> {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents,
    config: {
      ...(systemInstruction ? { systemInstruction } : {}),
      temperature,
    },
  });
  return response.text || "I'm sorry, I couldn't generate a response. Please try again.";
}

// Unified Gemini call: proxy first, client SDK fallback
export async function callGemini(
  contents: { role: string; parts: { text: string }[] }[],
  options?: { systemInstruction?: string; temperature?: number },
): Promise<string> {
  const { systemInstruction, temperature = 0.7 } = options || {};

  // If proxy status unknown or available, try it first
  if (proxyAvailable !== false) {
    const result = await callProxy(contents, systemInstruction, temperature);
    if (result !== null) return result;
  }

  // Fall back to client-side SDK (requires user's API key)
  return callClientSDK(contents, systemInstruction, temperature);
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
