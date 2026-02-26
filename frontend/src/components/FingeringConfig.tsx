import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetCurrentOctave, useSetCurrentOctave, useUpdateFingeringPattern, OCTAVE_RANGES, NOTE_NAMES, getDefaultFingeringPattern } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import OcarinaVisual from './OcarinaVisual';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Note } from '../backend';

interface NoteFingeringState {
  noteName: string;
  pattern: boolean[];
}

export const FingeringConfig: React.FC = () => {
  const { actor } = useActor();
  const { data: currentOctave } = useGetCurrentOctave();
  const setOctave = useSetCurrentOctave();
  const updatePattern = useUpdateFingeringPattern();

  const [selectedOctave, setSelectedOctave] = useState<number>(4);
  const [notePatterns, setNotePatterns] = useState<NoteFingeringState[]>(
    NOTE_NAMES.map(name => ({
      noteName: name,
      pattern: getDefaultFingeringPattern(name),
    }))
  );
  const [selectedNote, setSelectedNote] = useState<string>('C');
  const [isSaving, setIsSaving] = useState(false);

  // Load current octave
  useEffect(() => {
    if (currentOctave !== undefined) {
      setSelectedOctave(Number(currentOctave));
    }
  }, [currentOctave]);

  // Load fingering patterns from backend
  useEffect(() => {
    if (!actor) return;
    const loadPatterns = async () => {
      const loaded: NoteFingeringState[] = [];
      for (const name of NOTE_NAMES) {
        const note: Note = { name, octave: BigInt(4) };
        try {
          const pattern = await actor.getFingeringPattern(note);
          loaded.push({ noteName: name, pattern: [...pattern] });
        } catch {
          loaded.push({ noteName: name, pattern: getDefaultFingeringPattern(name) });
        }
      }
      setNotePatterns(loaded);
    };
    loadPatterns();
  }, [actor]);

  const currentPattern = notePatterns.find(n => n.noteName === selectedNote)?.pattern ?? [false, false, false, false];

  const toggleHole = (holeIndex: number) => {
    setNotePatterns(prev => prev.map(n => {
      if (n.noteName !== selectedNote) return n;
      const newPattern = [...n.pattern];
      newPattern[holeIndex] = !newPattern[holeIndex];
      return { ...n, pattern: newPattern };
    }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // Save all note patterns
      for (const noteState of notePatterns) {
        const note: Note = { name: noteState.noteName, octave: BigInt(4) };
        await updatePattern.mutateAsync({ note, pattern: noteState.pattern });
      }
      // Save octave
      await setOctave.mutateAsync(BigInt(selectedOctave));
      toast.success('Fingering configuration saved!');
    } catch {
      toast.error('Failed to save configuration. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const holeLabels = ['Hole 1\n(smallest)', 'Hole 2', 'Hole 3\n(largest)', 'Hole 4\n(largest)'];

  return (
    <div className="space-y-6">
      {/* Octave Selector */}
      <div className="space-y-2">
        <Label className="font-heading text-base text-foreground">Active Octave</Label>
        <p className="text-sm text-muted-foreground font-body">
          Select the octave range for playback. Fingering patterns remain the same across all octaves.
        </p>
        <Select
          value={String(selectedOctave)}
          onValueChange={(v) => setSelectedOctave(Number(v))}
        >
          <SelectTrigger className="w-48 font-ui">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OCTAVE_RANGES.map(range => (
              <SelectItem key={range.value} value={String(range.value)} className="font-ui">
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Note Selector */}
      <div className="space-y-2">
        <Label className="font-heading text-base text-foreground">Configure Fingering per Note</Label>
        <p className="text-sm text-muted-foreground font-body">
          Click a note to edit its hole pattern. Open holes are shown as dark circles.
        </p>
        <div className="flex gap-2 flex-wrap">
          {NOTE_NAMES.map(name => (
            <button
              key={name}
              onClick={() => setSelectedNote(name)}
              className={`w-10 h-10 rounded-full font-heading text-sm font-semibold transition-all border-2 ${
                selectedNote === name
                  ? 'bg-accent text-accent-foreground border-accent shadow-instrument'
                  : 'bg-card text-foreground border-border hover:border-accent/50'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Hole Toggle Grid */}
      <div className="space-y-3">
        <Label className="font-heading text-base text-foreground">
          Holes for note <span className="text-accent-foreground font-bold">{selectedNote}</span>
        </Label>
        <div className="flex gap-4 items-start">
          {/* Interactive hole grid */}
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => {
              const isOpen = currentPattern[i] ?? false;
              return (
                <button
                  key={i}
                  onClick={() => toggleHole(i)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                    isOpen
                      ? 'border-ink bg-ink/10'
                      : 'border-border bg-parchment-200 hover:border-ink/40'
                  }`}
                >
                  <div
                    className={`rounded-full transition-all ${
                      isOpen ? 'bg-ink-dark' : 'bg-parchment-300 border-2 border-ink-light'
                    }`}
                    style={{
                      width: i === 0 ? 20 : i === 1 ? 24 : 30,
                      height: i === 0 ? 20 : i === 1 ? 24 : 30,
                    }}
                  />
                  <span className="text-[10px] font-ui text-muted-foreground text-center leading-tight whitespace-pre-line">
                    {holeLabels[i]}
                  </span>
                  <span className="text-[10px] font-ui font-semibold text-foreground">
                    {isOpen ? 'OPEN' : 'CLOSED'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Live preview */}
          <div className="flex flex-col items-center gap-2">
            <Label className="text-xs font-ui text-muted-foreground">Preview</Label>
            <OcarinaVisual
              holeStates={currentPattern}
              size="md"
              showLabels
            />
            <span className="text-sm font-heading text-foreground">{selectedNote}</span>
          </div>
        </div>
      </div>

      {/* All notes preview */}
      <div className="space-y-2">
        <Label className="font-heading text-sm text-muted-foreground">All Notes Overview</Label>
        <div className="flex gap-3 flex-wrap p-3 bg-card/50 rounded-lg border border-border">
          {notePatterns.map(({ noteName, pattern }) => (
            <div
              key={noteName}
              className={`flex flex-col items-center gap-1 cursor-pointer p-2 rounded transition-colors ${
                selectedNote === noteName ? 'bg-accent/20' : 'hover:bg-muted/50'
              }`}
              onClick={() => setSelectedNote(noteName)}
            >
              <OcarinaVisual holeStates={pattern} size="sm" />
              <span className="text-xs font-heading font-semibold text-foreground">{noteName}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSaveAll}
        disabled={isSaving}
        size="lg"
        className="font-ui"
      >
        {isSaving ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving Configuration...</>
        ) : (
          <><Save className="w-4 h-4 mr-2" /> Save Fingering Configuration</>
        )}
      </Button>
    </div>
  );
};

export default FingeringConfig;
