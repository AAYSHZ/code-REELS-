import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Progress } from '@/components/ui/progress';
import { Flame, Coins, Star, Shield, Crown, Settings, Github, Linkedin, Globe, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import SkillRadarChart from '@/components/SkillRadarChart';
import EditProfileModal from '@/components/EditProfileModal';
import { xpForLevel } from '@/utils/pointsEngine';
import FadeContent from '@/components/effects/FadeContent';
import DecryptedText from '@/components/effects/DecryptedText';
import CircularText from '@/components/effects/CircularText';
import GradientText from '@/components/effects/GradientText';
import CountUp from '@/components/effects/CountUp';

export default function Profile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const isOwnProfile = user?.id === userId;

  const fetchData = async () => {
    const { data: p } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
    if (p) setProfile({
      ...p,
      skill_points: (p.skill_points as any) || { dsa: 0, webdev: 0, aiml: 0, hardware: 0, coding_problems: 0, learning_roadmaps: 0, troubleshooting: 0 },
    });
    const { data: r } = await supabase.from('reels').select('*').eq('uploaded_by', userId).order('created_at', { ascending: false });
    if (r) setReels(r);
    setLoading(false);
  };

  useEffect(() => {
    if (userId) fetchData();
  }, [userId]);

  if (loading) return <div className="flex items-center justify-center min-h-screen pt-16"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!profile) return <div className="flex items-center justify-center min-h-screen pt-16 text-muted-foreground">Profile not found</div>;

  const nextLevelXp = xpForLevel(profile.level + 1);
  const xpProgress = Math.min((profile.xp / nextLevelXp) * 100, 100);
  const totalScore = profile.xp + profile.reputation_score + profile.coins;
  const badgeText = `${(profile.current_badge || 'NEWCOMER').toUpperCase()} • LEVEL ${profile.level} • `;

  return (
    <FadeContent className="min-h-screen pt-20 pb-24 px-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <div className="relative w-24 h-24 flex-shrink-0">
          <CircularText text={badgeText} radius={48} />
          <div className="absolute inset-3 rounded-full overflow-hidden">
            <Avatar className="w-full h-full">
              <AvatarImage src={profile.avatar || undefined} />
              <AvatarFallback className="gradient-primary text-2xl font-bold text-foreground w-full h-full">
                {profile.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">
              <DecryptedText text={profile.name || 'User'} speed={40} />
            </h1>
            {profile.is_verified_creator && <Shield className="w-4 h-4 text-primary" />}
            {profile.is_elite_creator && <Crown className="w-4 h-4 text-warning" />}
          </div>
          {profile.username && (
            <p className="text-xs text-muted-foreground font-mono">@{profile.username}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded-full text-xs font-mono gradient-primary text-foreground">Lv.<CountUp end={profile.level} duration={1} /></span>
            <GradientText text={profile.current_badge || 'Newcomer'} className="text-xs font-semibold" />
          </div>
        </div>
      </div>

      {/* Bio & Social Links */}
      {profile.bio && (
        <p className="text-sm text-muted-foreground mb-2 leading-relaxed">{profile.bio}</p>
      )}
      <div className="flex items-center gap-3 mb-4">
        {profile.github_url && (
          <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            <Github className="w-4 h-4" />
          </a>
        )}
        {profile.linkedin_url && (
          <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            <Linkedin className="w-4 h-4" />
          </a>
        )}
        {profile.portfolio_url && (
          <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            <Globe className="w-4 h-4" />
          </a>
        )}
        {profile.total_watch_hours != null && profile.total_watch_hours > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Eye className="w-3 h-3" /> {profile.total_watch_hours.toFixed(1)}h watched
          </span>
        )}
      </div>

      {/* Edit Profile Button */}
      {isOwnProfile && (
        <Button variant="outline" size="sm" className="w-full mb-4 glass border-border" onClick={() => setEditOpen(true)}>
          <Settings className="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      )}

      {/* XP Bar */}
      <div className="glass rounded-xl p-4 mb-4">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-muted-foreground">XP: <CountUp end={profile.xp} duration={1.5} /></span>
          <span className="text-muted-foreground">Next: {nextLevelXp.toLocaleString()}</span>
        </div>
        <Progress value={xpProgress} className="h-3 animate-pulse-glow" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="glass rounded-xl p-3 text-center">
          <Star className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground"><CountUp end={totalScore} duration={2} /></p>
          <p className="text-[10px] text-muted-foreground">Total Score</p>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <Coins className="w-4 h-4 text-warning mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground"><CountUp end={profile.coins} duration={2} /></p>
          <p className="text-[10px] text-muted-foreground">Coins</p>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <Flame className="w-4 h-4 text-destructive mx-auto mb-1 animate-flame" />
          <p className="text-lg font-bold text-foreground"><CountUp end={profile.streak_count} duration={1} /></p>
          <p className="text-[10px] text-muted-foreground">Streak</p>
        </div>
      </div>

      {/* Points Breakdown */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass rounded-xl p-3 text-center">
          <p className="text-sm font-bold text-secondary"><CountUp end={profile.creator_points} /></p>
          <p className="text-[10px] text-muted-foreground">Creator</p>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <p className="text-sm font-bold text-primary"><CountUp end={profile.helper_points} /></p>
          <p className="text-[10px] text-muted-foreground">Helper</p>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <p className="text-sm font-bold text-warning"><CountUp end={profile.knowledge_points} /></p>
          <p className="text-[10px] text-muted-foreground">Knowledge</p>
        </div>
      </div>

      {/* Skill Chart */}
      <div className="glass rounded-xl p-4 mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-2">Skill Distribution</h3>
        <SkillRadarChart skillPoints={profile.skill_points} />
      </div>

      {/* Badges */}
      <div className="glass rounded-xl p-4 mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">Badges</h3>
        <div className="flex flex-wrap gap-2">
          {(profile.badges || []).map((badge: string, i: number) => (
            <span key={i} className="px-3 py-1 rounded-full text-xs font-medium gradient-primary text-foreground">
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* User's Reels */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Reels ({reels.length})</h3>
        <div className="grid grid-cols-3 gap-2">
          {reels.map(reel => (
            <div key={reel.id} className="aspect-[9/16] rounded-xl glass overflow-hidden relative group cursor-pointer">
              <video src={reel.video_url} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <p className="text-xs text-foreground text-center px-2">{reel.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {isOwnProfile && editOpen && (
        <EditProfileModal
          open={editOpen}
          onOpenChange={setEditOpen}
          profile={profile}
          onUpdated={fetchData}
        />
      )}
    </FadeContent>
  );
}
