import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, PlusCircle, Trophy, Zap, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import UploadModal from './UploadModal';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const [uploadOpen, setUploadOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { path: '/challenges', icon: Zap, label: 'Challenges' },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-foreground font-bold text-sm">CR</span>
            </div>
            <span className="font-bold text-lg gradient-text hidden sm:block">CodeReels</span>
          </Link>

          {/* Nav Items - Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link key={path} to={path}>
                <Button
                  variant={isActive(path) ? 'default' : 'ghost'}
                  size="sm"
                  className={`gap-2 ${isActive(path) ? 'gradient-primary' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{label}</span>
                </Button>
              </Link>
            ))}

            <Button
              onClick={() => setUploadOpen(true)}
              className="gradient-primary gap-2 glow-primary"
              size="sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden lg:inline">Upload</span>
            </Button>
          </div>

          {/* Right side */}
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

        {/* Mobile Bottom Nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-border">
          <div className="flex items-center justify-around py-2">
            {navItems.map(({ path, icon: Icon }) => (
              <Link key={path} to={path} className={`p-2 rounded-lg ${isActive(path) ? 'text-primary' : 'text-muted-foreground'}`}>
                <Icon className="w-5 h-5" />
              </Link>
            ))}
            <button onClick={() => setUploadOpen(true)} className="p-2 text-primary">
              <PlusCircle className="w-5 h-5" />
            </button>
            {user && (
              <Link to={`/profile/${user.id}`} className="p-2 text-muted-foreground">
                <User className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>
      </nav>

      <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} />
    </>
  );
}
