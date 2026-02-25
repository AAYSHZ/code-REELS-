
-- Add new profile fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio text DEFAULT '',
ADD COLUMN IF NOT EXISTS cover_photo text DEFAULT '',
ADD COLUMN IF NOT EXISTS github_url text DEFAULT '',
ADD COLUMN IF NOT EXISTS linkedin_url text DEFAULT '',
ADD COLUMN IF NOT EXISTS portfolio_url text DEFAULT '',
ADD COLUMN IF NOT EXISTS pinned_reel_id uuid REFERENCES public.reels(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS skill_tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS open_to_collab boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS total_watch_hours numeric DEFAULT 0;

-- Create follows table
CREATE TABLE IF NOT EXISTS public.follows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows viewable by everyone" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Add comment threading
ALTER TABLE public.comments
ADD COLUMN IF NOT EXISTS parent_comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;

-- Create comment reactions table
CREATE TABLE IF NOT EXISTS public.comment_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id, reaction)
);

ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reactions viewable by everyone" ON public.comment_reactions FOR SELECT USING (true);
CREATE POLICY "Users can react" ON public.comment_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove reaction" ON public.comment_reactions FOR DELETE USING (auth.uid() = user_id);

-- Add follower/following counts to profiles for performance
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS followers_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count integer DEFAULT 0;
