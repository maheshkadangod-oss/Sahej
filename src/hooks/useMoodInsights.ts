import { useState, useMemo, useCallback } from 'react';
import { usePersistedState } from './usePersistedState';
import { hasApiKey } from '../services/gemini';
import { GoogleGenAI } from '@google/genai';
import type { MoodEntry, MoodInsight } from '../types';

interface UseMoodInsightsInput {
  moods: MoodEntry[];
  todayStr: string;
  showToast: (msg: string) => void;
}

export function useMoodInsights({ moods, todayStr, showToast }: UseMoodInsightsInput) {
  const [insight, setInsight] = usePersistedState<MoodInsight | null>('sahej_mood_insights', null);
  const [isLoading, setIsLoading] = useState(false);

  const hasEnoughData = moods.length >= 7;

  const moodDataHash = useMemo(() => {
    return moods.slice(0, 14).map(m => m.id).join(',');
  }, [moods]);

  const needsRefresh = useMemo(() => {
    if (!insight) return true;
    if (new Date(insight.generatedAt).toDateString() !== todayStr) return true;
    if (insight.moodDataHash !== moodDataHash) return true;
    return false;
  }, [insight, todayStr, moodDataHash]);

  const lowMoodAlert = useMemo(() => {
    if (moods.length < 3) return false;
    return moods.slice(0, 3).every(m => m.level <= 2);
  }, [moods]);

  const generateInsights = useCallback(async () => {
    if (!hasApiKey() || !hasEnoughData || isLoading) return;

    setIsLoading(true);
    try {
      const apiKey = localStorage.getItem('sahej_api_key')!;
      const ai = new GoogleGenAI({ apiKey });

      const recentMoods = moods.slice(0, 14);
      const moodData = recentMoods
        .map(m => {
          const date = new Date(m.timestamp).toLocaleDateString();
          const labels = ['', 'Very Low', 'Low', 'Neutral', 'Good', 'Great'];
          return `${date} — ${labels[m.level]} (${m.level}/5)${m.note ? ` — "${m.note}"` : ''}`;
        })
        .join('\n');

      const prompt = `Analyze these mood entries from a postpartum mother and provide gentle, supportive insights.

Mood data (most recent first):
${moodData}

Respond in this exact JSON format only, no other text:
{"summary": "2-3 sentences of warm, supportive insight about patterns you notice. End with something encouraging.", "concernLevel": "normal"}

Guidelines:
- Be warm and non-clinical. Speak as a caring friend.
- If mood is consistently low (level 1-2 for 3+ days), set concernLevel to "concerning"
- If there's a downward trend, set to "watchful"
- Otherwise set to "normal"
- Never diagnose. If concerning, gently suggest talking to a professional.
- Always end with something encouraging.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { temperature: 0.6 },
      });

      const text = response.text || '';
      let summary = text;
      let concernLevel: MoodInsight['concernLevel'] = 'normal';

      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          summary = parsed.summary || text;
          if (['normal', 'watchful', 'concerning'].includes(parsed.concernLevel)) {
            concernLevel = parsed.concernLevel;
          }
        }
      } catch {
        // Use raw text as fallback
      }

      setInsight({
        id: Date.now().toString(),
        generatedAt: Date.now(),
        summary,
        concernLevel,
        moodDataHash,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      if (msg.includes('401') || msg.includes('API_KEY')) {
        showToast('Invalid API key. Check Settings.');
      } else if (msg.includes('429')) {
        showToast('Too many requests. Try again in a minute.');
      } else {
        showToast('Could not generate insights. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [hasEnoughData, isLoading, moods, moodDataHash, setInsight, showToast]);

  const chatContextMessage = useMemo(() => {
    if (!hasEnoughData) return '';
    const recent = moods.slice(0, 7);
    const labels = ['', 'Very Low', 'Low', 'Neutral', 'Good', 'Great'];
    const summary = recent.map(m => labels[m.level]).join(', ');
    return `Based on my recent mood patterns (${summary}), I'd like to talk about how I've been feeling. Can you help me understand what I might be going through and suggest ways to feel better?`;
  }, [moods, hasEnoughData]);

  return {
    insight,
    isLoading,
    hasEnoughData,
    needsRefresh,
    lowMoodAlert,
    generateInsights,
    chatContextMessage,
    hasApiKey: hasApiKey(),
  };
}
