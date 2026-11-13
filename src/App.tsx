import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { HierarchyView } from './components/HierarchyView';
import { ThemeStudioView } from './components/ThemeStudioView';
import { SettingsView } from './components/SettingsView';
import { Theme } from './types';
import { BUILT_IN_THEMES, applyTheme } from './theme/themes';
import { dbService } from './services/db';
import { BookOpen, Scissors, Clock, Volume2 } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [currentTheme, setCurrentTheme] = useState<Theme>(BUILT_IN_THEMES[0]);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    const initApp = async () => {
      // 1. Apply default flagship theme immediately to prevent white flash
      applyTheme(BUILT_IN_THEMES[0]);

      // 2. Initialize local SQLite database
      await dbService.init();

      // 3. Load saved user themes from database if present
      try {
        const savedThemes = await dbService.getThemes();
        if (savedThemes && savedThemes.length > 0) {
          const first = savedThemes[0];
          setCurrentTheme(first);
          applyTheme(first);
        }
      } catch (e) {
        console.warn('Could not load themes from DB, using fallback preset:', e);
      }

      setIsInitialized(true);
    };

    initApp();
  }, []);

  if (!isInitialized) {
    return (
      <div className="h-screen w-screen bg-canvas flex flex-col items-center justify-center font-mono text-xs text-text-muted select-none">
        <div className="w-10 h-10 rounded-xl bg-surface border border-primary/40 flex items-center justify-center mb-3 shadow-hud-glow">
          <div className="w-4 h-4 rounded-full bg-primary animate-ping" />
        </div>
        <div className="tracking-widest font-bold text-text-main">STUDYOS NATIVE RUNTIME</div>
        <div className="text-[10px] text-text-faint mt-1">INITIALIZING SQLITE ENGINE & THEME MATRIX...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-canvas text-text-main overflow-hidden hud-grid-bg">
      {/* HUD Header */}
      <Header
        currentTheme={currentTheme}
        onThemeChange={(th) => {
          setCurrentTheme(th);
          applyTheme(th);
        }}
      />

      {/* Main Workspace: Sidebar + Dynamic Stage */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

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

          {activeTab === 'settings' && <SettingsView />}

          {/* Placeholders for Subsequent Scheduled Phases */}
          {activeTab === 'pdf_viewer' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center font-mono space-y-3">
              <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center text-primary">
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
              <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center text-accent">
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
              <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center text-secondary">
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
              <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center text-success">
                <Volume2 className="w-6 h-6 animate-pulse" />
              </div>
              <div className="text-base font-bold text-text-main">Procedural Rain & Soundscape Mixer</div>
              <p className="text-xs text-text-muted max-w-sm">
                Scheduled for Phase 6b: Real-time Web Audio API rain synthesis, thunder bursts, and multi-track mixing.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
