import { WifiOff } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useOnline } from '../hooks/useOnline';

/**
 * Small status ribbon pinned to the top edge when the user is offline.
 *
 * Design intent: non-alarming, reassuring. A postpartum mother losing signal at 3am shouldn't
 * feel her app is "broken" — she should understand her log is still saving and what she'll
 * get back when she's online again. Copy is deliberately gentle, not "Connection Lost!".
 *
 * Placement: top of viewport, above safe-area inset, inside the max-w-md column. Height ~36px.
 * Slides down on offline, slides up on reconnect. No persistent state; purely reactive to
 * `navigator.onLine` events.
 *
 * Accessibility: aria-live="polite" so screen readers announce the state change without
 * interrupting whatever they were already reading (offline is not an emergency).
 */
export function OfflineBanner() {
  const online = useOnline();

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          key="offline-banner"
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed top-0 left-0 right-0 max-w-md mx-auto z-40 bg-brand-sage/95 text-white text-xs font-medium px-4 py-2 flex items-center justify-center gap-2 shadow-sm safe-top"
          style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
          role="status"
          aria-live="polite"
        >
          <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
          <span>You&rsquo;re offline — your log is still saving.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
