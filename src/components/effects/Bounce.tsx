import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface BounceProps {
  children: ReactNode;
  className?: string;
}

export default function Bounce({ children, className = '' }: BounceProps) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 1.3, 0.9, 1.05, 1], opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
