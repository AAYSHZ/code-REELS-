import { useEffect, useRef } from 'react';

interface BlobCursorProps {
  color?: string;
}

export default function BlobCursor({ color = '#6c63ff' }: BlobCursorProps) {
  const blobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const blob = blobRef.current;
    if (!blob) return;

    let x = 0, y = 0;
    let targetX = 0, targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const animate = () => {
      x += (targetX - x) * 0.1;
      y += (targetY - y) * 0.1;
      blob.style.transform = `translate(${x - 15}px, ${y - 15}px)`;
      requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    const id = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(id);
    };
  }, []);

  return (
    <div
      ref={blobRef}
      className="fixed top-0 left-0 pointer-events-none z-[9999] hidden md:block"
      style={{
        width: 30,
        height: 30,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}40, transparent)`,
        filter: 'blur(2px)',
        mixBlendMode: 'screen',
      }}
    />
  );
}
