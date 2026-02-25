import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import ReelCard from '@/components/ReelCard';
import Particles from '@/components/effects/Particles';
import SplashCursor from '@/components/effects/SplashCursor';
import FadeContent from '@/components/effects/FadeContent';
import BlurText from '@/components/effects/BlurText';
import { ReelSkeleton } from '@/components/Skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CATEGORIES = ['All', 'DSA', 'Web Dev', 'AI-ML', 'Hardware'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];

export default function Home() {
  const { user } = useAuth();
  const [reels, setReels] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('foryou');
  const [category, setCategory] = useState('All');
  const [difficulty, setDifficulty] = useState('All');

  useEffect(() => {
    const fetchReels = async () => {
      setLoading(true);
      let q = supabase.from('reels').select('*').is('parent_reel_id', null).order('reach_score', { ascending: false }).limit(50);
      
      if (category !== 'All') q = q.eq('category', category);
      if (difficulty !== 'All') q = q.eq('difficulty', difficulty);

      const { data } = await q;

      if (data && data.length > 0) {
        setReels(data);
        const userIds = [...new Set(data.map(r => r.uploaded_by))];
        const { data: profileData } = await supabase.from('profiles').select('*').in('user_id', userIds);
        if (profileData) {
          const map: Record<string, any> = {};
          profileData.forEach(p => map[p.user_id] = p);
          setProfiles(map);
        }
      } else {
        setReels([]);
      }
      setLoading(false);
    };
    fetchReels();
  }, [category, difficulty, tab]);

  if (loading) {
    return (
      <div className="pt-16">
        <ReelSkeleton />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pt-16 px-4 relative overflow-hidden">
        <Particles count={35} color="hsl(217, 91%, 60%)" />
        <FadeContent className="text-center max-w-md relative z-10">
          <div className="w-24 h-24 rounded-2xl gradient-primary glow-primary flex items-center justify-center mx-auto mb-6">
            <BlurText text="CR" className="text-4xl font-bold text-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-3">
            <BlurText text="CodeReels" className="gradient-text" delay={0.3} />
          </h1>
          <p className="text-muted-foreground mb-6">
            <BlurText text="The short-video platform for coding education. Upload your first reel to get started!" delay={0.5} />
          </p>
          <div className="flex justify-center gap-3">
            {['DSA', 'Web Dev', 'AI-ML', 'Hardware'].map(cat => (
              <span key={cat} className="px-3 py-1 rounded-full text-xs font-mono glass text-muted-foreground">
                {cat}
              </span>
            ))}
          </div>
        </FadeContent>
      </div>
    );
  }

  return (
    <div className="relative">
      <Particles count={25} color="hsl(217, 91%, 60%)" className="fixed" />
      
      {/* Top filters */}
      <div className="fixed top-16 left-0 right-0 z-40 glass-strong border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-2">
          <div className="flex items-center gap-3">
            <Tabs value={tab} onValueChange={setTab} className="flex-shrink-0">
              <TabsList className="h-8 bg-muted/30">
                <TabsTrigger value="foryou" className="text-xs h-6 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">For You</TabsTrigger>
                <TabsTrigger value="following" className="text-xs h-6 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">Following</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)} className={`px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all btn-press ${category === c ? 'gradient-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground hover:text-foreground'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SplashCursor color="hsl(217, 91%, 60%)">
        <div className="pt-[7.5rem] pb-20 md:pb-0 snap-y snap-mandatory h-[calc(100vh-7.5rem)] overflow-y-scroll scrollbar-hide">
          {reels.map(reel => (
            <ReelCard key={reel.id} reel={reel} uploaderProfile={profiles[reel.uploaded_by]} />
          ))}
        </div>
      </SplashCursor>
    </div>
  );
}
