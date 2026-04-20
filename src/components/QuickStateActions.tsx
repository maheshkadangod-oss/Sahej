import { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { stateActions, relatableQuotes, type StateAction } from '../data/stateActions';
import { t } from '../strings';

// ---- Per-kind activity bodies ----
function BreathingCircle({ durationSec = 60 }: { durationSec?: number }) {
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const [remaining, setRemaining] = useState(durationSec);

  useEffect(() => {
    const phaseTimer = setInterval(() => {
      setPhase(p => (p === 'in' ? 'out' : 'in'));
    }, 4000);
    const countdown = setInterval(() => {
      setRemaining(r => Math.max(0, r - 1));
    }, 1000);
    return () => {
      clearInterval(phaseTimer);
      clearInterval(countdown);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-6">
      <motion.div
        animate={{ scale: phase === 'in' ? 1.4 : 0.9 }}
        transition={{ duration: 4, ease: 'easeInOut' }}
        className="w-32 h-32 rounded-full bg-brand-rose/30 dark:bg-brand-rose/20 flex items-center justify-center mb-4"
      >
        <div className="w-20 h-20 rounded-full bg-brand-rose/50 dark:bg-brand-rose/40" />
      </motion.div>
      <p className="text-sm text-brand-sage italic mb-2">{phase === 'in' ? 'Breathe in…' : 'Breathe out…'}</p>
      {remaining > 0 && <p className="text-[11px] text-brand-sage/60">{remaining}s</p>}
    </div>
  );
}

function EyesClosedCountdown({ durationSec = 30 }: { durationSec?: number }) {
  const [remaining, setRemaining] = useState(durationSec);
  useEffect(() => {
    const id = setInterval(() => setRemaining(r => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const done = remaining === 0;
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <p className="text-5xl font-serif text-brand-clay mb-3">{done ? '🌱' : remaining}</p>
      <p className="text-sm text-brand-sage italic text-center px-6">
        {done ? "Welcome back. You rested." : "Eyes closed. Hand on belly. You're safe."}
      </p>
    </div>
  );
}

function Grounding() {
  const steps = [
    { sense: '👀 See', prompt: 'Name one thing you can see right now.' },
    { sense: '👂 Hear', prompt: 'Name one thing you can hear.' },
    { sense: '✋ Feel', prompt: 'Name one thing you can feel — your skin, the chair, your breath.' },
  ];
  const [i, setI] = useState(0);
  return (
    <div className="flex flex-col items-center justify-center py-6 px-4 min-h-[220px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="text-center"
        >
          <p className="text-3xl mb-3">{steps[i].sense}</p>
          <p className="text-base text-brand-ink/80 dark:text-brand-cream/80 leading-relaxed mb-6">{steps[i].prompt}</p>
        </motion.div>
      </AnimatePresence>
      {i < steps.length - 1 ? (
        <button
          onClick={() => setI(i + 1)}
          className="px-6 py-2.5 bg-brand-rose/15 text-brand-rose rounded-full text-sm font-medium min-h-[44px]"
        >
          Next
        </button>
      ) : (
        <p className="text-sm text-brand-sage italic mt-2">You're here. That's enough.</p>
      )}
    </div>
  );
}

function RelatableQuote({ dayOfYear }: { dayOfYear: number }) {
  const quote = useMemo(() => {
    // Mix dayOfYear with a small entropy so consecutive visits rotate
    const idx = (dayOfYear * 7 + Math.floor(Date.now() / 3_600_000)) % relatableQuotes.length;
    return relatableQuotes[idx];
  }, [dayOfYear]);
  return (
    <div className="py-6 px-2">
      <p className="text-base text-brand-ink/85 dark:text-brand-cream/85 leading-relaxed italic text-center">
        "{quote}"
      </p>
      <p className="text-[11px] text-brand-sage text-center mt-4">— Another mother, somewhere, today.</p>
    </div>
  );
}

function SafetyPause({ durationSec = 60 }: { durationSec?: number }) {
  const [remaining, setRemaining] = useState(durationSec);
  useEffect(() => {
    const id = setInterval(() => setRemaining(r => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center py-6 px-4">
      <div className="w-16 h-16 bg-brand-rose/20 rounded-full flex items-center justify-center mb-4">
        <span className="text-3xl">🛏️</span>
      </div>
      <p className="text-sm text-brand-ink/80 dark:text-brand-cream/80 text-center leading-relaxed mb-4">
        Put baby somewhere safe. A crib, bassinet, or a blanket on the floor is fine.
        Step one foot away. Take a breath. You did not fail — you paused. That's strong.
      </p>
      <p className="text-2xl font-serif text-brand-clay">{remaining}s</p>
    </div>
  );
}

function ReassurancePanel({ body }: { body: string }) {
  return (
    <div className="py-8 px-4">
      <p className="text-base text-brand-ink/85 dark:text-brand-cream/85 leading-relaxed text-center">
        {body}
      </p>
    </div>
  );
}

// ---- Main component ----
interface QuickStateActionsProps {
  dayOfYear: number;
}

export default function QuickStateActions({ dayOfYear }: QuickStateActionsProps) {
  const [active, setActive] = useState<StateAction | null>(null);

  const close = () => setActive(null);

  return (
    <section className="glass-card rounded-3xl p-5 space-y-4">
      <div>
        <h3 className="text-lg font-medium">{t('feelingStuckTitle')}</h3>
        <p className="text-[11px] text-brand-sage italic">{t('feelingStuckSub')}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {stateActions.map(s => (
          <button
            key={s.id}
            onClick={() => setActive(s)}
            className="flex items-center gap-2 px-3 py-3 bg-white/60 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border border-brand-clay/15 rounded-2xl text-left text-[13px] text-brand-ink dark:text-brand-cream min-h-[48px] press-effect"
          >
            <span className="text-lg shrink-0">{s.emoji}</span>
            <span className="flex-1 leading-tight">{s.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-brand-ink/70 backdrop-blur-sm flex items-end sm:items-center justify-center"
            onClick={(e) => { if (e.target === e.currentTarget) close(); }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 24 }}
              className="w-full sm:max-w-md bg-brand-cream dark:bg-brand-ink rounded-t-3xl sm:rounded-3xl p-6 m-0 sm:m-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-2xl mb-1">{active.emoji}</p>
                  <h3 className="text-lg font-serif">{active.title}</h3>
                </div>
                <button
                  onClick={close}
                  className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label={t('closeAction')}
                >
                  <X className="w-5 h-5 text-brand-sage" />
                </button>
              </div>

              {active.body && active.kind !== 'reassurance' && active.kind !== 'safety' && (
                <p className="text-sm text-brand-sage italic leading-relaxed mb-4">{active.body}</p>
              )}

              {active.kind === 'breathing' && <BreathingCircle durationSec={active.durationSec} />}
              {active.kind === 'eyesClosed' && <EyesClosedCountdown durationSec={active.durationSec} />}
              {active.kind === 'grounding' && <Grounding />}
              {active.kind === 'relatable' && <RelatableQuote dayOfYear={dayOfYear} />}
              {active.kind === 'safety' && <SafetyPause durationSec={active.durationSec} />}
              {active.kind === 'reassurance' && <ReassurancePanel body={active.body} />}

              <button
                onClick={close}
                className="w-full mt-4 py-3 bg-brand-rose/15 text-brand-rose rounded-2xl text-sm font-medium min-h-[48px] press-effect"
              >
                {t('doneAction')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
