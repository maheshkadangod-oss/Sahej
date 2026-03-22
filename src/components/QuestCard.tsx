import { useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/cn';
import { t } from '../strings';
import { QUEST_DEFINITIONS } from '../hooks/useGamification';
import type { QuestId, ActiveQuest } from '../types';

interface Props {
  activeQuest: ActiveQuest | null;
  startQuest: (id: QuestId) => void;
  abandonQuest: () => void;
  questDayIndex: number;
  questCompleted: boolean;
  todayQuestMet: boolean;
}

export default function QuestCard({ activeQuest, startQuest, abandonQuest, questDayIndex, questCompleted, todayQuestMet }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  if (questCompleted && activeQuest) {
    return (
      <section className="glass-card rounded-3xl p-5">
        <div className="text-center space-y-3">
          <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-4xl">🎉</motion.p>
          <h3 className="text-sm font-medium">{t('questComplete')}</h3>
          <p className="text-xs text-brand-sage">{t(QUEST_DEFINITIONS.find(q => q.id === activeQuest.id)?.label || '')}</p>
          <button
            onClick={() => { abandonQuest(); setShowPicker(true); }}
            className="text-xs text-brand-clay underline underline-offset-2"
          >
            Start another
          </button>
        </div>
      </section>
    );
  }

  if (activeQuest) {
    const questDef = QUEST_DEFINITIONS.find(q => q.id === activeQuest.id);
    const dayNum = Math.min(questDayIndex + 1, 7);

    return (
      <section className="glass-card rounded-3xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <div>
              <h3 className="text-sm font-medium">{t(questDef?.label || '')}</h3>
              <p className="text-[10px] text-brand-sage">{t('questDay')} {dayNum} of 7</p>
            </div>
          </div>
          <button onClick={abandonQuest} className="text-[10px] text-brand-sage/50 underline">{t('questAbandon')}</button>
        </div>
        <div className="flex gap-1.5 justify-center">
          {Array.from({ length: 7 }).map((_, i) => {
            const dayDate = new Date(activeQuest.startDate);
            dayDate.setDate(dayDate.getDate() + i);
            const dayStr = dayDate.toDateString();
            const completed = activeQuest.completedDays.includes(dayStr);
            const isToday = i === questDayIndex;

            return (
              <motion.div
                key={i}
                animate={completed ? { scale: [0.8, 1.1, 1] } : {}}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                  completed
                    ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                    : isToday
                      ? "bg-brand-clay/15 text-brand-clay border-2 border-brand-clay/30"
                      : "bg-brand-sage/5 text-brand-sage/40"
                )}
              >
                {completed ? '✓' : i + 1}
              </motion.div>
            );
          })}
        </div>
        {todayQuestMet && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-green-500 text-center mt-2 font-medium">
            Today's goal met! ✨
          </motion.p>
        )}
      </section>
    );
  }

  // Quest picker
  if (!showPicker) {
    return (
      <section className="glass-card rounded-3xl p-5">
        <button onClick={() => setShowPicker(true)} className="w-full flex items-center gap-3">
          <span className="text-lg">🎯</span>
          <div className="text-left">
            <h3 className="text-sm font-medium">{t('questTitle')}</h3>
            <p className="text-[10px] text-brand-sage">Start a 7-day challenge</p>
          </div>
        </button>
      </section>
    );
  }

  return (
    <section className="glass-card rounded-3xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">🎯</span>
        <h3 className="text-sm font-medium">{t('questTitle')}</h3>
      </div>
      <div className="space-y-2">
        {QUEST_DEFINITIONS.map(quest => (
          <button
            key={quest.id}
            onClick={() => { startQuest(quest.id); setShowPicker(false); }}
            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/40 dark:bg-white/5 border border-brand-clay/10 hover:bg-brand-clay/5 transition-all press-effect text-left min-h-[48px]"
          >
            <div className="flex-1">
              <p className="text-xs font-medium">{t(quest.label)}</p>
              <p className="text-[10px] text-brand-sage">{t(quest.description)}</p>
            </div>
            <span className="text-xs text-brand-clay font-medium">{t('questStart')}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
