import { useEffect, useRef } from 'react';

interface BeamsProps {
  color?: string;
  className?: string;
}

export default function Beams({ color = '#6c63ff', className = '' }: BeamsProps) {
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

    const beams = Array.from({ length: 6 }, (_, i) => ({
      angle: (i / 6) * Math.PI * 2,
      speed: 0.002 + Math.random() * 0.003,
      width: 2 + Math.random() * 4,
      opacity: 0.1 + Math.random() * 0.15,
    }));

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;

      beams.forEach(beam => {
        beam.angle += beam.speed;
        const length = Math.max(w, h) * 1.5;
        const endX = cx + Math.cos(beam.angle + time * 0.001) * length;
        const endY = cy + Math.sin(beam.angle + time * 0.001) * length;

        const gradient = ctx.createLinearGradient(cx, cy, endX, endY);
        gradient.addColorStop(0, color + '00');
        gradient.addColorStop(0.3, color + Math.round(beam.opacity * 255).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, color + '00');

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = beam.width;
        ctx.stroke();
      });

      time += 16;
      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [color]);

  return <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full pointer-events-none opacity-40 ${className}`} />;
}
