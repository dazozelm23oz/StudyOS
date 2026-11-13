import React from 'react';
import {
  LayoutDashboard,
  Layers,
  BookOpen,
  Scissors,
  Clock,
  Volume2,
  Palette,
  Settings,
  ChevronRight,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'hierarchy'
  | 'pdf_viewer'
  | 'units'
  | 'timers'
  | 'audio'
  | 'themes'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const items: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Mission Control', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'hierarchy', label: 'Academic Tree', icon: <Layers className="w-4 h-4" /> },
    { id: 'pdf_viewer', label: 'PDF Workstation', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'units', label: 'Unit Extractor', icon: <Scissors className="w-4 h-4" /> },
    { id: 'timers', label: 'Study Timers', icon: <Clock className="w-4 h-4" /> },
    { id: 'audio', label: 'Rain & Audio', icon: <Volume2 className="w-4 h-4" /> },
    { id: 'themes', label: 'Theme Studio', icon: <Palette className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings & Vault', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-60 border-r border-border bg-surface/70 flex flex-col justify-between p-3 select-none">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-mono tracking-wider text-text-faint uppercase">
          NAVIGATION SYSTEMS
        </div>

        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition group ${
                isActive
                  ? 'bg-primary/10 border border-primary/40 text-primary shadow-sm'
                  : 'text-text-muted hover:bg-surfaceHover hover:text-text-main border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <span className={isActive ? 'text-primary' : 'text-text-muted group-hover:text-text-main'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-primary animate-pulse" />}
            </button>
          );
        })}
      </div>

      {/* Hardware & System Status Widget */}
      <div className="p-3 rounded-lg border border-border/60 bg-canvas/60 font-mono text-[11px] space-y-2">
        <div className="text-[10px] uppercase text-text-faint flex items-center justify-between">
          <span>HOST TELEMETRY</span>
          <span className="w-2 h-2 rounded-full bg-success inline-block animate-ping" />
        </div>
        <div className="flex justify-between text-text-muted">
          <span>OS:</span>
          <span className="text-text-main">Fedora KDE</span>
        </div>
        <div className="flex justify-between text-text-muted">
          <span>STORAGE:</span>
          <span className="text-text-main">Local ext4</span>
        </div>
        <div className="flex justify-between text-text-muted">
          <span>NETWORK:</span>
          <span className="text-success font-semibold">100% OFFLINE</span>
        </div>
      </div>
    </aside>
  );
};
