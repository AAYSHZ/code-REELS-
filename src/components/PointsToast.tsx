import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

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
          initial={{ opacity: 0, y: 50, x: 50 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed bottom-24 right-4 z-50"
        >
          <div className="gradient-primary px-4 py-2 rounded-xl glow-primary shadow-xl">
            <span className="font-bold text-foreground text-lg">+{points} XP</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
