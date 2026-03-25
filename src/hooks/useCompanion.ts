import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { usePersistedState } from './usePersistedState';
import { getLevelFromXP, getXPProgress, getEvolutionTitle, getSpeciesEmoji, getCompanionMessage, XP_REWARDS } from '../data/companionMessages';
import { t } from '../strings';
import type { CompanionState, CompanionSpecies, TrustedContact, MoodEntry, WaterEntry, KegelEntry, JournalEntry, GratitudeEntry, SleepEntry, MemoryEntry, EarnedBadge } from '../types';

interface XPSnapshot {
  moods: number;
  water: number;
  kegel: number;
  journal: number;
  gratitude: number;
  sleep: number;
  memories: number;
  badges: number;
}

interface UseCompanionArgs {
  moods: MoodEntry[];
  waterLog: WaterEntry[];
  kegelLog: KegelEntry[];
  journalEntries: JournalEntry[];
  gratitudeEntries: GratitudeEntry[];
  sleepLog: SleepEntry[];
  memories: MemoryEntry[];
  earnedBadges: EarnedBadge[];
  wellnessStreak: number;
  moodStreak: number;
  todayStr: string;
  showToast: (msg: string) => void;
}

const emptySnapshot: XPSnapshot = { moods: 0, water: 0, kegel: 0, journal: 0, gratitude: 0, sleep: 0, memories: 0, badges: 0 };

export function useCompanion(args: UseCompanionArgs) {
  const { moods, waterLog, kegelLog, journalEntries, gratitudeEntries, sleepLog, memories, earnedBadges, wellnessStreak, moodStreak, showToast } = args;

  const [companion, setCompanion] = usePersistedState<CompanionState | null>('sahej_companion', null);
  const [xpSnap, setXpSnap] = usePersistedState<XPSnapshot>('sahej_companion_xp_snap', emptySnapshot);
  const [trustedContacts, setTrustedContacts] = usePersistedState<TrustedContact[]>('sahej_trusted_contacts', []);
  const [isEditing, setIsEditing] = useState(false);

  const prevLevelRef = useRef(companion?.level || 1);

  // Current data counts
  const currentCounts = useMemo<XPSnapshot>(() => ({
    moods: moods.length,
    water: waterLog.reduce((sum, w) => sum + w.glasses, 0),
    kegel: kegelLog.length,
    journal: journalEntries.length,
    gratitude: gratitudeEntries.length,
    sleep: sleepLog.length,
    memories: memories.length,
    badges: earnedBadges.length,
  }), [moods.length, waterLog, kegelLog.length, journalEntries.length, gratitudeEntries.length, sleepLog.length, memories.length, earnedBadges.length]);

  // XP calculation via snapshot diffs
  useEffect(() => {
    if (!companion?.setupComplete) return;

    let xpGained = 0;
    const deltas = {
      moods: currentCounts.moods - xpSnap.moods,
      water: currentCounts.water - xpSnap.water,
      kegel: currentCounts.kegel - xpSnap.kegel,
      journal: currentCounts.journal - xpSnap.journal,
      gratitude: currentCounts.gratitude - xpSnap.gratitude,
      sleep: currentCounts.sleep - xpSnap.sleep,
      memories: currentCounts.memories - xpSnap.memories,
      badges: currentCounts.badges - xpSnap.badges,
    };

    if (deltas.moods > 0) xpGained += deltas.moods * XP_REWARDS.moodLog;
    if (deltas.water > 0) xpGained += deltas.water * XP_REWARDS.waterGlass;
    if (deltas.kegel > 0) xpGained += deltas.kegel * XP_REWARDS.kegelSession;
    if (deltas.journal > 0) xpGained += deltas.journal * XP_REWARDS.journal;
    if (deltas.gratitude > 0) xpGained += deltas.gratitude * XP_REWARDS.gratitude;
    if (deltas.sleep > 0) xpGained += deltas.sleep * XP_REWARDS.sleepLog;
    if (deltas.memories > 0) xpGained += deltas.memories * XP_REWARDS.memory;
    if (deltas.badges > 0) xpGained += deltas.badges * XP_REWARDS.badgeEarned;

    if (xpGained > 0) {
      setCompanion(prev => {
        if (!prev) return prev;
        const newXp = prev.xp + xpGained;
        const newLevel = getLevelFromXP(newXp);
        return { ...prev, xp: newXp, level: newLevel };
      });
      setXpSnap(currentCounts);
    }
  }, [currentCounts, companion?.setupComplete]);

  // Level-up toast
  useEffect(() => {
    if (!companion) return;
    if (companion.level > prevLevelRef.current) {
      showToast(`${t('companionLevelUp')} ✨`);
    }
    prevLevelRef.current = companion.level;
  }, [companion?.level, showToast]);

  // Derived values
  const currentLevel = companion?.level || 1;
  const xpProgress = companion ? getXPProgress(companion.xp, currentLevel) : 0;
  const currentEmoji = companion ? getSpeciesEmoji(companion.species) : '🦋';
  const currentTitle = companion ? getEvolutionTitle(currentLevel, companion.species) : '';

  const companionMood = useMemo<'concern' | 'neutral' | 'happy'>(() => {
    const latest = moods[0]?.level;
    if (!latest) return 'neutral';
    if (latest <= 2) return 'concern';
    if (latest >= 4) return 'happy';
    return 'neutral';
  }, [moods]);

  const lowMoodStreak = useMemo(() => {
    if (moods.length < 3) return false;
    return moods.slice(0, 3).every(m => m.level <= 2);
  }, [moods]);

  const currentMessage = useMemo(() => {
    if (!companion) return '';
    return getCompanionMessage({
      hour: new Date().getHours(),
      latestMoodLevel: moods[0]?.level ?? null,
      moodStreak,
      wellnessStreak,
      companionName: companion.name,
    });
  }, [companion, moods, moodStreak, wellnessStreak]);

  // Handlers
  const setupCompanion = useCallback((species: CompanionSpecies, name: string) => {
    setCompanion({
      species,
      name: name.trim() || 'Buddy',
      xp: 0,
      level: 1,
      lastInteraction: Date.now(),
      tapCount: 0,
      setupComplete: true,
    });
    // Initialize snapshot with current counts so no retroactive XP
    setXpSnap(currentCounts);
  }, [setCompanion, setXpSnap, currentCounts]);

  const tapCompanion = useCallback(() => {
    setCompanion(prev => {
      if (!prev) return prev;
      const newXp = prev.xp + XP_REWARDS.tap;
      return {
        ...prev,
        xp: newXp,
        level: getLevelFromXP(newXp),
        lastInteraction: Date.now(),
        tapCount: prev.tapCount + 1,
      };
    });
  }, [setCompanion]);

  const updateCompanionName = useCallback((name: string) => {
    setCompanion(prev => prev ? { ...prev, name: name.trim() || prev.name } : prev);
  }, [setCompanion]);

  const changeSpecies = useCallback((species: CompanionSpecies) => {
    setCompanion(prev => prev ? { ...prev, species } : prev);
  }, [setCompanion]);

  // Trusted contacts
  const addTrustedContact = useCallback((name: string, phone: string) => {
    if (trustedContacts.length >= 3) return;
    setTrustedContacts(prev => [...prev, { id: Date.now().toString(), name: name.trim(), phone: phone.trim() }]);
  }, [trustedContacts.length, setTrustedContacts]);

  const removeTrustedContact = useCallback((id: string) => {
    setTrustedContacts(prev => prev.filter(c => c.id !== id));
  }, [setTrustedContacts]);

  return {
    companion,
    companionMood,
    lowMoodStreak,
    currentMessage,
    currentEmoji,
    currentTitle,
    currentLevel,
    xpProgress,
    isEditing,
    setIsEditing,
    setupCompanion,
    tapCompanion,
    updateCompanionName,
    changeSpecies,
    trustedContacts,
    addTrustedContact,
    removeTrustedContact,
  };
}
