import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';

let quotaWarned = false;

export function usePersistedState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) return JSON.parse(saved);
    } catch { /* corrupted data */ }
    return initial;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      if (!quotaWarned && e instanceof DOMException && e.name === 'QuotaExceededError') {
        quotaWarned = true;
        console.warn('Storage quota exceeded. Export your data to avoid data loss.');
      }
    }
  }, [key, value]);

  return [value, setValue];
}
