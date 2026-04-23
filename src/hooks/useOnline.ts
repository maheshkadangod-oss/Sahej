import { useEffect, useState } from 'react';

/**
 * Tracks online/offline status. Subscribes to the browser's `online`/`offline` events.
 *
 * `navigator.onLine` is only a best-effort signal — it reflects whether the OS thinks there's
 * a network connection, not whether our specific endpoints are reachable. For our use cases
 * (showing an offline banner, disabling network-dependent buttons, queueing chat messages)
 * that's exactly what we want: the events fire reliably when a user loses WiFi / cell signal.
 *
 * We read `navigator.onLine` once as the initial value. SSR-safe: if `navigator` isn't defined
 * (it is in our setup, but belt-and-suspenders) we default to online.
 */
export function useOnline(): boolean {
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return online;
}
