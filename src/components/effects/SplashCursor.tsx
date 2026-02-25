import { useCallback, useRef } from 'react';

interface SplashCursorProps {
  color?: string;
  children: React.ReactNode;
}

export default function SplashCursor({ color = '#6c63ff', children }: SplashCursorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const splash = document.createElement('div');
    splash.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: radial-gradient(circle, ${color}30, transparent);
      pointer-events: none;
      z-index: 10;
      transform: translate(-50%, -50%);
    `;
    container.appendChild(splash);

    const startTime = Date.now();
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed > 0.6) {
        splash.remove();
        return;
      }
      const size = elapsed * 300;
      splash.style.width = `${size}px`;
      splash.style.height = `${size}px`;
      splash.style.opacity = String(1 - elapsed / 0.6);
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [color]);

  return (
    <div ref={containerRef} className="relative" onClick={handleClick}>
      {children}
    </div>
  );
}
