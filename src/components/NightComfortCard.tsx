import { Moon } from 'lucide-react';
import { motion } from 'motion/react';
import { t } from '../strings';

interface NightComfortCardProps {
  onTalkToAsha: () => void;
  displayName?: string;
}

export default function NightComfortCard({ onTalkToAsha, displayName = 'mama' }: NightComfortCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-brand-ink/95 text-brand-cream rounded-3xl p-6 shadow-lg"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-brand-gold/20 rounded-full flex items-center justify-center shrink-0">
          <Moon className="w-5 h-5 text-brand-gold" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium mb-1">{t('nightComfortTitle')}</h3>
          <p className="text-sm text-brand-cream/80 leading-relaxed">
            Hi {displayName}. {t('nightComfortBody')}
          </p>
        </div>
      </div>

      <button
        onClick={onTalkToAsha}
        className="w-full py-3 bg-brand-cream/10 hover:bg-brand-cream/15 text-brand-cream rounded-2xl text-sm font-medium press-effect min-h-[48px] border border-brand-cream/20"
      >
        💬 Talk quietly with Asha
      </button>
    </motion.section>
  );
}
