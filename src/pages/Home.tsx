import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import ReelCard from '@/components/ReelCard';
import FadeContent from '@/components/effects/FadeContent';
import BlurText from '@/components/effects/BlurText';

export default function Home() {
  const { user } = useAuth();
  const [reels, setReels] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchReels = async () => {
      const { data } = await supabase
        .from('reels')
        .select('*')
        .is('parent_reel_id', null)
        .eq('is_repost', false)
        .order('reach_score', { ascending: false })
        .limit(50);

      if (data && data.length > 0) {
        setReels(data);
        const userIds = [...new Set(data.map(r => r.uploaded_by))];
        const { data: profileData } = await supabase.from('profiles').select('*').in('user_id', userIds);
        if (profileData) {
          const map: Record<string, any> = {};
          profileData.forEach(p => map[p.user_id] = p);
          setProfiles(map);
        }
      }
      setLoading(false);
    };
    fetchReels();
  }, []);

  // Track scroll position for progress dots
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || reels.length === 0) return;
    const handleScroll = () => {
      const idx = Math.round(el.scrollTop / el.clientHeight);
      setCurrentIndex(idx);
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [reels]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[100dvh] bg-[#080808]">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] px-4 relative overflow-hidden bg-[#080808]">
        <div 
          className="fixed inset-0 z-0 pointer-events-none" 
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px'
          }}
        />
        <div className="fixed h-[600px] w-[600px] rounded-full bg-white/4 blur-[150px] -left-40 top-1/2 -translate-y-1/2 pointer-events-none z-0" />
        <FadeContent className="text-center max-w-md relative z-10">
          <div className="w-24 h-24 rounded-2xl bg-white shadow-lg shadow-white/10 flex items-center justify-center mx-auto mb-6">
            <BlurText text="CR" className="text-4xl font-bold text-black" />
          </div>
          <h1 className="text-4xl font-bold mb-3 text-white">
            <BlurText text="CodeReels" className="" delay={0.3} />
          </h1>
          <p className="text-white/50 mb-6">
            <BlurText text="The premium platform for coding education. Upload your first reel to get started!" delay={0.5} />
          </p>
          <div className="flex justify-center gap-3">
            {['DSA', 'Web Dev', 'AI-ML', 'Hardware', 'Other'].map((cat) => (
              <span key={cat} className="px-3 py-1 rounded-full text-xs font-mono border border-white/15 text-white/70 bg-white/8">
                {cat}
              </span>
            ))}
          </div>
        </FadeContent>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] w-full bg-black overflow-hidden">
      {/* Ambient glow — fixed behind content */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="w-96 h-96 rounded-full bg-white/[0.03] blur-[120px] absolute -left-20 top-1/3" />
        <div className="w-64 h-64 rounded-full bg-white/[0.02] blur-[100px] absolute -right-10 bottom-1/3" />
      </div>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="relative z-10 h-[100dvh] w-full snap-y snap-mandatory overflow-y-scroll sm:flex sm:flex-col sm:items-center"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>
        {reels.map(reel => (
          <ReelCard
            key={reel.id}
            reel={reel}
            uploaderProfile={profiles[reel.uploaded_by]}
            onDeleted={() => setReels(prev => prev.filter(r => r.id !== reel.id))}
          />
        ))}
      </div>

      {/* Scroll progress dots — desktop only */}
      <div className="hidden sm:flex fixed right-3 top-1/2 -translate-y-1/2 z-30 flex-col gap-1.5">
        {reels.slice(0, 10).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 rounded-full transition-all duration-300 ${
              i === currentIndex ? 'h-4 bg-white' : 'h-1.5 bg-white/20'
            }`}
          />
        ))}
        {reels.length > 10 && (
          <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
        )}
      </div>
    </div>
  );
}
