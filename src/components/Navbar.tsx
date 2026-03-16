import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Plus, Trophy, Zap, Bell, User, LogOut, ShieldCheck, MessageSquare, Flame, PlusCircle } from 'lucide-react';
import { NotificationIcon } from '@/components/ui/animated-state-icons';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import UploadModal from './UploadModal';
import NotificationPanel from './NotificationPanel';
import BlurText from './effects/BlurText';
import Magnet from './effects/Magnet';
import codereelsLogo from '@/assets/codereels-logo.png';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [unreadDMs, setUnreadDMs] = useState(0);

  // Fetch unread DM count
  useEffect(() => {
    if (!user) return;
    const fetchUnreadDMs = async () => {
      const { count } = await supabase
        .from('dm_messages' as any)
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', user.id);
      setUnreadDMs(count || 0);
    };
    fetchUnreadDMs();
    const interval = setInterval(fetchUnreadDMs, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const isActive = (path: string) => location.pathname === path;

  const desktopNavItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/leaderboard', icon: Trophy, label: 'Board' },
    { path: '/challenges', icon: Zap, label: 'Challenges' },
  ];

  // Bottom nav items for mobile
  const bottomNavItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '__upload__', icon: Plus, label: 'Upload', isUpload: true },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
    { path: user ? `/profile/${user.id}` : '/login', icon: User, label: 'Profile' },
  ];

  return (
    <>
      {/* ── TOP NAVBAR: hidden on mobile, visible on md+ ── */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 glass border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={codereelsLogo} alt="CodeReels" className="h-8 w-auto" />
            <BlurText text="CodeReels" className="font-bold text-lg text-white hidden sm:block" />
          </Link>

          {/* Desktop Nav */}
          <div className="flex items-center gap-1">
            {desktopNavItems.map(({ path, icon: Icon, label }) => (
              <Link key={path} to={path}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`gap-2 transition-all relative ${isActive(path) ? 'bg-white !text-black hover:bg-white/90 hover:!text-black' : '!text-white/50 hover:!text-white hover:bg-white/8'}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{label}</span>
                  {label === 'Messages' && unreadDMs > 0 && (
                    <span
                      className="absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-white text-black font-bold"
                      style={{ width: '16px', height: '16px', fontSize: '9px' }}
                    >
                      {unreadDMs > 9 ? '9+' : unreadDMs}
                    </span>
                  )}
                </Button>
              </Link>
            ))}

            <Magnet strength={0.2}>
              <Button
                onClick={() => setUploadOpen(true)}
                className="bg-white text-black hover:bg-white/90 gap-2"
                size="sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden lg:inline">Upload</span>
              </Button>
            </Magnet>
          </div>

          <div className="flex items-center gap-2">
            {/* Streak Display */}
            {user && (
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-[#1A1A1A] cursor-help transition-colors mr-1"
                title={`${profile?.streak_count || 0} day streak — upload daily to keep it`}
              >
                <Flame className={`w-4 h-4 ${(profile?.streak_count || 0) > 0 ? 'text-[#FF4757]' : 'text-gray-500'}`} style={(profile?.streak_count || 0) > 0 ? { filter: 'drop-shadow(0 0 8px rgba(255,71,87,0.5))' } : {}} />
                <span className={`text-sm font-bold ${(profile?.streak_count || 0) > 0 ? 'text-[#FF4757]' : 'text-gray-500'}`}>
                  {profile?.streak_count || 0}
                </span>
              </div>
            )}

            {/* Bell Icon with Notification Panel */}
            {user && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => setShowPanel(prev => !prev)}
                >
                  <NotificationIcon size={22} color="white" hasNotification={unreadCount > 0} />
                  {unreadCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-red-500 text-white animate-pulse"
                      style={{ width: '18px', height: '18px', fontSize: '10px', fontWeight: 700 }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>

                <AnimatePresence>
                  {showPanel && (
                    <NotificationPanel
                      notifications={notifications}
                      onClose={() => setShowPanel(false)}
                      onOpen={markAllRead}
                    />
                  )}
                </AnimatePresence>
              </div>
            )}

            {user ? (
              <div className="flex items-center gap-2">
                <Link to={`/profile/${user.id}`}>
                  <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted transition-colors">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={profile?.avatar || undefined} />
                      <AvatarFallback className="bg-white/10 text-xs font-bold text-white">
                        {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden lg:block">
                      <p className="text-xs font-medium text-foreground">{profile?.name || 'User'}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">Lv.{profile?.level || 1}</p>
                    </div>
                  </div>
                </Link>
                {profile?.role === 'admin' && (
                  <Link to="/admin">
                    <Button variant="ghost" size="icon" className="text-white/50 hover:text-white">
                      <ShieldCheck className="w-5 h-5" />
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="icon" onClick={signOut} className="text-muted-foreground hover:text-destructive">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link to="/login"><Button variant="ghost" size="sm">Login</Button></Link>
                <Link to="/register"><Button size="sm" className="bg-white text-black hover:bg-white/90">Register</Button></Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── BOTTOM NAV: visible on mobile only ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#080808]/90 backdrop-blur-xl border-t border-white/8 h-16" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around h-full px-2">
          {bottomNavItems.map((item) => {
            const active = item.path !== '__upload__' && (
              item.path === '/' ? location.pathname === '/' :
              location.pathname.startsWith(item.path)
            );

            // Upload button — special center item
            if (item.isUpload) {
              return (
                <button
                  key="upload"
                  onClick={() => setUploadOpen(true)}
                  className="flex items-center justify-center"
                >
                  <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-lg shadow-white/10">
                    <Plus className="w-6 h-6 text-black" />
                  </div>
                </button>
              );
            }

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center justify-center gap-0.5 relative"
              >
                <item.icon className={`w-[22px] h-[22px] ${active ? 'text-white' : 'text-white/30'}`} />
                <span className={`text-[10px] font-medium ${active ? 'text-white' : 'text-white/30'}`}>{item.label}</span>
                {item.label === 'Messages' && unreadDMs > 0 && (
                  <span
                    className="absolute -top-1 right-0 flex items-center justify-center rounded-full bg-white text-black font-bold"
                    style={{ width: '14px', height: '14px', fontSize: '8px' }}
                  >
                    {unreadDMs > 9 ? '9+' : unreadDMs}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} />
    </>
  );
}
