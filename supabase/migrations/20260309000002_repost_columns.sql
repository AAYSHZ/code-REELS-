-- =============================================================
-- Repost Functionality Migration
-- Add columns: is_repost, original_reel_id, original_creator_id
-- =============================================================

ALTER TABLE public.reels
  ADD COLUMN IF NOT EXISTS is_repost BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS original_reel_id UUID REFERENCES public.reels(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS original_creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
