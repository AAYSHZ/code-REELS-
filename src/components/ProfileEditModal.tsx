import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Camera, Github, Linkedin, Globe, X, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface ProfileEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: any;
  onSaved: () => void;
}

export default function ProfileEditModal({ open, onOpenChange, profile, onSaved }: ProfileEditModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [githubUrl, setGithubUrl] = useState(profile?.github_url || '');
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedin_url || '');
  const [portfolioUrl, setPortfolioUrl] = useState(profile?.portfolio_url || '');
  const [openToCollab, setOpenToCollab] = useState(profile?.open_to_collab || false);
  const [skillTags, setSkillTags] = useState<string[]>(profile?.skill_tags || []);
  const [newTag, setNewTag] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const addTag = () => {
    if (newTag.trim() && skillTags.length < 6) {
      setSkillTags([...skillTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (idx: number) => {
    setSkillTags(skillTags.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const updates: any = {
        name,
        bio,
        github_url: githubUrl,
        linkedin_url: linkedinUrl,
        portfolio_url: portfolioUrl,
        open_to_collab: openToCollab,
        skill_tags: skillTags,
      };

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const path = `${user.id}/avatar.${ext}`;
        await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true });
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
        updates.avatar = publicUrl;
      }

      if (coverFile) {
        const ext = coverFile.name.split('.').pop();
        const path = `${user.id}/cover.${ext}`;
        await supabase.storage.from('avatars').upload(path, coverFile, { upsert: true });
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
        updates.cover_photo = publicUrl;
      }

      const { error } = await supabase.from('profiles').update(updates).eq('user_id', user.id);
      if (error) throw error;

      toast.success('Profile updated! ✨');
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="gradient-text text-xl">Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <label className="relative cursor-pointer group">
              <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground overflow-hidden">
                {avatarFile ? (
                  <img src={URL.createObjectURL(avatarFile)} className="w-full h-full object-cover" />
                ) : profile?.avatar ? (
                  <img src={profile.avatar} className="w-full h-full object-cover" />
                ) : (
                  name?.charAt(0)?.toUpperCase() || 'U'
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-5 h-5 text-foreground" />
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={e => setAvatarFile(e.target.files?.[0] || null)} />
            </label>
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">Display Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} className="bg-muted/30 border-border mt-1" />
            </div>
          </div>

          {/* Cover Photo */}
          <div>
            <Label className="text-xs text-muted-foreground">Cover Photo</Label>
            <label className="mt-1 flex items-center justify-center w-full h-24 border border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-muted/20 overflow-hidden">
              <input type="file" accept="image/*" className="hidden" onChange={e => setCoverFile(e.target.files?.[0] || null)} />
              {coverFile ? (
                <img src={URL.createObjectURL(coverFile)} className="w-full h-full object-cover" />
              ) : profile?.cover_photo ? (
                <img src={profile.cover_photo} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-muted-foreground">Click to upload cover photo</span>
              )}
            </label>
          </div>

          {/* Bio */}
          <div>
            <Label className="text-xs text-muted-foreground">Bio</Label>
            <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell the world about yourself..." maxLength={160} className="bg-muted/30 border-border mt-1 resize-none" rows={3} />
            <p className="text-[10px] text-muted-foreground mt-1">{bio.length}/160</p>
          </div>

          {/* Social Links */}
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">Social Links</Label>
            <div className="flex items-center gap-2">
              <Github className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Input value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="github.com/username" className="bg-muted/30 border-border text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <Linkedin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Input value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="linkedin.com/in/username" className="bg-muted/30 border-border text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Input value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)} placeholder="yourportfolio.com" className="bg-muted/30 border-border text-sm" />
            </div>
          </div>

          {/* Skill Tags */}
          <div>
            <Label className="text-xs text-muted-foreground">Skill Tags (max 6)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {skillTags.map((tag, i) => (
                <span key={i} className="px-2 py-1 rounded-full text-xs font-medium gradient-primary text-primary-foreground flex items-center gap-1">
                  {tag}
                  <button onClick={() => removeTag(i)}><X className="w-3 h-3" /></button>
                </span>
              ))}
              {skillTags.length < 6 && (
                <div className="flex items-center gap-1">
                  <Input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Add tag" className="w-24 h-7 text-xs bg-muted/30 border-border" />
                  <button onClick={addTag} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-primary/20 transition-colors">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Open to Collab */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Open to Collaborate</p>
              <p className="text-[10px] text-muted-foreground">Show a green badge on your profile</p>
            </div>
            <Switch checked={openToCollab} onCheckedChange={setOpenToCollab} />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary glow-primary btn-press">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
