import { useEffect, useRef, useState, useCallback } from 'react';
import { Heart, Share2, Bookmark, MessageCircle, Reply, CheckCircle, Play, Pause, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { getDifficultyBg, getCategoryColor, calculateWatchPoints } from '@/utils/pointsEngine';
import { timeAgo } from '@/utils/timeAgo';
import PointsToast from './PointsToast';
import CommentSection from './CommentSection';
import UploadModal from './UploadModal';
import ShareMenu from './ShareMenu';
import { Link } from 'react-router-dom';
import ClickSpark from './effects/ClickSpark';
import GlitchText from './effects/GlitchText';
import ShinyText from './effects/ShinyText';
import { Shield } from 'lucide-react';

interface ReelCardProps {
  reel: any;
  uploaderProfile?: any;
}

export default function ReelCard({ reel, uploaderProfile }: ReelCardProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(reel.likes_count);
  const [showComments, setShowComments] = useState(false);
  const [showReplyUpload, setShowReplyUpload] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [pointsToast, setPointsToast] = useState({ show: false, points: 0 });
  const [heartAnim, setHeartAnim] = useState(false);
  const [doubleTapHeart, setDoubleTapHeart] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [looping, setLooping] = useState(true);
  const watchTracked = useRef(false);
  const lastTap = useRef(0);

  useEffect(() => {
    if (!user) return;
    supabase.from('reel_likes').select('id').eq('reel_id', reel.id).eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setLiked(!!data));
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
            video.play().catch(() => {});
            setIsPlaying(true);
          } else {
            video.pause();
            setIsPlaying(false);
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
            reel_id: reel.id, user_id: user.id, watch_percent: percent, points_awarded: points,
          }, { onConflict: 'reel_id,user_id' });
          setPointsToast({ show: true, points });
        }
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [user, reel.id]);

  const handleLike = async () => {
    if (!user) return;
    if (liked) {
      await supabase.from('reel_likes').delete().eq('reel_id', reel.id).eq('user_id', user.id);
      setLiked(false);
      setLikesCount((c: number) => c - 1);
    } else {
      await supabase.from('reel_likes').insert({ reel_id: reel.id, user_id: user.id });
      setLiked(true);
      setLikesCount((c: number) => c + 1);
      setHeartAnim(true);
      setTimeout(() => setHeartAnim(false), 600);
      setPointsToast({ show: true, points: 2 });
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!liked) handleLike();
      setDoubleTapHeart(true);
      setTimeout(() => setDoubleTapHeart(false), 800);
    }
    lastTap.current = now;
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

  const togglePlay = () => {
    const v = videoRef.current;
    if (v) {
      v.paused ? v.play() : v.pause();
      setIsPlaying(!v.paused);
    }
  };

  const cycleSpeed = () => {
    const speeds = [0.5, 1, 1.5, 2];
    const next = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
    setPlaybackRate(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
  };

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
        className="relative w-full h-[calc(100vh-4rem)] snap-start flex items-center justify-center bg-background"
      >
        <video
          ref={videoRef}
          src={reel.video_url}
          loop={looping}
          muted
          playsInline
          className="w-full h-full object-cover md:object-contain md:max-w-lg rounded-none md:rounded-2xl cursor-pointer"
          onClick={handleDoubleTap}
        />

        {/* Double-tap heart */}
        <AnimatePresence>
          {doubleTapHeart && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
            >
              <Heart className="w-24 h-24 fill-destructive text-destructive drop-shadow-2xl" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Speed + Loop controls */}
        <div className="absolute top-4 right-4 flex items-center gap-2 md:right-[calc(50%-13rem)]">
          <button onClick={cycleSpeed} className="glass-strong px-2 py-1 rounded-full text-[10px] font-mono text-foreground btn-press">
            {playbackRate}x
          </button>
          <button onClick={() => { setLooping(!looping); if (videoRef.current) videoRef.current.loop = !looping; }} className={`glass-strong px-2 py-1 rounded-full text-[10px] font-mono btn-press ${looping ? 'text-primary' : 'text-muted-foreground'}`}>
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        {/* Overlay info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/90 via-background/40 to-transparent md:max-w-lg md:mx-auto md:rounded-b-2xl">
          <div className="flex gap-2 mb-2 items-center flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${getCategoryColor(reel.category)}`}>
              {reel.category}
            </span>
            <DifficultyLabel />
            {reel.is_best_solution && (
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-success" />
                <ShinyText text="Verified Solution" className="text-[10px] font-mono font-semibold" />
              </span>
            )}
            <span className="text-[10px] text-muted-foreground ml-auto">👁 {reel.total_views}</span>
          </div>

          <h3 className="font-semibold text-foreground text-sm mb-1">{reel.title}</h3>

          {uploaderProfile && (
            <Link to={`/profile/${reel.uploaded_by}`} className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground overflow-hidden">
                {uploaderProfile.avatar ? (
                  <img src={uploaderProfile.avatar} className="w-full h-full object-cover" />
                ) : (
                  uploaderProfile.name?.charAt(0)?.toUpperCase() || 'U'
                )}
              </div>
              <span className="text-xs text-muted-foreground">{uploaderProfile.name}</span>
              {uploaderProfile.is_verified_creator && <Shield className="w-3 h-3 text-primary" />}
              <span className="text-[10px] font-mono text-primary">Lv.{uploaderProfile.level}</span>
              <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo(reel.created_at)}</span>
            </Link>
          )}
        </div>

        {/* Right side actions */}
        <div className="absolute right-3 bottom-32 flex flex-col items-center gap-4 md:right-[calc(50%-14rem)]">
          <ClickSpark color="hsl(217, 91%, 60%)">
            <button onClick={handleLike} className="flex flex-col items-center gap-1 btn-press">
              <motion.div animate={heartAnim ? { scale: [1, 1.4, 1] } : {}} transition={{ duration: 0.3 }}>
                <Heart className={`w-7 h-7 ${liked ? 'fill-destructive text-destructive' : 'text-foreground'}`} />
              </motion.div>
              <span className="text-xs text-foreground font-medium">{likesCount}</span>
            </button>
          </ClickSpark>

          <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1 btn-press">
            <MessageCircle className="w-7 h-7 text-foreground" />
            <span className="text-xs text-foreground font-medium">Chat</span>
          </button>

          <button onClick={() => setShowShare(true)} className="flex flex-col items-center gap-1 btn-press">
            <Share2 className="w-7 h-7 text-foreground" />
            <span className="text-xs text-foreground font-medium">{reel.shares_count}</span>
          </button>

          <button onClick={handleSave} className="flex flex-col items-center gap-1 btn-press">
            <Bookmark className={`w-7 h-7 ${saved ? 'fill-primary text-primary' : 'text-foreground'}`} />
            <span className="text-xs text-foreground font-medium">Save</span>
          </button>

          <button onClick={() => setShowReplyUpload(true)} className="flex flex-col items-center gap-1 btn-press">
            <Reply className="w-7 h-7 text-foreground" />
            <span className="text-xs text-foreground font-medium">Reply</span>
          </button>
        </div>
      </div>

      <PointsToast points={pointsToast.points} show={pointsToast.show} onDone={() => setPointsToast({ show: false, points: 0 })} />
      <CommentSection reelId={reel.id} open={showComments} onOpenChange={setShowComments} />
      <UploadModal open={showReplyUpload} onOpenChange={setShowReplyUpload} parentReelId={reel.id} />
      <ShareMenu reelId={reel.id} open={showShare} onOpenChange={setShowShare} sharesCount={reel.shares_count} />
    </>
  );
}
