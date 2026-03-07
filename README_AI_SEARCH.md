# Comprehensive Guide: Building AI Search with NVIDIA and Tavily

Here is exactly what you need to do, which tools are best, and how to build and deploy your application.

## 1. Which Language and Framework to Use?

Since you are building a React frontend with Vite (`codereels`) and you use Supabase, the absolute best technology stack for the AI component is:

*   **Language:** JavaScript/TypeScript (Running in **Supabase Edge Functions**)
*   **Why not Python?** Setting up a separate Python server just for one AI route adds unnecessary complexity to hosting and deployment.
*   **Why not Langchain?** You *can* use Langchain.js, but since your flow is straightforward (1. Get user query -> 2. Search Database -> 3. Fallback to Tavily -> 4. Send to NVIDIA LLM), it is much faster and lighter to just write standard TypeScript API calls. Langchain has a steep learning curve and adds a lot of bloat for a simple conversational search loop.
*   **Why not directly from the React frontend (Node)?** The frontend *never* holds secretive API Keys (`NVIDIA_API_KEY` and `TAVILY_API_KEY`). If you put them in Vite env variables and use them in React, users can steal them. You **must** create a Supabase Edge Function to protect the keys.

**Verdict: Write the logic using TypeScript in a Supabase Edge Function.**

---

## 2. Implementation TODO List

Here is your straightforward action plan to proceed with the application:

### Step 1: Initialize Supabase Edge Functions
You need to create a serverless backend inside your Supabase project to handle the AI logic securely.
1. Make sure you have the Supabase CLI installed. If not, install it globally using `npm install -g supabase`.
2. In your terminal, run `supabase login` (it will ask for your access token from the Supabase dashboard).
3. Initialize the project locally: `supabase init`.
4. Create the new Edge function for AI searches: `supabase functions new ai-search`.

### Step 2: Set your Secrets in Supabase
Your `.env` file works for local dev, but you need to push these API keys securely into Supabase so your Edge Function can read them in production.
Run these commands in your terminal:
```bash
supabase secrets set NVIDIA_API_KEY="your_nvidia_api_key_here"
supabase secrets set TAVILY_API_KEY="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"
```

### Step 3: Write the TypeScript Logic in the Edge Function
Inside the newly created folder `supabase/functions/ai-search/index.ts`, you will write a server that does the following:

1.  **Receive the query:** Read the query from the user (e.g., "How to bake a cake?").
2.  **Database Vector Search:** Query your Supabase database first to see if you have relevant documents.
3.  **Tavily Search API:** If the database doesn't have a good answer, call the Tavily API endpoint `https://api.tavily.com/search`, passing in the user's query and the `TAVILY_API_KEY`. Tavily will return a clean JSON string with top URLs and content.
4.  **NVIDIA API Integration:** Take the Tavily results (or the database results), bundle them into a system prompt (e.g., *"You are an AI assistant. Answer the user using ONLY the following sources. Include the URLs in your answer: [TAVILY_RESULTS]"*).
5.  Post this to the NVIDIA chat completion endpoint using standard `fetch()`. The NVIDIA Qwen model will formulate the final answer.
6.  Return the text back to the frontend.

### Step 4: Frontend Integration
In your React app, you will call your secure Edge Function instead of calling the NVIDIA API directly.

```typescript
// Inside your React Component
const response = await supabase.functions.invoke('ai-search', {
  body: { query: userInput }
})
```

---

## 3. Deployment Guide

Since you have a Frontend (React/Vite) and AI Logic (Edge Function), you will deploy them to two different places.

### Deploying the Backend (Supabase Edge Function)
1. Ensure your Supabase project is linked to your local code:
   `supabase link --project-ref dpnwydbyogoucyegqrvz`
2. Deploy the edge function:
   `supabase functions deploy ai-search`
*(Your Supabase secrets are already stored safely via the command in Step 2).*

### Deploying the Frontend (Vercel)
Vercel is the easiest and best free host for Vite React apps.

1. **Push your code to GitHub.**
2. **Go to Vercel (vercel.com) and log in.**
3. **Click "Add New" > "Project".**
4. **Import your GitHub repository.**
5. Vercel will automatically detect that you are using Vite and automatically configure the build commands.
6. **Environment Variables Configuration:**
   Expand the "Environment Variables" section before deploying. You only need to add the **safely exposed Vite variables**. DO NOT add Nvidia or Tavily keys here! Add the following:
   *   `VITE_SUPABASE_URL` = `https://dpnwydbyogoucyegqrvz.supabase.co`
   *   `VITE_SUPABASE_ANON_KEY` = `[YOUR_ANON_KEY_FROM_.ENV]`
7. **Click Deploy.**

Your application is now live, your API Keys are protected via the Supabase backend, and Qwen will fall back to Tavily for real-time web search fallback!
