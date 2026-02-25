import { useEffect, useRef } from 'react';

interface AuroraProps {
  colorStops?: string[];
  speed?: number;
  className?: string;
}

export default function Aurora({ 
  colorStops = ['#6c63ff', '#00d4aa', '#0a0a0a'], 
  speed = 3,
  className = '' 
}: AuroraProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < colorStops.length; i++) {
        const x = w * 0.5 + Math.sin(time * 0.001 * speed + i * 2) * w * 0.3;
        const y = h * 0.5 + Math.cos(time * 0.0015 * speed + i * 1.5) * h * 0.3;
        const radius = Math.max(w, h) * (0.3 + Math.sin(time * 0.002 + i) * 0.1);
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, colorStops[i] + '60');
        gradient.addColorStop(0.5, colorStops[i] + '20');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
      }

      time += 16;
      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [colorStops, speed]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ filter: 'blur(60px)' }}
    />
  );
}
