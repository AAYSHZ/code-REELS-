import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, PlusCircle, Trophy, Zap, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import UploadModal from './UploadModal';
import NotificationDropdown from './NotificationDropdown';
import BlurText from './effects/BlurText';
import Dock from './effects/Dock';
import Magnet from './effects/Magnet';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [uploadOpen, setUploadOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/leaderboard', icon: Trophy, label: 'Board' },
    { path: '/challenges', icon: Zap, label: 'Challenges' },
  ];

  const dockItems = [
    ...navItems.map(n => ({
      icon: <n.icon className="w-5 h-5" />,
      label: n.label,
      onClick: () => navigate(n.path),
      active: isActive(n.path),
    })),
    {
      icon: <PlusCircle className="w-5 h-5" />,
      label: 'Upload',
      onClick: () => setUploadOpen(true),
      active: false,
    },
    ...(user ? [{
      icon: <User className="w-5 h-5" />,
      label: 'Profile',
      onClick: () => navigate(`/profile/${user.id}`),
      active: location.pathname.startsWith('/profile'),
    }] : []),
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-foreground font-bold text-sm">CR</span>
            </div>
            <BlurText text="CodeReels" className="font-bold text-lg gradient-text hidden sm:block" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link key={path} to={path}>
                <Button
                  variant={isActive(path) ? 'default' : 'ghost'}
                  size="sm"
                  className={`gap-2 transition-all ${isActive(path) ? 'gradient-primary glow-primary' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{label}</span>
                </Button>
              </Link>
            ))}

            <Magnet strength={0.2}>
              <Button
                onClick={() => setUploadOpen(true)}
                className="gradient-primary gap-2 glow-primary"
                size="sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden lg:inline">Upload</span>
              </Button>
            </Magnet>
          </div>

          <div className="flex items-center gap-2">
            {user && <NotificationDropdown />}
            {user ? (
              <div className="flex items-center gap-2">
                <Link to={`/profile/${user.id}`}>
                  <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted transition-colors">
                    <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-foreground">
                      {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="hidden lg:block">
                      <p className="text-xs font-medium text-foreground">{profile?.name || 'User'}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">Lv.{profile?.level || 1}</p>
                    </div>
                  </div>
                </Link>
                <Button variant="ghost" size="icon" onClick={signOut} className="text-muted-foreground hover:text-destructive">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link to="/login"><Button variant="ghost" size="sm">Login</Button></Link>
                <Link to="/register"><Button size="sm" className="gradient-primary">Register</Button></Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Dock */}
      <div className="md:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-50">
        <Dock items={dockItems} />
      </div>

      <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} />
    </>
  );
}
