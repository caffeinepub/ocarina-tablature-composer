import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from '@tanstack/react-router';
import { useGetSoundSettings, useAddSong, useGetAllSongs } from '../hooks/useQueries';
import type { Song, Note } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Play, Square, Save, Trash2, Music, Plus } from 'lucide-react';
import { toast } from 'sonner';
import TablatureSymbol from './TablatureSymbol';

// ── Audio Engine (Ocarina synthesis) ────────────────────────────────────────

const NOTE_FREQUENCIES: Record<string, number> = {
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46,
  G5: 783.99, A5: 880.00, B5: 987.77, C6: 1046.50,
  D6: 1174.66, E6: 1318.51, F6: 1396.91, G6: 1567.98,
};

function getNoteFrequency(noteName: string, octave: number, pitchRatio = 1.0): number {
  const key = `${noteName}${octave}`;
  const base = NOTE_FREQUENCIES[key] ?? 523.25;
  return base * pitchRatio;
}

function playOcarinaNote(
  audioCtx: AudioContext,
  frequency: number,
  duration: number,
  soundSettings: {
    toneCharacter: number;
    warmth: number;
    reverbMix: number;
    reverbAmount: number;
    reverbDelay: number;
  }
) {
  const { toneCharacter, warmth, reverbMix, reverbAmount, reverbDelay } = soundSettings;

  const gainNode = audioCtx.createGain();
  gainNode.connect(audioCtx.destination);

  // Ocarina-style: blend sine (pure) and triangle (warm) based on toneCharacter
  const sineOsc = audioCtx.createOscillator();
  const triOsc = audioCtx.createOscillator();
  const sineGain = audioCtx.createGain();
  const triGain = audioCtx.createGain();

  sineOsc.type = 'sine';
  sineOsc.frequency.value = frequency;
  triOsc.type = 'triangle';
  triOsc.frequency.value = frequency;

  // toneCharacter: 0 = pure sine, 1 = full triangle
  sineGain.gain.value = 1 - toneCharacter * 0.6;
  triGain.gain.value = toneCharacter * 0.4 + warmth * 0.2;

  sineOsc.connect(sineGain);
  triOsc.connect(triGain);

  // Reverb via delay node
  const dryGain = audioCtx.createGain();
  const wetGain = audioCtx.createGain();
  const delayNode = audioCtx.createDelay(1.0);
  const feedbackGain = audioCtx.createGain();

  dryGain.gain.value = 1 - reverbMix * 0.5;
  wetGain.gain.value = reverbMix * reverbAmount;
  delayNode.delayTime.value = reverbDelay * 0.3 + 0.05;
  feedbackGain.gain.value = reverbAmount * 0.4;

  sineGain.connect(dryGain);
  triGain.connect(dryGain);
  sineGain.connect(delayNode);
  triGain.connect(delayNode);
  delayNode.connect(feedbackGain);
  feedbackGain.connect(delayNode);
  delayNode.connect(wetGain);

  dryGain.connect(gainNode);
  wetGain.connect(gainNode);

  // Envelope: soft attack, sustain, gentle release (ocarina style)
  const now = audioCtx.currentTime;
  const attackTime = 0.04;
  const releaseTime = 0.12;
  const sustainLevel = 0.55;
  const durationSec = duration / 1000;

  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(sustainLevel, now + attackTime);
  gainNode.gain.setValueAtTime(sustainLevel, now + durationSec - releaseTime);
  gainNode.gain.linearRampToValueAtTime(0, now + durationSec);

  sineOsc.start(now);
  triOsc.start(now);
  sineOsc.stop(now + durationSec + 0.05);
  triOsc.stop(now + durationSec + 0.05);
}

// ── Fingering patterns for 4-hole ocarina (2x2) ──────────────────────────────

const DEFAULT_FINGERINGS: Record<string, boolean[]> = {
  C5: [false, false, false, false],
  D5: [true, false, false, false],
  E5: [true, true, false, false],
  F5: [true, true, true, false],
  G5: [true, true, true, true],
  A5: [false, true, true, true],
  B5: [false, false, true, true],
  C6: [false, false, false, true],
};

const PIANO_KEYS: { note: string; octave: number; key: string; isBlack: boolean }[] = [
  { note: 'C', octave: 5, key: 'a', isBlack: false },
  { note: 'D', octave: 5, key: 's', isBlack: false },
  { note: 'E', octave: 5, key: 'd', isBlack: false },
  { note: 'F', octave: 5, key: 'f', isBlack: false },
  { note: 'G', octave: 5, key: 'g', isBlack: false },
  { note: 'A', octave: 5, key: 'h', isBlack: false },
  { note: 'B', octave: 5, key: 'j', isBlack: false },
  { note: 'C', octave: 6, key: 'k', isBlack: false },
];

type NoteEntry = { note: string; octave: number; duration: number };

export default function SongEditor() {
  const location = useLocation();
  const { data: soundSettings } = useGetSoundSettings();
  const addSong = useAddSong();
  const { data: savedSongs } = useGetAllSongs();

  const [songName, setSongName] = useState('');
  const [songDescription, setSongDescription] = useState('');
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load preset song from router state
  useEffect(() => {
    const state = location.state as { presetSong?: Song } | null;
    if (state?.presetSong) {
      const preset = state.presetSong;
      setSongName(preset.name);
      setSongDescription(preset.description);
      setNotes(
        preset.notes.map(([n, dur]) => ({
          note: n.name,
          octave: Number(n.octave),
          duration: Number(dur),
        }))
      );
    }
  }, [location.state]);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const getSoundParams = useCallback(() => {
    return {
      toneCharacter: soundSettings?.tone.character ?? 0.5,
      warmth: soundSettings?.tone.warmth ?? 0.5,
      reverbMix: soundSettings?.reverb.mix ?? 0.5,
      reverbAmount: soundSettings?.reverb.amount ?? 0.5,
      reverbDelay: soundSettings?.reverb.delay ?? 0.2,
      pitchRatio: soundSettings?.pitchOffset.frequencyRatio ?? 1.0,
    };
  }, [soundSettings]);

  const playNote = useCallback((noteName: string, octave: number, duration = 400) => {
    const ctx = getAudioCtx();
    const params = getSoundParams();
    const freq = getNoteFrequency(noteName, octave, params.pitchRatio);
    playOcarinaNote(ctx, freq, duration, params);
  }, [getAudioCtx, getSoundParams]);

  const handleKeyPress = useCallback((noteName: string, octave: number) => {
    setActiveKey(`${noteName}${octave}`);
    playNote(noteName, octave, 400);
    setNotes((prev) => [...prev, { note: noteName, octave, duration: 400 }]);
    setTimeout(() => setActiveKey(null), 200);
  }, [playNote]);

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const k = PIANO_KEYS.find((pk) => pk.key === e.key.toLowerCase());
      if (k) handleKeyPress(k.note, k.octave);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress]);

  const handlePlayback = useCallback(async () => {
    if (isPlaying) {
      if (playbackRef.current) clearTimeout(playbackRef.current);
      setIsPlaying(false);
      return;
    }
    if (notes.length === 0) {
      toast.error('No notes to play');
      return;
    }

    setIsPlaying(true);
    const ctx = getAudioCtx();
    const params = getSoundParams();

    let offset = 0;
    for (const entry of notes) {
      const freq = getNoteFrequency(entry.note, entry.octave, params.pitchRatio);
      const startTime = ctx.currentTime + offset / 1000;
      const dur = entry.duration;

      // Schedule ocarina note
      const gainNode = ctx.createGain();
      gainNode.connect(ctx.destination);

      const sineOsc = ctx.createOscillator();
      const triOsc = ctx.createOscillator();
      const sineGain = ctx.createGain();
      const triGain = ctx.createGain();

      sineOsc.type = 'sine';
      sineOsc.frequency.value = freq;
      triOsc.type = 'triangle';
      triOsc.frequency.value = freq;

      sineGain.gain.value = 1 - params.toneCharacter * 0.6;
      triGain.gain.value = params.toneCharacter * 0.4 + params.warmth * 0.2;

      const dryGain = ctx.createGain();
      const wetGain = ctx.createGain();
      const delayNode = ctx.createDelay(1.0);
      const feedbackGain = ctx.createGain();

      dryGain.gain.value = 1 - params.reverbMix * 0.5;
      wetGain.gain.value = params.reverbMix * params.reverbAmount;
      delayNode.delayTime.value = params.reverbDelay * 0.3 + 0.05;
      feedbackGain.gain.value = params.reverbAmount * 0.4;

      sineGain.connect(dryGain);
      triGain.connect(dryGain);
      sineGain.connect(delayNode);
      triGain.connect(delayNode);
      delayNode.connect(feedbackGain);
      feedbackGain.connect(delayNode);
      delayNode.connect(wetGain);
      dryGain.connect(gainNode);
      wetGain.connect(gainNode);

      sineOsc.connect(sineGain);
      triOsc.connect(triGain);

      const attackTime = 0.04;
      const releaseTime = 0.12;
      const sustainLevel = 0.55;
      const durationSec = dur / 1000;

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(sustainLevel, startTime + attackTime);
      gainNode.gain.setValueAtTime(sustainLevel, startTime + durationSec - releaseTime);
      gainNode.gain.linearRampToValueAtTime(0, startTime + durationSec);

      sineOsc.start(startTime);
      triOsc.start(startTime);
      sineOsc.stop(startTime + durationSec + 0.05);
      triOsc.stop(startTime + durationSec + 0.05);

      offset += dur + 50;
    }

    const totalDuration = notes.reduce((sum, n) => sum + n.duration + 50, 0);
    playbackRef.current = setTimeout(() => setIsPlaying(false), totalDuration + 200);
  }, [isPlaying, notes, getAudioCtx, getSoundParams]);

  const handleSave = async () => {
    if (!songName.trim()) {
      toast.error('Please enter a song name');
      return;
    }
    if (notes.length === 0) {
      toast.error('Please add some notes');
      return;
    }
    try {
      const song: Song = {
        name: songName.trim(),
        description: songDescription.trim(),
        notes: notes.map((n) => [
          { name: n.note, octave: BigInt(n.octave) },
          BigInt(n.duration),
        ]),
        bars: BigInt(Math.ceil(notes.length / 4)),
        annotations: '',
      };
      await addSong.mutateAsync(song);
      toast.success(`Song "${songName}" saved!`);
    } catch {
      toast.error('Failed to save song');
    }
  };

  const removeNote = (index: number) => {
    setNotes((prev) => prev.filter((_, i) => i !== index));
  };

  const clearNotes = () => {
    setNotes([]);
    setSongName('');
    setSongDescription('');
  };

  return (
    <div className="flex flex-col gap-6 p-4 max-w-4xl mx-auto">
      {/* Song Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Music className="w-4 h-4 text-primary" />
            Song Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="song-name" className="text-sm">Name</Label>
            <Input
              id="song-name"
              placeholder="Enter song name..."
              value={songName}
              onChange={(e) => setSongName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="song-desc" className="text-sm">Description</Label>
            <Input
              id="song-desc"
              placeholder="Optional description..."
              value={songDescription}
              onChange={(e) => setSongDescription(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Piano Keyboard */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Play Notes (C5–C6)</CardTitle>
          <p className="text-xs text-muted-foreground">
            Click keys or press keyboard: A S D F G H J K
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-1 justify-center flex-wrap">
            {PIANO_KEYS.map((pk) => {
              const keyId = `${pk.note}${pk.octave}`;
              const isActive = activeKey === keyId;
              return (
                <button
                  key={keyId}
                  onClick={() => handleKeyPress(pk.note, pk.octave)}
                  className={`
                    flex flex-col items-center justify-end pb-2 rounded-b-md border-2 transition-all
                    w-12 h-28 text-xs font-semibold select-none
                    ${isActive
                      ? 'bg-primary text-primary-foreground border-primary scale-95'
                      : 'bg-card text-foreground border-border hover:bg-muted active:scale-95'
                    }
                  `}
                >
                  <span>{pk.note}{pk.octave}</span>
                  <span className="text-muted-foreground text-[10px]">{pk.key.toUpperCase()}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tablature / Notes */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Tablature
              <Badge variant="secondary" className="ml-2 text-xs">{notes.length} notes</Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePlayback}
                disabled={notes.length === 0}
                className="gap-1.5"
              >
                {isPlaying ? (
                  <><Square className="w-3 h-3" /> Stop</>
                ) : (
                  <><Play className="w-3 h-3" /> Play</>
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearNotes}
                disabled={notes.length === 0}
                className="gap-1.5 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Music className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No notes yet. Play the keyboard above to add notes.</p>
            </div>
          ) : (
            <ScrollArea className="h-40">
              <div className="flex flex-wrap gap-2 p-1">
                {notes.map((entry, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-1 group cursor-pointer"
                    onClick={() => removeNote(i)}
                    title="Click to remove"
                  >
                    <TablatureSymbol
                      fingeringPattern={DEFAULT_FINGERINGS[`${entry.note}${entry.octave}`] ?? [false, false, false, false]}
                      noteName={entry.note}
                      noteOctave={entry.octave}
                      size="sm"
                    />
                    <span className="text-[9px] text-muted-foreground group-hover:text-destructive transition-colors">
                      {entry.duration}ms
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex gap-3 justify-end">
        <Button
          onClick={handleSave}
          disabled={addSong.isPending || notes.length === 0 || !songName.trim()}
          className="gap-2"
        >
          {addSong.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Song
        </Button>
      </div>

      {/* Saved Songs */}
      {savedSongs && savedSongs.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Your Saved Songs
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {savedSongs.map((song) => (
                <Card
                  key={song.name}
                  className="cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => {
                    setSongName(song.name);
                    setSongDescription(song.description);
                    setNotes(
                      song.notes.map(([n, dur]) => ({
                        note: n.name,
                        octave: Number(n.octave),
                        duration: Number(dur),
                      }))
                    );
                  }}
                >
                  <CardContent className="p-3">
                    <p className="font-medium text-sm">{song.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{song.notes.length} notes</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
