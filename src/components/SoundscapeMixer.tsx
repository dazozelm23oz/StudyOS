import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  CloudRain,
  Wind,
  Zap,
  Music,
  Plus,
  Trash2,
  Bookmark,
  Save,
  Sparkles,
  Sliders,
  FolderOpen,
  Check,
  Clock,
} from 'lucide-react';
import { AudioPreset, AudioLayer } from '../types';
import { audioEngine } from '../services/audioEngine';
import { dbService } from '../services/db';

const BUILT_IN_AUDIO_PRESETS: AudioPreset[] = [
  {
    id: 'preset-rain-focus',
    name: 'Gentle Rain & Calm',
    master_volume: 0.8,
    attached_timer_phase: 'work',
    layers: [
      { id: 'l-rain', kind: 'procedural_rain', name: 'Procedural Rain', volume: 0.75, is_muted: false },
      { id: 'l-wind', kind: 'wind', name: 'Wind Swells', volume: 0.35, is_muted: false },
      { id: 'l-thunder', kind: 'thunder', name: 'Distant Thunder', volume: 0.4, is_muted: false },
    ],
  },
  {
    id: 'preset-thunderstorm',
    name: 'Intense Thunderstorm',
    master_volume: 0.9,
    attached_timer_phase: 'always',
    layers: [
      { id: 'l-rain', kind: 'procedural_rain', name: 'Heavy Downpour', volume: 0.95, is_muted: false },
      { id: 'l-wind', kind: 'wind', name: 'High Gale Winds', volume: 0.65, is_muted: false },
      { id: 'l-thunder', kind: 'thunder', name: 'Frequent Thunder', volume: 0.85, is_muted: false },
    ],
  },
  {
    id: 'preset-windy-mountains',
    name: 'Windy Mountain Sanctuary',
    master_volume: 0.75,
    attached_timer_phase: 'work',
    layers: [
      { id: 'l-rain', kind: 'procedural_rain', name: 'Light Mist', volume: 0.2, is_muted: false },
      { id: 'l-wind', kind: 'wind', name: 'Mountain Breezes', volume: 0.85, is_muted: false },
      { id: 'l-thunder', kind: 'thunder', name: 'Distant Thunder', volume: 0.1, is_muted: true },
    ],
  },
  {
    id: 'preset-break-silence',
    name: 'Restorative Break Silence',
    master_volume: 0.0,
    attached_timer_phase: 'break',
    layers: [
      { id: 'l-rain', kind: 'procedural_rain', name: 'Rain', volume: 0.0, is_muted: true },
      { id: 'l-wind', kind: 'wind', name: 'Wind', volume: 0.0, is_muted: true },
      { id: 'l-thunder', kind: 'thunder', name: 'Thunder', volume: 0.0, is_muted: true },
    ],
  },
];

export const SoundscapeMixer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<AudioPreset>(audioEngine.getActivePreset());
  const [presets, setPresets] = useState<AudioPreset[]>(BUILT_IN_AUDIO_PRESETS);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [newPresetName, setNewPresetName] = useState<string>('');
  const [newPresetPhase, setNewPresetPhase] = useState<'work' | 'break' | 'always' | 'none'>('work');

  // Subscribe to audio engine changes
  useEffect(() => {
    const unsub = audioEngine.subscribe((playing, preset) => {
      setIsPlaying(playing);
      setActivePreset({ ...preset, layers: [...preset.layers] });
    });
    loadSavedPresets();
    return () => unsub();
  }, []);

  const loadSavedPresets = async () => {
    try {
      const saved = await dbService.getAudioPresets();
      if (saved && saved.length > 0) {
        setPresets([...BUILT_IN_AUDIO_PRESETS, ...saved]);
      }
    } catch (e) {
      console.warn('Could not load saved audio presets:', e);
    }
  };

  const handleTogglePlay = () => {
    audioEngine.togglePlay();
  };

  const handleMasterVolumeChange = (vol: number) => {
    audioEngine.setMasterVolume(vol);
  };

  const handleLayerVolumeChange = (layerId: string, vol: number) => {
    audioEngine.setLayerVolume(layerId, vol);
  };

  const handleToggleMute = (layerId: string) => {
    audioEngine.toggleLayerMute(layerId);
  };

  const handleSelectPreset = (preset: AudioPreset) => {
    audioEngine.loadPreset(preset);
  };

  const handleImportLocalAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a local blob object URL for seamless looping
    const blobUrl = URL.createObjectURL(file);
    audioEngine.importCustomAudio(blobUrl, file.name.replace(/\.[^/.]+$/, ''));
  };

  const handleSavePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const toSave: AudioPreset = {
      id: 'preset-custom-' + Date.now(),
      name: newPresetName.trim(),
      master_volume: activePreset.master_volume,
      attached_timer_phase: newPresetPhase,
      layers: activePreset.layers.map((l) => ({ ...l })),
    };

    await dbService.saveAudioPreset(toSave);
    setPresets((prev) => [...prev, toSave]);
    audioEngine.loadPreset(toSave);
    setShowSaveModal(false);
    setNewPresetName('');
  };

  const handleDeletePreset = async (id: string) => {
    await dbService.deleteAudioPreset(id);
    setPresets((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-canvas text-text-main">
      {/* Soundscape Header & Master Control Panel */}
      <div className="hud-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-l-success">
        <div>
          <div className="flex items-center space-x-2 text-success font-mono text-xs uppercase mb-1 font-bold">
            <Sparkles className="w-4 h-4" />
            <span>PROCEDURAL ACOUSTIC ENGINE</span>
          </div>
          <h1 className="text-2xl font-bold font-mono tracking-tight text-text-main">
            Soundscape & Atmospheric Mixer
          </h1>
          <p className="text-xs text-text-muted mt-1 font-mono">
            100% offline procedural pink/white noise rain synthesis, wind gusts, and local audio tracks.
          </p>
        </div>

        {/* Master Transport Controls */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleTogglePlay}
            className={`px-6 py-3 rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center space-x-2.5 transition shadow-md ${
              isPlaying
                ? 'bg-warning text-canvas hover:brightness-110'
                : 'bg-success text-canvas hover:brightness-110'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? 'PAUSE AMBIENCE' : 'PLAY SOUNDSCAPE'}</span>
          </button>

          <button
            onClick={() => setShowSaveModal(true)}
            className="px-4 py-3 rounded-xl bg-surface border border-border hover:border-success text-text-main font-mono text-xs font-bold uppercase flex items-center space-x-2 transition shadow-sm"
          >
            <Save className="w-4 h-4 text-success" />
            <span className="hidden sm:inline">SAVE PRESET</span>
          </button>
        </div>
      </div>

      {/* Master Volume & Timer Phase Status */}
      <div className="hud-panel p-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-text-muted font-bold flex items-center space-x-1.5">
              <Volume2 className="w-4 h-4 text-primary" />
              <span>MASTER OUTPUT GAIN</span>
            </span>
            <span className="font-bold text-text-main">{Math.round(activePreset.master_volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={activePreset.master_volume}
            onChange={(e) => handleMasterVolumeChange(parseFloat(e.target.value))}
            className="w-full accent-primary h-2 bg-canvas rounded-lg cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-canvas border border-border font-mono text-xs">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-accent" />
            <span className="text-text-muted">Attached Timer Phase:</span>
            <span className="font-bold text-primary uppercase">
              {activePreset.attached_timer_phase || 'Always Active'}
            </span>
          </div>
          <span className="text-[10px] text-text-faint">Auto-transitions with Pomodoro</span>
        </div>
      </div>

      {/* Multi-Layer Channel Strips */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {activePreset.layers.map((layer) => {
          let Icon = CloudRain;
          let iconColor = 'text-primary';
          if (layer.kind === 'wind') {
            Icon = Wind;
            iconColor = 'text-accent';
          } else if (layer.kind === 'thunder') {
            Icon = Zap;
            iconColor = 'text-warning';
          } else if (layer.kind === 'custom_file') {
            Icon = Music;
            iconColor = 'text-success';
          }

          return (
            <div
              key={layer.id}
              className={`hud-panel p-5 space-y-4 transition ${
                layer.is_muted ? 'opacity-50 border-border/40' : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className={`p-2 rounded-lg bg-surface border border-border ${iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-mono text-xs font-bold text-text-main truncate max-w-[130px]">
                      {layer.name}
                    </div>
                    <div className="text-[10px] font-mono text-text-muted capitalize">
                      {layer.kind.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleMute(layer.id)}
                  className={`p-2 rounded-lg border transition ${
                    layer.is_muted
                      ? 'bg-danger/10 border-danger/40 text-danger'
                      : 'bg-canvas border-border text-text-muted hover:text-text-main'
                  }`}
                  title={layer.is_muted ? 'Unmute Channel' : 'Mute Channel'}
                >
                  {layer.is_muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Volume Slider */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-text-muted">
                  <span>CHANNEL GAIN</span>
                  <span className="font-bold text-text-main">
                    {layer.is_muted ? 'MUTED' : Math.round(layer.volume * 100) + '%'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  disabled={layer.is_muted}
                  value={layer.volume}
                  onChange={(e) => handleLayerVolumeChange(layer.id, parseFloat(e.target.value))}
                  className="w-full accent-secondary h-1.5 bg-canvas rounded-lg cursor-pointer disabled:opacity-40"
                />
              </div>
            </div>
          );
        })}

        {/* Import Local Audio Card */}
        <label className="hud-panel p-5 border-dashed border-2 border-border hover:border-primary/50 cursor-pointer flex flex-col items-center justify-center text-center space-y-2 group transition">
          <input
            type="file"
            accept="audio/mp3,audio/wav,audio/ogg,audio/flac"
            onChange={handleImportLocalAudio}
            className="hidden"
          />
          <div className="p-3 rounded-xl bg-canvas border border-border group-hover:border-primary text-text-muted group-hover:text-primary transition">
            <Plus className="w-5 h-5" />
          </div>
          <div className="font-mono text-xs font-bold text-text-main">IMPORT LOCAL AUDIO</div>
          <div className="text-[10px] font-mono text-text-muted max-w-[180px]">
            Add .mp3 or .wav study tracks with seamless looping
          </div>
        </label>
      </div>

      {/* Preset Vault Catalog */}
      <div className="hud-panel p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="font-mono text-sm font-bold tracking-wider text-text-main flex items-center space-x-2">
            <Bookmark className="w-4 h-4 text-primary" />
            <span>SOUNDSCAPE PRESET VAULT</span>
          </div>
          <div className="text-xs font-mono text-text-muted">
            Active: <span className="text-primary font-bold">{activePreset.name}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {presets.map((p) => {
            const isSelected = activePreset.id === p.id;
            return (
              <div
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className={`p-4 rounded-xl border cursor-pointer transition shadow-sm flex items-center justify-between ${
                  isSelected
                    ? 'bg-canvas border-primary shadow-primary/10'
                    : 'bg-canvas border-border hover:border-primary/40'
                }`}
              >
                <div className="space-y-1">
                  <div className="font-mono text-xs font-bold text-text-main flex items-center space-x-2">
                    <span>{p.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary stroke-[3]" />}
                  </div>
                  <div className="text-[10px] font-mono text-text-faint">
                    {p.layers.length} Layers • Phase: {p.attached_timer_phase || 'Always'}
                  </div>
                </div>

                {!BUILT_IN_AUDIO_PRESETS.some((b) => b.id === p.id) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePreset(p.id);
                    }}
                    className="p-1 text-text-faint hover:text-danger transition"
                    title="Delete Preset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Preset Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-canvas/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="hud-panel p-6 max-w-md w-full space-y-4 border border-border shadow-2xl">
            <h3 className="font-mono text-base font-bold text-text-main">Save Soundscape Preset</h3>
            <p className="text-xs font-mono text-text-muted">
              Save your current procedural mix and layer levels to the local database.
            </p>

            <form onSubmit={handleSavePreset} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-text-muted mb-1">Preset Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Heavy Rain Focus Mix"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  className="w-full bg-canvas border border-border rounded-lg px-3 py-2 text-xs font-mono text-text-main focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-text-muted mb-1">Attach to Timer Phase</label>
                <select
                  value={newPresetPhase}
                  onChange={(e: any) => setNewPresetPhase(e.target.value)}
                  className="w-full bg-canvas border border-border rounded-lg px-3 py-2 text-xs font-mono text-text-main focus:outline-none focus:border-primary"
                >
                  <option value="work">Work Phase Only (Auto-play on work, pause on break)</option>
                  <option value="break">Break Phase Only (Auto-play on break, pause on work)</option>
                  <option value="always">Always Active (Continuous)</option>
                  <option value="none">Manual Only</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 rounded-lg bg-canvas border border-border text-xs font-mono text-text-muted hover:text-text-main transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-canvas text-xs font-mono font-bold uppercase hover:brightness-110 transition"
                >
                  Save to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
