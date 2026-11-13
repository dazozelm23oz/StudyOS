import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { HierarchyView } from './components/HierarchyView';
import { PdfWorkstationView } from './components/PdfWorkstationView';
import { UnitExtractorView } from './components/UnitExtractorView';
import { ThemeStudioView } from './components/ThemeStudioView';
import { SettingsView } from './components/SettingsView';
import { StudyTimersView } from './components/StudyTimersView';
import { CalendarView } from './components/CalendarView';
import { SoundscapeMixer } from './components/SoundscapeMixer';
import { FloatingMiniPlayer } from './components/FloatingMiniPlayer';
import { CommandPalette } from './components/CommandPalette';
import { Theme, DockPosition } from './types';
import { BUILT_IN_THEMES, applyTheme } from './theme/themes';
import { dbService } from './services/db';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [currentTheme, setCurrentTheme] = useState<Theme>(BUILT_IN_THEMES[0]);
  const [dockPosition, setDockPosition] = useState<DockPosition>('left');
  const [visibleTabs, setVisibleTabs] = useState<string[]>([
    'dashboard',
    'hierarchy',
    'pdf_viewer',
    'units',
    'timers',
    'calendar',
    'audio',
    'themes',
    'settings',
  ]);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  useEffect(() => {
    const initApp = async () => {
      // 1. Load saved dock position & visible tabs from localStorage
      const savedDock = localStorage.getItem('studyos_dock_position') as DockPosition;
      if (savedDock && ['left', 'right', 'bottom'].includes(savedDock)) {
        setDockPosition(savedDock);
      }
      const savedTabs = localStorage.getItem('studyos_visible_tabs');
      if (savedTabs) {
        try {
          const parsed = JSON.parse(savedTabs);
          if (!parsed.includes('calendar')) parsed.push('calendar');
          setVisibleTabs(parsed);
        } catch (e) {
          console.warn('Failed to parse saved visible tabs:', e);
        }
      }

      // 2. Initialize local SQLite database
      await dbService.init();

      // 3. Load saved active theme from localStorage or SQLite
      const savedThemeId = localStorage.getItem('studyos_active_theme_id') || 'academic-studio';
      try {
        const savedThemes = await dbService.getThemes();
        const allThemes = [...BUILT_IN_THEMES, ...(savedThemes || [])];
        const found = allThemes.find((t) => t.id === savedThemeId) || BUILT_IN_THEMES[0];
        setCurrentTheme(found);
        applyTheme(found);
      } catch (e) {
        console.warn('Using fallback preset:', e);
        const fallback = BUILT_IN_THEMES.find((t) => t.id === savedThemeId) || BUILT_IN_THEMES[0];
        setCurrentTheme(fallback);
        applyTheme(fallback);
      }

      setIsInitialized(true);
    };

    initApp();
  }, []);

  // Keyboard shortcut listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDockPositionChange = (pos: DockPosition) => {
    setDockPosition(pos);
    localStorage.setItem('studyos_dock_position', pos);
  };

  const handleVisibleTabsChange = (tabs: string[]) => {
    const enforced = tabs.includes('settings') ? tabs : [...tabs, 'settings'];
    setVisibleTabs(enforced);
    localStorage.setItem('studyos_visible_tabs', JSON.stringify(enforced));
  };

  const handleThemeChange = (th: Theme) => {
    setCurrentTheme(th);
    applyTheme(th);
    localStorage.setItem('studyos_active_theme_id', th.id);
  };

  const handleToggleThemeMode = () => {
    const nextDark = !currentTheme.is_dark;
    const updated = { ...currentTheme, is_dark: nextDark };
    handleThemeChange(updated);
  };

  if (!isInitialized) {
    return (
      <div className="h-screen w-screen bg-canvas flex flex-col items-center justify-center font-mono text-xs text-text-muted select-none">
        <div className="w-12 h-12 rounded-2xl bg-surface border border-primary/40 flex items-center justify-center mb-3 shadow-md">
          <div className="w-4 h-4 rounded-full bg-primary animate-ping" />
        </div>
        <div className="tracking-widest font-bold text-text-main text-sm">STUDYOS NATIVE RUNTIME</div>
        <div className="text-xs text-text-muted mt-1">INITIALIZING ACADEMIC DESIGN MATRIX...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-canvas text-text-main overflow-hidden">
      {/* Topbar Header */}
      <Header
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Workspace with Dynamic Dock Positioning */}
      <div className={`flex-1 flex overflow-hidden ${dockPosition === 'bottom' ? 'flex-col' : 'flex-row'}`}>
        {/* Left Dock */}
        {dockPosition === 'left' && (
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            position="left"
            visibleTabs={visibleTabs}
          />
        )}

        {/* Dynamic Center Stage */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigate={setActiveTab}
              onAddYear={() => setActiveTab('hierarchy')}
            />
          )}

          {activeTab === 'hierarchy' && <HierarchyView />}

          {activeTab === 'pdf_viewer' && (
            <PdfWorkstationView onNavigateToHierarchy={() => setActiveTab('hierarchy')} />
          )}

          {activeTab === 'units' && <UnitExtractorView />}

          {activeTab === 'timers' && <StudyTimersView />}

          {activeTab === 'calendar' && <CalendarView />}

          {activeTab === 'audio' && <SoundscapeMixer />}

          {activeTab === 'themes' && (
            <ThemeStudioView
              currentTheme={currentTheme}
              onThemeSelect={handleThemeChange}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              dockPosition={dockPosition}
              onDockPositionChange={handleDockPositionChange}
              visibleTabs={visibleTabs}
              onVisibleTabsChange={handleVisibleTabsChange}
            />
          )}
        </main>

        {/* Persistent Floating Soundscape Mini-Player */}
        <FloatingMiniPlayer />

        {/* Global Command Palette (Ctrl+K) */}
        <CommandPalette
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onNavigate={(tab) => {
            setActiveTab(tab);
            setIsSearchOpen(false);
          }}
          currentTheme={currentTheme}
          onThemeToggle={handleToggleThemeMode}
        />

        {/* Right Dock */}
        {dockPosition === 'right' && (
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            position="right"
            visibleTabs={visibleTabs}
          />
        )}

        {/* Bottom Dock */}
        {dockPosition === 'bottom' && (
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            position="bottom"
            visibleTabs={visibleTabs}
          />
        )}
      </div>
    </div>
  );
};
