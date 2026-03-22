import { Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { t } from '../strings';

interface WelcomeScreenProps {
  welcomeName: string;
  setWelcomeName: (v: string) => void;
  welcomeBabyName: string;
  setWelcomeBabyName: (v: string) => void;
  welcomeBabyBirth: string;
  setWelcomeBabyBirth: (v: string) => void;
  onGetStarted: () => void;
  onGuestContinue: () => void;
}

export default function WelcomeScreen({
  welcomeName, setWelcomeName,
  welcomeBabyName, setWelcomeBabyName,
  welcomeBabyBirth, setWelcomeBabyBirth,
  onGetStarted, onGuestContinue
}: WelcomeScreenProps) {
  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center max-w-md mx-auto bg-brand-cream px-8 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-72 h-72 bg-brand-rose/15 rounded-full blur-3xl pointer-events-none ambient-blob-1" />
      <div className="absolute bottom-[-5%] left-[-5%] w-56 h-56 bg-brand-sage/10 rounded-full blur-3xl pointer-events-none ambient-blob-2" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center z-10 w-full"
      >
        <div className="w-20 h-20 bg-brand-rose/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Heart className="w-10 h-10 text-brand-rose" />
        </div>

        <p className="text-brand-sage text-sm mb-1">{t('welcomeTo')}</p>
        <h1 className="text-4xl font-serif font-semibold text-brand-ink mb-2">{t('appName')}</h1>
        <p className="text-brand-sage text-sm italic mb-10">{t('loginDesc')}</p>

        <div className="space-y-4 mb-8">
          <input
            type="text"
            placeholder={t('yourName')}
            value={welcomeName}
            onChange={(e) => setWelcomeName(e.target.value)}
            enterKeyHint="next"
            className="w-full bg-white/60 border border-brand-clay/20 rounded-2xl py-3.5 px-5 focus:outline-none focus:ring-2 focus:ring-brand-clay/30 text-sm text-center"
          />
          <input
            type="text"
            placeholder={t('babyName')}
            value={welcomeBabyName}
            onChange={(e) => setWelcomeBabyName(e.target.value)}
            enterKeyHint="next"
            className="w-full bg-white/60 border border-brand-clay/20 rounded-2xl py-3.5 px-5 focus:outline-none focus:ring-2 focus:ring-brand-clay/30 text-sm text-center"
          />
          <div>
            <label className="block text-[11px] text-brand-sage/60 text-center mb-1">{t('babyBirthDate')}</label>
            <input
              type="date"
              value={welcomeBabyBirth}
              onChange={(e) => setWelcomeBabyBirth(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full bg-white/60 border border-brand-clay/20 rounded-2xl py-3.5 px-5 focus:outline-none focus:ring-2 focus:ring-brand-clay/30 text-sm text-center"
            />
          </div>
        </div>

        <button
          onClick={onGetStarted}
          className="w-full py-4 bg-brand-clay text-white rounded-2xl text-sm font-medium hover:bg-brand-clay/90 active:bg-brand-clay/80 transition-all press-effect min-h-[52px] mb-4"
        >
          {t('getStarted')}
        </button>

        <button
          onClick={onGuestContinue}
          className="text-brand-sage text-xs underline underline-offset-4 hover:text-brand-ink transition-colors min-h-[44px] px-4"
        >
          {t('continueAsGuest')}
        </button>
      </motion.div>
    </div>
  );
}
