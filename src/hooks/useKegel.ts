import { useState, useEffect } from 'react';

export function useKegel() {
  const [kegelActive, setKegelActive] = useState(false);
  const [kegelPhase, setKegelPhase] = useState<'squeeze' | 'relax'>('squeeze');
  const [kegelReps, setKegelReps] = useState(0);

  useEffect(() => {
    if (!kegelActive) { setKegelPhase('squeeze'); return; }
    let rep = 0;
    setKegelPhase('squeeze');
    setKegelReps(0);
    const interval = setInterval(() => {
      setKegelPhase(prev => {
        if (prev === 'squeeze') return 'relax';
        rep++;
        setKegelReps(rep);
        if (rep >= 10) {
          clearInterval(interval);
          setKegelActive(false);
          return 'squeeze';
        }
        return 'squeeze';
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [kegelActive]);

  return { kegelActive, setKegelActive, kegelPhase, kegelReps };
}
