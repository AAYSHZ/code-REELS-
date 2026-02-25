import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Aurora from '@/components/effects/Aurora';
import BlurText from '@/components/effects/BlurText';
import FadeContent from '@/components/effects/FadeContent';
import Magnet from '@/components/effects/Magnet';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Fill all fields'); return; }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) toast.error(error.message);
    else navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <Aurora colorStops={['hsl(217, 91%, 60%)', 'hsl(199, 89%, 48%)', 'hsl(220, 20%, 4%)']} speed={2} />

      <FadeContent className="w-full max-w-sm space-y-8 relative z-10">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl gradient-primary glow-primary flex items-center justify-center mx-auto mb-4">
            <BlurText text="CR" className="text-2xl font-bold text-foreground" />
          </div>
          <h1 className="text-2xl font-bold">
            <BlurText text="Welcome back" className="gradient-text" delay={0.2} />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            <BlurText text="Sign in to CodeReels" delay={0.4} />
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="bg-muted/30 border-border backdrop-blur-sm" />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="bg-muted/30 border-border backdrop-blur-sm" />
          </div>
          <Magnet strength={0.2}>
            <Button type="submit" disabled={loading} className="w-full gradient-primary glow-primary btn-press">
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Magnet>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:underline">Register</Link>
        </p>
      </FadeContent>
    </div>
  );
}
