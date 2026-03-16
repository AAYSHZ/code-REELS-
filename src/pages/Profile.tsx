import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useFollow } from '@/hooks/useFollow';
import { Flame, Coins, Star, Shield, Crown, Settings, Github, Linkedin, Globe, Eye, UserPlus, Check, Handshake, Pin, Repeat2, Trash2, Trophy, MessageSquare, Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import SkillRadarChart from '@/components/SkillRadarChart';
import EditProfileModal from '@/components/EditProfileModal';
import FadeContent from '@/components/effects/FadeContent';
import CountUp from '@/components/effects/CountUp';
import FollowListModal from '@/components/FollowListModal';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [reels, setReels] = useState<any[]>([]);
  const [reposts, setReposts] = useState<any[]>([]);
  const [savedReels, setSavedReels] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'reels' | 'saved' | 'reposts'>('reels');
  const [pinnedReel, setPinnedReel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [followListType, setFollowListType] = useState<'followers' | 'following' | null>(null);
  const [confirmRemoveRepostId, setConfirmRemoveRepostId] = useState<string | null>(null);
  const { isFollowing, toggleFollow, followerCount, followingCount, loading: followLoading } = useFollow(userId || '');

  const isOwnProfile = user?.id === userId;

  const fetchData = async () => {
    const { data: p } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
    if (p) {
      setProfile({
        ...p,
        skill_points: (p.skill_points as any) || { dsa: 0, webdev: 0, aiml: 0, hardware: 0, debugging: 0, roadmaps: 0, coding: 0, other: 0 },
      });
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

    // Fetch saved reels
    if (user?.id === userId) {
      const { data: saves } = await supabase
        .from('reel_saves')
        .select('reel_id')
        .eq('user_id', userId);
      if (saves && saves.length > 0) {
        const reelIds = saves.map((s: any) => s.reel_id);
        const { data: savedData } = await supabase.from('reels').select('*').in('id', reelIds);
        if (savedData) setSavedReels(savedData);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    if (userId) fetchData();

    if (userId) {
      const channel = supabase
        .channel('profile-xp-' + userId)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: 'user_id=eq.' + userId
        }, (payload) => {
          setProfile((prev: any) => ({ ...prev, ...payload.new }));
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userId]);

  const handleFollow = async () => {
    if (!user) { toast.error('Login to follow'); return; }
    await toggleFollow();
  };

  const handleRemoveRepost = async (repostId: string) => {
    if (!user || !isOwnProfile) return;
    setReposts(prev => prev.filter(r => r.id !== repostId));
    setConfirmRemoveRepostId(null);

    const { error } = await supabase
      .from('reels')
      .delete()
      .eq('id', repostId)
      .eq('uploaded_by', user.id)
      .eq('is_repost', true);

    if (error) {
      console.error('Error removing repost:', error);
      toast.error('Failed to remove repost');
      fetchData();
    } else {
      toast.success('Repost removed');
    }
  };

  const handlePinReel = async (reelId: string) => {
    if (!user || !isOwnProfile) return;
    const newPinned = profile.pinned_reel_id === reelId ? null : reelId;
    await supabase.from('profiles').update({ pinned_reel_id: newPinned }).eq('user_id', user.id);
    fetchData();
    toast.success(newPinned ? 'Reel pinned!' : 'Reel unpinned');
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen pt-16"><div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>;
  if (!profile) return <div className="flex items-center justify-center min-h-screen pt-16 text-white/40">Profile not found</div>;

  const currentXp = profile.xp || 0;
  const currentLevel = Math.floor(Math.sqrt(currentXp / 10));
  const xpForNextLevel = Math.pow(currentLevel + 1, 2) * 10;
  const xpForCurrentLevel = Math.pow(currentLevel, 2) * 10;
  const progressPercentage = Math.min(Math.max(((currentXp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100, 0), 100);

  const badge = profile.current_badge || 'Newcomer';
  let badgeColor = 'bg-white/10 text-white/60 border-white/10';
  if (badge === 'Coder') badgeColor = 'bg-[#2ED573]/20 text-[#2ED573] border-[#2ED573]/30';
  if (badge === 'Debugger') badgeColor = 'bg-[#FFA502]/20 text-[#FFA502] border-[#FFA502]/30';
  if (badge === 'Architect') badgeColor = 'bg-white/20 text-white border-white/20';
  if (badge === 'Code Master') badgeColor = 'bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/30';

  const gridReels = activeTab === 'reels' ? reels : activeTab === 'saved' ? savedReels : reposts;

  return (
    <FadeContent className="min-h-screen pt-16 pb-24 bg-[#080808]">
      <div className="max-w-lg mx-auto px-4">

        {/* ── 1. PROFILE HEADER ── */}
        <div className="pt-6 pb-4">
          <div className="flex items-center gap-5 sm:gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <Avatar className="w-[90px] h-[90px] border-2 border-white/10">
                <AvatarImage src={profile.avatar || undefined} />
                <AvatarFallback className="bg-white/10 text-2xl font-bold text-white w-full h-full">
                  {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-white truncate">{profile.name || 'User'}</h1>
                {profile.is_verified_creator && <Shield className="w-4 h-4 text-white flex-shrink-0" />}
                {profile.is_elite_creator && <Crown className="w-4 h-4 text-[#FFD700] flex-shrink-0" />}
                {profile.open_to_collab && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-500/20 text-green-400 border border-green-500/30 flex-shrink-0">
                    <Handshake className="w-3 h-3" /> Collab
                  </span>
                )}
              </div>

              {profile.username && (
                <p className="text-sm text-white/40 font-mono mt-0.5">@{profile.username}</p>
              )}

              <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}>
                {badge}
              </span>

              {/* Followers inline */}
              <div className="flex items-center gap-1 mt-2">
                <button onClick={() => setFollowListType('followers')} className="text-sm text-white/60 hover:text-white transition-colors">
                  <strong className="text-white">{followerCount}</strong> Followers
                </button>
                <span className="text-white/20 mx-1">·</span>
                <button onClick={() => setFollowListType('following')} className="text-sm text-white/60 hover:text-white transition-colors">
                  <strong className="text-white">{followingCount}</strong> Following
                </button>
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-white/60 mt-3 leading-relaxed">{profile.bio}</p>
          )}

          {/* Skill Tags */}
          {(profile.skill_tags as string[] || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(profile.skill_tags as string[]).map((tag: string, i: number) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/8 text-white/50 border border-white/10">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Social Links */}
          {(profile.github_url || profile.linkedin_url || profile.portfolio_url) && (
            <div className="flex items-center gap-3 mt-3">
              {profile.github_url && (
                <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white transition-colors">
                  <Github className="w-4 h-4" />
                </a>
              )}
              {profile.linkedin_url && (
                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white transition-colors">
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
              {profile.portfolio_url && (
                <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white transition-colors">
                  <Globe className="w-4 h-4" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* ── 2. ACTION BUTTONS ── */}
        <div className="flex gap-2 mb-5">
          {isOwnProfile ? (
            <button
              onClick={() => setEditOpen(true)}
              className="w-full py-2 rounded-lg text-sm font-semibold bg-white/8 border border-white/10 text-white hover:bg-white/12 transition-colors"
            >
              <Settings className="w-4 h-4 inline mr-2" />Settings
            </button>
          ) : (
            <>
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isFollowing
                    ? 'bg-white/8 border border-white/10 text-white/60 hover:bg-white/12'
                    : 'bg-white text-black hover:bg-white/85'
                }`}
              >
                {isFollowing ? <><Check className="w-4 h-4 inline mr-1" />Following</> : <><UserPlus className="w-4 h-4 inline mr-1" />Follow</>}
              </button>
              <button
                onClick={() => navigate('/messages')}
                className="flex-1 py-2 rounded-lg text-sm font-semibold bg-white/8 border border-white/10 text-white hover:bg-white/12 transition-colors"
              >
                <MessageSquare className="w-4 h-4 inline mr-1" />Message
              </button>
            </>
          )}
        </div>

        {/* ── 3. STATS ROW ── */}
        <div className="grid grid-cols-4 gap-0 mb-5">
          <div className="text-center py-2">
            <p className="text-lg font-bold text-white"><CountUp end={currentXp} duration={1.5} /></p>
            <p className="text-[10px] uppercase tracking-wider text-white/30">Total XP</p>
          </div>
          <div className="text-center py-2">
            <p className="text-lg font-bold text-white"><CountUp end={profile.coins || 0} duration={1.5} /></p>
            <p className="text-[10px] uppercase tracking-wider text-white/30">Coins</p>
          </div>
          <div className="text-center py-2">
            <p className={`text-lg font-bold flex items-center justify-center gap-1 ${(profile.streak_count || 0) > 0 ? 'text-white' : 'text-white/20'}`}>
              <Flame className={`w-4 h-4 ${(profile.streak_count || 0) > 0 ? 'text-orange-400' : 'text-white/20'}`} />
              <CountUp end={profile.streak_count || 0} duration={1} />
            </p>
            <p className="text-[10px] uppercase tracking-wider text-white/30">Streak</p>
          </div>
          <div className="text-center py-2">
            <p className="text-lg font-bold text-white"><CountUp end={reposts.length} duration={1} /></p>
            <p className="text-[10px] uppercase tracking-wider text-white/30">Reposts</p>
          </div>
        </div>

        {/* ── 4. XP PROGRESS BAR ── */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-white/40">Level {currentLevel} · {badge}</span>
            <span className="text-xs text-white/40">{currentXp} / {xpForNextLevel} XP</span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* ── 5. POINTS ROW ── */}
        <div className="grid grid-cols-3 gap-0 mb-5">
          <div className="text-center py-2 border-l-2 border-white/20">
            <p className="text-xl font-bold text-white"><CountUp end={profile.creator_points || 0} /></p>
            <p className="text-[10px] uppercase tracking-wider text-white/30">Creator</p>
          </div>
          <div className="text-center py-2 border-l-2 border-white/20">
            <p className="text-xl font-bold text-white"><CountUp end={profile.helper_points || 0} /></p>
            <p className="text-[10px] uppercase tracking-wider text-white/30">Helper</p>
          </div>
          <div className="text-center py-2 border-l-2 border-white/20">
            <p className="text-xl font-bold text-white"><CountUp end={profile.knowledge_points || 0} /></p>
            <p className="text-[10px] uppercase tracking-wider text-white/30">Knowledge</p>
          </div>
        </div>

        {/* ── 6. SKILL DISTRIBUTION ── */}
        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-widest text-white/30 mb-3">Skill Distribution</h3>
          <SkillRadarChart skillPoints={profile.skill_points} />
        </div>

        {/* ── 8. TABS ── */}
        <div className="flex border-b border-white/10 mb-0">
          <button
            className={`flex-1 pb-3 text-sm font-semibold text-center transition-colors ${activeTab === 'reels' ? 'text-white border-b-2 border-white' : 'text-white/30'}`}
            onClick={() => setActiveTab('reels')}
          >
            Reels
          </button>
          {isOwnProfile && (
            <button
              className={`flex-1 pb-3 text-sm font-semibold text-center transition-colors ${activeTab === 'saved' ? 'text-white border-b-2 border-white' : 'text-white/30'}`}
              onClick={() => setActiveTab('saved')}
            >
              Saved
            </button>
          )}
          <button
            className={`flex-1 pb-3 text-sm font-semibold text-center transition-colors ${activeTab === 'reposts' ? 'text-white border-b-2 border-white' : 'text-white/30'}`}
            onClick={() => setActiveTab('reposts')}
          >
            Reposts
          </button>
        </div>

        {/* ── 7. REELS GRID ── */}
        {gridReels.length === 0 ? (
          <div className="text-center py-16 text-white/20 text-sm">
            {activeTab === 'reels' ? 'No reels yet.' : activeTab === 'saved' ? 'No saved reels.' : 'No reposts yet.'}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5 mt-0.5">
            {gridReels.map(reel => (
              <div
                key={reel.id}
                className="aspect-square overflow-hidden relative group cursor-pointer"
                onClick={() => navigate(`/reel/${activeTab === 'reposts' ? (reel.original_reel_id || reel.id) : reel.id}`)}
              >
                {reel.thumbnail_url ? (
                  <img src={reel.thumbnail_url} alt={reel.title} className="w-full h-full object-cover group-hover:brightness-75 transition-all duration-200" />
                ) : (
                  <video src={reel.video_url} className="w-full h-full object-cover group-hover:brightness-75 transition-all duration-200" />
                )}

                {/* Repost badge */}
                {activeTab === 'reposts' && (
                  <div className="absolute top-1.5 right-1.5 bg-black/60 rounded-full p-1 backdrop-blur-md">
                    <Repeat2 className="w-3 h-3 text-white" />
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                  <p className="text-[11px] text-white text-center px-2 line-clamp-2">{reel.title}</p>
                  {isOwnProfile && activeTab === 'reels' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePinReel(reel.id); }}
                      className={`text-[10px] flex items-center gap-0.5 px-2 py-0.5 rounded-full ${profile.pinned_reel_id === reel.id ? 'bg-white/30 text-white' : 'bg-white/10 text-white/60 hover:text-white'}`}
                    >
                      <Pin className="w-3 h-3" /> {profile.pinned_reel_id === reel.id ? 'Unpin' : 'Pin'}
                    </button>
                  )}
                  {isOwnProfile && activeTab === 'reposts' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmRemoveRepostId(reel.id); }}
                      className="text-[10px] flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-red-500/30 text-red-400 hover:bg-red-500/50"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Remove Repost Dialog */}
      <AnimatePresence>
        {confirmRemoveRepostId && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setConfirmRemoveRepostId(null)}
          >
            <motion.div
              className="bg-[#1A1A1A] rounded-2xl p-6 w-[90%] max-w-sm border border-white/10 shadow-xl"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-white font-semibold text-base mb-2">Remove this repost?</h3>
              <p className="text-white/40 text-sm mb-5">The original reel won't be affected.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmRemoveRepostId(null)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRemoveRepost(confirmRemoveRepostId)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-500/80 transition-colors"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
