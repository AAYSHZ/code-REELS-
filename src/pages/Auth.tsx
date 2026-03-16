import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Loader2, Play, Trophy, Zap } from 'lucide-react';

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `nav { display: none !important; }`;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Fill all fields'); return; }
    if (tab === 'register' && !name) { toast.error('Name is required'); return; }
    if (tab === 'register' && password.length < 6) { toast.error('Password must be at least 6 characters'); return; }

    setLoading(true);
    if (tab === 'login') {
      const { error } = await signIn(email, password);
      setLoading(false);
      if (error) { toast.error(error.message); }
      else { navigate('/home', { replace: true }); }
    } else {
      const { error } = await signUp(email, password, name);
      setLoading(false);
      if (error) { toast.error(error.message); }
      else {
        toast.success('Account created! You can now sign in.');
        setTab('login');
        setPassword('');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/home' },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="min-h-screen flex w-full font-sans">
      {/* LEFT PANEL */}
      <div 
        className="hidden lg:flex flex-col justify-center relative overflow-hidden"
        style={{ width: '55%', backgroundColor: '#080b0f' }}
      >
        <div 
          className="absolute inset-0 z-0 opacity-100" 
          style={{
            backgroundImage: 'radial-gradient(rgba(108,99,255,0.15) 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px'
          }}
        />
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-[#6C63FF]/10 blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-[#00D4AA]/8 blur-[100px] pointer-events-none z-0" />

        <div className="relative z-10 w-full max-w-2xl mx-auto px-12 xl:px-20 flex flex-col items-start gap-8">
          <div className="w-20 h-20 rounded-2xl bg-[#6C63FF] flex items-center justify-center shadow-lg shadow-[#6C63FF]/20">
            <Play className="w-10 h-10 text-white fill-white ml-2" />
          </div>

          <div className="flex flex-col gap-4 max-w-lg">
            <h1 className="text-5xl font-extrabold tracking-tight text-white leading-tight">
              Where developers show their craft.
            </h1>
            <p className="text-lg text-white/50 max-w-md">
              Learn, share, and level up through short coding videos.
            </p>
          </div>

          <div className="flex flex-col gap-6 mt-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <Play className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="text-base font-medium text-white/80">Short coding videos for developers</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <span className="text-base font-medium text-white/80">Earn XP and level up your skills</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="text-base font-medium text-white/80">AI-powered search with real answers</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div 
        className="flex-1 flex flex-col items-center justify-center w-full lg:w-[45%]"
        style={{ 
          backgroundColor: '#0d1117',
          borderLeft: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <div className="w-full max-w-[400px] px-6 py-12 lg:p-12">
          
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white tracking-tight">
              {tab === 'login' ? 'Sign in' : 'Create Account'}
            </h2>
            <p className="text-sm text-white/40 mt-2">
              {tab === 'login' ? 'Welcome back. Enter your details below.' : 'Join the community. Enter your details.'}
            </p>
          </div>

          <div className="flex items-center border-b border-white/10 mb-8">
            <button
              onClick={() => { setTab('login'); setPassword(''); }}
              className={`flex-1 pb-3 text-sm font-medium transition-colors cursor-pointer ${
                tab === 'login' ? 'text-white border-b-2 border-[#6C63FF]' : 'text-white/30 border-b-2 border-transparent'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab('register'); setPassword(''); }}
              className={`flex-1 pb-3 text-sm font-medium transition-colors cursor-pointer ${
                tab === 'register' ? 'text-white border-b-2 border-[#6C63FF]' : 'text-white/30 border-b-2 border-transparent'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {tab === 'register' && (
              <div className="flex flex-col">
                <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="bg-[#080b0f] border border-white/10 border-solid rounded-lg px-4 py-3 text-white placeholder-white/20 focus:border-[#6C63FF] focus:outline-none focus:ring-0 transition-colors"
                />
              </div>
            )}

            <div className="flex flex-col">
              <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-[#080b0f] border border-white/10 border-solid rounded-lg px-4 py-3 text-white placeholder-white/20 focus:border-[#6C63FF] focus:outline-none focus:ring-0 transition-colors"
              />
            </div>

            <div className="flex flex-col mb-2">
              <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tab === 'login' ? "••••••••" : "Min 6 characters"}
                className="bg-[#080b0f] border border-white/10 border-solid rounded-lg px-4 py-3 text-white placeholder-white/20 focus:border-[#6C63FF] focus:outline-none focus:ring-0 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6C63FF] text-white py-3 rounded-lg font-semibold hover:bg-[#5a52e0] active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {tab === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-xs text-white/20 font-medium lowercase">or</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full border border-white/8 bg-transparent text-white/60 py-3 rounded-lg font-medium hover:bg-white/4 transition-colors flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.44 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <p className="text-center mt-6 text-sm text-white/30">
            {tab === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setPassword(''); }}
              className="text-[#6C63FF] hover:underline hover:text-[#5a52e0] transition-colors"
            >
              {tab === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}
