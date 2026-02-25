import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

interface LevelUpProps {
  level: number;
  show: boolean;
  onDone: () => void;
}

export default function LevelUpCelebration({ level, show, onDone }: LevelUpProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onDone, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: [0.5, 1.2, 1] }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="text-6xl mb-4"
            >
              🎉
            </motion.div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Level Up!</h1>
            <div className="w-24 h-24 rounded-full gradient-primary glow-primary flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-foreground">{level}</span>
            </div>
            <p className="text-muted-foreground">Keep going! 🔥</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
