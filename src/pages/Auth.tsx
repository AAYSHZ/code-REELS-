import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function Auth() {
    const { signIn, signUp } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState<'login' | 'register'>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

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
        <div
            className="min-h-screen flex"
            style={{
                fontFamily: "'Inter', sans-serif",
                backgroundColor: '#0D1117',
                color: '#fff',
            }}
        >
            {/* ── LEFT PANEL (desktop only) ── */}
            <div
                className="hidden lg:flex flex-col justify-center px-16 xl:px-24 relative overflow-hidden"
                style={{
                    width: '60%',
                    background: `
            radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)
          `,
                    backgroundSize: '24px 24px',
                }}
            >
                {/* Subtle glow accent */}
                <div
                    className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle, rgba(0,255,148,0.08) 0%, transparent 70%)',
                    }}
                />

                <div className="relative z-10 max-w-lg">
                    {/* Logo */}
                    <div className="flex items-center gap-2 mb-12">
                        <div
                            className="w-8 h-8 flex items-center justify-center text-sm font-bold"
                            style={{
                                backgroundColor: '#00FF94',
                                color: '#0D1117',
                                borderRadius: '2px',
                                fontFamily: "'JetBrains Mono', monospace",
                            }}
                        >
                            CR
                        </div>
                        <span
                            className="text-sm font-medium tracking-wider uppercase"
                            style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em' }}
                        >
                            CodeReels
                        </span>
                    </div>

                    {/* Heading */}
                    <h1
                        className="text-5xl xl:text-6xl font-extrabold leading-tight mb-6"
                        style={{ letterSpacing: '-0.03em' }}
                    >
                        Learn to Code,
                        <br />
                        <span style={{ color: '#00FF94' }}>One Reel at a Time</span>
                    </h1>

                    <p
                        className="text-lg mb-12"
                        style={{ color: 'rgba(255,255,255,0.5)', lineHeight: '1.7' }}
                    >
                        Join CodeReels — a gamified short-video platform for developers.
                        Watch, create, and level up.
                    </p>

                    {/* Feature highlights */}
                    <div className="space-y-5">
                        {[
                            { icon: '🎮', text: 'Earn XP and level up as you learn' },
                            { icon: '🔥', text: 'Short coding videos, big concepts' },
                            { icon: '🤖', text: 'AI-powered search for instant answers' },
                        ].map((f, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <span className="text-2xl">{f.icon}</span>
                                <span
                                    className="text-sm font-medium"
                                    style={{ color: 'rgba(255,255,255,0.7)' }}
                                >
                                    {f.text}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── RIGHT PANEL ── */}
            <div
                className="flex-1 flex items-center justify-center px-6 py-12 relative"
                style={{ backgroundColor: '#0D1117' }}
            >
                {/* Mobile-only: top logo */}
                <div className="absolute top-6 left-6 flex items-center gap-2 lg:hidden">
                    <div
                        className="w-7 h-7 flex items-center justify-center text-xs font-bold"
                        style={{
                            backgroundColor: '#00FF94',
                            color: '#0D1117',
                            borderRadius: '2px',
                            fontFamily: "'JetBrains Mono', monospace",
                        }}
                    >
                        CR
                    </div>
                    <span
                        className="text-xs font-medium tracking-wider uppercase"
                        style={{ color: 'rgba(255,255,255,0.4)' }}
                    >
                        CodeReels
                    </span>
                </div>

                <div className="w-full max-w-sm">
                    {/* Auth Card */}
                    <div
                        style={{
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '2px',
                            backgroundColor: 'rgba(255,255,255,0.02)',
                        }}
                    >
                        {/* Tabs */}
                        <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            {(['login', 'register'] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => { setTab(t); setPassword(''); }}
                                    className="flex-1 py-3.5 text-sm font-medium transition-colors relative"
                                    style={{
                                        color: tab === t ? '#fff' : 'rgba(255,255,255,0.4)',
                                        backgroundColor: tab === t ? 'rgba(255,255,255,0.03)' : 'transparent',
                                    }}
                                >
                                    {t === 'login' ? 'Sign In' : 'Create Account'}
                                    {tab === t && (
                                        <div
                                            className="absolute bottom-0 left-0 right-0 h-[2px]"
                                            style={{ backgroundColor: '#00FF94' }}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {tab === 'register' && (
                                <div>
                                    <label
                                        className="block text-xs font-medium mb-1.5"
                                        style={{ color: 'rgba(255,255,255,0.5)' }}
                                    >
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your name"
                                        className="w-full px-3 py-2.5 text-sm outline-none transition-all"
                                        style={{
                                            backgroundColor: 'rgba(255,255,255,0.04)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '2px',
                                            color: '#fff',
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#00FF94'}
                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                    />
                                </div>
                            )}

                            <div>
                                <label
                                    className="block text-xs font-medium mb-1.5"
                                    style={{ color: 'rgba(255,255,255,0.5)' }}
                                >
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full px-3 py-2.5 text-sm outline-none transition-all"
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '2px',
                                        color: '#fff',
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#00FF94'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                />
                            </div>

                            <div>
                                <label
                                    className="block text-xs font-medium mb-1.5"
                                    style={{ color: 'rgba(255,255,255,0.5)' }}
                                >
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={tab === 'register' ? 'Min 6 characters' : '••••••••'}
                                    className="w-full px-3 py-2.5 text-sm outline-none transition-all"
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '2px',
                                        color: '#fff',
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#00FF94'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                />
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2"
                                style={{
                                    backgroundColor: '#00FF94',
                                    color: '#0D1117',
                                    borderRadius: '2px',
                                    opacity: loading ? 0.7 : 1,
                                    boxShadow: '0 0 20px rgba(0,255,148,0.15)',
                                }}
                                onMouseEnter={(e) => {
                                    if (!loading) (e.target as HTMLElement).style.boxShadow = '0 0 30px rgba(0,255,148,0.3)';
                                }}
                                onMouseLeave={(e) => {
                                    (e.target as HTMLElement).style.boxShadow = '0 0 20px rgba(0,255,148,0.15)';
                                }}
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {loading
                                    ? (tab === 'login' ? 'Signing in...' : 'Creating account...')
                                    : (tab === 'login' ? 'Sign In' : 'Create Account')
                                }
                            </button>

                            {/* Divider */}
                            <div className="flex items-center gap-3 py-1">
                                <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
                                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>or</span>
                                <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
                            </div>

                            {/* Google OAuth */}
                            <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                className="w-full py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2"
                                style={{
                                    backgroundColor: 'transparent',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '2px',
                                    color: 'rgba(255,255,255,0.7)',
                                }}
                                onMouseEnter={(e) => {
                                    (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.25)';
                                    (e.target as HTMLElement).style.color = '#fff';
                                }}
                                onMouseLeave={(e) => {
                                    (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
                                    (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.7)';
                                }}
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.44 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Continue with Google
                            </button>
                        </form>
                    </div>

                    {/* Footer */}
                    <p
                        className="text-center mt-6 text-xs"
                        style={{ color: 'rgba(255,255,255,0.3)' }}
                    >
                        By continuing, you agree to CodeReels Terms of Service.
                    </p>
                </div>
            </div>
        </div>
    );
}
