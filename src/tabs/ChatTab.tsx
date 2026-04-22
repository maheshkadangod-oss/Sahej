import React from 'react';
import { Sparkles, Send, Key, AlertCircle, Mic, MicOff, Phone, X } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import Markdown from 'react-markdown';
import { cn } from '../lib/cn';
import { t } from '../strings';
import { hasApiKey } from '../services/gemini';
import { useVoiceInput } from '../hooks/useVoiceInput';
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
  crisisSurfaceShown: boolean;
  setCrisisSurfaceShown: (v: boolean) => void;
  setActiveTab: (tab: 'home' | 'mood' | 'memory' | 'chat' | 'help') => void;
}

export default React.memo(function ChatTab({
  chatHistory, setChatHistory,
  isTyping, inputMessage, setInputMessage,
  chatError, setChatError,
  chatEndRef, handleSendMessage,
  chatPrompts,
  crisisSurfaceShown, setCrisisSurfaceShown,
  setActiveTab,
}: ChatTabProps) {
  const { isListening, isSupported, startListening, stopListening } = useVoiceInput({
    onTranscript: (text) => setInputMessage(text),
  });
  const toggleVoice = () => (isListening ? stopListening() : startListening());

  return (
    <motion.div key="chat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col" style={{ height: 'calc(100dvh - 180px)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-10 h-10 bg-brand-rose/20 rounded-full flex items-center justify-center text-brand-rose"
          >
            <Sparkles className="w-5 h-5" />
          </motion.div>
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

      {/* Crisis surface — prominent, always-visible when triggered */}
      {crisisSurfaceShown && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 bg-brand-rose text-white rounded-2xl p-4 shadow-md"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-2 flex-1">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm mb-1">You deserve support right now</p>
                <p className="text-xs text-white/90 leading-relaxed">
                  Please reach out. The helplines are free, confidential, and will not judge you.
                </p>
              </div>
            </div>
            <button
              onClick={() => setCrisisSurfaceShown(false)}
              className="p-1.5 rounded-full hover:bg-white/10 min-w-[36px] min-h-[36px] flex items-center justify-center shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setActiveTab('help')}
            className="w-full py-2.5 bg-white text-brand-rose rounded-2xl text-sm font-medium flex items-center justify-center gap-2 min-h-[44px] press-effect"
          >
            <Phone className="w-4 h-4" />
            View Emergency Helplines
          </button>
        </motion.div>
      )}

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
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className={cn("flex flex-col gap-1 mb-2", msg.role === 'user' ? "items-end" : "items-start")}
          >
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
          </motion.div>
        ))}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="flex flex-col items-start gap-1"
          >
            <div className="glass-card border border-brand-rose/10 p-4 rounded-3xl rounded-tl-none w-16 flex gap-1 items-center justify-center shadow-sm">
              <motion.div animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.9, repeat: Infinity }} className="w-1.5 h-1.5 bg-brand-rose rounded-full" />
              <motion.div animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.9, repeat: Infinity, delay: 0.18 }} className="w-1.5 h-1.5 bg-brand-rose rounded-full" />
              <motion.div animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.9, repeat: Infinity, delay: 0.36 }} className="w-1.5 h-1.5 bg-brand-rose rounded-full" />
            </div>
          </motion.div>
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
          placeholder={isListening ? 'Listening…' : t('typeHeart')}
          className={cn(
            "w-full bg-white/80 dark:bg-white/5 border border-brand-rose/20 rounded-full py-4 px-6 focus:outline-none focus:ring-2 focus:ring-brand-rose/30",
            isSupported ? 'pr-24' : 'pr-14'
          )}
        />
        {isSupported && (
          <button
            onClick={toggleVoice}
            className={cn(
              "absolute right-14 top-1/2 -translate-y-1/2 p-2.5 rounded-full transition-all press-effect min-w-[44px] min-h-[44px] flex items-center justify-center",
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-brand-rose/10 text-brand-rose hover:bg-brand-rose/20'
            )}
            aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        )}
        <button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isTyping}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-brand-rose text-white rounded-full disabled:opacity-50 transition-all press-effect min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Send className="w-5 h-5" />
        </button>
        {isListening && (
          <span className="sr-only" aria-live="polite">Listening for your voice. Tap again to stop.</span>
        )}
      </div>
    </motion.div>
  );
});
