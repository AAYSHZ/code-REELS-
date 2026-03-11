import { motion } from "framer-motion";

const card = "bg-[#1A1A1A] border border-white/[0.08] rounded-xl p-4";
const fadIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } };

export default function GettingStartedTab() {
    return (
        <motion.div className="space-y-6" {...fadIn}>
            {/* What is CodeReels */}
            <div className={card}>
                <h3 className="text-base font-bold text-white mb-2">What is CodeReels?</h3>
                <p className="text-sm text-white/70 leading-relaxed">
                    CodeReels is the world's first short-video platform built specifically for developers.
                    Think Instagram Reels meets Stack Overflow — but with gamification, video replies,
                    and an AI-powered search engine.
                </p>
            </div>

            {/* The Feed */}
            <div className={card}>
                <h3 className="text-base font-bold text-white mb-2">📹 The Feed</h3>
                <ul className="text-sm text-white/70 space-y-1.5 list-disc list-inside">
                    <li>Scroll through short coding videos just like Instagram Reels</li>
                    <li>Videos auto-play when in view</li>
                    <li>Category tags: <span className="text-purple-400">DSA</span>, <span className="text-blue-400">Web Dev</span>, <span className="text-emerald-400">AI-ML</span>, <span className="text-amber-400">Hardware</span>, <span className="text-gray-400">Other</span></li>
                </ul>
                <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-2 py-0.5 rounded-full text-[11px] bg-green-500/20 text-green-400 border border-green-500/30">🟢 Easy — beginner friendly</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">🟡 Medium — some experience needed</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] bg-red-500/20 text-red-400 border border-red-500/30">🔴 Hard — advanced concepts</span>
                </div>
            </div>

            {/* Search & Ask CR */}
            <div className={card}>
                <h3 className="text-base font-bold text-white mb-2">🔍 Search & Ask CR</h3>
                <ul className="text-sm text-white/70 space-y-1.5 list-disc list-inside">
                    <li>Use Search to find reels by topic or keyword</li>
                    <li>Filter by Category (DSA, Web Dev, AI-ML, Hardware)</li>
                    <li>Filter by Level (Easy, Medium, Hard)</li>
                    <li>
                        Can't find what you need? Hit <span className="text-[#6C63FF] font-semibold">"Ask CR"</span> — our AI
                        searches the entire internet and gives you an answer with sources!
                    </li>
                </ul>
            </div>

            {/* Reply With Reel */}
            <div className={`${card} border-[#6C63FF]/30`}>
                <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base font-bold text-white">⭐ Reply With Reel</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6C63FF]/20 text-[#6C63FF] border border-[#6C63FF]/30 font-semibold">UNIQUE FEATURE</span>
                </div>
                <p className="text-sm text-white/70 leading-relaxed">
                    The most powerful feature on CodeReels. Post a coding problem as a reel.
                    Other developers reply with their own video explanations. The best reply
                    gets marked as <span className="text-[#00D4AA] font-semibold">Best Solution</span> — earning massive bonus points for the solver.
                </p>
            </div>

            {/* Upload Your First Reel */}
            <div className={card}>
                <h3 className="text-base font-bold text-white mb-2">🚀 Upload Your First Reel</h3>
                <div className="space-y-2">
                    {["Click Upload in the navbar", "Choose category and difficulty", "Add title and description", "Upload your video → earn +10 XP instantly"].map((step, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-sm text-white/70">
                            <span className="w-5 h-5 rounded-full bg-[#6C63FF]/20 text-[#6C63FF] text-[11px] flex items-center justify-center flex-shrink-0 font-bold mt-0.5">{i + 1}</span>
                            <span>{step}</span>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
