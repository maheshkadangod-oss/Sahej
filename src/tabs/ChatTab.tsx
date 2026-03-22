import React from 'react';
import { Sparkles, Send, Key, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import Markdown from 'react-markdown';
import { cn } from '../lib/cn';
import { t } from '../strings';
import { hasApiKey } from '../services/gemini';
import type { ChatMessage } from '../types';

interface ChatTabProps {
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  isTyping: boolean;
  inputMessage: string;
  setInputMessage: (v: string) => void;
  chatError: string;
  setChatError: (v: string) => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  handleSendMessage: () => void;
  chatPrompts: string[];
}

export default React.memo(function ChatTab({
  chatHistory, setChatHistory,
  isTyping, inputMessage, setInputMessage,
  chatError, setChatError,
  chatEndRef, handleSendMessage,
  chatPrompts,
}: ChatTabProps) {
  return (
    <motion.div key="chat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col" style={{ height: 'calc(100dvh - 180px)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-rose/20 rounded-full flex items-center justify-center text-brand-rose">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-medium">{t('ashaDidi')}</h2>
            <p className="text-[10px] text-brand-sage">{t('ashaSaheli')}</p>
          </div>
        </div>
        {chatHistory.length > 0 && (
          <button
            onClick={() => { if (window.confirm(t('clearChatConfirm'))) { setChatHistory([]); setChatError(''); } }}
            className="text-[10px] text-brand-sage/60 hover:text-brand-sage active:text-brand-ink px-3 py-1.5 rounded-full border border-brand-sage/20 min-h-[36px]"
          >
            {t('clearChat')}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
        {chatHistory.length === 0 && (
          <div className="space-y-6">
            <div className="text-center py-6 text-brand-sage italic text-sm">
              "{t('ashaGreeting')}"
            </div>
            {!hasApiKey() && (
              <div className="flex items-start gap-3 p-4 bg-brand-gold/10 border border-brand-gold/20 rounded-2xl">
                <Key className="w-5 h-5 text-brand-clay shrink-0 mt-0.5" />
                <p className="text-xs text-brand-ink/70">{t('chatNeedsKey')}</p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-2">
              {chatPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setInputMessage(prompt)}
                  className="text-left p-3.5 rounded-2xl bg-white/40 border border-brand-rose/10 text-xs hover:bg-brand-rose/5 active:bg-brand-rose/10 transition-colors min-h-[44px]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
        {chatHistory.map((msg, i) => (
          <div key={i} className={cn("flex flex-col gap-1 mb-2", msg.role === 'user' ? "items-end" : "items-start")}>
            <div className={cn(
              "max-w-[85%] p-4 rounded-3xl text-sm transition-all shadow-sm",
              msg.role === 'user'
                ? "bg-brand-clay text-white rounded-tr-none"
                : "glass-card border border-brand-rose/10 text-brand-ink rounded-tl-none"
            )}>
              <div className="markdown-body">
                <Markdown>{msg.parts[0].text}</Markdown>
              </div>
            </div>
            <span className="text-[9px] text-brand-sage/60 px-2">
              {format(msg.timestamp, 'h:mm a')}
            </span>
          </div>
        ))}
        {isTyping && (
          <div className="flex flex-col items-start gap-1">
            <div className="glass-card border border-brand-rose/10 p-4 rounded-3xl rounded-tl-none w-16 flex gap-1 items-center justify-center shadow-sm">
              <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity }} className="w-1.5 h-1.5 bg-brand-rose/40 rounded-full" />
              <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-brand-rose/40 rounded-full" />
              <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 bg-brand-rose/40 rounded-full" />
            </div>
          </div>
        )}
        {chatError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-2xl">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 dark:text-red-300">{chatError}</p>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="mt-4 relative">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          enterKeyHint="send"
          placeholder={t('typeHeart')}
          className="w-full bg-white/80 dark:bg-white/5 border border-brand-rose/20 rounded-full py-4 px-6 pr-14 focus:outline-none focus:ring-2 focus:ring-brand-rose/30"
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isTyping}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-brand-rose text-white rounded-full disabled:opacity-50 transition-all press-effect min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
});
