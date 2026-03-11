import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Upload, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentReelId?: string;
}

export default function UploadModal({ open, onOpenChange, parentReelId }: UploadModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async () => {
    if (!user || !file || !title || !category || !difficulty) {
      toast.error('Please fill all required fields');
      return;
    }

    setUploading(true);
    setProgress(20);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      setProgress(40);
      const { error: uploadError } = await supabase.storage
        .from('reels')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setProgress(70);
      const { data: { publicUrl } } = supabase.storage.from('reels').getPublicUrl(filePath);

      const { error: insertError } = await supabase.from('reels').insert({
        title,
        description,
        video_url: publicUrl,
        uploaded_by: user.id,
        category,
        difficulty,
        parent_reel_id: parentReelId || null,
      });

      if (insertError) throw insertError;

      // Update last upload date for streak
      await supabase.from('profiles').update({ last_upload_date: new Date().toISOString() }).eq('user_id', user.id);

      // Update logic for streaks, badges, reputation (XP is handled by DB triggers)
      await (supabase as any).rpc('update_streak', { target_user_id: user.id });
      await (supabase as any).rpc('assign_badge', { target_user_id: user.id });
      await (supabase as any).rpc('update_reputation', { target_user_id: user.id });

      setProgress(100);
      toast.custom((t) => (
        <div className="bg-[#1A1A1A] border border-white/10 border-l-4 border-l-green-500 rounded-lg p-4 flex flex-col gap-0.5 shadow-xl min-w-[250px]">
          <span className="text-lg font-bold text-green-400">+10 XP</span>
          <span className="text-xs text-gray-400">Reel Uploaded</span>
        </div>
      ), { position: 'bottom-right', duration: 3000 });

      onOpenChange(false);
      setTitle('');
      setDescription('');
      setCategory('');
      setDifficulty('');
      setFile(null);
      setProgress(0);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="gradient-text text-xl">
            {parentReelId ? 'Reply with Reel' : 'Upload Reel'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File picker */}
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-muted/30">
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <div className="flex items-center gap-2 text-secondary">
                <Video className="w-5 h-5" />
                <span className="text-sm font-medium">{file.name}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="w-8 h-8" />
                <span className="text-sm">Drop video or click to browse</span>
              </div>
            )}
          </label>

          <Input
            placeholder="Reel title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-muted/30 border-border"
          />

          <Textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-muted/30 border-border"
          />

          <div className="grid grid-cols-2 gap-3">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-muted/30 border-border">
                <SelectValue placeholder="Category *" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DSA">DSA</SelectItem>
                <SelectItem value="Web Dev">Web Dev</SelectItem>
                <SelectItem value="AI-ML">AI-ML</SelectItem>
                <SelectItem value="Hardware">Hardware</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="bg-muted/30 border-border">
                <SelectValue placeholder="Difficulty *" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {uploading && <Progress value={progress} className="h-2" />}

          <Button
            onClick={handleUpload}
            disabled={uploading || !file || !title || !category || !difficulty}
            className="w-full gradient-primary glow-primary"
          >
            {uploading ? 'Uploading...' : parentReelId ? 'Upload Reply' : 'Upload Reel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
