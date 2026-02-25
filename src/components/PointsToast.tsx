import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { Zap } from 'lucide-react';

interface PointsToastProps {
  points: number;
  show: boolean;
  onDone: () => void;
}

export default function PointsToast({ points, show, onDone }: PointsToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onDone, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed bottom-24 right-4 z-50"
        >
          <div className="gradient-primary px-4 py-2.5 rounded-xl glow-primary shadow-2xl flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary-foreground" />
            <span className="font-bold text-primary-foreground text-lg">+{points} XP</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
