import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { cors, getRedis, rateLimit } from './_shared.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!ai) {
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }
  return ai;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!GEMINI_API_KEY) {
    return res.status(503).json({ error: 'AI not configured.' });
  }

  // Rate limit — use x-real-ip (set by Vercel) to prevent x-forwarded-for spoofing
  const ip = (req.headers['x-real-ip'] as string)
    || (req.headers['x-forwarded-for'] as string)?.split(',')[0]
    || 'unknown';
  const redis = getRedis();
  if (!(await rateLimit(redis, ip, 'gemini', 20))) {
    return res.status(429).json({ error: 'Too many requests. Try again in a minute.' });
  }

  try {
    const { contents, systemInstruction, temperature = 0.7 } = req.body;

    if (!contents || !Array.isArray(contents)) {
      return res.status(400).json({ error: 'Invalid request: contents required' });
    }

    const genai = getAI();
    const response = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
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
    if (msg.includes('API_KEY') || msg.includes('401') || msg.includes('403')) {
      return res.status(401).json({ error: 'Invalid API key configured on server.' });
    }
    return res.status(500).json({ error: 'AI service temporarily unavailable.' });
  }
}
