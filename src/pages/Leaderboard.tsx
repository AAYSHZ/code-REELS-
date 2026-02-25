import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Star, Heart, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import Lightning from '@/components/effects/Lightning';
import SplitText from '@/components/effects/SplitText';
import CountUp from '@/components/effects/CountUp';
import FadeContent from '@/components/effects/FadeContent';
import TiltedCard from '@/components/effects/TiltedCard';

const TABS = [
  { value: 'creator', label: 'Top Creator', icon: Star, sort: 'creator_points' },
  { value: 'solver', label: 'Problem Solver', icon: Trophy, sort: 'xp' },
  { value: 'helpful', label: 'Most Helpful', icon: Heart, sort: 'helper_points' },
  { value: 'rising', label: 'Rising Star', icon: TrendingUp, sort: 'weekly_fpa' },
];

const SKILLS = ['All', 'DSA', 'Web Dev', 'AI-ML', 'Hardware'];

export default function Leaderboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('creator');
  const [skillFilter, setSkillFilter] = useState('All');

  useEffect(() => {
    const sortCol = TABS.find(t => t.value === activeTab)?.sort || 'xp';
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order(sortCol, { ascending: false })
        .limit(10);
      if (data) setUsers(data);
      setLoading(false);
    };
    fetch();
  }, [activeTab]);

  const now = new Date();
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + (7 - now.getDay()) % 7 + 1);
  nextMonday.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((nextMonday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen pt-20 pb-24 px-4 max-w-2xl mx-auto relative">
      <Lightning color="#6c63ff" className="fixed inset-0" />

      <FadeContent className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            <SplitText text="Leaderboard" className="gradient-text" />
          </h1>
          <span className="text-xs font-mono text-muted-foreground glass px-3 py-1 rounded-full">
            Resets in {daysLeft}d
          </span>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 bg-muted/30 mb-4">
            {TABS.map(t => (
              <TabsTrigger key={t.value} value={t.value} className="text-xs gap-1 data-[state=active]:gradient-primary">
                <t.icon className="w-3 h-3" />
                <span className="hidden sm:inline">{t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
            {SKILLS.map(s => (
              <button
                key={s}
                onClick={() => setSkillFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  skillFilter === s ? 'gradient-primary text-foreground' : 'glass text-muted-foreground'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {TABS.map(t => (
            <TabsContent key={t.value} value={t.value}>
              {loading ? (
                <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
              ) : (
                <div className="space-y-2">
                  {users.map((u, i) => (
                    <TiltedCard key={u.id} tiltAmount={5}>
                      <Link to={`/profile/${u.user_id}`} className="flex items-center gap-3 glass rounded-xl p-3 hover:border-primary/30 transition-colors">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          i === 0 ? 'bg-warning/20 text-warning' :
                          i === 1 ? 'bg-muted text-foreground' :
                          i === 2 ? 'bg-orange-800/20 text-orange-400' :
                          'bg-muted/30 text-muted-foreground'
                        }`}>
                          {i + 1}
                        </span>
                        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-foreground">
                          {u.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{u.name}</p>
                          <p className="text-[10px] font-mono text-primary">Lv.{u.level}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-secondary"><CountUp end={u[t.sort] || 0} duration={1.5} /></p>
                          <p className="text-[10px] text-muted-foreground">pts</p>
                        </div>
                      </Link>
                    </TiltedCard>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </FadeContent>
    </div>
  );
}
