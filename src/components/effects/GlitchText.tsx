import { useState, useEffect } from 'react';

interface GlitchTextProps {
  text: string;
  className?: string;
}

export default function GlitchText({ text, className = '' }: GlitchTextProps) {
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 200);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={`relative inline-block ${className}`}>
      <span className="relative z-10">{text}</span>
      {glitching && (
        <>
          <span
            className="absolute top-0 left-0 z-20"
            style={{
              color: '#ff4757',
              clipPath: 'inset(10% 0 60% 0)',
              transform: 'translate(-2px, -1px)',
            }}
          >
            {text}
          </span>
          <span
            className="absolute top-0 left-0 z-20"
            style={{
              color: '#00d4aa',
              clipPath: 'inset(50% 0 10% 0)',
              transform: 'translate(2px, 1px)',
            }}
          >
            {text}
          </span>
        </>
      )}
    </span>
  );
}
