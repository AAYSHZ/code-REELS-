import { useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle } from "lucide-react";
import HelpModal from "@/components/HelpModal";

export default function HelpButton() {
    const [open, setOpen] = useState(false);
    const [hovered, setHovered] = useState(false);
    const location = useLocation();

    // Hide on auth page
    if (location.pathname === "/auth") return null;

    return (
        <>
            {/* Floating button */}
            <div className="fixed top-4 left-4 md:top-auto md:bottom-6 md:right-6 md:left-auto z-50">
                <AnimatePresence>
                    {hovered && (
                        <motion.div
                            initial={{ opacity: 0, y: 4, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute bottom-full right-0 mb-2 whitespace-nowrap px-3 py-1.5 rounded-lg bg-[#1A1A1A] border border-white/10 text-sm text-white/80 shadow-xl"
                        >
                            Learn how CodeReels works
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    onClick={() => setOpen(true)}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg animate-help-pulse transition-transform hover:scale-110 active:scale-95"
                    style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.2), transparent)" }}
                    aria-label="Open help guide"
                >
                    <HelpCircle className="w-6 h-6" />
                </button>
            </div>

            {/* Modal */}
            <HelpModal open={open} onClose={() => setOpen(false)} />
        </>
    );
}
