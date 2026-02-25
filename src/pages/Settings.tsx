import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, User, Bell, Shield, Link2, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';
import FadeContent from '@/components/effects/FadeContent';
import SplitText from '@/components/effects/SplitText';

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [isPrivate, setIsPrivate] = useState((profile as any)?.is_private || false);
  const [notifPoints, setNotifPoints] = useState(true);
  const [notifFollows, setNotifFollows] = useState(true);
  const [notifBadges, setNotifBadges] = useState(true);
  const [notifChallenges, setNotifChallenges] = useState(true);

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) { toast.error('Min 6 characters'); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else { toast.success('Password updated'); setNewPassword(''); }
  };

  const handlePrivacyToggle = async (val: boolean) => {
    setIsPrivate(val);
    if (user) {
      await supabase.from('profiles').update({ is_private: val }).eq('user_id', user.id);
      toast.success(val ? 'Profile set to private' : 'Profile set to public');
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure? This action cannot be undone.')) return;
    toast.error('Account deletion requires admin approval. Please contact support.');
  };

  return (
    <FadeContent className="min-h-screen pt-20 pb-24 px-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">
          <SplitText text="Settings" className="gradient-text" />
        </h1>
      </div>

      {/* Account */}
      <section className="glass rounded-xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Account</h2>
        </div>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input value={user?.email || ''} disabled className="bg-muted/20 border-border mt-1 text-muted-foreground" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Change Password</Label>
            <div className="flex gap-2 mt-1">
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" className="bg-muted/30 border-border" />
              <Button onClick={handlePasswordChange} size="sm" variant="outline" className="btn-press">Update</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="glass rounded-xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Privacy</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground">Private Profile</p>
            <p className="text-[10px] text-muted-foreground">Only followers can see your reels and stats</p>
          </div>
          <Switch checked={isPrivate} onCheckedChange={handlePrivacyToggle} />
        </div>
      </section>

      {/* Notifications */}
      <section className="glass rounded-xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Points Earned', state: notifPoints, set: setNotifPoints },
            { label: 'New Followers', state: notifFollows, set: setNotifFollows },
            { label: 'Badge Unlocked', state: notifBadges, set: setNotifBadges },
            { label: 'Challenge Updates', state: notifChallenges, set: setNotifChallenges },
          ].map(n => (
            <div key={n.label} className="flex items-center justify-between">
              <p className="text-sm text-foreground">{n.label}</p>
              <Switch checked={n.state} onCheckedChange={n.set} />
            </div>
          ))}
        </div>
      </section>

      {/* Connected Accounts */}
      <section className="glass rounded-xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Link2 className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Connected Accounts</h2>
        </div>
        <div className="space-y-2">
          {['GitHub', 'LinkedIn'].map(acc => (
            <div key={acc} className="flex items-center justify-between py-2">
              <span className="text-sm text-foreground">{acc}</span>
              <Button size="sm" variant="outline" className="text-xs btn-press">Connect</Button>
            </div>
          ))}
        </div>
      </section>

      {/* Danger Zone */}
      <section className="glass rounded-xl p-5 border-destructive/20">
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start gap-2 text-sm btn-press">
            <Download className="w-4 h-4" /> Download My Data
          </Button>
          <Separator />
          <Button variant="destructive" onClick={handleDeleteAccount} className="w-full justify-start gap-2 text-sm btn-press">
            <Trash2 className="w-4 h-4" /> Delete Account
          </Button>
        </div>
      </section>
    </FadeContent>
  );
}
