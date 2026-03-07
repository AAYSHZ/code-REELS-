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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: dbResults } = await supabase
      .from("reels")
      .select("id, title, description, category, difficulty, likes_count, total_views")
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
      .order("reach_score", { ascending: false })
      .limit(5);

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
      if (!tavilyKey) throw new Error("TAVILY_API_KEY not set");

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

    // ─── Step 3: Send context + query to NVIDIA DeepSeek ──────────────
    const nvidiaKey = Deno.env.get("NVIDIA_API_KEY");
    if (!nvidiaKey) throw new Error("NVIDIA_API_KEY not set");

    const systemPrompt = hasDbResults
      ? `You are a helpful assistant for a coding reels platform called CodeReels. The user searched for something and we found matching reels in our database. Summarize what we found in a friendly, concise way. Mention the reel titles and what they cover.

Our Database Results:
${searchContext}`
      : `You are a helpful AI assistant. The user searched for something that we don't have on our platform, so we searched the internet for them. Answer the user's question using ONLY the following internet search results. Be concise and helpful. Always cite the source URLs at the end of your answer.

Internet Search Results:
${searchContext}`;

    const nvidiaResponse = await fetch(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${nvidiaKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-ai/deepseek-v3.2",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: query },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      }
    );

    if (!nvidiaResponse.ok) {
      const errText = await nvidiaResponse.text();
      throw new Error(`NVIDIA API error: ${nvidiaResponse.status} ${errText}`);
    }

    const nvidiaData = await nvidiaResponse.json();
    const answer = nvidiaData.choices[0].message.content;

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
