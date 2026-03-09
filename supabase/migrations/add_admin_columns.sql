-- Add role column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';
-- Create app_role enum if it doesn't exist, though the types file implies it might a separate table. Let's just use text for simplicity, or check if enum exists. The types file shows: app_role: "admin" | "moderator" | "user".

-- Add is_blocked column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false;

-- Allow admins to see everything.
