import { useMemo, useEffect, useCallback } from 'react';
import { usePersistedState } from './usePersistedState';
import { t } from '../strings';
import type {
  MoodEntry, MemoryEntry, WaterEntry, KegelEntry, GratitudeEntry,
  SleepEntry, JournalEntry, BadgeId, BadgeDefinition, EarnedBadge,
  QuestId, ActiveQuest, ResetCompletionEntry, LegacyLetter
} from '../types';

// Badge definitions
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { id: 'firstWeekWarrior', emoji: '🗓️', label: 'badge_firstWeekWarrior', description: 'badge_firstWeekWarrior_desc', threshold: 7 },
  { id: 'hydrationHero', emoji: '💧', label: 'badge_hydrationHero', description: 'badge_hydrationHero_desc', threshold: 5 },
  { id: 'pelvicFloorPro', emoji: '💪', label: 'badge_pelvicFloorPro', description: 'badge_pelvicFloorPro_desc', threshold: 10 },
  { id: 'mindfulMama', emoji: '🧘', label: 'badge_mindfulMama', description: 'badge_mindfulMama_desc', threshold: 10 },
  { id: 'memoryKeeper', emoji: '🧠', label: 'badge_memoryKeeper', description: 'badge_memoryKeeper_desc', threshold: 20 },
  { id: 'gratitudeGuardian', emoji: '🌻', label: 'badge_gratitudeGuardian', description: 'badge_gratitudeGuardian_desc', threshold: 7 },
  { id: 'sleepScout', emoji: '🌙', label: 'badge_sleepScout', description: 'badge_sleepScout_desc', threshold: 14 },
  { id: 'journalJourney', emoji: '📖', label: 'badge_journalJourney', description: 'badge_journalJourney_desc', threshold: 10 },
];

// Quest definitions
export const QUEST_DEFINITIONS: { id: QuestId; label: string; description: string }[] = [
  { id: 'hydrationQuest', label: 'quest_hydrationQuest', description: 'quest_hydrationQuest_desc' },
  { id: 'mindfulWeek', label: 'quest_mindfulWeek', description: 'quest_mindfulWeek_desc' },
  { id: 'gratitudeFlow', label: 'quest_gratitudeFlow', description: 'quest_gratitudeFlow_desc' },
];

function computeStreak(dateStrings: Set<string>): number {
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (dateStrings.has(d.toDateString())) streak++;
    else break;
  }
  return streak;
}

interface UseGamificationArgs {
  moods: MoodEntry[];
  moodStreak: number;
  waterLog: WaterEntry[];
  kegelLog: KegelEntry[];
  memories: MemoryEntry[];
  gratitudeEntries: GratitudeEntry[];
  sleepLog: SleepEntry[];
  journalEntries: JournalEntry[];
  todayWater: WaterEntry | undefined;
  todayStr: string;
  dayOfYear: number;
  showToast: (msg: string) => void;
  addMemory: (content: string, category?: MemoryEntry['category']) => void;
}

export function useGamification(args: UseGamificationArgs) {
  const {
    moods, moodStreak, waterLog, kegelLog, memories,
    gratitudeEntries, sleepLog, journalEntries,
    todayWater, todayStr, dayOfYear, showToast, addMemory
  } = args;

  // Persisted state
  const [earnedBadges, setEarnedBadges] = usePersistedState<EarnedBadge[]>('sahej_earned_badges', []);
  const [activeQuest, setActiveQuest] = usePersistedState<ActiveQuest | null>('sahej_active_quest', null);
  const [resetCompletions, setResetCompletions] = usePersistedState<ResetCompletionEntry[]>('sahej_reset_completions', []);
  const [legacyLetters, setLegacyLetters] = usePersistedState<LegacyLetter[]>('sahej_legacy_letters', []);

  // --- Badge computation ---
  const badgeProgress = useMemo(() => {
    const waterGoalDays = new Set(
      waterLog.filter(w => w.glasses >= 8).map(w => new Date(w.timestamp).toDateString())
    ).size;

    return new Map<BadgeId, number>([
      ['firstWeekWarrior', moodStreak],
      ['hydrationHero', waterGoalDays],
      ['pelvicFloorPro', kegelLog.length],
      ['mindfulMama', resetCompletions.length],
      ['memoryKeeper', memories.length],
      ['gratitudeGuardian', gratitudeEntries.length],
      ['sleepScout', sleepLog.length],
      ['journalJourney', journalEntries.length],
    ]);
  }, [moodStreak, waterLog, kegelLog, resetCompletions, memories, gratitudeEntries, sleepLog, journalEntries]);

  const qualifyingBadges = useMemo(() =>
    BADGE_DEFINITIONS.filter(b => (badgeProgress.get(b.id) || 0) >= b.threshold).map(b => b.id),
    [badgeProgress]
  );

  // Auto-award new badges
  useEffect(() => {
    const earnedIds = new Set(earnedBadges.map(b => b.id));
    const newBadges = qualifyingBadges.filter(id => !earnedIds.has(id));
    if (newBadges.length > 0) {
      const newEntries: EarnedBadge[] = newBadges.map(id => ({
        id, earnedAt: Date.now(), seen: false
      }));
      setEarnedBadges(prev => [...prev, ...newEntries]);
      showToast(t('newBadge'));
    }
  }, [qualifyingBadges, showToast]);

  const markBadgeSeen = useCallback((id: BadgeId) => {
    setEarnedBadges(prev => prev.map(b => b.id === id ? { ...b, seen: true } : b));
  }, [setEarnedBadges]);

  // --- Extended streaks ---
  const wellnessStreak = useMemo(() => {
    const allDates = new Set<string>();
    moods.forEach(m => allDates.add(new Date(m.timestamp).toDateString()));
    waterLog.forEach(w => allDates.add(new Date(w.timestamp).toDateString()));
    sleepLog.forEach(s => allDates.add(new Date(s.timestamp).toDateString()));
    journalEntries.forEach(j => allDates.add(new Date(j.timestamp).toDateString()));
    gratitudeEntries.forEach(g => allDates.add(new Date(g.timestamp).toDateString()));
    kegelLog.forEach(k => allDates.add(new Date(k.timestamp).toDateString()));
    resetCompletions.forEach(r => allDates.add(new Date(r.timestamp).toDateString()));
    return computeStreak(allDates);
  }, [moods, waterLog, sleepLog, journalEntries, gratitudeEntries, kegelLog, resetCompletions]);

  const waterStreak = useMemo(() => {
    const goalDays = new Set(
      waterLog.filter(w => w.glasses >= 8).map(w => new Date(w.timestamp).toDateString())
    );
    return computeStreak(goalDays);
  }, [waterLog]);

  const journalStreak = useMemo(() => {
    const journalDays = new Set(
      journalEntries.map(j => new Date(j.timestamp).toDateString())
    );
    return computeStreak(journalDays);
  }, [journalEntries]);

  // --- Sunshine streak ---
  const sunshineStreak = useMemo(() => {
    if (moods.length < 3) return false;
    const recent = [...moods].sort((a, b) => b.timestamp - a.timestamp).slice(0, 4);
    if (recent.length < 3) return false;
    // Check if last 3 entries are non-decreasing (most recent first, so reverse)
    const levels = recent.slice(0, 3).reverse().map(m => m.level);
    return levels[1] >= levels[0] && levels[2] >= levels[1] && levels[2] >= 3;
  }, [moods]);

  // --- Quest management ---
  const questDayIndex = useMemo(() => {
    if (!activeQuest) return 0;
    const start = new Date(activeQuest.startDate);
    const now = new Date(todayStr);
    return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, [activeQuest, todayStr]);

  const questCompleted = useMemo(() =>
    activeQuest ? activeQuest.completedDays.length >= 7 : false,
    [activeQuest]
  );

  const todayQuestMet = useMemo(() => {
    if (!activeQuest) return false;
    if (activeQuest.completedDays.includes(todayStr)) return true;
    switch (activeQuest.id) {
      case 'hydrationQuest': return (todayWater?.glasses || 0) >= 8;
      case 'mindfulWeek': return resetCompletions.some(r => new Date(r.timestamp).toDateString() === todayStr);
      case 'gratitudeFlow': return gratitudeEntries.some(g => new Date(g.timestamp).toDateString() === todayStr);
      default: return false;
    }
  }, [activeQuest, todayStr, todayWater, resetCompletions, gratitudeEntries]);

  // Auto-update quest progress
  useEffect(() => {
    if (!activeQuest || questDayIndex > 7) return;
    if (todayQuestMet && !activeQuest.completedDays.includes(todayStr)) {
      setActiveQuest(prev => prev ? {
        ...prev,
        completedDays: [...prev.completedDays, todayStr]
      } : null);
    }
  }, [todayQuestMet, todayStr, activeQuest]);

  const startQuest = useCallback((id: QuestId) => {
    setActiveQuest({ id, startDate: todayStr, completedDays: [] });
  }, [todayStr, setActiveQuest]);

  const abandonQuest = useCallback(() => {
    setActiveQuest(null);
  }, [setActiveQuest]);

  // --- Reset completion tracking ---
  const logResetCompletion = useCallback((activity: string) => {
    setResetCompletions(prev => [
      { id: Date.now().toString(), timestamp: Date.now(), activity },
      ...prev
    ]);
  }, [setResetCompletions]);

  // --- Legacy letters ---
  const legacyLetterPrompts: string[] = t('legacyLetterPrompts') || [];
  const todayLetterPrompt = legacyLetterPrompts.length > 0
    ? legacyLetterPrompts[dayOfYear % legacyLetterPrompts.length] : '';

  const todayLetter = useMemo(() =>
    legacyLetters.find(l => new Date(l.timestamp).toDateString() === todayStr),
    [legacyLetters, todayStr]
  );

  const saveLegacyLetter = useCallback((content: string) => {
    if (!content.trim()) return;
    setLegacyLetters(prev => [{
      id: Date.now().toString(),
      timestamp: Date.now(),
      prompt: todayLetterPrompt,
      content: content.trim()
    }, ...prev]);
    addMemory(`💌 ${content.trim()}`, 'other');
    showToast(t('legacyLetterSaved'));
  }, [todayLetterPrompt, setLegacyLetters, addMemory, showToast]);

  return {
    // Badges
    earnedBadges, badgeProgress, markBadgeSeen,
    // Streaks
    wellnessStreak, waterStreak, journalStreak, sunshineStreak,
    // Quests
    activeQuest, startQuest, abandonQuest, questDayIndex, questCompleted, todayQuestMet,
    // Reset tracking
    resetCompletions, logResetCompletion,
    // Legacy letters
    legacyLetters, todayLetterPrompt, todayLetter, saveLegacyLetter,
  };
}
