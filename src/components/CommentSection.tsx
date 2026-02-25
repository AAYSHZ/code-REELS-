import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThumbsUp, ThumbsDown, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import AnimatedList from './effects/AnimatedList';

interface CommentSectionProps {
  reelId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CommentSection({ reelId, open, onOpenChange }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [profiles, setProfiles] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!open) return;
    const fetchComments = async () => {
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('reel_id', reelId)
        .order('created_at', { ascending: false });
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
      }
    };
    fetchComments();
  }, [reelId, open]);

  const handleSubmit = async () => {
    if (!user || !text.trim()) return;
    const { data } = await supabase.from('comments').insert({
      reel_id: reelId, user_id: user.id, text: text.trim()
    }).select().single();
    if (data) {
      setComments(prev => [data, ...prev]);
      setText('');
    }
  };

  const handleVote = async (commentId: string, type: 'up' | 'down') => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    const update = type === 'up'
      ? { upvotes: comment.upvotes + 1 }
      : { downvotes: comment.downvotes + 1 };
    await supabase.from('comments').update(update).eq('id', commentId);
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, ...update } : c));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="glass border-border w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-foreground">Comments</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 mt-4 h-[calc(100vh-12rem)]">
          <AnimatedList>
            {comments.map(c => {
              const profile = profiles[c.user_id];
              return (
                <div key={c.id} className="py-3 border-b border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-[10px] font-bold text-foreground">
                      {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-xs font-medium text-foreground">{profile?.name || 'User'}</span>
                    <span className="text-[10px] font-mono text-primary">Lv.{profile?.level || 1}</span>
                  </div>
                  <p className="text-sm text-muted-foreground ml-8">{c.text}</p>
                  <div className="flex items-center gap-3 ml-8 mt-1">
                    <button onClick={() => handleVote(c.id, 'up')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-secondary transition-colors">
                      <ThumbsUp className="w-3 h-3" /> {c.upvotes}
                    </button>
                    <button onClick={() => handleVote(c.id, 'down')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
                      <ThumbsDown className="w-3 h-3" /> {c.downvotes}
                    </button>
                  </div>
                </div>
              );
            })}
          </AnimatedList>
        </ScrollArea>

        {user && (
          <div className="flex gap-2 mt-4">
            <Input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Add a comment..."
              className="bg-muted/30 border-border"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <Button size="icon" onClick={handleSubmit} className="gradient-primary">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
