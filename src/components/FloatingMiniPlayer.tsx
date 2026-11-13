import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, ChevronUp, ChevronDown, Lock, Unlock, GripHorizontal } from 'lucide-react';
import { AudioPreset } from '../types';
import { audioEngine } from '../services/audioEngine';

export const FloatingMiniPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<AudioPreset>(audioEngine.getActivePreset());
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return localStorage.getItem('studyos_miniplayer_locked') === 'true';
  });

  // Drag coordinates
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    const saved = localStorage.getItem('studyos_miniplayer_pos');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return {
      x: typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 320) : 20,
      y: typeof window !== 'undefined' ? Math.max(20, window.innerHeight - 100) : 20,
    };
  });

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

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

  const toggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextLocked = !isLocked;
    setIsLocked(nextLocked);
    localStorage.setItem('studyos_miniplayer_locked', nextLocked.toString());
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isLocked) return;
    if ((e.target as HTMLElement).tagName.toLowerCase() === 'input' || (e.target as HTMLElement).tagName.toLowerCase() === 'button') {
      return;
    }
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = moveEvent.clientX - dragStartRef.current.x;
      const dy = moveEvent.clientY - dragStartRef.current.y;
      const newX = Math.max(10, Math.min(window.innerWidth - 300, dragStartRef.current.posX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 80, dragStartRef.current.posY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setPosition((pos) => {
        localStorage.setItem('studyos_miniplayer_pos', JSON.stringify(pos));
        return pos;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onMouseDown={handleMouseDown}
      className={`fixed z-40 select-none ${isLocked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
    >
      <div className="hud-panel border border-border shadow-2xl rounded-2xl p-2.5 flex flex-col backdrop-blur-md transition-shadow min-w-[270px] bg-surface">
        {/* Main Pill Row */}
        <div className="flex items-center justify-between space-x-3">
          <div className="flex items-center space-x-2.5 flex-1 min-w-0">
            {/* Play/Pause Button */}
            <button
              onClick={handleTogglePlay}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition shadow-sm flex-shrink-0 ${
                isPlaying
                  ? 'bg-success text-canvas hover:brightness-110'
                  : 'bg-surfaceElevated border border-border text-text-muted hover:text-text-main hover:border-primary/50'
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
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${isPlaying ? 'bg-success' : 'bg-text-faint'}`} />
                <span>{isPlaying ? 'Streaming ambience' : 'Paused'}</span>
              </div>
            </div>
          </div>

          {/* Right Action Icons: Drag handle indicator, Lock button, Expand toggle */}
          <div className="flex items-center space-x-1 flex-shrink-0">
            {!isLocked && (
              <span title="Drag to reposition">
                <GripHorizontal className="w-3.5 h-3.5 text-text-faint opacity-60" />
              </span>
            )}
            <button
              onClick={toggleLock}
              className={`p-1 rounded-lg transition ${
                isLocked ? 'text-primary' : 'text-text-faint hover:text-text-main'
              }`}
              title={isLocked ? 'Position Locked (Click to unlock & drag)' : 'Unlocked (Click to lock position)'}
            >
              {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-lg text-text-faint hover:text-text-main transition"
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Expanded Volume & Quick Controls */}
        {isExpanded && (
          <div className="pt-3 mt-2 border-t border-border/60 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-text-muted">
              <span className="flex items-center space-x-1">
                <Volume2 className="w-3.5 h-3.5 text-primary" />
                <span>Master Gain</span>
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
