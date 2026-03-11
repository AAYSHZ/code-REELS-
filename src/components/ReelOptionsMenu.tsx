import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Trash2, Flag, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface ReelOptionsMenuProps {
    reelId: string;
    reelOwnerId: string;
    videoUrl: string;
    thumbnailUrl: string;
    onDeleted: () => void;
}

export default function ReelOptionsMenu({ reelId, reelOwnerId, videoUrl, thumbnailUrl, onDeleted }: ReelOptionsMenuProps) {
    const { user, profile, refreshProfile } = useAuth();
    const [showSheet, setShowSheet] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const isOwnerOrAdmin = user?.id === reelOwnerId || (profile as any)?.role === 'admin';

    // Extract storage path from a full Supabase storage URL
    const getStoragePath = (url: string): string | null => {
        if (!url) return null;
        // URL pattern: .../storage/v1/object/public/bucket-name/path/to/file
        const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
        if (match) return match[2];
        // Fallback: just use the last part after the last slash
        return url.split('/').pop() || null;
    };

    const handleDelete = async () => {
        if (!user) return;
        setDeleting(true);

        try {
            // 1. Delete video from storage
            const videoPath = getStoragePath(videoUrl);
            if (videoPath) {
                await supabase.storage.from('videos').remove([videoPath]);
            }

            // 2. Delete thumbnail from storage
            const thumbPath = getStoragePath(thumbnailUrl);
            if (thumbPath) {
                await supabase.storage.from('thumbnails').remove([thumbPath]);
            }

            // 3. Delete comments for this reel
            await supabase.from('comments').delete().eq('reel_id', reelId);

            // 4. Delete notifications referencing this reel
            await supabase.from('notifications').delete().eq('related_reel_id', reelId);

            // 5. Delete reel_likes and reel_saves
            await supabase.from('reel_likes').delete().eq('reel_id', reelId);
            await supabase.from('reel_saves').delete().eq('reel_id', reelId);

            // 6. Delete watch_history
            await supabase.from('watch_history').delete().eq('reel_id', reelId);

            // 7. Delete the reel itself
            await supabase.from('reels').delete().eq('id', reelId);

            // 8. Callback + toast + close
            refreshProfile();
            toast.custom((t) => (
                <div className="bg-[#1A1A1A] border border-white/10 border-l-4 border-l-red-500 rounded-lg p-4 flex flex-col gap-0.5 shadow-xl min-w-[250px]">
                    <span className="text-lg font-bold text-red-500">-10 XP</span>
                    <span className="text-xs text-gray-400">Reel Removed</span>
                </div>
            ), { position: 'bottom-right', duration: 3000 });
            setShowConfirm(false);
            setShowSheet(false);
            onDeleted();
        } catch (err) {
            toast.error('Failed to delete reel');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            {/* Three-dot trigger button */}
            <button
                onClick={(e) => { e.stopPropagation(); setShowSheet(true); }}
                className="absolute top-4 right-4 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-background/60 backdrop-blur-sm hover:bg-background/80 transition-colors"
            >
                <MoreVertical className="w-5 h-5 text-foreground" />
            </button>

            {/* Bottom Sheet */}
            <AnimatePresence>
                {showSheet && (
                    <motion.div
                        className="fixed inset-0 z-[9998] flex items-end justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowSheet(false)}
                    >
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/60" />

                        {/* Panel */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-md"
                            style={{
                                backgroundColor: '#1A1A1A',
                                borderTopLeftRadius: '16px',
                                borderTopRightRadius: '16px',
                                paddingBottom: 'env(safe-area-inset-bottom, 16px)',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Handle bar */}
                            <div className="flex justify-center py-3">
                                <div className="w-10 h-1 rounded-full bg-white/20" />
                            </div>

                            <div className="px-4 pb-4 space-y-2">
                                {isOwnerOrAdmin && (
                                    <button
                                        onClick={() => { setShowSheet(false); setShowConfirm(true); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5 text-red-400" />
                                        <span className="text-red-400 font-medium text-sm">Delete Reel</span>
                                    </button>
                                )}

                                <button
                                    onClick={() => { setShowSheet(false); toast('Report submitted (placeholder)'); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
                                >
                                    <Flag className="w-5 h-5 text-white" />
                                    <span className="text-white font-medium text-sm">Report</span>
                                </button>

                                <button
                                    onClick={() => setShowSheet(false)}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                    <span className="text-gray-400 font-medium text-sm">Cancel</span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Confirmation Dialog */}
            <AnimatePresence>
                {showConfirm && (
                    <motion.div
                        className="fixed inset-0 z-[9999] flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/70" onClick={() => !deleting && setShowConfirm(false)} />

                        {/* Dialog */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-[90%] max-w-sm rounded-2xl p-6"
                            style={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                            <h3 className="text-white font-semibold text-base mb-2">Delete this reel?</h3>
                            <p className="text-gray-400 text-sm mb-6">This cannot be undone.</p>

                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="w-full py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
                                    style={{ backgroundColor: '#EF4444', color: '#fff' }}
                                >
                                    {deleting ? 'Deleting...' : 'Confirm Delete'}
                                </button>
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    disabled={deleting}
                                    className="w-full py-3 rounded-xl font-medium text-sm text-gray-400 hover:bg-white/5 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
