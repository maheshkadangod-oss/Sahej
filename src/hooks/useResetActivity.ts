import { useState, useRef, useEffect } from 'react';
import type { ResetActivity } from '../types';

export function useResetActivity() {
  const [activeReset, setActiveReset] = useState<ResetActivity>(null);
  const [resetStep, setResetStep] = useState(0);
  const [resetTimer, setResetTimer] = useState(0);
  const [kindSentenceInput, setKindSentenceInput] = useState('');
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [worryInput, setWorryInput] = useState('');
  const [gratitudeLetterInput, setGratitudeLetterInput] = useState('');
  const [lovingKindnessTarget, setLovingKindnessTarget] = useState<string | null>(null);
  const [resetGratitudeInputs, setResetGratitudeInputs] = useState(['', '', '']);
  const resetTimerRef = useRef<number | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearInterval(resetTimerRef.current);
    };
  }, []);

  const startResetActivity = (activity: ResetActivity) => {
    setActiveReset(activity);
    setResetStep(0);
    setResetTimer(0);
    setKindSentenceInput('');
    setSelectedFeeling(null);
    setWorryInput('');
    setGratitudeLetterInput('');
    setLovingKindnessTarget(null);
    setResetGratitudeInputs(['', '', '']);
    if (resetTimerRef.current) clearInterval(resetTimerRef.current);
  };

  const closeResetActivity = () => {
    setActiveReset(null);
    setResetStep(0);
    setResetTimer(0);
    setKindSentenceInput('');
    setSelectedFeeling(null);
    setWorryInput('');
    setGratitudeLetterInput('');
    setLovingKindnessTarget(null);
    setResetGratitudeInputs(['', '', '']);
    if (resetTimerRef.current) { clearInterval(resetTimerRef.current); resetTimerRef.current = null; }
  };

  const nextResetStep = () => setResetStep(prev => prev + 1);

  const startStepTimer = (seconds: number, onComplete: () => void) => {
    setResetTimer(seconds);
    if (resetTimerRef.current) clearInterval(resetTimerRef.current);
    resetTimerRef.current = window.setInterval(() => {
      setResetTimer(prev => {
        if (prev <= 1) {
          clearInterval(resetTimerRef.current!);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return {
    activeReset,
    resetStep,
    resetTimer,
    kindSentenceInput, setKindSentenceInput,
    selectedFeeling, setSelectedFeeling,
    worryInput, setWorryInput,
    gratitudeLetterInput, setGratitudeLetterInput,
    lovingKindnessTarget, setLovingKindnessTarget,
    resetGratitudeInputs, setResetGratitudeInputs,
    startResetActivity,
    closeResetActivity,
    nextResetStep,
    startStepTimer,
  };
}
