import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/cn';
import { t } from '../strings';
import type { MemoryEntry, GratitudeEntry } from '../types';
import type { useResetActivity } from '../hooks/useResetActivity';

type ResetReturn = ReturnType<typeof useResetActivity>;

interface ResetActivityModalProps extends ResetReturn {
  addMemory: (content: string, category?: MemoryEntry['category']) => void;
  setGratitudeEntries: React.Dispatch<React.SetStateAction<GratitudeEntry[]>>;
  showToast: (msg: string) => void;
  onComplete?: (activityId: string) => void;
}

export default function ResetActivityModal(props: ResetActivityModalProps) {
  const {
    activeReset, resetStep, resetTimer,
    kindSentenceInput, setKindSentenceInput,
    selectedFeeling, setSelectedFeeling,
    worryInput, setWorryInput,
    gratitudeLetterInput, setGratitudeLetterInput,
    lovingKindnessTarget, setLovingKindnessTarget,
    resetGratitudeInputs, setResetGratitudeInputs,
    closeResetActivity, nextResetStep, startStepTimer,
    addMemory, setGratitudeEntries, showToast, onComplete,
  } = props;

  // Complete = log achievement + close
  const completeActivity = () => {
    if (activeReset) onComplete?.(activeReset);
    closeResetActivity();
  };

  return (
    <AnimatePresence>
      {activeReset && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-6"
          onClick={(e) => { if (e.target === e.currentTarget) closeResetActivity(); }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-brand-cream w-full max-w-sm rounded-3xl p-6 max-h-[80vh] overflow-y-auto custom-scrollbar relative"
          >
            {/* Close button */}
            <button
              onClick={closeResetActivity}
              aria-label="Close activity"
              className="absolute top-4 right-4 p-2 text-brand-sage/60 hover:text-brand-sage z-10 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>

            {/* 5-4-3-2-1 Grounding */}
            {activeReset === 'grounding' && (() => {
              const steps = [
                { num: 5, sense: t('grounding_see'), emoji: '👁️' },
                { num: 4, sense: t('grounding_touch'), emoji: '🤚' },
                { num: 3, sense: t('grounding_hear'), emoji: '👂' },
                { num: 2, sense: t('grounding_smell'), emoji: '👃' },
                { num: 1, sense: t('grounding_feel'), emoji: '💗' },
              ];
              const done = resetStep >= steps.length;
              return (
                <div className="text-center space-y-6">
                  <div className="text-3xl">🌿</div>
                  <h3 className="text-lg font-serif font-medium">{t('reset_grounding')}</h3>
                  {done ? (
                    <div className="space-y-4">
                      <p className="text-4xl">✨</p>
                      <p className="text-sm text-brand-ink/80">{t('grounding_done')}</p>
                      <button onClick={completeActivity} className="w-full py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-2xl text-sm font-medium press-effect min-h-[44px]">{t('done')}</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <motion.div key={resetStep} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        <p className="text-5xl">{steps[resetStep].emoji}</p>
                        <p className="text-xl font-serif font-semibold text-brand-clay">{steps[resetStep].num}</p>
                        <p className="text-sm text-brand-ink/80">{steps[resetStep].sense}</p>
                      </motion.div>
                      <button onClick={nextResetStep} className="w-full py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-2xl text-sm font-medium press-effect min-h-[44px]">{t('next')}</button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Shoulder Release */}
            {activeReset === 'shoulder' && (() => {
              const steps = [
                { text: t('shoulder_step1'), duration: 5 },
                { text: t('shoulder_step2'), duration: 5 },
                { text: t('shoulder_step3'), duration: 15 },
                { text: t('shoulder_step4'), duration: 5 },
              ];
              const done = resetStep >= steps.length;
              return (
                <div className="text-center space-y-6">
                  <div className="text-3xl">💆</div>
                  <h3 className="text-lg font-serif font-medium">{t('reset_shoulder')}</h3>
                  {done ? (
                    <div className="space-y-4">
                      <p className="text-4xl">😌</p>
                      <p className="text-sm text-brand-ink/80">{t('shoulder_done')}</p>
                      <button onClick={completeActivity} className="w-full py-3 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-2xl text-sm font-medium press-effect min-h-[44px]">{t('done')}</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <motion.div key={resetStep} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        <p className="text-sm text-brand-ink/80 leading-relaxed">{steps[resetStep].text}</p>
                        {resetTimer > 0 && <p className="text-3xl font-serif font-semibold text-brand-lavender">{resetTimer}s</p>}
                      </motion.div>
                      <button
                        onClick={() => { if (resetTimer <= 0) startStepTimer(steps[resetStep].duration, nextResetStep); }}
                        className="w-full py-3 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-2xl text-sm font-medium press-effect min-h-[44px]"
                      >{resetTimer > 0 ? `${resetTimer}s` : t('startStep')}</button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Hand on Heart */}
            {activeReset === 'handOnHeart' && (() => {
              const steps = [
                { text: t('heart_step1'), emoji: '🤚' },
                { text: t('heart_step2'), emoji: '🌬️' },
                { text: t('heart_step3'), emoji: '💗' },
              ];
              const done = resetStep >= steps.length;
              return (
                <div className="text-center space-y-6">
                  <div className="text-3xl">❤️</div>
                  <h3 className="text-lg font-serif font-medium">{t('reset_handOnHeart')}</h3>
                  {done ? (
                    <div className="space-y-4">
                      <p className="text-4xl">🫶</p>
                      <p className="text-sm text-brand-ink/80 italic">"{t('heart_affirmation')}"</p>
                      <button onClick={completeActivity} className="w-full py-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-2xl text-sm font-medium press-effect min-h-[44px]">{t('done')}</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <motion.div key={resetStep} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        <p className="text-4xl">{steps[resetStep].emoji}</p>
                        <p className="text-sm text-brand-ink/80">{steps[resetStep].text}</p>
                      </motion.div>
                      <button onClick={nextResetStep} className="w-full py-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-2xl text-sm font-medium press-effect min-h-[44px]">{t('next')}</button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Box Breathing */}
            {activeReset === 'boxBreathing' && (() => {
              const phases = [t('breatheIn'), t('hold'), t('breatheOut'), t('hold')];
              const done = resetStep >= 16;
              const currentPhase = phases[resetStep % 4];
              const cycle = Math.floor(resetStep / 4) + 1;
              return (
                <div className="text-center space-y-6">
                  <div className="text-3xl">📦</div>
                  <h3 className="text-lg font-serif font-medium">{t('reset_boxBreathing')}</h3>
                  {done ? (
                    <div className="space-y-4">
                      <p className="text-4xl">😮‍💨</p>
                      <p className="text-sm text-brand-ink/80">{t('box_done')}</p>
                      <button onClick={completeActivity} className="w-full py-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-2xl text-sm font-medium press-effect min-h-[44px]">{t('done')}</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xs text-brand-sage">{t('cycle')} {cycle}/4</p>
                      <motion.div
                        key={resetStep}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-28 h-28 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto"
                      >
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-300">{currentPhase}</span>
                      </motion.div>
                      {resetTimer > 0 && <p className="text-2xl font-serif font-semibold text-blue-500">{resetTimer}s</p>}
                      <button
                        onClick={() => { if (resetTimer <= 0) startStepTimer(4, nextResetStep); }}
                        className="w-full py-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-2xl text-sm font-medium press-effect min-h-[44px]"
                      >{resetTimer > 0 ? `${resetTimer}s` : t('start')}</button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Gratitude Reset */}
            {activeReset === 'gratitudeReset' && (() => {
              return (
                <div className="text-center space-y-6">
                  <div className="text-3xl">🌼</div>
                  <h3 className="text-lg font-serif font-medium">{t('reset_gratitudeReset')}</h3>
                  <p className="text-sm text-brand-ink/70 italic">{t('gratitude_prompt')}</p>
                  <div className="space-y-3 text-left">
                    {[0, 1, 2].map(i => (
                      <input
                        key={i}
                        type="text"
                        placeholder={`${i + 1}. ${t('gratitude_example')}`}
                        value={resetGratitudeInputs[i]}
                        onChange={(e) => { const n = [...resetGratitudeInputs]; n[i] = e.target.value; setResetGratitudeInputs(n); }}
                        className="w-full bg-white/40 border border-brand-gold/15 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/20 placeholder:text-brand-sage/40"
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      const filledItems = resetGratitudeInputs.filter(i => i.trim());
                      if (filledItems.length > 0) {
                        setGratitudeEntries(prev => [{ id: Date.now().toString(), timestamp: Date.now(), items: filledItems }, ...prev]);
                      }
                      completeActivity();
                    }}
                    disabled={resetGratitudeInputs.every(i => !i.trim())}
                    className="w-full py-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-2xl text-sm font-medium disabled:opacity-40 press-effect min-h-[44px]"
                  >{t('saveGratitude')}</button>
                </div>
              );
            })()}

            {/* Body Scan */}
            {activeReset === 'bodyScan' && (() => {
              const bodyParts = [
                { name: t('body_feet'), emoji: '🦶' },
                { name: t('body_legs'), emoji: '🦵' },
                { name: t('body_stomach'), emoji: '🫁' },
                { name: t('body_shoulders'), emoji: '💪' },
                { name: t('body_face'), emoji: '😌' },
              ];
              const done = resetStep >= bodyParts.length;
              return (
                <div className="text-center space-y-6">
                  <div className="text-3xl">🧘</div>
                  <h3 className="text-lg font-serif font-medium">{t('reset_bodyScan')}</h3>
                  {done ? (
                    <div className="space-y-4">
                      <p className="text-4xl">✨</p>
                      <p className="text-sm text-brand-ink/80">{t('bodyScan_done')}</p>
                      <button onClick={completeActivity} className="w-full py-3 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-2xl text-sm font-medium press-effect min-h-[44px]">{t('done')}</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <motion.div key={resetStep} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        <p className="text-5xl">{bodyParts[resetStep].emoji}</p>
                        <p className="text-sm text-brand-ink/80">{t('bodyScan_notice')} <strong>{bodyParts[resetStep].name}</strong></p>
                        <p className="text-xs text-brand-sage italic">{t('bodyScan_relax')}</p>
                      </motion.div>
                      <button onClick={nextResetStep} className="w-full py-3 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-2xl text-sm font-medium press-effect min-h-[44px]">{t('next')}</button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 10-Breath Reset */}
            {activeReset === 'tenBreath' && (() => {
              const done = resetStep >= 10;
              return (
                <div className="text-center space-y-6">
                  <div className="text-3xl">🌬️</div>
                  <h3 className="text-lg font-serif font-medium">{t('reset_tenBreath')}</h3>
                  {done ? (
                    <div className="space-y-4">
                      <p className="text-4xl">😮‍💨</p>
                      <p className="text-sm text-brand-ink/80">{t('tenBreath_done')}</p>
                      <button onClick={completeActivity} className="w-full py-3 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-2xl text-sm font-medium press-effect min-h-[44px]">{t('done')}</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xs text-brand-sage">{t('tenBreath_instruction')}</p>
                      <motion.div
                        key={resetStep}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-24 h-24 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center mx-auto"
                      >
                        <span className="text-3xl font-serif font-bold text-cyan-600 dark:text-cyan-300">{resetStep + 1}</span>
                      </motion.div>
                      <button onClick={nextResetStep} className="w-full py-3 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-2xl text-sm font-medium press-effect min-h-[44px]">{t('breatheTaken')}</button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Name the Feeling */}
            {activeReset === 'nameFeeling' && (() => {
              const feelings = [
                { id: 'overwhelmed', emoji: '😰' },
                { id: 'anxious', emoji: '😟' },
                { id: 'sad', emoji: '😢' },
                { id: 'tired', emoji: '😴' },
                { id: 'calm', emoji: '😌' },
                { id: 'grateful', emoji: '🥰' },
              ];
              return (
                <div className="text-center space-y-6">
                  <div className="text-3xl">🧠</div>
                  <h3 className="text-lg font-serif font-medium">{t('reset_nameFeeling')}</h3>
                  {selectedFeeling ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      <p className="text-5xl">{feelings.find(f => f.id === selectedFeeling)?.emoji}</p>
                      <p className="text-sm text-brand-ink/80">{t(`feeling_${selectedFeeling}_msg`)}</p>
                      <button onClick={completeActivity} className="w-full py-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-2xl text-sm font-medium press-effect min-h-[44px]">{t('done')}</button>
                    </motion.div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-brand-ink/70">{t('feeling_prompt')}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {feelings.map(f => (
                          <button
                            key={f.id}
                            onClick={() => setSelectedFeeling(f.id)}
                            className="flex items-center gap-2 p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all press-effect min-h-[44px]"
                          >
                            <span className="text-xl">{f.emoji}</span>
                            <span className="text-xs font-medium text-brand-ink/80">{t(`feeling_${f.id}`)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Micro Stretch */}
            {activeReset === 'microStretch' && (() => {
              const stretches = [
                { text: t('stretch_arms'), emoji: '🙆' },
                { text: t('stretch_neck'), emoji: '🔄' },
                { text: t('stretch_wrists'), emoji: '🤲' },
              ];
              const done = resetStep >= stretches.length;
              return (
                <div className="text-center space-y-6">
                  <div className="text-3xl">🤸</div>
                  <h3 className="text-lg font-serif font-medium">{t('reset_microStretch')}</h3>
                  {done ? (
                    <div className="space-y-4">
                      <p className="text-4xl">💪</p>
                      <p className="text-sm text-brand-ink/80">{t('stretch_done')}</p>
                      <button onClick={completeActivity} className="w-full py-3 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-2xl text-sm font-medium press-effect min-h-[44px]">{t('done')}</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <motion.div key={resetStep} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        <p className="text-5xl">{stretches[resetStep].emoji}</p>
                        <p className="text-sm text-brand-ink/80">{stretches[resetStep].text}</p>
                      </motion.div>
                      <button
                        onClick={() => { if (resetTimer <= 0) startStepTimer(10, nextResetStep); }}
                        className="w-full py-3 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-2xl text-sm font-medium press-effect min-h-[44px]"
                      >{resetTimer > 0 ? `${resetTimer}s` : t('startStep')}</button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* One Kind Sentence */}
            {activeReset === 'kindSentence' && (() => {
              return (
                <div className="text-center space-y-6">
                  <div className="text-3xl">💬</div>
                  <h3 className="text-lg font-serif font-medium">{t('reset_kindSentence')}</h3>
                  {resetStep === 0 ? (
                    <div className="space-y-4">
                      <p className="text-sm text-brand-ink/70 italic">{t('kind_prompt')}</p>
                      <textarea
                        value={kindSentenceInput}
                        onChange={(e) => setKindSentenceInput(e.target.value)}
                        placeholder={t('kind_placeholder')}
                        rows={3}
                        className="w-full bg-white/40 border border-brand-rose/15 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose/20 placeholder:text-brand-sage/40 resize-none"
                      />
                      <button
                        onClick={nextResetStep}
                        disabled={!kindSentenceInput.trim()}
                        className="w-full py-3 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300 rounded-2xl text-sm font-medium disabled:opacity-40 press-effect min-h-[44px]"
                      >{t('save')}</button>
                    </div>
                  ) : (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                      <div className="bg-brand-rose/10 border border-brand-rose/20 rounded-2xl p-5">
                        <p className="text-sm text-brand-ink/80 italic leading-relaxed">"{kindSentenceInput}"</p>
                      </div>
                      <p className="text-xs text-brand-sage">{t('kind_remember')}</p>
                      <button onClick={completeActivity} className="w-full py-3 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300 rounded-2xl text-sm font-medium press-effect min-h-[44px]">{t('done')}</button>
                    </motion.div>
                  )}
                </div>
              );
            })()}

            {/* Positive Visualization */}
            {activeReset === 'visualization' && (() => {
              const steps = [
                { text: t('viz_step1'), emoji: '👁️' },
                { text: t('viz_step2'), emoji: '🏝️' },
                { text: t('viz_step3'), emoji: '🌊' },
                { text: t('viz_step4'), emoji: '☀️' },
              ];
              const done = resetStep >= steps.length;
              return (
                <div className="text-center space-y-6">
                  <div className="text-3xl">🏝️</div>
                  <h3 className="text-lg font-serif font-medium">{t('reset_visualization')}</h3>
                  {done ? (
                    <div className="space-y-4">
                      <p className="text-4xl">✨</p>
                      <p className="text-sm text-brand-ink/80">{t('viz_done')}</p>
                      <button onClick={completeActivity} className="w-full py-3 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded-2xl text-sm font-medium press-effect min-h-[44px]">{t('done')}</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <motion.div key={resetStep} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        <p className="text-5xl">{steps[resetStep].emoji}</p>
                        <p className="text-sm text-brand-ink/80 leading-relaxed">{steps[resetStep].text}</p>
                      </motion.div>
                      {resetStep === 1 ? (
                        <button
                          onClick={() => { if (resetTimer <= 0) startStepTimer(15, nextResetStep); }}
                          className="w-full py-3 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded-2xl text-sm font-medium press-effect min-h-[44px]"
                        >{resetTimer > 0 ? `${resetTimer}s` : t('startStep')}</button>
                      ) : (
                        <button onClick={nextResetStep} className="w-full py-3 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded-2xl text-sm font-medium press-effect min-h-[44px]">{t('next')}</button>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Progressive Muscle Relaxation */}
            {activeReset === 'pmr' && (() => {
              const muscles = [
                { name: t('pmr_hands'), emoji: '✊', tense: t('pmr_tense'), release: t('pmr_release') },
                { name: t('pmr_arms'), emoji: '💪', tense: t('pmr_tense'), release: t('pmr_release') },
                { name: t('pmr_shoulders'), emoji: '🤷', tense: t('pmr_tense'), release: t('pmr_release') },
                { name: t('pmr_face'), emoji: '😤', tense: t('pmr_tense'), release: t('pmr_release') },
                { name: t('pmr_stomach'), emoji: '🫁', tense: t('pmr_tense'), release: t('pmr_release') },
                { name: t('pmr_legs'), emoji: '🦵', tense: t('pmr_tense'), release: t('pmr_release') },
              ];
              const muscleIdx = Math.floor(resetStep / 2);
              const isTense = resetStep % 2 === 0;
              const done = muscleIdx >= muscles.length;
              return (
                <div className="text-center space-y-6">
                  <div className="text-3xl">💪</div>
                  <h3 className="text-lg font-serif font-medium">{t('reset_pmr')}</h3>
                  {done ? (
                    <div className="space-y-4">
                      <p className="text-4xl">😌</p>
                      <p className="text-sm text-brand-ink/80">{t('pmr_done')}</p>
                      <button onClick={completeActivity} className="w-full py-3 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-2xl text-sm font-medium press-effect min-h-[44px]">{t('done')}</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xs text-brand-sage">{muscleIdx + 1}/{muscles.length}</p>
                      <motion.div key={resetStep} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
                        <p className="text-5xl">{muscles[muscleIdx].emoji}</p>
                        <p className="text-sm font-medium text-brand-ink">{muscles[muscleIdx].name}</p>
                        <p className={cn("text-sm font-semibold", isTense ? "text-rose-500" : "text-green-500")}>
                          {isTense ? `${muscles[muscleIdx].tense}...` : `${muscles[muscleIdx].release}...`}
                        </p>
                      </motion.div>
                      {resetTimer > 0 && <p className="text-3xl font-serif font-semibold text-rose-400">{resetTimer}s</p>}
                      <button
                        onClick={() => { if (resetTimer <= 0) startStepTimer(isTense ? 5 : 10, nextResetStep); }}
                        className="w-full py-3 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-2xl text-sm font-medium press-effect min-h-[44px]"
                      >{resetTimer > 0 ? `${resetTimer}s` : t('startStep')}</button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Loving-Kindness */}
            {activeReset === 'lovingKindness' && (() => {
              const targets = [
                { id: 'self', emoji: '🤗', label: t('lk_self') },
                { id: 'baby', emoji: '👶', label: t('lk_baby') },
                { id: 'loved', emoji: '💕', label: t('lk_loved') },
              ];
              return (
                <div className="text-center space-y-6">
                  <div className="text-3xl">🙏</div>
                  <h3 className="text-lg font-serif font-medium">{t('reset_lovingKindness')}</h3>
                  {resetStep === 0 && !lovingKindnessTarget ? (
                    <div className="space-y-3">
                      <p className="text-sm text-brand-ink/70">{t('lk_prompt')}</p>
                      <div className="space-y-2">
                        {targets.map(tgt => (
                          <button
                            key={tgt.id}
                            onClick={() => { setLovingKindnessTarget(tgt.id); nextResetStep(); }}
                            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all press-effect min-h-[44px]"
                          >
                            <span className="text-2xl">{tgt.emoji}</span>
                            <span className="text-sm font-medium text-brand-ink/80">{tgt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : resetStep <= 3 ? (
                    <div className="space-y-4">
                      <motion.div key={resetStep} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        <p className="text-4xl">{targets.find(tg => tg.id === lovingKindnessTarget)?.emoji || '🤗'}</p>
                        <p className="text-sm text-brand-ink/80 italic leading-relaxed">
                          "{t(`lk_phrase${resetStep}`)}"
                        </p>
                      </motion.div>
                      {resetTimer > 0 && <p className="text-2xl font-serif font-semibold text-amber-400">{resetTimer}s</p>}
                      <button
                        onClick={() => { if (resetTimer <= 0) startStepTimer(8, nextResetStep); }}
                        className="w-full py-3 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-2xl text-sm font-medium press-effect min-h-[44px]"
                      >{resetTimer > 0 ? `${resetTimer}s` : t('startStep')}</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-4xl">🙏</p>
                      <p className="text-sm text-brand-ink/80">{t('lk_done')}</p>
                      <button onClick={completeActivity} className="w-full py-3 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-2xl text-sm font-medium press-effect min-h-[44px]">{t('done')}</button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Worry Box */}
            {activeReset === 'worryBox' && (() => {
              return (
                <div className="text-center space-y-6">
                  <div className="text-3xl">🗃️</div>
                  <h3 className="text-lg font-serif font-medium">{t('reset_worryBox')}</h3>
                  {resetStep === 0 ? (
                    <div className="space-y-4">
                      <p className="text-sm text-brand-ink/70 italic">{t('worry_prompt')}</p>
                      <textarea
                        value={worryInput}
                        onChange={(e) => setWorryInput(e.target.value)}
                        placeholder={t('worry_placeholder')}
                        rows={3}
                        className="w-full bg-white/40 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 placeholder:text-brand-sage/40 resize-none"
                      />
                      <button
                        onClick={nextResetStep}
                        disabled={!worryInput.trim()}
                        className="w-full py-3 bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 rounded-2xl text-sm font-medium disabled:opacity-40 press-effect min-h-[44px]"
                      >{t('worry_lock')}</button>
                    </div>
                  ) : resetStep === 1 ? (
                    <motion.div initial={{ scale: 1 }} animate={{ scale: [1, 0.8, 0] }} transition={{ duration: 1.5, ease: "easeIn" }} onAnimationComplete={nextResetStep} className="space-y-3">
                      <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto border-2 border-slate-300 dark:border-slate-600">
                        <span className="text-3xl">🔒</span>
                      </div>
                      <p className="text-xs text-brand-sage">{t('worry_locking')}</p>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      <p className="text-4xl">✨</p>
                      <p className="text-sm text-brand-ink/80">{t('worry_done')}</p>
                      <p className="text-xs text-brand-sage italic">{t('worry_remember')}</p>
                      <button onClick={completeActivity} className="w-full py-3 bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 rounded-2xl text-sm font-medium press-effect min-h-[44px]">{t('done')}</button>
                    </motion.div>
                  )}
                </div>
              );
            })()}

            {/* Self-Compassion Break */}
            {activeReset === 'selfCompassion' && (() => {
              const steps = [
                { text: t('sc_step1'), emoji: '🤲', desc: t('sc_step1_desc') },
                { text: t('sc_step2'), emoji: '🌍', desc: t('sc_step2_desc') },
                { text: t('sc_step3'), emoji: '💜', desc: t('sc_step3_desc') },
              ];
              const done = resetStep >= steps.length;
              return (
                <div className="text-center space-y-6">
                  <div className="text-3xl">🫂</div>
                  <h3 className="text-lg font-serif font-medium">{t('reset_selfCompassion')}</h3>
                  {done ? (
                    <div className="space-y-4">
                      <p className="text-4xl">💜</p>
                      <p className="text-sm text-brand-ink/80">{t('sc_done')}</p>
                      <button onClick={completeActivity} className="w-full py-3 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-2xl text-sm font-medium press-effect min-h-[44px]">{t('done')}</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <motion.div key={resetStep} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        <p className="text-5xl">{steps[resetStep].emoji}</p>
                        <p className="text-sm font-medium text-brand-ink">{steps[resetStep].text}</p>
                        <p className="text-xs text-brand-ink/60 italic leading-relaxed">{steps[resetStep].desc}</p>
                      </motion.div>
                      {resetTimer > 0 && <p className="text-2xl font-serif font-semibold text-violet-400">{resetTimer}s</p>}
                      <button
                        onClick={() => { if (resetTimer <= 0) startStepTimer(15, nextResetStep); }}
                        className="w-full py-3 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-2xl text-sm font-medium press-effect min-h-[44px]"
                      >{resetTimer > 0 ? `${resetTimer}s` : t('startStep')}</button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Energy Boost */}
            {activeReset === 'energyBoost' && (() => {
              const moves = [
                { text: t('energy_move1'), emoji: '🙆' },
                { text: t('energy_move2'), emoji: '🏃' },
                { text: t('energy_move3'), emoji: '👐' },
                { text: t('energy_move4'), emoji: '🦶' },
                { text: t('energy_move5'), emoji: '💃' },
              ];
              const done = resetStep >= moves.length;
              return (
                <div className="text-center space-y-6">
                  <div className="text-3xl">⚡</div>
                  <h3 className="text-lg font-serif font-medium">{t('reset_energyBoost')}</h3>
                  {done ? (
                    <div className="space-y-4">
                      <p className="text-4xl">🔥</p>
                      <p className="text-sm text-brand-ink/80">{t('energy_done')}</p>
                      <button onClick={completeActivity} className="w-full py-3 bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-300 rounded-2xl text-sm font-medium press-effect min-h-[44px]">{t('done')}</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xs text-brand-sage">{resetStep + 1}/{moves.length}</p>
                      <motion.div key={resetStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                        <p className="text-5xl">{moves[resetStep].emoji}</p>
                        <p className="text-sm text-brand-ink/80">{moves[resetStep].text}</p>
                      </motion.div>
                      {resetTimer > 0 && <p className="text-3xl font-serif font-semibold text-lime-500">{resetTimer}s</p>}
                      <button
                        onClick={() => { if (resetTimer <= 0) startStepTimer(10, nextResetStep); }}
                        className="w-full py-3 bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-300 rounded-2xl text-sm font-medium press-effect min-h-[44px]"
                      >{resetTimer > 0 ? `${resetTimer}s` : t('start')}</button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Gratitude Letter */}
            {activeReset === 'gratitudeLetter' && (() => {
              return (
                <div className="text-center space-y-6">
                  <div className="text-3xl">💌</div>
                  <h3 className="text-lg font-serif font-medium">{t('reset_gratitudeLetter')}</h3>
                  {resetStep === 0 ? (
                    <div className="space-y-4">
                      <p className="text-sm text-brand-ink/70 italic">{t('gletter_prompt')}</p>
                      <textarea
                        value={gratitudeLetterInput}
                        onChange={(e) => setGratitudeLetterInput(e.target.value)}
                        placeholder={t('gletter_placeholder')}
                        rows={4}
                        className="w-full bg-white/40 border border-fuchsia-200 dark:border-fuchsia-800 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-200 placeholder:text-brand-sage/40 resize-none"
                      />
                      <button
                        onClick={nextResetStep}
                        disabled={!gratitudeLetterInput.trim()}
                        className="w-full py-3 bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-300 rounded-2xl text-sm font-medium disabled:opacity-40 press-effect min-h-[44px]"
                      >{t('save')}</button>
                    </div>
                  ) : (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                      <div className="bg-fuchsia-50 dark:bg-fuchsia-900/20 border border-fuchsia-200 dark:border-fuchsia-800 rounded-2xl p-5">
                        <p className="text-sm text-brand-ink/80 italic leading-relaxed">"{gratitudeLetterInput}"</p>
                      </div>
                      <p className="text-xs text-brand-sage">{t('gletter_remember')}</p>
                      <button onClick={() => {
                        addMemory(`💌 ${gratitudeLetterInput}`, 'other');
                        completeActivity();
                        showToast(t('gletter_saved'));
                      }} className="w-full py-3 bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-300 rounded-2xl text-sm font-medium press-effect min-h-[44px]">{t('gletter_saveToVault')}</button>
                      <button onClick={completeActivity} className="text-xs text-brand-sage/60 underline">{t('done')}</button>
                    </motion.div>
                  )}
                </div>
              );
            })()}

            {/* Smile Practice */}
            {activeReset === 'smilePractice' && (() => {
              const steps = [
                { text: t('smile_step1'), emoji: '😐' },
                { text: t('smile_step2'), emoji: '🙂' },
                { text: t('smile_step3'), emoji: '😊' },
                { text: t('smile_step4'), emoji: '😁' },
              ];
              const done = resetStep >= steps.length;
              return (
                <div className="text-center space-y-6">
                  <div className="text-3xl">😊</div>
                  <h3 className="text-lg font-serif font-medium">{t('reset_smilePractice')}</h3>
                  {done ? (
                    <div className="space-y-4">
                      <p className="text-4xl">🌟</p>
                      <p className="text-sm text-brand-ink/80">{t('smile_done')}</p>
                      <button onClick={completeActivity} className="w-full py-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-2xl text-sm font-medium press-effect min-h-[44px]">{t('done')}</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <motion.div key={resetStep} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
                        <p className="text-6xl">{steps[resetStep].emoji}</p>
                        <p className="text-sm text-brand-ink/80">{steps[resetStep].text}</p>
                      </motion.div>
                      {resetTimer > 0 && <p className="text-2xl font-serif font-semibold text-emerald-400">{resetTimer}s</p>}
                      <button
                        onClick={() => { if (resetTimer <= 0) startStepTimer(10, nextResetStep); }}
                        className="w-full py-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-2xl text-sm font-medium press-effect min-h-[44px]"
                      >{resetTimer > 0 ? `${resetTimer}s` : t('startStep')}</button>
                    </div>
                  )}
                </div>
              );
            })()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
