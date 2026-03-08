-- =============================================================
-- Backend RPC Fixes Migration
-- 1. toggle_like RPC for robust array appending and count updates
-- 2. toggle_follow RPC for atomic follow insertion and count updates
-- =============================================================

-- 1. TOGGLE LIKE RPC
CREATE OR REPLACE FUNCTION toggle_like(p_reel_id UUID, p_user_id UUID, p_is_like BOOLEAN)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- We don't have reel_likes in the reels check explicitly, but we check if user is in array
  IF p_is_like THEN
    UPDATE public.reels
    SET 
      likes_count = likes_count + 1,
      liked_by = array_append(liked_by, p_user_id)
    WHERE id = p_reel_id AND NOT (liked_by @> ARRAY[p_user_id]::UUID[]);
    
    INSERT INTO public.reel_likes (reel_id, user_id) 
    VALUES (p_reel_id, p_user_id) 
    ON CONFLICT DO NOTHING;
  ELSE
    UPDATE public.reels
    SET 
      likes_count = GREATEST(0, likes_count - 1),
      liked_by = array_remove(liked_by, p_user_id)
    WHERE id = p_reel_id AND (liked_by @> ARRAY[p_user_id]::UUID[]);
    
    DELETE FROM public.reel_likes 
    WHERE reel_id = p_reel_id AND user_id = p_user_id;
  END IF;
END;
$$;

-- 2. TOGGLE FOLLOW RPC
CREATE OR REPLACE FUNCTION toggle_follow(p_target_user_id UUID, p_current_user_id UUID, p_is_following BOOLEAN)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.follows 
    WHERE follower_id = p_current_user_id AND following_id = p_target_user_id
  ) INTO v_exists;

  IF p_is_following THEN
    IF NOT v_exists THEN
      INSERT INTO public.follows (follower_id, following_id) 
      VALUES (p_current_user_id, p_target_user_id);

      UPDATE public.profiles 
      SET followers_count = COALESCE(followers_count, 0) + 1 
      WHERE user_id = p_target_user_id;

      UPDATE public.profiles 
      SET following_count = COALESCE(following_count, 0) + 1 
      WHERE user_id = p_current_user_id;
    END IF;
  ELSE
    IF v_exists THEN
      DELETE FROM public.follows 
      WHERE follower_id = p_current_user_id AND following_id = p_target_user_id;
      
      UPDATE public.profiles 
      SET followers_count = GREATEST(0, COALESCE(followers_count, 0) - 1) 
      WHERE user_id = p_target_user_id;

      UPDATE public.profiles 
      SET following_count = GREATEST(0, COALESCE(following_count, 0) - 1) 
      WHERE user_id = p_current_user_id;
    END IF;
  END IF;
END;
$$;
