import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Flame, Coins, Star, Shield, Crown, Edit, UserPlus, UserMinus, Github, Linkedin, Globe, Pin } from 'lucide-react';
import SkillRadarChart from '@/components/SkillRadarChart';
import { calculateLevel, xpForLevel } from '@/utils/pointsEngine';
import { timeAgo } from '@/utils/timeAgo';
import FadeContent from '@/components/effects/FadeContent';
import DecryptedText from '@/components/effects/DecryptedText';
import CircularText from '@/components/effects/CircularText';
import GradientText from '@/components/effects/GradientText';
import CountUp from '@/components/effects/CountUp';
import ShinyText from '@/components/effects/ShinyText';
import ProfileEditModal from '@/components/ProfileEditModal';
import { ProfileSkeleton } from '@/components/Skeleton';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const isOwnProfile = user?.id === userId;

  const fetchData = async () => {
    const { data: p } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
    if (p) setProfile({ ...p, skill_points: (p.skill_points as any) || { dsa: 0, webdev: 0, aiml: 0, hardware: 0 } });
    
    const { data: r } = await supabase.from('reels').select('*').eq('uploaded_by', userId).order('created_at', { ascending: false });
    if (r) setReels(r);

    // Follower counts
    const { count: fc } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId);
    const { count: fgc } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId);
    setFollowersCount(fc || 0);
    setFollowingCount(fgc || 0);

    if (user && user.id !== userId) {
      const { data: fw } = await supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', userId).maybeSingle();
      setIsFollowing(!!fw);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (userId) fetchData();
  }, [userId]);

  const handleFollow = async () => {
    if (!user) return;
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', userId);
      setIsFollowing(false);
      setFollowersCount(c => c - 1);
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: userId });
      setIsFollowing(true);
      setFollowersCount(c => c + 1);
      toast.success('Following! 🎉');
    }
  };

  const handlePinReel = async (reelId: string) => {
    if (!user || !isOwnProfile) return;
    await supabase.from('profiles').update({ pinned_reel_id: reelId }).eq('user_id', user.id);
    setProfile((p: any) => ({ ...p, pinned_reel_id: reelId }));
    toast.success('Reel pinned! 📌');
  };

  if (loading) return <ProfileSkeleton />;
  if (!profile) return <div className="flex items-center justify-center min-h-screen pt-16 text-muted-foreground">Profile not found</div>;

  const nextLevelXp = xpForLevel(profile.level + 1);
  const xpProgress = Math.min((profile.xp / nextLevelXp) * 100, 100);
  const totalScore = profile.xp + profile.reputation_score + profile.coins;
  const badgeText = `${(profile.current_badge || 'NEWCOMER').toUpperCase()} • LEVEL ${profile.level} • `;
  const pinnedReel = reels.find(r => r.id === profile.pinned_reel_id);
  const otherReels = reels.filter(r => r.id !== profile.pinned_reel_id);

  return (
    <FadeContent className="min-h-screen pt-16 pb-24">
      {/* Cover Photo */}
      <div className="relative h-36 w-full overflow-hidden">
        {profile.cover_photo ? (
          <img src={profile.cover_photo} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full gradient-primary opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-12 relative z-10">
        {/* Header */}
        <div className="flex items-end gap-4 mb-4">
          <div className="relative w-24 h-24 flex-shrink-0">
            <CircularText text={badgeText} radius={48} />
            <div className="absolute inset-3 rounded-full gradient-primary glow-primary flex items-center justify-center text-2xl font-bold text-primary-foreground overflow-hidden">
              {profile.avatar ? (
                <img src={profile.avatar} className="w-full h-full object-cover" />
              ) : (
                profile.name?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground truncate">
                <DecryptedText text={profile.name || 'User'} speed={40} />
              </h1>
              {profile.is_verified_creator && <Shield className="w-4 h-4 text-primary" />}
              {profile.is_elite_creator && <Crown className="w-4 h-4 text-warning" />}
              {profile.open_to_collab && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-success/20 text-success border border-success/30">Open to Collab</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded-full text-xs font-mono gradient-primary text-primary-foreground">Lv.<CountUp end={profile.level} duration={1} /></span>
              <GradientText text={profile.current_badge || 'Newcomer'} className="text-xs font-semibold" />
            </div>
            {profile.bio && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{profile.bio}</p>}
          </div>
        </div>

        {/* Social Links */}
        {(profile.github_url || profile.linkedin_url || profile.portfolio_url) && (
          <div className="flex items-center gap-3 mb-3">
            {profile.github_url && <a href={`https://${profile.github_url}`} target="_blank" rel="noopener" className="text-muted-foreground hover:text-foreground transition-colors"><Github className="w-4 h-4" /></a>}
            {profile.linkedin_url && <a href={`https://${profile.linkedin_url}`} target="_blank" rel="noopener" className="text-muted-foreground hover:text-foreground transition-colors"><Linkedin className="w-4 h-4" /></a>}
            {profile.portfolio_url && <a href={`https://${profile.portfolio_url}`} target="_blank" rel="noopener" className="text-muted-foreground hover:text-foreground transition-colors"><Globe className="w-4 h-4" /></a>}
          </div>
        )}

        {/* Skill Tags */}
        {profile.skill_tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {profile.skill_tags.map((tag: string, i: number) => (
              <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">{tag}</span>
            ))}
          </div>
        )}

        {/* Follow Stats + Actions */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-4 text-sm">
            <span><strong className="text-foreground"><CountUp end={followersCount} duration={1} /></strong> <span className="text-muted-foreground">followers</span></span>
            <span><strong className="text-foreground"><CountUp end={followingCount} duration={1} /></strong> <span className="text-muted-foreground">following</span></span>
            <span><strong className="text-foreground">{reels.length}</strong> <span className="text-muted-foreground">reels</span></span>
          </div>
          <div className="flex-1" />
          {isOwnProfile ? (
            <Button size="sm" variant="outline" onClick={() => setEditOpen(true)} className="gap-1 btn-press">
              <Edit className="w-3 h-3" /> Edit
            </Button>
          ) : user ? (
            <Button size="sm" onClick={handleFollow} className={`gap-1 btn-press ${isFollowing ? 'variant-outline' : 'gradient-primary glow-primary'}`} variant={isFollowing ? 'outline' : 'default'}>
              {isFollowing ? <><UserMinus className="w-3 h-3" /> Unfollow</> : <><UserPlus className="w-3 h-3" /> Follow</>}
            </Button>
          ) : null}
        </div>

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
            <p className="text-sm font-bold text-accent"><CountUp end={profile.creator_points} /></p>
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
        {profile.badges?.length > 0 && (
          <div className="glass rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">Badges</h3>
            <div className="flex flex-wrap gap-2">
              {profile.badges.map((badge: string, i: number) => (
                <span key={i} className="px-3 py-1 rounded-full text-xs font-medium gradient-primary text-primary-foreground">
                  {badge}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Pinned Reel */}
        {pinnedReel && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1">
              <Pin className="w-3 h-3 text-primary" /> Pinned Reel
            </h3>
            <Link to={`/reel/${pinnedReel.id}`} className="glass rounded-xl p-3 flex gap-3 hover:border-primary/30 transition-colors block">
              <div className="w-20 h-28 rounded-lg bg-muted/30 flex-shrink-0 overflow-hidden">
                <video src={pinnedReel.video_url} className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{pinnedReel.title}</p>
                <p className="text-xs text-muted-foreground mt-1">❤️ {pinnedReel.likes_count} • 👁 {pinnedReel.total_views}</p>
              </div>
            </Link>
          </div>
        )}

        {/* User's Reels */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Reels ({reels.length})</h3>
          {reels.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center">
              <p className="text-muted-foreground text-sm">No reels yet — be the first to post! 🎬</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {(pinnedReel ? otherReels : reels).map(reel => (
                <Link to={`/reel/${reel.id}`} key={reel.id} className="aspect-[9/16] rounded-xl glass overflow-hidden relative group cursor-pointer">
                  <video src={reel.video_url} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                    <p className="text-xs text-foreground text-center px-2">{reel.title}</p>
                    {isOwnProfile && !profile.pinned_reel_id && (
                      <button onClick={(e) => { e.preventDefault(); handlePinReel(reel.id); }} className="mt-2 text-[10px] text-primary hover:underline">📌 Pin</button>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {isOwnProfile && profile && (
        <ProfileEditModal open={editOpen} onOpenChange={setEditOpen} profile={profile} onSaved={fetchData} />
      )}
    </FadeContent>
  );
}
