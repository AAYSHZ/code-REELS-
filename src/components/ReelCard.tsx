import { useEffect, useRef, useState, useCallback } from 'react';
import { Heart, Share2, Bookmark, MessageCircle, Reply, CheckCircle, Repeat2, VolumeX, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { calculateWatchPoints } from '@/utils/pointsEngine';
import PointsToast from './PointsToast';
import { toast } from 'sonner';
import CommentSection from './CommentSection';
import UploadModal from './UploadModal';
import { Link } from 'react-router-dom';
import ReelOptionsMenu from './ReelOptionsMenu';
import ReelRepostMenu from './ReelRepostMenu';
import ShareReelModal from './ShareReelModal';

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
  const [showShareModal, setShowShareModal] = useState(false);
  const [pointsToast, setPointsToast] = useState({ show: false, points: 0 });
  const [heartAnim, setHeartAnim] = useState(false);
  const [showBigHeart, setShowBigHeart] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const watchTracked = useRef(false);
  const lastTapRef = useRef(0);

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
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, reel.id]);

  useEffect(() => {
    if (!user) return;
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
      const isCurrentlyLiked = liked; 

      if (isCurrentlyLiked) {
        setLiked(false);
        setLikesCount((c: number) => Math.max(0, c - 1));

        const { error: unlikeErr } = await supabase
          .from('reel_likes')
          .delete()
          .eq('reel_id', reel.id)
          .eq('user_id', user.id);

        if (unlikeErr) {
          setLiked(true);
          setLikesCount((c: number) => c + 1);
          return;
        }

        await supabase.from('reels').update({ likes_count: Math.max(0, likesCount - 1) }).eq('id', reel.id);

        if (reel.uploaded_by !== user.id) {
          await supabase.rpc('award_xp', { target_user_id: reel.uploaded_by, xp_amount: -2, points_type: 'creator' });
        }
      } else {
        setLiked(true);
        setLikesCount((c: number) => c + 1);
        setHeartAnim(true);
        setTimeout(() => setHeartAnim(false), 600);

        toast.custom((t) => (
          <div className="bg-[#1A1A1A] border-l-4 border-white rounded-lg p-3 flex flex-col gap-0.5 shadow-xl min-w-[200px]">
            <span className="text-lg font-bold text-white">+2 XP</span>
            <span className="text-xs text-gray-400">Creator Points</span>
          </div>
        ), { position: 'bottom-right', duration: 2000 });

        const { error: likeErr } = await supabase.from('reel_likes').insert({ reel_id: reel.id, user_id: user.id });

        if (likeErr) {
          setLiked(false);
          setLikesCount((c: number) => Math.max(0, c - 1));
          return;
        }

        await supabase.from('reels').update({ likes_count: likesCount + 1 }).eq('id', reel.id);

        if (reel.uploaded_by !== user.id) {
          await supabase.rpc('award_xp', { target_user_id: reel.uploaded_by, xp_amount: 2, points_type: 'creator' });

          try {
            const { data: likerProfile } = await supabase.from('profiles').select('name, username').eq('user_id', user.id).single();
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
      await supabase.rpc('award_xp', { target_user_id: reel.uploaded_by, xp_amount: 3, points_type: 'creator' });
    }
  };

  const handleShare = () => setShowShareModal(true);

  // Double-tap to like
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap detected
      if (!liked) {
        handleLike();
      }
      setShowBigHeart(true);
      setTimeout(() => setShowBigHeart(false), 800);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      // Single tap — toggle play/pause after a short delay
      setTimeout(() => {
        if (Date.now() - now >= 300 && lastTapRef.current === now) {
          const v = videoRef.current;
          if (v) v.paused ? v.play() : v.pause();
        }
      }, 310);
    }
  }, [liked]);

  return (
    <>
      <div
        ref={containerRef}
        className="relative w-full h-[100dvh] flex-shrink-0 snap-start snap-always overflow-hidden bg-black sm:max-w-[420px] sm:mx-auto sm:h-[calc(100vh-2rem)] sm:my-4 sm:rounded-2xl"
      >
        <video
          ref={videoRef}
          src={reel.video_url}
          loop
          muted={isMuted}
          playsInline
          className="absolute inset-0 w-full h-full object-cover rounded-none sm:rounded-2xl"
          onClick={handleDoubleTap}
        />

        {/* Bottom gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 30%, transparent 60%)' }}
        />

        {/* Double-tap heart animation */}
        <AnimatePresence>
          {showBigHeart && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1.3 }}
              exit={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <Heart className="w-24 h-24 text-white fill-white drop-shadow-2xl" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Options menu (three-dot) */}
        <ReelOptionsMenu
          reelId={reel.id}
          reelOwnerId={reel.uploaded_by}
          videoUrl={reel.video_url}
          thumbnailUrl={reel.thumbnail_url || ''}
          onDeleted={onDeleted || (() => { })}
        />

        {/* MUTE BUTTON */}
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm rounded-full p-2 text-white hover:bg-black/50 transition-colors z-20"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        {/* BOTTOM INFO OVERLAY */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-20 sm:pb-6 z-10 w-full pr-16">
          {uploaderProfile && (
            <div className="flex items-center gap-2 mb-2">
              <Link to={`/profile/${reel.uploaded_by}`} className="flex items-center gap-2">
                <div className="w-[36px] h-[36px] rounded-full bg-white flex items-center justify-center text-sm font-bold text-black flex-shrink-0">
                  {uploaderProfile.avatar ? (
                    <img src={uploaderProfile.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    uploaderProfile.name?.charAt(0)?.toUpperCase() || 'U'
                  )}
                </div>
                <span className="font-semibold text-white text-sm drop-shadow-lg">{uploaderProfile.name}</span>
              </Link>
              <span className="bg-white/8 border border-white/15 text-white/70 text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                Lv.{uploaderProfile.level || 1}
              </span>
            </div>
          )}

          <h3 className="text-white font-bold text-base mt-1 drop-shadow-lg leading-snug">{reel.title}</h3>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold backdrop-blur-sm bg-white/8 border border-white/15 text-white/70">
              {reel.category}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold backdrop-blur-sm ${
              reel.difficulty === 'Easy' ? 'bg-white/8 border border-white/15 text-white/70' :
              reel.difficulty === 'Medium' ? 'bg-white/8 border border-[#FFA502]/30 text-[#FFA502]' :
              reel.difficulty === 'Hard' ? 'bg-white/8 border border-[#FF4757]/30 text-[#FF4757]' :
              'bg-white/8 border border-white/15 text-white/60'
            }`}>
              {reel.difficulty}
            </span>
            {reel.is_best_solution && (
              <span className="flex items-center gap-1 backdrop-blur-sm bg-black/20 px-2 py-0.5 rounded-full">
                <CheckCircle className="w-3 h-3 text-white" />
                <span className="text-[10px] font-mono font-semibold text-white">Verified</span>
              </span>
            )}
          </div>
        </div>

        {/* RIGHT ACTION BUTTONS — TikTok style */}
        <div className="absolute right-3 bottom-28 sm:bottom-24 flex flex-col items-center gap-5 z-20">
          <button onClick={handleLike} className="flex flex-col items-center gap-1">
            <motion.div animate={heartAnim ? { scale: [1, 1.4, 1] } : {}} transition={{ duration: 0.3 }}>
              <Heart className={`w-7 h-7 drop-shadow-lg ${liked ? 'fill-[#FF4757] text-[#FF4757]' : 'text-white'}`} />
            </motion.div>
            <span className="text-xs text-white/70 font-medium">{likesCount}</span>
          </button>

          <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1">
            <MessageCircle className="w-7 h-7 text-white drop-shadow-lg" />
            <span className="text-xs text-white/70 font-medium">Chat</span>
          </button>

          <button onClick={() => setShowRepostMenu(true)} className="flex flex-col items-center gap-1">
            <Repeat2 className="w-7 h-7 text-white drop-shadow-lg" />
            <span className="text-xs text-white/70 font-medium">Repost</span>
          </button>

          <button onClick={handleShare} className="flex flex-col items-center gap-1">
            <Share2 className="w-7 h-7 text-white drop-shadow-lg" />
            <span className="text-xs text-white/70 font-medium">{reel.shares_count}</span>
          </button>

          <button onClick={handleSave} className="flex flex-col items-center gap-1">
            <Bookmark className={`w-7 h-7 drop-shadow-lg ${saved ? 'fill-white text-white' : 'text-white'}`} />
            <span className="text-xs text-white/70 font-medium">Save</span>
          </button>

          <button onClick={() => setShowReplyUpload(true)} className="flex flex-col items-center gap-1">
            <Reply className="w-7 h-7 text-white drop-shadow-lg" />
            <span className="text-xs text-white/70 font-medium">Reply</span>
          </button>
        </div>
      </div>

      <PointsToast points={pointsToast.points} show={pointsToast.show} onDone={() => setPointsToast({ show: false, points: 0 })} />
      <CommentSection reelId={reel.id} reelOwnerId={reel.uploaded_by} open={showComments} onOpenChange={setShowComments} />
      <UploadModal open={showReplyUpload} onOpenChange={setShowReplyUpload} parentReelId={reel.id} />
      <ReelRepostMenu open={showRepostMenu} onOpenChange={setShowRepostMenu} reel={reel} onRepostSuccess={() => setPointsToast({ show: true, points: 4 })} />
      <ShareReelModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        reelId={reel.id}
        onShareComplete={async () => {
          await supabase.from('reels').update({ shares_count: reel.shares_count + 1 }).eq('id', reel.id);
          setPointsToast({ show: true, points: 4 });
        }}
      />
    </>
  );
}
