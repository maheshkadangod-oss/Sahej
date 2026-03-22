import React, { useState, useEffect } from 'react';
import {
  Sparkles, Droplets, Moon, Coffee, Plus, Check, X, AlertCircle,
  Sun, Heart, Brain, MessageCircle, BookOpen, GlassWater, Baby, PenLine, Minus,
  RefreshCw, UtensilsCrossed, ChevronDown, ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
const ReactMarkdown = React.lazy(() => import('react-markdown'));
import { format } from 'date-fns';
import { cn } from '../lib/cn';
import { t } from '../strings';
import { getApiKey } from '../services/gemini';
import type { Tab, ResetActivity, BabysLast, NutritionProfile } from '../types';
import type { useAppData } from '../hooks/useAppData';
import type { useGamification } from '../hooks/useGamification';
import type { useMoodInsights } from '../hooks/useMoodInsights';
import type { useNutrition } from '../hooks/useNutrition';
import AchievementBadges from '../components/AchievementBadges';
import QuestCard from '../components/QuestCard';
import LegacyLetterCard from '../components/LegacyLetterCard';

// The resetActivities config
const resetActivities = [
  { id: 'grounding' as const, emoji: '🌿', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
  { id: 'shoulder' as const, emoji: '💆', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  { id: 'handOnHeart' as const, emoji: '❤️', color: 'text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
  { id: 'boxBreathing' as const, emoji: '📦', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 'gratitudeReset' as const, emoji: '🌼', color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  { id: 'bodyScan' as const, emoji: '🧘', color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20' },
  { id: 'tenBreath' as const, emoji: '🌬️', color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
  { id: 'nameFeeling' as const, emoji: '🧠', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  { id: 'microStretch' as const, emoji: '🤸', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  { id: 'kindSentence' as const, emoji: '💬', color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20' },
  { id: 'visualization' as const, emoji: '🏝️', color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-900/20' },
  { id: 'pmr' as const, emoji: '💪', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
  { id: 'lovingKindness' as const, emoji: '🙏', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  { id: 'worryBox' as const, emoji: '🗃️', color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-900/20' },
  { id: 'selfCompassion' as const, emoji: '🫂', color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  { id: 'energyBoost' as const, emoji: '⚡', color: 'text-lime-500', bg: 'bg-lime-50 dark:bg-lime-900/20' },
  { id: 'gratitudeLetter' as const, emoji: '💌', color: 'text-fuchsia-500', bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20' },
  { id: 'smilePractice' as const, emoji: '😊', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
];

type AppData = ReturnType<typeof useAppData>;
type GamificationData = ReturnType<typeof useGamification>;
type MoodInsightsData = ReturnType<typeof useMoodInsights>;
type NutritionData = ReturnType<typeof useNutrition>;

interface HomeTabProps {
  data: AppData;
  gamification: GamificationData;
  moodInsights: MoodInsightsData;
  nutrition: NutritionData;
  startResetActivity: (activity: ResetActivity) => void;
  setActiveTab: (tab: Tab) => void;
  onTalkToAsha: (message: string) => void;
  // Breathing
  isBreathing: boolean;
  setIsBreathing: (v: boolean) => void;
  breathPhase: 'in' | 'hold' | 'out';
  breathLabel: string;
  // Kegel
  kegelActive: boolean;
  setKegelActive: (v: boolean) => void;
  kegelPhase: 'squeeze' | 'relax';
  kegelReps: number;
}

// Nutrition inline component to keep HomeTab manageable
const NutritionSection = React.memo(function NutritionSection({ nutrition }: { nutrition: NutritionData }) {
  const [localProfile, setLocalProfile] = useState<NutritionProfile>({
    breastfeeding: nutrition.profile.breastfeeding,
    dietType: nutrition.profile.dietType,
    culturalPreference: nutrition.profile.culturalPreference,
    allergies: nutrition.profile.allergies,
  });
  const [showFavorites, setShowFavorites] = useState(false);
  const [allergyInput, setAllergyInput] = useState(nutrition.profile.allergies.join(', '));

  const bfOptions = [
    { value: 'exclusive' as const, label: t('exclusive') },
    { value: 'partial' as const, label: t('partial') },
    { value: 'none' as const, label: t('noneBreastfeeding') },
  ];
  const dietOptions = [
    { value: 'vegetarian' as const, label: t('vegetarian') },
    { value: 'vegan' as const, label: t('vegan') },
    { value: 'nonVeg' as const, label: t('nonVeg') },
    { value: 'pescatarian' as const, label: t('pescatarian') },
  ];

  return (
    <section className="glass-card rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5 text-brand-gold" />
          <h3 className="text-lg font-medium">{t('nutritionSection')}</h3>
        </div>
        {nutrition.profileComplete && !nutrition.showProfileForm && (
          <button onClick={() => nutrition.setShowProfileForm(true)} className="text-xs text-brand-clay underline">
            {t('updateProfile')}
          </button>
        )}
      </div>

      {/* Daily tip */}
      <div className="bg-brand-gold/10 border border-brand-gold/15 rounded-2xl p-3">
        <p className="text-[10px] text-brand-gold font-medium uppercase tracking-wider mb-1">💡 {t('nutritionTip')}</p>
        <p className="text-xs text-brand-ink/70 italic leading-relaxed">{nutrition.dailyTip}</p>
      </div>

      {/* Profile setup form */}
      {(!nutrition.profileComplete || nutrition.showProfileForm) && (
        <div className="space-y-3 bg-white/40 dark:bg-white/5 rounded-2xl p-4">
          <p className="text-xs text-brand-sage font-medium">{t('nutritionProfileLabel')}</p>

          <div>
            <p className="text-[10px] text-brand-sage mb-1.5">{t('breastfeedingLabel')}</p>
            <div className="flex gap-2 flex-wrap">
              {bfOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setLocalProfile(p => ({ ...p, breastfeeding: opt.value }))}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs transition-all min-h-[32px]",
                    localProfile.breastfeeding === opt.value
                      ? "bg-brand-clay text-white"
                      : "bg-brand-sage/10 text-brand-sage"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] text-brand-sage mb-1.5">{t('dietTypeLabel')}</p>
            <div className="flex gap-2 flex-wrap">
              {dietOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setLocalProfile(p => ({ ...p, dietType: opt.value }))}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs transition-all min-h-[32px]",
                    localProfile.dietType === opt.value
                      ? "bg-brand-clay text-white"
                      : "bg-brand-sage/10 text-brand-sage"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] text-brand-sage mb-1.5">{t('culturalPref')}</p>
            <input
              type="text"
              value={localProfile.culturalPreference}
              onChange={e => setLocalProfile(p => ({ ...p, culturalPreference: e.target.value }))}
              placeholder={t('culturalPrefPlaceholder')}
              className="w-full bg-white/60 dark:bg-white/10 border border-brand-clay/15 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-clay/20 placeholder:text-brand-sage/40"
            />
          </div>

          <div>
            <p className="text-[10px] text-brand-sage mb-1.5">{t('allergiesLabel')}</p>
            <input
              type="text"
              value={allergyInput}
              onChange={e => setAllergyInput(e.target.value)}
              placeholder={t('allergiesPlaceholder')}
              className="w-full bg-white/60 dark:bg-white/10 border border-brand-clay/15 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-clay/20 placeholder:text-brand-sage/40"
            />
          </div>

          <button
            onClick={() => {
              const allergies = allergyInput.split(',').map(s => s.trim()).filter(Boolean);
              nutrition.saveProfile({ ...localProfile, allergies });
            }}
            disabled={!localProfile.breastfeeding || !localProfile.dietType}
            className="w-full py-2.5 bg-brand-clay text-white rounded-2xl text-sm font-medium disabled:opacity-40 press-effect min-h-[44px]"
          >
            {t('saveProfile')}
          </button>
        </div>
      )}

      {/* Meal suggestion */}
      {nutrition.profileComplete && !nutrition.showProfileForm && (
        <div className="space-y-3">
          {nutrition.isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-6 h-6 border-2 border-brand-gold/30 border-t-brand-gold rounded-full animate-spin mr-3" />
              <span className="text-sm text-brand-sage italic">{t('loadingMeal')}</span>
            </div>
          ) : nutrition.latestSuggestion ? (
            <div className="bg-white/40 dark:bg-white/5 rounded-2xl p-4">
              <div className="prose prose-sm max-w-none text-brand-ink/80 dark:text-brand-ink/70">
                <React.Suspense fallback={<p className="text-sm text-brand-sage">{nutrition.latestSuggestion.suggestion.slice(0, 100)}...</p>}>
                  <ReactMarkdown>{nutrition.latestSuggestion.suggestion}</ReactMarkdown>
                </React.Suspense>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-brand-sage/10">
                <button
                  onClick={() => nutrition.toggleFavorite(nutrition.latestSuggestion!.id)}
                  className="text-xs text-brand-clay flex items-center gap-1"
                >
                  {nutrition.latestSuggestion.isFavorite ? '❤️' : '🤍'} {nutrition.latestSuggestion.isFavorite ? 'Saved' : 'Save'}
                </button>
                <span className="text-[10px] text-brand-sage">{format(nutrition.latestSuggestion.timestamp, 'MMM d, h:mm a')}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-brand-sage italic text-center">{t('noSuggestionsYet')}</p>
          )}

          {nutrition.hasApiKey && (
            <button
              onClick={nutrition.fetchMealSuggestion}
              disabled={nutrition.isLoading}
              className="w-full py-3 bg-brand-gold/20 text-brand-clay rounded-2xl text-sm font-medium press-effect min-h-[44px] disabled:opacity-40"
            >
              🍽️ {t('getMealSuggestion')}
            </button>
          )}

          {/* Favorites */}
          {nutrition.favoriteMeals.length > 0 && (
            <div>
              <button
                onClick={() => setShowFavorites(!showFavorites)}
                className="flex items-center gap-2 text-sm text-brand-sage w-full"
              >
                <span>❤️ {t('favoriteMeals')} ({nutrition.favoriteMeals.length})</span>
                {showFavorites ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
              </button>
              <AnimatePresence>
                {showFavorites && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2 mt-2">
                      {nutrition.favoriteMeals.map(meal => (
                        <div key={meal.id} className="bg-white/30 rounded-xl p-3">
                          <div className="prose prose-sm max-w-none text-brand-ink/70 text-xs">
                            <React.Suspense fallback={<p className="text-xs text-brand-sage">{meal.suggestion.slice(0, 80)}...</p>}>
                              <ReactMarkdown>{meal.suggestion}</ReactMarkdown>
                            </React.Suspense>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </section>
  );
});

export default function HomeTab({
  data, gamification, moodInsights, nutrition, startResetActivity, setActiveTab, onTalkToAsha,
  isBreathing, setIsBreathing, breathPhase, breathLabel,
  kegelActive, setKegelActive, kegelPhase, kegelReps,
}: HomeTabProps) {
  const {
    displayName, postpartumInfo, dailyAffirmation,
    showBackupReminder, setShowSettings, setApiKeyInput, setBackupDismissed,
    babysLast, updateBabysLast, formatTimeAgo,
    moodStreak, startMoodLog, moodLabel,
    todaySleep, pendingSleepHours, setPendingSleepHours, handleLogSleep, avgSleep,
    checklist, toggleChecklist,
    todayGratitude, gratitudeInputs, setGratitudeInputs, handleSaveGratitude, gratitudeSaved,
    todayWater, addWaterGlass, removeWaterGlass,
    todayKegels, darkMode,
    todayJournal, journalInput, setJournalInput, handleSaveJournal, todayJournalPrompt,
    userProfile, milestoneInput, setMilestoneInput, handleAddMilestone, babyMilestones,
    circleMessage, dailyTip,
  } = data;

  return (
    <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
      {/* Personalized greeting */}
      <section className="px-1">
        <h2 className="text-xl font-serif font-medium text-brand-ink mb-1">
          {(t('helloName') as string).replace('{name}', displayName)}
        </h2>
        {postpartumInfo && (
          <p className="text-xs text-brand-sage mb-3">
            {postpartumInfo.babyName ? `${postpartumInfo.babyName} — ` : ''}{postpartumInfo.text}
          </p>
        )}
        <div className="bg-brand-rose/10 border border-brand-rose/20 rounded-2xl p-4 italic text-brand-ink/80 text-sm text-center">
          "{dailyAffirmation}"
        </div>
      </section>

      {/* Backup Warning */}
      {showBackupReminder && (
        <section className="bg-brand-gold/10 border border-brand-gold/20 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-brand-ink/70">{t('backupReminder')}</p>
            <button
              onClick={() => { setApiKeyInput(getApiKey()); setShowSettings(true); }}
              className="text-xs text-brand-clay font-medium mt-1 underline underline-offset-2"
            >
              {t('exportData')}
            </button>
          </div>
          <button
            onClick={() => { localStorage.setItem('sahej_backup_dismissed', String(Date.now())); setBackupDismissed(String(Date.now())); }}
            className="text-brand-sage/40 hover:text-brand-sage p-1"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </section>
      )}

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
              onClick={() => updateBabysLast(item.id as keyof BabysLast)}
              className="glass-card rounded-2xl p-3 flex flex-col items-center gap-2 hover:bg-white/60 active:bg-white/80 transition-all press-effect min-h-[88px]"
            >
              <item.icon className="w-4 h-4 text-brand-clay" />
              <span className="text-[10px] font-medium text-brand-sage uppercase tracking-wider text-center">{item.label}</span>
              {formatTimeAgo(babysLast[item.id as keyof BabysLast]) ? (
                <span className="text-xs font-semibold">{formatTimeAgo(babysLast[item.id as keyof BabysLast])}</span>
              ) : (
                <span className="text-[10px] text-brand-clay/60 italic">Tap to log</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* How are you */}
      <section className="glass-card rounded-3xl p-6 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-brand-clay" />
          <h2 className="text-xl font-medium">{t('howAreYou')}</h2>
          {gamification.sunshineStreak && (
            <span className="text-xs text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
              ☀️ {t('sunshineStreak')}
            </span>
          )}
          {moodStreak > 1 && (
            <span className="text-xs text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-full ml-auto">
              {moodStreak} {t('dayStreak')}
            </span>
          )}
        </div>
        <div className="flex justify-between items-center gap-2">
          {[1, 2, 3, 4, 5].map((level) => (
            <motion.button
              key={level}
              onClick={() => startMoodLog(level)}
              whileTap={{ scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              aria-label={moodLabel(level)}
              className="flex-1 aspect-square rounded-2xl flex items-center justify-center text-2xl hover:bg-brand-clay/10 active:bg-brand-clay/20 transition-colors border border-brand-clay/10 min-w-[44px] min-h-[44px]"
            >
              {level === 1 ? '😔' : level === 2 ? '😕' : level === 3 ? '😐' : level === 4 ? '🙂' : '✨'}
            </motion.button>
          ))}
        </div>
        <p className="text-center text-xs text-brand-sage mt-4 italic">{t('logHeart')}</p>
      </section>

      {/* Mood Insights (AI-powered) */}
      {moodInsights.hasEnoughData && (
        <section className="glass-card rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-clay" />
              <h3 className="text-lg font-medium">{t('moodInsights')}</h3>
            </div>
            {moodInsights.insight && moodInsights.hasApiKey && (
              <button
                onClick={moodInsights.generateInsights}
                disabled={moodInsights.isLoading}
                className="p-2 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors"
                aria-label={t('refreshInsights')}
              >
                <RefreshCw className={cn("w-4 h-4 text-brand-sage", moodInsights.isLoading && "animate-spin")} />
              </button>
            )}
          </div>

          {moodInsights.lowMoodAlert && (
            <div className="bg-brand-rose/10 border border-brand-rose/20 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-brand-rose shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-brand-ink/80">{t('lowMoodAlert')}</p>
                  <button
                    onClick={() => setActiveTab('help')}
                    className="text-xs text-brand-clay font-medium mt-2 underline"
                  >
                    {t('viewHelplines')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {moodInsights.isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-6 h-6 border-2 border-brand-clay/30 border-t-brand-clay rounded-full animate-spin mr-3" />
              <span className="text-sm text-brand-sage italic">{t('insightLoading')}</span>
            </div>
          ) : moodInsights.insight ? (
            <div className="space-y-3">
              <div className="bg-white/40 dark:bg-white/5 rounded-2xl p-4">
                <p className="text-sm text-brand-ink/80 leading-relaxed">{moodInsights.insight.summary}</p>
              </div>
              {moodInsights.hasApiKey && (
                <button
                  onClick={() => onTalkToAsha(moodInsights.chatContextMessage)}
                  className="w-full py-3 bg-brand-clay/10 text-brand-clay rounded-2xl text-sm font-medium press-effect min-h-[44px]"
                >
                  💬 {t('talkToAsha')}
                </button>
              )}
              <p className="text-[10px] text-brand-sage text-center">
                {t('lastUpdated')}: {format(moodInsights.insight.generatedAt, 'MMM d, h:mm a')}
              </p>
            </div>
          ) : moodInsights.hasApiKey ? (
            <button
              onClick={moodInsights.generateInsights}
              className="w-full py-3 bg-brand-clay text-white rounded-2xl text-sm font-medium press-effect min-h-[44px]"
            >
              ✨ {t('generateInsights')}
            </button>
          ) : (
            <p className="text-sm text-brand-sage italic text-center">{t('needMoreData')}</p>
          )}
        </section>
      )}

      {/* Achievements */}
      <AchievementBadges
        earnedBadges={gamification.earnedBadges}
        badgeProgress={gamification.badgeProgress}
        markBadgeSeen={gamification.markBadgeSeen}
      />

      {/* Wellness Quest */}
      <QuestCard
        activeQuest={gamification.activeQuest}
        startQuest={gamification.startQuest}
        abandonQuest={gamification.abandonQuest}
        questDayIndex={gamification.questDayIndex}
        questCompleted={gamification.questCompleted}
        todayQuestMet={gamification.todayQuestMet}
      />

      {/* Sleep Tracker */}
      <section className="glass-card rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Moon className="w-5 h-5 text-brand-lavender" />
          <h3 className="text-lg font-medium">{t('sleepTracker')}</h3>
          {avgSleep && (
            <span className="text-xs text-brand-sage bg-brand-sage/10 px-2 py-0.5 rounded-full ml-auto">
              {t('avg')}: {avgSleep}h
            </span>
          )}
        </div>
        {todaySleep ? (
          <div className="flex items-center gap-3 text-sm text-brand-ink/80">
            <span>{todaySleep.hours}h</span>
            <span className="text-brand-sage">|</span>
            <span>{['', '😴', '😕', '😐', '🙂', '😊'][todaySleep.quality]} {t(`sleepQuality${todaySleep.quality}`)}</span>
          </div>
        ) : pendingSleepHours ? (
          <div className="space-y-3">
            <p className="text-xs text-brand-sage">{pendingSleepHours}h — {t('sleepQualityAsk')}</p>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5].map(q => (
                <button
                  key={q}
                  onClick={() => handleLogSleep(pendingSleepHours, q)}
                  className="px-3 py-1.5 text-xs rounded-full border border-brand-lavender/20 hover:bg-brand-lavender/10 active:bg-brand-lavender/20 transition-colors min-h-[32px]"
                >
                  {['', '😴', '😕', '😐', '🙂', '😊'][q]} {t(`sleepQuality${q}`)}
                </button>
              ))}
            </div>
            <button onClick={() => setPendingSleepHours(null)} className="text-[10px] text-brand-sage/60 underline">
              {t('back')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-brand-sage w-16 shrink-0">{t('hoursSlept')}</span>
              <div className="flex gap-1.5 flex-wrap">
                {[2, 3, 4, 5, 6, 7, 8].map(h => (
                  <button
                    key={h}
                    onClick={() => setPendingSleepHours(h)}
                    className="px-3 py-1.5 text-xs rounded-full border border-brand-lavender/20 hover:bg-brand-lavender/10 active:bg-brand-lavender/20 transition-colors min-h-[32px]"
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Self-care checklist */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-lg font-medium">{t('selfCare')}</h3>
          <span className="text-xs text-brand-sage bg-brand-sage/10 px-2 py-0.5 rounded-full">
            {checklist.filter(c => c.completed).length}/{checklist.length}
          </span>
        </div>
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
                <motion.div
                  animate={item.completed ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0",
                    item.completed ? "bg-brand-sage border-brand-sage text-white" : "border-brand-sage/30"
                  )}
                >
                  {item.completed && <Check className="w-3 h-3" />}
                </motion.div>
                <span className={cn("text-sm transition-all duration-200", item.completed && "line-through text-brand-sage/60")}>
                  {itemText}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Gratitude Journal */}
      <section className="glass-card rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sun className="w-5 h-5 text-brand-gold" />
          <h3 className="text-lg font-medium">{t('gratitudeTitle')}</h3>
        </div>
        {todayGratitude ? (
          <div className="space-y-2">
            {todayGratitude.items.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-brand-ink/80">
                <span className="text-brand-gold mt-0.5">&#10047;</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {[0, 1, 2].map(i => (
              <input
                key={i}
                type="text"
                placeholder={t('gratitudePlaceholder')}
                value={gratitudeInputs[i]}
                onChange={(e) => {
                  const newInputs = [...gratitudeInputs];
                  newInputs[i] = e.target.value;
                  setGratitudeInputs(newInputs);
                }}
                enterKeyHint={i === 2 ? 'done' : 'next'}
                onKeyDown={(e) => { if (e.key === 'Enter' && i === 2) handleSaveGratitude(); }}
                className="w-full bg-white/40 border border-brand-gold/15 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/20 placeholder:text-brand-sage/40"
              />
            ))}
            <button
              onClick={handleSaveGratitude}
              disabled={gratitudeInputs.every(i => !i.trim())}
              className="w-full py-3 bg-brand-gold/20 text-brand-clay rounded-2xl text-sm font-medium disabled:opacity-40 transition-all press-effect min-h-[44px]"
            >
              {gratitudeSaved ? t('gratitudeSaved') : t('saveGratitude')}
            </button>
          </div>
        )}
      </section>

      {/* Water Intake Tracker */}
      <section className="glass-card rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <GlassWater className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-medium">{t('waterTracker')}</h3>
          {gamification.waterStreak > 1 && (
            <span className="text-xs text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
              💧 {gamification.waterStreak} {t('waterStreakLabel')}
            </span>
          )}
          <span className="text-xs text-brand-sage bg-brand-sage/10 px-2 py-0.5 rounded-full ml-auto">
            {t('goal')}: 8
          </span>
        </div>
        <div className="flex items-center gap-4">
          {/* Droplet visual */}
          <div className="relative w-16 h-20 shrink-0">
            <svg viewBox="0 0 64 80" className="w-full h-full">
              <defs>
                <clipPath id="dropClip">
                  <path d="M32 4 C32 4 8 36 8 52 C8 66 18 76 32 76 C46 76 56 66 56 52 C56 36 32 4 32 4Z" />
                </clipPath>
              </defs>
              {/* Droplet outline */}
              <path d="M32 4 C32 4 8 36 8 52 C8 66 18 76 32 76 C46 76 56 66 56 52 C56 36 32 4 32 4Z"
                fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-200 dark:text-blue-800" />
              {/* Water fill */}
              <g clipPath="url(#dropClip)">
                <motion.rect
                  x="0" width="64"
                  animate={{ y: 80 - (Math.min(todayWater?.glasses || 0, 8) / 8) * 72, height: (Math.min(todayWater?.glasses || 0, 8) / 8) * 72 }}
                  transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                  className="fill-blue-400/70 dark:fill-blue-500/60"
                />
                {/* Wave effect */}
                {(todayWater?.glasses || 0) > 0 && (todayWater?.glasses || 0) < 8 && (
                  <motion.path
                    animate={{ x: [-4, 4, -4] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    d={`M-4 ${80 - (Math.min(todayWater?.glasses || 0, 8) / 8) * 72} Q16 ${80 - (Math.min(todayWater?.glasses || 0, 8) / 8) * 72 - 3} 32 ${80 - (Math.min(todayWater?.glasses || 0, 8) / 8) * 72} Q48 ${80 - (Math.min(todayWater?.glasses || 0, 8) / 8) * 72 + 3} 68 ${80 - (Math.min(todayWater?.glasses || 0, 8) / 8) * 72} V80 H-4Z`}
                    className="fill-blue-400/50 dark:fill-blue-500/40"
                  />
                )}
              </g>
            </svg>
            {/* Count overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-serif font-bold text-blue-600 dark:text-blue-300 drop-shadow-sm">{todayWater?.glasses || 0}</span>
            </div>
          </div>
          {/* Controls */}
          <div className="flex-1 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={removeWaterGlass}
                disabled={!todayWater || todayWater.glasses === 0}
                className="p-2.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-400 disabled:opacity-30 transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
              >
                <Minus className="w-4 h-4" />
              </motion.button>
              <div className="flex gap-1 flex-1 justify-center">
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={i < (todayWater?.glasses || 0) ? { scale: [0.8, 1], opacity: 1 } : { scale: 1, opacity: 0.3 }}
                    className={cn(
                      "w-2 h-6 rounded-full transition-colors",
                      i < (todayWater?.glasses || 0) ? "bg-blue-400" : "bg-blue-100 dark:bg-blue-900/20"
                    )}
                  />
                ))}
              </div>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={addWaterGlass}
                className="p-2.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-400 transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </motion.button>
            </div>
            {(todayWater?.glasses || 0) >= 8 ? (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-blue-500 text-center font-medium"
              >
                {t('waterGoalReached')} 💧
              </motion.p>
            ) : (
              <p className="text-[10px] text-brand-sage text-center">{8 - (todayWater?.glasses || 0)} more to go</p>
            )}
          </div>
        </div>
      </section>

      {/* Nutrition Guide */}
      <NutritionSection nutrition={nutrition} />

      {/* Kegel Exercise */}
      <section className="glass-card rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-brand-rose" />
            <div>
              <h3 className="text-lg font-medium">{t('kegelExercise')}</h3>
              <p className="text-[10px] text-brand-sage italic">{t('kegelDesc')}</p>
            </div>
          </div>
          {todayKegels.length > 0 && (
            <span className="text-xs text-brand-sage bg-brand-sage/10 px-2 py-0.5 rounded-full">
              {todayKegels.length}x {t('today')}
            </span>
          )}
        </div>
        {kegelActive ? (
          <div className="flex flex-col items-center py-4 gap-4">
            <div className="relative">
              {/* Progress ring */}
              <svg width="96" height="96" className="transform -rotate-90">
                <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="4"
                  className="text-brand-rose/10" />
                <motion.circle
                  cx="48" cy="48" r="40" fill="none" strokeWidth="4"
                  strokeLinecap="round"
                  className="text-brand-rose"
                  style={{ stroke: 'currentColor' }}
                  strokeDasharray={251.3}
                  animate={{ strokeDashoffset: 251.3 - (kegelReps / 10) * 251.3 }}
                  transition={{ duration: 0.5 }}
                />
              </svg>
              {/* Inner pulse */}
              <motion.div
                animate={{
                  scale: kegelPhase === 'squeeze' ? [1, 1.2] : [1.2, 1],
                  backgroundColor: kegelPhase === 'squeeze'
                    ? (darkMode ? '#9B5C6B' : '#E8B4B8')
                    : (darkMode ? '#7B6E99' : '#B8A9C9')
                }}
                transition={{ duration: 5, ease: "easeInOut" }}
                className="absolute inset-3 rounded-full flex items-center justify-center"
              >
                <div className="text-center">
                  <span className="text-white text-xs font-medium block">
                    {kegelPhase === 'squeeze' ? t('kegelSqueeze') : t('kegelRelax')}
                  </span>
                  <span className="text-white/70 text-[10px]">{kegelReps}/10</span>
                </div>
              </motion.div>
            </div>
            <button
              onClick={() => setKegelActive(false)}
              className="text-xs text-brand-sage/60 underline min-h-[32px]"
            >{t('stop')}</button>
          </div>
        ) : (
          <button
            onClick={() => setKegelActive(true)}
            className="w-full py-3 bg-brand-rose/15 text-brand-rose rounded-2xl text-sm font-medium transition-all press-effect min-h-[44px]"
          >
            {t('startKegel')}
          </button>
        )}
      </section>

      {/* Journal Prompt */}
      <section className="glass-card rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <PenLine className="w-5 h-5 text-brand-lavender" />
          <h3 className="text-lg font-medium">{t('dailyJournal')}</h3>
          {gamification.journalStreak > 1 && (
            <span className="text-xs text-purple-500 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full ml-auto">
              ✍️ {gamification.journalStreak} {t('journalStreakLabel')}
            </span>
          )}
        </div>
        {todayJournal ? (
          <div className="space-y-2">
            <p className="text-xs text-brand-sage italic">"{todayJournal.prompt}"</p>
            <p className="text-sm text-brand-ink/80">{todayJournal.entry}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-brand-ink/70 italic bg-brand-lavender/10 border border-brand-lavender/15 rounded-xl p-3">
              "{todayJournalPrompt}"
            </p>
            <textarea
              value={journalInput}
              onChange={(e) => setJournalInput(e.target.value)}
              placeholder={t('journalPlaceholder')}
              rows={3}
              className="w-full bg-white/40 border border-brand-lavender/15 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-lavender/20 placeholder:text-brand-sage/40 resize-none"
            />
            <button
              onClick={handleSaveJournal}
              disabled={!journalInput.trim()}
              className="w-full py-3 bg-brand-lavender/20 text-brand-lavender rounded-2xl text-sm font-medium disabled:opacity-40 transition-all press-effect min-h-[44px]"
            >
              {t('saveJournal')}
            </button>
          </div>
        )}
      </section>

      {/* Legacy Letter */}
      <LegacyLetterCard
        todayLetterPrompt={gamification.todayLetterPrompt}
        todayLetter={gamification.todayLetter}
        onSave={gamification.saveLegacyLetter}
      />

      {/* Baby's Firsts */}
      {userProfile?.babyName && (
        <section className="glass-card rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Baby className="w-5 h-5 text-brand-gold" />
            <h3 className="text-lg font-medium">{(t('babyFirsts') as string).replace('{name}', userProfile.babyName)}</h3>
          </div>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={milestoneInput}
              onChange={(e) => setMilestoneInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddMilestone(); }}
              enterKeyHint="done"
              placeholder={t('milestonePlaceholder')}
              className="flex-1 bg-white/40 border border-brand-gold/15 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/20 placeholder:text-brand-sage/40"
            />
            <button
              onClick={handleAddMilestone}
              disabled={!milestoneInput.trim()}
              className="px-4 py-2.5 bg-brand-gold/20 text-brand-clay rounded-xl text-sm font-medium disabled:opacity-40 transition-all press-effect min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {babyMilestones.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
              {babyMilestones.slice(0, 5).map(m => (
                <div key={m.id} className="flex items-start gap-2 text-sm">
                  <span className="text-brand-gold mt-0.5">&#9733;</span>
                  <div className="flex-1">
                    <span className="text-brand-ink/80">{m.milestone}</span>
                    <span className="text-[10px] text-brand-sage ml-2">{format(m.timestamp, 'MMM d')}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-brand-sage italic text-center">{t('noMilestonesYet')}</p>
          )}
        </section>
      )}

      {/* 2-Minute Reset Hub */}
      <section className="space-y-3">
        <div className="px-1">
          <h3 className="text-lg font-medium">{t('twoMinReset')}</h3>
          <p className="text-xs text-brand-sage italic">{t('twoMinResetDesc')}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {resetActivities.map(a => (
            <button
              key={a.id}
              onClick={() => startResetActivity(a.id)}
              aria-label={t(`reset_${a.id}`)}
              className={cn("flex items-center gap-2.5 p-3 rounded-2xl text-left transition-all press-effect min-h-[52px]", a.bg)}
            >
              <span className="text-lg" aria-hidden="true">{a.emoji}</span>
              <span className="text-xs font-medium text-brand-ink/80">{t(`reset_${a.id}`)}</span>
            </button>
          ))}
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
        <div className="flex flex-col items-center py-8 gap-4 relative">
          {/* Outer ripple rings */}
          {isBreathing && (
            <>
              <motion.div
                animate={{ scale: [1, 2.2], opacity: [0.15, 0] }}
                transition={{ duration: 4, ease: "easeOut", repeat: Infinity }}
                className="absolute w-24 h-24 rounded-full border-2 border-brand-rose/30"
              />
              <motion.div
                animate={{ scale: [1, 1.8], opacity: [0.2, 0] }}
                transition={{ duration: 4, ease: "easeOut", repeat: Infinity, delay: 1 }}
                className="absolute w-24 h-24 rounded-full border border-brand-rose/20"
              />
            </>
          )}
          {/* Main breathing circle */}
          <motion.div
            animate={isBreathing ? {
              scale: breathPhase === 'in' ? [1, 1.5] : breathPhase === 'hold' ? 1.5 : [1.5, 1],
            } : { scale: 1 }}
            transition={{ duration: 4, ease: "easeInOut" }}
            className="w-24 h-24 rounded-full flex items-center justify-center relative z-10"
            style={{
              background: isBreathing
                ? 'radial-gradient(circle, rgba(232,180,184,0.8) 0%, rgba(232,180,184,0.4) 60%, rgba(232,180,184,0.1) 100%)'
                : 'radial-gradient(circle, rgba(232,180,184,0.3) 0%, rgba(232,180,184,0.1) 100%)'
            }}
          >
            <span className={cn(
              "text-xs font-medium text-center px-2 transition-colors",
              isBreathing ? "text-white" : "text-brand-rose/60"
            )}>
              {isBreathing ? breathLabel : t('peace')}
            </span>
          </motion.div>
          {/* Phase indicator dots */}
          {isBreathing && (
            <div className="flex gap-2 mt-2">
              {['in', 'hold', 'out'].map(phase => (
                <div key={phase} className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  breathPhase === phase ? "bg-brand-rose scale-125" : "bg-brand-rose/20"
                )} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Wellness Tip */}
      {dailyTip && (
        <section className="bg-brand-sage/5 border border-brand-sage/10 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-brand-sage/10 rounded-lg shrink-0">
              <BookOpen className="w-4 h-4 text-brand-sage" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-brand-sage uppercase tracking-wider mb-1">{t('wellnessTip')}</h4>
              <p className="text-sm text-brand-ink/70 leading-relaxed">{dailyTip}</p>
            </div>
          </div>
        </section>
      )}

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
  );
}
