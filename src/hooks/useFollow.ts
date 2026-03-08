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

  // On mount: check follow status + get follower count
  useEffect(() => {
    if (!targetUserId) return;

    const fetchState = async () => {
      setLoading(true);

      // Get follower count
      const { count } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', targetUserId);

      setFollowerCount(count ?? 0);

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
  }, [user, targetUserId]);

  const toggleFollow = useCallback(async () => {
    if (!user || !targetUserId || user.id === targetUserId) return;

    if (isFollowing) {
      // ── OPTIMISTIC UNFOLLOW ───────────────────────────────
      setIsFollowing(false);
      setFollowerCount(prev => Math.max(0, prev - 1));

      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      if (error) {
        // Rollback on failure
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
        return;
      }

      // Update follower count on target profile
      await supabase
        .from('profiles')
        .update({ followers_count: Math.max(0, followerCount - 1) })
        .eq('user_id', targetUserId);

      // Update following count on current user profile
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('following_count')
        .eq('user_id', user.id)
        .single();

      if (myProfile) {
        await supabase
          .from('profiles')
          .update({ following_count: Math.max(0, (myProfile.following_count ?? 1) - 1) })
          .eq('user_id', user.id);
      }
    } else {
      // ── OPTIMISTIC FOLLOW ─────────────────────────────────
      setIsFollowing(true);
      setFollowerCount(prev => prev + 1);

      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: targetUserId });

      if (error) {
        // Rollback on failure
        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
        return;
      }

      // Update follower count on target profile
      await supabase
        .from('profiles')
        .update({ followers_count: followerCount + 1 })
        .eq('user_id', targetUserId);

      // Update following count on current user profile
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('following_count')
        .eq('user_id', user.id)
        .single();

      if (myProfile) {
        await supabase
          .from('profiles')
          .update({ following_count: (myProfile.following_count ?? 0) + 1 })
          .eq('user_id', user.id);
      }

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
