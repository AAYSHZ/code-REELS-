import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { timeAgo } from '@/utils/timeAgo';
import AnimatedList from './effects/AnimatedList';

interface Notification {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, string> = {
  points: '⚡',
  follower: '👤',
  badge: '🏆',
  challenge: '🎯',
  reply: '💬',
  best_solution: '✅',
};

export default function NotificationDropdown() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) setNotifications(data);
    };
    fetchNotifications();

    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => setNotifications(prev => [payload.new as Notification, ...prev])
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative w-8 h-8">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full gradient-primary text-[9px] font-bold flex items-center justify-center text-primary-foreground animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 glass-strong p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs text-primary btn-press">Mark all read</Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <p className="p-6 text-center text-muted-foreground text-sm">No notifications yet ✨</p>
          ) : (
            <AnimatedList>
              {notifications.map(n => (
                <div key={n.id} className={`p-3 border-b border-border text-sm transition-colors ${!n.is_read ? 'gradient-subtle' : ''}`}>
                  <div className="flex items-start gap-2">
                    <span className="text-base">{TYPE_ICONS[n.type] || '📣'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground text-xs">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.is_read && <div className="w-2 h-2 rounded-full gradient-primary mt-1 flex-shrink-0" />}
                  </div>
                </div>
              ))}
            </AnimatedList>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
