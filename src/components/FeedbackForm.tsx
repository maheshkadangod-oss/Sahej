import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { submitFeedback } from '../services/adminApi';

interface FeedbackFormProps {
  show: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export default function FeedbackForm({ show, onClose, showToast }: FeedbackFormProps) {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (message.trim().length < 3) return;
    setSending(true);
    const ok = await submitFeedback(message.trim(), email.trim() || undefined);
    setSending(false);
    if (ok) {
      showToast('Thank you for your feedback!');
      setMessage('');
      setEmail('');
      onClose();
    } else {
      showToast('Could not send. Try again later.');
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-brand-cream dark:bg-brand-ink w-full max-w-sm rounded-3xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Share Your Experience</h3>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 min-w-[44px] min-h-[44px] flex items-center justify-center">
                <X className="w-5 h-5 text-brand-sage" />
              </button>
            </div>

            <p className="text-sm text-brand-sage">Your feedback helps us make Sahej better for every mama.</p>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What's working? What could be better?"
              rows={4}
              maxLength={1000}
              className="w-full bg-white/60 dark:bg-white/5 border border-brand-clay/20 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-clay/30 text-sm resize-none"
            />

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email (optional — if you'd like a reply)"
              className="w-full bg-white/60 dark:bg-white/5 border border-brand-clay/20 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-clay/30 text-sm"
            />

            <button
              onClick={handleSubmit}
              disabled={message.trim().length < 3 || sending}
              className="w-full py-3 bg-brand-clay text-white rounded-2xl text-sm font-medium press-effect min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Feedback
                </>
              )}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
