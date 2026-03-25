import { useState } from 'react';
import { PenLine, Check, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/cn';
import { t } from '../strings';
import { COMPANION_SPECIES } from '../data/companionMessages';
import type { CompanionSpecies } from '../types';
import type { useCompanion } from '../hooks/useCompanion';

type CompanionData = ReturnType<typeof useCompanion>;

interface CompanionWidgetProps extends CompanionData {
  setActiveTab: (tab: string) => void;
}

// Setup card for first-time users
function CompanionSetup({ setupCompanion }: { setupCompanion: CompanionData['setupCompanion'] }) {
  const [selectedSpecies, setSelectedSpecies] = useState<CompanionSpecies>('butterfly');
  const [name, setName] = useState('');

  return (
    <section className="glass-card rounded-3xl p-6">
      <h3 className="text-lg font-medium text-center mb-1">{t('companionChoose')}</h3>
      <p className="text-xs text-brand-sage text-center italic mb-5">{t('companionChooseDesc')}</p>

      <div className="flex justify-center gap-3 mb-5">
        {COMPANION_SPECIES.map(s => (
          <motion.button
            key={s.id}
            whileTap={{ scale: 0.85 }}
            onClick={() => setSelectedSpecies(s.id)}
            className={cn(
              'flex flex-col items-center gap-1 p-2 rounded-2xl transition-all min-w-[56px]',
              selectedSpecies === s.id
                ? 'bg-brand-clay/15 ring-2 ring-brand-clay/40'
                : 'bg-white/30 dark:bg-white/5'
            )}
          >
            <span className="text-2xl">{s.emoji}</span>
            <span className="text-[9px] text-brand-sage">{s.label}</span>
          </motion.button>
        ))}
      </div>

      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder={t('companionNamePlaceholder')}
        className="w-full px-4 py-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-brand-sage/20 text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-clay/30 mb-4 min-h-[44px]"
        maxLength={20}
      />

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setupCompanion(selectedSpecies, name)}
        className="w-full py-3 bg-brand-clay text-white rounded-2xl text-sm font-medium press-effect min-h-[44px]"
      >
        {t('companionBegin')}
      </motion.button>
    </section>
  );
}

// Active companion widget
export default function CompanionWidget(props: CompanionWidgetProps) {
  const {
    companion, companionMood, lowMoodStreak, currentMessage,
    currentEmoji, currentTitle, currentLevel, xpProgress,
    isEditing, setIsEditing, tapCompanion, updateCompanionName,
    changeSpecies, setupCompanion, trustedContacts, setActiveTab,
  } = props;

  const [editName, setEditName] = useState('');

  if (!companion) {
    return <CompanionSetup setupCompanion={setupCompanion} />;
  }

  const startEdit = () => {
    setEditName(companion.name);
    setIsEditing(true);
  };
  const finishEdit = () => {
    updateCompanionName(editName);
    setIsEditing(false);
  };

  const moodColor = companionMood === 'happy' ? 'text-brand-gold' : companionMood === 'concern' ? 'text-brand-rose' : 'text-brand-sage';

  return (
    <section className="glass-card rounded-3xl p-6 space-y-4">
      <div className="flex items-start gap-4">
        {/* Companion emoji with floating animation */}
        <motion.button
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          whileTap={{ scale: 1.3, rotate: [0, -8, 8, 0] }}
          onClick={tapCompanion}
          className="text-5xl select-none min-w-[56px] min-h-[56px] flex items-center justify-center"
          aria-label={t('companionTap')}
        >
          {currentEmoji}
        </motion.button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="flex-1 px-2 py-1 rounded-lg bg-white/50 dark:bg-white/5 border border-brand-sage/20 text-sm focus:outline-none min-h-[32px]"
                  maxLength={20}
                  autoFocus
                />
                <button onClick={finishEdit} className="p-1.5 rounded-full hover:bg-black/5">
                  <Check className="w-4 h-4 text-brand-clay" />
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-medium truncate">{companion.name}</h3>
                <button onClick={startEdit} className="p-1 rounded-full hover:bg-black/5 shrink-0">
                  <PenLine className="w-3.5 h-3.5 text-brand-sage/60" />
                </button>
              </>
            )}
          </div>
          <p className={cn('text-xs italic', moodColor)}>{currentTitle}</p>

          {/* XP progress bar */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-brand-sage/15 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-brand-clay"
                initial={false}
                animate={{ width: `${Math.min(xpProgress * 100, 100)}%` }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              />
            </div>
            <span className="text-[10px] text-brand-sage font-medium shrink-0">Lv.{currentLevel}</span>
          </div>
        </div>
      </div>

      {/* Species selector in edit mode */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex justify-center gap-2 pt-2">
              {COMPANION_SPECIES.map(s => (
                <button
                  key={s.id}
                  onClick={() => changeSpecies(s.id)}
                  className={cn(
                    'text-xl p-1.5 rounded-xl transition-all',
                    companion.species === s.id ? 'bg-brand-clay/15 ring-1 ring-brand-clay/40' : 'opacity-50'
                  )}
                >
                  {s.emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speech bubble */}
      {currentMessage && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/40 dark:bg-white/5 rounded-2xl p-3"
        >
          <p className="text-sm text-brand-ink/70 dark:text-brand-cream/70 italic leading-relaxed">
            "{currentMessage}"
          </p>
        </motion.div>
      )}

      {/* SOS section — only when low mood streak AND contacts exist */}
      {lowMoodStreak && trustedContacts.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-brand-rose/10 border border-brand-rose/20 rounded-2xl p-4 space-y-2"
        >
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-brand-rose" />
            <span className="text-sm font-medium text-brand-ink/80">{t('companionSOS')}</span>
          </div>
          <p className="text-xs text-brand-sage">{t('companionSOSDesc')}</p>
          <div className="flex flex-wrap gap-2">
            {trustedContacts.map(c => (
              <a
                key={c.id}
                href={`tel:${c.phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-rose/20 text-brand-ink/80 rounded-xl text-xs font-medium min-h-[36px] active:bg-brand-rose/30 transition-colors"
              >
                <Phone className="w-3 h-3" /> {c.name}
              </a>
            ))}
          </div>
        </motion.div>
      )}
    </section>
  );
}
