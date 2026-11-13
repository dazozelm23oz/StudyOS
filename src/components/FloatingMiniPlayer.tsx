import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Sparkles, ChevronUp, ChevronDown, Music } from 'lucide-react';
import { AudioPreset } from '../types';
import { audioEngine } from '../services/audioEngine';

export const FloatingMiniPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<AudioPreset>(audioEngine.getActivePreset());
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    const unsub = audioEngine.subscribe((playing, preset) => {
      setIsPlaying(playing);
      setActivePreset({ ...preset });
    });
    return () => unsub();
  }, []);

  const handleTogglePlay = () => {
    audioEngine.togglePlay();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    audioEngine.setMasterVolume(parseFloat(e.target.value));
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 select-none">
      <div className="hud-panel border border-border shadow-2xl rounded-2xl p-2.5 flex flex-col backdrop-blur-md transition-all duration-300 min-w-[260px]">
        {/* Main Pill Row */}
        <div className="flex items-center justify-between space-x-3">
          <div className="flex items-center space-x-2.5 flex-1 min-w-0">
            {/* Equalizer Visualizer Icon */}
            <button
              onClick={handleTogglePlay}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition shadow-sm ${
                isPlaying
                  ? 'bg-success text-canvas hover:brightness-110'
                  : 'bg-surface border border-border text-text-muted hover:text-text-main hover:border-primary/50'
              }`}
              title={isPlaying ? 'Pause Ambience' : 'Play Ambience'}
            >
              {isPlaying ? (
                <div className="flex items-end space-x-0.5 h-3.5">
                  <span className="w-1 bg-current rounded-full animate-bounce h-3" />
                  <span className="w-1 bg-current rounded-full animate-bounce h-2" style={{ animationDelay: '0.15s' }} />
                  <span className="w-1 bg-current rounded-full animate-bounce h-3.5" style={{ animationDelay: '0.3s' }} />
                </div>
              ) : (
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              )}
            </button>

            {/* Track Info */}
            <div className="truncate cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
              <div className="font-mono text-xs font-bold text-text-main truncate">
                {activePreset.name}
              </div>
              <div className="text-[10px] font-mono text-text-muted flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                <span>{isPlaying ? 'Streaming ambience' : 'Paused'}</span>
              </div>
            </div>
          </div>

          {/* Quick Expand Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg text-text-faint hover:text-text-main transition"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Expanded Volume & Quick Controls */}
        {isExpanded && (
          <div className="pt-3 mt-2 border-t border-border/60 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-text-muted">
              <span className="flex items-center space-x-1">
                <Volume2 className="w-3.5 h-3.5 text-primary" />
                <span>Gain</span>
              </span>
              <span className="font-bold text-text-main">{Math.round(activePreset.master_volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={activePreset.master_volume}
              onChange={handleVolumeChange}
              className="w-full accent-primary h-1.5 bg-canvas rounded-lg cursor-pointer"
            />
            <div className="text-[10px] font-mono text-text-faint text-center pt-1">
              Phase: <span className="text-primary font-bold uppercase">{activePreset.attached_timer_phase || 'always'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
