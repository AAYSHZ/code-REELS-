import { useEffect, useRef, useState, useCallback } from 'react';
import { Heart, Share2, Bookmark, MessageCircle, Reply, CheckCircle, Repeat2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { getDifficultyBg, getCategoryColor, calculateWatchPoints, getCategorySkillKey, calculateCoins, calculateLevel, calculateTotalScore } from '@/utils/pointsEngine';
import PointsToast from './PointsToast';
import { toast } from 'sonner';
import CommentSection from './CommentSection';
import UploadModal from './UploadModal';
import { Link } from 'react-router-dom';
import ReelOptionsMenu from './ReelOptionsMenu';
import ReelRepostMenu from './ReelRepostMenu';
import ClickSpark from './effects/ClickSpark';
import GlitchText from './effects/GlitchText';
import ShinyText from './effects/ShinyText';

interface ReelCardProps {
  reel: any;
  uploaderProfile?: any;
  onDeleted?: () => void;
}

export default function ReelCard({ reel, uploaderProfile, onDeleted }: ReelCardProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [liked, setLiked] = useState(() => reel.liked_by?.includes(user?.id) || false);
  const [likesCount, setLikesCount] = useState(reel.likes_count);
  const [saved, setSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showReplyUpload, setShowReplyUpload] = useState(false);
  const [showRepostMenu, setShowRepostMenu] = useState(false);
  const [pointsToast, setPointsToast] = useState({ show: false, points: 0 });
  const [heartAnim, setHeartAnim] = useState(false);
  const watchTracked = useRef(false);

  useEffect(() => {
    if (!user || !reel.id) return;

    const checkLike = async () => {
      try {
        const { data, error } = await supabase
          .from('reel_likes')
          .select('id')
          .eq('reel_id', reel.id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) console.error("Error checking like:", error);
        setLiked(!!data);
      } catch (err) {
        console.error("checkLike catch error:", err);
      }
    };

    checkLike();

    const channel = supabase
      .channel(`likes-${reel.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'reel_likes', filter: `reel_id=eq.${reel.id}` },
        () => { checkLike(); }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to likes changes for ${reel.id}`);
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [user, reel.id]);

  useEffect(() => {
    if (!user) return;
    // We already derive liked from reel.liked_by, so we don't query reel_likes here.
    supabase.from('reel_saves').select('id').eq('reel_id', reel.id).eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setSaved(!!data));
  }, [user, reel.id]);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            video.play().catch(() => { });
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.6 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !user) return;

    const handleTimeUpdate = async () => {
      if (video.duration === 0 || watchTracked.current) return;
      const percent = (video.currentTime / video.duration) * 100;
      if (percent >= 50) {
        watchTracked.current = true;
        const points = calculateWatchPoints(percent);
        if (points > 0) {
          await supabase.from('watch_history').upsert({
            reel_id: reel.id,
            user_id: user.id,
            watch_percent: percent,
            points_awarded: points,
          }, { onConflict: 'reel_id,user_id' });
          setPointsToast({ show: true, points });
        }
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [user, reel.id]);

  const handleLike = async () => {
    if (!user) {
      toast.error("You must be logged in to like.");
      return;
    }

    try {
      const isCurrentlyLiked = liked; // optimism base

      if (isCurrentlyLiked) {
        // ── UNLIKE ──────────────────────────────────
        // Optimistic UI update
        setLiked(false);
        setLikesCount((c: number) => Math.max(0, c - 1));

        const { error: unlikeErr } = await supabase
          .from('reel_likes')
          .delete()
          .eq('reel_id', reel.id)
          .eq('user_id', user.id);

        if (unlikeErr) {
          console.error("Unlike error:", unlikeErr);
          // Rollback
          setLiked(true);
          setLikesCount((c: number) => c + 1);
          return;
        }

        const { error: decErr } = await supabase
          .from('reels')
          .update({ likes_count: Math.max(0, likesCount - 1) })
          .eq('id', reel.id);

        if (decErr) console.error("Error decrementing likes:", decErr);

        // Reverse creator_points and skill_points on reel owner (if not self)
        if (reel.uploaded_by !== user.id) {
          const { data: ownerProfile, error: profileErr } = await supabase
            .from('profiles')
            .select('creator_points, skill_points, xp, coins, reputation_score, level, total_score')
            .eq('user_id', reel.uploaded_by)
            .single();

          if (profileErr) console.error("Error fetching owner profile on unlike:", profileErr);

          if (ownerProfile) {
            const skillKey = getCategorySkillKey(reel.category);
            const currentSkills = (ownerProfile.skill_points as any) || {};
            const updatedXp = Math.max(0, (ownerProfile.xp ?? 0) - 2);
            const updatedCoins = calculateCoins(updatedXp);
            const updatedLevel = calculateLevel(updatedXp);
            const updatedTotalScore = calculateTotalScore(updatedXp, ownerProfile.reputation_score ?? 0, updatedCoins);

            const { error: updateProfErr } = await supabase
              .from('profiles')
              .update({
                creator_points: Math.max(0, (ownerProfile.creator_points ?? 0) - 2),
                skill_points: {
                  ...currentSkills,
                  [skillKey]: Math.max(0, (currentSkills[skillKey] ?? 0) - 2),
                },
                xp: updatedXp,
                coins: updatedCoins,
                level: updatedLevel,
                total_score: updatedTotalScore,
              })
              .eq('user_id', reel.uploaded_by);
            if (updateProfErr) console.error("Error updating owner profile on unlike:", updateProfErr);
          }
        }
      } else {
        // ── LIKE ────────────────────────────────────
        // Optimistic UI update
        setLiked(true);
        setLikesCount((c: number) => c + 1);
        setHeartAnim(true);
        setTimeout(() => setHeartAnim(false), 600);

        // Bottom right toast
        toast.success("+2 XP", { position: 'bottom-right' });

        const { error: likeErr } = await supabase
          .from('reel_likes')
          .insert({ reel_id: reel.id, user_id: user.id });

        if (likeErr) {
          console.error("Like error:", likeErr);
          // Rollback
          setLiked(false);
          setLikesCount((c: number) => Math.max(0, c - 1));
          return;
        }

        const { error: incErr } = await supabase
          .from('reels')
          .update({ likes_count: likesCount + 1 })
          .eq('id', reel.id);

        if (incErr) console.error("Error incrementing likes:", incErr);

        // Award creator_points and skill_points to reel owner (if not self)
        if (reel.uploaded_by !== user.id) {
          const { data: ownerProfile, error: profileErr } = await supabase
            .from('profiles')
            .select('creator_points, skill_points, xp, coins, reputation_score, level, total_score, name, username')
            .eq('user_id', reel.uploaded_by)
            .single();

          if (profileErr) console.error("Error fetching owner profile on like:", profileErr);

          if (ownerProfile) {
            const skillKey = getCategorySkillKey(reel.category);
            const currentSkills = (ownerProfile.skill_points as any) || {};
            const updatedXp = (ownerProfile.xp ?? 0) + 2;
            const updatedCoins = calculateCoins(updatedXp);
            const updatedLevel = calculateLevel(updatedXp);
            const updatedTotalScore = calculateTotalScore(updatedXp, ownerProfile.reputation_score ?? 0, updatedCoins);

            const { error: updateProfErr } = await supabase
              .from('profiles')
              .update({
                creator_points: (ownerProfile.creator_points ?? 0) + 2,
                skill_points: {
                  ...currentSkills,
                  [skillKey]: (currentSkills[skillKey] ?? 0) + 2,
                },
                xp: updatedXp,
                coins: updatedCoins,
                level: updatedLevel,
                total_score: updatedTotalScore,
              })
              .eq('user_id', reel.uploaded_by);
            if (updateProfErr) console.error("Error updating owner profile on like:", updateProfErr);
          }

          // Insert like notification
          try {
            const { data: likerProfile } = await supabase
              .from('profiles')
              .select('name, username')
              .eq('user_id', user.id)
              .single();

            const likerName = likerProfile?.name || likerProfile?.username || 'Someone';
            await supabase.from('notifications').insert({
              user_id: reel.uploaded_by,
              type: 'like',
              message: `${likerName} liked your reel: ${reel.title}`,
              related_reel_id: reel.id,
              is_read: false,
            });
          } catch (notifErr) {
            console.error("Failed to insert like notification:", notifErr);
          }
        }
      }
    } catch (err) {
      console.error("handleLike root exception:", err);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (saved) {
      await supabase.from('reel_saves').delete().eq('reel_id', reel.id).eq('user_id', user.id);
      setSaved(false);
    } else {
      await supabase.from('reel_saves').insert({ reel_id: reel.id, user_id: user.id });
      setSaved(true);
    }
  };

  const handleShare = async () => {
    await supabase.from('reels').update({ shares_count: reel.shares_count + 1 }).eq('id', reel.id);
    navigator.clipboard.writeText(`${window.location.origin}/reel/${reel.id}`);
    setPointsToast({ show: true, points: 4 });
  };

  // Difficulty label component
  const DifficultyLabel = () => {
    if (reel.difficulty === 'Hard') {
      return <GlitchText text="HARD" className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${getDifficultyBg(reel.difficulty)}`} />;
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${getDifficultyBg(reel.difficulty)}`}>
        {reel.difficulty}
      </span>
    );
  };

  return (
    <>
      <div
        ref={containerRef}
        className="relative w-full h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] snap-start flex items-center justify-center bg-background"
      >
        <video
          ref={videoRef}
          src={reel.video_url}
          loop
          muted
          playsInline
          className="w-full h-full object-cover md:object-contain md:max-w-lg rounded-none md:rounded-2xl"
          onClick={() => {
            const v = videoRef.current;
            if (v) v.paused ? v.play() : v.pause();
          }}
        />

        {/* Options menu (three-dot) */}
        <ReelOptionsMenu
          reelId={reel.id}
          reelOwnerId={reel.uploaded_by}
          videoUrl={reel.video_url}
          thumbnailUrl={reel.thumbnail_url || ''}
          onDeleted={onDeleted || (() => { })}
        />

        {/* Overlay info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/90 to-transparent md:max-w-lg md:mx-auto md:rounded-b-2xl">
          <div className="flex gap-2 mb-2 items-center">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${getCategoryColor(reel.category)}`}>
              {reel.category}
            </span>
            <DifficultyLabel />
            {reel.is_best_solution && (
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-secondary" />
                <ShinyText text="Verified Solution" className="text-[10px] font-mono font-semibold" />
              </span>
            )}
          </div>

          <h3 className="font-semibold text-foreground text-sm mb-1">{reel.title}</h3>

          {uploaderProfile && (
            <Link to={`/profile/${reel.uploaded_by}`} className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-[10px] font-bold text-foreground">
                {uploaderProfile.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="text-xs text-muted-foreground">{uploaderProfile.name}</span>
              <span className="text-[10px] font-mono text-primary">Lv.{uploaderProfile.level}</span>
            </Link>
          )}
        </div>

        {/* Right side actions */}
        <div className="absolute right-3 bottom-32 flex flex-col items-center gap-4 md:right-[calc(50%-14rem)]">
          <ClickSpark color="#ff4757">
            <button onClick={handleLike} className="flex flex-col items-center gap-1">
              <motion.div animate={heartAnim ? { scale: [1, 1.4, 1] } : {}} transition={{ duration: 0.3 }}>
                <Heart className={`w-7 h-7 ${liked ? 'fill-destructive text-destructive' : 'text-foreground'}`} />
              </motion.div>
              <span className="text-xs text-foreground font-medium">{likesCount}</span>
            </button>
          </ClickSpark>

          <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1">
            <MessageCircle className="w-7 h-7 text-foreground" />
            <span className="text-xs text-foreground font-medium">Chat</span>
          </button>

          <button onClick={() => setShowRepostMenu(true)} className="flex flex-col items-center gap-1">
            <Repeat2 className="w-7 h-7 text-foreground" />
            <span className="text-xs text-foreground font-medium">Repost</span>
          </button>

          <button onClick={handleShare} className="flex flex-col items-center gap-1">
            <Share2 className="w-7 h-7 text-foreground" />
            <span className="text-xs text-foreground font-medium">{reel.shares_count}</span>
          </button>

          <button onClick={handleSave} className="flex flex-col items-center gap-1">
            <Bookmark className={`w-7 h-7 ${saved ? 'fill-primary text-primary' : 'text-foreground'}`} />
            <span className="text-xs text-foreground font-medium">Save</span>
          </button>

          <button onClick={() => setShowReplyUpload(true)} className="flex flex-col items-center gap-1">
            <Reply className="w-7 h-7 text-foreground" />
            <span className="text-xs text-foreground font-medium">Reply</span>
          </button>
        </div>
      </div>

      <PointsToast points={pointsToast.points} show={pointsToast.show} onDone={() => setPointsToast({ show: false, points: 0 })} />
      <CommentSection reelId={reel.id} open={showComments} onOpenChange={setShowComments} />
      <UploadModal open={showReplyUpload} onOpenChange={setShowReplyUpload} parentReelId={reel.id} />
      <ReelRepostMenu open={showRepostMenu} onOpenChange={setShowRepostMenu} reel={reel} onRepostSuccess={() => setPointsToast({ show: true, points: 4 })} />
    </>
  );
}
