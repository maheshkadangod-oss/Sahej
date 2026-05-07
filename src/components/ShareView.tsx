import { useEffect, useState } from 'react';
import { Heart, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { fetchSharedSummary, type SharedMoodSummary } from '../services/adminApi';

const moodLabels = ['', 'Very Low', 'Low', 'Neutral', 'Good', 'Great'];
const moodEmojis = ['', '😔', '😕', '😐', '🙂', '✨'];

function trendIcon(trend: string) {
  if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (trend === 'down') return <TrendingDown className="w-4 h-4 text-rose-500" />;
  return <Minus className="w-4 h-4 text-brand-sage" />;
}

function trendMessage(trend: string, avg: number | null) {
  if (avg === null) return "She hasn't logged yet this week.";
  if (trend === 'up') return 'Things have been trending upward this week. A small but real improvement.';
  if (trend === 'down') return 'It has been a heavier week. Your presence matters more than you know.';
  return "Her moods have been steady. Consistency is its own kind of strength.";
}

export default function ShareView({ token }: { token: string }) {
  const [data, setData] = useState<SharedMoodSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchSharedSummary(token).then(d => {
      if (cancelled) return;
      if (!d) setError('This link has expired or is no longer valid.');
      else setData(d);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-brand-cream">
        <div className="w-8 h-8 border-2 border-brand-clay/30 border-t-brand-clay rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center bg-brand-cream px-6 text-center">
        <div className="w-16 h-16 bg-brand-rose/20 rounded-full flex items-center justify-center mb-6">
          <Heart className="w-8 h-8 text-brand-rose" />
        </div>
        <h1 className="text-2xl font-serif mb-3">Link not found</h1>
        <p className="text-brand-sage max-w-sm">{error || 'This share link may have expired. Share links are active for 30 days.'}</p>
        <a href="/" className="mt-8 text-brand-clay underline underline-offset-4 text-sm">Learn about Sahej</a>
      </div>
    );
  }

  const { displayName, moodSummary } = data;
  const { avgMood, streak, trend, weekMoods } = moodSummary;

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col max-w-md mx-auto bg-brand-cream relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-72 h-72 bg-brand-rose/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-5%] w-56 h-56 bg-brand-sage/10 rounded-full blur-3xl pointer-events-none" />

      <header className="px-6 pt-10 pb-4 z-10">
        <div className="w-12 h-12 bg-brand-rose/20 rounded-full flex items-center justify-center mb-4">
          <Heart className="w-6 h-6 text-brand-rose" />
        </div>
        <h1 className="text-2xl font-serif text-brand-ink mb-1">A note from {displayName}</h1>
        <p className="text-sm text-brand-sage italic">A gentle snapshot of how she has been.</p>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-10 z-10 space-y-5">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">This Week</h2>
            <div className="flex items-center gap-1.5 text-sm text-brand-sage">
              {trendIcon(trend)}
              <span className="capitalize">{trend}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/50 rounded-2xl p-4 text-center">
              <p className="text-3xl font-serif text-brand-clay">
                {avgMood !== null ? avgMood.toFixed(1) : '—'}
              </p>
              <p className="text-[11px] text-brand-sage uppercase tracking-wide mt-1">Average Mood</p>
            </div>
            <div className="bg-white/50 rounded-2xl p-4 text-center">
              <p className="text-3xl font-serif text-brand-clay">{streak}</p>
              <p className="text-[11px] text-brand-sage uppercase tracking-wide mt-1">Day Streak</p>
            </div>
          </div>

          <p className="text-sm text-brand-ink/80 leading-relaxed italic">{trendMessage(trend, avgMood)}</p>
        </motion.section>

        {weekMoods.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-3xl p-6 space-y-4"
          >
            <h2 className="text-lg font-medium">Recent days</h2>
            <div className="space-y-2">
              {weekMoods.map((m, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/40 rounded-2xl p-3">
                  <span className="text-2xl">{moodEmojis[m.level] || '·'}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{moodLabels[m.level] || '—'}</p>
                    <p className="text-[11px] text-brand-sage">{m.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-brand-rose/10 rounded-3xl p-6 text-center"
        >
          <p className="text-sm text-brand-ink/80 leading-relaxed">
            Your presence and patience are the most important thing right now.
            Ask her how she's doing. Listen without fixing. That's enough.
          </p>
        </motion.section>

        <p className="text-center text-[11px] text-brand-sage mt-6">
          Shared on {format(data.createdAt, 'MMM d, yyyy')} · Link expires in 30 days
        </p>
      </main>

      <footer className="px-6 pb-8 text-center z-10">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-xs text-brand-sage hover:text-brand-clay transition-colors"
        >
          <Heart className="w-3 h-3" />
          Made with love on Sahej
        </a>
      </footer>
    </div>
  );
}
