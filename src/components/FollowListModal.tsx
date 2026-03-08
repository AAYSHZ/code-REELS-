import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { X, UserPlus, Check } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import { useFollow } from '@/hooks/useFollow';

interface FollowListModalProps {
    userId: string;
    type: 'followers' | 'following';
    onClose: () => void;
}

function FollowListItem({ profile, onClose }: { profile: any, onClose: () => void }) {
    const { user } = useAuth();
    const { isFollowing, toggleFollow, loading } = useFollow(profile.user_id);

    return (
        <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors">
            <Link to={`/profile/${profile.user_id}`} onClick={onClose} className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="w-10 h-10 border border-border">
                    <AvatarImage src={profile.avatar || undefined} />
                    <AvatarFallback className="gradient-primary text-xs font-bold text-foreground">
                        {profile.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">{profile.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 font-mono gradient-primary text-foreground">Lv.{profile.level}</span>
                    </div>
                    {profile.username && <span className="text-xs text-muted-foreground truncate">@{profile.username}</span>}
                </div>
            </Link>

            {user && user.id !== profile.user_id && (
                <button
                    onClick={() => toggleFollow()}
                    disabled={loading}
                    className={`ml-2 px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex flex-shrink-0 items-center justify-center min-w-[90px] ${isFollowing
                            ? 'bg-background border border-border text-foreground hover:bg-muted'
                            : 'gradient-primary text-foreground shadow-glow-primary'
                        }`}
                >
                    {isFollowing ? 'Following' : 'Follow'}
                </button>
            )}
        </div>
    );
}

export default function FollowListModal({ userId, type, onClose }: FollowListModalProps) {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);

            // Step 1: Get the list of IDs from follows table
            let userIds: string[] = [];
            if (type === 'followers') {
                const { data } = await supabase.from('follows').select('follower_id').eq('following_id', userId);
                userIds = data?.map(d => d.follower_id) || [];
            } else {
                const { data } = await supabase.from('follows').select('following_id').eq('follower_id', userId);
                userIds = data?.map(d => d.following_id) || [];
            }

            if (userIds.length === 0) {
                setProfiles([]);
                setLoading(false);
                return;
            }

            // Step 2: Fetch their profiles
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .in('user_id', userIds);

            setProfiles(profileData || []);
            setLoading(false);
        };

        fetchUsers();
    }, [userId, type]);

    return (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4">
            <motion.div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            />
            <motion.div
                className="relative w-full max-w-md bg-[#1A1A1A] sm:rounded-2xl rounded-t-2xl border border-white/10 shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[80vh]"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <h2 className="text-lg font-bold text-foreground capitalize">{type}</h2>
                    <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-white/5">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto p-2 flex-1 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : profiles.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <p>No {type} yet.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {profiles.map(p => (
                                <FollowListItem key={p.id} profile={p} onClose={onClose} />
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
