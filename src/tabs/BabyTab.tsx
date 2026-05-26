import React, { useState } from 'react';
import {
  Baby, Syringe, Scale, Utensils, Bell, Check, Plus, Trash2, AlertCircle, Calendar, ChevronDown, Settings,
} from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/cn';
import {
  feedingStages, feedingGoldenRules, feedingDisclaimer, vaccineDisclaimer,
} from '../data/babyCare';
import type { useBabyCare, VaccineState } from '../hooks/useBabyCare';
import type { useFeeding } from '../hooks/useFeeding';
import FeedingCard from '../components/FeedingCard';

interface BabyTabProps {
  babyName?: string;
  babyCare: ReturnType<typeof useBabyCare>;
  feeding: ReturnType<typeof useFeeding>;
  onOpenSettings: () => void;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

const STATE_STYLE: Record<VaccineState, { label: string; cls: string }> = {
  given:      { label: 'Given',     cls: 'bg-brand-sage/15 text-brand-sage' },
  overdue:    { label: 'Overdue',   cls: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300' },
  'due-soon': { label: 'Due soon',  cls: 'bg-brand-gold/20 text-brand-clay' },
  upcoming:   { label: 'Upcoming',  cls: 'bg-black/5 text-brand-sage' },
};

export default React.memo(function BabyTab({ babyName, babyCare, feeding, onOpenSettings }: BabyTabProps) {
  const {
    hasBirthDate, ageMonths, reminders,
    currentFeedingStage,
    weightLog, latestWeight, addWeight, deleteWeight,
    vaccineStatuses, customRecords, markVaccineGiven, unmarkVaccine,
    addCustomVaccine, deleteVaccineRecord,
  } = babyCare;

  const [weightInput, setWeightInput] = useState('');
  const [openStage, setOpenStage] = useState<number | null>(currentFeedingStage?.fromMonth ?? 6);
  const [markingDose, setMarkingDose] = useState<string | null>(null);
  const [markDate, setMarkDate] = useState(todayISO());
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDate, setCustomDate] = useState(todayISO());

  const name = babyName?.trim() || 'Baby';

  return (
    <motion.div key="baby" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-clay/15 rounded-full flex items-center justify-center text-brand-clay shrink-0">
          <Baby className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-medium leading-tight">{name}'s Care</h2>
          <p className="text-[11px] text-brand-sage">
            {ageMonths != null ? `${ageMonths} month${ageMonths === 1 ? '' : 's'} old` : 'Feeding, growth & vaccines'}
          </p>
        </div>
      </div>

      {/* No birth date → gentle prompt (feature still works in browse mode) */}
      {!hasBirthDate && (
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 p-4 bg-brand-gold/10 border border-brand-gold/25 rounded-2xl text-left press-effect min-h-[60px]"
        >
          <Settings className="w-5 h-5 text-brand-clay shrink-0" />
          <p className="text-xs text-brand-ink/75">Add {name === 'Baby' ? "baby's" : `${name}'s`} birth date in Settings to unlock due dates, growth age, and reminders.</p>
        </button>
      )}

      {/* Reminders */}
      {reminders.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium flex items-center gap-2 px-1"><Bell className="w-4 h-4 text-brand-clay" /> Reminders</h3>
          {reminders.map(r => (
            <div
              key={r.id}
              className={cn(
                'flex items-start gap-2 p-3 rounded-2xl border text-xs',
                r.severity === 'overdue'
                  ? 'bg-red-50 border-red-100 text-red-700 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-300'
                  : 'bg-brand-gold/10 border-brand-gold/25 text-brand-ink/80'
              )}
            >
              <AlertCircle className={cn('w-4 h-4 shrink-0 mt-0.5', r.severity === 'overdue' ? 'text-red-400' : 'text-brand-clay')} />
              <span>{r.text}</span>
            </div>
          ))}
        </section>
      )}

      {/* Feeding guide */}
      <section className="glass-card rounded-3xl p-5 space-y-3">
        <h3 className="text-base font-medium flex items-center gap-2"><Utensils className="w-4 h-4 text-brand-clay" /> Feeding guide</h3>

        {ageMonths != null && ageMonths < 6 ? (
          <p className="text-sm text-brand-ink/75 leading-relaxed bg-brand-rose/10 rounded-2xl p-3">
            Under 6 months, breastmilk (or formula) is all {name} needs — no solids yet. Tap a stage below to see what's coming.
          </p>
        ) : currentFeedingStage ? (
          <p className="text-xs text-brand-sage">Showing the stage for {name}'s age — tap any stage to expand.</p>
        ) : (
          <p className="text-xs text-brand-sage">Browse each stage from 6 months onward.</p>
        )}

        <div className="space-y-2">
          {feedingStages.map(stage => {
            const open = openStage === stage.fromMonth;
            const isCurrent = currentFeedingStage?.fromMonth === stage.fromMonth;
            return (
              <div key={stage.fromMonth} className={cn('rounded-2xl border overflow-hidden', isCurrent ? 'border-brand-clay/40 bg-brand-clay/5' : 'border-brand-rose/10 bg-white/30')}>
                <button
                  onClick={() => setOpenStage(open ? null : stage.fromMonth)}
                  className="w-full flex items-center justify-between p-3 text-left min-h-[48px]"
                >
                  <span className="text-sm font-medium flex items-center gap-2">
                    {stage.label}
                    {isCurrent && <span className="text-[9px] bg-brand-clay text-white px-2 py-0.5 rounded-full">now</span>}
                  </span>
                  <ChevronDown className={cn('w-4 h-4 text-brand-sage transition-transform', open && 'rotate-180')} />
                </button>
                {open && (
                  <div className="px-3 pb-3 space-y-2 text-xs text-brand-ink/80">
                    <div className="space-y-1.5">
                      <Info label="How often" value={stage.mealsPerDay} />
                      <Info label="How much" value={stage.quantity} />
                      <Info label="Texture" value={stage.consistency} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-brand-sage mb-1">Foods to try</p>
                      <div className="flex flex-wrap gap-1.5">
                        {stage.foods.map(f => <span key={f} className="bg-brand-rose/10 text-brand-ink/75 px-2 py-1 rounded-full text-[11px]">{f}</span>)}
                      </div>
                    </div>
                    <p className="italic text-brand-sage leading-relaxed">💡 {stage.tip}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <details className="text-xs">
          <summary className="cursor-pointer text-brand-clay font-medium py-1">Safety rules for every stage</summary>
          <ul className="mt-2 space-y-1.5">
            {feedingGoldenRules.map(rule => (
              <li key={rule} className="flex gap-2 text-brand-ink/75"><span className="text-brand-clay">•</span><span>{rule}</span></li>
            ))}
          </ul>
        </details>
        <p className="text-[10px] text-brand-sage/70 italic leading-relaxed">{feedingDisclaimer}</p>
      </section>

      {/* Feeding — live timer, L/R, interval reminder, recent feeds, night summary */}
      <FeedingCard feeding={feeding} />

      {/* Weight tracker */}
      <section className="glass-card rounded-3xl p-5 space-y-3">
        <h3 className="text-base font-medium flex items-center gap-2"><Scale className="w-4 h-4 text-brand-clay" /> Weight tracker</h3>
        {latestWeight && (
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-semibold text-brand-ink">{latestWeight.weightKg}</span>
            <span className="text-sm text-brand-sage">kg · latest{latestWeight.ageMonths != null ? ` (at ${latestWeight.ageMonths} mo)` : ''}</span>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="number" inputMode="decimal" step="0.1" min="0" max="40"
            value={weightInput}
            onChange={e => setWeightInput(e.target.value)}
            placeholder="Weight in kg (e.g., 7.2)"
            className="flex-1 bg-white/60 border border-brand-clay/20 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-clay/30 text-sm min-h-[44px]"
          />
          <button
            onClick={() => { const v = parseFloat(weightInput); if (!isNaN(v)) { addWeight(v); setWeightInput(''); } }}
            disabled={!weightInput.trim()}
            className="px-5 bg-brand-clay text-white rounded-2xl text-sm font-medium press-effect min-h-[44px] disabled:opacity-50 shrink-0"
          >
            Log
          </button>
        </div>
        {weightLog.length > 0 ? (
          <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar">
            {[...weightLog].sort((a, b) => b.timestamp - a.timestamp).map(w => (
              <div key={w.id} className="flex items-center justify-between bg-white/30 rounded-xl px-3 py-2 text-xs">
                <span className="font-medium text-brand-ink">{w.weightKg} kg</span>
                <span className="text-brand-sage">{format(w.timestamp, 'MMM d, yyyy')}{w.ageMonths != null ? ` · ${w.ageMonths} mo` : ''}</span>
                <button onClick={() => deleteWeight(w.id)} aria-label="Delete entry" className="p-1 rounded-full hover:bg-red-50"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-brand-sage italic">No entries yet. Log {name}'s weight monthly to watch growth.</p>
        )}
      </section>

      {/* Vaccinations */}
      <section className="glass-card rounded-3xl p-5 space-y-3">
        <h3 className="text-base font-medium flex items-center gap-2"><Syringe className="w-4 h-4 text-brand-clay" /> Vaccinations</h3>
        <p className="text-[11px] text-brand-sage">Combined India NIS (govt/free) + IAP schedule. Tap a visit to mark it done.</p>

        <div className="space-y-2">
          {vaccineStatuses.map(({ dose, state, dueDate, record }) => {
            const style = STATE_STYLE[state];
            const isMarking = markingDose === dose.id;
            return (
              <div key={dose.id} className={cn('rounded-2xl border p-3', state === 'overdue' ? 'border-red-200 bg-red-50/50 dark:bg-red-900/10' : 'border-brand-rose/10 bg-white/30')}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-brand-ink">{dose.ageLabel}</span>
                      <span className={cn('text-[9px] px-2 py-0.5 rounded-full font-medium', style.cls)}>{style.label}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/5 text-brand-sage">{dose.source === 'both' ? 'NIS · IAP' : dose.source}</span>
                    </div>
                    <p className="text-xs text-brand-ink/70 mt-0.5">{dose.vaccines.join(', ')}</p>
                    {dueDate && state !== 'given' && <p className="text-[10px] text-brand-sage mt-0.5">Due ~{format(dueDate, 'MMM d, yyyy')}</p>}
                    {record && <p className="text-[10px] text-brand-sage mt-0.5">Given {format(new Date(record.givenDate), 'MMM d, yyyy')}</p>}
                    {dose.note && <p className="text-[10px] text-brand-sage/70 italic mt-1">{dose.note}</p>}
                  </div>
                  {state === 'given' ? (
                    <button onClick={() => unmarkVaccine(dose.id)} className="shrink-0 w-8 h-8 rounded-full bg-brand-sage/15 text-brand-sage flex items-center justify-center" aria-label="Undo">
                      <Check className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={() => { setMarkingDose(isMarking ? null : dose.id); setMarkDate(todayISO()); }} className="shrink-0 text-[11px] px-3 py-1.5 rounded-full border border-brand-clay/30 text-brand-clay font-medium min-h-[36px]">
                      {isMarking ? 'Cancel' : 'Mark done'}
                    </button>
                  )}
                </div>
                {isMarking && (
                  <div className="flex gap-2 mt-2">
                    <input type="date" value={markDate} max={todayISO()} onChange={e => setMarkDate(e.target.value)} className="flex-1 bg-white/60 border border-brand-clay/20 rounded-xl py-2 px-3 text-xs min-h-[40px]" />
                    <button onClick={() => { markVaccineGiven(dose, markDate); setMarkingDose(null); }} className="px-4 bg-brand-clay text-white rounded-xl text-xs font-medium min-h-[40px]">Save</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Custom records */}
        {customRecords.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <p className="text-[10px] uppercase tracking-wide text-brand-sage">Your added records</p>
            {customRecords.map(r => (
              <div key={r.id} className="flex items-center justify-between bg-white/30 rounded-xl px-3 py-2 text-xs">
                <div className="min-w-0">
                  <p className="font-medium text-brand-ink truncate">{r.name}</p>
                  <p className="text-brand-sage text-[10px]">{format(new Date(r.givenDate), 'MMM d, yyyy')}{r.notes ? ` · ${r.notes}` : ''}</p>
                </div>
                <button onClick={() => deleteVaccineRecord(r.id)} aria-label="Delete record" className="p-1 rounded-full hover:bg-red-50 shrink-0"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
              </div>
            ))}
          </div>
        )}

        {/* Add custom */}
        {showCustom ? (
          <div className="space-y-2 bg-white/30 rounded-2xl p-3">
            <input type="text" value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Vaccine name (e.g., Flu shot)" maxLength={60} className="w-full bg-white/60 border border-brand-clay/20 rounded-xl py-2.5 px-3 text-sm min-h-[40px] focus:outline-none focus:ring-2 focus:ring-brand-clay/30" />
            <div className="flex gap-2">
              <input type="date" value={customDate} max={todayISO()} onChange={e => setCustomDate(e.target.value)} className="flex-1 bg-white/60 border border-brand-clay/20 rounded-xl py-2.5 px-3 text-xs min-h-[40px]" />
              <button onClick={() => { addCustomVaccine(customName, customDate); setCustomName(''); setCustomDate(todayISO()); setShowCustom(false); }} className="px-4 bg-brand-clay text-white rounded-xl text-xs font-medium min-h-[40px]">Add</button>
              <button onClick={() => setShowCustom(false)} className="px-3 bg-brand-sage/10 text-brand-sage rounded-xl text-xs min-h-[40px]">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowCustom(true)} className="flex items-center gap-2 text-sm text-brand-clay font-medium py-1">
            <Plus className="w-4 h-4" /> Add another vaccine
          </button>
        )}

        <p className="text-[10px] text-brand-sage/70 italic leading-relaxed flex gap-1.5"><Calendar className="w-3 h-3 shrink-0 mt-0.5" />{vaccineDisclaimer}</p>
      </section>
    </motion.div>
  );
});

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 bg-white/40 rounded-xl px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-brand-sage w-20 shrink-0 pt-0.5">{label}</p>
      <p className="text-[12px] text-brand-ink/80 leading-snug flex-1">{value}</p>
    </div>
  );
}
