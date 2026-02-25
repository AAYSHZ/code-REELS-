import { useEffect, useRef, useState, useCallback } from 'react';
import { Heart, Share2, Bookmark, MessageCircle, Reply, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getDifficultyBg, getCategoryColor, calculateWatchPoints } from '@/utils/pointsEngine';
import PointsToast from './PointsToast';
import CommentSection from './CommentSection';
import UploadModal from './UploadModal';
import { Link } from 'react-router-dom';

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
  const [pointsToast, setPointsToast] = useState({ show: false, points: 0 });
  const [heartAnim, setHeartAnim] = useState(false);
  const watchTracked = useRef(false);

  // Check if user liked/saved
  useEffect(() => {
    if (!user) return;
    supabase.from('reel_likes').select('id').eq('reel_id', reel.id).eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setLiked(!!data));
    supabase.from('reel_saves').select('id').eq('reel_id', reel.id).eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setSaved(!!data));
  }, [user, reel.id]);

  // Auto-play with IntersectionObserver
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            video.play().catch(() => {});
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

  // Watch time tracking
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

  return (
    <>
      <div
        ref={containerRef}
        className="relative w-full h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] snap-start flex items-center justify-center bg-background"
      >
        {/* Video */}
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

        {/* Overlay info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/90 to-transparent md:max-w-lg md:mx-auto md:rounded-b-2xl">
          {/* Tags */}
          <div className="flex gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${getCategoryColor(reel.category)}`}>
              {reel.category}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${getDifficultyBg(reel.difficulty)}`}>
              {reel.difficulty}
            </span>
            {reel.is_best_solution && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-secondary/20 text-secondary border border-secondary/30 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Verified
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
          <button onClick={handleLike} className="flex flex-col items-center gap-1">
            <motion.div animate={heartAnim ? { scale: [1, 1.4, 1] } : {}} transition={{ duration: 0.3 }}>
              <Heart className={`w-7 h-7 ${liked ? 'fill-destructive text-destructive' : 'text-foreground'}`} />
            </motion.div>
            <span className="text-xs text-foreground font-medium">{likesCount}</span>
          </button>

          <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1">
            <MessageCircle className="w-7 h-7 text-foreground" />
            <span className="text-xs text-foreground font-medium">Chat</span>
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
    </>
  );
}
