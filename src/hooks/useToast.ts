import { useState, useCallback, useRef, useEffect } from 'react';

export function useToast() {
  const [message, setMessage] = useState('');
  const timerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(msg);
    timerRef.current = window.setTimeout(() => setMessage(''), 3000);
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return { message, showToast };
}
