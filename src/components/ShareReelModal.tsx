import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Copy, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface ShareReelModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reelId: string;
    onShareComplete: () => void;
}

export default function ShareReelModal({ open, onOpenChange, reelId, onShareComplete }: ShareReelModalProps) {
    const { user } = useAuth();
    const [following, setFollowing] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user || !open) return;
        const fetchFollowing = async () => {
            const { data } = await supabase.from('profiles').select('user_id, name, avatar').neq('user_id', user.id).limit(20);
            if (data) setFollowing(data);
        };
        fetchFollowing();
    }, [user, open]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(`${window.location.origin}/reel/${reelId}`);
        toast.success('Link copied!');
        onShareComplete();
        onOpenChange(false);
    };

    const handleSendToUser = async (targetUserId: string) => {
        if (!user) return;
        setLoading(true);
        try {
            // Find or create conversation
            let { data: convos } = await supabase
                .from('conversations')
                .select('id')
                .or(`and(participant_1.eq.${user.id},participant_2.eq.${targetUserId}),and(participant_1.eq.${targetUserId},participant_2.eq.${user.id})`);

            let convoId = convos && convos.length > 0 ? convos[0].id : null;

            if (!convoId) {
                const { data: newConvo } = await supabase
                    .from('conversations')
                    .insert({ participant_1: user.id, participant_2: targetUserId })
                    .select('id')
                    .single();
                if (newConvo) convoId = newConvo.id;
            }

            if (convoId) {
                await supabase.from('dm_messages').insert({
                    conversation_id: convoId,
                    sender_id: user.id,
                    content: 'Check out this reel!',
                    message_type: 'reel',
                    shared_reel_id: reelId
                });

                await supabase.from('conversations').update({ last_message: 'Sent a reel', last_message_at: new Date().toISOString() }).eq('id', convoId);
                toast.success('Sent to friend!');
                onShareComplete();
                onOpenChange(false);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="glass border-border sm:max-w-md bg-[#0f0f13] !p-0 overflow-hidden">
                <DialogHeader className="p-4 pb-2 border-b border-border/50">
                    <DialogTitle className="text-center font-bold">Share</DialogTitle>
                </DialogHeader>
                <div className="p-4 space-y-4">
                    <button onClick={handleCopyLink} className="flex items-center gap-3 w-full p-3 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors border border-border/50">
                        <div className="p-2 rounded-full bg-primary/20 text-primary"><Copy className="w-4 h-4" /></div>
                        <span className="font-semibold text-sm">Copy Link</span>
                    </button>

                    <div>
                        <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider px-1">Send to Friends</p>
                        <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                            {following.map(f => (
                                <div key={f.user_id} className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/20 transition-colors border border-transparent hover:border-border/30">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="w-10 h-10 border border-border/50">
                                            <AvatarImage src={f.avatar} />
                                            <AvatarFallback className="gradient-primary text-xs font-bold text-foreground">{f.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-semibold">{f.name}</span>
                                    </div>
                                    <Button size="sm" variant="secondary" className="h-8 text-xs rounded-full px-4" disabled={loading} onClick={() => handleSendToUser(f.user_id)}>
                                        <Send className="w-3 h-3 mr-1.5" /> Send
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
