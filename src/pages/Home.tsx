import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import ReelCard from '@/components/ReelCard';
import Particles from '@/components/effects/Particles';
import SplashCursor from '@/components/effects/SplashCursor';
import FadeContent from '@/components/effects/FadeContent';
import BlurText from '@/components/effects/BlurText';

export default function Home() {
  const { user } = useAuth();
  const [reels, setReels] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReels = async () => {
      const { data } = await supabase
        .from('reels')
        .select('*')
        .is('parent_reel_id', null)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-16">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pt-16 px-4 relative overflow-hidden">
        <Particles count={35} color="#6c63ff" />
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
            {['DSA', 'Web Dev', 'AI-ML', 'Hardware'].map((cat, i) => (
              <span key={cat} className="px-3 py-1 rounded-full text-xs font-mono glass border border-border text-muted-foreground">
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
      <Particles count={25} color="#6c63ff" className="fixed" />
      <SplashCursor color="#6c63ff">
        <div className="pt-16 pb-20 md:pb-0 snap-y snap-mandatory h-[calc(100vh-4rem)] overflow-y-scroll scrollbar-hide">
          {reels.map(reel => (
            <ReelCard key={reel.id} reel={reel} uploaderProfile={profiles[reel.uploaded_by]} />
          ))}
        </div>
      </SplashCursor>
    </div>
  );
}
