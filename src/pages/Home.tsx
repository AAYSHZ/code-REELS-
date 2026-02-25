import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import ReelCard from '@/components/ReelCard';

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
      <div className="flex flex-col items-center justify-center min-h-screen pt-16 px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl gradient-primary glow-primary flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl font-bold text-foreground">CR</span>
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-3">Welcome to CodeReels</h1>
          <p className="text-muted-foreground mb-6">
            The short-video platform for coding education. Upload your first reel to get started!
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            DSA • Web Dev • AI-ML • Hardware
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 pb-20 md:pb-0 snap-y snap-mandatory h-[calc(100vh-4rem)] overflow-y-scroll scrollbar-hide">
      {reels.map(reel => (
        <ReelCard key={reel.id} reel={reel} uploaderProfile={profiles[reel.uploaded_by]} />
      ))}
    </div>
  );
}
