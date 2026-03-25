import type { CompanionSpecies } from '../types';

export const COMPANION_SPECIES: { id: CompanionSpecies; emoji: string; label: string }[] = [
  { id: 'butterfly', emoji: '🦋', label: 'Butterfly' },
  { id: 'bird', emoji: '🐦', label: 'Bird' },
  { id: 'deer', emoji: '🦌', label: 'Deer' },
  { id: 'fox', emoji: '🦊', label: 'Fox' },
  { id: 'rabbit', emoji: '🐰', label: 'Rabbit' },
];

export const LEVEL_THRESHOLDS = [0, 50, 120, 220, 350, 520, 730, 1000, 1350, 1800];

export const XP_REWARDS = {
  moodLog: 5,
  waterGlass: 2,
  kegelSession: 8,
  journal: 10,
  gratitude: 8,
  sleepLog: 5,
  memory: 3,
  badgeEarned: 25,
  tap: 1,
};

// Evolution titles per level milestone
const EVOLUTION_TITLES: Record<number, Record<CompanionSpecies, string>> = {
  1: { butterfly: 'Little Butterfly', bird: 'Little Bird', deer: 'Little Deer', fox: 'Little Fox', rabbit: 'Little Rabbit' },
  3: { butterfly: 'Chrysalis Friend', bird: 'Songbird Friend', deer: 'Fawn Friend', fox: 'Forest Friend', rabbit: 'Meadow Friend' },
  5: { butterfly: 'Meadow Dancer', bird: 'Sky Dancer', deer: 'Grove Walker', fox: 'Sunset Runner', rabbit: 'Moonlight Hopper' },
  7: { butterfly: 'Golden Wings', bird: 'Stormrider', deer: 'Antler Guardian', fox: 'Ember Heart', rabbit: 'Starlit Runner' },
  10: { butterfly: 'Radiant Butterfly', bird: 'Celestial Bird', deer: 'Ancient Deer', fox: 'Legendary Fox', rabbit: 'Mythic Rabbit' },
};

export function getEvolutionTitle(level: number, species: CompanionSpecies): string {
  const milestones = [10, 7, 5, 3, 1];
  for (const m of milestones) {
    if (level >= m) return EVOLUTION_TITLES[m][species];
  }
  return EVOLUTION_TITLES[1][species];
}

export function getSpeciesEmoji(species: CompanionSpecies): string {
  return COMPANION_SPECIES.find(s => s.id === species)?.emoji || '🦋';
}

export function getLevelFromXP(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getXPProgress(xp: number, level: number): number {
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  if (level >= LEVEL_THRESHOLDS.length) return 1;
  const range = nextThreshold - currentThreshold;
  return range > 0 ? (xp - currentThreshold) / range : 1;
}

interface MessageContext {
  hour: number;
  latestMoodLevel: number | null;
  moodStreak: number;
  wellnessStreak: number;
  companionName: string;
}

const comfortMessages = [
  "I'm right here with you. You're not alone.",
  "It's okay to not be okay. I'm here.",
  "Tough days happen. You're doing better than you think.",
];

const happyMessages = [
  "Your good energy is contagious! Keep shining!",
  "Look at you go! I'm so proud!",
  "What a great day we're having together!",
];

const morningMessages = [
  "Good morning! A new day, a new chance to be gentle with yourself.",
  "Rise and shine, mama. I'm here for whatever today brings.",
];

const afternoonMessages = [
  "Afternoon check-in: have you had water recently?",
  "You're doing amazing. Don't forget to rest when you can.",
];

const eveningMessages = [
  "Winding down? You did great today.",
  "Tonight, let go of anything that weighs on you. You deserve peace.",
];

const nightMessages = [
  "It's late. I'm here if you can't sleep.",
  "Rest when you can, mama. I'll be here in the morning.",
];

export function getCompanionMessage(ctx: MessageContext): string {
  const { hour, latestMoodLevel, moodStreak, wellnessStreak, companionName } = ctx;
  const pick = (arr: string[]) => arr[Math.floor(Date.now() / 60000) % arr.length];

  // Streak celebration
  if (wellnessStreak > 0 && wellnessStreak % 7 === 0) {
    return `${wellnessStreak} days of wellness together! ${companionName} is so proud of you!`;
  }
  if (moodStreak >= 7 && moodStreak % 7 === 0) {
    return `${moodStreak}-day mood streak! You're building such a beautiful habit.`;
  }

  // Mood-based
  if (latestMoodLevel !== null && latestMoodLevel <= 2) return pick(comfortMessages);
  if (latestMoodLevel !== null && latestMoodLevel >= 4) return pick(happyMessages);

  // Time-based
  if (hour >= 6 && hour < 12) return pick(morningMessages);
  if (hour >= 12 && hour < 17) return pick(afternoonMessages);
  if (hour >= 17 && hour < 22) return pick(eveningMessages);
  return pick(nightMessages);
}
