import React from 'react';
import { Search, Calendar, Plus, Sparkles, Brain, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { t } from '../strings';
import type { MemoryEntry } from '../types';

interface MemoryTabProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  memoryInput: string;
  setMemoryInput: (v: string) => void;
  winInput: string;
  setWinInput: (v: string) => void;
  handleAddMemory: () => void;
  handleAddWin: () => void;
  deleteMemory: (id: string) => void;
  filteredMemories: MemoryEntry[];
}

export default React.memo(function MemoryTab({
  searchQuery, setSearchQuery,
  memoryInput, setMemoryInput,
  winInput, setWinInput,
  handleAddMemory, handleAddWin, deleteMemory,
  filteredMemories,
}: MemoryTabProps) {
  return (
    <motion.div key="memory" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-medium">{t('memoryVault')}</h2>
        <div className="p-2 bg-brand-sage/10 rounded-full text-brand-sage">
          <Brain className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder={t('searchMemories')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            enterKeyHint="search"
            className="w-full bg-white/60 border border-brand-clay/10 rounded-2xl py-3 px-10 focus:outline-none focus:ring-2 focus:ring-brand-clay/30 text-sm"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-sage w-4 h-4" />
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder={t('putWhere')}
            value={memoryInput}
            onChange={(e) => setMemoryInput(e.target.value)}
            enterKeyHint="done"
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddMemory(); }}
            className="flex-1 bg-white/60 border border-brand-clay/20 rounded-2xl py-3.5 px-5 focus:outline-none focus:ring-2 focus:ring-brand-clay/30 text-sm"
          />
          <button
            onClick={handleAddMemory}
            disabled={!memoryInput.trim()}
            className="px-4 py-3.5 bg-brand-clay text-white rounded-2xl text-sm font-medium disabled:opacity-40 transition-all press-effect min-w-[60px] min-h-[44px]"
          >
            {t('addMemory')}
          </button>
        </div>

        <div className="glass-card rounded-2xl p-4">
          <h3 className="text-sm font-medium mb-3">{t('momWin')}</h3>
          <div className="flex gap-2 items-end">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={t('winPlaceholder')}
                value={winInput}
                onChange={(e) => setWinInput(e.target.value)}
                enterKeyHint="done"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddWin(); }}
                className="w-full bg-transparent border-b border-brand-clay/20 py-2 pr-6 focus:outline-none focus:border-brand-clay text-sm"
              />
              <Sparkles className="absolute right-0 top-1/2 -translate-y-1/2 text-brand-clay/40 w-4 h-4" />
            </div>
            <button
              onClick={handleAddWin}
              disabled={!winInput.trim()}
              className="p-2.5 bg-brand-gold/20 text-brand-clay rounded-full disabled:opacity-40 transition-all press-effect min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredMemories.length === 0 ? (
          <div className="text-center py-12 text-brand-sage italic">
            {searchQuery ? t('noMatches') : t('noMemories')}
          </div>
        ) : (
          filteredMemories.map((m) => (
            <div key={m.id} className="glass-card rounded-2xl p-4 flex items-start gap-3">
              <div className="p-2 bg-brand-clay/10 rounded-lg text-brand-clay shrink-0">
                {m.category === 'location' ? <Search className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm break-words">{m.content}</p>
                <span className="text-[10px] text-brand-sage">{format(m.timestamp, 'MMM d')}</span>
              </div>
              <button
                onClick={() => deleteMemory(m.id)}
                className="p-2 text-red-300 hover:text-red-500 active:text-red-600 transition-all opacity-60 hover:opacity-100 min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0"
                aria-label="Delete memory"
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
