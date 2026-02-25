import { useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import BlurText from '@/components/effects/BlurText';
import FadeContent from '@/components/effects/FadeContent';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <FadeContent className="text-center">
        <div className="w-24 h-24 rounded-2xl gradient-primary glow-primary flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl font-bold text-primary-foreground">404</span>
        </div>
        <h1 className="mb-3 text-3xl font-bold">
          <BlurText text="Page Not Found" className="gradient-text" />
        </h1>
        <p className="mb-6 text-muted-foreground">This reel seems to have gone missing from the feed...</p>
        <Link to="/">
          <Button className="gradient-primary glow-soft gap-2 btn-press">
            <Home className="w-4 h-4" /> Back to Feed
          </Button>
        </Link>
      </FadeContent>
    </div>
  );
};

export default NotFound;
