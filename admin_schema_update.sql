-- SQL Script for CodeReels Admin Capabilities
-- Please run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql/new)

-- 1. Add role column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- 2. Add is_blocked column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false;

-- 3. Add is_featured column to reels (if missing)
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- 4. Update existing policies if necessary to respect 'is_blocked'
-- (e.g., preventing blocked users from logging in or creating reels)
-- Optional based on current Auth setup.
