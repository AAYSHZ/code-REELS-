# CodeReels

Welcome to **CodeReels**, an intelligent, short-form video platform designed for developers! Read on to see how to run the project.

## Features
- **Trending & Search:** Quickly find the best reels across programming categories.
- **AI-Powered Answers:** Deep-search capabilities powered by **Tavily** and **NVIDIA DeepSeek v3.2**. If a search doesn't match our database, the AI will scour the internet to answer your question and provide specific sources.
- **Gamification:** Earn points, level up, and gain badges as you watch and interact with content.

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, shadcn/ui
- **Backend & Database:** Supabase
- **AI Logic:** Supabase Edge Functions (Deno), NVIDIA API, Tavily API

## Getting Started Locally

> **Important:** To search the internet with AI, this project relies on a live Supabase project configured with Edge Functions. Ensure your `.env` variables and Supabase Edge functions are active.

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. Open `http://localhost:8080` in your browser.

---

### Deploying
This project is configured to be deployed easily on **Vercel**. Link your GitHub repository to Vercel and ensure you add the following Environment Variables before deploying:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
