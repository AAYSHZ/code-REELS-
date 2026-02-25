
# CodeReels — Implementation Plan

## Overview
A short-video platform for coding education, built with React + Supabase. Instagram Reels-style UX with gamification (XP, levels, badges, leaderboards).

## Design System
- **Dark mode only** with near-black background (#0a0a0a)
- Purple (#6c63ff) and teal (#00d4aa) accents
- Glassmorphism modals, gradient CTAs, animated XP bars
- Google Fonts: Inter (UI) + JetBrains Mono (code labels)
- Fully mobile responsive

---

## Phase 1: Database & Auth

### Supabase Tables
- **profiles** — name, email, avatar, XP, coins, reputation_score, level, streak_count, skill_points (JSON: dsa, webdev, aiml, hardware), creator_points, helper_points, knowledge_points, current_badge, badges (array), role (user/admin), is_verified_creator, is_elite_creator, weekly_fpa, last_upload_date
- **reels** — title, description, video_url, thumbnail_url, uploaded_by, category (DSA/Web Dev/AI-ML/Hardware), difficulty (Easy/Medium/Hard), likes_count, shares_count, saves_count, total_views, avg_watch_percent, completion_rate, engagement_score, final_points_awarded, authenticity_factor, video_quality_multiplier, is_best_solution, parent_reel_id, is_reported, is_featured, reach_score, created_at
- **comments** — reel_id, user_id, text, upvotes, downvotes, created_at
- **reel_likes** — reel_id, user_id (tracks who liked what)
- **reel_saves** — reel_id, user_id
- **validation_votes** — reel_id, user_id, vote_type (high_quality/incorrect_logic/incomplete)
- **challenges** — title, description, start_date, end_date, category, point_multiplier, badge_name, created_at
- **challenge_participants** — challenge_id, user_id, points_earned, completed
- **notifications** — user_id, type, message, related_reel_id, is_read, created_at
- **watch_history** — reel_id, user_id, watch_percent, points_awarded

### Authentication
- Email/password signup & login via Supabase Auth
- Auto-create profile row on signup
- Protected routes redirect to /login
- JWT session managed by Supabase client

### Storage
- Supabase Storage bucket "reels" for video uploads
- Bucket "avatars" for profile pictures

---

## Phase 2: Core Pages & Navigation

### Fixed Navbar
- Blurred glass background, logo left, nav icons right
- Icons: Home, Search, Upload (+), Leaderboard, Challenges, Bell (notifications), Profile avatar
- Notification bell shows unread count badge

### Home Feed (/)
- Vertical scrolling reel cards (full-viewport-height style like Instagram Reels)
- Auto-play video when in viewport, pause when scrolled away
- Each reel shows: category tag, colored difficulty badge, like/share/save/comment buttons with counts, "Reply with Reel" button, uploader info with level badge
- Points toast animation when user earns XP ("+10 XP" slides in from bottom-right)

### Login (/login) & Register (/register)
- Clean dark forms with validation
- Gradient submit button
- Link between login/register

### Upload Reel (Modal)
- Video file picker with drag-and-drop
- Upload to Supabase Storage
- Title, description, category selector, difficulty selector
- Option to mark as reply to another reel
- Upload progress bar

---

## Phase 3: Engagement & Gamification

### Points Engine (client-side utility)
- Full implementation of the ER, FES, FPA, WT formulas
- Difficulty multiplier, authenticity factor, reputation multiplier
- Coin calculation, level calculation (√(XP/10))
- Streak bonus, helper/knowledge points
- Diminishing returns after 20K XP
- Reach score (RSCORE) calculation

### Reel Interactions
- Like with heart animation → triggers point calculation → XP toast
- Save, share, comment
- Watch time tracking (IntersectionObserver + video currentTime)
- Points awarded at 50% and 100% watch thresholds

### Reply Reels
- Upload a reply reel linked to parent
- Original poster can mark "Best Solution" → +75 to replier, +20 to poster, "Solution Verified" badge on reel

### Comment System
- Text comments with upvote/downvote
- Points: +3 for upvote received, -5 for downvote (capped)

### Community Validation (Level 10+ users)
- Vote buttons: "High Quality", "Incorrect Logic", "Incomplete"
- If >40% incorrect logic → creator loses 30% of reel's points
- Vote power weighted by reputation

---

## Phase 4: Profile & Social

### Profile Page (/profile/:userId)
- Avatar, name, level badge, current badge title
- Animated XP progress bar (glowing)
- Total Score, Creator/Helper/Knowledge points
- Coin balance with coin icon
- Streak counter with pulsing flame animation
- Skill radar chart (Recharts) showing DSA, Web Dev, AI-ML, Hardware — animates on load
- Grid of user's uploaded reels
- Badges shelf

### Leaderboard (/leaderboard)
- Tabs: Top Creator, Top Problem Solver, Most Helpful, Rising Star
- Skill sub-tabs: DSA, Web Dev, AI-ML, Hardware
- Top 10 users with rank, avatar, level badge, weekly score
- "Resets in X days" countdown at top

---

## Phase 5: Challenges, Rewards & Search

### Challenges Page (/challenges)
- Active challenge cards with countdown timers
- "Join Challenge" button
- Challenge-specific leaderboard
- 1.5x multiplier banner
- Completed challenges show earned badge

### Rewards Page (/rewards)
- Milestone progression: 1K / 10K / 20K / 50K
- Animated progress bars
- Unlocked rewards in color, locked grayed out
- Coin spend options: Boost Reel, Tip Creator, Unlock Challenge Mode
- "Coming Soon" section: Certificates, Internship Priority, Course Discounts

### Search (/search)
- Search bar filtering by title, category, difficulty
- Trending section showing highest RSCORE reels this week

### Notifications
- Dropdown from bell icon
- Types: reply received, best solution marked, badge earned, level up, streak at risk

---

## Phase 6: Admin & Polish

### Admin Panel (/admin)
- Admin-only route (role check)
- Create/publish challenges form
- Feature a reel manually
- Platform stats: total users, reels, active streaks

### Micro Interactions
- Heart fill animation on like
- XP toast slide-in
- Level-up full-screen celebration (confetti/glow for 2 seconds)
- Streak flame pulse animation
- Radar chart animate on mount
- Smooth hover transitions on all cards/buttons

### Seed Data
- 5 demo users at levels 1, 5, 10, 20, 50 with realistic stats
- 10 demo reels across all categories and difficulties
- 2 active challenges
- Pre-attached likes, comments, saves, and 2 best-solution reels
- Seeded via Supabase SQL or an edge function

### Anti-Spam
- Rate-limit likes (3 per minute per user via RLS/edge function)
- Points only if watch ≥ 50%
- Reported reels hidden from feed
- Downvotes subtract from creator
