import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search as SearchIcon } from 'lucide-react';
import { getDifficultyBg, getCategoryColor } from '@/utils/pointsEngine';
import { Link } from 'react-router-dom';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    setSearching(true);
    let q = supabase.from('reels').select('*').order('reach_score', { ascending: false }).limit(20);
    if (query) q = q.ilike('title', `%${query}%`);
    if (category !== 'all') q = q.eq('category', category);
    if (difficulty !== 'all') q = q.eq('difficulty', difficulty);
    const { data } = await q;
    if (data) setResults(data);
    setSearching(false);
  };

  return (
    <div className="min-h-screen pt-20 pb-24 px-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold gradient-text mb-6">Search & Trending</h1>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search reels..."
            className="pl-10 bg-muted/30 border-border"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <Select value={category} onValueChange={v => { setCategory(v); }}>
          <SelectTrigger className="w-32 bg-muted/30 border-border text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="DSA">DSA</SelectItem>
            <SelectItem value="Web Dev">Web Dev</SelectItem>
            <SelectItem value="AI-ML">AI-ML</SelectItem>
            <SelectItem value="Hardware">Hardware</SelectItem>
          </SelectContent>
        </Select>
        <Select value={difficulty} onValueChange={v => { setDifficulty(v); }}>
          <SelectTrigger className="w-28 bg-muted/30 border-border text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="Easy">Easy</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Hard">Hard</SelectItem>
          </SelectContent>
        </Select>
        <button onClick={handleSearch} className="gradient-primary px-4 rounded-lg text-sm font-medium text-foreground">
          Search
        </button>
      </div>

      {searching ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {results.map(r => (
            <Link key={r.id} to={`/reel/${r.id}`} className="glass rounded-xl p-4 flex gap-4 hover:border-primary/20 transition-colors block">
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
                  <span>💬 {r.shares_count}</span>
                </div>
              </div>
            </Link>
          ))}
          {results.length === 0 && !searching && (
            <p className="text-center text-muted-foreground py-8 text-sm">Search for reels or browse trending content</p>
          )}
        </div>
      )}
    </div>
  );
}
