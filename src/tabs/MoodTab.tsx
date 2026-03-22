import React from 'react';
import { Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { t } from '../strings';
import type { MoodEntry } from '../types';

interface MoodTabProps {
  moods: MoodEntry[];
  setMoods: React.Dispatch<React.SetStateAction<MoodEntry[]>>;
  chartData: { date: string; level: number }[];
  weekMoods: MoodEntry[];
  avgMood: string | null;
  moodTrend: string;
  darkMode: boolean;
  moodLabel: (level: number) => string;
}

export default React.memo(function MoodTab({
  moods, setMoods, chartData, weekMoods, avgMood, moodTrend, darkMode, moodLabel
}: MoodTabProps) {
  return (
    <motion.div key="mood" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <h2 className="text-2xl font-medium">{t('moodJourney')}</h2>

      {/* Weekly Summary */}
      {weekMoods.length > 0 && (
        <div className="glass-card rounded-2xl p-4">
          <h3 className="text-sm font-medium text-brand-sage mb-3">{t('weeklyMoodSummary')}</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-2xl font-serif font-semibold text-brand-clay">{avgMood}</div>
              <div className="text-[10px] text-brand-sage uppercase">{t('avgMood')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-serif font-semibold text-brand-ink">{weekMoods.length}</div>
              <div className="text-[10px] text-brand-sage uppercase">{t('totalEntries')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-serif font-semibold">
                {moodTrend === 'up' ? '📈' : moodTrend === 'down' ? '📉' : '📊'}
              </div>
              <div className="text-[10px] text-brand-sage uppercase">
                {moodTrend === 'up' ? t('trendUp') : moodTrend === 'down' ? t('trendDown') : t('trendStable')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      {moods.length > 1 && (
        <div className="glass-card rounded-3xl p-4 h-64">
          <h3 className="text-sm font-medium mb-4 text-brand-sage">{t('fluctuations')}</h3>
          <ResponsiveContainer width="100%" height="80%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#333' : '#E5E7EB'} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#7D8C7C' }} dy={10} />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#7D8C7C' }} />
              <Tooltip contentStyle={{ backgroundColor: darkMode ? '#2D312E' : '#FDF8F4', borderRadius: '12px', border: '1px solid #C8956C', fontSize: '12px', color: darkMode ? '#E8E5E0' : '#2D312E' }} />
              <Line type="monotone" dataKey="level" stroke="#C8956C" strokeWidth={3} dot={{ r: 4, fill: '#C8956C', strokeWidth: 2, stroke: darkMode ? '#2D312E' : '#FDF8F4' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Mood entries */}
      <div className="space-y-4">
        {moods.length === 0 ? (
          <div className="text-center py-12 text-brand-sage italic">{t('noMoods')}</div>
        ) : (
          moods.map((entry) => (
            <div key={entry.id} className="glass-card rounded-2xl p-4 flex items-start gap-4">
              <div className="text-3xl shrink-0">
                {entry.level === 1 ? '😔' : entry.level === 2 ? '😕' : entry.level === 3 ? '😐' : entry.level === 4 ? '🙂' : '✨'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-brand-sage">{format(entry.timestamp, 'MMM d, h:mm a')}</div>
                <div className="font-medium">{moodLabel(entry.level)}</div>
                {entry.note && (
                  <p className="text-xs text-brand-ink/70 mt-1 italic">"{entry.note}"</p>
                )}
              </div>
              <button
                onClick={() => setMoods(prev => prev.filter(m => m.id !== entry.id))}
                className="p-2 text-red-300 hover:text-red-500 active:text-red-600 transition-all opacity-60 hover:opacity-100 min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0"
                aria-label="Delete mood entry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
});
