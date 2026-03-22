import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { Settings } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAppData } from './hooks/useAppData';
import { useResetActivity } from './hooks/useResetActivity';
import { useBreathing } from './hooks/useBreathing';
import { useKegel } from './hooks/useKegel';
import { useGamification } from './hooks/useGamification';
import { useNutrition } from './hooks/useNutrition';
import { useMoodInsights } from './hooks/useMoodInsights';
import { t } from './strings';
import { getApiKey } from './services/gemini';
import type { Tab } from './types';

// Eagerly loaded components
import WelcomeScreen from './components/WelcomeScreen';
import BottomNav from './components/BottomNav';
import Toast from './components/Toast';
import MoodNoteModal from './components/MoodNoteModal';
import HomeTab from './tabs/HomeTab';

// Lazy loaded components
const MoodTab = React.lazy(() => import('./tabs/MoodTab'));
const MemoryTab = React.lazy(() => import('./tabs/MemoryTab'));
const ChatTab = React.lazy(() => import('./tabs/ChatTab'));
const HelpTab = React.lazy(() => import('./tabs/HelpTab'));
const SettingsModal = React.lazy(() => import('./components/SettingsModal'));
const ResetActivityModal = React.lazy(() => import('./components/ResetActivityModal'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-brand-clay/30 border-t-brand-clay rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const data = useAppData();
  const resetActivity = useResetActivity();
  const breathing = useBreathing();
  const kegel = useKegel();
  const gamification = useGamification({
    moods: data.moods,
    moodStreak: data.moodStreak,
    waterLog: data.waterLog,
    kegelLog: data.kegelLog,
    memories: data.memories,
    gratitudeEntries: data.gratitudeEntries,
    sleepLog: data.sleepLog,
    journalEntries: data.journalEntries,
    todayWater: data.todayWater,
    todayStr: data.todayStr,
    dayOfYear: data.dayOfYear,
    showToast: data.showToast,
    addMemory: data.addMemory,
  });

  const nutrition = useNutrition({
    dayOfYear: data.dayOfYear,
    showToast: data.showToast,
  });

  const moodInsights = useMoodInsights({
    moods: data.moods,
    todayStr: data.todayStr,
    showToast: data.showToast,
  });

  const onTalkToAsha = useCallback((message: string) => {
    data.setInputMessage(message);
    setActiveTab('chat');
  }, [data.setInputMessage]);

  // Log kegel completion
  useEffect(() => {
    if (!kegel.kegelActive && kegel.kegelReps >= 10) {
      data.setKegelLog(prev => [{ id: Date.now().toString(), timestamp: Date.now(), reps: 10 }, ...prev]);
    }
  }, [kegel.kegelActive, kegel.kegelReps]);

  // Tab change scroll
  useEffect(() => {
    data.mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Welcome screen
  if (data.showWelcome) {
    return (
      <WelcomeScreen
        welcomeName={data.welcomeName}
        setWelcomeName={data.setWelcomeName}
        welcomeBabyName={data.welcomeBabyName}
        setWelcomeBabyName={data.setWelcomeBabyName}
        welcomeBabyBirth={data.welcomeBabyBirth}
        setWelcomeBabyBirth={data.setWelcomeBabyBirth}
        onGetStarted={data.handleGetStarted}
        onGuestContinue={data.handleGuestContinue}
      />
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
          <button
            onClick={() => { data.setApiKeyInput(getApiKey()); data.setShowSettings(true); }}
            className="p-2.5 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={t('settings')}
          >
            <Settings className="w-5 h-5 text-brand-ink/60" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main ref={data.mainRef} className="flex-1 overflow-y-auto px-6 pb-28 z-10 custom-scrollbar">
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <HomeTab
                data={data}
                gamification={gamification}
                moodInsights={moodInsights}
                nutrition={nutrition}
                startResetActivity={resetActivity.startResetActivity}
                setActiveTab={setActiveTab}
                onTalkToAsha={onTalkToAsha}
                isBreathing={breathing.isBreathing}
                setIsBreathing={breathing.setIsBreathing}
                breathPhase={breathing.breathPhase}
                breathLabel={breathing.breathLabel}
                kegelActive={kegel.kegelActive}
                setKegelActive={kegel.setKegelActive}
                kegelPhase={kegel.kegelPhase}
                kegelReps={kegel.kegelReps}
              />
            )}
            {activeTab === 'mood' && (
              <Suspense fallback={<LoadingFallback />}>
                <MoodTab
                  moods={data.moods}
                  setMoods={data.setMoods}
                  chartData={data.chartData}
                  weekMoods={data.weekMoods}
                  avgMood={data.avgMood}
                  moodTrend={data.moodTrend}
                  darkMode={data.darkMode}
                  moodLabel={data.moodLabel}
                />
              </Suspense>
            )}
            {activeTab === 'memory' && (
              <Suspense fallback={<LoadingFallback />}>
                <MemoryTab
                  searchQuery={data.searchQuery}
                  setSearchQuery={data.setSearchQuery}
                  memoryInput={data.memoryInput}
                  setMemoryInput={data.setMemoryInput}
                  winInput={data.winInput}
                  setWinInput={data.setWinInput}
                  handleAddMemory={data.handleAddMemory}
                  handleAddWin={data.handleAddWin}
                  deleteMemory={data.deleteMemory}
                  filteredMemories={data.filteredMemories}
                />
              </Suspense>
            )}
            {activeTab === 'chat' && (
              <Suspense fallback={<LoadingFallback />}>
                <ChatTab
                  chatHistory={data.chatHistory}
                  setChatHistory={data.setChatHistory}
                  isTyping={data.isTyping}
                  inputMessage={data.inputMessage}
                  setInputMessage={data.setInputMessage}
                  chatError={data.chatError}
                  setChatError={data.setChatError}
                  chatEndRef={data.chatEndRef}
                  handleSendMessage={data.handleSendMessage}
                  chatPrompts={data.chatPrompts}
                />
              </Suspense>
            )}
            {activeTab === 'help' && (
              <Suspense fallback={<LoadingFallback />}>
                <HelpTab
                  resourceSubTab={data.resourceSubTab}
                  setResourceSubTab={data.setResourceSubTab}
                  expandedCountry={data.expandedCountry}
                  setExpandedCountry={data.setExpandedCountry}
                  expandedMilestone={data.expandedMilestone}
                  setExpandedMilestone={data.setExpandedMilestone}
                  expandedPartnerSection={data.expandedPartnerSection}
                  setExpandedPartnerSection={data.setExpandedPartnerSection}
                />
              </Suspense>
            )}
          </AnimatePresence>
        </ErrorBoundary>
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        moodsCount={data.moods.length}
        memoriesCount={data.memories.length}
      />

      {/* Mood Note Modal */}
      <MoodNoteModal
        showMoodNote={data.showMoodNote}
        pendingMoodLevel={data.pendingMoodLevel}
        moodNoteInput={data.moodNoteInput}
        setMoodNoteInput={data.setMoodNoteInput}
        onConfirm={data.confirmMood}
        onSkip={data.skipMoodNote}
        moodLabel={data.moodLabel}
      />

      {/* Toast */}
      <Toast message={data.toastMessage} />

      {/* Settings Modal */}
      <Suspense fallback={null}>
        <SettingsModal
          showSettings={data.showSettings}
          setShowSettings={data.setShowSettings}
          darkMode={data.darkMode}
          setDarkMode={data.setDarkMode}
          notificationsOn={data.notificationsOn}
          handleToggleNotifications={data.handleToggleNotifications}
          apiKeyInput={data.apiKeyInput}
          setApiKeyInput={data.setApiKeyInput}
          showApiKey={data.showApiKey}
          setShowApiKey={data.setShowApiKey}
          handleSaveApiKey={data.handleSaveApiKey}
          handleExportData={data.handleExportData}
          handleImportData={data.handleImportData}
          handleResetApp={data.handleResetApp}
        />
      </Suspense>

      {/* 2-Minute Reset Activity Modal */}
      <Suspense fallback={null}>
        <ResetActivityModal
          {...resetActivity}
          addMemory={data.addMemory}
          setGratitudeEntries={data.setGratitudeEntries}
          showToast={data.showToast}
          onComplete={gamification.logResetCompletion}
        />
      </Suspense>
    </div>
  );
}
