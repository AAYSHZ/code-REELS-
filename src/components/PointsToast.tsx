import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

interface PointsToastProps {
  points: number;
  show: boolean;
  onDone: () => void;
  type?: string;
}

export default function PointsToast({ points, show, onDone, type = "Creator Points" }: PointsToastProps) {
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
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          className="fixed bottom-24 right-6 z-50 pointer-events-none"
        >
          <div className="bg-[#1A1A1A] border border-white/10 border-l-4 border-l-white/30 rounded-lg p-4 flex flex-col gap-0.5 shadow-2xl min-w-[200px]">
            <span className="text-lg font-bold text-white">+{points} XP</span>
            <span className="text-xs text-gray-400">{type}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
