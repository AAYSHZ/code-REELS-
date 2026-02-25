
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Update skill_points default to include expanded categories
ALTER TABLE public.profiles 
  ALTER COLUMN skill_points SET DEFAULT '{"dsa": 0, "webdev": 0, "aiml": 0, "hardware": 0, "coding_problems": 0, "learning_roadmaps": 0, "troubleshooting": 0}'::jsonb;
