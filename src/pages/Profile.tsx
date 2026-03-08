import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useFollow } from '@/hooks/useFollow';
import { Progress } from '@/components/ui/progress';
import { Flame, Coins, Star, Shield, Crown, Settings, Github, Linkedin, Globe, Eye, UserPlus, Check, Handshake, Pin, Repeat2 } from 'lucide-react';
import { motion } from 'framer-motion';
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
import FollowListModal from '@/components/FollowListModal';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';

export default function Profile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [reels, setReels] = useState<any[]>([]);
  const [reposts, setReposts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'reels' | 'reposts'>('reels');
  const [pinnedReel, setPinnedReel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [followListType, setFollowListType] = useState<'followers' | 'following' | null>(null);
  const { isFollowing, toggleFollow, followerCount, followingCount, loading: followLoading } = useFollow(userId || '');

  const isOwnProfile = user?.id === userId;

  const fetchData = async () => {
    const { data: p } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
    if (p) {
      setProfile({
        ...p,
        skill_points: (p.skill_points as any) || { dsa: 0, webdev: 0, aiml: 0, hardware: 0, other: 0, coding_problems: 0, learning_roadmaps: 0, troubleshooting: 0 },
      });
      // Fetch pinned reel
      if (p.pinned_reel_id) {
        const { data: pr } = await supabase.from('reels').select('*').eq('id', p.pinned_reel_id).single();
        if (pr) setPinnedReel(pr);
      } else {
        setPinnedReel(null);
      }
    }
    const { data: r } = await supabase.from('reels').select('*').eq('uploaded_by', userId).order('created_at', { ascending: false });
    if (r) {
      setReels(r.filter(reel => !reel.is_repost));
      setReposts(r.filter(reel => reel.is_repost));
    }

    setLoading(false);
  };

  useEffect(() => {
    if (userId) fetchData();
  }, [userId]);

  const handleFollow = async () => {
    if (!user) { toast.error('Login to follow'); return; }
    await toggleFollow();
  };

  const handlePinReel = async (reelId: string) => {
    if (!user || !isOwnProfile) return;
    const newPinned = profile.pinned_reel_id === reelId ? null : reelId;
    await supabase.from('profiles').update({ pinned_reel_id: newPinned }).eq('user_id', user.id);
    fetchData();
    toast.success(newPinned ? 'Reel pinned!' : 'Reel unpinned');
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen pt-16"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!profile) return <div className="flex items-center justify-center min-h-screen pt-16 text-muted-foreground">Profile not found</div>;

  const currentXp = profile.xp || 0;
  const currentLevel = Math.floor(Math.sqrt(currentXp / 10));
  const xpForNextLevel = Math.pow(currentLevel + 1, 2) * 10;
  const xpForCurrentLevel = Math.pow(currentLevel, 2) * 10;
  const progressPercentage = Math.min(Math.max(((currentXp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100, 0), 100);

  const totalScore = currentXp + (profile.reputation_score || 0) + (profile.coins || 0);
  const badgeText = `${(profile.current_badge || 'NEWCOMER').toUpperCase()} • LEVEL ${currentLevel} • `;

  return (
    <FadeContent className="min-h-screen pt-16 pb-24 max-w-2xl mx-auto">
      {/* Cover Photo */}
      <div className="relative w-full h-32 sm:h-40 overflow-hidden">
        {profile.cover_photo ? (
          <img src={profile.cover_photo} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full gradient-primary opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="px-4 -mt-12 relative z-10">
        {/* Header */}
        <div className="flex items-end gap-4 mb-2">
          <div className="relative w-24 h-24 flex-shrink-0">
            <CircularText text={badgeText} radius={48} />
            <div className="absolute inset-3 rounded-full overflow-hidden border-4 border-background">
              <Avatar className="w-full h-full">
                <AvatarImage src={profile.avatar || undefined} />
                <AvatarFallback className="gradient-primary text-2xl font-bold text-foreground w-full h-full">
                  {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          <div className="flex-1 pb-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">
                <DecryptedText text={profile.name || 'User'} speed={40} />
              </h1>
              {profile.is_verified_creator && <Shield className="w-4 h-4 text-primary" />}
              {profile.is_elite_creator && <Crown className="w-4 h-4 text-warning" />}
              {profile.open_to_collab && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                  <Handshake className="w-3 h-3" /> Collab
                </span>
              )}
            </div>
            {profile.username && (
              <p className="text-xs text-muted-foreground font-mono">@{profile.username}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded-full text-xs font-mono gradient-primary text-foreground">Lv.<CountUp end={currentLevel} duration={1} /></span>
              <GradientText text={profile.current_badge || 'Newcomer'} className="text-xs font-semibold" />
            </div>
          </div>
        </div>

        {/* Followers / Following */}
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => setFollowListType('followers')} className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50">
            <strong className="text-foreground">{followerCount}</strong> Followers
          </button>
          <button onClick={() => setFollowListType('following')} className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50">
            <strong className="text-foreground">{followingCount}</strong> Following
          </button>
          {profile.total_watch_hours != null && profile.total_watch_hours > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Eye className="w-3 h-3" /> {profile.total_watch_hours.toFixed(1)}h watched
            </span>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-muted-foreground mb-2 leading-relaxed">{profile.bio}</p>
        )}

        {/* Skill Tags */}
        {(profile.skill_tags as string[] || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(profile.skill_tags as string[]).map((tag: string, i: number) => (
              <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/20 text-primary border border-primary/30">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Social Links */}
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
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-4">
          {isOwnProfile ? (
            <Button variant="outline" size="sm" className="flex-1 glass border-border" onClick={() => setEditOpen(true)}>
              <Settings className="w-4 h-4 mr-2" /> Edit Profile
            </Button>
          ) : (
            <Button
              size="sm"
              className={`flex-1 ${isFollowing ? 'glass border-border text-muted-foreground' : ''}`}
              variant={isFollowing ? 'outline' : 'default'}
              style={!isFollowing ? { backgroundColor: '#6C63FF', color: '#fff' } : undefined}
              onClick={handleFollow}
              disabled={followLoading}
            >
              {isFollowing ? <><Check className="w-4 h-4 mr-1" /> Following</> : <><UserPlus className="w-4 h-4 mr-1" /> Follow</>}
            </Button>
          )}
        </div>

        {/* XP Bar */}
        <div className="glass rounded-xl p-4 mb-4">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-muted-foreground">XP: <CountUp end={currentXp} duration={1.5} /></span>
            <span className="text-muted-foreground">Next: {xpForNextLevel.toLocaleString()}</span>
          </div>
          <div className="h-3 w-full bg-secondary/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              style={{ backgroundImage: 'linear-gradient(to right, var(--tw-gradient-stops))' }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="glass rounded-xl p-3 text-center">
            <Star className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground"><CountUp end={totalScore} duration={2} /></p>
            <p className="text-[10px] text-muted-foreground">Total</p>
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
          <div className="glass rounded-xl p-3 text-center">
            <Repeat2 className="w-4 h-4 text-secondary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground"><CountUp end={reposts.length} duration={1} /></p>
            <p className="text-[10px] text-muted-foreground">Reposts</p>
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

        {/* Pinned Reel */}
        {pinnedReel && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1"><Pin className="w-3.5 h-3.5 text-primary" /> Pinned Reel</h3>
            <div
              className="aspect-[9/16] max-w-[200px] rounded-xl glass overflow-hidden relative group cursor-pointer border-2 border-primary/30"
              onClick={() => navigate(`/reel/${pinnedReel.id}`)}
            >
              <video src={pinnedReel.video_url} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <p className="text-xs text-foreground text-center px-2">{pinnedReel.title}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs for Reels and Reposts */}
        <div className="flex gap-4 border-b border-white/10 mb-4">
          <button
            className={`pb-2 text-sm font-semibold transition-colors ${activeTab === 'reels' ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('reels')}
          >
            Reels ({reels.length})
          </button>
          <button
            className={`pb-2 text-sm font-semibold transition-colors ${activeTab === 'reposts' ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('reposts')}
          >
            Reposts ({reposts.length})
          </button>
        </div>

        {/* Content based on tab */}
        {activeTab === 'reels' && (
          <div>
            {reels.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground"><p>No reels yet.</p></div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {reels.map(reel => (
                  <div key={reel.id} className="aspect-[9/16] rounded-xl glass overflow-hidden relative group cursor-pointer" onClick={() => navigate(`/reel/${reel.id}`)}>
                    <video src={reel.video_url} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                      <p className="text-xs text-foreground text-center px-2">{reel.title}</p>
                      {isOwnProfile && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePinReel(reel.id); }}
                          className={`text-[10px] flex items-center gap-0.5 px-2 py-0.5 rounded-full ${profile.pinned_reel_id === reel.id ? 'bg-primary/30 text-primary' : 'bg-background/60 text-muted-foreground hover:text-foreground'}`}
                        >
                          <Pin className="w-3 h-3" /> {profile.pinned_reel_id === reel.id ? 'Unpin' : 'Pin'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reposts' && (
          <div>
            {reposts.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground"><p>No reposts yet.</p></div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {reposts.map(reel => (
                  <div key={reel.id} className="aspect-[9/16] rounded-xl glass overflow-hidden relative group cursor-pointer" onClick={() => navigate(`/reel/${reel.original_reel_id || reel.id}`)}>
                    <video src={reel.video_url} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1 backdrop-blur-md">
                      <Repeat2 className="w-3 h-3 text-white" />
                    </div>
                    <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                      <p className="text-xs text-foreground text-center px-2">{reel.title}</p>
                      <span className="text-[10px] font-medium bg-secondary/80 text-secondary-foreground px-2 py-0.5 rounded-full backdrop-blur-md">
                        Reposted
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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

      {/* Follow List Modal */}
      <AnimatePresence>
        {followListType && (
          <FollowListModal
            userId={userId || ''}
            type={followListType}
            onClose={() => setFollowListType(null)}
          />
        )}
      </AnimatePresence>
    </FadeContent>
  );
}
