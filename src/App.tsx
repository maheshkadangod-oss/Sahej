import React, { useState, useEffect, useRef } from 'react';
import {
  Heart, Brain, MessageCircle, Plus, Calendar, Search,
  Settings, Sparkles, Droplets, Moon, Coffee, Trash2, Send,
  Check, X, Key, AlertCircle, Shield, Sun, Bell, BellOff,
  Download, Phone, ExternalLink, ChevronDown, ChevronUp, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Markdown from 'react-markdown';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { getGeminiResponse, hasApiKey, saveApiKey, getApiKey } from './services/gemini';
import {
  isNotificationSupported, isNotificationEnabled,
  requestNotificationPermission, disableNotifications, startReminders
} from './services/notifications';
import { helplineData } from './data/helplines';
import { milestones, parentingTips, resourceLinks } from './data/resources';
import { MoodEntry, MemoryEntry, UserProfile } from './types';
import { translations, languages, Language } from './translations';
import { Analytics } from '@vercel/analytics/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'home' | 'mood' | 'memory' | 'chat' | 'help';
type ResourceSubTab = 'helplines' | 'growth' | 'tips' | 'resources';

export default function App() {
  // Core state
  const [language, setLanguage] = useState<Language>(() =>
    (localStorage.getItem('sahej_language') as Language) || 'en'
  );
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'in' | 'hold' | 'out'>('in');

  // Data state
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [memoryInput, setMemoryInput] = useState('');
  const [winInput, setWinInput] = useState('');
  const [checklist, setChecklist] = useState<{ id: string; completed: boolean }[]>(() => {
    const saved = localStorage.getItem('sahej_checklist');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', completed: false },
      { id: '2', completed: false },
      { id: '3', completed: false },
      { id: '4', completed: false },
    ];
  });
  const [babysLast, setBabysLast] = useState<{ feed: number | null; sleep: number | null; diaper: number | null }>(() => {
    const saved = localStorage.getItem('sahej_babys_last');
    if (saved) return JSON.parse(saved);
    return { feed: null, sleep: null, diaper: null };
  });

  // Chat state
  const [chatHistory, setChatHistory] = useState<{ role: string; parts: { text: string }[]; timestamp: number }[]>(() => {
    const saved = localStorage.getItem('sahej_chat_history');
    if (saved) return JSON.parse(saved);
    return [];
  });
  const [isTyping, setIsTyping] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [chatError, setChatError] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('sahej_dark_mode') === 'true');

  // Notifications
  const [notificationsOn, setNotificationsOn] = useState(() => isNotificationEnabled());

  // Welcome / Login
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('sahej_user_profile');
    if (saved) return JSON.parse(saved);
    return null;
  });
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem('sahej_user_profile'));
  const [welcomeName, setWelcomeName] = useState('');
  const [welcomeBabyName, setWelcomeBabyName] = useState('');

  // Mood note input
  const [moodNoteInput, setMoodNoteInput] = useState('');
  const [showMoodNote, setShowMoodNote] = useState(false);
  const [pendingMoodLevel, setPendingMoodLevel] = useState<number | null>(null);

  // Resource sub-tab
  const [resourceSubTab, setResourceSubTab] = useState<ResourceSubTab>('helplines');
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);
  const [expandedMilestone, setExpandedMilestone] = useState<number | null>(null);

  // Load persisted data
  useEffect(() => {
    const savedMoods = localStorage.getItem('sahej_moods');
    const savedMemories = localStorage.getItem('sahej_memories');
    if (savedMoods) setMoods(JSON.parse(savedMoods));
    if (savedMemories) setMemories(JSON.parse(savedMemories));
    setApiKeyInput(getApiKey());
  }, []);

  // Persist state
  useEffect(() => { localStorage.setItem('sahej_language', language); }, [language]);
  useEffect(() => { localStorage.setItem('sahej_moods', JSON.stringify(moods)); }, [moods]);
  useEffect(() => { localStorage.setItem('sahej_memories', JSON.stringify(memories)); }, [memories]);
  useEffect(() => { localStorage.setItem('sahej_checklist', JSON.stringify(checklist)); }, [checklist]);
  useEffect(() => { localStorage.setItem('sahej_babys_last', JSON.stringify(babysLast)); }, [babysLast]);
  useEffect(() => { localStorage.setItem('sahej_chat_history', JSON.stringify(chatHistory)); }, [chatHistory]);

  // Dark mode effect
  useEffect(() => {
    localStorage.setItem('sahej_dark_mode', String(darkMode));
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // RTL effect
  useEffect(() => {
    const langConfig = languages.find(l => l.code === language);
    document.documentElement.dir = langConfig?.rtl ? 'rtl' : 'ltr';
  }, [language]);

  // Notifications effect
  useEffect(() => {
    if (notificationsOn) startReminders();
  }, [notificationsOn]);

  // Chat scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  // Tab change scroll
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Breathing exercise
  useEffect(() => {
    if (!isBreathing) { setBreathPhase('in'); return; }
    const phases: Array<'in' | 'hold' | 'out'> = ['in', 'hold', 'out'];
    let idx = 0;
    setBreathPhase('in');
    const interval = setInterval(() => {
      idx = (idx + 1) % 3;
      setBreathPhase(phases[idx]);
    }, 4000);
    return () => clearInterval(interval);
  }, [isBreathing]);

  const t = (key: string) => translations[language]?.[key] || translations['en'][key] || key;

  // Welcome / Login handlers
  const handleGetStarted = () => {
    const profile: UserProfile = { name: welcomeName.trim() || 'Mama' };
    if (welcomeBabyName.trim()) profile.babyName = welcomeBabyName.trim();
    setUserProfile(profile);
    localStorage.setItem('sahej_user_profile', JSON.stringify(profile));
    setShowWelcome(false);
  };

  const handleGuestContinue = () => {
    const profile: UserProfile = { name: 'Mama' };
    setUserProfile(profile);
    localStorage.setItem('sahej_user_profile', JSON.stringify(profile));
    setShowWelcome(false);
  };

  // Mood with note
  const startMoodLog = (level: number) => {
    setPendingMoodLevel(level);
    setMoodNoteInput('');
    setShowMoodNote(true);
  };

  const confirmMood = () => {
    if (pendingMoodLevel === null) return;
    setMoods([{
      id: Date.now().toString(),
      timestamp: Date.now(),
      level: pendingMoodLevel,
      note: moodNoteInput.trim()
    }, ...moods]);
    setShowMoodNote(false);
    setPendingMoodLevel(null);
    setMoodNoteInput('');
  };

  const skipMoodNote = () => {
    if (pendingMoodLevel === null) return;
    setMoods([{
      id: Date.now().toString(),
      timestamp: Date.now(),
      level: pendingMoodLevel,
      note: ''
    }, ...moods]);
    setShowMoodNote(false);
    setPendingMoodLevel(null);
  };

  // Memory helpers
  const addMemory = (content: string, category: MemoryEntry['category'] = 'other') => {
    if (!content.trim()) return;
    setMemories([{ id: Date.now().toString(), timestamp: Date.now(), category, content }, ...memories]);
  };

  const handleAddMemory = () => {
    if (!memoryInput.trim()) return;
    addMemory(memoryInput, 'location');
    setMemoryInput('');
  };

  const handleAddWin = () => {
    if (!winInput.trim()) return;
    addMemory(`Win: ${winInput}`, 'other');
    setWinInput('');
  };

  const toggleChecklist = (id: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const deleteMemory = (id: string) => {
    setMemories(memories.filter(m => m.id !== id));
  };

  const filteredMemories = memories.filter(m =>
    m.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Data
  const affirmations: string[] = t('affirmations') || [];
  const dailyAffirmation = affirmations[new Date().getDate() % affirmations.length] || '';

  const chartData = [...moods]
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-7)
    .map(m => ({ date: format(m.timestamp, 'MMM d'), level: m.level }));

  // Weekly mood summary
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekMoods = moods.filter(m => m.timestamp >= weekAgo);
  const avgMood = weekMoods.length > 0
    ? (weekMoods.reduce((sum, m) => sum + m.level, 0) / weekMoods.length).toFixed(1)
    : null;
  const getMoodTrend = () => {
    if (weekMoods.length < 2) return 'stable';
    const sorted = [...weekMoods].sort((a, b) => a.timestamp - b.timestamp);
    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
    const avgFirst = firstHalf.reduce((s, m) => s + m.level, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((s, m) => s + m.level, 0) / secondHalf.length;
    if (avgSecond - avgFirst > 0.3) return 'up';
    if (avgFirst - avgSecond > 0.3) return 'down';
    return 'stable';
  };

  const formatTimeAgo = (timestamp: number | null) => {
    if (!timestamp) return '--';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return t('justNow');
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${t('ago')}`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${t('ago')}`;
  };

  const updateBabysLast = (type: keyof typeof babysLast) => {
    setBabysLast(prev => ({ ...prev, [type]: Date.now() }));
  };

  const circleMessages: string[] = t('circleMessages') || [];
  const circleMessage = circleMessages[new Date().getDate() % circleMessages.length] || '';

  const moodLabel = (level: number) => t(`level${level}`);

  // Chat
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    setChatError('');
    if (!hasApiKey()) {
      setChatError(t('chatNeedsKey'));
      return;
    }
    const userMsg = { role: 'user', parts: [{ text: inputMessage }], timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);
    const langName = languages.find(l => l.code === language)?.name || "English";
    try {
      const apiHistory = chatHistory.map(({ role, parts }) => ({ role, parts }));
      const response = await getGeminiResponse(inputMessage, apiHistory, langName);
      if (response) {
        setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: response }], timestamp: Date.now() }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setChatError(t('chatError'));
    } finally {
      setIsTyping(false);
    }
  };

  const handleSaveApiKey = () => {
    saveApiKey(apiKeyInput);
    setShowSettings(false);
  };

  // Notifications toggle
  const handleToggleNotifications = async () => {
    if (notificationsOn) {
      disableNotifications();
      setNotificationsOn(false);
    } else {
      const granted = await requestNotificationPermission();
      setNotificationsOn(granted);
      if (granted) startReminders();
    }
  };

  // Data export
  const handleExportData = () => {
    const data = {
      profile: userProfile,
      moods,
      memories,
      exportDate: new Date().toISOString(),
      app: 'Sahej v1.0.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sahej-data-${format(Date.now(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chatPrompts: string[] = t('chatSuggestions') || [];

  const breathLabel = breathPhase === 'in' ? t('breatheIn') : breathPhase === 'hold' ? t('hold') : t('breatheOut');

  const displayName = userProfile?.name || 'Mama';

  // Welcome screen
  if (showWelcome) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center max-w-md mx-auto bg-brand-cream px-8 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-72 h-72 bg-brand-rose/15 rounded-full blur-3xl pointer-events-none ambient-blob-1" />
        <div className="absolute bottom-[-5%] left-[-5%] w-56 h-56 bg-brand-sage/10 rounded-full blur-3xl pointer-events-none ambient-blob-2" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center z-10 w-full"
        >
          <div className="w-20 h-20 bg-brand-rose/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-brand-rose" />
          </div>

          <p className="text-brand-sage text-sm mb-1">{t('welcomeTo')}</p>
          <h1 className="text-4xl font-serif font-semibold text-brand-ink mb-2">{t('appName')}</h1>
          <p className="text-brand-sage text-sm italic mb-10">{t('loginDesc')}</p>

          <div className="space-y-4 mb-8">
            <input
              type="text"
              placeholder={t('yourName')}
              value={welcomeName}
              onChange={(e) => setWelcomeName(e.target.value)}
              enterKeyHint="next"
              className="w-full bg-white/60 border border-brand-clay/20 rounded-2xl py-3.5 px-5 focus:outline-none focus:ring-2 focus:ring-brand-clay/30 text-sm text-center"
            />
            <input
              type="text"
              placeholder={t('babyName')}
              value={welcomeBabyName}
              onChange={(e) => setWelcomeBabyName(e.target.value)}
              enterKeyHint="done"
              onKeyDown={(e) => { if (e.key === 'Enter') handleGetStarted(); }}
              className="w-full bg-white/60 border border-brand-clay/20 rounded-2xl py-3.5 px-5 focus:outline-none focus:ring-2 focus:ring-brand-clay/30 text-sm text-center"
            />
          </div>

          <button
            onClick={handleGetStarted}
            className="w-full py-4 bg-brand-clay text-white rounded-2xl text-sm font-medium hover:bg-brand-clay/90 active:bg-brand-clay/80 transition-all press-effect min-h-[52px] mb-4"
          >
            {t('getStarted')}
          </button>

          <button
            onClick={handleGuestContinue}
            className="text-brand-sage text-xs underline underline-offset-4 hover:text-brand-ink transition-colors min-h-[44px] px-4"
          >
            {t('continueAsGuest')}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col max-w-md mx-auto bg-brand-cream relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-72 h-72 bg-brand-rose/15 rounded-full blur-3xl pointer-events-none ambient-blob-1" />
      <div className="absolute bottom-[-5%] left-[-5%] w-56 h-56 bg-brand-sage/10 rounded-full blur-3xl pointer-events-none ambient-blob-2" />
      <div className="absolute top-[40%] left-[50%] w-40 h-40 bg-brand-gold/8 rounded-full blur-3xl pointer-events-none ambient-blob-1" />

      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex justify-between items-start z-10 safe-top">
        <div>
          <h1 className="text-3xl font-semibold text-brand-ink">{t('appName')}</h1>
          <p className="text-brand-sage text-sm italic">{t('tagline')}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-white/40 border border-brand-clay/20 rounded-lg px-2 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-brand-clay/30"
          >
            {languages.map(l => (
              <option key={l.code} value={l.code}>{l.native}</option>
            ))}
          </select>
          <button
            onClick={() => { setApiKeyInput(getApiKey()); setShowSettings(true); }}
            className="p-2.5 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={t('settings')}
          >
            <Settings className="w-5 h-5 text-brand-ink/60" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main ref={mainRef} className="flex-1 overflow-y-auto px-6 pb-28 z-10 custom-scrollbar">
        <AnimatePresence mode="wait">
          {/* HOME TAB */}
          {activeTab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <section className="px-1">
                <div className="bg-brand-rose/10 border border-brand-rose/20 rounded-2xl p-4 italic text-brand-ink/80 text-sm text-center">
                  "{dailyAffirmation}"
                </div>
              </section>

              {/* Baby's Last */}
              <section className="space-y-3">
                <h3 className="text-lg font-medium px-1">{t('babysLast')}</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'feed', label: t('lastFeed'), icon: Coffee },
                    { id: 'sleep', label: t('lastSleep'), icon: Moon },
                    { id: 'diaper', label: t('lastDiaper'), icon: Droplets }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => updateBabysLast(item.id as any)}
                      className="glass-card rounded-2xl p-3 flex flex-col items-center gap-2 hover:bg-white/60 active:bg-white/80 transition-all press-effect min-h-[88px]"
                    >
                      <item.icon className="w-4 h-4 text-brand-clay" />
                      <span className="text-[10px] font-medium text-brand-sage uppercase tracking-wider text-center">{item.label}</span>
                      <span className="text-xs font-semibold">{formatTimeAgo(babysLast[item.id as keyof typeof babysLast])}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* How are you */}
              <section className="glass-card rounded-3xl p-6 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-brand-clay" />
                  <h2 className="text-xl font-medium">{t('howAreYou')}</h2>
                </div>
                <div className="flex justify-between items-center gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => startMoodLog(level)}
                      className="flex-1 aspect-square rounded-2xl flex items-center justify-center text-2xl hover:bg-brand-clay/10 active:bg-brand-clay/20 transition-colors border border-brand-clay/10 press-effect min-w-[44px] min-h-[44px]"
                    >
                      {level === 1 ? '😔' : level === 2 ? '😕' : level === 3 ? '😐' : level === 4 ? '🙂' : '✨'}
                    </button>
                  ))}
                </div>
                <p className="text-center text-xs text-brand-sage mt-4 italic">{t('logHeart')}</p>
              </section>

              {/* Self-care checklist */}
              <section>
                <h3 className="text-lg font-medium mb-3 px-1">{t('selfCare')}</h3>
                <div className="glass-card rounded-2xl p-4 space-y-1">
                  {checklist.map(item => {
                    const checklistItems = t('checklist');
                    const itemText = Array.isArray(checklistItems) ? checklistItems.find((i: any) => i.id === item.id)?.text : '';
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleChecklist(item.id)}
                        className="flex items-center gap-3 w-full text-left py-2.5 px-1 rounded-xl hover:bg-white/40 active:bg-white/60 transition-colors min-h-[44px]"
                      >
                        <div className={cn(
                          "w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0",
                          item.completed ? "bg-brand-sage border-brand-sage text-white" : "border-brand-sage/30"
                        )}>
                          {item.completed && <Check className="w-3 h-3" />}
                        </div>
                        <span className={cn("text-sm", item.completed && "line-through text-brand-sage/60")}>
                          {itemText}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Quick links */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab('memory')}
                  className="glass-card rounded-2xl p-4 flex flex-col items-start gap-3 hover:bg-white/80 active:bg-white/90 transition-all press-effect min-h-[120px]"
                >
                  <div className="p-2 bg-brand-sage/10 rounded-lg text-brand-sage">
                    <Brain className="w-5 h-5" />
                  </div>
                  <span className="font-medium">{t('memoryVault')}</span>
                  <span className="text-xs text-brand-sage">{t('vaultDesc')}</span>
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className="glass-card rounded-2xl p-4 flex flex-col items-start gap-3 hover:bg-white/80 active:bg-white/90 transition-all press-effect min-h-[120px]"
                >
                  <div className="p-2 bg-brand-rose/10 rounded-lg text-brand-rose">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <span className="font-medium">{t('ashaChat')}</span>
                  <span className="text-xs text-brand-sage">{t('ashaDesc')}</span>
                </button>
              </div>

              {/* Breathing exercise */}
              <section className="glass-card rounded-3xl p-6 overflow-hidden relative">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium">{t('breatheWithAsha')}</h3>
                    <p className="text-xs text-brand-sage italic">{t('breatheDesc')}</p>
                  </div>
                  <button
                    onClick={() => setIsBreathing(!isBreathing)}
                    className={cn(
                      "px-4 py-2.5 rounded-full text-xs font-medium transition-all min-h-[44px] press-effect",
                      isBreathing ? "bg-brand-sage text-white" : "bg-brand-sage/10 text-brand-sage"
                    )}
                  >
                    {isBreathing ? t('stop') : t('start')}
                  </button>
                </div>
                <div className="flex flex-col items-center py-8 gap-4">
                  <motion.div
                    animate={isBreathing ? {
                      scale: breathPhase === 'in' ? [1, 1.5] : breathPhase === 'hold' ? 1.5 : [1.5, 1],
                      opacity: breathPhase === 'in' ? [0.3, 0.6] : breathPhase === 'hold' ? 0.6 : [0.6, 0.3]
                    } : { scale: 1, opacity: 0.3 }}
                    transition={{ duration: 4, ease: "easeInOut" }}
                    className={cn("w-24 h-24 bg-brand-rose rounded-full flex items-center justify-center", isBreathing && "breathe-active")}
                  >
                    <span className="text-white text-xs font-medium text-center px-2">
                      {isBreathing ? breathLabel : t('peace')}
                    </span>
                  </motion.div>
                </div>
              </section>

              {/* Circle of Hope */}
              <section className="bg-brand-clay/5 border border-brand-clay/10 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Heart className="w-12 h-12 text-brand-clay" />
                </div>
                <h3 className="text-sm font-semibold text-brand-clay uppercase tracking-widest mb-2">{t('circleOfHope')}</h3>
                <p className="text-brand-ink/80 italic text-sm leading-relaxed">"{circleMessage}"</p>
                <div className="mt-4 flex -space-x-2">
                  {['bg-brand-rose/30', 'bg-brand-sage/30', 'bg-brand-clay/30', 'bg-brand-lavender/30'].map((bg, i) => (
                    <div key={i} className={cn("w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-brand-ink/40", bg)}>
                      {['A', 'S', 'M', 'R'][i]}
                    </div>
                  ))}
                  <div className="w-7 h-7 rounded-full border-2 border-white bg-brand-gold/20 flex items-center justify-center text-[8px] font-bold text-brand-clay">
                    +12k
                  </div>
                </div>
              </section>

              {/* Reminders */}
              <section>
                <h3 className="text-lg font-medium mb-3 px-1">{t('reminders')}</h3>
                <div className="space-y-3">
                  {[
                    { icon: Droplets, text: t('water'), color: "text-blue-400" },
                    { icon: Moon, text: t('rest'), color: "text-indigo-400" },
                    { icon: Coffee, text: t('tea'), color: "text-amber-600" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-white/40 rounded-2xl border border-white/20 min-h-[52px]">
                      <item.icon className={cn("w-5 h-5 shrink-0", item.color)} />
                      <span className="text-sm font-medium">{item.text}</span>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {/* MOOD TAB */}
          {activeTab === 'mood' && (
            <motion.div key="mood" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <h2 className="text-2xl font-medium">{t('moodJourney')}</h2>

              {/* Weekly Summary */}
              {weekMoods.length > 0 && (
                <div className="glass-card rounded-2xl p-4">
                  <h3 className="text-sm font-medium text-brand-sage mb-3">{t('weeklyMoodSummary')}</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-serif font-semibold text-brand-clay">{avgMood}</div>
                      <div className="text-[10px] text-brand-sage uppercase">{t('avgMood')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-serif font-semibold text-brand-ink">{weekMoods.length}</div>
                      <div className="text-[10px] text-brand-sage uppercase">{t('totalEntries')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-serif font-semibold">
                        {getMoodTrend() === 'up' ? '📈' : getMoodTrend() === 'down' ? '📉' : '📊'}
                      </div>
                      <div className="text-[10px] text-brand-sage uppercase">
                        {getMoodTrend() === 'up' ? t('trendUp') : getMoodTrend() === 'down' ? t('trendDown') : t('trendStable')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Chart */}
              {moods.length > 1 && (
                <div className="glass-card rounded-3xl p-4 h-64">
                  <h3 className="text-sm font-medium mb-4 text-brand-sage">{t('fluctuations')}</h3>
                  <ResponsiveContainer width="100%" height="80%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#333' : '#E5E7EB'} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#7D8C7C' }} dy={10} />
                      <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#7D8C7C' }} />
                      <Tooltip contentStyle={{ backgroundColor: darkMode ? '#2D312E' : '#FDF8F4', borderRadius: '12px', border: '1px solid #C8956C', fontSize: '12px', color: darkMode ? '#E8E5E0' : '#2D312E' }} />
                      <Line type="monotone" dataKey="level" stroke="#C8956C" strokeWidth={3} dot={{ r: 4, fill: '#C8956C', strokeWidth: 2, stroke: darkMode ? '#2D312E' : '#FDF8F4' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Mood entries */}
              <div className="space-y-4">
                {moods.length === 0 ? (
                  <div className="text-center py-12 text-brand-sage italic">{t('noMoods')}</div>
                ) : (
                  moods.map((entry) => (
                    <div key={entry.id} className="glass-card rounded-2xl p-4 flex items-start gap-4">
                      <div className="text-3xl shrink-0">
                        {entry.level === 1 ? '😔' : entry.level === 2 ? '😕' : entry.level === 3 ? '😐' : entry.level === 4 ? '🙂' : '✨'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-brand-sage">{format(entry.timestamp, 'MMM d, h:mm a')}</div>
                        <div className="font-medium">{moodLabel(entry.level)}</div>
                        {entry.note && (
                          <p className="text-xs text-brand-ink/70 mt-1 italic">"{entry.note}"</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* MEMORY/VAULT TAB */}
          {activeTab === 'memory' && (
            <motion.div key="memory" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-medium">{t('memoryVault')}</h2>
                <div className="p-2 bg-brand-sage/10 rounded-full text-brand-sage">
                  <Brain className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t('searchMemories')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    enterKeyHint="search"
                    className="w-full bg-white/60 border border-brand-clay/10 rounded-2xl py-3 px-10 focus:outline-none focus:ring-2 focus:ring-brand-clay/30 text-sm"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-sage w-4 h-4" />
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t('putWhere')}
                    value={memoryInput}
                    onChange={(e) => setMemoryInput(e.target.value)}
                    enterKeyHint="done"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddMemory(); }}
                    className="flex-1 bg-white/60 border border-brand-clay/20 rounded-2xl py-3.5 px-5 focus:outline-none focus:ring-2 focus:ring-brand-clay/30 text-sm"
                  />
                  <button
                    onClick={handleAddMemory}
                    disabled={!memoryInput.trim()}
                    className="px-4 py-3.5 bg-brand-clay text-white rounded-2xl text-sm font-medium disabled:opacity-40 transition-all press-effect min-w-[60px] min-h-[44px]"
                  >
                    {t('addMemory')}
                  </button>
                </div>

                <div className="glass-card rounded-2xl p-4">
                  <h3 className="text-sm font-medium mb-3">{t('momWin')}</h3>
                  <div className="flex gap-2 items-end">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder={t('winPlaceholder')}
                        value={winInput}
                        onChange={(e) => setWinInput(e.target.value)}
                        enterKeyHint="done"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddWin(); }}
                        className="w-full bg-transparent border-b border-brand-clay/20 py-2 pr-6 focus:outline-none focus:border-brand-clay text-sm"
                      />
                      <Sparkles className="absolute right-0 top-1/2 -translate-y-1/2 text-brand-clay/40 w-4 h-4" />
                    </div>
                    <button
                      onClick={handleAddWin}
                      disabled={!winInput.trim()}
                      className="p-2.5 bg-brand-gold/20 text-brand-clay rounded-full disabled:opacity-40 transition-all press-effect min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {filteredMemories.length === 0 ? (
                  <div className="text-center py-12 text-brand-sage italic">
                    {searchQuery ? t('noMatches') : t('noMemories')}
                  </div>
                ) : (
                  filteredMemories.map((m) => (
                    <div key={m.id} className="glass-card rounded-2xl p-4 flex items-start gap-3">
                      <div className="p-2 bg-brand-clay/10 rounded-lg text-brand-clay shrink-0">
                        {m.category === 'location' ? <Search className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm break-words">{m.content}</p>
                        <span className="text-[10px] text-brand-sage">{format(m.timestamp, 'MMM d')}</span>
                      </div>
                      <button
                        onClick={() => deleteMemory(m.id)}
                        className="p-2 text-red-300 hover:text-red-500 active:text-red-600 transition-all opacity-60 hover:opacity-100 min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0"
                        aria-label="Delete memory"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* CHAT TAB */}
          {activeTab === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col" style={{ height: 'calc(100dvh - 180px)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-rose/20 rounded-full flex items-center justify-center text-brand-rose">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium">{t('ashaDidi')}</h2>
                    <p className="text-[10px] text-brand-sage">{t('ashaSaheli')}</p>
                  </div>
                </div>
                {chatHistory.length > 0 && (
                  <button
                    onClick={() => { setChatHistory([]); setChatError(''); }}
                    className="text-[10px] text-brand-sage/60 hover:text-brand-sage active:text-brand-ink px-3 py-1.5 rounded-full border border-brand-sage/20 min-h-[36px]"
                  >
                    {t('clearChat')}
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                {chatHistory.length === 0 && (
                  <div className="space-y-6">
                    <div className="text-center py-6 text-brand-sage italic text-sm">
                      "{t('ashaGreeting')}"
                    </div>
                    {!hasApiKey() && (
                      <div className="flex items-start gap-3 p-4 bg-brand-gold/10 border border-brand-gold/20 rounded-2xl">
                        <Key className="w-5 h-5 text-brand-clay shrink-0 mt-0.5" />
                        <p className="text-xs text-brand-ink/70">{t('chatNeedsKey')}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 gap-2">
                      {chatPrompts.map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => setInputMessage(prompt)}
                          className="text-left p-3.5 rounded-2xl bg-white/40 border border-brand-rose/10 text-xs hover:bg-brand-rose/5 active:bg-brand-rose/10 transition-colors min-h-[44px]"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={cn("flex flex-col gap-1 mb-2", msg.role === 'user' ? "items-end" : "items-start")}>
                    <div className={cn(
                      "max-w-[85%] p-4 rounded-3xl text-sm transition-all shadow-sm",
                      msg.role === 'user'
                        ? "bg-brand-clay text-white rounded-tr-none"
                        : "bg-white border border-brand-rose/10 text-brand-ink rounded-tl-none"
                    )}>
                      <div className="markdown-body">
                        <Markdown>{msg.parts[0].text}</Markdown>
                      </div>
                    </div>
                    <span className="text-[9px] text-brand-sage/60 px-2">
                      {format(msg.timestamp, 'h:mm a')}
                    </span>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex flex-col items-start gap-1">
                    <div className="bg-white border border-brand-rose/10 p-4 rounded-3xl rounded-tl-none w-16 flex gap-1 items-center justify-center shadow-sm">
                      <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity }} className="w-1.5 h-1.5 bg-brand-rose/40 rounded-full" />
                      <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-brand-rose/40 rounded-full" />
                      <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 bg-brand-rose/40 rounded-full" />
                    </div>
                  </div>
                )}
                {chatError && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-2xl">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600">{chatError}</p>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="mt-4 relative">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  enterKeyHint="send"
                  placeholder={t('typeHeart')}
                  className="w-full bg-white/80 border border-brand-rose/20 rounded-full py-4 px-6 pr-14 focus:outline-none focus:ring-2 focus:ring-brand-rose/30"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-brand-rose text-white rounded-full disabled:opacity-50 transition-all press-effect min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* HELP / RESOURCES TAB */}
          {activeTab === 'help' && (
            <motion.div key="help" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <h2 className="text-2xl font-medium">{t('help')}</h2>

              {/* Sub-tab pills */}
              <div className="pill-nav">
                {([
                  { id: 'helplines' as ResourceSubTab, label: t('helplines') },
                  { id: 'growth' as ResourceSubTab, label: t('babyGrowth') },
                  { id: 'tips' as ResourceSubTab, label: t('tips') },
                  { id: 'resources' as ResourceSubTab, label: t('resources') },
                ] as const).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setResourceSubTab(tab.id)}
                    className={cn("pill-btn", resourceSubTab === tab.id ? "pill-btn-active" : "pill-btn-inactive")}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Helplines */}
              {resourceSubTab === 'helplines' && (
                <div className="space-y-4">
                  <div className="bg-brand-rose/10 border border-brand-rose/20 rounded-2xl p-4 text-center">
                    <Shield className="w-6 h-6 text-brand-rose mx-auto mb-2" />
                    <p className="text-sm font-medium">{t('emergencyHelp')}</p>
                    <p className="text-xs text-brand-sage italic mt-1">{t('emergencyDesc')}</p>
                  </div>
                  {helplineData.map((country) => (
                    <div key={country.code} className="glass-card rounded-2xl overflow-hidden">
                      <button
                        onClick={() => setExpandedCountry(expandedCountry === country.code ? null : country.code)}
                        className="w-full flex items-center justify-between p-4 min-h-[52px]"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{country.flag}</span>
                          <span className="text-sm font-medium">{country.country}</span>
                          <span className="text-[10px] text-brand-sage bg-brand-sage/10 px-2 py-0.5 rounded-full">
                            {country.helplines.length}
                          </span>
                        </div>
                        {expandedCountry === country.code
                          ? <ChevronUp className="w-4 h-4 text-brand-sage" />
                          : <ChevronDown className="w-4 h-4 text-brand-sage" />}
                      </button>
                      <AnimatePresence>
                        {expandedCountry === country.code && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 space-y-3">
                              {country.helplines.map((h, idx) => (
                                <div key={idx} className="bg-white/40 rounded-xl p-3">
                                  <div className="font-medium text-sm">{h.name}</div>
                                  <p className="text-[11px] text-brand-sage mt-0.5">{h.description}</p>
                                  <p className="text-[10px] text-brand-sage/70 mt-0.5">{h.available}</p>
                                  <div className="flex gap-2 mt-2">
                                    {h.type !== 'text' && (
                                      <a
                                        href={`tel:${h.number.replace(/\s/g, '')}`}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-brand-sage/10 text-brand-sage rounded-full text-xs font-medium min-h-[36px] press-effect"
                                      >
                                        <Phone className="w-3 h-3" />
                                        {t('callNow')}
                                      </a>
                                    )}
                                    <span className="text-xs text-brand-ink/60 self-center">{h.number}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}

              {/* Baby Growth Milestones */}
              {resourceSubTab === 'growth' && (
                <div className="space-y-3">
                  <p className="text-sm text-brand-sage italic px-1">{t('milestones')}</p>
                  {milestones.map((ms) => (
                    <div key={ms.month} className="glass-card rounded-2xl overflow-hidden">
                      <button
                        onClick={() => setExpandedMilestone(expandedMilestone === ms.month ? null : ms.month)}
                        className="w-full flex items-center justify-between p-4 min-h-[52px]"
                      >
                        <span className="text-sm font-medium">{ms.title}</span>
                        {expandedMilestone === ms.month
                          ? <ChevronUp className="w-4 h-4 text-brand-sage" />
                          : <ChevronDown className="w-4 h-4 text-brand-sage" />}
                      </button>
                      <AnimatePresence>
                        {expandedMilestone === ms.month && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 space-y-3">
                              {([
                                { label: 'Physical', items: ms.physical, color: 'text-brand-clay' },
                                { label: 'Cognitive', items: ms.cognitive, color: 'text-brand-sage' },
                                { label: 'Social', items: ms.social, color: 'text-brand-rose' },
                              ] as const).map(cat => (
                                <div key={cat.label}>
                                  <h4 className={cn("text-xs font-semibold uppercase tracking-wider mb-1.5", cat.color)}>{cat.label}</h4>
                                  <ul className="space-y-1">
                                    {cat.items.map((item, i) => (
                                      <li key={i} className="text-xs text-brand-ink/80 flex items-start gap-2">
                                        <span className="text-brand-sage mt-0.5">&#8226;</span>
                                        <span>{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                              <div className="bg-brand-gold/10 border border-brand-gold/20 rounded-xl p-3 mt-2">
                                <p className="text-xs text-brand-ink/80 italic">{ms.parentTip}</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}

              {/* Parenting Tips */}
              {resourceSubTab === 'tips' && (
                <div className="space-y-3">
                  <p className="text-sm text-brand-sage italic px-1">{t('parentingTips')}</p>
                  {parentingTips.map((tip) => (
                    <div key={tip.id} className="glass-card rounded-2xl p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl shrink-0">{tip.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium mb-1">{tip.title}</h4>
                          <p className="text-xs text-brand-ink/70 leading-relaxed">{tip.content}</p>
                          <span className="inline-block mt-2 text-[10px] text-brand-sage bg-brand-sage/10 px-2 py-0.5 rounded-full">
                            {tip.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Resource Links */}
              {resourceSubTab === 'resources' && (
                <div className="space-y-3">
                  <p className="text-sm text-brand-sage italic px-1">{t('usefulLinks')}</p>
                  {resourceLinks.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-card rounded-2xl p-4 flex items-center gap-3 hover:bg-white/80 active:bg-white/90 transition-all press-effect min-h-[60px] block"
                    >
                      <span className="text-xl shrink-0">{link.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{link.title}</div>
                        <div className="text-[10px] text-brand-sage">{link.source}</div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-brand-sage/40 shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-lg border-t border-brand-clay/10 px-4 py-3 flex justify-between items-center z-20 safe-bottom">
        <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={Heart} label={t('home')} />
        <NavButton active={activeTab === 'mood'} onClick={() => setActiveTab('mood')} icon={Calendar} label={t('mood')} />
        <NavButton active={activeTab === 'memory'} onClick={() => setActiveTab('memory')} icon={Brain} label={t('vault')} />
        <NavButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={MessageCircle} label={t('asha')} />
        <NavButton active={activeTab === 'help'} onClick={() => setActiveTab('help')} icon={BookOpen} label={t('help')} />
      </nav>

      {/* Mood Note Modal */}
      <AnimatePresence>
        {showMoodNote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center px-6"
            onClick={(e) => { if (e.target === e.currentTarget) skipMoodNote(); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-brand-cream w-full max-w-sm rounded-3xl p-6"
            >
              <div className="text-center mb-4">
                <span className="text-4xl">
                  {pendingMoodLevel === 1 ? '😔' : pendingMoodLevel === 2 ? '😕' : pendingMoodLevel === 3 ? '😐' : pendingMoodLevel === 4 ? '🙂' : '✨'}
                </span>
                <h3 className="text-lg font-medium mt-2">{pendingMoodLevel ? moodLabel(pendingMoodLevel) : ''}</h3>
              </div>
              <textarea
                value={moodNoteInput}
                onChange={(e) => setMoodNoteInput(e.target.value)}
                placeholder={t('addNote')}
                rows={3}
                className="w-full bg-white/60 border border-brand-clay/20 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-clay/30 text-sm resize-none"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={skipMoodNote}
                  className="flex-1 py-3 border border-brand-sage/20 rounded-2xl text-sm text-brand-sage min-h-[44px]"
                >
                  {t('skip')}
                </button>
                <button
                  onClick={confirmMood}
                  className="flex-1 py-3 bg-brand-clay text-white rounded-2xl text-sm font-medium press-effect min-h-[44px]"
                >
                  {t('save')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
            onClick={(e) => { if (e.target === e.currentTarget) setShowSettings(false); }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-brand-cream w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl p-6 pb-8 max-h-[85vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-medium">{t('settings')}</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2.5 rounded-full hover:bg-black/5 active:bg-black/10 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Dark mode toggle */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    {darkMode ? <Moon className="w-4 h-4 text-brand-lavender" /> : <Sun className="w-4 h-4 text-brand-gold" />}
                    <span className="text-sm font-medium">{t('darkMode')}</span>
                  </div>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={cn(
                      "w-12 h-7 rounded-full transition-colors relative",
                      darkMode ? "bg-brand-lavender" : "bg-brand-sage/20"
                    )}
                  >
                    <motion.div
                      animate={{ x: darkMode ? 22 : 2 }}
                      className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>

                {/* Notifications toggle */}
                {isNotificationSupported() && (
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      {notificationsOn ? <Bell className="w-4 h-4 text-brand-clay" /> : <BellOff className="w-4 h-4 text-brand-sage" />}
                      <div>
                        <span className="text-sm font-medium">{t('notifications')}</span>
                        <p className="text-[10px] text-brand-sage">{t('notificationsDesc')}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleToggleNotifications}
                      className={cn(
                        "w-12 h-7 rounded-full transition-colors relative shrink-0",
                        notificationsOn ? "bg-brand-clay" : "bg-brand-sage/20"
                      )}
                    >
                      <motion.div
                        animate={{ x: notificationsOn ? 22 : 2 }}
                        className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm"
                      />
                    </button>
                  </div>
                )}

                <div className="border-t border-brand-clay/10" />

                {/* API Key */}
                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Key className="w-4 h-4 text-brand-clay" />
                    {t('apiKeyLabel')}
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder={t('apiKeyPlaceholder')}
                      className="w-full bg-white/60 border border-brand-clay/20 rounded-2xl py-3.5 px-4 pr-20 focus:outline-none focus:ring-2 focus:ring-brand-clay/30 text-sm"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-brand-sage hover:text-brand-ink py-1 px-2"
                    >
                      {showApiKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <p className="text-[11px] text-brand-sage italic">{t('apiKeyHelp')}</p>
                  <button
                    onClick={handleSaveApiKey}
                    className="w-full py-3.5 bg-brand-clay text-white rounded-2xl text-sm font-medium hover:bg-brand-clay/90 active:bg-brand-clay/80 transition-all press-effect min-h-[48px]"
                  >
                    {t('save')}
                  </button>
                </div>

                <div className="border-t border-brand-clay/10" />

                {/* Export Data */}
                <button
                  onClick={handleExportData}
                  className="w-full flex items-center gap-3 py-3 px-1 hover:bg-black/5 active:bg-black/10 rounded-xl transition-colors min-h-[48px]"
                >
                  <Download className="w-4 h-4 text-brand-sage" />
                  <div className="text-left">
                    <span className="text-sm font-medium">{t('exportData')}</span>
                    <p className="text-[10px] text-brand-sage">{t('exportDesc')}</p>
                  </div>
                </button>

                <div className="border-t border-brand-clay/10" />

                {/* Disclaimer */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-brand-clay" />
                    {t('disclaimer')}
                  </h3>
                  <p className="text-[11px] text-brand-sage leading-relaxed">{t('disclaimerText')}</p>
                </div>

                <div className="border-t border-brand-clay/10" />

                {/* About */}
                <div className="text-center space-y-1 pb-2">
                  <p className="text-sm font-serif font-medium text-brand-ink">{t('appName')}</p>
                  <p className="text-[10px] text-brand-sage">v1.0.0 &middot; Made with love for every mama</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <Analytics />
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all min-w-[48px] min-h-[48px] py-1 press-effect",
        active ? "text-brand-clay scale-110" : "text-brand-sage opacity-60"
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[9px] font-medium">{label}</span>
      {active && (
        <motion.div layoutId="nav-dot" className="w-1 h-1 bg-brand-clay rounded-full" />
      )}
    </button>
  );
}
