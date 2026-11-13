import { AudioPreset, AudioLayer } from '../types';

class StudyAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private masterGain: GainNode | null = null;

  // Procedural Nodes
  private rainNode: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;

  private windOsc: OscillatorNode | null = null;
  private windGain: GainNode | null = null;

  private thunderTimer: any = null;
  private thunderGain: GainNode | null = null;

  // Local imported audio element
  private customAudio: HTMLAudioElement | null = null;

  // Active state
  private activePreset: AudioPreset = {
    id: 'preset-rain-focus',
    name: 'Gentle Rain & Calm',
    master_volume: 0.8,
    attached_timer_phase: 'work',
    layers: [
      { id: 'l-rain', kind: 'procedural_rain', name: 'Procedural Rain', volume: 0.75, is_muted: false },
      { id: 'l-wind', kind: 'wind', name: 'Wind Swells', volume: 0.35, is_muted: false },
      { id: 'l-thunder', kind: 'thunder', name: 'Distant Thunder', volume: 0.4, is_muted: false },
    ],
  };

  private listeners: ((playing: boolean, preset: AudioPreset) => void)[] = [];

  public ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.activePreset.master_volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch((e) => console.warn('Could not resume audio context:', e));
    }
  }

  public subscribe(cb: (playing: boolean, preset: AudioPreset) => void) {
    this.listeners.push(cb);
    cb(this.isPlaying, this.activePreset);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.isPlaying, this.activePreset));
  }

  public getActivePreset(): AudioPreset {
    return this.activePreset;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public setMasterVolume(vol: number) {
    this.activePreset.master_volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.activePreset.master_volume, this.ctx.currentTime);
    }
    this.notify();
  }

  public setLayerVolume(layerId: string, vol: number) {
    const layer = this.activePreset.layers.find((l) => l.id === layerId);
    if (layer) {
      layer.volume = Math.max(0, Math.min(1, vol));
      this.updateLayerNodes();
      this.notify();
    }
  }

  public toggleLayerMute(layerId: string) {
    const layer = this.activePreset.layers.find((l) => l.id === layerId);
    if (layer) {
      layer.is_muted = !layer.is_muted;
      this.updateLayerNodes();
      this.notify();
    }
  }

  public loadPreset(preset: AudioPreset) {
    this.activePreset = { ...preset };
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.activePreset.master_volume, this.ctx.currentTime);
    }
    if (this.isPlaying) {
      this.stop();
      this.start();
    } else {
      this.notify();
    }
  }

  public start() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;

    this.isPlaying = true;

    // 1. Start Procedural Rain
    const rainLayer = this.activePreset.layers.find((l) => l.kind === 'procedural_rain');
    if (rainLayer && !rainLayer.is_muted) {
      this.startRainNode(rainLayer.volume);
    }

    // 2. Start Wind Modulation
    const windLayer = this.activePreset.layers.find((l) => l.kind === 'wind');
    if (windLayer && !windLayer.is_muted) {
      this.startWindNode(windLayer.volume);
    }

    // 3. Start Periodic Thunder
    const thunderLayer = this.activePreset.layers.find((l) => l.kind === 'thunder');
    if (thunderLayer && !thunderLayer.is_muted) {
      this.startThunderSchedule(thunderLayer.volume);
    }

    // 4. Start Custom Audio File if present
    const customLayer = this.activePreset.layers.find((l) => l.kind === 'custom_file');
    if (customLayer && customLayer.source_path && !customLayer.is_muted) {
      this.startCustomAudio(customLayer.source_path, customLayer.volume);
    }

    this.notify();
  }

  public stop() {
    this.isPlaying = false;

    // Stop rain
    if (this.rainNode) {
      try {
        this.rainNode.stop();
        this.rainNode.disconnect();
      } catch (e) {}
      this.rainNode = null;
    }

    // Stop wind
    if (this.windOsc) {
      try {
        this.windOsc.stop();
        this.windOsc.disconnect();
      } catch (e) {}
      this.windOsc = null;
    }

    // Stop thunder timer
    if (this.thunderTimer) {
      clearTimeout(this.thunderTimer);
      this.thunderTimer = null;
    }

    // Stop custom audio
    if (this.customAudio) {
      this.customAudio.pause();
      this.customAudio = null;
    }

    this.notify();
  }

  public async togglePlay() {
    this.ensureContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (e) {
        console.warn('AudioContext resume error:', e);
      }
    }
    if (this.isPlaying) this.stop();
    else this.start();
  }

  private updateLayerNodes() {
    if (!this.ctx) return;

    const rainLayer = this.activePreset.layers.find((l) => l.kind === 'procedural_rain');
    if (this.rainGain) {
      const vol = rainLayer && !rainLayer.is_muted ? rainLayer.volume : 0;
      this.rainGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }

    const windLayer = this.activePreset.layers.find((l) => l.kind === 'wind');
    if (this.windGain) {
      const vol = windLayer && !windLayer.is_muted ? windLayer.volume * 0.4 : 0;
      this.windGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }

    const customLayer = this.activePreset.layers.find((l) => l.kind === 'custom_file');
    if (this.customAudio && customLayer) {
      this.customAudio.volume = customLayer.is_muted ? 0 : customLayer.volume;
    }
  }

  private startRainNode(volume: number) {
    if (!this.ctx || !this.masterGain) return;

    // 2-second looping white/pink noise buffer
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Pink noise filter algorithm
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    this.rainNode = this.ctx.createBufferSource();
    this.rainNode.buffer = buffer;
    this.rainNode.loop = true;
    this.rainNode.loopStart = 0;
    this.rainNode.loopEnd = buffer.duration;

    // Filter to sound like soft rainfall
    this.rainFilter = this.ctx.createBiquadFilter();
    this.rainFilter.type = 'lowpass';
    this.rainFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(volume, this.ctx.currentTime);

    this.rainNode.connect(this.rainFilter);
    this.rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);

    this.rainNode.start();
  }

  private startWindNode(volume: number) {
    if (!this.ctx || !this.masterGain || !this.rainFilter) return;

    // LFO to modulate rain filter for gusting wind effect
    this.windOsc = this.ctx.createOscillator();
    this.windOsc.frequency.setValueAtTime(0.18, this.ctx.currentTime); // Gentle 0.18 Hz swell

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(350 * volume, this.ctx.currentTime);

    this.windOsc.connect(this.windGain);
    this.windGain.connect(this.rainFilter.frequency);

    this.windOsc.start();
  }

  private startThunderSchedule(volume: number) {
    const triggerThunder = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;

      const thunderLayer = this.activePreset.layers.find((l) => l.kind === 'thunder');
      if (thunderLayer && !thunderLayer.is_muted) {
        this.playThunderBurst(thunderLayer.volume);
      }

      // Schedule next thunder burst between 15 and 40 seconds randomly
      const delayMs = 15000 + Math.random() * 25000;
      this.thunderTimer = setTimeout(triggerThunder, delayMs);
    };

    this.thunderTimer = setTimeout(triggerThunder, 8000);
  }

  private playThunderBurst(volume: number) {
    if (!this.ctx || !this.masterGain) return;

    // Generate low-frequency brownian rumble
    const bufferSize = this.ctx.sampleRate * 3.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Gain boost
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.exponentialRampToValueAtTime(volume * 0.8, now + 0.6); // Thunder attack
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.2); // Long natural decay

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    src.start();
  }

  public importCustomAudio(filePath: string, name: string) {
    // Add custom audio layer to active preset
    const newLayer: AudioLayer = {
      id: 'l-custom-' + Date.now(),
      kind: 'custom_file',
      name: name || 'Custom Track',
      source_path: filePath,
      volume: 0.6,
      is_muted: false,
    };
    this.activePreset.layers.push(newLayer);
    this.notify();
    if (this.isPlaying) {
      this.startCustomAudio(filePath, 0.6);
    }
  }

  private startCustomAudio(sourcePath: string, volume: number) {
    if (this.customAudio) {
      this.customAudio.pause();
    }
    this.customAudio = new Audio(sourcePath);
    this.customAudio.loop = true;
    this.customAudio.volume = volume;
    this.customAudio.play().catch((e) => console.warn('Could not play audio:', e));
  }

  public handleTimerPhase(phase: 'work' | 'break') {
    if (this.activePreset.attached_timer_phase === phase) {
      if (!this.isPlaying) this.start();
    } else if (this.activePreset.attached_timer_phase !== 'always') {
      if (this.isPlaying) this.stop();
    }
  }

  public playChime() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    // Pleasant aircraft seatbelt / cabin ding-dong chime
    const playTone = (freq: number, start: number, dur: number) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.25, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + dur);
    };
    playTone(587.33, now, 0.7);
    playTone(440.0, now + 0.35, 1.2);
  }

  public playTakeoffSweep() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 2.5);
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 3.0);
  }
}

export const audioEngine = new StudyAudioEngine();
