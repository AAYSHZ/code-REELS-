import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import ReelCard from '@/components/ReelCard';
import { getDifficultyBg, getCategoryColor } from '@/utils/pointsEngine';

export default function ReelDetail() {
  const { reelId } = useParams();
  const navigate = useNavigate();
  const [reel, setReel] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: r } = await supabase.from('reels').select('*').eq('id', reelId).single();
      if (r) {
        setReel(r);
        const { data: p } = await supabase.from('profiles').select('*').eq('user_id', r.uploaded_by).single();
        if (p) setProfile(p);
        const { data: rep } = await supabase.from('reels').select('*').eq('parent_reel_id', r.id).order('created_at', { ascending: false });
        if (rep) setReplies(rep);
      }
      setLoading(false);
    };
    if (reelId) fetch();
  }, [reelId]);

  if (loading) return <div className="flex items-center justify-center min-h-screen pt-16"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!reel) return <div className="flex items-center justify-center min-h-screen pt-16 text-muted-foreground">Reel not found</div>;

  return (
    <div className="pt-16 pb-24">
      <ReelCard
        reel={reel}
        uploaderProfile={profile}
        onDeleted={() => navigate(-1)}
      />

      {replies.length > 0 && (
        <div className="px-4 max-w-2xl mx-auto mt-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Reply Reels ({replies.length})</h3>
          <div className="space-y-3">
            {replies.map(r => (
              <div key={r.id} className="glass rounded-xl p-3">
                <video src={r.video_url} controls className="w-full rounded-lg mb-2" />
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${getDifficultyBg(r.difficulty)}`}>{r.difficulty}</span>
                  <span className="text-xs text-foreground font-medium">{r.title}</span>
                  {r.is_best_solution && <span className="text-[10px] text-secondary font-mono">✓ Best Solution</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
