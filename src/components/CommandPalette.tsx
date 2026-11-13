import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  BookOpen,
  Layers,
  Clock,
  Volume2,
  Palette,
  Settings,
  Calendar,
  Sparkles,
  ArrowRight,
  HardDrive,
  Moon,
  Sun,
  X,
  FileText,
  CheckSquare,
} from 'lucide-react';
import { Subject, Resource, ChecklistItem, Theme } from '../types';
import { dbService } from '../services/db';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: any) => void;
  currentTheme: Theme;
  onThemeToggle: () => void;
}

interface SearchItem {
  id: string;
  category: 'Navigation' | 'Action' | 'Subject' | 'Resource';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  currentTheme,
  onThemeToggle,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [subs, res] = await Promise.all([
        dbService.getSubjects(),
        dbService.getResources(),
      ]);
      setSubjects(subs);
      setResources(res);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  // Build searchable items
  const items: SearchItem[] = [
    // Quick Actions
    {
      id: 'act-toggle-theme',
      category: 'Action',
      title: `Switch to ${currentTheme.is_dark ? 'Light' : 'Dark'} Mode`,
      subtitle: 'Toggle global color scheme',
      icon: currentTheme.is_dark ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4 text-primary" />,
      action: () => {
        onThemeToggle();
        onClose();
      },
    },
    {
      id: 'act-backup',
      category: 'Action',
      title: 'Trigger Snapshot Backup',
      subtitle: 'Create hardlink snapshot in /mnt/StudyBackups',
      icon: <HardDrive className="w-4 h-4 text-accent" />,
      action: async () => {
        onClose();
        if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
          const { invoke } = await import('@tauri-apps/api/core');
          await invoke('trigger_backup');
        }
      },
    },

    // Navigation
    {
      id: 'nav-dashboard',
      category: 'Navigation',
      title: 'Mission Control Dashboard',
      subtitle: 'Jump to academic telemetry & widgets',
      icon: <Sparkles className="w-4 h-4 text-primary" />,
      action: () => {
        onNavigate('dashboard');
        onClose();
      },
    },
    {
      id: 'nav-hierarchy',
      category: 'Navigation',
      title: 'Curriculum & Academic Tree',
      subtitle: 'Manage Years, Semesters, and Subjects',
      icon: <Layers className="w-4 h-4 text-secondary" />,
      action: () => {
        onNavigate('hierarchy');
        onClose();
      },
    },
    {
      id: 'nav-pdf',
      category: 'Navigation',
      title: 'PDF Multi-Pane Workstation',
      subtitle: 'Read course materials with split view',
      icon: <BookOpen className="w-4 h-4 text-primary" />,
      action: () => {
        onNavigate('pdf_viewer');
        onClose();
      },
    },
    {
      id: 'nav-timers',
      category: 'Navigation',
      title: 'Study Timers Suite & HUD',
      subtitle: 'Pomodoro, Session timer, and Flight HUD',
      icon: <Clock className="w-4 h-4 text-accent" />,
      action: () => {
        onNavigate('timers');
        onClose();
      },
    },
    {
      id: 'nav-calendar',
      category: 'Navigation',
      title: 'Calendar & Exam Countdowns',
      subtitle: 'Upcoming exam milestones and schedules',
      icon: <Calendar className="w-4 h-4 text-success" />,
      action: () => {
        onNavigate('calendar');
        onClose();
      },
    },
    {
      id: 'nav-audio',
      category: 'Navigation',
      title: 'Atmospheric Rain & Soundscapes',
      subtitle: 'Procedural noise synthesis and mixer',
      icon: <Volume2 className="w-4 h-4 text-success" />,
      action: () => {
        onNavigate('audio');
        onClose();
      },
    },
    {
      id: 'nav-themes',
      category: 'Navigation',
      title: 'Theme Studio & Design Tokens',
      subtitle: 'Customize typography, colors, and density',
      icon: <Palette className="w-4 h-4 text-secondary" />,
      action: () => {
        onNavigate('themes');
        onClose();
      },
    },
    {
      id: 'nav-settings',
      category: 'Navigation',
      title: 'Settings, Backups & Vault',
      subtitle: 'Configure dock, profile, and snapshot history',
      icon: <Settings className="w-4 h-4 text-text-muted" />,
      action: () => {
        onNavigate('settings');
        onClose();
      },
    },

    // Subjects
    ...subjects.map((sub) => ({
      id: 'sub-' + sub.id,
      category: 'Subject' as const,
      title: `${sub.code} - ${sub.name}`,
      subtitle: `${sub.credits} Credits • ${sub.professor || 'Instructor'}`,
      icon: <Layers className="w-4 h-4 text-primary" />,
      action: () => {
        onNavigate('hierarchy');
        onClose();
      },
    })),

    // Resources
    ...resources.map((res) => ({
      id: 'res-' + res.id,
      category: 'Resource' as const,
      title: res.title,
      subtitle: `${res.page_count} Pages • Last read page ${res.last_page}`,
      icon: <FileText className="w-4 h-4 text-secondary" />,
      action: () => {
        onNavigate('pdf_viewer');
        onClose();
      },
    })),
  ];

  const q = query.toLowerCase().trim();
  const filtered = q
    ? items.filter(
        (it) =>
          it.title.toLowerCase().includes(q) ||
          (it.subtitle && it.subtitle.toLowerCase().includes(q)) ||
          it.category.toLowerCase().includes(q)
      )
    : items;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-canvas/80 backdrop-blur-md flex items-start justify-center pt-20 px-4 select-none">
      <div
        className="hud-panel w-full max-w-xl overflow-hidden border border-border shadow-2xl rounded-2xl flex flex-col max-h-[520px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-border flex items-center space-x-3 bg-surface">
          <Search className="w-5 h-5 text-primary" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search subjects, PDFs, actions, or jump anywhere... (Esc to cancel)"
            className="flex-1 bg-transparent border-none text-sm font-mono text-text-main focus:outline-none placeholder:text-text-muted"
          />
          <div className="flex items-center space-x-1.5 font-mono text-[10px] text-text-muted bg-canvas px-2 py-0.5 rounded border border-border">
            <span>ESC</span>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/40 p-2">
          {filtered.length === 0 ? (
            <div className="py-10 text-center font-mono text-xs text-text-muted">
              No matching academic materials or commands found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-3 py-2.5 rounded-xl flex items-center justify-between cursor-pointer transition ${
                    isSelected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-canvas/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-surface border border-border flex-shrink-0">
                      {item.icon}
                    </div>
                    <div className="truncate">
                      <div className="font-mono text-xs font-bold text-text-main truncate">
                        {item.title}
                      </div>
                      {item.subtitle && (
                        <div className="text-[10px] font-mono text-text-muted truncate">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-text-faint font-semibold uppercase">
                      {item.category}
                    </span>
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-primary stroke-[3]" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-border bg-surface text-[10px] font-mono text-text-muted flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span><kbd className="px-1 py-0.5 rounded bg-canvas border border-border">↑</kbd> <kbd className="px-1 py-0.5 rounded bg-canvas border border-border">↓</kbd> to navigate</span>
            <span><kbd className="px-1 py-0.5 rounded bg-canvas border border-border">↵</kbd> to select</span>
          </div>
          <span>StudyOS Global Command</span>
        </div>
      </div>
    </div>
  );
};
