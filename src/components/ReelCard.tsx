import { useEffect, useRef, useState } from 'react';
import { Heart, Share2, Bookmark, MessageCircle, Reply, CheckCircle, Repeat2, VolumeX, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
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
  const [isMuted, setIsMuted] = useState(true);
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
          <div className="bg-[#1A1A1A] border-l-4 border-[#6C63FF] rounded-lg p-3 flex flex-col gap-0.5 shadow-xl min-w-[200px]">
            <span className="text-lg font-bold text-[#6C63FF]">+2 XP</span>
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

  return (
    <>
      <div
        ref={containerRef}
        className="relative w-full h-[100dvh] snap-start flex items-center justify-center max-w-[420px] mx-auto sm:rounded-2xl sm:shadow-2xl sm:shadow-black/50 overflow-hidden bg-black"
      >
        <video
          ref={videoRef}
          src={reel.video_url}
          loop
          muted={isMuted}
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          onClick={() => {
            const v = videoRef.current;
            if (v) v.paused ? v.play() : v.pause();
          }}
        />

        {/* Gradients */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

        {/* Options menu (three-dot) */}
        <ReelOptionsMenu
          reelId={reel.id}
          reelOwnerId={reel.uploaded_by}
          videoUrl={reel.video_url}
          thumbnailUrl={reel.thumbnail_url || ''}
          onDeleted={onDeleted || (() => { })}
        />

        {/* SOUND INDICATOR */}
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="absolute top-4 right-4 bg-black/40 backdrop-blur-md rounded-full p-2 text-white hover:bg-black/60 transition-colors z-20"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        {/* OVERLAY INFO (Bottom) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 z-10 w-full pr-16 border-t border-transparent">
          {uploaderProfile && (
            <div className="flex items-center gap-2 mb-2">
              <Link to={`/profile/${reel.uploaded_by}`} className="flex items-center gap-2">
                <div className="w-[36px] h-[36px] rounded-full bg-[#6C63FF] flex items-center justify-center text-sm font-bold text-white">
                  {uploaderProfile.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="font-semibold text-white drop-shadow-md">{uploaderProfile.name}</span>
              </Link>
              <span className="bg-[#6C63FF]/20 border border-[#6C63FF]/40 text-[#6C63FF] text-xs px-2 py-0.5 rounded-full ml-1 backdrop-blur-sm">
                Lv.{uploaderProfile.level || 1}
              </span>
            </div>
          )}

          <h3 className="text-white font-semibold text-base mt-1 drop-shadow-md leading-snug">{reel.title}</h3>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold backdrop-blur-sm ${
              reel.category === 'DSA' ? 'bg-[#6C63FF]/15 border border-[#6C63FF]/30 text-[#6C63FF]' :
              reel.category === 'Web Dev' ? 'bg-[#00D4AA]/15 border border-[#00D4AA]/30 text-[#00D4AA]' :
              reel.category === 'AI-ML' ? 'bg-[#FFA502]/15 border border-[#FFA502]/30 text-[#FFA502]' :
              reel.category === 'Hardware' ? 'bg-[#FF4757]/15 border border-[#FF4757]/30 text-[#FF4757]' :
              'bg-white/8 border border-white/15 text-white/60'
            }`}>
              {reel.category}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold backdrop-blur-sm ${
              reel.difficulty === 'Easy' ? 'bg-[#2ED573]/15 border border-[#2ED573]/30 text-[#2ED573]' :
              reel.difficulty === 'Medium' ? 'bg-[#FFA502]/15 border border-[#FFA502]/30 text-[#FFA502]' :
              reel.difficulty === 'Hard' ? 'bg-[#FF4757]/15 border border-[#FF4757]/30 text-[#FF4757]' :
              'bg-white/8 border border-white/15 text-white/60'
            }`}>
              {reel.difficulty}
            </span>
            {reel.is_best_solution && (
              <span className="flex items-center gap-1 ml-1 backdrop-blur-sm bg-black/20 px-2 py-0.5 rounded-full">
                <CheckCircle className="w-3 h-3 text-[#00D4AA]" />
                <span className="text-[10px] font-mono font-semibold text-[#00D4AA]">Verified Solution</span>
              </span>
            )}
          </div>
        </div>

        {/* Right side actions */}
        <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-20">
          <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
            <motion.div animate={heartAnim ? { scale: [1, 1.4, 1] } : {}} transition={{ duration: 0.3 }}>
              <Heart className={`w-[26px] h-[26px] transition-transform group-hover:scale-110 drop-shadow-md ${liked ? 'fill-[#FF4757] text-[#FF4757]' : 'text-white'}`} />
            </motion.div>
            <span className="text-xs text-white/90 font-medium drop-shadow-md">{likesCount}</span>
          </button>

          <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1 group">
            <MessageCircle className="w-[26px] h-[26px] text-white transition-transform group-hover:scale-110 drop-shadow-md" />
            <span className="text-xs text-white/90 font-medium drop-shadow-md">Chat</span>
          </button>

          <button onClick={() => setShowRepostMenu(true)} className="flex flex-col items-center gap-1 group">
            <Repeat2 className="w-[26px] h-[26px] text-white transition-transform group-hover:scale-110 drop-shadow-md" />
            <span className="text-xs text-white/90 font-medium drop-shadow-md">Repost</span>
          </button>

          <button onClick={handleShare} className="flex flex-col items-center gap-1 group">
            <Share2 className="w-[26px] h-[26px] text-white transition-transform group-hover:scale-110 drop-shadow-md" />
            <span className="text-xs text-white/90 font-medium drop-shadow-md">{reel.shares_count}</span>
          </button>

          <button onClick={handleSave} className="flex flex-col items-center gap-1 group">
            <Bookmark className={`w-[26px] h-[26px] transition-transform group-hover:scale-110 drop-shadow-md ${saved ? 'fill-[#6C63FF] text-[#6C63FF]' : 'text-white'}`} />
            <span className="text-xs text-white/90 font-medium drop-shadow-md">Save</span>
          </button>

          <button onClick={() => setShowReplyUpload(true)} className="flex flex-col items-center gap-1 group">
            <Reply className="w-[26px] h-[26px] text-white transition-transform group-hover:scale-110 drop-shadow-md" />
            <span className="text-xs text-white/90 font-medium drop-shadow-md">Reply</span>
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
