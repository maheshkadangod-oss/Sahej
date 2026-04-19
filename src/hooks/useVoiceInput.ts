import { useState, useEffect, useRef, useCallback } from 'react';

// Minimal type shim — Web Speech API is not in lib.dom.d.ts for all TS configs
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: any) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: any) => void) | null;
  onstart: (() => void) | null;
}

interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: ISpeechRecognitionConstructor;
    webkitSpeechRecognition?: ISpeechRecognitionConstructor;
  }
}

function getSpeechRecognition(): ISpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

const MAX_LISTEN_MS = 60_000; // auto-stop after 60s

export interface UseVoiceInputOptions {
  onTranscript: (text: string) => void;
  lang?: string;
}

export function useVoiceInput({ onTranscript, lang = 'en-IN' }: UseVoiceInputOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState<boolean>(() => getSpeechRecognition() !== null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTranscriptRef = useRef(onTranscript);

  // Keep latest callback without triggering effect re-runs
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    const rec = recognitionRef.current;
    if (rec) {
      rec.onresult = null;
      rec.onend = null;
      rec.onerror = null;
      rec.onstart = null;
      try { rec.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const stopListening = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      try { rec.stop(); } catch { /* ignore */ }
    }
  }, []);

  const startListening = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) return;
    if (recognitionRef.current) return; // already running

    const rec = new SR();
    rec.continuous = false; // single utterance
    rec.interimResults = true;
    rec.lang = lang;

    let finalTranscript = '';

    rec.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript || '';
        if (result.isFinal) {
          finalTranscript += text;
        } else {
          interim += text;
        }
      }
      // Emit live transcript (final + interim) for real-time feedback
      const combined = (finalTranscript + interim).trim();
      if (combined) onTranscriptRef.current(combined);
    };

    rec.onend = () => cleanup();
    rec.onerror = (e: any) => {
      // 'no-speech', 'aborted' etc. are expected; just cleanup
      if (e?.error && e.error !== 'no-speech' && e.error !== 'aborted') {
        console.warn('Voice input error:', e.error);
      }
      cleanup();
    };
    rec.onstart = () => setIsListening(true);

    recognitionRef.current = rec;
    try {
      rec.start();
      timeoutRef.current = setTimeout(() => stopListening(), MAX_LISTEN_MS);
    } catch {
      cleanup();
    }
  }, [lang, cleanup, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return { isListening, isSupported, startListening, stopListening };
}
