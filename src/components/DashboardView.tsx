import React, { useState, useEffect } from 'react';
import {
  Clock,
  BookOpen,
  TrendingUp,
  CheckCircle2,
  Activity,
  Plus,
  Sliders,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Scissors,
  Layers,
  Palette,
  Calendar,
  Flame,
  FileText,
  Timer,
} from 'lucide-react';
import { Year, Subject, Resource, Profile, DashboardWidget } from '../types';
import { dbService } from '../services/db';
import { EmptyState } from './EmptyState';

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'w-welcome', title: 'Mission Briefing', type: 'welcome', visible: true, order: 1 },
  { id: 'w-kpis', title: 'Academic Metrics', type: 'kpis', visible: true, order: 2 },
  { id: 'w-streak', title: 'Study Streak & Cadence', type: 'study_streak', visible: true, order: 3 },
  { id: 'w-recent', title: 'Recently Opened PDFs', type: 'recently_opened', visible: true, order: 4 },
  { id: 'w-subjects', title: 'Active Subjects Vault', type: 'enrolled_subjects', visible: true, order: 5 },
  { id: 'w-tools', title: 'Quick Launch Matrix', type: 'quick_tools', visible: true, order: 6 },
];

interface DashboardViewProps {
  onNavigate: (tab: any) => void;
  onAddYear: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onAddYear }) => {
  const [years, setYears] = useState<Year[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [widgets, setWidgets] = useState<DashboardWidget[]>(DEFAULT_WIDGETS);
  const [isEditingWidgets, setIsEditingWidgets] = useState<boolean>(false);

  useEffect(() => {
    loadData();
    loadWidgetLayout();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [y, s, r, p] = await Promise.all([
        dbService.getYears(),
        dbService.getSubjects(),
        dbService.getResources(),
        dbService.getProfile(),
      ]);
      setYears(y);
      setSubjects(s);
      setResources(r);
      setProfile(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadWidgetLayout = () => {
    const saved = localStorage.getItem('studyos_dashboard_widgets');
    if (saved) {
      try {
        setWidgets(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to parse saved widget layout:', e);
      }
    }
  };

  const saveWidgetLayout = (newWidgets: DashboardWidget[]) => {
    setWidgets(newWidgets);
    localStorage.setItem('studyos_dashboard_widgets', JSON.stringify(newWidgets));
  };

  const toggleWidget = (id: string) => {
    const updated = widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w));
    saveWidgetLayout(updated);
  };

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= widgets.length) return;

    const copy = [...widgets];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    const reordered = copy.map((w, idx) => ({ ...w, order: idx + 1 }));
    saveWidgetLayout(reordered);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center font-mono text-sm text-text-muted">
        <Activity className="w-5 h-5 text-primary animate-spin mr-2" />
        LOADING DASHBOARD TELEMETRY...
      </div>
    );
  }

  // If zero years exist, show the designed high-contrast empty state
  if (years.length === 0) {
    return (
      <EmptyState
        onAddYear={onAddYear}
        onOpenProfile={() => onNavigate('settings')}
      />
    );
  }

  const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 ambient-bg">
      {/* Widget Layout Customizer Toolbar */}
      <div className="flex items-center justify-between pb-1 border-b border-border/60">
        <div className="text-xs font-mono text-text-muted">
          Dashboard Cockpit • {widgets.filter((w) => w.visible).length} Active Widgets
        </div>
        <button
          onClick={() => setIsEditingWidgets(!isEditingWidgets)}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition flex items-center space-x-1.5 ${
            isEditingWidgets
              ? 'bg-primary text-canvas font-bold border-primary shadow-sm'
              : 'bg-surface hover:bg-surfaceHover text-text-main border-border'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{isEditingWidgets ? 'DONE CUSTOMIZING' : 'CUSTOMIZE WIDGETS'}</span>
        </button>
      </div>

      {/* Widget Customizer Drawer */}
      {isEditingWidgets && (
        <div className="hud-panel p-4 space-y-3 animate-fadeIn">
          <div className="text-xs font-mono font-bold text-text-main">
            REORDER & TOGGLE DASHBOARD WIDGETS
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {sortedWidgets.map((w, idx) => (
              <div
                key={w.id}
                className="p-3 rounded-lg bg-canvas border border-border flex items-center justify-between font-mono text-xs"
              >
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleWidget(w.id)}
                    className="text-text-muted hover:text-text-main"
                  >
                    {w.visible ? (
                      <Eye className="w-4 h-4 text-primary" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-text-faint" />
                    )}
                  </button>
                  <span className={w.visible ? 'text-text-main font-semibold' : 'text-text-faint line-through'}>
                    {w.title}
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => moveWidget(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 text-text-muted hover:text-text-main disabled:opacity-30"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveWidget(idx, 'down')}
                    disabled={idx === sortedWidgets.length - 1}
                    className="p-1 text-text-muted hover:text-text-main disabled:opacity-30"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Widget Grid Rendering */}
      {sortedWidgets.map((w) => {
        if (!w.visible) return null;

        // Widget: Welcome
        if (w.type === 'welcome') {
          return (
            <div
              key={w.id}
              className="hud-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-primary"
            >
              <div>
                <div className="text-xs font-mono text-primary font-bold uppercase tracking-wider mb-1.5 flex items-center space-x-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>ACADEMIC MISSION CONTROL</span>
                </div>
                <h1 className="text-2xl font-bold font-mono tracking-tight text-text-main">
                  {profile?.name ? `Welcome back, ${profile.name}` : 'Welcome to StudyOS'}
                </h1>
                <p className="text-xs text-text-muted mt-1 font-mono">
                  {profile?.major
                    ? `${profile.major} • ${profile.university} (${profile.current_semester || 'Active Semester'})`
                    : 'Personalized, offline-first university workspace'}
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onNavigate('timers')}
                  className="px-4 py-2.5 rounded-lg text-xs font-mono bg-primary text-canvas hover:brightness-110 font-bold tracking-wider shadow-sm flex items-center space-x-2 transition"
                >
                  <Clock className="w-4 h-4 stroke-[2.5]" />
                  <span>START FOCUS SESSION</span>
                </button>
              </div>
            </div>
          );
        }

        // Widget: KPIs
        if (w.type === 'kpis') {
          return (
            <div key={w.id} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="hud-panel p-5">
                <div className="flex items-center justify-between text-text-muted text-xs font-mono mb-2">
                  <span className="font-semibold">ACTIVE SUBJECTS</span>
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                <div className="text-3xl font-bold font-mono text-text-main">{subjects.length}</div>
                <div className="text-xs font-mono text-text-faint mt-1.5 font-medium">Across all semesters</div>
              </div>

              <div className="hud-panel p-5">
                <div className="flex items-center justify-between text-text-muted text-xs font-mono mb-2">
                  <span className="font-semibold">ACADEMIC YEARS</span>
                  <TrendingUp className="w-4 h-4 text-accent" />
                </div>
                <div className="text-3xl font-bold font-mono text-text-main">{years.length}</div>
                <div className="text-xs font-mono text-text-faint mt-1.5 font-medium">Configured in database</div>
              </div>

              <div className="hud-panel p-5">
                <div className="flex items-center justify-between text-text-muted text-xs font-mono mb-2">
                  <span className="font-semibold">LIBRARY RESOURCES</span>
                  <FileText className="w-4 h-4 text-secondary" />
                </div>
                <div className="text-3xl font-bold font-mono text-text-main">{resources.length}</div>
                <div className="text-xs font-mono text-text-faint mt-1.5 font-medium">Textbooks & guides stored</div>
              </div>

              <div className="hud-panel p-5">
                <div className="flex items-center justify-between text-text-muted text-xs font-mono mb-2">
                  <span className="font-semibold">STUDY COMPLETION</span>
                  <CheckCircle2 className="w-4 h-4 text-success" />
                </div>
                <div className="text-3xl font-bold font-mono text-text-main">
                  {resources.length > 0
                    ? Math.round((resources.filter((r) => r.is_studied).length / resources.length) * 100)
                    : 0}
                  %
                </div>
                <div className="text-xs font-mono text-text-faint mt-1.5 font-medium">Resources studied</div>
              </div>
            </div>
          );
        }

        // Widget: Study Streak & Cadence
        if (w.type === 'study_streak') {
          return (
            <div key={w.id} className="hud-panel p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/40 flex items-center justify-center text-accent">
                  <Flame className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="font-mono text-sm font-bold text-text-main">Daily Focus Cadence: 3 Day Streak</div>
                  <div className="text-xs text-text-muted font-sans mt-0.5">
                    Consistency builds mastery. 45 minutes focused study logged yesterday.
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 font-mono text-xs">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                  <div
                    key={i}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${
                      i < 3
                        ? 'bg-accent text-canvas shadow-sm'
                        : 'bg-canvas border border-border text-text-faint'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // Widget: Recently Opened PDFs
        if (w.type === 'recently_opened') {
          return (
            <div key={w.id} className="hud-panel p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="font-mono text-sm font-bold tracking-wider text-text-main flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-secondary" />
                  <span>RECENT COURSE MATERIALS</span>
                </div>
                <button
                  onClick={() => onNavigate('pdf_viewer')}
                  className="text-xs font-mono text-primary hover:underline font-semibold"
                >
                  Open PDF Workstation →
                </button>
              </div>

              {resources.length === 0 ? (
                <div className="text-center py-6 font-mono text-xs text-text-muted">
                  No PDF resources imported yet. Ingest your textbooks and course guides in the Academic Tree.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {resources.slice(0, 6).map((res) => (
                    <div
                      key={res.id}
                      onClick={() => onNavigate('pdf_viewer')}
                      className="p-3.5 rounded-xl bg-canvas border border-border hover:border-primary/50 cursor-pointer transition shadow-sm space-y-1.5"
                    >
                      <div className="font-mono text-xs font-bold text-text-main truncate">{res.title}</div>
                      <div className="text-[11px] font-mono text-text-faint flex items-center justify-between">
                        <span>{res.page_count} pages</span>
                        <span>{res.is_studied ? '✓ Studied' : 'Page ' + res.last_page}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }

        // Widget: Enrolled Subjects
        if (w.type === 'enrolled_subjects') {
          return (
            <div key={w.id} className="hud-panel p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="font-mono text-sm font-bold tracking-wider text-text-main">
                  CURRENT ENROLLED SUBJECTS
                </div>
                <button
                  onClick={() => onNavigate('hierarchy')}
                  className="text-xs font-mono text-primary hover:underline flex items-center space-x-1 font-semibold"
                >
                  <span>Manage Academic Tree →</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {subjects.map((sub) => (
                  <div
                    key={sub.id}
                    style={{ borderLeftColor: sub.accent_color }}
                    className="p-4 rounded-xl bg-canvas border border-border border-l-4 hover:border-primary/50 transition shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-text-main">{sub.name}</span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface border border-border text-text-muted font-bold">
                        {sub.code}
                      </span>
                    </div>
                    <div className="text-xs text-text-faint mt-2 font-mono font-medium">
                      {sub.credits} Credits • {sub.professor || 'Course Instructor'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // Widget: Quick Launch Tools
        if (w.type === 'quick_tools') {
          return (
            <div key={w.id} className="hud-panel p-6 space-y-4">
              <div className="font-mono text-sm font-bold tracking-wider text-text-main">
                QUICK ACCESS UTILITIES
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => onNavigate('hierarchy')}
                  className="p-4 rounded-xl bg-canvas border border-border hover:border-primary/50 text-left font-mono transition group"
                >
                  <Layers className="w-5 h-5 text-primary mb-2" />
                  <div className="text-xs font-bold text-text-main">Curriculum</div>
                  <div className="text-[11px] text-text-faint mt-0.5">Manage Years & Subjects</div>
                </button>

                <button
                  onClick={() => onNavigate('pdf_viewer')}
                  className="p-4 rounded-xl bg-canvas border border-border hover:border-primary/50 text-left font-mono transition group"
                >
                  <BookOpen className="w-5 h-5 text-secondary mb-2" />
                  <div className="text-xs font-bold text-text-main">PDF Workstation</div>
                  <div className="text-[11px] text-text-faint mt-0.5">Read & Multi-pane split</div>
                </button>

                <button
                  onClick={() => onNavigate('units')}
                  className="p-4 rounded-xl bg-canvas border border-border hover:border-primary/50 text-left font-mono transition group"
                >
                  <Scissors className="w-5 h-5 text-accent mb-2" />
                  <div className="text-xs font-bold text-text-main">Unit Extractor</div>
                  <div className="text-[11px] text-text-faint mt-0.5">Slice & merge chapters</div>
                </button>

                <button
                  onClick={() => onNavigate('themes')}
                  className="p-4 rounded-xl bg-canvas border border-border hover:border-primary/50 text-left font-mono transition group"
                >
                  <Palette className="w-5 h-5 text-success mb-2" />
                  <div className="text-xs font-bold text-text-main">Theme Studio</div>
                  <div className="text-[11px] text-text-faint mt-0.5">Aesthetics & Density</div>
                </button>
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};
