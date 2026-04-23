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
import { useCompanion } from './hooks/useCompanion';
import { t } from './strings';
import { getApiKey } from './services/gemini';
import { createShareLink } from './services/adminApi';
import { format } from 'date-fns';
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
const FeedbackForm = React.lazy(() => import('./components/FeedbackForm'));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));
const ShareView = React.lazy(() => import('./components/ShareView'));
const EPDSScreening = React.lazy(() => import('./components/EPDSScreening'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-brand-clay/30 border-t-brand-clay rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  // Share view route — render a read-only mood summary without the rest of the app.
  // Done at the top-level (before any hooks) so we never mount the main app's hooks on the share page.
  const shareMatch = typeof window !== 'undefined' ? window.location.pathname.match(/^\/share\/([^/?#]+)/) : null;
  if (shareMatch) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <ShareView token={shareMatch[1]} />
      </Suspense>
    );
  }
  return <MainApp />;
}

function MainApp() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showFeedback, setShowFeedback] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showEPDS, setShowEPDS] = useState(false);
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

  const companion = useCompanion({
    moods: data.moods,
    waterLog: data.waterLog,
    kegelLog: data.kegelLog,
    journalEntries: data.journalEntries,
    gratitudeEntries: data.gratitudeEntries,
    sleepLog: data.sleepLog,
    memories: data.memories,
    earnedBadges: gamification.earnedBadges,
    wellnessStreak: gamification.wellnessStreak,
    moodStreak: data.moodStreak,
    todayStr: data.todayStr,
    showToast: data.showToast,
  });

  const onTalkToAsha = useCallback((message: string) => {
    data.setInputMessage(message);
    setActiveTab('chat');
  }, [data.setInputMessage]);

  const handleShareWithFamily = useCallback(async () => {
    const displayName = data.displayName || 'Mama';
    const weekMoodsForShare = data.weekMoods.slice(0, 7).map(m => ({
      date: format(m.timestamp, 'MMM d'),
      level: m.level,
    }));
    data.showToast('Creating share link...');
    const url = await createShareLink(displayName, {
      avgMood: data.avgMood ? parseFloat(data.avgMood) : null,
      streak: data.moodStreak,
      trend: data.moodTrend,
      weekMoods: weekMoodsForShare,
    });
    if (!url) {
      data.showToast('Could not create link. Try again later.');
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      data.showToast('Link copied! Expires in 30 days.');
    } catch {
      // Clipboard API not available — show the link in a prompt fallback
      window.prompt('Copy this link to share:', url);
    }
  }, [data.displayName, data.weekMoods, data.avgMood, data.moodStreak, data.moodTrend, data.showToast]);

  // Log kegel completion
  useEffect(() => {
    if (!kegel.kegelActive && kegel.kegelReps >= 10) {
      data.setKegelLog(prev => [{ id: Date.now().toString(), timestamp: Date.now(), reps: 10 }, ...prev]);
    }
  }, [kegel.kegelActive, kegel.kegelReps]);

  // Micro-achievement: gentle toast once per day on app open
  useEffect(() => {
    if (data.showWelcome) return;
    if (data.lastMicroAchievement === data.todayStr) return;
    import('./data/reassurances').then(({ microAchievements }) => {
      const msg = microAchievements[data.dayOfYear % microAchievements.length];
      // Small delay so it doesn't collide with mount transitions
      const t = setTimeout(() => {
        data.showToast(msg);
        localStorage.setItem('sahej_last_microachievement', data.todayStr);
        data.setLastMicroAchievement(data.todayStr);
      }, 900);
      return () => clearTimeout(t);
    });
  }, [data.showWelcome, data.lastMicroAchievement, data.todayStr, data.dayOfYear]);

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
        welcomeEmail={data.welcomeEmail}
        setWelcomeEmail={data.setWelcomeEmail}
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
            className="p-3 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors min-w-[52px] min-h-[52px] flex items-center justify-center"
            aria-label={t('settings')}
          >
            <Settings className="w-6 h-6 text-brand-ink/60" />
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
                companion={companion}
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
                  onStartEPDS={() => setShowEPDS(true)}
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
                  crisisSurfaceShown={data.crisisSurfaceShown}
                  setCrisisSurfaceShown={data.setCrisisSurfaceShown}
                  fallbackModeShown={data.fallbackModeShown}
                  setFallbackModeShown={data.setFallbackModeShown}
                  setActiveTab={setActiveTab}
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
          trustedContacts={companion.trustedContacts}
          addTrustedContact={companion.addTrustedContact}
          removeTrustedContact={companion.removeTrustedContact}
          onShowFeedback={() => setShowFeedback(true)}
          onShowAdmin={() => setShowAdmin(true)}
          onShareWithFamily={handleShareWithFamily}
          onStartEPDS={() => setShowEPDS(true)}
        />
      </Suspense>

      {/* Feedback Form */}
      <Suspense fallback={null}>
        <FeedbackForm
          show={showFeedback}
          onClose={() => setShowFeedback(false)}
          showToast={data.showToast}
        />
      </Suspense>

      {/* Admin Dashboard */}
      <Suspense fallback={null}>
        <AdminDashboard
          show={showAdmin}
          onClose={() => setShowAdmin(false)}
        />
      </Suspense>

      {/* EPDS Screening */}
      <Suspense fallback={null}>
        <EPDSScreening
          show={showEPDS}
          onClose={() => setShowEPDS(false)}
          onViewHelplines={() => { setShowEPDS(false); setActiveTab('help'); }}
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
