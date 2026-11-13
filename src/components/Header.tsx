import React, { useState, useEffect } from 'react';
import { Camera, Moon, Sun, ShieldCheck, HardDrive, CheckCircle2, Layout } from 'lucide-react';
import { Theme, DockPosition } from '../types';
import { BUILT_IN_THEMES, applyTheme } from '../theme/themes';

interface HeaderProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  dockPosition: DockPosition;
  onDockPositionChange: (pos: DockPosition) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTheme,
  onThemeChange,
  dockPosition,
  onDockPositionChange,
}) => {
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDate(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleManualBackup = async () => {
    setIsBackingUp(true);
    setBackupStatus(null);
    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke<string>('trigger_backup');
        setBackupStatus('Snapshot saved to /mnt/StudyBackups');
        setTimeout(() => setBackupStatus(null), 4000);
      } else {
        setTimeout(() => {
          setBackupStatus('Simulated snapshot (browser mode)');
          setTimeout(() => setBackupStatus(null), 3000);
        }, 800);
      }
    } catch (err: any) {
      console.error(err);
      setBackupStatus('Backup notice: ' + (err?.toString() || 'Error'));
      setTimeout(() => setBackupStatus(null), 5000);
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <header className="h-14 border-b border-border bg-surface px-4 flex items-center justify-between select-none z-30 shadow-sm">
      {/* Brand & Telemetry */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-3 h-3 rounded-full bg-primary shadow-sm" />
          <span className="font-mono font-bold tracking-wider text-base text-text-main">
            Study<span className="text-primary">OS</span>
          </span>
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-primary/10 border border-primary/30 rounded-md text-primary">
            v0.1.0
          </span>
        </div>

        <div className="hidden md:flex items-center space-x-3 text-xs font-mono text-text-muted border-l border-border pl-4">
          <span className="flex items-center space-x-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-success" />
            <span className="text-text-main">Local Secure</span>
          </span>
          <span className="text-text-faint">•</span>
          <span className="flex items-center space-x-1.5 font-medium">
            <HardDrive className="w-3.5 h-3.5 text-accent" />
            <span className="text-text-main">ext4 Hardlinks</span>
          </span>
        </div>
      </div>

      {/* Center Status / Time Display */}
      <div className="hidden lg:flex items-center space-x-3 font-mono text-xs">
        <span className="text-text-muted font-medium">{date}</span>
        <span className="px-2.5 py-1 bg-canvas border border-border rounded-lg text-primary font-bold tracking-wider shadow-inner">
          {time}
        </span>
      </div>

      {/* Right Controls & Quick Actions */}
      <div className="flex items-center space-x-2">
        {backupStatus && (
          <div className="text-[11px] font-mono px-3 py-1 rounded-lg bg-canvas border border-primary/40 text-primary flex items-center space-x-1.5 animate-fadeIn">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            <span className="font-semibold">{backupStatus}</span>
          </div>
        )}

        {/* Dock Position Quick Switcher */}
        <div className="hidden sm:flex items-center bg-canvas p-0.5 rounded-lg border border-border">
          {(['left', 'bottom', 'right'] as const).map((pos) => (
            <button
              key={pos}
              onClick={() => onDockPositionChange(pos)}
              className={`px-2 py-1 rounded-md text-[11px] font-mono uppercase font-semibold transition ${
                dockPosition === pos
                  ? 'bg-surface text-primary shadow-sm border border-border'
                  : 'text-text-faint hover:text-text-main'
              }`}
              title={`Move navigation dock to ${pos}`}
            >
              {pos}
            </button>
          ))}
        </div>

        {/* 1-Click Snapshot */}
        <button
          onClick={handleManualBackup}
          disabled={isBackingUp}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-canvas hover:bg-surfaceHover border border-border hover:border-primary text-text-main transition shadow-sm"
          title="Create an immediate hardlinked snapshot to /mnt/StudyBackups"
        >
          <Camera className={`w-3.5 h-3.5 text-primary ${isBackingUp ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">SNAPSHOT</span>
        </button>

        {/* Theme Picker Dropdown */}
        <select
          value={currentTheme.id}
          onChange={(e) => {
            const found = BUILT_IN_THEMES.find((t) => t.id === e.target.value);
            if (found) {
              onThemeChange(found);
              applyTheme(found);
            }
          }}
          className="bg-canvas border border-border text-xs font-mono text-text-main rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary font-semibold"
        >
          {BUILT_IN_THEMES.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.name}
            </option>
          ))}
        </select>

        {/* Dark/Light Quick Toggle */}
        <button
          onClick={() => {
            const updated = { ...currentTheme, is_dark: !currentTheme.is_dark };
            onThemeChange(updated);
            applyTheme(updated);
          }}
          className="p-1.5 rounded-lg bg-canvas border border-border hover:border-primary text-text-muted hover:text-text-main transition"
          title="Toggle Dark/Light"
        >
          {currentTheme.is_dark ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-accent" />}
        </button>
      </div>
    </header>
  );
};
