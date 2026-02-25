import { motion } from 'framer-motion';

interface CircularTextProps {
  text: string;
  radius?: number;
  className?: string;
}

export default function CircularText({ text, radius = 60, className = '' }: CircularTextProps) {
  const chars = text.split('');
  const angleStep = 360 / chars.length;

  return (
    <motion.div
      className={`absolute inset-0 ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
    >
      {chars.map((char, i) => (
        <span
          key={i}
          className="absolute text-[10px] font-mono text-muted-foreground tracking-widest"
          style={{
            left: '50%',
            top: '50%',
            transform: `rotate(${angleStep * i}deg) translateY(-${radius}px)`,
            transformOrigin: '0 0',
          }}
        >
          {char}
        </span>
      ))}
    </motion.div>
  );
}
