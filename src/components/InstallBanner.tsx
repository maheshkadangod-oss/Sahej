import { useState } from 'react';
import { X, Share, PlusSquare, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

const DISMISS_KEY = 'sahej_install_dismissed';

// Gentle, dismissible "install Sahej" card shown on the Home tab when installation is
// possible and the app isn't already installed. One dismissal hides it forever — the
// Settings entry remains as the quiet, always-available path.
export default function InstallBanner() {
  const { installAvailable, canPromptNative, isIOS, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === 'true');
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  if (!installAvailable || dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
  };

  const handleInstall = async () => {
    if (canPromptNative) {
      const outcome = await promptInstall();
      if (outcome === 'accepted') dismiss();
    } else if (isIOS) {
      setShowIOSSteps(s => !s);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        className="glass-card rounded-2xl p-4 mb-6"
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-brand-clay/15 rounded-full flex items-center justify-center shrink-0">
            <Download className="w-4 h-4 text-brand-clay" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-brand-ink leading-tight">Keep Sahej one tap away</p>
            <p className="text-[11px] text-brand-sage mt-0.5">
              Install it like an app — works offline, opens instantly, no app store needed.
            </p>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss install suggestion"
            className="p-1.5 rounded-full hover:bg-black/5 min-w-[36px] min-h-[36px] flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4 text-brand-sage" />
          </button>
        </div>

        <button
          onClick={handleInstall}
          className="w-full mt-3 py-2.5 bg-brand-clay text-white rounded-2xl text-sm font-medium press-effect min-h-[44px]"
        >
          {canPromptNative ? 'Install Sahej' : 'Show me how'}
        </button>

        {showIOSSteps && isIOS && (
          <div className="mt-3 bg-white/40 dark:bg-white/5 rounded-xl p-3 text-[12px] text-brand-ink/80 space-y-1.5">
            <p className="flex items-center gap-2">
              <Share className="w-3.5 h-3.5 text-brand-clay shrink-0" />
              1. Tap the <strong>Share</strong> button in Safari's toolbar
            </p>
            <p className="flex items-center gap-2">
              <PlusSquare className="w-3.5 h-3.5 text-brand-clay shrink-0" />
              2. Choose <strong>"Add to Home Screen"</strong>, then <strong>Add</strong>
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
