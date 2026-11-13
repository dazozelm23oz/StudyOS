import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  Award,
  TrendingUp,
  CheckCircle2,
  HardDrive,
  Activity,
  Plus,
} from 'lucide-react';
import { Year, Subject, Profile } from '../types';
import { dbService } from '../services/db';
import { EmptyState } from './EmptyState';

interface DashboardViewProps {
  onNavigate: (tab: any) => void;
  onAddYear: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onAddYear }) => {
  const [years, setYears] = useState<Year[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [y, s, p] = await Promise.all([
        dbService.getYears(),
        dbService.getSubjects(),
        dbService.getProfile(),
      ]);
      setYears(y);
      setSubjects(s);
      setProfile(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  // If zero years exist, show the designed empty state
  if (years.length === 0) {
    return (
      <EmptyState
        onAddYear={onAddYear}
        onOpenProfile={() => onNavigate('settings')}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Welcome Banner */}
      <div className="hud-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono text-primary uppercase tracking-wider mb-1 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-primary inline-block" />
            <span>MISSION CONTROL ACTIVE</span>
          </div>
          <h1 className="text-2xl font-bold font-mono tracking-tight text-text-main">
            {profile?.name ? `Welcome back, ${profile.name}` : 'Welcome to StudyOS'}
          </h1>
          <p className="text-xs text-text-muted mt-1 font-mono">
            {profile?.major ? `${profile.major} • ${profile.university}` : 'Customized offline-first cockpit'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('timers')}
            className="px-4 py-2 rounded-lg text-xs font-mono bg-primary text-canvas hover:brightness-110 font-bold tracking-wider shadow-hud-glow flex items-center space-x-2 transition"
          >
            <Clock className="w-4 h-4 stroke-[2.5]" />
            <span>LAUNCH TIMER</span>
          </button>
        </div>
      </div>

      {/* KPI Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="hud-panel p-4">
          <div className="flex items-center justify-between text-text-muted text-xs font-mono mb-2">
            <span>ACTIVE SUBJECTS</span>
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold font-mono text-text-main">{subjects.length}</div>
          <div className="text-[11px] font-mono text-text-faint mt-1">Across all semesters</div>
        </div>

        <div className="hud-panel p-4">
          <div className="flex items-center justify-between text-text-muted text-xs font-mono mb-2">
            <span>ACADEMIC YEARS</span>
            <TrendingUp className="w-4 h-4 text-accent" />
          </div>
          <div className="text-2xl font-bold font-mono text-text-main">{years.length}</div>
          <div className="text-[11px] font-mono text-text-faint mt-1">Configured in database</div>
        </div>

        <div className="hud-panel p-4">
          <div className="flex items-center justify-between text-text-muted text-xs font-mono mb-2">
            <span>STUDY PROGRESS</span>
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
          <div className="text-2xl font-bold font-mono text-text-main">0%</div>
          <div className="text-[11px] font-mono text-text-faint mt-1">Units & checklist completed</div>
        </div>

        <div className="hud-panel p-4">
          <div className="flex items-center justify-between text-text-muted text-xs font-mono mb-2">
            <span>TOTAL TIME LOGGED</span>
            <Clock className="w-4 h-4 text-secondary" />
          </div>
          <div className="text-2xl font-bold font-mono text-text-main">0h 00m</div>
          <div className="text-[11px] font-mono text-text-faint mt-1">From active study timers</div>
        </div>
      </div>

      {/* Subject Quick Access */}
      <div className="hud-panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="font-mono text-sm font-bold tracking-wider text-text-main">
            CURRENT ENROLLED SUBJECTS
          </div>
          <button
            onClick={() => onNavigate('hierarchy')}
            className="text-xs font-mono text-primary hover:underline flex items-center space-x-1"
          >
            <span>Manage Hierarchy</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjects.map((sub) => (
            <div
              key={sub.id}
              style={{ borderLeftColor: sub.accent_color }}
              className="p-3 rounded bg-canvas/70 border border-border border-l-4 hover:border-border-glow transition"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-text-main">{sub.name}</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border text-text-muted">
                  {sub.code}
                </span>
              </div>
              <div className="text-[11px] text-text-faint mt-1 font-mono">
                {sub.credits} Credits • {sub.professor || 'Staff'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
