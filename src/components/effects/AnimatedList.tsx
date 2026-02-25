import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedListProps {
  children: ReactNode[];
  className?: string;
}

export default function AnimatedList({ children, className = '' }: AnimatedListProps) {
  return (
    <div className={className}>
      <AnimatePresence>
        {children.map((child, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            {child}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
