import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface LevelUpProps {
  level: number;
  badge?: string | null;
  show: boolean;
  onDone: () => void;
}

export default function LevelUpCelebration({ level, badge, show, onDone }: LevelUpProps) {
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (show) {
      if (!hasTriggered.current) {
        hasTriggered.current = true;

        const duration = 2000;
        const end = Date.now() + duration;

        const frame = () => {
          confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#6C63FF', '#00D4AA']
          });
          confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#6C63FF', '#00D4AA']
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };
        frame();
      }

      const timer = setTimeout(() => {
        hasTriggered.current = false;
        onDone();
      }, 2000);
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
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A0A0A]/90 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: -20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="text-center"
          >
            <h1 className="text-5xl font-extrabold mb-6 bg-gradient-to-r from-[#6C63FF] to-[#00D4AA] text-transparent bg-clip-text">
              LEVEL UP
            </h1>
            <p className="text-xl text-white/80 font-medium mb-2">
              You reached Level {level}
            </p>
            {badge && (
              <p className="text-sm font-mono text-[#00D4AA] mt-3">
                New Badge: {badge}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
