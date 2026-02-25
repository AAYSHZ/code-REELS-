import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThumbsUp, ThumbsDown, Send, Pin, CornerDownRight, Flame, Lightbulb, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { timeAgo } from '@/utils/timeAgo';
import AnimatedList from './effects/AnimatedList';

interface CommentSectionProps {
  reelId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const REACTIONS = [
  { emoji: '🔥', key: 'fire' },
  { emoji: '🤯', key: 'mindblown' },
  { emoji: '💡', key: 'idea' },
];

export default function CommentSection({ reelId, open, onOpenChange }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [sort, setSort] = useState<'top' | 'newest'>('top');
  const [reactions, setReactions] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (!open) return;
    const fetchComments = async () => {
      const orderCol = sort === 'top' ? 'upvotes' : 'created_at';
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('reel_id', reelId)
        .is('parent_comment_id', null)
        .order(orderCol, { ascending: false });
      if (data) {
        setComments(data);
        const userIds = [...new Set(data.map(c => c.user_id))];
        if (userIds.length > 0) {
          const { data: profileData } = await supabase.from('profiles').select('*').in('user_id', userIds);
          if (profileData) {
            const map: Record<string, any> = {};
            profileData.forEach(p => map[p.user_id] = p);
            setProfiles(map);
          }
        }
        // Fetch reactions
        const commentIds = data.map(c => c.id);
        if (commentIds.length > 0) {
          const { data: rxns } = await supabase.from('comment_reactions').select('*').in('comment_id', commentIds);
          if (rxns) {
            const rMap: Record<string, any[]> = {};
            rxns.forEach(r => { if (!rMap[r.comment_id]) rMap[r.comment_id] = []; rMap[r.comment_id].push(r); });
            setReactions(rMap);
          }
        }
      }
    };
    fetchComments();
  }, [reelId, open, sort]);

  const handleSubmit = async () => {
    if (!user || !text.trim()) return;
    const { data } = await supabase.from('comments').insert({
      reel_id: reelId, user_id: user.id, text: text.trim(),
      parent_comment_id: replyTo || null,
    }).select().single();
    if (data) {
      setComments(prev => [data, ...prev]);
      setText('');
      setReplyTo(null);
    }
  };

  const handleVote = async (commentId: string, type: 'up' | 'down') => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    const update = type === 'up' ? { upvotes: comment.upvotes + 1 } : { downvotes: comment.downvotes + 1 };
    await supabase.from('comments').update(update).eq('id', commentId);
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, ...update } : c));
  };

  const handleReaction = async (commentId: string, reaction: string) => {
    if (!user) return;
    const existing = reactions[commentId]?.find(r => r.user_id === user.id && r.reaction === reaction);
    if (existing) {
      await supabase.from('comment_reactions').delete().eq('id', existing.id);
      setReactions(prev => ({ ...prev, [commentId]: prev[commentId]?.filter(r => r.id !== existing.id) || [] }));
    } else {
      const { data } = await supabase.from('comment_reactions').insert({ comment_id: commentId, user_id: user.id, reaction }).select().single();
      if (data) setReactions(prev => ({ ...prev, [commentId]: [...(prev[commentId] || []), data] }));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="glass-strong border-border w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-foreground flex items-center justify-between">
            Comments
            <div className="flex gap-1">
              <button onClick={() => setSort('top')} className={`text-[10px] px-2 py-0.5 rounded-full ${sort === 'top' ? 'gradient-primary text-primary-foreground' : 'text-muted-foreground'}`}>Top</button>
              <button onClick={() => setSort('newest')} className={`text-[10px] px-2 py-0.5 rounded-full ${sort === 'newest' ? 'gradient-primary text-primary-foreground' : 'text-muted-foreground'}`}>Newest</button>
            </div>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 mt-4 h-[calc(100vh-12rem)]">
          <AnimatedList>
            {comments.map(c => {
              const profile = profiles[c.user_id];
              const cReactions = reactions[c.id] || [];
              return (
                <div key={c.id} className="py-3 border-b border-border">
                  {c.is_pinned && (
                    <div className="flex items-center gap-1 mb-1 text-[10px] text-primary"><Pin className="w-3 h-3" /> Pinned</div>
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                      {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-xs font-medium text-foreground">{profile?.name || 'User'}</span>
                    <span className="text-[10px] font-mono text-primary">Lv.{profile?.level || 1}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground ml-8">{c.text}</p>
                  <div className="flex items-center gap-2 ml-8 mt-1.5 flex-wrap">
                    <button onClick={() => handleVote(c.id, 'up')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors btn-press">
                      <ThumbsUp className="w-3 h-3" /> {c.upvotes}
                    </button>
                    <button onClick={() => handleVote(c.id, 'down')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors btn-press">
                      <ThumbsDown className="w-3 h-3" /> {c.downvotes}
                    </button>
                    <button onClick={() => setReplyTo(c.id)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors btn-press">
                      <CornerDownRight className="w-3 h-3" /> Reply
                    </button>
                    <div className="flex items-center gap-1 ml-auto">
                      {REACTIONS.map(r => {
                        const count = cReactions.filter(rx => rx.reaction === r.key).length;
                        const hasReacted = cReactions.some(rx => rx.reaction === r.key && rx.user_id === user?.id);
                        return (
                          <button key={r.key} onClick={() => handleReaction(c.id, r.key)} className={`text-sm px-1.5 py-0.5 rounded-full transition-all btn-press ${hasReacted ? 'bg-primary/20' : 'hover:bg-muted/50'}`}>
                            {r.emoji}{count > 0 && <span className="text-[10px] ml-0.5">{count}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </AnimatedList>
        </ScrollArea>

        {user && (
          <div className="mt-4">
            {replyTo && (
              <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                <CornerDownRight className="w-3 h-3" />
                Replying to comment
                <button onClick={() => setReplyTo(null)} className="text-destructive text-[10px]">Cancel</button>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Add a comment..."
                className="bg-muted/30 border-border"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
              <Button size="icon" onClick={handleSubmit} className="gradient-primary btn-press">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
