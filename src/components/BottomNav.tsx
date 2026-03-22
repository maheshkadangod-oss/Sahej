import React from 'react';
import { Heart, Calendar, Brain, MessageCircle, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/cn';
import { t } from '../strings';
import type { Tab } from '../types';

function NavButton({ active, onClick, icon: Icon, label, badge }: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={cn(
        "flex flex-col items-center gap-1 transition-all min-w-[48px] min-h-[48px] py-1 press-effect relative",
        active ? "text-brand-clay scale-110" : "text-brand-sage opacity-60"
      )}
    >
      <div className="relative">
        <Icon className="w-5 h-5" />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1.5 -right-2.5 bg-brand-rose text-white text-[7px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5" aria-label={`${badge} items`}>
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className="text-[9px] font-medium">{label}</span>
      {active && (
        <motion.div layoutId="nav-dot" className="w-1 h-1 bg-brand-clay rounded-full" />
      )}
    </button>
  );
}

interface BottomNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  moodsCount: number;
  memoriesCount: number;
}

export default React.memo(function BottomNav({ activeTab, setActiveTab, moodsCount, memoriesCount }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-brand-clay/10 px-4 py-3 flex justify-between items-center z-20 safe-bottom" role="navigation" aria-label="Main navigation">
      <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={Heart} label={t('home')} />
      <NavButton active={activeTab === 'mood'} onClick={() => setActiveTab('mood')} icon={Calendar} label={t('mood')} badge={moodsCount > 0 ? moodsCount : undefined} />
      <NavButton active={activeTab === 'memory'} onClick={() => setActiveTab('memory')} icon={Brain} label={t('vault')} badge={memoriesCount > 0 ? memoriesCount : undefined} />
      <NavButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={MessageCircle} label={t('asha')} />
      <NavButton active={activeTab === 'help'} onClick={() => setActiveTab('help')} icon={BookOpen} label={t('help')} />
    </nav>
  );
});
