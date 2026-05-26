import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { differenceInDays, format, startOfDay } from 'date-fns';
import { usePersistedState } from './usePersistedState';
import type { FeedEntry, FeedSettings, FeedType } from '../types';

// A "night feed" is anything between these hours (local time).
const NIGHT_START_HOUR = 22; // 10pm
const NIGHT_END_HOUR = 6;    // 6am — also the cut-off for "last night"

// Live stopwatch state for an in-progress feed. Persisted to localStorage so a tab close /
// reload mid-feed doesn't lose timing — crucial during 3am bleary-eyed feeds.
interface ActiveFeed {
  /** Absolute start time of the whole feed (epoch ms). */
  startedAt: number;
  /** Whether the stopwatch is currently paused. */
  paused: boolean;
  /** Side currently being timed; 'none' for bottle / unspecified. */
  side: 'left' | 'right' | 'none';
  /** When the current side-segment started (epoch ms). null when paused. */
  segmentStartedAt: number | null;
  /** Accumulated seconds per side (excluding current segment). */
  leftSec: number;
  rightSec: number;
  noneSec: number;
}

const ACTIVE_KEY = 'sahej_active_feed';

function loadActive(): ActiveFeed | null {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    return raw ? (JSON.parse(raw) as ActiveFeed) : null;
  } catch { return null; }
}

function saveActive(a: ActiveFeed | null) {
  try {
    if (a) localStorage.setItem(ACTIVE_KEY, JSON.stringify(a));
    else localStorage.removeItem(ACTIVE_KEY);
  } catch { /* quota */ }
}

interface UseFeedingArgs {
  babyName?: string;
  ageMonths?: number | null;
  showToast: (msg: string) => void;
}

export function useFeeding({ babyName, ageMonths, showToast }: UseFeedingArgs) {
  const [feedLog, setFeedLog] = usePersistedState<FeedEntry[]>('sahej_feed_log', []);
  const [settings, setSettings] = usePersistedState<FeedSettings>('sahej_feed_settings', {
    intervalEnabled: false,
    intervalHours: 3,
  });

  // Live timer ----------------------------------------------------------------------------
  const [active, setActive] = useState<ActiveFeed | null>(() => loadActive());
  const [, setTick] = useState(0); // forces re-render every second while a timer runs

  // Persist active state on every change.
  useEffect(() => { saveActive(active); }, [active]);

  // Tick once a second while a timer is running and not paused.
  useEffect(() => {
    if (!active || active.paused) return;
    const id = window.setInterval(() => setTick(t => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [active?.startedAt, active?.paused, active?.side]);

  /** Flush the running side segment's elapsed time into the side accumulator. */
  const flushSegment = (a: ActiveFeed, now = Date.now()): ActiveFeed => {
    if (a.paused || a.segmentStartedAt == null) return a;
    const segSec = Math.max(0, Math.floor((now - a.segmentStartedAt) / 1000));
    return {
      ...a,
      leftSec:  a.leftSec  + (a.side === 'left'  ? segSec : 0),
      rightSec: a.rightSec + (a.side === 'right' ? segSec : 0),
      noneSec:  a.noneSec  + (a.side === 'none'  ? segSec : 0),
      segmentStartedAt: now,
    };
  };

  /** Total elapsed seconds of the current feed (accumulated + the live segment). */
  const elapsedSec = useMemo(() => {
    if (!active) return 0;
    const base = active.leftSec + active.rightSec + active.noneSec;
    if (active.paused || active.segmentStartedAt == null) return base;
    const live = Math.max(0, Math.floor((Date.now() - active.segmentStartedAt) / 1000));
    return base + live;
    // re-evaluated each render — the tick effect above keeps renders flowing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, active?.leftSec, active?.rightSec, active?.noneSec, active?.paused, active?.segmentStartedAt]);

  const liveLeftSec = useMemo(() => {
    if (!active) return 0;
    if (active.side === 'left' && !active.paused && active.segmentStartedAt != null) {
      return active.leftSec + Math.max(0, Math.floor((Date.now() - active.segmentStartedAt) / 1000));
    }
    return active.leftSec;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
  const liveRightSec = useMemo(() => {
    if (!active) return 0;
    if (active.side === 'right' && !active.paused && active.segmentStartedAt != null) {
      return active.rightSec + Math.max(0, Math.floor((Date.now() - active.segmentStartedAt) / 1000));
    }
    return active.rightSec;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const startTimer = useCallback((initialSide: 'left' | 'right' | 'none' = 'none') => {
    const now = Date.now();
    setActive({
      startedAt: now,
      paused: false,
      side: initialSide,
      segmentStartedAt: now,
      leftSec: 0, rightSec: 0, noneSec: 0,
    });
  }, []);

  const setSide = useCallback((side: 'left' | 'right' | 'none') => {
    setActive(prev => {
      if (!prev) return prev;
      const flushed = flushSegment(prev);
      return { ...flushed, side };
    });
  }, []);

  const pauseTimer = useCallback(() => {
    setActive(prev => {
      if (!prev || prev.paused) return prev;
      const flushed = flushSegment(prev);
      return { ...flushed, paused: true, segmentStartedAt: null };
    });
  }, []);

  const resumeTimer = useCallback(() => {
    setActive(prev => {
      if (!prev || !prev.paused) return prev;
      return { ...prev, paused: false, segmentStartedAt: Date.now() };
    });
  }, []);

  /** Stop the timer and persist as a FeedEntry. Type + extras come from the save dialog. */
  const stopAndSave = useCallback((opts: { type: FeedType; volumeMl?: number; notes?: string } = { type: 'breast' }) => {
    setActive(prev => {
      if (!prev) return prev;
      const flushed = flushSegment(prev);
      const total = flushed.leftSec + flushed.rightSec + flushed.noneSec;
      if (total < 5) {
        // Less than 5 seconds — likely a mis-tap. Discard quietly.
        showToast('Feed too short to save — discarded.');
        return null;
      }
      const isBreast = opts.type === 'breast' || flushed.leftSec + flushed.rightSec > 0;
      const entry: FeedEntry = {
        id: String(flushed.startedAt),
        timestamp: flushed.startedAt,
        type: isBreast ? 'breast' : 'bottle',
        durationSec: total,
        ...(isBreast
          ? {
              breastLeftSec: flushed.leftSec || undefined,
              breastRightSec: flushed.rightSec || undefined,
            }
          : { volumeMl: opts.volumeMl }),
        ...(opts.notes ? { notes: opts.notes } : {}),
      };
      setFeedLog(prevLog => [entry, ...prevLog]);
      showToast(`Feed logged · ${Math.floor(total / 60)} min`);
      return null;
    });
  }, [setFeedLog, showToast]);

  const discardTimer = useCallback(() => {
    setActive(null);
    showToast('Discarded.');
  }, [showToast]);

  // Quick log — one tap, ideal for half-awake 3am moments. Records "fed at now" with no duration.
  const quickLog = useCallback((type: FeedType = 'breast') => {
    const entry: FeedEntry = {
      id: String(Date.now()),
      timestamp: Date.now(),
      type,
    };
    setFeedLog(prev => [entry, ...prev]);
    showToast('Logged 💛');
  }, [setFeedLog, showToast]);

  const addManualFeed = useCallback((entry: Omit<FeedEntry, 'id'> & { id?: string }) => {
    const full: FeedEntry = { id: entry.id || String(Date.now()), ...entry };
    setFeedLog(prev => [full, ...prev].sort((a, b) => b.timestamp - a.timestamp));
    showToast('Feed added');
  }, [setFeedLog, showToast]);

  const deleteFeed = useCallback((id: string) => {
    setFeedLog(prev => prev.filter(f => f.id !== id));
  }, [setFeedLog]);

  // Settings -----------------------------------------------------------------------------
  const setIntervalEnabled = useCallback((on: boolean) => {
    setSettings(prev => ({ ...prev, intervalEnabled: on }));
  }, [setSettings]);
  const setIntervalHours = useCallback((h: number) => {
    const clamped = Math.max(2, Math.min(4, Math.round(h * 2) / 2)); // 2.0 / 2.5 / 3.0 / 3.5 / 4.0
    setSettings(prev => ({ ...prev, intervalHours: clamped }));
  }, [setSettings]);

  // Derived state ------------------------------------------------------------------------
  const lastFeed = useMemo(
    () => (feedLog.length ? [...feedLog].sort((a, b) => b.timestamp - a.timestamp)[0] : null),
    [feedLog],
  );

  const feedsToday = useMemo(() => {
    const dayStart = startOfDay(new Date()).getTime();
    return feedLog.filter(f => f.timestamp >= dayStart).length;
  }, [feedLog]);

  /** Feeds from the last completed night (22:00 prev day → 06:00 today). */
  const lastNight = useMemo(() => {
    const now = new Date();
    const end = new Date(now); end.setHours(NIGHT_END_HOUR, 0, 0, 0);
    if (now.getHours() >= NIGHT_END_HOUR) {
      // we're past 6am — "last night" is the just-ended one starting at 22:00 yesterday
    } else {
      // currently before 6am — still in night, use yesterday 22:00 → now
      end.setTime(now.getTime());
    }
    const start = new Date(end); start.setDate(end.getDate() - 1); start.setHours(NIGHT_START_HOUR, 0, 0, 0);
    const inWindow = feedLog.filter(f => f.timestamp >= start.getTime() && f.timestamp <= end.getTime());
    inWindow.sort((a, b) => a.timestamp - b.timestamp);
    let avgIntervalMs: number | null = null;
    if (inWindow.length > 1) {
      const gaps: number[] = [];
      for (let i = 1; i < inWindow.length; i++) gaps.push(inWindow[i].timestamp - inWindow[i - 1].timestamp);
      avgIntervalMs = gaps.reduce((s, g) => s + g, 0) / gaps.length;
    }
    return { count: inWindow.length, avgIntervalMs, entries: inWindow };
  }, [feedLog]);

  /** Next-feed countdown when the recurring interval is on. */
  const nextFeedAt = useMemo(() => {
    if (!settings.intervalEnabled || !lastFeed) return null;
    return lastFeed.timestamp + settings.intervalHours * 60 * 60 * 1000;
  }, [settings.intervalEnabled, settings.intervalHours, lastFeed]);

  /** Newborn-window hint: interval reminders are most useful in the first ~2 months. */
  const intervalRecommended = ageMonths == null || ageMonths < 2;

  // Push reminders for the existing /api/push backend ------------------------------------
  // One reminder at the next-feed time (if enabled). Re-syncs whenever lastFeed changes.
  const pushReminders = useMemo(() => {
    if (!nextFeedAt) return [];
    if (nextFeedAt <= Date.now()) return []; // due already; in-app handles
    const name = babyName?.trim() || 'baby';
    return [{
      id: 'feed-next',
      fireAt: nextFeedAt,
      title: '🍼 Time for the next feed',
      body: `${name} may be ready for the next feed (~${settings.intervalHours}h since the last one).`,
    }];
  }, [nextFeedAt, babyName, settings.intervalHours]);

  // Refs for components that want to know if a timer is "active" (badge etc.)
  const timerActive = !!active;
  const timerRef = useRef<ActiveFeed | null>(active);
  useEffect(() => { timerRef.current = active; }, [active]);

  return {
    // log + settings
    feedLog, deleteFeed, addManualFeed, quickLog,
    settings, setIntervalEnabled, setIntervalHours,
    intervalRecommended,
    // live timer
    active, timerActive, elapsedSec, liveLeftSec, liveRightSec,
    startTimer, setSide, pauseTimer, resumeTimer, stopAndSave, discardTimer,
    // derived
    lastFeed, feedsToday, lastNight, nextFeedAt,
    // push
    pushReminders,
  };
}

// Helpers exposed for the UI -----------------------------------------------------------
export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatRelativeTime(ts: number, now = Date.now()): string {
  const diffMin = Math.floor((now - ts) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ${diffMin % 60}m ago`;
  const days = differenceInDays(now, ts);
  if (days < 7) return `${days}d ago`;
  return format(ts, 'MMM d');
}

export function summarizeNightHours(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

