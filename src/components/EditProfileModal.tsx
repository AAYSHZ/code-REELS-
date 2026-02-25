import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Camera, Github, Linkedin, Globe, Loader2 } from 'lucide-react';
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
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: profile?.name || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
    github_url: profile?.github_url || '',
    linkedin_url: profile?.linkedin_url || '',
    portfolio_url: profile?.portfolio_url || '',
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setCropSrc(URL.createObjectURL(file));
  };

  const handleCropComplete = (blob: Blob) => {
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(blob));
    setCropSrc(null);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (form.username && !/^[a-zA-Z0-9_]{3,20}$/.test(form.username)) {
      toast.error('Username must be 3-20 chars, letters/numbers/underscores only');
      return;
    }

    setSaving(true);
    try {
      let avatarUrl = profile?.avatar;

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const path = `avatars/${user.id}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true });
        
        if (uploadError) {
          // Try creating bucket first
          await supabase.storage.createBucket('avatars', { public: true });
          await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true });
        }

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
        avatarUrl = urlData.publicUrl + `?t=${Date.now()}`;
      }

      const { error } = await supabase.from('profiles').update({
        name: form.name.trim(),
        username: form.username.trim() || null,
        bio: form.bio.trim() || null,
        avatar: avatarUrl,
        github_url: form.github_url.trim() || null,
        linkedin_url: form.linkedin_url.trim() || null,
        portfolio_url: form.portfolio_url.trim() || null,
      }).eq('user_id', user.id);

      if (error) {
        if (error.message.includes('username')) {
          toast.error('Username is already taken');
        } else {
          toast.error('Failed to update profile');
        }
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
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
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
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-primary font-medium hover:underline"
            >
              Change Photo
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Display Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your name"
              maxLength={50}
              className="glass border-border"
            />
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Username</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
                placeholder="username"
                maxLength={20}
                className="glass border-border pl-8"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Bio</Label>
            <Textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Tell everyone about yourself..."
              maxLength={200}
              rows={3}
              className="glass border-border resize-none"
            />
            <p className="text-[10px] text-muted-foreground text-right">{form.bio.length}/200</p>
          </div>

          {/* Social Links */}
          <div className="space-y-3">
            <Label className="text-muted-foreground text-xs">Social Links</Label>
            <div className="flex items-center gap-2">
              <Github className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Input
                value={form.github_url}
                onChange={(e) => setForm({ ...form, github_url: e.target.value })}
                placeholder="https://github.com/username"
                className="glass border-border text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <Linkedin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Input
                value={form.linkedin_url}
                onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/username"
                className="glass border-border text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Input
                value={form.portfolio_url}
                onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })}
                placeholder="https://yourportfolio.com"
                className="glass border-border text-xs"
              />
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
