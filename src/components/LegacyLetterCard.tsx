import { useState } from 'react';
import { motion } from 'motion/react';
import { PenLine } from 'lucide-react';
import { t } from '../strings';
import type { LegacyLetter } from '../types';

interface Props {
  todayLetterPrompt: string;
  todayLetter: LegacyLetter | undefined;
  onSave: (content: string) => void;
}

export default function LegacyLetterCard({ todayLetterPrompt, todayLetter, onSave }: Props) {
  const [input, setInput] = useState('');

  if (todayLetter) {
    return (
      <section className="glass-card rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">💌</span>
          <h3 className="text-lg font-medium">{t('legacyLetterTitle')}</h3>
        </div>
        <div className="bg-brand-rose/5 border border-brand-rose/10 rounded-2xl p-4">
          <p className="text-[10px] text-brand-sage italic mb-2">{todayLetter.prompt}</p>
          <p className="text-sm text-brand-ink/80 leading-relaxed italic">"{todayLetter.content}"</p>
        </div>
        <p className="text-[10px] text-brand-sage text-center mt-2">Saved to your Time Capsule</p>
      </section>
    );
  }

  return (
    <section className="glass-card rounded-3xl p-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">💌</span>
        <h3 className="text-lg font-medium">{t('legacyLetterTitle')}</h3>
      </div>
      <div className="bg-brand-rose/5 border border-brand-rose/10 rounded-2xl p-4 mb-3">
        <p className="text-sm text-brand-ink/70 italic">"{todayLetterPrompt}"</p>
      </div>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder={t('legacyLetterPlaceholder')}
        rows={3}
        className="w-full bg-white/40 dark:bg-white/5 border border-brand-rose/15 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose/20 placeholder:text-brand-sage/40 resize-none mb-3"
      />
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => { onSave(input); setInput(''); }}
        disabled={!input.trim()}
        className="w-full py-3 bg-brand-rose/15 text-brand-rose rounded-2xl text-sm font-medium disabled:opacity-40 press-effect min-h-[44px] flex items-center justify-center gap-2"
      >
        <PenLine className="w-4 h-4" />
        {t('legacyLetterSave')}
      </motion.button>
    </section>
  );
}
