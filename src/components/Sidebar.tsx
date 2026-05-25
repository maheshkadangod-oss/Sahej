import { Heart, Calendar, Baby, Brain, MessageCircle, BookOpen, Settings } from 'lucide-react';
import { cn } from '../lib/cn';
import { t } from '../strings';
import type { Tab } from '../types';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  moodsCount: number;
  memoriesCount: number;
  babyAlertCount?: number;
  onOpenSettings: () => void;
}

// Desktop-only vertical navigation. On mobile the BottomNav is used instead.
export default function Sidebar({
  activeTab, setActiveTab, moodsCount, memoriesCount, babyAlertCount, onOpenSettings,
}: SidebarProps) {
  const items: { tab: Tab; icon: typeof Heart; label: string; badge?: number }[] = [
    { tab: 'home', icon: Heart, label: t('home') },
    { tab: 'mood', icon: Calendar, label: t('mood'), badge: moodsCount },
    { tab: 'baby', icon: Baby, label: t('baby'), badge: babyAlertCount },
    { tab: 'memory', icon: Brain, label: t('vault'), badge: memoriesCount },
    { tab: 'chat', icon: MessageCircle, label: t('asha') },
    { tab: 'help', icon: BookOpen, label: t('help') },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col w-60 shrink-0 h-[100dvh] sticky top-0 px-4 py-8 border-r border-brand-clay/10">
      <div className="px-3 mb-8">
        <h1 className="text-3xl font-serif font-semibold text-brand-ink leading-none">{t('appName')}</h1>
        <p className="text-brand-sage text-xs italic mt-1.5">{t('tagline')}</p>
      </div>

      <nav className="flex flex-col gap-1 flex-1" aria-label="Main navigation">
        {items.map(({ tab, icon: Icon, label, badge }) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-colors press-effect text-left',
                active ? 'bg-brand-clay text-white' : 'text-brand-ink/70 hover:bg-black/5',
              )}
            >
              <span className="relative shrink-0">
                <Icon className="w-5 h-5" />
                {badge !== undefined && badge > 0 && (
                  <span
                    className={cn(
                      'absolute -top-1.5 -right-2 text-[8px] font-bold rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-0.5',
                      active ? 'bg-white text-brand-clay' : 'bg-brand-rose text-white',
                    )}
                    aria-label={`${badge} items`}
                  >
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </span>
              {label}
            </button>
          );
        })}
      </nav>

      <button
        onClick={onOpenSettings}
        className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium text-brand-ink/70 hover:bg-black/5 transition-colors press-effect text-left mt-2"
      >
        <Settings className="w-5 h-5 shrink-0" />
        {t('settings')}
      </button>
    </aside>
  );
}
