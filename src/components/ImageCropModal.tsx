import { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, RotateCw } from 'lucide-react';

interface ImageCropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
    image.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.92);
  });
}

export default function ImageCropModal({ open, onOpenChange, imageSrc, onCropComplete }: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropDone = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
    onCropComplete(blob);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border max-w-sm p-4">
        <DialogHeader>
          <DialogTitle className="text-foreground text-sm">Crop Profile Picture</DialogTitle>
        </DialogHeader>

        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-background">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropDone}
          />
        </div>

        <div className="space-y-3 mt-2">
          <div className="flex items-center gap-2">
            <ZoomIn className="w-3.5 h-3.5 text-muted-foreground" />
            <Slider value={[zoom]} min={1} max={3} step={0.05} onValueChange={([v]) => setZoom(v)} className="flex-1" />
          </div>
          <div className="flex items-center gap-2">
            <RotateCw className="w-3.5 h-3.5 text-muted-foreground" />
            <Slider value={[rotation]} min={0} max={360} step={1} onValueChange={([v]) => setRotation(v)} className="flex-1" />
          </div>
        </div>

        <div className="flex gap-2 mt-2">
          <Button variant="outline" size="sm" className="flex-1 glass border-border" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" className="flex-1 gradient-primary glow-primary" onClick={handleConfirm}>Apply</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
