import { useEffect, useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';
import { Printer, ArrowLeft } from 'lucide-react';
import type {
  MoodEntry, SleepEntry, WaterEntry, KegelEntry, UserProfile, JournalEntry
} from '../types';
import type { EPDSResult } from '../data/epds';
import { interpretEPDS } from '../data/epds';

// Read-only snapshot from localStorage. No hooks, no writes.
function read<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved) as T;
  } catch { /* corrupted */ }
  return fallback;
}

const moodLabels = ['', 'Very Low', 'Low', 'Neutral', 'Good', 'Great'];

function weeksPostpartum(birthDate?: string): { weeks: number; months: number } | null {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  const diffMs = Date.now() - b.getTime();
  if (diffMs < 0) return null;
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return {
    weeks: Math.floor(totalDays / 7),
    months: Math.floor(totalDays / 30.44),
  };
}

interface DayBucket {
  dateStr: string;       // "Apr 12"
  date: Date;
  moodLevels: number[];
  waterGlasses: number;
  kegelReps: number;
  sleepHours: number | null;
  sleepQuality: number | null;
}

function build30DayBuckets(
  moods: MoodEntry[],
  sleep: SleepEntry[],
  water: WaterEntry[],
  kegel: KegelEntry[]
): DayBucket[] {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const buckets: DayBucket[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = subDays(today, i);
    d.setHours(0, 0, 0, 0);
    const dateKey = d.toDateString();
    const dayMoods = moods.filter(m => new Date(m.timestamp).toDateString() === dateKey);
    const daySleep = sleep.find(s => new Date(s.timestamp).toDateString() === dateKey);
    const dayWater = water.find(w => new Date(w.timestamp).toDateString() === dateKey);
    const dayKegel = kegel.filter(k => new Date(k.timestamp).toDateString() === dateKey);
    buckets.push({
      dateStr: format(d, 'MMM d'),
      date: d,
      moodLevels: dayMoods.map(m => m.level),
      waterGlasses: dayWater?.glasses ?? 0,
      kegelReps: dayKegel.reduce((s, k) => s + k.reps, 0),
      sleepHours: daySleep?.hours ?? null,
      sleepQuality: daySleep?.quality ?? null,
    });
  }
  return buckets;
}

function avg(arr: number[]): number | null {
  if (arr.length === 0) return null;
  return arr.reduce((s, n) => s + n, 0) / arr.length;
}

export default function PrintableReport() {
  const [ready, setReady] = useState(false);

  // Read snapshot once on mount
  const data = useMemo(() => {
    const profile = read<UserProfile | null>('sahej_user_profile', null);
    const moods = read<MoodEntry[]>('sahej_moods', []);
    const sleep = read<SleepEntry[]>('sahej_sleep', []);
    const water = read<WaterEntry[]>('sahej_water', []);
    const kegel = read<KegelEntry[]>('sahej_kegel', []);
    const journal = read<JournalEntry[]>('sahej_journal', []);
    const epdsHistory = read<EPDSResult[]>('sahej_epds_history', []);

    const buckets = build30DayBuckets(moods, sleep, water, kegel);
    const thirtyDayMoods = buckets.flatMap(b => b.moodLevels);
    const last7Buckets = buckets.slice(-7);
    const last7Moods = last7Buckets.flatMap(b => b.moodLevels);
    const sleepValues = buckets.map(b => b.sleepHours).filter((v): v is number => v !== null);

    // Low-mood days (mood level 1 or 2) in last 30 days
    const lowMoodDays = buckets.filter(b => b.moodLevels.some(l => l <= 2)).length;

    // Days without any sleep log (just informational)
    const daysWithSleep = buckets.filter(b => b.sleepHours !== null).length;

    // Most recent journal entries in last 30 days (just dates + first words)
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentJournal = journal
      .filter(j => j.timestamp >= cutoff)
      .slice(0, 5)
      .map(j => ({
        date: format(j.timestamp, 'MMM d'),
        prompt: j.prompt,
        excerpt: j.entry.slice(0, 140) + (j.entry.length > 140 ? '…' : ''),
      }));

    return {
      profile,
      buckets,
      thirtyDayMoodAvg: avg(thirtyDayMoods),
      last7MoodAvg: avg(last7Moods),
      moodCount: thirtyDayMoods.length,
      lowMoodDays,
      avgSleep: avg(sleepValues),
      daysWithSleep,
      totalWater: buckets.reduce((s, b) => s + b.waterGlasses, 0),
      totalKegels: buckets.reduce((s, b) => s + b.kegelReps, 0),
      latestEPDS: epdsHistory[0] || null,
      epdsHistory: epdsHistory.slice(0, 4),
      recentJournal,
    };
  }, []);

  useEffect(() => {
    // Brief paint delay so print preview has a clean snapshot
    const t = setTimeout(() => setReady(true), 150);
    return () => clearTimeout(t);
  }, []);

  const pp = weeksPostpartum(data.profile?.birthDate);
  const displayName = data.profile?.name || 'Mama';
  const latestEPDSInterp = data.latestEPDS ? interpretEPDS(data.latestEPDS) : null;

  // Find max mood per day for chart
  const maxMoodByDay = data.buckets.map(b => b.moodLevels.length > 0 ? Math.max(...b.moodLevels) : null);
  const minMoodByDay = data.buckets.map(b => b.moodLevels.length > 0 ? Math.min(...b.moodLevels) : null);

  return (
    <div className="printable-report bg-white min-h-screen text-gray-900">
      {/* Screen-only toolbar — hidden when printing */}
      <div className="print-hide sticky top-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between z-10">
        <a href="/" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          Back to app
        </a>
        <button
          onClick={() => window.print()}
          disabled={!ready}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium disabled:opacity-40"
        >
          <Printer className="w-4 h-4" />
          Print / Save as PDF
        </button>
      </div>

      <div className="max-w-[780px] mx-auto px-8 py-10 print:px-0 print:py-0">
        {/* Header */}
        <header className="border-b-2 border-gray-900 pb-4 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-serif font-semibold mb-1">Postpartum Wellness Summary</h1>
              <p className="text-sm text-gray-600">
                For <strong>{displayName}</strong>
                {pp ? ` · ${pp.months >= 3 ? `${pp.months} months postpartum` : `Week ${pp.weeks} postpartum`}` : ''}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Generated {format(Date.now(), 'MMMM d, yyyy')} · Last 30 days
              </p>
            </div>
            <div className="text-right text-xs text-gray-500">
              <p className="font-serif italic">Sakthi</p>
              <p>self-report · for clinical review</p>
            </div>
          </div>
        </header>

        {/* Cover note */}
        <section className="mb-6 p-4 bg-gray-50 rounded border border-gray-200 text-sm leading-relaxed">
          <p className="mb-2">
            <strong>For your obstetrician, midwife, or mental health provider.</strong>
          </p>
          <p className="text-gray-700">
            This is a self-reported summary of {displayName}'s mood, sleep, and postpartum wellness
            tracking over the past 30 days. It is not a diagnosis. It is shared to help you ask better
            questions at her visit. All data is entered voluntarily by the patient on her own device.
          </p>
        </section>

        {/* Key numbers */}
        <section className="mb-6">
          <h2 className="text-base font-semibold mb-3 uppercase tracking-wide text-gray-700">At a glance</h2>
          <div className="grid grid-cols-4 gap-3 text-sm">
            <MetricBox
              label="Avg mood (30d)"
              value={data.thirtyDayMoodAvg !== null ? data.thirtyDayMoodAvg.toFixed(1) : '—'}
              sub="out of 5"
            />
            <MetricBox
              label="Avg mood (7d)"
              value={data.last7MoodAvg !== null ? data.last7MoodAvg.toFixed(1) : '—'}
              sub="out of 5"
            />
            <MetricBox
              label="Low-mood days"
              value={`${data.lowMoodDays}`}
              sub="of last 30 days"
            />
            <MetricBox
              label="Avg sleep"
              value={data.avgSleep !== null ? `${data.avgSleep.toFixed(1)}h` : '—'}
              sub={`${data.daysWithSleep} days logged`}
            />
          </div>
        </section>

        {/* EPDS — most important section for a doctor */}
        {data.latestEPDS && latestEPDSInterp && (
          <section className="mb-6 p-4 border-2 border-gray-300 rounded">
            <h2 className="text-base font-semibold mb-2 uppercase tracking-wide text-gray-700">
              EPDS — Edinburgh Postnatal Depression Scale
            </h2>
            <div className="flex items-baseline gap-4 mb-2">
              <div>
                <span className="text-3xl font-serif font-semibold">{data.latestEPDS.totalScore}</span>
                <span className="text-gray-500 text-sm"> / 30</span>
              </div>
              <p className="text-xs text-gray-600">
                Completed {format(data.latestEPDS.completedAt, 'MMM d, yyyy')}
                {data.latestEPDS.selfHarmFlag && (
                  <span className="ml-2 font-semibold text-red-700">
                    · Q10 score {data.latestEPDS.q10Score} — self-harm ideation flagged
                  </span>
                )}
              </p>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{latestEPDSInterp.body}</p>

            {data.epdsHistory.length > 1 && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-600 mb-1">Previous EPDS scores</p>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  {data.epdsHistory.slice(1).map((r, i) => (
                    <li key={i}>
                      {format(r.completedAt, 'MMM d, yyyy')} — score {r.totalScore}/30
                      {r.selfHarmFlag && <span className="ml-1 text-red-700">· Q10: {r.q10Score}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {!data.latestEPDS && (
          <section className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
            EPDS screening has not been completed. Consider administering in-clinic or inviting the
            patient to complete it before her next visit.
          </section>
        )}

        {/* Mood chart — ASCII/CSS bars */}
        <section className="mb-6">
          <h2 className="text-base font-semibold mb-3 uppercase tracking-wide text-gray-700">
            Mood over last 30 days
          </h2>
          <div className="border border-gray-200 rounded p-3">
            <div className="flex items-stretch gap-[2px] h-32 border-b border-gray-300">
              {data.buckets.map((b, i) => {
                const maxL = maxMoodByDay[i];
                const minL = minMoodByDay[i];
                if (maxL === null || minL === null) {
                  return <div key={i} className="flex-1 h-full border-r border-dashed border-gray-100 last:border-r-0" title={`${b.dateStr} — no entry`} />;
                }
                const heightPct = (maxL / 5) * 100;
                const color =
                  maxL <= 2 ? '#b45309' :   // amber-700
                  maxL === 3 ? '#6b7280' :  // gray-500
                  '#047857';                // emerald-700
                return (
                  <div
                    key={i}
                    className="flex-1 h-full flex flex-col justify-end"
                    title={`${b.dateStr} — ${moodLabels[maxL]}`}
                  >
                    <div
                      style={{ height: `${heightPct}%`, backgroundColor: color }}
                      className="w-full rounded-t-sm min-h-[2px]"
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-gray-500">
              <span>{data.buckets[0]?.dateStr}</span>
              <span>{data.buckets[Math.floor(data.buckets.length / 2)]?.dateStr}</span>
              <span>{data.buckets[data.buckets.length - 1]?.dateStr}</span>
            </div>
            <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-600">
              <Legend color="#047857" label="Good–Great (4–5)" />
              <Legend color="#6b7280" label="Neutral (3)" />
              <Legend color="#b45309" label="Low–Very low (1–2)" />
              <Legend color="transparent" borderDashed label="No entry" />
            </div>
          </div>
        </section>

        {/* Daily detail table */}
        <section className="mb-6 print:break-inside-avoid">
          <h2 className="text-base font-semibold mb-3 uppercase tracking-wide text-gray-700">
            Last 14 days — detail
          </h2>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300 text-left">
                <th className="py-1.5 pr-2">Date</th>
                <th className="py-1.5 pr-2">Mood</th>
                <th className="py-1.5 pr-2">Sleep</th>
                <th className="py-1.5 pr-2">Water</th>
                <th className="py-1.5 pr-2">Kegels</th>
              </tr>
            </thead>
            <tbody>
              {data.buckets.slice(-14).reverse().map((b, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-1.5 pr-2 font-medium">{b.dateStr}</td>
                  <td className="py-1.5 pr-2">
                    {b.moodLevels.length > 0
                      ? b.moodLevels.map(l => `${moodLabels[l]} (${l}/5)`).join(', ')
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="py-1.5 pr-2">
                    {b.sleepHours !== null
                      ? `${b.sleepHours}h${b.sleepQuality ? ` · quality ${b.sleepQuality}/5` : ''}`
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="py-1.5 pr-2">
                    {b.waterGlasses > 0 ? `${b.waterGlasses} glasses` : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="py-1.5 pr-2">
                    {b.kegelReps > 0 ? `${b.kegelReps} reps` : <span className="text-gray-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Recent journal entries */}
        {data.recentJournal.length > 0 && (
          <section className="mb-6 print:break-inside-avoid">
            <h2 className="text-base font-semibold mb-3 uppercase tracking-wide text-gray-700">
              Recent journal entries
            </h2>
            <div className="space-y-3 text-sm">
              {data.recentJournal.map((j, i) => (
                <div key={i} className="pl-3 border-l-2 border-gray-300">
                  <p className="text-xs text-gray-500 mb-0.5">{j.date} · {j.prompt}</p>
                  <p className="text-gray-800 leading-relaxed">{j.excerpt}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-8 pt-4 border-t border-gray-300 text-[10px] text-gray-500 leading-relaxed">
          <p className="mb-1">
            <strong>About this report:</strong> All data on this page is self-reported by the patient
            through the Sakthi app. Data is stored locally on the patient's device. This is not a
            diagnostic tool. The EPDS is a validated screening instrument (Cox, Holden, Sagovsky 1987);
            a score ≥ 10 warrants clinical attention; ≥ 13 indicates probable postpartum depression.
            Any non-zero response to Q10 (self-harm) should prompt same-day evaluation regardless of
            total score.
          </p>
          <p>Sakthi · sakthi app · Report generated {format(Date.now(), "MMM d, yyyy 'at' h:mm a")}</p>
        </footer>
      </div>
    </div>
  );
}

function MetricBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border border-gray-200 rounded p-3">
      <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-serif font-semibold leading-none">{value}</p>
      {sub && <p className="text-[10px] text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function Legend({ color, label, borderDashed }: { color: string; label: string; borderDashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={`inline-block w-3 h-3 rounded-sm ${borderDashed ? 'border border-dashed border-gray-400' : ''}`}
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
