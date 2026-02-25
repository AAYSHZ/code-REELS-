import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, MessageCircle, Twitter, Link2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ShareMenuProps {
  reelId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sharesCount: number;
}

export default function ShareMenu({ reelId, open, onOpenChange, sharesCount }: ShareMenuProps) {
  const url = `${window.location.origin}/reel/${reelId}`;

  const share = async (type: string) => {
    await supabase.from('reels').update({ shares_count: sharesCount + 1 }).eq('id', reelId);

    switch (type) {
      case 'copy':
        navigator.clipboard.writeText(url);
        toast.success('Link copied!');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(`Check out this reel: ${url}`)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent('Check this out on CodeReels!')}`, '_blank');
        break;
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-border max-w-xs">
        <DialogHeader>
          <DialogTitle className="gradient-text">Share Reel</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => share('copy')} className="flex flex-col h-20 gap-2 btn-press">
            <Copy className="w-5 h-5" />
            <span className="text-xs">Copy Link</span>
          </Button>
          <Button variant="outline" onClick={() => share('whatsapp')} className="flex flex-col h-20 gap-2 btn-press">
            <MessageCircle className="w-5 h-5 text-success" />
            <span className="text-xs">WhatsApp</span>
          </Button>
          <Button variant="outline" onClick={() => share('twitter')} className="flex flex-col h-20 gap-2 btn-press">
            <Twitter className="w-5 h-5 text-blue-400" />
            <span className="text-xs">Twitter</span>
          </Button>
          <Button variant="outline" onClick={() => share('copy')} className="flex flex-col h-20 gap-2 btn-press">
            <Link2 className="w-5 h-5" />
            <span className="text-xs">Embed</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
