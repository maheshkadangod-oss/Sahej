import { useState, useMemo, useCallback } from 'react';
import { usePersistedState } from './usePersistedState';
import { hasApiKey, callGemini } from '../services/gemini';
import { nutritionTips } from '../data/nutritionTips';
import type { NutritionProfile, MealSuggestion } from '../types';

const defaultProfile: NutritionProfile = {
  breastfeeding: null,
  dietType: null,
  culturalPreference: '',
  allergies: [],
};

interface UseNutritionInput {
  dayOfYear: number;
  showToast: (msg: string) => void;
}

export function useNutrition({ dayOfYear, showToast }: UseNutritionInput) {
  const [profile, setProfile] = usePersistedState<NutritionProfile>('sahej_nutrition_profile', defaultProfile);
  const [suggestions, setSuggestions] = usePersistedState<MealSuggestion[]>('sahej_meal_suggestions', []);
  const [isLoading, setIsLoading] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);

  const profileComplete = profile.breastfeeding !== null && profile.dietType !== null;

  const dailyTip = nutritionTips[dayOfYear % nutritionTips.length];

  const latestSuggestion = suggestions.length > 0 ? suggestions[0] : null;

  const favoriteMeals = useMemo(() => suggestions.filter(s => s.isFavorite), [suggestions]);

  const saveProfile = useCallback((updated: NutritionProfile) => {
    setProfile(updated);
    setShowProfileForm(false);
    showToast('Profile saved!');
  }, [setProfile, showToast]);

  const fetchMealSuggestion = useCallback(async () => {
    if (!hasApiKey() || !profileComplete || isLoading) return;

    setIsLoading(true);
    try {
      const dietLabels: Record<string, string> = {
        vegetarian: 'Vegetarian', vegan: 'Vegan',
        nonVeg: 'Non-Vegetarian', pescatarian: 'Pescatarian',
      };
      const bfLabels: Record<string, string> = {
        exclusive: 'Exclusively breastfeeding', partial: 'Partially breastfeeding',
        none: 'Not breastfeeding',
      };

      const prompt = `You are a nutrition advisor for postpartum mothers. Generate ONE meal suggestion.

Mother's profile:
- Breastfeeding: ${bfLabels[profile.breastfeeding!] || 'Unknown'}
- Diet: ${dietLabels[profile.dietType!] || 'Flexible'}
- Food culture/preference: ${profile.culturalPreference || 'Any'}
- Allergies to avoid: ${profile.allergies.length > 0 ? profile.allergies.join(', ') : 'None'}

Requirements:
- Include: meal name as a heading, brief ingredient list, simple instructions (3-4 steps), and 1-2 nutritional benefits for postpartum recovery
- Keep it concise (under 200 words)
- Use markdown formatting
- Make it practical and easy to prepare with one hand if needed
- Vary suggestions — not always the same type of meal`;

      const text = await callGemini(
        [{ role: 'user', parts: [{ text: prompt }] }],
        { temperature: 0.9 },
      );

      const newSuggestion: MealSuggestion = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        suggestion: text,
        isFavorite: false,
      };

      setSuggestions(prev => [newSuggestion, ...prev.slice(0, 19)]);
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      if (msg.includes('401') || msg.includes('API_KEY')) {
        showToast('Invalid API key. Check Settings.');
      } else if (msg.includes('429')) {
        showToast('Too many requests. Try again in a minute.');
      } else {
        showToast('Could not get meal suggestion. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [profileComplete, isLoading, profile, setSuggestions, showToast]);

  const toggleFavorite = useCallback((id: string) => {
    setSuggestions(prev => prev.map(s => {
      if (s.id === id) {
        const next = { ...s, isFavorite: !s.isFavorite };
        showToast(next.isFavorite ? 'Saved to favorites!' : 'Removed from favorites');
        return next;
      }
      return s;
    }));
  }, [setSuggestions, showToast]);

  return {
    profile,
    profileComplete,
    showProfileForm,
    setShowProfileForm,
    saveProfile,
    dailyTip,
    latestSuggestion,
    favoriteMeals,
    isLoading,
    fetchMealSuggestion,
    toggleFavorite,
    hasApiKey: hasApiKey(),
  };
}
