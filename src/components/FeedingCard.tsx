import { useEffect, useState } from 'react';
import {
  Milk, Play, Pause, Square, Plus, Trash2, Moon, Bell, BellOff, Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/cn';
import {
  formatDuration, formatRelativeTime, summarizeNightHours, useFeeding,
} from '../hooks/useFeeding';
import type { FeedType } from '../types';

interface FeedingCardProps {
  feeding: ReturnType<typeof useFeeding>;
}

export default function FeedingCard({ feeding }: FeedingCardProps) {
  const {
    settings, setIntervalEnabled, setIntervalHours, intervalRecommended,
    active, elapsedSec, liveLeftSec, liveRightSec,
    startTimer, setSide, pauseTimer, resumeTimer, stopAndSave, discardTimer,
    quickLog, deleteFeed,
    feedLog, feedsToday, lastFeed, lastNight, nextFeedAt,
  } = feeding;

  // Save dialog state — surfaced after Stop on a breast feed, or right away for bottle.
  const [savePrompt, setSavePrompt] = useState<null | { type: FeedType }>(null);
  const [volumeMl, setVolumeMl] = useState('');

  const handleStop = () => {
    if (!active) return;
    // If they were timing L/R, it's a breast feed and we can save directly.
    const wasBreast = active.leftSec + active.rightSec + (active.side === 'left' || active.side === 'right' ? 1 : 0) > 0;
    if (wasBreast) {
      stopAndSave({ type: 'breast' });
    } else {
      // Could be a bottle. Ask.
      setSavePrompt({ type: 'bottle' });
    }
  };

  const confirmSave = () => {
    if (!savePrompt) return;
    const ml = parseInt(volumeMl, 10);
    stopAndSave({ type: savePrompt.type, volumeMl: !isNaN(ml) && ml > 0 ? ml : undefined });
    setSavePrompt(null);
    setVolumeMl('');
  };

  // Next-feed countdown — re-renders every minute so the time stays current.
  const [nowTick, setNowTick] = useState(0);
  useEffect(() => {
    if (!nextFeedAt) return;
    const id = window.setInterval(() => setNowTick(t => t + 1), 60_000);
    return () => window.clearInterval(id);
  }, [nextFeedAt]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _nowTick = nowTick; // referenced just to satisfy the deps-of-the-countdown

  const nextLabel = (() => {
    if (!nextFeedAt) return null;
    const diffMs = nextFeedAt - Date.now();
    if (diffMs <= 0) return 'Now — baby may be hungry';
    const m = Math.round(diffMs / 60000);
    const h = Math.floor(m / 60);
    return h > 0 ? `in ${h}h ${m % 60}m` : `in ${m}m`;
  })();

  return (
    <section className="glass-card rounded-3xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium flex items-center gap-2">
          <Milk className="w-4 h-4 text-brand-clay" /> Feeding
        </h3>
        {lastFeed && (
          <span className="text-[11px] text-brand-sage">
            Last fed {formatRelativeTime(lastFeed.timestamp)}
            {feedsToday > 0 && ` · ${feedsToday} today`}
          </span>
        )}
      </div>

      {/* Live timer ---------------------------------------------------------- */}
      {!active && (
        <div className="flex gap-2">
          <button
            onClick={() => startTimer('none')}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-brand-clay text-white rounded-2xl text-sm font-medium press-effect min-h-[48px]"
          >
            <Play className="w-4 h-4" /> Start feed
          </button>
          <button
            onClick={() => quickLog()}
            aria-label="Quick log a feed at this moment"
            className="flex items-center justify-center gap-2 px-4 py-3.5 bg-brand-rose/15 text-brand-ink rounded-2xl text-sm font-medium press-effect min-h-[48px]"
          >
            <Plus className="w-4 h-4" /> Quick log
          </button>
        </div>
      )}

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="bg-brand-cream/70 dark:bg-white/5 border border-brand-clay/20 rounded-2xl p-4 space-y-3"
          >
            {/* Big stopwatch */}
            <div className="text-center">
              <p className="font-serif font-semibold text-brand-ink text-5xl leading-none tabular-nums">
                {formatDuration(elapsedSec)}
              </p>
              <p className="text-[11px] text-brand-sage mt-1">
                {active.paused ? 'paused' : active.side === 'left' ? 'feeding · left' : active.side === 'right' ? 'feeding · right' : 'feeding'}
              </p>
            </div>

            {/* L / R toggle */}
            <div className="grid grid-cols-2 gap-2">
              <SideButton
                active={active.side === 'left'}
                label="Left"
                duration={liveLeftSec}
                onClick={() => setSide(active.side === 'left' ? 'none' : 'left')}
              />
              <SideButton
                active={active.side === 'right'}
                label="Right"
                duration={liveRightSec}
                onClick={() => setSide(active.side === 'right' ? 'none' : 'right')}
              />
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              {active.paused ? (
                <button
                  onClick={resumeTimer}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand-clay text-white rounded-2xl text-sm font-medium press-effect min-h-[44px]"
                >
                  <Play className="w-4 h-4" /> Resume
                </button>
              ) : (
                <button
                  onClick={pauseTimer}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/60 dark:bg-white/10 text-brand-ink rounded-2xl text-sm font-medium press-effect min-h-[44px]"
                >
                  <Pause className="w-4 h-4" /> Pause
                </button>
              )}
              <button
                onClick={handleStop}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand-rose text-white rounded-2xl text-sm font-medium press-effect min-h-[44px]"
              >
                <Square className="w-4 h-4" /> Stop
              </button>
              <button
                onClick={discardTimer}
                aria-label="Discard this feed"
                className="px-3 py-3 bg-black/5 text-brand-sage rounded-2xl text-xs min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottle save dialog ------------------------------------------------- */}
      {savePrompt && (
        <div className="bg-white/40 dark:bg-white/5 rounded-2xl p-3 space-y-2">
          <p className="text-xs text-brand-ink/80">Bottle volume (ml) — optional</p>
          <div className="flex gap-2">
            <input
              type="number" inputMode="numeric" min="0" max="500"
              value={volumeMl} onChange={e => setVolumeMl(e.target.value)}
              placeholder="e.g., 120"
              className="flex-1 bg-white/60 dark:bg-white/10 border border-brand-clay/20 rounded-xl py-2.5 px-3 text-sm min-h-[40px] focus:outline-none focus:ring-2 focus:ring-brand-clay/30"
            />
            <button onClick={confirmSave} className="px-4 bg-brand-clay text-white rounded-xl text-sm font-medium min-h-[40px]">Save</button>
          </div>
        </div>
      )}

      {/* Newborn interval reminder ----------------------------------------- */}
      <div className="bg-white/40 dark:bg-white/5 rounded-2xl p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <Clock className="w-4 h-4 text-brand-clay shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-brand-ink leading-tight">
                Remind me every {settings.intervalHours}h
                {intervalRecommended && <span className="text-[10px] text-brand-sage ml-1">(common for newborns)</span>}
              </p>
              {nextLabel ? (
                <p className="text-[11px] text-brand-sage mt-0.5">Next feed {nextLabel}</p>
              ) : (
                <p className="text-[11px] text-brand-sage mt-0.5">
                  {settings.intervalEnabled ? 'Log a feed to start the countdown.' : 'Off — useful in the first 2 months.'}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setIntervalEnabled(!settings.intervalEnabled)}
            aria-label={settings.intervalEnabled ? 'Disable feed reminder' : 'Enable feed reminder'}
            className={cn(
              'shrink-0 w-12 h-7 rounded-full relative transition-colors',
              settings.intervalEnabled ? 'bg-brand-clay' : 'bg-brand-sage/30',
            )}
          >
            <motion.div animate={{ x: settings.intervalEnabled ? 22 : 2 }} className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm" />
            <span className="sr-only">{settings.intervalEnabled ? 'On' : 'Off'}</span>
            {settings.intervalEnabled ? <Bell className="hidden" /> : <BellOff className="hidden" />}
          </button>
        </div>
        {settings.intervalEnabled && (
          <div className="flex flex-wrap gap-1.5">
            {[2, 2.5, 3, 3.5, 4].map(h => (
              <button
                key={h}
                onClick={() => setIntervalHours(h)}
                className={cn(
                  'text-[11px] px-3 py-1.5 rounded-full font-medium min-h-[32px]',
                  settings.intervalHours === h ? 'bg-brand-clay text-white' : 'bg-black/5 text-brand-sage',
                )}
              >
                {h}h
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Last night summary ------------------------------------------------- */}
      {lastNight.count > 0 && (
        <div className="bg-brand-lavender/10 border border-brand-lavender/20 rounded-2xl p-3 flex items-center gap-3">
          <Moon className="w-4 h-4 text-brand-lavender shrink-0" />
          <p className="text-xs text-brand-ink/80 leading-snug">
            <strong>Last night:</strong> {lastNight.count} feed{lastNight.count === 1 ? '' : 's'}
            {lastNight.avgIntervalMs != null && <> · avg {summarizeNightHours(lastNight.avgIntervalMs)} between</>}.
          </p>
        </div>
      )}

      {/* Recent feeds ------------------------------------------------------- */}
      <div className="space-y-1.5">
        <p className="text-[10px] uppercase tracking-wide text-brand-sage px-1">Recent feeds</p>
        {feedLog.length === 0 ? (
          <p className="text-xs text-brand-sage italic px-1">No feeds yet. Start the timer or tap quick log.</p>
        ) : (
          <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar">
            {feedLog.slice(0, 12).map(f => (
              <div key={f.id} className="flex items-center justify-between bg-white/30 dark:bg-white/5 rounded-xl px-3 py-2 text-xs">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-brand-ink">
                    {f.type === 'breast' ? '🤱' : '🍼'} {format(f.timestamp, 'MMM d · h:mm a')}
                    {(() => { const h = new Date(f.timestamp).getHours(); return h >= 22 || h < 6; })() && (
                      <span className="ml-1 text-[9px] text-brand-lavender">night</span>
                    )}
                  </p>
                  <p className="text-[10px] text-brand-sage truncate">
                    {f.durationSec && `${formatDuration(f.durationSec)} `}
                    {f.breastLeftSec != null && `· L ${formatDuration(f.breastLeftSec)} `}
                    {f.breastRightSec != null && `· R ${formatDuration(f.breastRightSec)} `}
                    {f.volumeMl != null && `· ${f.volumeMl}ml`}
                  </p>
                </div>
                <button
                  onClick={() => deleteFeed(f.id)}
                  aria-label="Delete feed"
                  className="p-1 rounded-full hover:bg-red-50 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function SideButton({ active, label, duration, onClick }: { active: boolean; label: string; duration: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-2xl py-3 px-3 text-sm font-medium transition-colors press-effect min-h-[48px]',
        active ? 'bg-brand-clay text-white' : 'bg-white/60 dark:bg-white/10 text-brand-ink',
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span>{label}</span>
        <span className="text-[11px] tabular-nums opacity-80">{formatDuration(duration)}</span>
      </div>
    </button>
  );
}
