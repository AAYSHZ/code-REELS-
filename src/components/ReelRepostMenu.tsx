import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Repeat2, Link as LinkIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface ReelRepostMenuProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reel: any;
    onRepostSuccess?: () => void;
}

export default function ReelRepostMenu({ open, onOpenChange, reel, onRepostSuccess }: ReelRepostMenuProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleRepostToFeed = async () => {
        if (!user) {
            toast.error('You must be logged in to repost.');
            return;
        }

        setLoading(true);

        try {
            // 1. Insert new reel marked as repost
            const { error: insertError } = await supabase.from('reels').insert({
                uploaded_by: user.id,
                title: reel.title,
                video_url: reel.video_url,
                thumbnail_url: reel.thumbnail_url,
                category: reel.category,
                difficulty: reel.difficulty,
                is_repost: true,
                original_reel_id: reel.original_reel_id || reel.id, // if already a repost, preserve original source if desired, or point to this one. Let's point to original or current
                original_creator_id: reel.original_creator_id || reel.uploaded_by,
            });

            if (insertError) throw insertError;

            // 2. Increment shares_count on the original reel
            await supabase
                .from('reels')
                .update({ shares_count: (reel.shares_count || 0) + 1 })
                .eq('id', reel.id);

            toast.success('Reposted to your profile');
            if (onRepostSuccess) onRepostSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to repost. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = () => {
        const url = `${window.location.origin}/reel/${reel.original_reel_id || reel.id}`;
        navigator.clipboard.writeText(url);
        toast.success('Link copied');
        onOpenChange(false);
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4">
                    <motion.div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !loading && onOpenChange(false)}
                    />
                    <motion.div
                        className="relative w-full max-w-sm bg-[#1A1A1A] sm:rounded-2xl rounded-t-2xl border border-white/10 shadow-2xl overflow-hidden"
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    >
                        <div className="p-4 border-b border-white/5 flex justify-between items-center">
                            <h3 className="font-semibold text-foreground">Share to</h3>
                            <button
                                onClick={() => !loading && onOpenChange(false)}
                                className="p-1 rounded-full text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
                                disabled={loading}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-2 flex flex-col gap-1">
                            <button
                                onClick={handleRepostToFeed}
                                disabled={loading}
                                className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors disabled:opacity-50 text-left"
                            >
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Repeat2 className="w-5 h-5" />
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-foreground text-sm">Repost to Feed</h4>
                                    <p className="text-xs text-muted-foreground">Instantly share this to your profile</p>
                                </div>
                            </button>

                            <button
                                onClick={handleCopyLink}
                                disabled={loading}
                                className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors disabled:opacity-50 text-left"
                            >
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-foreground shrink-0">
                                    <LinkIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-foreground text-sm">Copy Link</h4>
                                    <p className="text-xs text-muted-foreground">Get the URL to share anywhere</p>
                                </div>
                            </button>

                            <button
                                onClick={() => !loading && onOpenChange(false)}
                                disabled={loading}
                                className="w-full mt-2 p-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
