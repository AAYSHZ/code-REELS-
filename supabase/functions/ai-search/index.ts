import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query || query.trim().length === 0) {
      throw new Error("No query provided");
    }

    // ─── Step 1: Database Search ───────────────────────────────────────
    // Search the reels table first to see if we already have relevant content
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    console.log("Supabase URL present:", !!supabaseUrl);
    console.log("Supabase Key present:", !!supabaseKey);

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase environment variables missing");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Searching database for:", query);
    const { data: dbResults, error: dbError } = await supabase
      .from("reels")
      .select("id, title, description, category, difficulty, likes_count, total_views")
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
      .order("reach_score", { ascending: false })
      .limit(5);

    if (dbError) {
      console.error("Database search error:", dbError);
    }

    const hasDbResults = dbResults && dbResults.length > 0;

    // ─── Step 2: If DB has no results, fallback to Tavily (internet search) ──
    let tavilySources: any[] = [];
    let searchContext = "";

    if (hasDbResults) {
      // Use our own database content as the context
      searchContext = dbResults
        .map(
          (r: any) =>
            `Title: ${r.title}\nDescription: ${r.description || "N/A"}\nCategory: ${r.category}\nDifficulty: ${r.difficulty}\nViews: ${r.total_views}, Likes: ${r.likes_count}`
        )
        .join("\n\n");
    } else {
      // No local results — search the internet via Tavily
      const tavilyKey = Deno.env.get("TAVILY_API_KEY");
      console.log("Tavily Key present:", !!tavilyKey);
      if (!tavilyKey) throw new Error("TAVILY_API_KEY not set");

      console.log("Calling Tavily API...");
      const tavilyResponse = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: tavilyKey,
          query: query,
          search_depth: "basic",
          include_answers: true,
          max_results: 5,
        }),
      });

      if (!tavilyResponse.ok) {
        const errText = await tavilyResponse.text();
        throw new Error(`Tavily API error: ${tavilyResponse.status} ${errText}`);
      }

      const tavilyData = await tavilyResponse.json();
      tavilySources = (tavilyData.results || []).map((r: any) => ({
        title: r.title,
        url: r.url,
        content: r.content,
      }));

      searchContext = tavilySources
        .map((r: any) => `Source: ${r.url}\nTitle: ${r.title}\nContent: ${r.content}`)
        .join("\n\n");
    }

    const nvidiaKey = Deno.env.get("NVIDIA_API_KEY");
    if (!nvidiaKey) throw new Error("NVIDIA_API_KEY not set");

    const nvidiaResponse = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": nvidiaKey.startsWith('Bearer') ? nvidiaKey : `Bearer ${nvidiaKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct",
        messages: [
          {
            role: "system",
            content: hasDbResults 
              ? "You are a helpful assistant for CodeReels, a coding video platform. Answer based on the reels content provided."
              : "You are a helpful coding assistant. Answer the user's question concisely."
          },
          {
            role: "user", 
            content: `Question: ${query}\n\nContext:\n${searchContext}`
          }
        ],
        max_tokens: 512,
        temperature: 0.7,
        stream: false
      })
    });

    const nvidiaData = await nvidiaResponse.json();
    const answer = nvidiaData.choices?.[0]?.message?.content || "No answer generated";

    // ─── Step 4: Return everything to the frontend ────────────────────
    return new Response(
      JSON.stringify({
        answer,
        fromDatabase: hasDbResults,
        reels: hasDbResults ? dbResults : [],
        sources: tavilySources,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("ai-search error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
