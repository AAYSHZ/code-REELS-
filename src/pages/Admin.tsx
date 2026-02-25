import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Users, Video, Flame, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, reels: 0, streaks: 0 });

  // Challenge form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('DSA');
  const [badgeName, setBadgeName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) { navigate('/login'); return; }
      const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
      if (!data) { navigate('/'); toast.error('Admin access only'); return; }
      setIsAdmin(true);

      // Fetch stats
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: reelCount } = await supabase.from('reels').select('*', { count: 'exact', head: true });
      const { count: streakCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gt('streak_count', 0);
      setStats({ users: userCount || 0, reels: reelCount || 0, streaks: streakCount || 0 });
      setLoading(false);
    };
    checkAdmin();
  }, [user]);

  const createChallenge = async () => {
    if (!title || !startDate || !endDate || !badgeName) { toast.error('Fill all fields'); return; }
    const { error } = await supabase.from('challenges').insert({
      title, description, category, badge_name: badgeName,
      start_date: new Date(startDate).toISOString(),
      end_date: new Date(endDate).toISOString(),
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Challenge created! 🎯');
    setTitle(''); setDescription(''); setBadgeName('');
  };

  if (!isAdmin || loading) return <div className="flex items-center justify-center min-h-screen pt-16"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen pt-20 pb-24 px-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold gradient-text">Admin Panel</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="glass rounded-xl p-4 text-center">
          <Users className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-xl font-bold text-foreground">{stats.users}</p>
          <p className="text-xs text-muted-foreground">Users</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <Video className="w-5 h-5 text-secondary mx-auto mb-1" />
          <p className="text-xl font-bold text-foreground">{stats.reels}</p>
          <p className="text-xs text-muted-foreground">Reels</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <Flame className="w-5 h-5 text-destructive mx-auto mb-1" />
          <p className="text-xl font-bold text-foreground">{stats.streaks}</p>
          <p className="text-xs text-muted-foreground">Active Streaks</p>
        </div>
      </div>

      {/* Create Challenge */}
      <div className="glass rounded-xl p-5">
        <h2 className="text-lg font-semibold text-foreground mb-4">Create Challenge</h2>
        <div className="space-y-3">
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Challenge title" className="bg-muted/30 border-border" />
          <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="bg-muted/30 border-border" />
          <div className="grid grid-cols-2 gap-3">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-muted/30 border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DSA">DSA</SelectItem>
                <SelectItem value="Web Dev">Web Dev</SelectItem>
                <SelectItem value="AI-ML">AI-ML</SelectItem>
                <SelectItem value="Hardware">Hardware</SelectItem>
              </SelectContent>
            </Select>
            <Input value={badgeName} onChange={e => setBadgeName(e.target.value)} placeholder="Badge name" className="bg-muted/30 border-border" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-muted/30 border-border text-xs" />
            <Input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-muted/30 border-border text-xs" />
          </div>
          <Button onClick={createChallenge} className="w-full gradient-primary">Create Challenge</Button>
        </div>
      </div>
    </div>
  );
}
