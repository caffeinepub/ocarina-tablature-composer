import React, { useEffect, useCallback, useState } from 'react';
import { playPianoNote, getNoteFrequency } from '../utils/audioEngine';

interface PianoKey {
  note: string;
  octave: number;
  key: string;
  isBlack: boolean;
}

const PIANO_KEYS: PianoKey[] = [
  { note: 'C', octave: 5, key: 'a', isBlack: false },
  { note: 'D', octave: 5, key: 's', isBlack: false },
  { note: 'E', octave: 5, key: 'd', isBlack: false },
  { note: 'F', octave: 5, key: 'f', isBlack: false },
  { note: 'G', octave: 5, key: 'g', isBlack: false },
  { note: 'A', octave: 5, key: 'h', isBlack: false },
  { note: 'B', octave: 5, key: 'j', isBlack: false },
  { note: 'C', octave: 6, key: 'k', isBlack: false },
];

interface PianoKeyboardProps {
  isRecording?: boolean;
  onNotePlay?: (note: string, octave: number) => void;
  pitchOffsetSemitones?: number;
  pitchOffsetCents?: number;
}

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  isRecording = false,
  onNotePlay,
  pitchOffsetSemitones = 0,
  pitchOffsetCents = 0,
}) => {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  const playKey = useCallback((pianoKey: PianoKey) => {
    const freq = getNoteFrequency(pianoKey.note, pianoKey.octave, pitchOffsetSemitones, pitchOffsetCents);
    playPianoNote(freq, 0.8);
    if (isRecording && onNotePlay) {
      onNotePlay(pianoKey.note, pianoKey.octave);
    }
  }, [isRecording, onNotePlay, pitchOffsetSemitones, pitchOffsetCents]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.repeat) return;
    const pianoKey = PIANO_KEYS.find(k => k.key === e.key.toLowerCase());
    if (!pianoKey) return;
    setPressedKeys(prev => new Set([...prev, pianoKey.key]));
    playKey(pianoKey);
  }, [playKey]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const pianoKey = PIANO_KEYS.find(k => k.key === e.key.toLowerCase());
    if (!pianoKey) return;
    setPressedKeys(prev => {
      const next = new Set(prev);
      next.delete(pianoKey.key);
      return next;
    });
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return (
    <div className="space-y-2">
      {isRecording && (
        <div className="flex items-center gap-2 text-sm font-ui text-destructive">
          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          Recording — press keys to add notes
        </div>
      )}

      <div className="flex gap-1 p-4 bg-ink-dark rounded-xl shadow-instrument select-none">
        {PIANO_KEYS.map((pianoKey) => {
          const isPressed = pressedKeys.has(pianoKey.key);
          return (
            <button
              key={`${pianoKey.note}${pianoKey.octave}`}
              className={`
                relative flex flex-col justify-end items-center pb-2 rounded-b-md
                transition-all duration-75 border border-ink-dark
                font-ui text-xs font-semibold
                ${isPressed
                  ? 'translate-y-1 shadow-none bg-amber-warm text-ink-dark'
                  : 'shadow-instrument bg-parchment-50 text-ink hover:bg-parchment-200'
                }
              `}
              style={{ width: 52, height: 140 }}
              onMouseDown={() => {
                setPressedKeys(prev => new Set([...prev, pianoKey.key]));
                playKey(pianoKey);
              }}
              onMouseUp={() => {
                setPressedKeys(prev => {
                  const next = new Set(prev);
                  next.delete(pianoKey.key);
                  return next;
                });
              }}
              onMouseLeave={() => {
                setPressedKeys(prev => {
                  const next = new Set(prev);
                  next.delete(pianoKey.key);
                  return next;
                });
              }}
            >
              <span className="text-[10px] text-muted-foreground mb-1">
                {pianoKey.note}{pianoKey.octave}
              </span>
              <kbd className={`
                px-1.5 py-0.5 rounded text-[11px] font-bold border
                ${isPressed
                  ? 'bg-ink-dark text-parchment-50 border-ink-dark'
                  : 'bg-parchment-200 text-ink border-border'
                }
              `}>
                {pianoKey.key.toUpperCase()}
              </kbd>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground font-ui text-center">
        Piano: C5–C6 · Keys A S D F G H J K
      </p>
    </div>
  );
};

export default PianoKeyboard;
