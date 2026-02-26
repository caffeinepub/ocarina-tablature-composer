// Web Audio API engine for ocarina and piano sounds

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

// Note frequencies (A4 = 440 Hz)
const NOTE_FREQ_MAP: Record<string, number> = {
  C: 261.63,
  D: 293.66,
  E: 329.63,
  F: 349.23,
  G: 392.0,
  A: 440.0,
  B: 493.88,
};

export function getNoteFrequency(
  noteName: string,
  octave: number,
  pitchOffsetSemitones: number = 0,
  pitchOffsetCents: number = 0
): number {
  const baseFreq = NOTE_FREQ_MAP[noteName] ?? 261.63;
  // Adjust for octave (C4 = 261.63 Hz is octave 4)
  const octaveMultiplier = Math.pow(2, octave - 4);
  const semitoneRatio = Math.pow(2, pitchOffsetSemitones / 12);
  const centRatio = Math.pow(2, pitchOffsetCents / 1200);
  return baseFreq * octaveMultiplier * semitoneRatio * centRatio;
}

export interface PlayNoteOptions {
  frequency: number;
  duration?: number;
  tone?: number;       // 0-1, warmth/brightness
  reverb?: number;     // 0-1
  volume?: number;     // 0-1
}

export function playOcarinaNote(options: PlayNoteOptions): void {
  const ctx = getAudioContext();
  const { frequency, duration = 0.5, tone = 0.5, reverb = 0.3, volume = 0.6 } = options;

  const now = ctx.currentTime;

  // Main oscillator (flute-like)
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filterNode = ctx.createBiquadFilter();

  // Ocarina has a warm, breathy tone - use sine + slight triangle blend
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(frequency, now);

  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(frequency * 2, now); // harmonic
  const osc2Gain = ctx.createGain();
  osc2Gain.gain.setValueAtTime(0.08 * (1 - tone), now);

  // Low-pass filter for warmth
  filterNode.type = 'lowpass';
  filterNode.frequency.setValueAtTime(800 + tone * 2400, now);
  filterNode.Q.setValueAtTime(0.5, now);

  // Envelope
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(volume, now + 0.02);
  gainNode.gain.setValueAtTime(volume, now + duration - 0.05);
  gainNode.gain.linearRampToValueAtTime(0, now + duration);

  // Simple reverb via delay
  if (reverb > 0.05) {
    const delayNode = ctx.createDelay(0.5);
    const delayGain = ctx.createGain();
    delayNode.delayTime.setValueAtTime(0.15, now);
    delayGain.gain.setValueAtTime(reverb * 0.4, now);

    osc1.connect(filterNode);
    osc2.connect(osc2Gain);
    osc2Gain.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(ctx.destination);
    gainNode.connect(delayNode);
    delayNode.connect(delayGain);
    delayGain.connect(ctx.destination);
  } else {
    osc1.connect(filterNode);
    osc2.connect(osc2Gain);
    osc2Gain.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(ctx.destination);
  }

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + duration);
  osc2.stop(now + duration);
}

export function playPianoNote(frequency: number, duration: number = 0.8): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filterNode = ctx.createBiquadFilter();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(frequency, now);

  filterNode.type = 'lowpass';
  filterNode.frequency.setValueAtTime(3000, now);

  // Piano-like envelope: quick attack, longer decay
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.7, now + 0.005);
  gainNode.gain.exponentialRampToValueAtTime(0.3, now + 0.1);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(filterNode);
  filterNode.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration);
}
