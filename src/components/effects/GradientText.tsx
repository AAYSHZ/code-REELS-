import { motion } from 'framer-motion';

interface GradientTextProps {
  text: string;
  from?: string;
  to?: string;
  className?: string;
}

export default function GradientText({ 
  text, 
  from = '#6c63ff', 
  to = '#00d4aa', 
  className = '' 
}: GradientTextProps) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      {text}
    </motion.span>
  );
}
