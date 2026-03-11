import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import BlurText from './effects/BlurText';

export default function SplashScreen() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let startTime: number | null = null;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const draw = (time: number) => {
            if (!startTime) startTime = time;
            // 2 seconds animation
            const progress = Math.min((time - startTime) / 2000, 1);

            const width = canvas.width;
            const height = canvas.height;
            const cx = width / 2;
            const cy = height / 2;
            const maxRadius = Math.max(width, height);

            ctx.clearRect(0, 0, width, height);
            ctx.strokeStyle = 'rgba(0, 212, 170, 0.15)';
            ctx.lineWidth = 1;

            // Draw 8 radial lines
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI * 2) / 8;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + Math.cos(angle) * maxRadius, cy + Math.sin(angle) * maxRadius);
                ctx.setLineDash([maxRadius]);
                ctx.lineDashOffset = maxRadius * (1 - progress);
                ctx.stroke();
            }

            // Draw 6 concentric polygon rings
            for (let j = 1; j <= 6; j++) {
                const r = (maxRadius * j) / 6;
                ctx.beginPath();
                for (let i = 0; i <= 8; i++) {
                    const angle = (i * Math.PI * 2) / 8;
                    const x = cx + Math.cos(angle) * r;
                    const y = cy + Math.sin(angle) * r;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }

                const sideLength = 2 * r * Math.sin(Math.PI / 8);
                const perimeter = 8 * sideLength;
                ctx.setLineDash([perimeter]);
                ctx.lineDashOffset = perimeter * (1 - progress);
                ctx.stroke();
            }

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(draw);
            }
        };

        animationFrameId = requestAnimationFrame(draw);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[9999] bg-[#0A0A0A] flex flex-col items-center justify-center gap-8 w-screen h-[100dvh]"
        >
            {/* Animated Spider Web Canvas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none z-0"
            />

            <div className="z-10 flex flex-col items-center justify-center gap-8 w-full">
                <BlurText
                    text="CodeReels"
                    className="text-5xl md:text-7xl font-bold text-white tracking-tight"
                    delay={0.2}
                />

                {/* Loading bar */}
                <div
                    style={{
                        width: '60%',
                        maxWidth: '400px',
                        height: '3px',
                        backgroundColor: '#1a1a1a',
                        borderRadius: '9999px',
                        overflow: 'hidden',
                    }}
                >
                    <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2, ease: 'easeInOut' }}
                        style={{
                            height: '100%',
                            backgroundColor: '#00D4AA',
                            borderRadius: '9999px',
                        }}
                    />
                </div>
            </div>
        </motion.div>
    );
}
