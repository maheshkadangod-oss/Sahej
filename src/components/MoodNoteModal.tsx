import { motion, AnimatePresence } from 'motion/react';
import { t } from '../strings';

interface MoodNoteModalProps {
  showMoodNote: boolean;
  pendingMoodLevel: number | null;
  moodNoteInput: string;
  setMoodNoteInput: (v: string) => void;
  onConfirm: () => void;
  onSkip: () => void;
  moodLabel: (level: number) => string;
}

export default function MoodNoteModal({
  showMoodNote, pendingMoodLevel, moodNoteInput, setMoodNoteInput,
  onConfirm, onSkip, moodLabel
}: MoodNoteModalProps) {
  return (
    <AnimatePresence>
      {showMoodNote && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center px-6"
          onClick={(e) => { if (e.target === e.currentTarget) onSkip(); }}
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
                onClick={onSkip}
                className="flex-1 py-3 border border-brand-sage/20 rounded-2xl text-sm text-brand-sage min-h-[44px]"
              >
                {t('skip')}
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3 bg-brand-clay text-white rounded-2xl text-sm font-medium press-effect min-h-[44px]"
              >
                {t('save')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
