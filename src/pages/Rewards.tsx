import { useAuth } from '@/context/AuthContext';
import { Progress } from '@/components/ui/progress';
import { Coins, Gift, Rocket, GraduationCap, Briefcase, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FadeContent from '@/components/effects/FadeContent';
import SplitText from '@/components/effects/SplitText';
import SpotlightCard from '@/components/effects/SpotlightCard';
import CountUp from '@/components/effects/CountUp';

const MILESTONES = [
  { target: 1000, label: '1K', reward: 'Custom Profile Frame' },
  { target: 10000, label: '10K', reward: 'Verified Creator Badge' },
  { target: 20000, label: '20K', reward: 'Elite Creator Status' },
  { target: 50000, label: '50K', reward: 'Hall of Fame' },
];

const COIN_OPTIONS = [
  { label: 'Boost Reel', cost: 50, icon: Rocket, desc: 'Push your reel to more users' },
  { label: 'Tip Creator', cost: 20, icon: Coins, desc: 'Send coins to a creator' },
  { label: 'Challenge Mode', cost: 100, icon: Gift, desc: 'Unlock exclusive challenges' },
];

const COMING_SOON = [
  { label: 'Certificates', icon: GraduationCap },
  { label: 'Internship Priority', icon: Briefcase },
  { label: 'Course Discounts', icon: BookOpen },
];

export default function Rewards() {
  const { profile } = useAuth();
  const xp = profile?.xp || 0;
  const coins = profile?.coins || 0;

  return (
    <FadeContent className="min-h-screen pt-20 pb-24 px-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">
        <SplitText text="Rewards" className="gradient-text" />
      </h1>
      <p className="text-sm text-muted-foreground mb-6">Earn milestones and spend coins</p>

      <div className="glass rounded-xl p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-warning" />
          <span className="font-semibold text-foreground">Coin Balance</span>
        </div>
        <span className="text-xl font-bold text-warning"><CountUp end={coins} duration={2} /></span>
      </div>

      <h2 className="text-sm font-semibold text-foreground mb-3">Milestones</h2>
      <div className="space-y-3 mb-8">
        {MILESTONES.map(m => {
          const unlocked = xp >= m.target;
          const progress = Math.min((xp / m.target) * 100, 100);
          return (
            <SpotlightCard
              key={m.target}
              className={`glass rounded-xl p-4 ${unlocked ? 'border-success/30' : 'opacity-70'}`}
              spotlightColor={unlocked ? 'hsla(145, 63%, 51%, 0.15)' : 'hsla(260, 100%, 65%, 0.1)'}
            >
              <div className="flex justify-between items-center mb-2">
                <span className={`text-sm font-semibold ${unlocked ? 'text-success' : 'text-foreground'}`}>
                  {m.label} XP — {m.reward}
                </span>
                {unlocked && <span className="text-xs text-success font-medium">✓ Unlocked</span>}
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-[10px] text-muted-foreground mt-1">
                <CountUp end={xp} duration={1.5} /> / {m.target.toLocaleString()}
              </p>
            </SpotlightCard>
          );
        })}
      </div>

      <h2 className="text-sm font-semibold text-foreground mb-3">Spend Coins</h2>
      <div className="grid gap-3 mb-8">
        {COIN_OPTIONS.map(o => (
          <SpotlightCard key={o.label} className="glass rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <o.icon className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">{o.label}</p>
                <p className="text-[10px] text-muted-foreground">{o.desc}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" disabled={coins < o.cost} className="text-xs btn-press">
              {o.cost} <Coins className="w-3 h-3 ml-1 text-warning" />
            </Button>
          </SpotlightCard>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-foreground mb-3">Coming Soon</h2>
      <div className="grid grid-cols-3 gap-3">
        {COMING_SOON.map(c => (
          <div key={c.label} className="glass rounded-xl p-4 text-center opacity-50">
            <c.icon className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>
    </FadeContent>
  );
}
