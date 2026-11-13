import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { HierarchyView } from './components/HierarchyView';
import { ThemeStudioView } from './components/ThemeStudioView';
import { SettingsView } from './components/SettingsView';
import { Theme, DockPosition } from './types';
import { BUILT_IN_THEMES, applyTheme } from './theme/themes';
import { dbService } from './services/db';
import { BookOpen, Scissors, Clock, Volume2 } from 'lucide-react';

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
    'audio',
    'themes',
    'settings',
  ]);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

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
          setVisibleTabs(JSON.parse(savedTabs));
        } catch (e) {
          console.warn('Failed to parse saved visible tabs:', e);
        }
      }

      // 2. Apply Academic Studio theme as default
      applyTheme(BUILT_IN_THEMES[0]);

      // 3. Initialize local SQLite database
      await dbService.init();

      // 4. Load saved user theme if present
      try {
        const savedThemes = await dbService.getThemes();
        if (savedThemes && savedThemes.length > 0) {
          // If the first theme is the old cyberdeck, prefer our new default Academic Studio
          const found = savedThemes.find((t) => t.id === 'academic-studio') || BUILT_IN_THEMES[0];
          setCurrentTheme(found);
          applyTheme(found);
        }
      } catch (e) {
        console.warn('Using fallback preset:', e);
      }

      setIsInitialized(true);
    };

    initApp();
  }, []);

  const handleDockPositionChange = (pos: DockPosition) => {
    setDockPosition(pos);
    localStorage.setItem('studyos_dock_position', pos);
  };

  const handleVisibleTabsChange = (tabs: string[]) => {
    setVisibleTabs(tabs);
    localStorage.setItem('studyos_visible_tabs', JSON.stringify(tabs));
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
        onThemeChange={(th) => {
          setCurrentTheme(th);
          applyTheme(th);
        }}
        dockPosition={dockPosition}
        onDockPositionChange={handleDockPositionChange}
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

          {activeTab === 'themes' && (
            <ThemeStudioView
              currentTheme={currentTheme}
              onThemeSelect={(th) => {
                setCurrentTheme(th);
                applyTheme(th);
              }}
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

          {/* Placeholders for Subsequent Scheduled Phases */}
          {activeTab === 'pdf_viewer' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center font-mono space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-surface border border-border flex items-center justify-center text-primary shadow-sm">
                <BookOpen className="w-6 h-6 animate-pulse" />
              </div>
              <div className="text-base font-bold text-text-main">PDF Workstation & Multi-Pane View</div>
              <p className="text-xs text-text-muted max-w-sm">
                Scheduled for Phase 4: Local PDF.js canvas, non-destructive SQLite highlights, and split view.
              </p>
            </div>
          )}

          {activeTab === 'units' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center font-mono space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-surface border border-border flex items-center justify-center text-accent shadow-sm">
                <Scissors className="w-6 h-6 animate-pulse" />
              </div>
              <div className="text-base font-bold text-text-main">Unit Extractor Suite</div>
              <p className="text-xs text-text-muted max-w-sm">
                Scheduled for Phase 5: Range parser (e.g. "1-5,7,10-20") and offline pure-Rust extraction via lopdf.
              </p>
            </div>
          )}

          {activeTab === 'timers' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center font-mono space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-surface border border-border flex items-center justify-center text-secondary shadow-sm">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div className="text-base font-bold text-text-main">Study Timers & Cockpit HUD</div>
              <p className="text-xs text-text-muted max-w-sm">
                Scheduled for Phase 6: Pomodoro, session timer, stopwatch, and Flight-Style HUD countdown.
              </p>
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center font-mono space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-surface border border-border flex items-center justify-center text-success shadow-sm">
                <Volume2 className="w-6 h-6 animate-pulse" />
              </div>
              <div className="text-base font-bold text-text-main">Procedural Rain & Soundscape Mixer</div>
              <p className="text-xs text-text-muted max-w-sm">
                Scheduled for Phase 6b: Real-time Web Audio API rain synthesis, thunder bursts, and multi-track mixing.
              </p>
            </div>
          )}
        </main>

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
