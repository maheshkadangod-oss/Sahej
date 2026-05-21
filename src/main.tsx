import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { inject } from '@vercel/analytics';
import { registerSW } from 'virtual:pwa-register';
import { ErrorBoundary } from './components/ErrorBoundary';
import App from './App.tsx';
import './index.css';

// Privacy-friendly analytics (no cookies, no personal data)
inject();

// Register the service worker for offline support.
// `immediate: true` means we attempt registration on load without waiting for idle — we want
// offline cached assets populated as quickly as possible on first visit. `autoUpdate` mode
// (set in vite.config.ts) makes the new SW take over on next page load with no user action.
registerSW({ immediate: true });

// One-time migration cleanup: earlier builds shipped a hand-rolled service worker that stored a
// Cache Storage entry named "sakthi-v1". The new Workbox SW replaces that worker but its
// cleanupOutdatedCaches() only purges Workbox's own precaches, so the legacy entry would linger
// as dead storage for returning users. Remove it explicitly. No-op for new users / once cleared.
if ('caches' in window) {
  caches.delete('sakthi-v1').catch(() => { /* ignore — best-effort cleanup */ });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
