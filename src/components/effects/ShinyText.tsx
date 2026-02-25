import { motion } from 'framer-motion';

interface ShinyTextProps {
  text: string;
  className?: string;
}

export default function ShinyText({ text, className = '' }: ShinyTextProps) {
  return (
    <motion.span
      className={`relative inline-block ${className}`}
      style={{
        background: 'linear-gradient(90deg, #ffffff 0%, #ffffff 40%, #00d4aa 50%, #ffffff 60%, #ffffff 100%)',
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animation: 'shinySlide 3s linear infinite',
      }}
    >
      {text}
      <style>{`
        @keyframes shinySlide {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </motion.span>
  );
}
