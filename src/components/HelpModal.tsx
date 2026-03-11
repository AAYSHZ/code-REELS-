import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import GettingStartedTab from "@/components/help/GettingStartedTab";
import XpLevelsTab from "@/components/help/XpLevelsTab";
import PointsBadgesTab from "@/components/help/PointsBadgesTab";
import HowItWorksTab from "@/components/help/HowItWorksTab";
import ComingSoonTab from "@/components/help/ComingSoonTab";

const tabs = [
    { id: "start", icon: "🚀", label: "Getting Started" },
    { id: "xp", icon: "⚡", label: "XP & Levels" },
    { id: "badges", icon: "🏆", label: "Points & Badges" },
    { id: "how", icon: "🎯", label: "How It Works" },
    { id: "soon", icon: "🔮", label: "Coming Soon" },
];

interface Props {
    open: boolean;
    onClose: () => void;
}

export default function HelpModal({ open, onClose }: Props) {
    const [activeTab, setActiveTab] = useState("start");
    const tabsRef = useRef<HTMLDivElement>(null);

    // Reset to first tab when opening
    useEffect(() => {
        if (open) setActiveTab("start");
    }, [open]);

    // Scroll active tab into view on mobile
    useEffect(() => {
        if (tabsRef.current) {
            const active = tabsRef.current.querySelector(`[data-tab="${activeTab}"]`);
            active?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }
    }, [activeTab]);

    const renderTab = () => {
        switch (activeTab) {
            case "start": return <GettingStartedTab key="start" />;
            case "xp": return <XpLevelsTab key="xp" />;
            case "badges": return <PointsBadgesTab key="badges" />;
            case "how": return <HowItWorksTab key="how" />;
            case "soon": return <ComingSoonTab key="soon" />;
            default: return null;
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-[#0A0A0A]/95 backdrop-blur-xl"
                        onClick={onClose}
                    />

                    {/* Modal content */}
                    <motion.div
                        className="relative w-full max-w-[900px] mx-4 my-8 sm:my-12 z-10"
                        initial={{ opacity: 0, y: 30, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.97 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                        >
                            <X className="w-5 h-5 text-white/70" />
                        </button>

                        {/* Header */}
                        <div className="text-center pt-6 pb-2 px-4">
                            <h2 className="text-2xl sm:text-3xl font-extrabold">
                                <span className="bg-gradient-to-r from-[#6C63FF] to-[#00D4AA] bg-clip-text text-transparent">CodeReels</span>
                            </h2>
                            <p className="text-sm text-white/50 mt-1">Platform Guide</p>
                        </div>

                        {/* Tabs */}
                        <div
                            ref={tabsRef}
                            className="flex gap-1 px-4 py-3 overflow-x-auto scrollbar-hide border-b border-white/[0.06]"
                        >
                            {tabs.map((t) => (
                                <button
                                    key={t.id}
                                    data-tab={t.id}
                                    onClick={() => setActiveTab(t.id)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${activeTab === t.id
                                            ? "border-b-2 border-[#6C63FF] text-[#6C63FF] bg-[#6C63FF]/10"
                                            : "text-white/50 hover:text-white/80 hover:bg-white/5"
                                        }`}
                                >
                                    <span>{t.icon}</span>
                                    <span>{t.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Tab content */}
                        <div className="px-4 py-5 min-h-[300px]">
                            <AnimatePresence mode="wait">
                                {renderTab()}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
