import { Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { reassurances } from '../data/reassurances';

interface ReassuranceCardProps {
  dayOfYear: number;
}

export default function ReassuranceCard({ dayOfYear }: ReassuranceCardProps) {
  const message = reassurances[dayOfYear % reassurances.length];
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-brand-rose/10 dark:bg-brand-rose/15 border border-brand-rose/20 rounded-3xl p-5 flex items-start gap-3"
    >
      <div className="w-9 h-9 bg-brand-rose/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
        <Heart className="w-4 h-4 text-brand-rose" />
      </div>
      <p className="text-sm text-brand-ink/80 dark:text-brand-ink/70 leading-relaxed italic flex-1">
        "{message}"
      </p>
    </motion.section>
  );
}
