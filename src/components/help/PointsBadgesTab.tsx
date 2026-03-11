import { motion } from "framer-motion";

const card = "bg-[#1A1A1A] border border-white/[0.08] rounded-xl p-4";
const fadIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } };

const badges = [
    { icon: "🥉", lv: 1, name: "NEWCOMER", perk: "Starting rank" },
    { icon: "⚔️", lv: 5, name: "CODER", perk: "Custom username color unlocked" },
    { icon: "🔧", lv: 10, name: "DEBUGGER", perk: "Community validation rights" },
    { icon: "🏛️", lv: 20, name: "ARCHITECT", perk: "Extended upload limit" },
    { icon: "👑", lv: 50, name: "CODE MASTER", perk: "Elite status, permanent perks" },
];

const milestones = [
    { pts: "1,000", label: "Featured on homepage", unlocked: false },
    { pts: "5,000", label: "Featured slot 12 hours", unlocked: false },
    { pts: "10,000", label: "✓ Verified Creator Badge", unlocked: false },
    { pts: "20,000", label: "💰 Monetization unlocked", unlocked: false },
    { pts: "50,000", label: "⭐ Verified Elite Creator (permanent)", unlocked: false },
];

export default function PointsBadgesTab() {
    return (
        <motion.div className="space-y-6" {...fadIn}>
            {/* Three Point Categories */}
            <div>
                <h3 className="text-base font-bold text-white mb-3">🏆 Three Point Categories</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className={`${card} border-l-4 border-l-purple-500`}>
                        <p className="text-sm font-bold text-purple-400 mb-1">🟣 CREATOR POINTS</p>
                        <p className="text-[12px] text-white/60 leading-relaxed">
                            Earned when others engage with YOUR reels → Likes, saves, shares, watch completions
                        </p>
                    </div>
                    <div className={`${card} border-l-4 border-l-cyan-500`}>
                        <p className="text-sm font-bold text-cyan-400 mb-1">🔵 HELPER POINTS</p>
                        <p className="text-[12px] text-white/60 leading-relaxed">
                            Earned by helping others → Getting Best Solution mark on your reply<br />
                            <span className="font-mono text-[10px] text-white/40">50 base × Difficulty × Reputation</span>
                        </p>
                    </div>
                    <div className={`${card} border-l-4 border-l-green-500`}>
                        <p className="text-sm font-bold text-green-400 mb-1">🟢 KNOWLEDGE POINTS</p>
                        <p className="text-[12px] text-white/60 leading-relaxed">
                            Earned by teaching the community → Uploading roadmaps, DSA explanations, tutorials
                        </p>
                    </div>
                </div>
            </div>

            {/* Badge Tiers */}
            <div>
                <h3 className="text-base font-bold text-white mb-3">🎖️ Badge Tiers</h3>
                <div className="relative">
                    <div className="absolute left-[15px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-[#6C63FF] to-[#00D4AA]" />
                    <div className="space-y-2.5">
                        {badges.map((b, i) => (
                            <div key={i} className="flex items-center gap-3 relative">
                                <div className="w-[30px] h-[30px] rounded-full bg-[#1A1A1A] border-2 border-[#6C63FF] flex items-center justify-center text-sm z-10 flex-shrink-0">
                                    {b.icon}
                                </div>
                                <div className="flex-1 flex items-center justify-between flex-wrap gap-1">
                                    <span className="text-sm font-bold text-white">Lv.{b.lv} {b.name}</span>
                                    <span className="text-[11px] text-white/50">{b.perk}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Streak System */}
            <div className={card}>
                <h3 className="text-base font-bold text-white mb-2">🔥 Streak System</h3>
                <p className="text-sm text-white/70 mb-3">Upload or watch reels every day to build your streak.</p>
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                        <span className="text-white/90 font-medium">Day 7</span>
                        <span className="text-[#00D4AA] font-mono text-xs">+70 bonus points + Streak Badge</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <span className="text-white/90 font-medium">Day 30</span>
                        <span className="text-[#00D4AA] font-mono text-xs">+300 bonus points + Exclusive Monthly Badge</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-red-400">
                        <span className="font-medium">Miss a day</span>
                        <span className="font-mono text-xs">Streak resets to 0 (no exceptions!)</span>
                    </div>
                </div>
            </div>

            {/* Featured Rewards Milestones */}
            <div>
                <h3 className="text-base font-bold text-white mb-3">🏅 Featured Rewards Milestones</h3>
                <div className="space-y-2">
                    {milestones.map((m, i) => (
                        <div key={i} className={`${card} flex items-center gap-3`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] flex-shrink-0 ${m.unlocked ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white/30"}`}>
                                {m.unlocked ? "✓" : "🔒"}
                            </div>
                            <span className="text-sm font-mono text-[#6C63FF] flex-shrink-0 w-16">{m.pts}</span>
                            <span className="text-sm text-white/70">{m.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
