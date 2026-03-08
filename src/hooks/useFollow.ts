import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface UseFollowReturn {
  isFollowing: boolean;
  toggleFollow: () => Promise<void>;
  followerCount: number;
  followingCount: number;
  loading: boolean;
}

export function useFollow(targetUserId: string): UseFollowReturn {
  const { user, profile: currentProfile } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchState = useCallback(async () => {
    if (!targetUserId) return;
    
    try {
      setLoading(true);

      // Get follower count
      const { count: followersCountQuery, error: followersError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', targetUserId);
      if (followersError) console.error("Error fetching followers:", followersError);
      
      setFollowerCount(followersCountQuery ?? 0);

      // Get following count
      const { count: followingCountQuery, error: followingError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', targetUserId);
      if (followingError) console.error("Error fetching following:", followingError);

      setFollowingCount(followingCountQuery ?? 0);

      // Check if current user follows the target
      if (user && user.id !== targetUserId) {
        const { data, error: followVerifyError } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId)
          .maybeSingle();
        
        if (followVerifyError) console.error("Error verifying follow:", followVerifyError);
        setIsFollowing(data !== null);
      } else {
        setIsFollowing(false);
      }
    } catch (err) {
      console.error("fetchState exception in useFollow:", err);
    } finally {
      setLoading(false);
    }
  }, [targetUserId, user]);

  // On mount: check follow status + subscribe
  useEffect(() => {
    fetchState();

    if (!targetUserId) return;

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`follows-changes-${targetUserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'follows' },
        () => { 
          // Refetch stats when ANY follow changes to ensure accuracy
          fetchState();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to follows changes for ${targetUserId}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchState, targetUserId]);

  const toggleFollow = useCallback(async () => {
    if (!user || !targetUserId || user.id === targetUserId) return;

    try {
      if (isFollowing) {
        // optimistically update locally to avoid jumpiness
        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));

        // Delete follow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);

        if (error) {
          console.error("Error deleting follow:", error);
          // Rollback
          setIsFollowing(true);
          setFollowerCount(prev => prev + 1);
        }
      } else {
        // optimistically update locally
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);

        // Insert follow
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: user.id, following_id: targetUserId });

        if (error) {
          console.error("Error inserting follow:", error);
          // Rollback
          setIsFollowing(false);
          setFollowerCount(prev => Math.max(0, prev - 1));
        } else {
          // Insert follow notification
          try {
            const displayName = currentProfile?.name || currentProfile?.username || 'Someone';
            await supabase.from('notifications').insert({
              user_id: targetUserId,
              type: 'follow',
              message: `${displayName} started following you`,
              is_read: false,
            });
          } catch (notifErr) {
            console.error("Failed to insert follow notification:", notifErr);
          }
        }
      }
    } catch (err) {
      console.error("toggleFollow exception in useFollow:", err);
      // Re-sync with actual state if exception happens
      fetchState();
    }
  }, [user, currentProfile, targetUserId, isFollowing, fetchState]);

  return { isFollowing, toggleFollow, followerCount, followingCount, loading };
}
