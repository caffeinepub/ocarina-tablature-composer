import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Song, Note, FingeringPattern, OcarinaLayout, SoundSettings, SoundPreset } from '../backend';

export const NOTE_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

export const OCTAVE_RANGES: { label: string; value: number }[] = [
  { label: 'C3–C4', value: 3 },
  { label: 'C4–C5', value: 4 },
  { label: 'C5–C6', value: 5 },
  { label: 'C6–C7', value: 6 },
];

export function getDefaultFingeringPattern(noteName?: string): FingeringPattern {
  const defaults: Record<string, boolean[]> = {
    C: [false, false, false, false],
    D: [true, false, false, false],
    E: [true, true, false, false],
    F: [true, true, true, false],
    G: [true, true, true, true],
    A: [false, true, true, true],
    B: [false, false, true, true],
  };
  if (noteName && defaults[noteName]) {
    return defaults[noteName];
  }
  return [false, false, false, false];
}

// ── Fingering Patterns ──────────────────────────────────────────────────────

export function useGetFingeringPattern(note: Note) {
  const { actor, isFetching } = useActor();
  return useQuery<FingeringPattern>({
    queryKey: ['fingeringPattern', note.name, note.octave.toString()],
    queryFn: async () => {
      if (!actor) return getDefaultFingeringPattern(note.name);
      return actor.getFingeringPattern(note);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateFingeringPattern() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ note, pattern }: { note: Note; pattern: FingeringPattern }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.updateFingeringPattern(note, pattern);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['fingeringPattern', variables.note.name, variables.note.octave.toString()],
      });
    },
  });
}

// ── Songs ───────────────────────────────────────────────────────────────────

export function useGetAllSongs() {
  const { actor, isFetching } = useActor();
  return useQuery<Song[]>({
    queryKey: ['songs'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSongs();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddSong() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (song: Song) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.addSong(song);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
    },
  });
}

export function useGetAllPresetSongs() {
  const { actor, isFetching } = useActor();
  return useQuery<Song[]>({
    queryKey: ['presetSongs'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPresetSongs();
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Ocarina Layout ──────────────────────────────────────────────────────────

export function useGetCustomOcarinaLayout() {
  const { actor, isFetching } = useActor();
  return useQuery<OcarinaLayout | null>({
    queryKey: ['customOcarinaLayout'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCustomOcarinaLayout();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateCustomOcarinaLayout() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (layout: OcarinaLayout) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.updateCustomOcarinaLayout(layout);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customOcarinaLayout'] });
    },
  });
}

// ── Sound Settings ──────────────────────────────────────────────────────────

export function useGetSoundSettings() {
  const { actor, isFetching } = useActor();
  return useQuery<SoundSettings>({
    queryKey: ['soundSettings'],
    queryFn: async () => {
      if (!actor) {
        return {
          tone: { character: 0.5, warmth: 0.5 },
          reverb: { amount: 0.5, reverbType: 'standard', delay: 0.2, mix: 0.5 },
          pitchOffset: { cents: BigInt(0), semitones: BigInt(0), frequencyRatio: 1.0 },
        };
      }
      return actor.getSoundSettings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateSoundSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: SoundSettings) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.updateSoundSettings(settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soundSettings'] });
    },
  });
}

// ── Sound Presets ───────────────────────────────────────────────────────────

export function useGetAllSoundPresets() {
  const { actor, isFetching } = useActor();
  return useQuery<SoundPreset[]>({
    queryKey: ['soundPresets'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSoundPresets();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetSoundPreset(presetName: string) {
  const { actor, isFetching } = useActor();
  return useQuery<SoundPreset>({
    queryKey: ['soundPreset', presetName],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.getSoundPreset(presetName);
    },
    enabled: !!actor && !isFetching && !!presetName,
  });
}

export function useSaveSoundPreset() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, ocarinaImage }: { name: string; ocarinaImage: string | null }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.saveSoundPreset(name, ocarinaImage);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soundPresets'] });
    },
  });
}

// ── Octave ──────────────────────────────────────────────────────────────────

export function useGetCurrentOctave() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ['currentOctave'],
    queryFn: async () => {
      if (!actor) return BigInt(5);
      return actor.getCurrentOctave();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetCurrentOctave() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (octave: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.setCurrentOctave(octave);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentOctave'] });
    },
  });
}

// ── Users ───────────────────────────────────────────────────────────────────

export function useRegisterUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.registerUser(username);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useGetAllUsers() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor && !isFetching,
  });
}
