import { motion } from "framer-motion";

const card = "bg-[#1A1A1A] border border-white/[0.08] rounded-xl p-4";
const fadIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } };

const xpActions = [
    { icon: "📹", label: "Upload a reel", xp: "+10 XP", type: "Knowledge Points", color: "border-l-green-500" },
    { icon: "❤️", label: "Someone likes your reel", xp: "+2 XP", type: "Creator Points", color: "border-l-purple-500" },
    { icon: "💾", label: "Someone saves your reel", xp: "+3 XP", type: "Creator Points", color: "border-l-purple-500" },
    { icon: "💬", label: "Someone comments", xp: "+3 XP", type: "Creator Points", color: "border-l-purple-500" },
    { icon: "⭐", label: "Best Solution mark", xp: "+50 XP", type: "Helper Points", color: "border-l-blue-500" },
    { icon: "👁️", label: "Full video watch", xp: "+10 XP", type: "Creator Points", color: "border-l-purple-500" },
];

const levels = [
    { lv: 1, name: "BEGINNER", xp: "0", perk: "Basic profile unlocked" },
    { lv: 5, name: "CODER", xp: "250", perk: "Custom username color" },
    { lv: 10, name: "DEBUGGER", xp: "1,000", perk: "Community voting rights" },
    { lv: 20, name: "ARCHITECT", xp: "4,000", perk: "Upload longer reels (10 min)" },
    { lv: 50, name: "CODE MASTER", xp: "25,000", perk: "Elite profile + early access" },
];

export default function XpLevelsTab() {
    return (
        <motion.div className="space-y-6" {...fadIn}>
            {/* How You Earn XP */}
            <div>
                <h3 className="text-base font-bold text-white mb-3">⚡ How You Earn XP</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {xpActions.map((a, i) => (
                        <div key={i} className={`${card} border-l-4 ${a.color} flex items-center gap-3`}>
                            <span className="text-xl">{a.icon}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-white/90 font-medium truncate">{a.label}</p>
                                <p className="text-[11px] text-white/50">{a.type}</p>
                            </div>
                            <span className="text-sm font-bold text-white flex-shrink-0">{a.xp}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Level Progression */}
            <div>
                <h3 className="text-base font-bold text-white mb-1">📊 Level Progression</h3>
                <p className="text-xs text-white/40 mb-4 font-mono">Formula: Level = √(XP ÷ 10)</p>
                <div className="relative">
                    {/* connecting line */}
                    <div className="absolute left-[15px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-white/20 to-transparent" />
                    <div className="space-y-3">
                        {levels.map((l, i) => (
                            <div key={i} className="flex items-center gap-4 relative">
                                <div className="w-[30px] h-[30px] rounded-full bg-[#1A1A1A] border-2 border-white/20 flex items-center justify-center text-[10px] font-bold text-white z-10 flex-shrink-0">
                                    {l.lv}
                                </div>
                                <div className={`${card} flex-1`}>
                                    <div className="flex items-center justify-between flex-wrap gap-1">
                                        <span className="text-sm font-bold text-white">{l.name}</span>
                                        <span className="text-[11px] font-mono text-white">{l.xp} XP</span>
                                    </div>
                                    <p className="text-[11px] text-white/50 mt-0.5">{l.perk}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Coins */}
            <div className={card}>
                <h3 className="text-base font-bold text-white mb-2">🪙 Coins</h3>
                <p className="text-sm text-white/70 leading-relaxed">
                    Coins = XP ÷ 10. Coins will unlock a marketplace for profile customizations,
                    exclusive frames, and platform perks — <span className="text-white font-semibold">coming soon.</span>
                </p>
            </div>

            {/* Difficulty Multiplier */}
            <div className={card}>
                <h3 className="text-base font-bold text-white mb-3">🎯 Difficulty Multiplier</h3>
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                        <span className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xs">🟢</span>
                        <span className="text-white/70 flex-1">Easy</span>
                        <span className="font-mono text-white font-bold">1.0×</span>
                        <span className="text-[11px] text-white/40">base points</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <span className="w-7 h-7 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 text-xs">🟡</span>
                        <span className="text-white/70 flex-1">Medium</span>
                        <span className="font-mono text-white font-bold">1.5×</span>
                        <span className="text-[11px] text-white/40">50% bonus</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <span className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-xs">🔴</span>
                        <span className="text-white/70 flex-1">Hard</span>
                        <span className="font-mono text-white font-bold">2.5×</span>
                        <span className="text-[11px] text-white/40">150% bonus, maximum reward</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
