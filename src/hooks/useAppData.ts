import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { usePersistedState } from './usePersistedState';
import { useToast } from './useToast';
import { t } from '../strings';
import { getGeminiResponse, hasApiKey, saveApiKey, getApiKey } from '../services/gemini';
import {
  isNotificationEnabled, requestNotificationPermission,
  disableNotifications, startReminders, clearAllReminders
} from '../services/notifications';
import type {
  MoodEntry, MemoryEntry, UserProfile, SleepEntry, KegelEntry,
  WaterEntry, JournalEntry, GratitudeEntry, BabyMilestone, ChatMessage,
  ChecklistItem, BabysLast
} from '../types';

function getDefaultChecklist(): ChecklistItem[] {
  try {
    const saved = localStorage.getItem('sahej_checklist');
    const savedDate = localStorage.getItem('sahej_checklist_date');
    if (saved && savedDate === new Date().toDateString()) return JSON.parse(saved);
  } catch { /* corrupted data */ }
  return [
    { id: '1', completed: false },
    { id: '2', completed: false },
    { id: '3', completed: false },
    { id: '4', completed: false },
  ];
}

export function useAppData() {
  // Core persisted state
  const [moods, setMoods] = usePersistedState<MoodEntry[]>('sahej_moods', []);
  const [memories, setMemories] = usePersistedState<MemoryEntry[]>('sahej_memories', []);
  const [sleepLog, setSleepLog] = usePersistedState<SleepEntry[]>('sahej_sleep', []);
  const [kegelLog, setKegelLog] = usePersistedState<KegelEntry[]>('sahej_kegel', []);
  const [waterLog, setWaterLog] = usePersistedState<WaterEntry[]>('sahej_water', []);
  const [journalEntries, setJournalEntries] = usePersistedState<JournalEntry[]>('sahej_journal', []);
  const [babyMilestones, setBabyMilestones] = usePersistedState<BabyMilestone[]>('sahej_baby_milestones', []);
  const [gratitudeEntries, setGratitudeEntries] = usePersistedState<GratitudeEntry[]>('sahej_gratitude', []);
  const [chatHistory, setChatHistory] = usePersistedState<ChatMessage[]>('sahej_chat_history', []);
  const [babysLast, setBabysLast] = usePersistedState<BabysLast>('sahej_babys_last', { feed: null, sleep: null, diaper: null });

  // Checklist has special daily-reset logic
  const [checklist, setChecklist] = useState<ChecklistItem[]>(getDefaultChecklist);
  useEffect(() => {
    localStorage.setItem('sahej_checklist', JSON.stringify(checklist));
    localStorage.setItem('sahej_checklist_date', new Date().toDateString());
  }, [checklist]);

  // User profile (special: also set showWelcome)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('sahej_user_profile');
      if (saved) return JSON.parse(saved);
    } catch { /* corrupted data */ }
    return null;
  });
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem('sahej_user_profile'));

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('sahej_dark_mode') === 'true');
  useEffect(() => {
    localStorage.setItem('sahej_dark_mode', String(darkMode));
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Backup tracking
  const [lastExport, setLastExport] = useState(() => localStorage.getItem('sahej_last_export') || '');
  const [backupDismissed, setBackupDismissed] = useState(() => localStorage.getItem('sahej_backup_dismissed') || '');

  // Notifications
  const [notificationsOn, setNotificationsOn] = useState(() => isNotificationEnabled());
  useEffect(() => {
    if (notificationsOn) {
      if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
        setNotificationsOn(false);
        disableNotifications();
        return;
      }
      startReminders();
    }
    return () => clearAllReminders();
  }, [notificationsOn]);

  // Toast
  const { message: toastMessage, showToast } = useToast();

  // Import ref
  const importFileRef = useRef<HTMLInputElement>(null);

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // Load API key on mount
  useEffect(() => {
    setApiKeyInput(getApiKey());
  }, []);

  // Chat state
  const [isTyping, setIsTyping] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [chatError, setChatError] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  // Mood note modal state
  const [moodNoteInput, setMoodNoteInput] = useState('');
  const [showMoodNote, setShowMoodNote] = useState(false);
  const [pendingMoodLevel, setPendingMoodLevel] = useState<number | null>(null);

  // Welcome form state
  const [welcomeName, setWelcomeName] = useState('');
  const [welcomeBabyName, setWelcomeBabyName] = useState('');
  const [welcomeBabyBirth, setWelcomeBabyBirth] = useState('');

  // Local input states
  const [searchQuery, setSearchQuery] = useState('');
  const [memoryInput, setMemoryInput] = useState('');
  const [winInput, setWinInput] = useState('');
  const [journalInput, setJournalInput] = useState('');
  const [milestoneInput, setMilestoneInput] = useState('');
  const [gratitudeInputs, setGratitudeInputs] = useState(['', '', '']);
  const [gratitudeSaved, setGratitudeSaved] = useState(false);
  const [pendingSleepHours, setPendingSleepHours] = useState<number | null>(null);

  // Resource sub-tab
  const [resourceSubTab, setResourceSubTab] = useState<'helplines' | 'growth' | 'tips' | 'resources' | 'partner'>('helplines');
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);
  const [expandedMilestone, setExpandedMilestone] = useState<number | null>(null);
  const [expandedPartnerSection, setExpandedPartnerSection] = useState<string | null>(null);

  // Chat scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  // ---- Derived values ----

  const todayStr = useMemo(() => new Date().toDateString(), []);

  const dayOfYear = useMemo(() => Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)), []);

  const affirmations: string[] = t('affirmations') || [];
  const dailyAffirmation = affirmations[dayOfYear % affirmations.length] || '';

  const circleMessages: string[] = t('circleMessages') || [];
  const circleMessage = circleMessages[dayOfYear % circleMessages.length] || '';

  const wellnessTips: string[] = t('wellnessTips') || [];
  const dailyTip = wellnessTips.length > 0 ? wellnessTips[dayOfYear % wellnessTips.length] : '';

  const chatPrompts: string[] = t('chatSuggestions') || [];

  const journalPrompts: string[] = t('journalPrompts') || [];
  const todayJournalPrompt = journalPrompts.length > 0 ? journalPrompts[dayOfYear % journalPrompts.length] : '';

  const displayName = userProfile?.name || 'Mama';

  const chartData = useMemo(() => [...moods]
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-7)
    .map(m => ({ date: format(m.timestamp, 'MMM d'), level: m.level })), [moods]);

  const weekMoods = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return moods.filter(m => m.timestamp >= weekAgo);
  }, [moods]);

  const avgMood = useMemo(() => weekMoods.length > 0
    ? (weekMoods.reduce((sum, m) => sum + m.level, 0) / weekMoods.length).toFixed(1)
    : null, [weekMoods]);

  const moodTrend = useMemo(() => {
    if (weekMoods.length < 2) return 'stable';
    const sorted = [...weekMoods].sort((a, b) => a.timestamp - b.timestamp);
    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
    const avgFirst = firstHalf.reduce((s, m) => s + m.level, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((s, m) => s + m.level, 0) / secondHalf.length;
    if (avgSecond - avgFirst > 0.3) return 'up';
    if (avgFirst - avgSecond > 0.3) return 'down';
    return 'stable';
  }, [weekMoods]);

  const moodStreak = useMemo(() => {
    if (moods.length === 0) return 0;
    const moodDates = new Set(moods.map(m => new Date(m.timestamp).toDateString()));
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      if (moodDates.has(checkDate.toDateString())) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [moods]);

  const filteredMemories = useMemo(() => memories.filter(m =>
    m.content.toLowerCase().includes(searchQuery.toLowerCase())
  ), [memories, searchQuery]);

  const todayGratitude = useMemo(() => gratitudeEntries.find(e => new Date(e.timestamp).toDateString() === todayStr), [gratitudeEntries, todayStr]);
  const todaySleep = useMemo(() => sleepLog.find(e => new Date(e.timestamp).toDateString() === todayStr), [sleepLog, todayStr]);
  const todayWater = useMemo(() => waterLog.find(e => new Date(e.timestamp).toDateString() === todayStr), [waterLog, todayStr]);
  const todayJournal = useMemo(() => journalEntries.find(e => new Date(e.timestamp).toDateString() === todayStr), [journalEntries, todayStr]);
  const todayKegels = useMemo(() => kegelLog.filter(e => new Date(e.timestamp).toDateString() === todayStr), [kegelLog, todayStr]);

  const avgSleep = useMemo(() => sleepLog.length > 0
    ? (sleepLog.slice(0, 7).reduce((sum, s) => sum + s.hours, 0) / Math.min(sleepLog.length, 7)).toFixed(1)
    : null, [sleepLog]);

  const showBackupReminder = moods.length >= 10
    && (!lastExport || Date.now() - parseInt(lastExport) > 30 * 24 * 60 * 60 * 1000)
    && (!backupDismissed || Date.now() - parseInt(backupDismissed) > 7 * 24 * 60 * 60 * 1000);

  const postpartumInfo = useMemo(() => {
    if (!userProfile?.birthDate) return null;
    const birth = new Date(userProfile.birthDate);
    const now = new Date();
    const diffMs = now.getTime() - birth.getTime();
    if (diffMs < 0) return null;
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(totalDays / 7);
    const months = Math.floor(totalDays / 30.44);
    if (months >= 3) return { text: `${months} ${t('monthsOld')}`, babyName: userProfile.babyName };
    return { text: `${t('week')} ${weeks} ${t('postpartum')}`, babyName: userProfile.babyName };
  }, [userProfile]);

  // ---- Utility functions ----

  const moodLabel = useCallback((level: number) => t(`level${level}`), []);

  const formatTimeAgo = useCallback((timestamp: number | null) => {
    if (!timestamp) return null;
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return t('justNow');
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${t('ago')}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ${t('ago')}`;
    const days = Math.floor(hours / 24);
    return `${days}d ${t('ago')}`;
  }, []);

  // ---- Handler functions ----

  const handleGetStarted = useCallback(() => {
    const profile: UserProfile = { name: welcomeName.trim() || 'Mama' };
    if (welcomeBabyName.trim()) profile.babyName = welcomeBabyName.trim();
    if (welcomeBabyBirth) profile.birthDate = welcomeBabyBirth;
    setUserProfile(profile);
    localStorage.setItem('sahej_user_profile', JSON.stringify(profile));
    setShowWelcome(false);
  }, [welcomeName, welcomeBabyName, welcomeBabyBirth]);

  const handleGuestContinue = useCallback(() => {
    const profile: UserProfile = { name: 'Mama' };
    setUserProfile(profile);
    localStorage.setItem('sahej_user_profile', JSON.stringify(profile));
    setShowWelcome(false);
  }, []);

  const startMoodLog = useCallback((level: number) => {
    setPendingMoodLevel(level);
    setMoodNoteInput('');
    setShowMoodNote(true);
  }, []);

  const confirmMood = useCallback(() => {
    if (pendingMoodLevel === null) return;
    setMoods(prev => [{
      id: Date.now().toString(),
      timestamp: Date.now(),
      level: pendingMoodLevel,
      note: moodNoteInput.trim()
    }, ...prev]);
    setShowMoodNote(false);
    setPendingMoodLevel(null);
    setMoodNoteInput('');
  }, [pendingMoodLevel, moodNoteInput, setMoods]);

  const skipMoodNote = useCallback(() => {
    if (pendingMoodLevel === null) return;
    setMoods(prev => [{
      id: Date.now().toString(),
      timestamp: Date.now(),
      level: pendingMoodLevel,
      note: ''
    }, ...prev]);
    setShowMoodNote(false);
    setPendingMoodLevel(null);
  }, [pendingMoodLevel, setMoods]);

  const addMemory = useCallback((content: string, category: MemoryEntry['category'] = 'other') => {
    if (!content.trim()) return;
    setMemories(prev => [{ id: Date.now().toString(), timestamp: Date.now(), category, content }, ...prev]);
  }, [setMemories]);

  const handleAddMemory = useCallback(() => {
    if (!memoryInput.trim()) return;
    addMemory(memoryInput, 'location');
    setMemoryInput('');
  }, [memoryInput, addMemory]);

  const handleAddWin = useCallback(() => {
    if (!winInput.trim()) return;
    addMemory(`Win: ${winInput}`, 'other');
    setWinInput('');
  }, [winInput, addMemory]);

  const toggleChecklist = useCallback((id: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  }, []);

  const deleteMemory = useCallback((id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id));
  }, [setMemories]);

  const updateBabysLast = useCallback((type: keyof BabysLast) => {
    setBabysLast(prev => ({ ...prev, [type]: Date.now() }));
  }, [setBabysLast]);

  const handleSaveGratitude = useCallback(() => {
    const filledItems = gratitudeInputs.filter(i => i.trim());
    if (filledItems.length === 0) return;
    setGratitudeEntries(prev => [{ id: Date.now().toString(), timestamp: Date.now(), items: filledItems }, ...prev]);
    setGratitudeInputs(['', '', '']);
    setGratitudeSaved(true);
    setTimeout(() => setGratitudeSaved(false), 2000);
  }, [gratitudeInputs, setGratitudeEntries]);

  const handleLogSleep = useCallback((hours: number, quality: number) => {
    setSleepLog(prev => [{ id: Date.now().toString(), timestamp: Date.now(), hours, quality }, ...prev]);
    setPendingSleepHours(null);
  }, [setSleepLog]);

  const addWaterGlass = useCallback(() => {
    if (todayWater) {
      setWaterLog(prev => prev.map(e => e.id === todayWater.id ? { ...e, glasses: e.glasses + 1 } : e));
    } else {
      setWaterLog(prev => [{ id: Date.now().toString(), timestamp: Date.now(), glasses: 1 }, ...prev]);
    }
  }, [todayWater, setWaterLog]);

  const removeWaterGlass = useCallback(() => {
    if (todayWater && todayWater.glasses > 0) {
      setWaterLog(prev => prev.map(e => e.id === todayWater.id ? { ...e, glasses: e.glasses - 1 } : e));
    }
  }, [todayWater, setWaterLog]);

  const handleSaveJournal = useCallback(() => {
    if (!journalInput.trim()) return;
    setJournalEntries(prev => [{ id: Date.now().toString(), timestamp: Date.now(), prompt: todayJournalPrompt, entry: journalInput.trim() }, ...prev]);
    setJournalInput('');
    showToast(t('journalSaved'));
  }, [journalInput, todayJournalPrompt, setJournalEntries, showToast]);

  const handleAddMilestone = useCallback(() => {
    if (!milestoneInput.trim()) return;
    setBabyMilestones(prev => [{ id: Date.now().toString(), timestamp: Date.now(), milestone: milestoneInput.trim() }, ...prev]);
    setMilestoneInput('');
    showToast(t('milestoneSaved'));
  }, [milestoneInput, setBabyMilestones, showToast]);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim()) return;
    setChatError('');
    if (!hasApiKey()) {
      setChatError(t('chatNeedsKey'));
      return;
    }
    const userMsg: ChatMessage = { role: 'user', parts: [{ text: inputMessage }], timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);
    try {
      const apiHistory = [...chatHistory.map(({ role, parts }) => ({ role, parts })), { role: 'user' as const, parts: [{ text: inputMessage }] }];
      const response = await getGeminiResponse(inputMessage, apiHistory);
      if (response) {
        setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: response }], timestamp: Date.now() }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setChatError(t('chatError'));
    } finally {
      setIsTyping(false);
    }
  }, [inputMessage, chatHistory, setChatHistory]);

  const handleSaveApiKey = useCallback(() => {
    saveApiKey(apiKeyInput);
    setShowSettings(false);
  }, [apiKeyInput]);

  const handleToggleNotifications = useCallback(async () => {
    if (notificationsOn) {
      disableNotifications();
      setNotificationsOn(false);
    } else {
      const granted = await requestNotificationPermission();
      setNotificationsOn(granted);
      if (granted) startReminders();
    }
  }, [notificationsOn]);

  const handleExportData = useCallback(() => {
    try {
      // Include gamification data from localStorage
      const gamificationData: Record<string, unknown> = {};
      for (const gKey of ['sahej_earned_badges', 'sahej_active_quest', 'sahej_reset_completions', 'sahej_legacy_letters']) {
        try { const v = localStorage.getItem(gKey); if (v) gamificationData[gKey] = JSON.parse(v); } catch { /* skip */ }
      }
      // Include nutrition & mood insights data from localStorage
      const nutritionData: Record<string, unknown> = {};
      for (const nKey of ['sahej_nutrition_profile', 'sahej_meal_suggestions', 'sahej_mood_insights']) {
        try { const v = localStorage.getItem(nKey); if (v) nutritionData[nKey] = JSON.parse(v); } catch { /* skip */ }
      }
      const data = {
        profile: userProfile,
        moods,
        memories,
        gratitude: gratitudeEntries,
        sleep: sleepLog,
        chatHistory,
        babysLast,
        checklist,
        checklistDate: localStorage.getItem('sahej_checklist_date'),
        kegelLog,
        waterLog,
        journalEntries,
        babyMilestones,
        ...gamificationData,
        ...nutritionData,
        exportDate: new Date().toISOString(),
        app: 'Sakthi v1.3.0'
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sakthi-data-${format(Date.now(), 'yyyy-MM-dd')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      localStorage.setItem('sahej_last_export', String(Date.now()));
      setLastExport(String(Date.now()));
      showToast(t('exportSuccess'));
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [userProfile, moods, memories, gratitudeEntries, sleepLog, chatHistory, babysLast, checklist, kegelLog, waterLog, journalEntries, babyMilestones, showToast]);

  const handleImportData = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm('This will replace all your current data. Are you sure?')) {
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.moods && Array.isArray(data.moods)) setMoods(data.moods);
        if (data.memories && Array.isArray(data.memories)) setMemories(data.memories);
        if (data.gratitude && Array.isArray(data.gratitude)) setGratitudeEntries(data.gratitude);
        if (data.sleep && Array.isArray(data.sleep)) setSleepLog(data.sleep);
        if (data.chatHistory && Array.isArray(data.chatHistory)) setChatHistory(data.chatHistory);
        if (data.babysLast) setBabysLast(data.babysLast);
        if (data.checklist && Array.isArray(data.checklist)) setChecklist(data.checklist);
        if (data.kegelLog && Array.isArray(data.kegelLog)) setKegelLog(data.kegelLog);
        if (data.waterLog && Array.isArray(data.waterLog)) setWaterLog(data.waterLog);
        if (data.journalEntries && Array.isArray(data.journalEntries)) setJournalEntries(data.journalEntries);
        if (data.babyMilestones && Array.isArray(data.babyMilestones)) setBabyMilestones(data.babyMilestones);
        if (data.profile) {
          setUserProfile(data.profile);
          localStorage.setItem('sahej_user_profile', JSON.stringify(data.profile));
        }
        // Restore gamification data
        for (const gKey of ['sahej_earned_badges', 'sahej_active_quest', 'sahej_reset_completions', 'sahej_legacy_letters']) {
          if (data[gKey]) localStorage.setItem(gKey, JSON.stringify(data[gKey]));
        }
        // Restore nutrition & mood insights data
        for (const nKey of ['sahej_nutrition_profile', 'sahej_meal_suggestions', 'sahej_mood_insights']) {
          if (data[nKey]) localStorage.setItem(nKey, JSON.stringify(data[nKey]));
        }
        // Restore checklist date if present
        if (data.checklistDate) localStorage.setItem('sahej_checklist_date', data.checklistDate);
        showToast(t('importSuccess'));
      } catch {
        showToast(t('importError'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [setMoods, setMemories, setGratitudeEntries, setSleepLog, setChatHistory, setBabysLast, setKegelLog, setWaterLog, setJournalEntries, setBabyMilestones, showToast]);

  const handleResetApp = useCallback(() => {
    const keys = [
      'sahej_moods', 'sahej_memories', 'sahej_chat_history', 'sahej_checklist', 'sahej_checklist_date',
      'sahej_babys_last', 'sahej_gratitude', 'sahej_sleep', 'sahej_last_export', 'sahej_last_vitamin_reminder',
      'sahej_dark_mode', 'sahej_notifications_enabled', 'sahej_user_profile', 'sahej_api_key',
      'sahej_backup_dismissed', 'sahej_kegel', 'sahej_water', 'sahej_journal', 'sahej_baby_milestones',
      'sahej_earned_badges', 'sahej_active_quest', 'sahej_reset_completions', 'sahej_legacy_letters',
      'sahej_nutrition_profile', 'sahej_meal_suggestions', 'sahej_mood_insights'
    ];
    keys.forEach(k => localStorage.removeItem(k));
    window.location.reload();
  }, []);

  return {
    // Persisted data + setters
    moods, setMoods,
    memories, setMemories,
    sleepLog, setSleepLog,
    kegelLog, setKegelLog,
    waterLog, setWaterLog,
    journalEntries, setJournalEntries,
    babyMilestones, setBabyMilestones,
    gratitudeEntries, setGratitudeEntries,
    chatHistory, setChatHistory,
    checklist, setChecklist,
    babysLast, setBabysLast,
    userProfile, setUserProfile,
    darkMode, setDarkMode,
    lastExport, setLastExport,
    backupDismissed, setBackupDismissed,

    // UI state
    showWelcome, setShowWelcome,
    showSettings, setShowSettings,
    apiKeyInput, setApiKeyInput,
    showApiKey, setShowApiKey,
    notificationsOn, setNotificationsOn,
    toastMessage, showToast,
    importFileRef,
    isTyping, setIsTyping,
    inputMessage, setInputMessage,
    chatError, setChatError,
    chatEndRef, mainRef,
    showMoodNote, setShowMoodNote,
    pendingMoodLevel, setPendingMoodLevel,
    moodNoteInput, setMoodNoteInput,
    welcomeName, setWelcomeName,
    welcomeBabyName, setWelcomeBabyName,
    welcomeBabyBirth, setWelcomeBabyBirth,
    searchQuery, setSearchQuery,
    memoryInput, setMemoryInput,
    winInput, setWinInput,
    journalInput, setJournalInput,
    milestoneInput, setMilestoneInput,
    gratitudeInputs, setGratitudeInputs,
    gratitudeSaved, setGratitudeSaved,
    pendingSleepHours, setPendingSleepHours,
    resourceSubTab, setResourceSubTab,
    expandedCountry, setExpandedCountry,
    expandedMilestone, setExpandedMilestone,
    expandedPartnerSection, setExpandedPartnerSection,

    // Derived values
    todayStr,
    dayOfYear,
    dailyAffirmation,
    circleMessage,
    dailyTip,
    chatPrompts,
    todayJournalPrompt,
    displayName,
    chartData,
    weekMoods,
    avgMood,
    moodTrend,
    moodStreak,
    filteredMemories,
    todayGratitude,
    todaySleep,
    todayWater,
    todayJournal,
    todayKegels,
    avgSleep,
    showBackupReminder,
    postpartumInfo,

    // Utility functions
    moodLabel,
    formatTimeAgo,

    // Handler functions
    handleGetStarted,
    handleGuestContinue,
    startMoodLog,
    confirmMood,
    skipMoodNote,
    addMemory,
    handleAddMemory,
    handleAddWin,
    toggleChecklist,
    deleteMemory,
    updateBabysLast,
    handleSaveGratitude,
    handleLogSleep,
    addWaterGlass,
    removeWaterGlass,
    handleSaveJournal,
    handleAddMilestone,
    handleSendMessage,
    handleSaveApiKey,
    handleToggleNotifications,
    handleExportData,
    handleImportData,
    handleResetApp,
  };
}
