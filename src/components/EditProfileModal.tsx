import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Camera, Github, Linkedin, Globe, Loader2, Trash2, ImagePlus, X, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import ImageCropModal from './ImageCropModal';

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: any;
  onUpdated: () => void;
}

export default function EditProfileModal({ open, onOpenChange, profile, onUpdated }: EditProfileModalProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarDeleted, setAvatarDeleted] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(profile?.cover_photo || null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverDeleted, setCoverDeleted] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [form, setForm] = useState({
    name: profile?.name || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
    github_url: profile?.github_url || '',
    linkedin_url: profile?.linkedin_url || '',
    portfolio_url: profile?.portfolio_url || '',
    open_to_collab: profile?.open_to_collab || false,
    skill_tags: (profile?.skill_tags as string[]) || [],
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setCropSrc(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleCropComplete = (blob: Blob) => {
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(blob));
    setAvatarDeleted(false);
    setCropSrc(null);
  };

  const handleDeleteAvatar = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
    setAvatarDeleted(true);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setCoverDeleted(false);
    e.target.value = '';
  };

  const handleDeleteCover = () => {
    setCoverPreview(null);
    setCoverFile(null);
    setCoverDeleted(true);
  };

  const addTag = () => {
    const tag = newTag.trim();
    if (!tag || form.skill_tags.length >= 8) return;
    if (form.skill_tags.includes(tag)) { toast.error('Tag already added'); return; }
    setForm({ ...form, skill_tags: [...form.skill_tags, tag] });
    setNewTag('');
  };

  const removeTag = (idx: number) => {
    setForm({ ...form, skill_tags: form.skill_tags.filter((_, i) => i !== idx) });
  };

  const uploadFile = async (bucket: string, path: string, file: File) => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) {
      await supabase.storage.createBucket(bucket, { public: true });
      await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl + `?t=${Date.now()}`;
  };

  const handleSave = async () => {
    if (!user) return;
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (form.username && !/^[a-zA-Z0-9_]{3,20}$/.test(form.username)) {
      toast.error('Username must be 3-20 chars, letters/numbers/underscores only'); return;
    }

    setSaving(true);
    try {
      let avatarUrl = profile?.avatar;
      let coverUrl = profile?.cover_photo;

      if (avatarDeleted) {
        avatarUrl = null;
        // Try to remove old file
        await supabase.storage.from('avatars').remove([`avatars/${user.id}.jpg`, `avatars/${user.id}.png`, `avatars/${user.id}.jpeg`]);
      } else if (avatarFile) {
        avatarUrl = await uploadFile('avatars', `avatars/${user.id}.jpg`, avatarFile);
      }

      if (coverDeleted) {
        coverUrl = null;
        await supabase.storage.from('avatars').remove([`covers/${user.id}.jpg`]);
      } else if (coverFile) {
        coverUrl = await uploadFile('avatars', `covers/${user.id}.jpg`, coverFile);
      }

      const { error } = await supabase.from('profiles').update({
        name: form.name.trim(),
        username: form.username.trim() || null,
        bio: form.bio.trim() || null,
        avatar: avatarUrl,
        cover_photo: coverUrl,
        github_url: form.github_url.trim() || null,
        linkedin_url: form.linkedin_url.trim() || null,
        portfolio_url: form.portfolio_url.trim() || null,
        open_to_collab: form.open_to_collab,
        skill_tags: form.skill_tags,
      }).eq('user_id', user.id);

      if (error) {
        if (error.message.includes('username')) toast.error('Username is already taken');
        else toast.error('Failed to update profile');
        return;
      }

      toast.success('Profile updated!');
      onUpdated();
      onOpenChange(false);
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Cover Photo */}
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Cover Photo</Label>
            <div className="relative w-full h-24 rounded-xl overflow-hidden glass border border-border group">
              {coverPreview ? (
                <>
                  <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={() => coverInputRef.current?.click()} className="p-1.5 rounded-full bg-background/80 hover:bg-background">
                      <Camera className="w-4 h-4 text-foreground" />
                    </button>
                    <button onClick={handleDeleteCover} className="p-1.5 rounded-full bg-destructive/80 hover:bg-destructive">
                      <Trash2 className="w-4 h-4 text-foreground" />
                    </button>
                  </div>
                </>
              ) : (
                <button onClick={() => coverInputRef.current?.click()} className="w-full h-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <ImagePlus className="w-4 h-4" /> Add Cover Photo
                </button>
              )}
            </div>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
              <Avatar className="w-24 h-24 border-2 border-primary">
                <AvatarImage src={avatarPreview || undefined} />
                <AvatarFallback className="gradient-primary text-2xl font-bold text-foreground">
                  {form.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-6 h-6 text-foreground" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => fileInputRef.current?.click()} className="text-xs text-primary font-medium hover:underline">
                Change Photo
              </button>
              {(avatarPreview || profile?.avatar) && !avatarDeleted && (
                <button onClick={handleDeleteAvatar} className="text-xs text-destructive font-medium hover:underline flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Display Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" maxLength={50} className="glass border-border" />
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Username</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })} placeholder="username" maxLength={20} className="glass border-border pl-8" />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Bio</Label>
            <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell everyone about yourself..." maxLength={200} rows={3} className="glass border-border resize-none" />
            <p className="text-[10px] text-muted-foreground text-right">{form.bio.length}/200</p>
          </div>

          {/* Skill Tags */}
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Skill Tags (max 8)</Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.skill_tags.map((tag, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-xs font-medium gradient-primary text-foreground flex items-center gap-1">
                  {tag}
                  <button onClick={() => removeTag(i)}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            {form.skill_tags.length < 8 && (
              <div className="flex gap-2">
                <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="e.g. React Expert" maxLength={20} className="glass border-border text-xs flex-1" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); }}} />
                <Button type="button" variant="outline" size="sm" className="glass border-border" onClick={addTag}><Plus className="w-3.5 h-3.5" /></Button>
              </div>
            )}
          </div>

          {/* Open to Collaborate */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-muted-foreground text-xs">Open to Collaborate</Label>
              <p className="text-[10px] text-muted-foreground">Shows a green badge on your profile</p>
            </div>
            <Switch checked={form.open_to_collab} onCheckedChange={(v) => setForm({ ...form, open_to_collab: v })} />
          </div>

          {/* Social Links */}
          <div className="space-y-3">
            <Label className="text-muted-foreground text-xs">Social Links</Label>
            <div className="flex items-center gap-2">
              <Github className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Input value={form.github_url} onChange={(e) => setForm({ ...form, github_url: e.target.value })} placeholder="https://github.com/username" className="glass border-border text-xs" />
            </div>
            <div className="flex items-center gap-2">
              <Linkedin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Input value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/username" className="glass border-border text-xs" />
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Input value={form.portfolio_url} onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })} placeholder="https://yourportfolio.com" className="glass border-border text-xs" />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary glow-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {cropSrc && (
          <ImageCropModal
            open={!!cropSrc}
            onOpenChange={(open) => { if (!open) setCropSrc(null); }}
            imageSrc={cropSrc}
            onCropComplete={handleCropComplete}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
