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
  WifiOff,
} from 'lucide-react';
import { DockPosition } from '../types';

export type NavTab =
  | 'dashboard'
  | 'hierarchy'
  | 'pdf_viewer'
  | 'units'
  | 'timers'
  | 'audio'
  | 'themes'
  | 'settings';

export interface NavItemDef {
  id: NavTab;
  label: string;
  icon: React.ReactNode;
  isMandatory?: boolean;
}

export const ALL_NAV_ITEMS: NavItemDef[] = [
  { id: 'dashboard', label: 'Mission Control', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'hierarchy', label: 'Academic Tree', icon: <Layers className="w-4 h-4" /> },
  { id: 'pdf_viewer', label: 'PDF Workstation', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'units', label: 'Unit Extractor', icon: <Scissors className="w-4 h-4" /> },
  { id: 'timers', label: 'Study Timers', icon: <Clock className="w-4 h-4" /> },
  { id: 'audio', label: 'Rain & Audio', icon: <Volume2 className="w-4 h-4" /> },
  { id: 'themes', label: 'Theme Studio', icon: <Palette className="w-4 h-4" /> },
  { id: 'settings', label: 'Settings & Vault', icon: <Settings className="w-4 h-4" />, isMandatory: true },
];

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  position?: DockPosition;
  visibleTabs?: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  position = 'left',
  visibleTabs = ['dashboard', 'hierarchy', 'pdf_viewer', 'units', 'timers', 'audio', 'themes', 'settings'],
}) => {
  // Settings is mandatory - always included!
  const effectiveTabs = visibleTabs.includes('settings') ? visibleTabs : [...visibleTabs, 'settings'];
  const items = ALL_NAV_ITEMS.filter((item) => item.isMandatory || effectiveTabs.includes(item.id));

  // --- Horizontal Bottom Dock Layout ---
  if (position === 'bottom') {
    return (
      <nav className="h-16 border-t border-border bg-surface px-4 flex items-center justify-center space-x-2 select-none z-30 shadow-2xl">
        <div className="flex items-center space-x-1 sm:space-x-2 bg-canvas/80 p-1.5 rounded-xl border border-border">
          {items.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition ${
                  isActive
                    ? 'bg-primary text-canvas font-bold shadow-sm'
                    : 'text-text-muted hover:text-text-main hover:bg-surface'
                }`}
                title={item.label}
              >
                <span>{item.icon}</span>
                <span className="hidden md:inline">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  // --- Vertical Left / Right Dock Layout ---
  return (
    <aside
      className={`w-64 border-border bg-surface flex flex-col justify-between p-3 select-none z-20 ${
        position === 'right' ? 'border-l' : 'border-r'
      }`}
    >
      <div className="space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-mono tracking-wider text-text-faint uppercase font-bold">
          ACADEMIC NAVIGATION
        </div>

        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono transition group ${
                isActive
                  ? 'bg-primary/15 border border-primary/50 text-text-main font-semibold shadow-sm'
                  : 'text-text-muted hover:bg-surfaceHover hover:text-text-main border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className={isActive ? 'text-primary' : 'text-text-muted group-hover:text-text-main'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-primary" />}
            </button>
          );
        })}
      </div>

      {/* Hardware & System Status Widget (High Contrast, Solid Background) */}
      <div className="p-3.5 rounded-xl border border-border bg-canvas text-xs font-mono space-y-2.5 shadow-md">
        <div className="text-[11px] uppercase text-text-faint font-bold flex items-center justify-between border-b border-border/80 pb-1.5">
          <span>HOST TELEMETRY</span>
          <span className="w-2.5 h-2.5 rounded-full bg-success inline-block shadow-sm" />
        </div>

        <div className="flex justify-between items-center text-text-muted">
          <span>PLATFORM:</span>
          <span className="text-text-main font-semibold">Fedora KDE</span>
        </div>

        <div className="flex justify-between items-center text-text-muted">
          <span>STORAGE:</span>
          <span className="text-text-main font-semibold">ext4 Hardlinks</span>
        </div>

        <div className="flex justify-between items-center text-text-muted">
          <span>NETWORK:</span>
          <span className="text-success font-bold flex items-center space-x-1">
            <WifiOff className="w-3 h-3" />
            <span>100% OFFLINE</span>
          </span>
        </div>
      </div>
    </aside>
  );
};
