import React from 'react';
import { Sparkles, Plus, Terminal, UserCheck } from 'lucide-react';

interface EmptyStateProps {
  onAddYear?: () => void;
  onOpenProfile?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onAddYear, onOpenProfile }) => {
  return (
    <div className="flex-1 flex items-center justify-center p-8 select-none">
      <div className="max-w-xl w-full p-8 rounded-2xl border border-border bg-surface shadow-2xl relative overflow-hidden group">
        <div className="relative z-10 text-center space-y-6">
          {/* Elegant Icon Badge */}
          <div className="w-16 h-16 rounded-2xl bg-canvas border border-primary/40 flex items-center justify-center mx-auto shadow-md">
            <Terminal className="w-8 h-8 text-primary" />
          </div>

          <div className="space-y-2.5">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase bg-primary/10 border border-primary/30 text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CLEAN SLATE INITIALIZED</span>
            </div>
            <h2 className="text-2xl font-bold font-mono tracking-tight text-text-main">
              ACADEMIC VAULT UNINITIALIZED
            </h2>
            <p className="text-sm text-text-muted leading-relaxed max-w-md mx-auto font-sans">
              In accordance with zero-hardcoded principles, StudyOS starts completely empty. You construct your academic universe from the ground up.
            </p>
          </div>

          {/* Quick Setup Checklist with High Contrast Text */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-canvas border border-border flex items-start space-x-3">
              <span className="text-primary font-bold text-sm">01.</span>
              <div>
                <div className="text-text-main font-bold">Student Profile</div>
                <div className="text-text-muted text-xs mt-0.5">Set name, major & university</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-canvas border border-border flex items-start space-x-3">
              <span className="text-primary font-bold text-sm">02.</span>
              <div>
                <div className="text-text-main font-bold">Academic Tree</div>
                <div className="text-text-muted text-xs mt-0.5">Add Year → Semester → Subjects</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-canvas border border-border flex items-start space-x-3">
              <span className="text-primary font-bold text-sm">03.</span>
              <div>
                <div className="text-text-main font-bold">Course Materials</div>
                <div className="text-text-muted text-xs mt-0.5">Ingest local PDF guides & books</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-canvas border border-border flex items-start space-x-3">
              <span className="text-primary font-bold text-sm">04.</span>
              <div>
                <div className="text-text-main font-bold">Cockpit Timers</div>
                <div className="text-text-muted text-xs mt-0.5">Sync rain soundscapes to focus</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {onAddYear && (
              <button
                onClick={onAddYear}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-primary text-canvas hover:brightness-110 shadow-md flex items-center justify-center space-x-2 transition"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create First Academic Year</span>
              </button>
            )}

            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-mono font-semibold bg-canvas border border-border hover:border-primary text-text-main flex items-center justify-center space-x-2 transition"
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
