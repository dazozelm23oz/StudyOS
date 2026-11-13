import React from 'react';
import { Sparkles, Plus, FolderPlus, Terminal, UserCheck } from 'lucide-react';

interface EmptyStateProps {
  onAddYear?: () => void;
  onOpenProfile?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onAddYear, onOpenProfile }) => {
  return (
    <div className="flex-1 flex items-center justify-center p-8 select-none">
      <div className="max-w-xl w-full p-8 rounded-xl border border-border bg-surface/80 backdrop-blur-md shadow-2xl relative overflow-hidden group">
        {/* Subtle background glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center space-y-6">
          {/* Futuristic Icon Badge */}
          <div className="w-16 h-16 rounded-2xl bg-canvas border border-primary/40 flex items-center justify-center mx-auto shadow-hud-glow">
            <Terminal className="w-8 h-8 text-primary animate-pulse" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-mono uppercase bg-primary/10 border border-primary/30 text-primary">
              <Sparkles className="w-3 h-3" />
              <span>CLEAN SLATE INITIALIZED</span>
            </div>
            <h2 className="text-2xl font-bold font-mono tracking-tight text-text-main">
              ACADEMIC VAULT UNINITIALIZED
            </h2>
            <p className="text-sm text-text-muted leading-relaxed max-w-md mx-auto">
              In accordance with zero-hardcoded principles, StudyOS starts 100% empty. You construct your personalized academic universe from the ground up.
            </p>
          </div>

          {/* Quick Setup Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left font-mono text-xs">
            <div className="p-3 rounded-lg bg-canvas/70 border border-border flex items-start space-x-2.5">
              <span className="text-primary font-bold">01.</span>
              <div>
                <div className="text-text-main font-semibold">Student Profile</div>
                <div className="text-text-faint text-[11px]">Set name, major & university</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-canvas/70 border border-border flex items-start space-x-2.5">
              <span className="text-primary font-bold">02.</span>
              <div>
                <div className="text-text-main font-semibold">Hierarchy Tree</div>
                <div className="text-text-faint text-[11px]">Add Year → Semester → Subjects</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-canvas/70 border border-border flex items-start space-x-2.5">
              <span className="text-primary font-bold">03.</span>
              <div>
                <div className="text-text-main font-semibold">Course Materials</div>
                <div className="text-text-faint text-[11px]">Ingest local PDF guides & books</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-canvas/70 border border-border flex items-start space-x-2.5">
              <span className="text-primary font-bold">04.</span>
              <div>
                <div className="text-text-main font-semibold">Cockpit Timers</div>
                <div className="text-text-faint text-[11px]">Sync rain soundscapes to focus</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {onAddYear && (
              <button
                onClick={onAddYear}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-primary text-canvas hover:brightness-110 shadow-hud-glow flex items-center justify-center space-x-2 transition"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create First Academic Year</span>
              </button>
            )}

            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-mono bg-canvas border border-border hover:border-primary text-text-muted hover:text-text-main flex items-center justify-center space-x-2 transition"
              >
                <UserCheck className="w-4 h-4 text-accent" />
                <span>Configure Profile</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
