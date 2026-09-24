import { Injectable, signal } from '@angular/core';

interface ToneOptions {
  readonly frequency: number;
  readonly duration: number;
  readonly startOffset?: number;
  readonly endFrequency?: number;
  readonly gain?: number;
  readonly type?: OscillatorType;
  readonly destination?: AudioNode;
  readonly attack?: number;
  readonly release?: number;
  readonly sustain?: number;
}

interface NoiseOptions {
  readonly duration: number;
  readonly startOffset?: number;
  readonly gain?: number;
  readonly filterFrequency?: number;
  readonly filterType?: BiquadFilterType;
}

const notes = {
  F2: 87.31,
  G2: 98,
  A2: 110,
  C3: 130.81,
  A3: 220,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392,
  A4: 440,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880,
} as const;

const musicBars = [
  {
    chord: [notes.C4, notes.E4, notes.G4],
    bass: notes.C3,
    melody: [notes.E5, notes.G5, null, notes.E5, notes.D5, notes.C5, notes.D5, null],
  },
  {
    chord: [notes.C4, notes.E4, notes.A4],
    bass: notes.A2,
    melody: [notes.E5, notes.A5, notes.G5, notes.E5, notes.C5, null, notes.B4, null],
  },
  {
    chord: [notes.C4, notes.F4, notes.A4],
    bass: notes.F2,
    melody: [notes.A4, notes.C5, notes.F5, notes.E5, notes.C5, notes.A4, notes.G4, null],
  },
  {
    chord: [notes.B3, notes.D4, notes.G4],
    bass: notes.G2,
    melody: [notes.B4, notes.D5, notes.G5, notes.F5, notes.D5, notes.B4, notes.D5, null],
  },
] as const;

@Injectable({ providedIn: 'root' })
export class GameAudioService {
  private static readonly mutedStorageKey = 'girsu-game-audio-muted';
  private static readonly musicIntervalMs = 300;

  readonly muted = signal(this.readMutedPreference());

  private context?: AudioContext;
  private masterGain?: GainNode;
  private sfxGain?: GainNode;
  private musicGain?: GainNode;
  private musicTimer?: ReturnType<typeof setInterval>;
  private activeMusicStageId?: string;
  private musicStep = 0;

  unlock(): void {
    if (this.muted()) {
      return;
    }

    const context = this.ensureContext();

    if (!context) {
      return;
    }

    this.resumeContext(context);
  }

  toggleMuted(): void {
    const nextMuted = !this.muted();
    this.muted.set(nextMuted);
    this.saveMutedPreference(nextMuted);
    this.updateMasterVolume();

    if (nextMuted) {
      this.clearMusicTimer();
      return;
    }

    this.unlock();

    if (this.activeMusicStageId) {
      this.startBackground(this.activeMusicStageId);
    }
  }

  startBackground(stageId: string): void {
    this.activeMusicStageId = stageId;

    if (this.muted()) {
      this.clearMusicTimer();
      return;
    }

    const context = this.ensureContext();

    if (!context) {
      return;
    }

    this.resumeContext(context);
    this.clearMusicTimer();
    this.musicStep = 0;
    this.playMusicStep();
    this.musicTimer = setInterval(() => this.playMusicStep(), GameAudioService.musicIntervalMs);
  }

  stopBackground(): void {
    this.activeMusicStageId = undefined;
    this.clearMusicTimer();
  }

  playCorrectDrop(): void {
    this.playNoise({
      duration: 0.055,
      gain: 0.035,
      filterFrequency: 560,
      filterType: 'lowpass',
    });
    this.playTone({ frequency: 523, duration: 0.09, gain: 0.075, type: 'triangle' });
    this.playTone({
      frequency: 784,
      duration: 0.12,
      startOffset: 0.055,
      gain: 0.082,
      type: 'sine',
    });
    this.playTone({
      frequency: 1046,
      duration: 0.12,
      startOffset: 0.12,
      gain: 0.052,
      type: 'sine',
    });
  }

  playWrongDrop(): void {
    this.playTone({
      frequency: 220,
      endFrequency: 116,
      duration: 0.22,
      gain: 0.095,
      type: 'sawtooth',
      sustain: 0.42,
    });
    this.playTone({
      frequency: 146,
      endFrequency: 96,
      duration: 0.18,
      startOffset: 0.08,
      gain: 0.06,
      type: 'triangle',
      sustain: 0.35,
    });
  }

  playGameComplete(): void {
    this.stopBackground();
    this.playConfettiBurst(0.02);
    this.playTone({
      frequency: 523,
      duration: 0.14,
      startOffset: 0,
      gain: 0.075,
      type: 'triangle',
    });
    this.playTone({
      frequency: 659,
      duration: 0.14,
      startOffset: 0.12,
      gain: 0.08,
      type: 'triangle',
    });
    this.playTone({
      frequency: 784,
      duration: 0.18,
      startOffset: 0.24,
      gain: 0.09,
      type: 'triangle',
    });
    this.playTone({
      frequency: 1046,
      duration: 0.34,
      startOffset: 0.4,
      gain: 0.105,
      type: 'sine',
      sustain: 0.52,
    });
  }

  private playMusicStep(): void {
    if (this.muted() || !this.activeMusicStageId) {
      this.clearMusicTimer();
      return;
    }

    const stepsPerBar = musicBars[0].melody.length;
    const stepInBar = this.musicStep % stepsPerBar;
    const bar = musicBars[Math.floor(this.musicStep / stepsPerBar) % musicBars.length];
    const melodyNote = bar.melody[stepInBar];

    if (melodyNote) {
      this.playTone({
        frequency: melodyNote,
        duration: stepInBar === 2 ? 0.26 : 0.38,
        gain: 0.075,
        type: 'triangle',
        destination: this.musicGain,
        attack: 0.018,
        release: 0.18,
        sustain: 0.42,
      });
    }

    if (stepInBar === 0) {
      bar.chord.forEach((frequency) => {
        this.playTone({
          frequency,
          duration: 2.35,
          gain: 0.025,
          type: 'sine',
          destination: this.musicGain,
          attack: 0.12,
          release: 0.65,
          sustain: 0.5,
        });
      });
    }

    if (stepInBar === 0 || stepInBar === 4) {
      this.playTone({
        frequency: bar.bass,
        duration: stepInBar === 0 ? 1.1 : 0.7,
        gain: 0.07,
        type: 'triangle',
        destination: this.musicGain,
        attack: 0.025,
        release: 0.35,
        sustain: 0.32,
      });
    }

    this.musicStep += 1;
  }

  private playConfettiBurst(startOffset: number): void {
    this.playNoise({
      duration: 0.32,
      startOffset,
      gain: 0.028,
      filterFrequency: 1800,
      filterType: 'highpass',
    });

    [1175, 1397, 1568, 1760, 2093].forEach((frequency, index) => {
      this.playTone({
        frequency,
        duration: 0.08,
        startOffset: startOffset + index * 0.045,
        gain: 0.038,
        type: 'triangle',
        attack: 0.004,
        release: 0.055,
      });
    });
  }

  private playTone(options: ToneOptions): void {
    if (this.muted()) {
      return;
    }

    const context = this.ensureContext();
    const destination = options.destination ?? this.sfxGain;

    if (!context || !destination) {
      return;
    }

    this.resumeContext(context);

    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const startAt = context.currentTime + (options.startOffset ?? 0);
    const duration = Math.max(0.03, options.duration);
    const endAt = startAt + duration;
    const attack = Math.min(options.attack ?? 0.008, duration * 0.45);
    const release = Math.min(options.release ?? 0.08, duration * 0.75);
    const releaseAt = Math.max(startAt + attack, endAt - release);
    const peakGain = options.gain ?? 0.1;
    const sustainGain = peakGain * (options.sustain ?? 0.32);

    oscillator.type = options.type ?? 'sine';
    oscillator.frequency.setValueAtTime(options.frequency, startAt);

    if (options.endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, options.endFrequency), endAt);
    }

    envelope.gain.setValueAtTime(0, startAt);
    envelope.gain.linearRampToValueAtTime(peakGain, startAt + attack);
    envelope.gain.linearRampToValueAtTime(sustainGain, releaseAt);
    envelope.gain.linearRampToValueAtTime(0, endAt);

    oscillator.connect(envelope);
    envelope.connect(destination);
    oscillator.start(startAt);
    oscillator.stop(endAt + 0.03);
    oscillator.addEventListener(
      'ended',
      () => {
        oscillator.disconnect();
        envelope.disconnect();
      },
      { once: true },
    );
  }

  private playNoise(options: NoiseOptions): void {
    if (this.muted()) {
      return;
    }

    const context = this.ensureContext();

    if (!context || !this.sfxGain) {
      return;
    }

    this.resumeContext(context);

    const duration = Math.max(0.03, options.duration);
    const sampleCount = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let index = 0; index < sampleCount; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    const startAt = context.currentTime + (options.startOffset ?? 0);
    const endAt = startAt + duration;

    source.buffer = buffer;
    filter.type = options.filterType ?? 'highpass';
    filter.frequency.setValueAtTime(options.filterFrequency ?? 1200, startAt);
    envelope.gain.setValueAtTime(0, startAt);
    envelope.gain.linearRampToValueAtTime(options.gain ?? 0.035, startAt + 0.012);
    envelope.gain.linearRampToValueAtTime(0, endAt);

    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.sfxGain);
    source.start(startAt);
    source.stop(endAt + 0.02);
    source.addEventListener(
      'ended',
      () => {
        source.disconnect();
        filter.disconnect();
        envelope.disconnect();
      },
      { once: true },
    );
  }

  private ensureContext(): AudioContext | undefined {
    if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') {
      return undefined;
    }

    if (!this.context) {
      this.context = new window.AudioContext();
      this.masterGain = this.context.createGain();
      this.sfxGain = this.context.createGain();
      this.musicGain = this.context.createGain();

      this.masterGain.gain.value = this.muted() ? 0 : 0.78;
      this.sfxGain.gain.value = 0.9;
      this.musicGain.gain.value = 0.32;

      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.context.destination);
    }

    return this.context;
  }

  private resumeContext(context: AudioContext): void {
    if (context.state === 'suspended') {
      void context.resume().catch(() => undefined);
    }
  }

  private updateMasterVolume(): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    const now = this.context.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(this.muted() ? 0 : 0.78, now, 0.025);
  }

  private clearMusicTimer(): void {
    clearInterval(this.musicTimer);
    this.musicTimer = undefined;
  }

  private readMutedPreference(): boolean {
    try {
      return localStorage.getItem(GameAudioService.mutedStorageKey) === 'true';
    } catch {
      return false;
    }
  }

  private saveMutedPreference(muted: boolean): void {
    try {
      localStorage.setItem(GameAudioService.mutedStorageKey, String(muted));
    } catch {
      return;
    }
  }
}
