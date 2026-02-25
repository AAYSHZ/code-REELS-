import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Zap, Clock, Users, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { getCategoryColor } from '@/utils/pointsEngine';

export default function Challenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('challenges').select('*').order('end_date', { ascending: true });
      if (data) setChallenges(data);
      if (user) {
        const { data: parts } = await supabase.from('challenge_participants').select('challenge_id').eq('user_id', user.id);
        if (parts) setJoined(new Set(parts.map(p => p.challenge_id)));
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleJoin = async (challengeId: string) => {
    if (!user) { toast.error('Please login first'); return; }
    await supabase.from('challenge_participants').insert({ challenge_id: challengeId, user_id: user.id });
    setJoined(prev => new Set([...prev, challengeId]));
    toast.success('Joined challenge! 🎯');
  };

  const getCountdown = (endDate: string) => {
    const diff = new Date(endDate).getTime() - Date.now();
    if (diff <= 0) return 'Ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h left`;
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen pt-16"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen pt-20 pb-24 px-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold gradient-text mb-2">Challenges</h1>
      <p className="text-sm text-muted-foreground mb-6">Complete challenges for bonus XP and exclusive badges</p>

      {/* Multiplier banner */}
      <div className="glass rounded-xl p-4 mb-6 border-secondary/30 bg-secondary/5">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-secondary animate-pulse" />
          <span className="text-sm font-semibold text-secondary">1.5x Point Multiplier Active During Challenges!</span>
        </div>
      </div>

      {challenges.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No active challenges</p>
      ) : (
        <div className="space-y-4">
          {challenges.map(c => {
            const isEnded = new Date(c.end_date).getTime() < Date.now();
            return (
              <div key={c.id} className="glass rounded-xl p-5 hover:border-primary/20 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{c.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${getCategoryColor(c.category)}`}>
                    {c.category}
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {getCountdown(c.end_date)}</span>
                  <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-warning" /> {c.badge_name}</span>
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-secondary" /> {c.point_multiplier}x</span>
                </div>

                {isEnded ? (
                  <span className="text-xs text-muted-foreground">Challenge ended</span>
                ) : joined.has(c.id) ? (
                  <span className="text-xs text-secondary font-medium">✓ Joined</span>
                ) : (
                  <Button size="sm" onClick={() => handleJoin(c.id)} className="gradient-primary">Join Challenge</Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
