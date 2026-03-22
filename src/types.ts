export interface MoodEntry {
  id: string;
  timestamp: number;
  level: number; // 1-5
  note: string;
}

export interface MemoryEntry {
  id: string;
  timestamp: number;
  category: 'location' | 'task' | 'milestone' | 'other';
  content: string;
}

export interface UserProfile {
  name: string;
  babyName?: string;
  birthDate?: string;
  avatarColor?: string;
}

export interface SleepEntry {
  id: string;
  timestamp: number;
  hours: number;
  quality: number;
}

export interface KegelEntry {
  id: string;
  timestamp: number;
  reps: number;
}

export interface WaterEntry {
  id: string;
  timestamp: number;
  glasses: number;
}

export interface JournalEntry {
  id: string;
  timestamp: number;
  prompt: string;
  entry: string;
}

export interface GratitudeEntry {
  id: string;
  timestamp: number;
  items: string[];
}

export interface BabyMilestone {
  id: string;
  timestamp: number;
  milestone: string;
}

export interface ChatMessage {
  role: string;
  parts: { text: string }[];
  timestamp: number;
}

export interface ChecklistItem {
  id: string;
  completed: boolean;
}

export interface BabysLast {
  feed: number | null;
  sleep: number | null;
  diaper: number | null;
}

export type Tab = 'home' | 'mood' | 'memory' | 'chat' | 'help';
export type ResourceSubTab = 'helplines' | 'growth' | 'tips' | 'resources' | 'partner';

// Nutrition
export interface NutritionProfile {
  breastfeeding: 'exclusive' | 'partial' | 'none' | null;
  dietType: 'vegetarian' | 'vegan' | 'nonVeg' | 'pescatarian' | null;
  culturalPreference: string;
  allergies: string[];
}

export interface MealSuggestion {
  id: string;
  timestamp: number;
  suggestion: string;
  isFavorite: boolean;
}

// Mood Insights
export interface MoodInsight {
  id: string;
  generatedAt: number;
  summary: string;
  concernLevel: 'normal' | 'watchful' | 'concerning';
  moodDataHash: string;
}
export type ResetActivity = 'grounding' | 'shoulder' | 'handOnHeart' | 'boxBreathing' | 'gratitudeReset' | 'bodyScan' | 'tenBreath' | 'nameFeeling' | 'microStretch' | 'kindSentence' | 'visualization' | 'pmr' | 'lovingKindness' | 'worryBox' | 'selfCompassion' | 'energyBoost' | 'gratitudeLetter' | 'smilePractice' | null;

// Gamification
export type BadgeId =
  | 'firstWeekWarrior' | 'hydrationHero' | 'pelvicFloorPro' | 'mindfulMama'
  | 'memoryKeeper' | 'gratitudeGuardian' | 'sleepScout' | 'journalJourney';

export interface BadgeDefinition {
  id: BadgeId;
  emoji: string;
  label: string;
  description: string;
  threshold: number;
}

export interface EarnedBadge {
  id: BadgeId;
  earnedAt: number;
  seen: boolean;
}

export type QuestId = 'hydrationQuest' | 'mindfulWeek' | 'gratitudeFlow';

export interface ActiveQuest {
  id: QuestId;
  startDate: string;
  completedDays: string[];
}

export interface ResetCompletionEntry {
  id: string;
  timestamp: number;
  activity: string;
}

export interface LegacyLetter {
  id: string;
  timestamp: number;
  prompt: string;
  content: string;
}
