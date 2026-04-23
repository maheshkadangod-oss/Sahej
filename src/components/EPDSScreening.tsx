import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, AlertCircle, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import {
  epdsQuestions,
  epdsIntro,
  scoreEPDS,
  interpretEPDS,
  type EPDSResult,
} from '../data/epds';
import ClinicalByline from './ClinicalByline';

const HISTORY_KEY = 'sahej_epds_history';

interface EPDSScreeningProps {
  show: boolean;
  onClose: () => void;
  onViewHelplines: () => void;
}

type Stage = 'intro' | 'questions' | 'result';

function loadHistory(): EPDSResult[] {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* corrupted */ }
  return [];
}

function saveResult(result: EPDSResult) {
  try {
    const history = loadHistory();
    history.unshift(result);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 24)));
  } catch { /* quota */ }
}

export default function EPDSScreening({ show, onClose, onViewHelplines }: EPDSScreeningProps) {
  const [stage, setStage] = useState<Stage>('intro');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(10).fill(-1));
  const [result, setResult] = useState<EPDSResult | null>(null);
  const [history, setHistory] = useState<EPDSResult[]>([]);

  useEffect(() => {
    if (show) {
      setStage('intro');
      setCurrent(0);
      setAnswers(new Array(10).fill(-1));
      setResult(null);
      setHistory(loadHistory());
    }
  }, [show]);

  const selectAnswer = (score: number) => {
    const next = [...answers];
    next[current] = score;
    setAnswers(next);
    // Auto-advance after a beat
    setTimeout(() => {
      if (current < epdsQuestions.length - 1) {
        setCurrent(current + 1);
      } else {
        finish(next);
      }
    }, 280);
  };

  const finish = (finalAnswers: number[]) => {
    const r = scoreEPDS(finalAnswers);
    setResult(r);
    saveResult(r);
    setStage('result');
  };

  const goBack = () => {
    if (current > 0) setCurrent(current - 1);
  };

  const progress = ((current + 1) / epdsQuestions.length) * 100;
  const q = epdsQuestions[current];
  const interpretation = result ? interpretEPDS(result) : null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget && stage !== 'questions') onClose(); }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="epds-modal-title"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 24 }}
            className="bg-brand-cream dark:bg-brand-ink w-full max-w-md max-h-[90vh] rounded-t-3xl sm:rounded-3xl sm:m-4 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-brand-rose" aria-hidden="true" />
                <h2 id="epds-modal-title" className="text-lg font-serif">Emotional Check-in</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-brand-sage" />
              </button>
            </div>

            {/* Progress bar — only during questions */}
            {stage === 'questions' && (
              <div className="px-6 pb-3">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] text-brand-sage whitespace-nowrap">{current + 1} of {epdsQuestions.length}</p>
                  <div className="flex-1 h-1.5 bg-brand-clay/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-brand-clay rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Content — scrollable */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {stage === 'intro' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="bg-brand-rose/10 border border-brand-rose/20 rounded-2xl p-4">
                    <p className="text-sm text-brand-ink/80 leading-relaxed italic">{epdsIntro}</p>
                  </div>
                  <div className="space-y-3 text-sm text-brand-ink/80 leading-relaxed">
                    <p>This is the <b>Edinburgh Postnatal Depression Scale</b> — a screening tool used by doctors worldwide.</p>
                    <p>Ten questions. Takes about two minutes.</p>
                    <p className="text-brand-sage italic">Your answers stay on your phone. Nobody else will see them.</p>
                  </div>

                  <ClinicalByline source="epds" />

                  {history.length > 0 && (
                    <div className="mt-4 bg-white/40 dark:bg-white/5 rounded-2xl p-4 border border-brand-clay/15">
                      <p className="text-xs text-brand-sage mb-2">Last check-in</p>
                      <p className="text-sm">
                        {format(history[0].completedAt, 'MMM d, yyyy')} — score <b>{history[0].totalScore}</b>/30
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => setStage('questions')}
                    className="w-full py-3.5 bg-brand-clay text-white rounded-2xl text-base font-medium press-effect min-h-[52px]"
                  >
                    Begin
                  </button>
                </motion.div>
              )}

              {stage === 'questions' && q && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <p className="text-[11px] text-brand-sage italic mt-2">In the past 7 days…</p>
                    <h3 className="text-lg leading-relaxed">{q.prompt}</h3>
                    <div className="space-y-2">
                      {q.options.map((opt, i) => {
                        const selected = answers[current] === opt.score;
                        return (
                          <button
                            key={i}
                            onClick={() => selectAnswer(opt.score)}
                            className={`w-full text-left p-4 rounded-2xl border transition-all min-h-[56px] press-effect ${
                              selected
                                ? 'bg-brand-clay text-white border-brand-clay'
                                : 'bg-white/50 dark:bg-white/5 border-brand-clay/15 text-brand-ink dark:text-brand-cream hover:bg-white/70 dark:hover:bg-white/10'
                            }`}
                          >
                            <span className="text-sm leading-snug">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {current > 0 && (
                      <button
                        onClick={goBack}
                        className="inline-flex items-center gap-1 text-sm text-brand-sage hover:text-brand-ink mt-2 min-h-[40px]"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                      </button>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}

              {stage === 'result' && result && interpretation && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  {/* Score card */}
                  <div className={`rounded-3xl p-6 text-center ${
                    interpretation.tone === 'urgent'
                      ? 'bg-brand-rose text-white'
                      : interpretation.tone === 'watchful'
                      ? 'bg-brand-gold/20 dark:bg-brand-gold/10'
                      : 'bg-brand-sage/15 dark:bg-brand-sage/10'
                  }`}>
                    <p className="text-[11px] uppercase tracking-wide opacity-70">Your score</p>
                    <p className="text-5xl font-serif my-2">{result.totalScore}<span className="text-xl opacity-60"> / 30</span></p>
                  </div>

                  {/* Self-harm priority surface */}
                  {result.selfHarmFlag && (
                    <div className="bg-brand-rose/15 border border-brand-rose/30 rounded-2xl p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-brand-rose shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-brand-ink/90 dark:text-brand-cream/90 leading-relaxed mb-3">
                            You shared that thoughts of self-harm have come up. Please reach out to someone who can help today.
                          </p>
                          <button
                            onClick={onViewHelplines}
                            className="w-full py-2.5 bg-brand-rose text-white rounded-2xl text-sm font-medium min-h-[44px] press-effect"
                          >
                            See Helplines Now
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Interpretation */}
                  <div className="bg-white/50 dark:bg-white/5 rounded-2xl p-5">
                    <h3 className="text-lg font-serif mb-2">{interpretation.title}</h3>
                    <p className="text-sm text-brand-ink/80 dark:text-brand-cream/80 leading-relaxed">{interpretation.body}</p>
                  </div>

                  <p className="text-[11px] text-brand-sage italic text-center">
                    This is a screening tool, not a diagnosis. Only a doctor can diagnose.
                  </p>
                  <ClinicalByline source="epds" compact className="text-center" />

                  <button
                    onClick={onClose}
                    className="w-full py-3 bg-brand-clay text-white rounded-2xl text-sm font-medium press-effect min-h-[48px]"
                  >
                    Done
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
