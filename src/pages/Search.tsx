import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search as SearchIcon, Bot, ExternalLink, Sparkles, HelpCircle } from 'lucide-react';
import { getDifficultyBg, getCategoryColor } from '@/utils/pointsEngine';
import { Link } from 'react-router-dom';
import FadeContent from '@/components/effects/FadeContent';
import SplitText from '@/components/effects/SplitText';
import TiltedCard from '@/components/effects/TiltedCard';
import Magnet from '@/components/effects/Magnet';

/* ─── Inline tooltip for search filters ───────────────────────────────── */
function SearchTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        type="button"
        aria-label="Info"
        className="text-white/30 hover:text-white/60 transition-colors"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
      {show && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-56 px-3 py-2 rounded-lg bg-[#1A1A1A] border border-white/10 text-[12px] text-white/70 leading-relaxed shadow-xl whitespace-pre-line pointer-events-none">
          {text}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // AI Search state
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiSources, setAiSources] = useState<any[]>([]);
  const [aiFromDb, setAiFromDb] = useState(false);
  const [aiSearching, setAiSearching] = useState(false);
  const [showAi, setShowAi] = useState(false);

  const handleSearch = async () => {
    setSearching(true);
    setShowAi(false);
    setAiAnswer('');
    setAiSources([]);

    // Normal database search (existing behavior)
    let q = supabase.from('reels').select('*').order('reach_score', { ascending: false }).limit(20);
    if (query) q = q.ilike('title', `%${query}%`);
    if (category !== 'all') q = q.eq('category', category);
    if (difficulty !== 'all') q = q.eq('difficulty', difficulty);
    const { data } = await q;
    if (data) setResults(data);
    setSearching(false);

    // If no results found from the normal search and we have a query, trigger AI search
    if (query && (!data || data.length === 0)) {
      handleAiSearch();
    }
  };

  const handleAiSearch = async () => {
    if (!query.trim()) return;
    setAiSearching(true);
    setShowAi(true);
    setAiAnswer('');
    setAiSources([]);

    try {
      const { data, error } = await supabase.functions.invoke('ai-search', {
        body: { query },
      });

      if (error) {
        console.error('AI Search edge function error:', error);
        throw error;
      }

      if (data?.error) {
        console.error('AI Search returned error:', data.error);
        setAiAnswer(`AI search error: ${data.error}`);
        return;
      }

      setAiAnswer(data.answer || 'No answer found.');
      setAiSources(data.sources || []);
      setAiFromDb(data.fromDatabase || false);

      // If the AI found reels in the database, show them
      if (data.fromDatabase && data.reels?.length > 0) {
        setResults(data.reels);
      }
    } catch (err: any) {
      console.error('AI Search failed:', err);
      const msg = err?.message || err?.context?.message || 'Unknown error';
      setAiAnswer(`Sorry, AI search failed: ${msg}. Check browser console for details.`);
    } finally {
      setAiSearching(false);
    }
  };

  return (
    <FadeContent className="min-h-screen pt-20 pb-24 px-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-white">
        Search & Trending
      </h1>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search reels or ask anything..."
            className="pl-10 bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <div className="flex items-center gap-1">
          <Select value={category} onValueChange={v => setCategory(v)}>
            <SelectTrigger className="w-32 bg-white/5 border border-white/10 text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="DSA">DSA</SelectItem>
              <SelectItem value="Web Dev">Web Dev</SelectItem>
              <SelectItem value="AI-ML">AI-ML</SelectItem>
              <SelectItem value="Hardware">Hardware</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          <SearchTooltip text={"Filter reels by topic:\nDSA — Data Structures & Algorithms\nWeb Dev — Frontend & Backend development\nAI-ML — Machine Learning & AI\nHardware — Embedded systems & IoT\nOther — Everything else"} />
        </div>
        <div className="flex items-center gap-1">
          <Select value={difficulty} onValueChange={v => setDifficulty(v)}>
            <SelectTrigger className="w-28 bg-white/5 border border-white/10 text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="Easy">Easy</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Hard">Hard</SelectItem>
            </SelectContent>
          </Select>
          <SearchTooltip text={"Filter by difficulty:\n🟢 Easy — Beginner friendly concepts\n🟡 Medium — Requires some experience\n🔴 Hard — Advanced topics, maximum XP reward"} />
        </div>
        <Magnet strength={0.15}>
          <button onClick={handleSearch} className="bg-white px-4 py-2 rounded-lg text-sm font-semibold text-black hover:bg-white/90 transition-colors">
            Search
          </button>
        </Magnet>
        {query && (
          <div className="flex items-center gap-1">
            <Magnet strength={0.15}>
              <button onClick={handleAiSearch} className="px-4 py-2 rounded-lg text-sm font-medium text-white border border-white/20 hover:bg-white/8 transition-colors flex items-center gap-1.5 bg-transparent">
                <Sparkles className="w-3.5 h-3.5" />
                Ask CR
              </button>
            </Magnet>
            <SearchTooltip text={"Can't find a reel? Ask CR searches the internet and gives AI-powered answers with real sources attached!"} />
          </div>
        )}
      </div>

      {/* ─── AI Answer Section ─────────────────────────────────────────── */}
      {showAi && (
        <div className="mb-6 rounded-xl p-5 border border-white/10 bg-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-5 h-5 text-white" />
            <span className="text-sm font-semibold text-white">AI Answer</span>
            {aiFromDb && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                From CodeReels
              </span>
            )}
            {!aiFromDb && aiAnswer && !aiSearching && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                From Internet
              </span>
            )}
          </div>

          {aiSearching ? (
            <div className="flex items-center gap-3 py-4">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Searching the internet with AI...</span>
            </div>
          ) : (
            <>
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{aiAnswer}</p>

              {/* Sources */}
              {aiSources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border/50">
                  <p className="text-[11px] text-muted-foreground mb-2 font-medium">Sources:</p>
                  <div className="flex flex-col gap-1.5">
                    {aiSources.map((s: any, i: number) => (
                      <a
                        key={i}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-white/60 hover:text-white flex items-center gap-1 truncate transition-colors"
                      >
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{s.title || s.url}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ─── Reel Results ──────────────────────────────────────────────── */}
      {searching ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {results.map(r => (
            <TiltedCard key={r.id} tiltAmount={4}>
              <Link to={`/reel/${r.id}`} className="rounded-xl p-4 flex gap-4 bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                <div className="w-20 h-28 rounded-lg bg-muted/30 flex-shrink-0 overflow-hidden">
                  <video src={r.video_url} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">{r.title}</h3>
                  <div className="flex gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${getCategoryColor(r.category)}`}>{r.category}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${getDifficultyBg(r.difficulty)}`}>{r.difficulty}</span>
                  </div>
                  <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground">
                    <span>❤️ {r.likes_count}</span>
                    <span>👁 {r.total_views}</span>
                    <span>🔗 {r.shares_count}</span>
                  </div>
                </div>
              </Link>
            </TiltedCard>
          ))}
          {results.length === 0 && !searching && !showAi && (
            <p className="text-center text-muted-foreground py-8 text-sm">Search for reels or browse trending content</p>
          )}
        </div>
      )}
    </FadeContent>
  );
}
