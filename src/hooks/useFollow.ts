import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface UseFollowReturn {
  isFollowing: boolean;
  toggleFollow: () => Promise<void>;
  followerCount: number;
  loading: boolean;
}

export function useFollow(targetUserId: string): UseFollowReturn {
  const { user, profile: currentProfile } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // On mount: check follow status + subscribe
  useEffect(() => {
    if (!targetUserId) return;

    const fetchState = async () => {
      setLoading(true);

      // Get follower count from profiles table
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('followers_count')
        .eq('user_id', targetUserId)
        .single();

      setFollowerCount(targetProfile?.followers_count ?? 0);

      // Check if current user follows the target
      if (user) {
        const { data } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId)
          .maybeSingle();

        setIsFollowing(!!data);
      }

      setLoading(false);
    };

    fetchState();

    // Subscribe to realtime changes on follows table for this target user
    const channel = supabase.channel(`follows_target_${targetUserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'follows', filter: `following_id=eq.${targetUserId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setFollowerCount((c) => c + 1);
            if (payload.new.follower_id === user?.id) {
              setIsFollowing(true);
            }
          } else if (payload.eventType === 'DELETE') {
            setFollowerCount((c) => Math.max(0, c - 1));
            if (payload.old.follower_id === user?.id) {
              setIsFollowing(false);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, targetUserId]);

  const toggleFollow = useCallback(async () => {
    if (!user || !targetUserId || user.id === targetUserId) return;

    if (isFollowing) {
      // ── UNFOLLOW ───────────────────────────────
      // We rely on realtime to update the isFollowing and count state locally
      // But we can do an optimistic local update too
      setIsFollowing(false);
      setFollowerCount(prev => Math.max(0, prev - 1));

      await supabase.rpc('toggle_follow', {
        p_target_user_id: targetUserId,
        p_current_user_id: user.id,
        p_is_following: false
      });
    } else {
      // ── FOLLOW ─────────────────────────────────
      setIsFollowing(true);
      setFollowerCount(prev => prev + 1);

      await supabase.rpc('toggle_follow', {
        p_target_user_id: targetUserId,
        p_current_user_id: user.id,
        p_is_following: true
      });

      // Insert follow notification
      const displayName = currentProfile?.name || currentProfile?.username || 'Someone';
      await supabase.from('notifications').insert({
        user_id: targetUserId,
        type: 'follow',
        message: `${displayName} started following you`,
        is_read: false,
      });
    }
  }, [user, currentProfile, targetUserId, isFollowing, followerCount]);

  return { isFollowing, toggleFollow, followerCount, loading };
}
