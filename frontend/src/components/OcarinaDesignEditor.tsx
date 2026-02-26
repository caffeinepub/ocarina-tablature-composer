import { useState, useRef, useEffect, useCallback } from 'react';
import { useGetCustomOcarinaLayout, useUpdateCustomOcarinaLayout } from '../hooks/useQueries';
import type { OcarinaLayout, HoleLayout } from '../backend';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Loader2, Save, Upload, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

// 4-hole 2x2 default layout (normalized 0-1 within a 400x300 canvas)
const DEFAULT_HOLES: HoleLayout[] = [
  { position: { x: 0.35, y: 0.38 }, size: 0.06 }, // top-left
  { position: { x: 0.65, y: 0.38 }, size: 0.06 }, // top-right
  { position: { x: 0.35, y: 0.62 }, size: 0.06 }, // bottom-left
  { position: { x: 0.65, y: 0.62 }, size: 0.06 }, // bottom-right
];

const CANVAS_W = 400;
const CANVAS_H = 300;

interface OcarinaDesignEditorProps {
  presetImageUrl?: string | null;
}

export default function OcarinaDesignEditor({ presetImageUrl }: OcarinaDesignEditorProps) {
  const { data: savedLayout, isLoading } = useGetCustomOcarinaLayout();
  const updateLayout = useUpdateCustomOcarinaLayout();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [holes, setHoles] = useState<HoleLayout[]>(DEFAULT_HOLES);
  const [selectedHole, setSelectedHole] = useState<number | null>(null);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [bgImageRef, setBgImageRef] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Load saved layout
  useEffect(() => {
    if (savedLayout) {
      if (savedLayout.holes.length === 4) {
        setHoles(savedLayout.holes);
      }
      if (savedLayout.imageRef) {
        setBgImageRef(savedLayout.imageRef);
        const img = new Image();
        img.onload = () => setBgImage(img);
        img.src = `/assets/generated/${savedLayout.imageRef}`;
      }
    }
  }, [savedLayout]);

  // Load preset image when provided
  useEffect(() => {
    if (presetImageUrl) {
      const img = new Image();
      img.onload = () => setBgImage(img);
      img.src = presetImageUrl;
      // Extract filename from URL for imageRef
      const parts = presetImageUrl.split('/');
      setBgImageRef(parts[parts.length - 1] ?? '');
    }
  }, [presetImageUrl]);

  // Draw canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Background
    if (bgImage) {
      ctx.drawImage(bgImage, 0, 0, CANVAS_W, CANVAS_H);
    } else {
      // Draw default ocarina body
      ctx.fillStyle = '#c8a96e';
      ctx.beginPath();
      ctx.ellipse(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W * 0.42, CANVAS_H * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8b6914';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw 4 holes
    holes.forEach((hole, i) => {
      const cx = hole.position.x * CANVAS_W;
      const cy = hole.position.y * CANVAS_H;
      const r = hole.size * Math.min(CANVAS_W, CANVAS_H);

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = selectedHole === i ? '#4a90d9' : '#1a1a1a';
      ctx.fill();
      ctx.strokeStyle = selectedHole === i ? '#2563eb' : '#555';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.round(r * 0.9)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${i + 1}`, cx, cy);
    });
  }, [holes, selectedHole, bgImage]);

  useEffect(() => {
    draw();
  }, [draw]);

  const getHoleAtPoint = (x: number, y: number): number => {
    for (let i = holes.length - 1; i >= 0; i--) {
      const hole = holes[i];
      const cx = hole.position.x * CANVAS_W;
      const cy = hole.position.y * CANVAS_H;
      const r = hole.size * Math.min(CANVAS_W, CANVAS_H);
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist <= r + 4) return i;
    }
    return -1;
  };

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasPoint(e);
    const idx = getHoleAtPoint(x, y);
    if (idx >= 0) {
      setSelectedHole(idx);
      setIsDragging(true);
      const hole = holes[idx];
      dragOffsetRef.current = {
        x: x - hole.position.x * CANVAS_W,
        y: y - hole.position.y * CANVAS_H,
      };
    } else {
      setSelectedHole(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || selectedHole === null) return;
    const { x, y } = getCanvasPoint(e);
    const newX = Math.max(0.05, Math.min(0.95, (x - dragOffsetRef.current.x) / CANVAS_W));
    const newY = Math.max(0.05, Math.min(0.95, (y - dragOffsetRef.current.y) / CANVAS_H));
    setHoles((prev) =>
      prev.map((h, i) =>
        i === selectedHole ? { ...h, position: { x: newX, y: newY } } : h
      )
    );
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => setBgImage(img);
      img.src = ev.target?.result as string;
      setBgImageRef(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      const layout: OcarinaLayout = {
        holes,
        imageRef: bgImageRef,
        mouthpiece: {
          position: { x: 0.1, y: 0.5 },
          orientation: 0,
          length: 0.15,
          thickness: 0.05,
        },
      };
      await updateLayout.mutateAsync(layout);
      toast.success('Layout saved!');
    } catch {
      toast.error('Failed to save layout');
    }
  };

  const handleReset = () => {
    setHoles(DEFAULT_HOLES);
    setSelectedHole(null);
    setBgImage(null);
    setBgImageRef('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Ocarina Design Editor</h2>
          <p className="text-sm text-muted-foreground">
            Drag holes to reposition. 4-hole 2×2 parallel layout.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
            <RotateCcw className="w-3 h-3" />
            Reset
          </Button>
          <Button size="sm" onClick={handleSave} disabled={updateLayout.isPending} className="gap-1.5">
            {updateLayout.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Save className="w-3 h-3" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <Card>
        <CardContent className="p-4">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="w-full rounded-lg border border-border cursor-crosshair"
            style={{ maxHeight: 300, objectFit: 'contain' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Image Upload */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Background Image</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-2 cursor-pointer">
              <Button variant="outline" size="sm" className="gap-1.5 pointer-events-none">
                <Upload className="w-3 h-3" />
                Upload Image
              </Button>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
            {bgImageRef && (
              <p className="text-xs text-muted-foreground mt-2 truncate">{bgImageRef}</p>
            )}
          </CardContent>
        </Card>

        {/* Selected Hole Controls */}
        {selectedHole !== null && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Hole {selectedHole + 1} Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Size</span>
                  <span>{holes[selectedHole]?.size.toFixed(3)}</span>
                </div>
                <Slider
                  min={0.02}
                  max={0.12}
                  step={0.005}
                  value={[holes[selectedHole]?.size ?? 0.06]}
                  onValueChange={([v]) =>
                    setHoles((prev) =>
                      prev.map((h, i) => (i === selectedHole ? { ...h, size: v } : h))
                    )
                  }
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
