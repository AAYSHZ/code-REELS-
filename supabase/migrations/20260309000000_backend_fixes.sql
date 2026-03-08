-- =============================================================
-- Backend Fixes Migration
-- 1. Follows table
-- 2. liked_by column on reels
-- 3. 'Other' category support
-- 4. skill_points default update
-- 5. total_score column on profiles
-- =============================================================

-- 1. FOLLOWS TABLE
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id)
);
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own follows"
  ON public.follows FOR ALL USING (auth.uid() = follower_id);

CREATE POLICY "Follows are publicly readable"
  ON public.follows FOR SELECT USING (true);

-- 2. LIKED_BY UUID[] on reels
ALTER TABLE public.reels
  ADD COLUMN IF NOT EXISTS liked_by UUID[] DEFAULT '{}';

-- 3. ADD 'Other' TO CATEGORY CHECK CONSTRAINTS
-- Drop and recreate CHECK on reels.category
ALTER TABLE public.reels DROP CONSTRAINT IF EXISTS reels_category_check;
ALTER TABLE public.reels
  ADD CONSTRAINT reels_category_check
  CHECK (category IN ('DSA', 'Web Dev', 'AI-ML', 'Hardware', 'Other'));

-- Drop and recreate CHECK on challenges.category
ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS challenges_category_check;
ALTER TABLE public.challenges
  ADD CONSTRAINT challenges_category_check
  CHECK (category IN ('DSA', 'Web Dev', 'AI-ML', 'Hardware', 'Other'));

-- 4. UPDATE skill_points default to include 'other'
ALTER TABLE public.profiles
  ALTER COLUMN skill_points
  SET DEFAULT '{"dsa": 0, "webdev": 0, "aiml": 0, "hardware": 0, "other": 0}'::jsonb;

-- 5. ADD total_score column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS total_score INTEGER NOT NULL DEFAULT 0;
