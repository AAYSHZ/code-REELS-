import { motion } from "framer-motion";

const fadIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } };

const features = [
    { icon: "📱", title: "Mobile App", desc: "React Native iOS & Android" },
    { icon: "🎥", title: "In-Browser Recording", desc: "Record reels without leaving CodeReels" },
    { icon: "💻", title: "Code Overlay", desc: "Syntax-highlighted code on top of your video" },
    { icon: "🤖", title: "AI Recommendations", desc: "Personalized feed based on your history" },
    { icon: "🔐", title: "Encrypted DMs", desc: "End-to-end encrypted private messages" },
    { icon: "🏆", title: "Certificates", desc: "Shareable achievement certificates for LinkedIn" },
    { icon: "💼", title: "Internship Pipeline", desc: "Top creators get internship referrals" },
    { icon: "🗜️", title: "Video Compression", desc: "Auto-compress before upload" },
];

export default function ComingSoonTab() {
    return (
        <motion.div {...fadIn}>
            <p className="text-sm text-white/50 mb-4">These features are in development and will be rolling out soon.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {features.map((f, i) => (
                    <div
                        key={i}
                        className="bg-[#1A1A1A]/60 border border-white/[0.06] rounded-xl p-4 flex items-start gap-3 opacity-60"
                    >
                        <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center text-xl flex-shrink-0">
                            {f.icon}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-white/80">{f.title}</p>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/30 font-mono uppercase">Soon</span>
                            </div>
                            <p className="text-[12px] text-white/40 mt-0.5">{f.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
