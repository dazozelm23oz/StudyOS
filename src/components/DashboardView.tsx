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
  Sparkles,
  Scissors,
  Layers,
  Palette,
  Calendar,
  Flame,
  FileText,
  Timer,
  GripVertical,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Year, Subject, Resource, Profile, DashboardWidget, SessionLog } from '../types';
import { dbService } from '../services/db';
import { EmptyState } from './EmptyState';

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'w-welcome', title: 'Mission Briefing', type: 'welcome', visible: true, order: 1, width: 'full' },
  { id: 'w-kpis', title: 'Academic Metrics', type: 'kpis', visible: true, order: 2, width: 'full' },
  { id: 'w-timer-stats', title: 'Focus Chrono Telemetry', type: 'timer_stats', visible: true, order: 3, width: 'half' },
  { id: 'w-date', title: 'Academic Calendar & Schedule', type: 'date_calendar', visible: true, order: 4, width: 'half' },
  { id: 'w-streak', title: 'Study Streak & Cadence', type: 'study_streak', visible: true, order: 5, width: 'full' },
  { id: 'w-recent', title: 'Recently Opened PDFs', type: 'recently_opened', visible: true, order: 6, width: 'full' },
  { id: 'w-subjects', title: 'Active Subjects Vault', type: 'enrolled_subjects', visible: true, order: 7, width: 'half' },
  { id: 'w-tools', title: 'Quick Launch Matrix', type: 'quick_tools', visible: true, order: 8, width: 'half' },
];

interface SortableWidgetProps {
  id: string;
  width?: 'full' | 'half' | 'third';
  isEditing: boolean;
  onWidthChange: (w: 'full' | 'half' | 'third') => void;
  children: React.ReactNode;
}

const SortableWidget: React.FC<SortableWidgetProps> = ({
  id,
  width = 'full',
  isEditing,
  onWidthChange,
  children,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 30 : 1,
    opacity: isDragging ? 0.75 : 1,
  };

  const colSpanClass =
    width === 'third'
      ? 'col-span-1 md:col-span-2'
      : width === 'half'
      ? 'col-span-1 md:col-span-3'
      : 'col-span-1 md:col-span-6';

  return (
    <div ref={setNodeRef} style={style} className={`${colSpanClass} relative group flex flex-col`}>
      {isEditing && (
        <div className="absolute top-2 right-2 z-20 flex items-center space-x-1.5 bg-surface border border-border px-2 py-1 rounded-lg backdrop-blur-md shadow-md">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 text-text-muted hover:text-text-main"
            title="Drag to rearrange"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          <div className="h-3 w-[1px] bg-border" />
          {(['third', 'half', 'full'] as const).map((wt) => (
            <button
              key={wt}
              onClick={() => onWidthChange(wt)}
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded capitalize transition ${
                (width || 'full') === wt
                  ? 'bg-primary text-canvas font-bold'
                  : 'text-text-faint hover:text-text-main'
              }`}
            >
              {wt === 'third' ? '⅓' : wt === 'half' ? '½' : 'Full'}
            </button>
          ))}
        </div>
      )}
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
};

interface DashboardViewProps {
  onNavigate: (tab: any) => void;
  onAddYear: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onAddYear }) => {
  const [years, setYears] = useState<Year[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);
  const [totalTimeSecs, setTotalTimeSecs] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [widgets, setWidgets] = useState<DashboardWidget[]>(DEFAULT_WIDGETS);
  const [isEditingWidgets, setIsEditingWidgets] = useState<boolean>(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadData();
    loadWidgetLayout();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [y, s, r, p, logs, totalSec] = await Promise.all([
        dbService.getYears(),
        dbService.getSubjects(),
        dbService.getResources(),
        dbService.getProfile(),
        dbService.getSessionLogs(),
        dbService.getTotalTimeSeconds(),
      ]);
      setYears(y);
      setSubjects(s);
      setResources(r);
      setProfile(p);
      setSessionLogs(logs);
      setTotalTimeSecs(totalSec);
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
        const parsed: DashboardWidget[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map((p) => p.id));
        const missing = DEFAULT_WIDGETS.filter((dw) => !existingIds.has(dw.id));
        const merged = [...parsed, ...missing].map((w, idx) => ({
          ...w,
          order: idx + 1,
          width: w.width || 'full',
        }));
        setWidgets(merged);
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

  const setWidgetWidth = (id: string, width: 'full' | 'half' | 'third') => {
    const updated = widgets.map((w) => (w.id === id ? { ...w, width } : w));
    saveWidgetLayout(updated);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = widgets.findIndex((w) => w.id === active.id);
    const newIndex = widgets.findIndex((w) => w.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(widgets, oldIndex, newIndex).map((w, idx) => ({
        ...w,
        order: idx + 1,
      }));
      saveWidgetLayout(reordered);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center font-mono text-sm text-text-muted">
        <Activity className="w-5 h-5 text-primary animate-spin mr-2" />
        LOADING DASHBOARD TELEMETRY...
      </div>
    );
  }

  if (years.length === 0) {
    return (
      <EmptyState
        onAddYear={onAddYear}
        onOpenProfile={() => onNavigate('settings')}
      />
    );
  }

  const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order);
  const visibleWidgets = sortedWidgets.filter((w) => w.visible);

  const renderWidgetContent = (w: DashboardWidget) => {
    // 1. Welcome Widget
    if (w.type === 'welcome') {
      return (
        <div className="hud-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-primary h-full">
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

    // 2. KPIs Widget
    if (w.type === 'kpis') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
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

    // 3. Timer Stats
    if (w.type === 'timer_stats') {
      const hours = Math.floor(totalTimeSecs / 3600);
      const mins = Math.floor((totalTimeSecs % 3600) / 60);
      return (
        <div className="hud-panel p-6 space-y-4 h-full">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="font-mono text-sm font-bold tracking-wider text-text-main flex items-center space-x-2">
              <Timer className="w-4 h-4 text-primary" />
              <span>FOCUS CHRONOMETER TELEMETRY</span>
            </div>
            <button
              onClick={() => onNavigate('timers')}
              className="text-xs font-mono text-primary hover:underline font-semibold"
            >
              Launch Timer Suite →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-canvas border border-border">
              <div className="text-[11px] font-mono text-text-muted">TOTAL TIME</div>
              <div className="text-xl font-mono font-bold text-text-main mt-1">
                {hours > 0 ? `${hours}h ${mins}m` : `${mins} mins`}
              </div>
              <div className="text-[10px] font-mono text-success mt-0.5">Persisted in SQLite</div>
            </div>

            <div className="p-3.5 rounded-xl bg-canvas border border-border">
              <div className="text-[11px] font-mono text-text-muted">TOTAL SESSIONS</div>
              <div className="text-xl font-mono font-bold text-text-main mt-1">
                {sessionLogs.length}
              </div>
              <div className="text-[10px] font-mono text-primary mt-0.5">All timer modes</div>
            </div>

            <div className="p-3.5 rounded-xl bg-canvas border border-border">
              <div className="text-[11px] font-mono text-text-muted">LAST SESSION</div>
              <div className="text-sm font-mono font-bold text-text-main mt-1 truncate">
                {sessionLogs.length > 0
                  ? `${sessionLogs[0].timer_kind.toUpperCase()} (${Math.round(
                      sessionLogs[0].duration_seconds / 60
                    )}m)`
                  : 'None logged yet'}
              </div>
              <div className="text-[10px] font-mono text-text-faint mt-0.5">
                {sessionLogs.length > 0
                  ? new Date(sessionLogs[0].start_time).toLocaleDateString()
                  : 'Awaiting mission start'}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 4. Date Calendar
    if (w.type === 'date_calendar') {
      const now = new Date();
      const dateStr = now.toLocaleDateString([], {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      return (
        <div className="hud-panel p-6 flex flex-col justify-between gap-4 h-full">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary flex-shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="font-mono text-sm font-bold text-text-main">{dateStr}</div>
              <div className="text-xs text-text-muted font-sans mt-0.5">
                {profile?.current_semester ? `Active: ${profile.current_semester}` : 'Academic Schedule & Deadlines'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={() => onNavigate('calendar')}
              className="px-4 py-2 rounded-lg text-xs font-mono bg-canvas border border-border hover:border-primary text-text-main font-semibold transition w-full sm:w-auto"
            >
              Open Academic Calendar & Countdowns →
            </button>
          </div>
        </div>
      );
    }

    // 5. Study Streak
    if (w.type === 'study_streak') {
      return (
        <div className="hud-panel p-5 flex flex-col sm:flex-row items-center justify-between gap-4 h-full">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/40 flex items-center justify-center text-accent flex-shrink-0">
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

    // 6. Recently Opened PDFs
    if (w.type === 'recently_opened') {
      return (
        <div className="hud-panel p-6 space-y-4 h-full">
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

    // 7. Enrolled Subjects
    if (w.type === 'enrolled_subjects') {
      return (
        <div className="hud-panel p-6 space-y-4 h-full">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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

    // 8. Quick Tools
    if (w.type === 'quick_tools') {
      return (
        <div className="hud-panel p-6 space-y-4 h-full">
          <div className="font-mono text-sm font-bold tracking-wider text-text-main">
            QUICK ACCESS UTILITIES
          </div>
          <div className="grid grid-cols-2 gap-3">
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
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 ambient-bg">
      {/* Widget Layout Customizer Toolbar */}
      <div className="flex items-center justify-between pb-1 border-b border-border/60">
        <div className="text-xs font-mono text-text-muted">
          Mission Control Cockpit • {visibleWidgets.length} Active Widgets
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
          <span>{isEditingWidgets ? 'DONE CUSTOMIZING' : 'CUSTOMIZE & RESIZE WIDGETS'}</span>
        </button>
      </div>

      {/* Widget Customizer Drawer */}
      {isEditingWidgets && (
        <div className="hud-panel p-4 space-y-3 animate-fadeIn">
          <div className="text-xs font-mono font-bold text-text-main">
            REORDER, RESIZE & TOGGLE DASHBOARD WIDGETS
          </div>
          <p className="text-[11px] font-mono text-text-muted">
            Drag widgets using the handle to rearrange. Toggle visibility below, or use the width buttons (⅓, ½, Full) on each card.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2">
            {sortedWidgets.map((w) => (
              <div
                key={w.id}
                className="p-2.5 rounded-lg bg-canvas border border-border flex items-center justify-between font-mono text-xs"
              >
                <div className="flex items-center space-x-2 truncate">
                  <button
                    onClick={() => toggleWidget(w.id)}
                    className="text-text-muted hover:text-text-main flex-shrink-0"
                  >
                    {w.visible ? (
                      <Eye className="w-4 h-4 text-primary" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-text-faint" />
                    )}
                  </button>
                  <span className={`truncate ${w.visible ? 'text-text-main font-semibold' : 'text-text-faint line-through'}`}>
                    {w.title}
                  </span>
                </div>

                <div className="flex items-center space-x-1 flex-shrink-0">
                  {(['third', 'half', 'full'] as const).map((wt) => (
                    <button
                      key={wt}
                      onClick={() => setWidgetWidth(w.id, wt)}
                      className={`text-[9px] px-1 py-0.5 rounded capitalize ${
                        (w.width || 'full') === wt
                          ? 'bg-primary text-canvas font-bold'
                          : 'text-text-faint hover:text-text-main'
                      }`}
                    >
                      {wt === 'third' ? '⅓' : wt === 'half' ? '½' : '1'}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Widget Grid Rendering with @dnd-kit */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={visibleWidgets.map((w) => w.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            {visibleWidgets.map((w) => (
              <SortableWidget
                key={w.id}
                id={w.id}
                width={w.width}
                isEditing={isEditingWidgets}
                onWidthChange={(newW) => setWidgetWidth(w.id, newW)}
              >
                {renderWidgetContent(w)}
              </SortableWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
