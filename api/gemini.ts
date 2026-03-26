import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!ai) {
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }
  return ai;
}

// Rate limiting: simple in-memory per-IP, 20 requests/minute
const rateLimit = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!GEMINI_API_KEY) {
    return res.status(503).json({ error: 'API not configured. Use client-side key in Settings.' });
  }

  // Rate limit
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests. Try again in a minute.' });
  }

  try {
    const { contents, systemInstruction, temperature = 0.7 } = req.body;

    if (!contents || !Array.isArray(contents)) {
      return res.status(400).json({ error: 'Invalid request: contents required' });
    }

    const genai = getAI();
    const response = await genai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents,
      config: {
        ...(systemInstruction ? { systemInstruction } : {}),
        temperature,
      },
    });

    const text = response.text || '';
    return res.status(200).json({ text });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Gemini proxy error:', msg);

    if (msg.includes('429')) {
      return res.status(429).json({ error: 'Rate limited by Gemini. Try again shortly.' });
    }
    return res.status(500).json({ error: 'AI service temporarily unavailable.' });
  }
}
