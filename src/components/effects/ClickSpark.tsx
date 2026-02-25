import { useCallback, useRef, ReactNode } from 'react';

interface ClickSparkProps {
  children: ReactNode;
  color?: string;
}

export default function ClickSpark({ children, color = '#ff4757' }: ClickSparkProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (let i = 0; i < 8; i++) {
      const spark = document.createElement('div');
      const angle = (i / 8) * Math.PI * 2;
      const velocity = 30 + Math.random() * 30;
      const dx = Math.cos(angle) * velocity;
      const dy = Math.sin(angle) * velocity;

      spark.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: ${color};
        pointer-events: none;
        z-index: 100;
        box-shadow: 0 0 6px ${color};
      `;
      container.appendChild(spark);

      const startTime = Date.now();
      const animate = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed > 0.5) {
          spark.remove();
          return;
        }
        const progress = elapsed / 0.5;
        spark.style.transform = `translate(${dx * progress}px, ${dy * progress + 20 * progress * progress}px) scale(${1 - progress})`;
        spark.style.opacity = String(1 - progress);
        requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }
  }, [color]);

  return (
    <div ref={containerRef} className="relative" onClick={handleClick}>
      {children}
    </div>
  );
}
