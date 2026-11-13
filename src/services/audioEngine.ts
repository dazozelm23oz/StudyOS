import { convertFileSrc } from '@tauri-apps/api/core';
import { AudioPreset, AudioLayer } from '../types';

class StudyAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private masterGain: GainNode | null = null;

  // 1. GARBAGE COLLECTION PREVENTER: Class-level properties holding active nodes
  public activeSourceNode: AudioBufferSourceNode | null = null;
  public activeCustomNode: AudioBufferSourceNode | null = null;

  // Procedural DSP Nodes
  private rainGain: GainNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
  private windOsc: OscillatorNode | null = null;
  private windGain: GainNode | null = null;
  private thunderTimer: any = null;

  // Local imported audio nodes & elements
  private customAudioGain: GainNode | null = null;
  private customAudio: HTMLAudioElement | null = null;
  private audioBufferCache: Map<string, AudioBuffer> = new Map();

  // Watchdog heartbeat for Linux PipeWire / WebKitGTK uncorking and auto-recovery
  private watchdogInterval: any = null;

  // Active Preset Configuration
  private manualOverride: boolean = false;
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

  constructor() {
    // Global user gesture listener: Force-resumes WebKitGTK AudioContext on every click/touch
    if (typeof window !== 'undefined') {
      const handleUserGesture = () => {
        if (this.ctx && (this.ctx.state === 'suspended' || (this.ctx.state as any) === 'interrupted')) {
          this.ctx.resume().then(() => {
            console.log("[AudioEngine] AudioContext resumed on user gesture. State:", this.ctx?.state);
          }).catch((err) => console.warn("[AudioEngine] Failed to resume AudioContext on gesture:", err));
        }
      };

      window.addEventListener('click', handleUserGesture, { capture: true, passive: true });
      window.addEventListener('touchstart', handleUserGesture, { capture: true, passive: true });
      window.addEventListener('keydown', handleUserGesture, { capture: true, passive: true });

      // Start the auto-recovery watchdog heartbeat
      this.startWatchdog();
    }
  }

  /**
   * Watchdog timer that continuously runs while audio is expected to be playing.
   * Auto-detects device switching (Bluetooth connect/disconnect), PipeWire stream corking,
   * and WebKitGTK AudioContext state suspension or interruption.
   */
  private startWatchdog() {
    if (this.watchdogInterval) return;

    this.watchdogInterval = setInterval(() => {
      if (!this.isPlaying) return;

      // 1. Check AudioContext state and auto-resume if suspended or interrupted
      if (this.ctx) {
        const state = this.ctx.state as string;
        if (state === 'suspended' || state === 'interrupted') {
          console.log(`[AudioEngine Watchdog] Detected ${state} context while isPlaying=true. Auto-resuming...`);
          this.ctx.resume().catch((err) => console.warn("[AudioEngine Watchdog] Resume error:", err));
        }
      }

      // 2. Check procedural rain node
      const rainLayer = this.activePreset.layers.find((l) => l.kind === 'procedural_rain');
      if (rainLayer && !rainLayer.is_muted && !this.activeSourceNode && this.ctx && this.ctx.state === 'running') {
        console.log("[AudioEngine Watchdog] Procedural rain node missing while playing. Restarting...");
        this.startRainNode(rainLayer.volume);
      }

      // 3. Check custom audio element
      const customLayer = this.activePreset.layers.find((l) => l.kind === 'custom_file');
      if (customLayer && customLayer.source_path && !customLayer.is_muted) {
        if (this.customAudio && this.customAudio.paused) {
          console.log("[AudioEngine Watchdog] Custom HTMLAudio is paused while isPlaying=true. Auto-playing...");
          this.customAudio.play().catch(() => {});
        } else if (!this.customAudio && !this.activeCustomNode && this.ctx && this.ctx.state === 'running') {
          console.log("[AudioEngine Watchdog] Custom audio node missing while playing. Restarting...");
          this.startCustomAudio(customLayer.source_path, customLayer.volume);
        }
      }
    }, 500);
  }

  /**
   * Initializes or verifies the AudioContext with WebKitGTK-compatible state monitoring
   * Ensures masterGain is created, connected to destination, and has volume applied
   */
  public async ensureContext(): Promise<AudioContext> {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      // Target 48000 Hz to match native PipeWire hardware and Bluetooth headset sinks
      try {
        this.ctx = new AudioCtx({ sampleRate: 48000 });
      } catch (e) {
        this.ctx = new AudioCtx();
      }

      // Anchor to global window object to prevent any GC in JavaScriptCore
      (window as any).__studyos_ctx = this.ctx;

      // WebKitGTK Compatible Event Listening
      this.ctx.onstatechange = () => {
        console.log("[AudioEngine] AudioContext state change:", this.ctx?.state);
        if (this.isPlaying && this.ctx && ((this.ctx.state as any) === 'interrupted' || this.ctx.state === 'suspended')) {
          this.ctx.resume().catch((err) => console.warn("[AudioEngine] Auto-resume failed:", err));
        }
      };

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.activePreset.master_volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } else if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.activePreset.master_volume, this.ctx.currentTime);
      try {
        this.masterGain.disconnect();
      } catch (e) {}
      this.masterGain.connect(this.ctx.destination);
    }

    // Explicit Context Resumption check
    if (this.ctx.state === 'suspended' || (this.ctx.state as any) === 'interrupted') {
      try {
        await this.ctx.resume();
        console.log("[AudioEngine] AudioContext resumed. State:", this.ctx.state);
      } catch (e) {
        console.warn("[AudioEngine] Could not resume AudioContext:", e);
      }
    }

    return this.ctx;
  }

  /**
   * Explicitly force-resumes context (called on user click/touch)
   */
  public async forceResumeContext(): Promise<void> {
    if (!this.ctx) {
      await this.ensureContext();
      return;
    }
    if (this.ctx.state === 'suspended' || (this.ctx.state as any) === 'interrupted') {
      try {
        await this.ctx.resume();
        console.log("[AudioEngine] AudioContext force-resumed. State:", this.ctx.state);
      } catch (e) {
        console.warn("[AudioEngine] Error force-resuming AudioContext:", e);
      }
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

  public async loadPreset(preset: AudioPreset) {
    this.manualOverride = false;
    this.activePreset = { ...preset };
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.activePreset.master_volume, this.ctx.currentTime);
    }
    if (this.isPlaying) {
      this.stop();
      await this.start();
    } else {
      this.notify();
    }
  }

  /**
   * Primary playback toggle with immediate synchronous activation and manual override tracking
   */
  public async togglePlay() {
    this.manualOverride = true;

    // Immediately trigger synchronous resume on user click
    if (this.ctx && (this.ctx.state === 'suspended' || (this.ctx.state as any) === 'interrupted')) {
      this.ctx.resume().catch(() => {});
    }

    await this.ensureContext();
    await this.forceResumeContext();

    if (this.isPlaying) {
      this.stop();
    } else {
      await this.start();
    }
  }

  /**
   * Starts all configured preset channels
   */
  public async start() {
    await this.ensureContext();
    await this.forceResumeContext();
    if (!this.ctx || !this.masterGain) return;

    // Ensure master gain is refreshed and cleanly connected to destination
    this.masterGain.gain.setValueAtTime(this.activePreset.master_volume, this.ctx.currentTime);
    try {
      this.masterGain.disconnect();
    } catch (e) {}
    this.masterGain.connect(this.ctx.destination);

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

    // 4. Start Custom Audio Track
    const customLayer = this.activePreset.layers.find((l) => l.kind === 'custom_file');
    if (customLayer && customLayer.source_path && !customLayer.is_muted) {
      await this.startCustomAudio(customLayer.source_path, customLayer.volume);
    }

    this.notify();
  }

  /**
   * Stops playback and safely disconnects all nodes and attached DOM elements
   */
  public stop() {
    this.isPlaying = false;

    // Stop and disconnect procedural rain node
    if (this.activeSourceNode) {
      try {
        this.activeSourceNode.onended = null;
        this.activeSourceNode.stop();
        this.activeSourceNode.disconnect();
      } catch (e) {}
      if ((window as any).__studyos_active_nodes) {
        (window as any).__studyos_active_nodes.delete(this.activeSourceNode);
      }
      this.activeSourceNode = null;
    }

    // Stop and disconnect custom audio buffer node
    if (this.activeCustomNode) {
      try {
        this.activeCustomNode.onended = null;
        this.activeCustomNode.stop();
        this.activeCustomNode.disconnect();
      } catch (e) {}
      if ((window as any).__studyos_active_nodes) {
        (window as any).__studyos_active_nodes.delete(this.activeCustomNode);
      }
      this.activeCustomNode = null;
    }

    // Stop wind LFO
    if (this.windOsc) {
      try {
        this.windOsc.stop();
        this.windOsc.disconnect();
      } catch (e) {}
      this.windOsc = null;
    }

    // Stop thunder scheduler
    if (this.thunderTimer) {
      clearTimeout(this.thunderTimer);
      this.thunderTimer = null;
    }

    // Stop and remove fallback HTMLAudioElement from DOM
    if (this.customAudio) {
      try {
        this.customAudio.onpause = null;
        this.customAudio.onended = null;
        this.customAudio.pause();
        if (this.customAudio.parentNode) {
          this.customAudio.parentNode.removeChild(this.customAudio);
        }
      } catch (e) {}
      this.customAudio = null;
      (window as any).__studyos_custom_audio = null;
    }

    this.notify();
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
    if (this.customAudioGain && customLayer) {
      const vol = customLayer.is_muted ? 0 : customLayer.volume;
      this.customAudioGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
    if (this.customAudio && customLayer) {
      this.customAudio.volume = customLayer.is_muted ? 0 : customLayer.volume;
    }
  }

  /**
   * Procedural Rain generator: Generates continuous pink noise, sets seamless loop bounds,
   * connects source -> lowpass filter -> gain -> masterGain, and prevents GC.
   * Auto-restarts if onended ever fires while isPlaying is active.
   */
  private startRainNode(volume: number) {
    if (!this.ctx || !this.masterGain) return;

    // Disconnect any prior rain node
    if (this.activeSourceNode) {
      try {
        this.activeSourceNode.onended = null;
        this.activeSourceNode.stop();
        this.activeSourceNode.disconnect();
      } catch (e) {}
      this.activeSourceNode = null;
    }

    // 5-second seamless pink noise buffer
    const bufferSize = this.ctx.sampleRate * 5;
    const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    let b0L = 0, b1L = 0, b2L = 0, b3L = 0, b4L = 0, b5L = 0, b6L = 0;
    let b0R = 0, b1R = 0, b2R = 0, b3R = 0, b4R = 0, b5R = 0, b6R = 0;

    for (let i = 0; i < bufferSize; i++) {
      // Left channel Paul Kellet pink noise filter
      const whiteL = Math.random() * 2 - 1;
      b0L = 0.99886 * b0L + whiteL * 0.0555179;
      b1L = 0.99332 * b1L + whiteL * 0.0750759;
      b2L = 0.96900 * b2L + whiteL * 0.1538520;
      b3L = 0.86650 * b3L + whiteL * 0.3104856;
      b4L = 0.55000 * b4L + whiteL * 0.5329522;
      b5L = -0.7616 * b5L - whiteL * 0.0168980;
      dataL[i] = (b0L + b1L + b2L + b3L + b4L + b5L + b6L + whiteL * 0.5362) * 0.25;
      b6L = whiteL * 0.115926;

      // Right channel (independent stereo decorrelation)
      const whiteR = Math.random() * 2 - 1;
      b0R = 0.99886 * b0R + whiteR * 0.0555179;
      b1R = 0.99332 * b1R + whiteR * 0.0750759;
      b2R = 0.96900 * b2R + whiteR * 0.1538520;
      b3R = 0.86650 * b3R + whiteR * 0.3104856;
      b4R = 0.55000 * b4R + whiteR * 0.5329522;
      b5R = -0.7616 * b5R - whiteR * 0.0168980;
      dataR[i] = (b0R + b1R + b2R + b3R + b4R + b5R + b6R + whiteR * 0.5362) * 0.25;
      b6R = whiteR * 0.115926;
    }

    // Apply smooth 100ms circular crossfade at loop boundary to ensure zero click/pop
    const fadeSamples = Math.floor(this.ctx.sampleRate * 0.1);
    for (let i = 0; i < fadeSamples; i++) {
      const alpha = i / fadeSamples;
      dataL[i] = dataL[i] * alpha + dataL[bufferSize - fadeSamples + i] * (1 - alpha);
      dataR[i] = dataR[i] * alpha + dataR[bufferSize - fadeSamples + i] * (1 - alpha);
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    // THE LOOP FLAG: Explicitly set on generated rain node
    source.loop = true;
    source.loopStart = 0;
    source.loopEnd = 0; // 0 means loop the entire buffer without boundary mismatch

    // Lowpass filter for natural rainfall acoustics
    this.rainFilter = this.ctx.createBiquadFilter();
    this.rainFilter.type = 'lowpass';
    this.rainFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(volume, this.ctx.currentTime);

    source.connect(this.rainFilter);
    this.rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);

    // Auto-restart safeguard if WebKitGTK drops the node on device switch
    source.onended = () => {
      if (this.isPlaying && this.activeSourceNode === source) {
        console.log("[AudioEngine] Rain node ended while isPlaying=true. Auto-recovering...");
        const rainL = this.activePreset.layers.find((l) => l.kind === 'procedural_rain');
        if (rainL && !rainL.is_muted) {
          this.startRainNode(rainL.volume);
        }
      }
    };

    // GARBAGE COLLECTION PREVENTER: Retain reference in class property & window registry
    this.activeSourceNode = source;
    ((window as any).__studyos_active_nodes = (window as any).__studyos_active_nodes || new Set()).add(source);

    source.start(0);
  }

  private startWindNode(volume: number) {
    if (!this.ctx || !this.masterGain || !this.rainFilter) return;

    if (this.windOsc) {
      try {
        this.windOsc.stop();
        this.windOsc.disconnect();
      } catch (e) {}
      this.windOsc = null;
    }

    this.windOsc = this.ctx.createOscillator();
    this.windOsc.frequency.setValueAtTime(0.18, this.ctx.currentTime);

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

      const delayMs = 15000 + Math.random() * 25000;
      this.thunderTimer = setTimeout(triggerThunder, delayMs);
    };

    this.thunderTimer = setTimeout(triggerThunder, 8000);
  }

  private playThunderBurst(volume: number) {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 3.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.exponentialRampToValueAtTime(volume * 0.8, now + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    src.start();
  }

  public async importCustomAudio(filePath: string, name: string) {
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
      await this.startCustomAudio(filePath, 0.6);
    }
  }

  /**
   * Custom Audio Playback:
   * 1. Uses convertFileSrc to bypass Tauri CSP for local files
   * 2. Plays via Web Audio API or DOM-attached HTML5 audio with auto-looping
   * 3. Includes auto-recovery on device switch and pause events
   */
  private async startCustomAudio(sourcePath: string, volume: number) {
    await this.ensureContext();
    await this.forceResumeContext();
    if (!this.ctx || !this.masterGain) return;

    // Disconnect any active custom node
    if (this.activeCustomNode) {
      try {
        this.activeCustomNode.onended = null;
        this.activeCustomNode.stop();
        this.activeCustomNode.disconnect();
      } catch (e) {}
      this.activeCustomNode = null;
    }

    // Stop and remove fallback HTMLAudioElement if running
    if (this.customAudio) {
      try {
        this.customAudio.onpause = null;
        this.customAudio.onended = null;
        this.customAudio.pause();
        if (this.customAudio.parentNode) {
          this.customAudio.parentNode.removeChild(this.customAudio);
        }
      } catch (e) {}
      this.customAudio = null;
    }

    // Convert local filesystem paths to safe Tauri asset URLs to bypass CSP
    const safeUrl = (sourcePath.startsWith('blob:') || sourcePath.startsWith('data:') || sourcePath.startsWith('asset:') || sourcePath.startsWith('http'))
      ? sourcePath
      : convertFileSrc(sourcePath);

    try {
      // Decode audio data into native AudioBuffer for reliable Web Audio streaming
      let audioBuffer = this.audioBufferCache.get(safeUrl);
      if (!audioBuffer) {
        const response = await fetch(safeUrl);
        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
        this.audioBufferCache.set(safeUrl, audioBuffer);
      }

      const source = this.ctx.createBufferSource();
      source.buffer = audioBuffer;

      // THE LOOP FLAG: Explicitly set on imported audio file node
      source.loop = true;
      source.loopStart = 0;
      source.loopEnd = 0; // Seamless full-buffer loop

      this.customAudioGain = this.ctx.createGain();
      this.customAudioGain.gain.setValueAtTime(volume, this.ctx.currentTime);

      source.connect(this.customAudioGain);
      this.customAudioGain.connect(this.masterGain);

      // Auto-reconnect safeguard if WebKitGTK drops the node on device switch
      source.onended = () => {
        if (this.isPlaying && this.activeCustomNode === source) {
          console.log("[AudioEngine] Custom audio source ended while isPlaying=true. Auto-recovering...");
          const customL = this.activePreset.layers.find((l) => l.kind === 'custom_file');
          if (customL && customL.source_path && !customL.is_muted) {
            this.startCustomAudio(customL.source_path, customL.volume);
          }
        }
      };

      // GARBAGE COLLECTION PREVENTER: Retain reference in class property & window registry
      this.activeCustomNode = source;
      ((window as any).__studyos_active_nodes = (window as any).__studyos_active_nodes || new Set()).add(source);

      source.start(0);
    } catch (err) {
      console.warn("[AudioEngine] Web Audio decodeAudioData failed, falling back to DOM-attached HTMLAudioElement:", err);

      // Fallback with mandatory DOM attachment for WebKitGTK
      this.customAudio = new Audio(safeUrl);
      this.customAudio.loop = true;
      this.customAudio.volume = volume;
      this.customAudio.style.display = 'none';
      document.body.appendChild(this.customAudio);

      // Add auto-recovery event handlers to ensure audio never dies on device switch
      this.customAudio.onpause = () => {
        if (this.isPlaying && this.customAudio) {
          console.log("[AudioEngine] Fallback HTMLAudio paused unexpectedly. Auto-resuming...");
          this.customAudio.play().catch(() => {});
        }
      };
      this.customAudio.onended = () => {
        if (this.isPlaying && this.customAudio) {
          this.customAudio.currentTime = 0;
          this.customAudio.play().catch(() => {});
        }
      };

      (window as any).__studyos_custom_audio = this.customAudio;
      this.customAudio.play().catch((e) => console.warn("[AudioEngine] Could not play custom audio element:", e));
    }
  }

  public handleTimerPhase(phase: 'work' | 'break') {
    if (this.activePreset.attached_timer_phase === phase) {
      if (!this.isPlaying) this.start();
    } else if (this.activePreset.attached_timer_phase !== 'always') {
      if (this.isPlaying && !this.manualOverride) this.stop();
    }
  }

  public async playChime() {
    await this.ensureContext();
    await this.forceResumeContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
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

  public async playTakeoffSweep() {
    await this.ensureContext();
    await this.forceResumeContext();
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
