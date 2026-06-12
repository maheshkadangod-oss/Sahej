import { useEffect, useReducer, useCallback } from 'react';

// Cross-platform "install this app" support.
//
// Chrome / Edge / Android fire a `beforeinstallprompt` event we can capture and replay from
// our own button. iOS Safari has NO install API — the only path is Share → "Add to Home
// Screen", so we detect iOS and show instructions instead. Other browsers (desktop Safari,
// Firefox) get gentle menu guidance.
//
// The event often fires before React mounts (and long before lazy components like the
// Settings modal load), so capture lives at module level — this module is imported eagerly
// from App so the listener attaches early.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let justInstalled = false;
const subscribers = new Set<() => void>();
const notify = () => subscribers.forEach(fn => fn());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // we show our own UI instead of Chrome's mini-infobar
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    justInstalled = true;
    notify();
  });
}

function detectIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // iPadOS 13+ reports as Mac, but Macs don't have multi-touch.
  return /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

export function useInstallPrompt() {
  const [, rerender] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    subscribers.add(rerender);
    return () => { subscribers.delete(rerender); };
  }, []);

  const isIOS = detectIOS();
  const isInstalled = detectStandalone() || justInstalled;
  const canPromptNative = !!deferredPrompt;

  /** Trigger the native install dialog (Chrome/Edge/Android). Returns the user's choice. */
  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    const ev = deferredPrompt;
    if (!ev) return 'unavailable';
    await ev.prompt();
    const choice = await ev.userChoice;
    if (choice.outcome === 'accepted') deferredPrompt = null;
    notify();
    return choice.outcome;
  }, []);

  return {
    /** True when running as an installed app (hide all install UI). */
    isInstalled,
    /** True when we can pop the native browser install dialog. */
    canPromptNative,
    /** True on iPhone/iPad — install requires Share → Add to Home Screen instructions. */
    isIOS,
    /** Worth surfacing install UI at all? (native prompt available, or iOS instructions apply) */
    installAvailable: !isInstalled && (canPromptNative || isIOS),
    promptInstall,
  };
}
