import { motion } from 'motion/react';
import { cn } from '../lib/cn';
import { t } from '../strings';
import { BADGE_DEFINITIONS } from '../hooks/useGamification';
import type { BadgeId, EarnedBadge } from '../types';

interface Props {
  earnedBadges: EarnedBadge[];
  badgeProgress: Map<BadgeId, number>;
  markBadgeSeen: (id: BadgeId) => void;
}

export default function AchievementBadges({ earnedBadges, badgeProgress, markBadgeSeen }: Props) {
  const earnedIds = new Set(earnedBadges.map(b => b.id));
  const unseenIds = new Set(earnedBadges.filter(b => !b.seen).map(b => b.id));

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <span className="text-lg">🏅</span>
        <h3 className="text-lg font-medium">{t('achievements')}</h3>
        <span className="text-xs text-brand-sage bg-brand-sage/10 px-2 py-0.5 rounded-full ml-auto">
          {earnedBadges.length}/{BADGE_DEFINITIONS.length}
        </span>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1 custom-scrollbar">
        {BADGE_DEFINITIONS.map(badge => {
          const earned = earnedIds.has(badge.id);
          const unseen = unseenIds.has(badge.id);
          const progress = badgeProgress.get(badge.id) || 0;
          const pct = Math.min(100, Math.round((progress / badge.threshold) * 100));

          return (
            <motion.button
              key={badge.id}
              onClick={() => unseen && markBadgeSeen(badge.id)}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "flex flex-col items-center gap-1.5 min-w-[72px] p-2.5 rounded-2xl transition-all shrink-0",
                earned
                  ? "bg-brand-gold/10 border border-brand-gold/20"
                  : "bg-white/30 dark:bg-white/5 border border-brand-clay/10 opacity-50"
              )}
            >
              <div className="relative">
                {unseen && (
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 bg-brand-gold/30 rounded-full"
                  />
                )}
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-xl",
                  earned ? "bg-brand-gold/20" : "bg-brand-sage/10"
                )}>
                  {earned ? badge.emoji : '🔒'}
                </div>
                {unseen && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand-rose rounded-full border-2 border-brand-cream" />
                )}
              </div>
              <span className={cn(
                "text-[9px] font-medium text-center leading-tight",
                earned ? "text-brand-ink/80" : "text-brand-sage/60"
              )}>
                {t(badge.label)}
              </span>
              {!earned && (
                <div className="w-full h-1 bg-brand-sage/10 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-gold/40 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
