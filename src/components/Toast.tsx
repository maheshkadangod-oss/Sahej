import { motion, AnimatePresence } from 'motion/react';

interface ToastProps {
  message: string;
}

export default function Toast({ message }: ToastProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-brand-ink text-white text-sm px-5 py-3 rounded-2xl shadow-lg"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
