import { motion } from 'framer-motion';
import BlurText from './effects/BlurText';

export default function SplashScreen() {
    return (
        <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[9999] bg-[#0A0A0A] flex flex-col items-center justify-center gap-8 w-screen h-[100dvh]"
        >
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
        </motion.div>
    );
}
