import { motion } from "framer-motion";

const card = "bg-[#1A1A1A] border border-white/[0.08] rounded-xl p-4";
const fadIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } };

export default function HowItWorksTab() {
    return (
        <motion.div className="space-y-6" {...fadIn}>
            {/* Content Reach Algorithm */}
            <div className={card}>
                <h3 className="text-base font-bold text-white mb-2">📡 Content Reach Algorithm</h3>
                <p className="text-sm text-white/70 mb-4">
                    CodeReels uses a smart algorithm to decide how many people see your reel.
                    Quality content naturally goes viral.
                </p>
                <div className="space-y-3">
                    {[
                        { step: 1, text: "Your reel is shown to 100 random users first" },
                        { step: 2, text: "Platform measures likes, watch time, shares" },
                        { step: 3, text: "Based on performance, pushed to more users:" },
                    ].map((s) => (
                        <div key={s.step} className="flex items-start gap-3 text-sm">
                            <span className="w-6 h-6 rounded-full bg-[#6C63FF]/20 text-[#6C63FF] text-xs flex items-center justify-center flex-shrink-0 font-bold mt-0.5">{s.step}</span>
                            <span className="text-white/70">{s.text}</span>
                        </div>
                    ))}
                    <div className="ml-9 space-y-1.5 text-[12px]">
                        <div className="flex items-center gap-2">
                            <span className="text-white/50">Score &gt; 0.50 →</span>
                            <span className="text-white font-mono">1,000 users</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-white/50">Score &gt; 0.65 →</span>
                            <span className="text-white font-mono">5,000 users</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-white/50">Score &gt; 0.75 →</span>
                            <span className="text-[#00D4AA] font-mono font-bold">20,000 users (VIRAL 🔥)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Community Validation */}
            <div className={card}>
                <h3 className="text-base font-bold text-white mb-2">🗳️ Community Validation</h3>
                <p className="text-sm text-white/70 mb-3">Level 10+ users can vote on reel quality:</p>
                <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                        <span className="text-green-400 flex-shrink-0">✅</span>
                        <span className="text-white/70"><span className="text-white font-medium">High Quality Explanation</span> → reel gets boosted</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="text-red-400 flex-shrink-0">❌</span>
                        <span className="text-white/70"><span className="text-white font-medium">Incorrect Logic</span> → creator loses 30% of reel points</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="text-yellow-400 flex-shrink-0">⚠️</span>
                        <span className="text-white/70"><span className="text-white font-medium">Incomplete Solution</span> → flagged for review</span>
                    </div>
                </div>
            </div>

            {/* Anti-Farming Protection */}
            <div className={`${card} border-red-500/20`}>
                <h3 className="text-base font-bold text-white mb-2">🛡️ Anti-Farming Protection</h3>
                <p className="text-sm text-white/70 mb-3">Our system detects and punishes point farming:</p>
                <ul className="text-sm text-white/70 space-y-1.5 list-disc list-inside">
                    <li><span className="text-white/90 font-medium">Post + delete exploit:</span> XP is deducted on deletion</li>
                    <li><span className="text-white/90 font-medium">Same IP liking multiple times:</span> Authenticity Factor drops to 0.3</li>
                    <li><span className="text-white/90 font-medium">Spam patterns</span> reduce points by up to 70%</li>
                </ul>
            </div>

            {/* Reputation Score */}
            <div className={card}>
                <h3 className="text-base font-bold text-white mb-2">⭐ Reputation Score</h3>
                <p className="text-sm text-white/70 mb-3">The more trusted you are, the more you earn.</p>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="font-mono text-[#6C63FF]">RS = 3,000</span>
                        <span className="text-white/70">you earn <span className="text-[#00D4AA] font-bold">30% more</span> points per reel</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-mono text-[#6C63FF]">RS = 5,000</span>
                        <span className="text-white/70">your content reaches <span className="text-[#00D4AA] font-bold">20% more</span> users</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-mono text-[#6C63FF]">RS = 20,000</span>
                        <span className="text-white/70">your content reaches <span className="text-[#00D4AA] font-bold">50% more</span> users</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
