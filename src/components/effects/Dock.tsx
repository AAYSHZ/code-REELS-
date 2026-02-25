import { useState, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface DockItem {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}

interface DockProps {
  items: DockItem[];
  className?: string;
}

export default function Dock({ items, className = '' }: DockProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const getScale = (index: number) => {
    if (hoveredIndex === null) return 1;
    const diff = Math.abs(hoveredIndex - index);
    if (diff === 0) return 1.4;
    if (diff === 1) return 1.15;
    return 1;
  };

  return (
    <div className={`flex items-end justify-center gap-1 px-3 py-2 glass rounded-2xl ${className}`}>
      {items.map((item, i) => (
        <motion.button
          key={i}
          onMouseEnter={() => setHoveredIndex(i)}
          onMouseLeave={() => setHoveredIndex(null)}
          onClick={item.onClick}
          animate={{ scale: getScale(i) }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-colors ${
            item.active ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          {item.icon}
          <span className="text-[9px]">{item.label}</span>
        </motion.button>
      ))}
    </div>
  );
}
