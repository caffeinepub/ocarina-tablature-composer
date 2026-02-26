import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type FingeringPattern = Array<boolean>;
export interface SoundSettings {
    reverb: {
        mix: number;
        amount: number;
        delay: number;
        reverbType: string;
    };
    tone: {
        character: number;
        warmth: number;
    };
    pitchOffset: {
        frequencyRatio: number;
        semitones: bigint;
        cents: bigint;
    };
}
export interface SoundPreset {
    soundSettings: SoundSettings;
    name: string;
    ocarinaImage?: string;
}
export interface Song {
    bars: bigint;
    name: string;
    description: string;
    annotations: string;
    notes: Array<[Note, bigint]>;
}
export interface OcarinaLayout {
    holes: Array<HoleLayout>;
    imageRef: string;
    mouthpiece: {
        thickness: number;
        length: number;
        position: {
            x: number;
            y: number;
        };
        orientation: number;
    };
}
export interface HoleLayout {
    size: number;
    position: {
        x: number;
        y: number;
    };
}
export interface Note {
    name: string;
    octave: bigint;
}
export interface backendInterface {
    addSong(song: Song): Promise<void>;
    getAllHoleLayouts(): Promise<Array<HoleLayout>>;
    getAllPresetSongs(): Promise<Array<Song>>;
    getAllSongs(): Promise<Array<Song>>;
    getAllSoundPresets(): Promise<Array<SoundPreset>>;
    getAllUsers(): Promise<Array<[Principal, string]>>;
    getCurrentOctave(): Promise<bigint>;
    getCustomOcarinaLayout(): Promise<OcarinaLayout | null>;
    getFingeringPattern(note: Note): Promise<FingeringPattern>;
    getHoleLayout(holeIndex: bigint): Promise<HoleLayout>;
    getNumberOfHoles(): Promise<bigint>;
    getSoundPreset(presetName: string): Promise<SoundPreset>;
    getSoundSettings(): Promise<SoundSettings>;
    getUsername(user: Principal): Promise<string>;
    registerUser(username: string): Promise<void>;
    saveSoundPreset(name: string, ocarinaImage: string | null): Promise<void>;
    setCurrentOctave(octave: bigint): Promise<void>;
    updateCustomOcarinaLayout(layout: OcarinaLayout): Promise<void>;
    updateFingeringPattern(note: Note, pattern: FingeringPattern): Promise<void>;
    updateSoundSettings(newSettings: SoundSettings): Promise<void>;
}
