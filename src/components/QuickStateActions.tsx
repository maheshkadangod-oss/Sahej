import { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/cn';
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
    { sense: '👀', label: 'See', prompt: 'Name one thing you can see right now.', placeholder: 'e.g. the lamp, baby\'s hand, a shadow…' },
    { sense: '👂', label: 'Hear', prompt: 'Name one thing you can hear.', placeholder: 'e.g. a fan, breathing, traffic…' },
    { sense: '✋', label: 'Feel', prompt: 'Name one thing you can feel — skin, chair, breath.', placeholder: 'e.g. warmth, the blanket, my heartbeat…' },
  ];
  const [i, setI] = useState(0);
  const [entries, setEntries] = useState<string[]>(['', '', '']);
  const [done, setDone] = useState(false);

  const currentEntry = entries[i] || '';
  const canProceed = currentEntry.trim().length > 0;

  const updateEntry = (v: string) => {
    const next = [...entries];
    next[i] = v;
    setEntries(next);
  };

  const advance = () => {
    if (!canProceed) return;
    if (i < steps.length - 1) {
      setI(i + 1);
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-6 px-4 text-center space-y-3"
      >
        <p className="text-3xl">🌿</p>
        <p className="text-base text-brand-ink/85 dark:text-brand-cream/85 leading-relaxed">
          You named what's around you. Your senses are here. You are here.
        </p>
        <div className="bg-white/40 dark:bg-white/5 rounded-2xl p-4 space-y-1.5 text-sm text-brand-ink/75 dark:text-brand-cream/75 text-left">
          {steps.map((s, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-base">{s.sense}</span>
              <span className="flex-1 italic">"{entries[idx]}"</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-brand-sage italic">That's grounding. That's enough.</p>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col py-6 px-2 min-h-[240px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="flex-1"
        >
          <div className="text-center mb-4">
            <p className="text-4xl mb-2">{steps[i].sense}</p>
            <p className="text-xs uppercase tracking-wide text-brand-sage font-medium">{steps[i].label}</p>
          </div>
          <p className="text-base text-brand-ink/85 dark:text-brand-cream/85 leading-relaxed text-center mb-4">
            {steps[i].prompt}
          </p>
          <input
            type="text"
            value={currentEntry}
            onChange={(e) => updateEntry(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && canProceed) advance(); }}
            placeholder={steps[i].placeholder}
            autoFocus
            maxLength={60}
            enterKeyHint={i < steps.length - 1 ? 'next' : 'done'}
            className="w-full bg-white/60 dark:bg-white/5 border border-brand-clay/20 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-rose/30 text-base text-center"
          />

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  idx === i ? 'w-6 bg-brand-rose' : idx < i ? 'w-1.5 bg-brand-rose/50' : 'w-1.5 bg-brand-sage/25'
                )}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <button
        onClick={advance}
        disabled={!canProceed}
        className="mt-4 w-full py-3 bg-brand-rose text-white rounded-full text-sm font-medium min-h-[48px] disabled:opacity-40 disabled:cursor-not-allowed press-effect transition-opacity"
      >
        {i < steps.length - 1 ? 'Next' : 'Done'}
      </button>
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

      <motion.div
        className="grid grid-cols-2 gap-2"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.04 } },
        }}
      >
        {stateActions.map(s => (
          <motion.button
            key={s.id}
            variants={{
              hidden: { opacity: 0, scale: 0.95, y: 6 },
              visible: { opacity: 1, scale: 1, y: 0 },
            }}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 350, damping: 20 }}
            onClick={() => setActive(s)}
            className="flex items-center gap-2 px-3 py-3 bg-white/60 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border border-brand-clay/15 rounded-2xl text-left text-[13px] text-brand-ink dark:text-brand-cream min-h-[48px] press-effect"
          >
            <span className="text-lg shrink-0">{s.emoji}</span>
            <span className="flex-1 leading-tight">{s.label}</span>
          </motion.button>
        ))}
      </motion.div>

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
