import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import Bounce from './effects/Bounce';

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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md"
        >
          <Bounce>
            <div className="text-center">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>
              <h1 className="text-4xl font-bold gradient-text mb-4">Level Up!</h1>
              <div className="w-24 h-24 rounded-full gradient-primary glow-primary flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-primary-foreground">{level}</span>
              </div>
              <p className="text-muted-foreground">Keep going! 🔥</p>
            </div>
          </Bounce>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
