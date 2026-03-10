import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar: string | null;
  username: string | null;
  xp: number;
  coins: number;
  reputation_score: number;
  level: number;
  streak_count: number;
  skill_points: { dsa: number; webdev: number; aiml: number; hardware: number; other: number };
  creator_points: number;
  helper_points: number;
  knowledge_points: number;
  total_score: number;
  current_badge: string | null;
  badges: string[] | null;
  is_verified_creator: boolean;
  is_elite_creator: boolean;
  weekly_fpa: number;
  last_upload_date: string | null;
  role?: string;
  is_blocked?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (data) {
      console.log('AuthContext fetchProfile fetched:', data);
      setProfile({
        ...data,
        skill_points: (data.skill_points as any) || { dsa: 0, webdev: 0, aiml: 0, hardware: 0, other: 0 },
        total_score: (data as any).total_score ?? 0,
      });
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Online status heartbeat
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (user) {
      // Set initial online status
      supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('user_id', user.id).then();

      // Update every 30 seconds
      interval = setInterval(() => {
        supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('user_id', user.id).then();
      }, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user]);

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
