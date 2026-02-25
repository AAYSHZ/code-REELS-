import { useRef, useState, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface TiltedCardProps {
  children: ReactNode;
  className?: string;
  tiltAmount?: number;
}

export default function TiltedCard({ children, className = '', tiltAmount = 10 }: TiltedCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('perspective(600px) rotateX(0deg) rotateY(0deg)');

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTransform(`perspective(600px) rotateY(${x * tiltAmount}deg) rotateX(${-y * tiltAmount}deg) scale(1.02)`);
  };

  const handleMouseLeave = () => {
    setTransform('perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)');
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{ transform, transition: 'transform 0.2s ease-out', transformStyle: 'preserve-3d' }}
    >
      {children}
    </div>
  );
}
