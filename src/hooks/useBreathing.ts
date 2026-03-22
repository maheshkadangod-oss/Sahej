import { useState, useEffect } from 'react';
import { t } from '../strings';

export function useBreathing() {
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'in' | 'hold' | 'out'>('in');

  useEffect(() => {
    if (!isBreathing) { setBreathPhase('in'); return; }
    const phases: Array<'in' | 'hold' | 'out'> = ['in', 'hold', 'out'];
    let idx = 0;
    setBreathPhase('in');
    const interval = setInterval(() => {
      idx = (idx + 1) % 3;
      setBreathPhase(phases[idx]);
    }, 4000);
    return () => clearInterval(interval);
  }, [isBreathing]);

  const breathLabel = breathPhase === 'in' ? t('breatheIn') : breathPhase === 'hold' ? t('hold') : t('breatheOut');

  return { isBreathing, setIsBreathing, breathPhase, breathLabel };
}
