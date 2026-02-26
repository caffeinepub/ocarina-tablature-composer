import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { analyzeSheetMusic, type DetectedNote } from '../utils/sheetMusicAnalyzer';
import { Upload, FileMusic, CheckCircle, AlertTriangle, Loader2, Plus } from 'lucide-react';

interface SheetMusicUploaderProps {
  onNotesDetected: (notes: DetectedNote[]) => void;
}

export const SheetMusicUploader: React.FC<SheetMusicUploaderProps> = ({ onNotesDetected }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    notes: DetectedNote[];
    confidence: number;
    warnings: string[];
  } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(file);

    setIsAnalyzing(true);
    setProgress(10);
    setResult(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 15, 85));
    }, 200);

    try {
      const analysisResult = await analyzeSheetMusic(file);
      clearInterval(progressInterval);
      setProgress(100);
      setResult({
        notes: analysisResult.notes,
        confidence: analysisResult.overallConfidence,
        warnings: analysisResult.warnings,
      });
    } catch {
      clearInterval(progressInterval);
      setResult({
        notes: [],
        confidence: 0,
        warnings: ['Analysis failed. Please try a clearer image.'],
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleInsert = () => {
    if (result?.notes) {
      onNotesDetected(result.notes);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-accent/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <FileMusic className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
        <p className="font-heading text-foreground">Upload Sheet Music</p>
        <p className="text-sm text-muted-foreground font-body mt-1">
          PNG or JPG — the app will detect notes and convert to ocarina tablature
        </p>
        <Button variant="outline" size="sm" className="mt-3 font-ui" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
          <Upload className="w-4 h-4 mr-2" />
          Choose File
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Preview */}
      {previewUrl && (
        <div className="rounded-lg overflow-hidden border border-border">
          <img src={previewUrl} alt="Sheet music preview" className="w-full max-h-48 object-contain bg-white" />
        </div>
      )}

      {/* Progress */}
      {isAnalyzing && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-ui text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing sheet music...
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Results */}
      {result && !isAnalyzing && (
        <div className="space-y-3">
          {result.warnings.length > 0 && (
            <Alert variant={result.confidence < 0.5 ? 'destructive' : 'default'}>
              <AlertTriangle className="w-4 h-4" />
              <AlertTitle className="font-heading">Detection Notes</AlertTitle>
              <AlertDescription className="font-body text-sm">
                {result.warnings.map((w, i) => <div key={i}>{w}</div>)}
              </AlertDescription>
            </Alert>
          )}

          {result.notes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-ui text-foreground">
                  Detected {result.notes.length} notes
                  {' '}({(result.confidence * 100).toFixed(0)}% confidence)
                </span>
              </div>

              <div className="flex flex-wrap gap-1 p-2 bg-card/50 rounded border border-border max-h-24 overflow-y-auto">
                {result.notes.map((note, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-accent/20 text-accent-foreground rounded text-xs font-ui"
                  >
                    {note.name}{note.octave}
                  </span>
                ))}
              </div>

              <Button onClick={handleInsert} className="font-ui w-full">
                <Plus className="w-4 h-4 mr-2" />
                Insert {result.notes.length} Notes into Editor
              </Button>
            </div>
          )}

          {result.notes.length === 0 && (
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertTitle className="font-heading">No Notes Detected</AlertTitle>
              <AlertDescription className="font-body text-sm">
                Try uploading a clearer, high-contrast image of printed sheet music.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
};

export default SheetMusicUploader;
