import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface FadeContentProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export default function FadeContent({ children, className = '', delay = 0 }: FadeContentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
