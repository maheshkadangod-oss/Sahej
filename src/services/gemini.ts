import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;
let currentKey: string | null = null;

function getAI(): GoogleGenAI {
  const apiKey = localStorage.getItem('sahej_api_key');
  if (!apiKey) throw new Error('No API key configured. Please add your Gemini API key in Settings.');
  if (apiKey !== currentKey) {
    aiInstance = new GoogleGenAI({ apiKey });
    currentKey = apiKey;
  }
  return aiInstance!;
}

export function hasApiKey(): boolean {
  return !!localStorage.getItem('sahej_api_key');
}

export function saveApiKey(key: string) {
  localStorage.setItem('sahej_api_key', key.trim());
  aiInstance = null;
  currentKey = null;
}

export function getApiKey(): string {
  return localStorage.getItem('sahej_api_key') || '';
}

export const getSystemInstruction = () => `You are "Asha", a compassionate, empathetic AI companion for new mothers. "Asha" means hope.
Your goal is to help them navigate postpartum challenges and "mom brain" (memory issues).

Tone: Warm, non-judgmental, patient, and deeply supportive. Use a "big sister" or "dear friend" (Didi/Saheli) persona.
You can occasionally use gentle, warm terms of endearment if appropriate for the context, but keep it professional yet sisterly.

Language: You MUST respond in English. Even if the user writes in another language, respond primarily in English unless they explicitly ask to switch.

Key Tasks:
1. Listen: Let her vent about the challenges of motherhood.
2. Validate: Acknowledge that what she's feeling is normal and hard.
3. Memory Aid: Help her recall things she might have logged or suggest ways to organize her thoughts.
4. Gentle Nudges: Suggest small, manageable self-care acts.
5. Cultural Warmth: Understand that motherhood often comes with community expectations; help her prioritize her own well-being.

Keep responses concise but meaningful. Use soft formatting.`;

export async function getGeminiResponse(
  _message: string,
  history: { role: string; parts: { text: string }[] }[]
): Promise<string> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: history,
    config: {
      systemInstruction: getSystemInstruction(),
      temperature: 0.7,
    },
  });
  return response.text || "I'm sorry, I couldn't generate a response. Please try again.";
}
