import { useEffect, useRef } from 'react';

interface LightningProps {
  color?: string;
  className?: string;
}

export default function Lightning({ color = '#6c63ff', className = '' }: LightningProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const drawBolt = (x1: number, y1: number, x2: number, y2: number, depth: number) => {
      if (depth === 0) return;
      const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * 60;
      const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * 60;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(midX, midY);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = color + (depth > 2 ? 'cc' : '66');
      ctx.lineWidth = depth * 0.5;
      ctx.stroke();

      if (Math.random() > 0.6) {
        drawBolt(midX, midY, midX + (Math.random() - 0.5) * 100, midY + Math.random() * 80, depth - 1);
      }

      drawBolt(x1, y1, midX, midY, depth - 1);
      drawBolt(midX, midY, x2, y2, depth - 1);
    };

    let lastTime = 0;
    const draw = (time: number) => {
      if (time - lastTime > 2000 + Math.random() * 3000) {
        lastTime = time;
        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;
        
        ctx.clearRect(0, 0, w, h);
        ctx.shadowBlur = 20;
        ctx.shadowColor = color;
        
        const startX = Math.random() * w;
        drawBolt(startX, 0, startX + (Math.random() - 0.5) * 200, h, 5);
        
        ctx.shadowBlur = 0;
        
        setTimeout(() => ctx.clearRect(0, 0, w, h), 150);
      }
      animationId = requestAnimationFrame(draw);
    };
    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [color]);

  return <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full pointer-events-none ${className}`} />;
}
