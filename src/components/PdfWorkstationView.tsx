import React, { useState, useEffect } from 'react';
import { BookOpen, Columns, Grid, Layout, Plus, Trash2, ArrowRight } from 'lucide-react';
import { Resource } from '../types';
import { dbService } from '../services/db';
import { PdfViewerPane } from './PdfViewerPane';

interface PdfWorkstationViewProps {
  onNavigateToHierarchy?: () => void;
}

export const PdfWorkstationView: React.FC<PdfWorkstationViewProps> = ({ onNavigateToHierarchy }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [activePaneResources, setActivePaneResources] = useState<(Resource | null)[]>([null, null]);
  const [paneCount, setPaneCount] = useState<number>(2); // Default 2 panes (§5)
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    setLoading(true);
    try {
      const res = await dbService.getResources();
      setResources(res);

      // Auto-assign first resources if available
      if (res.length > 0) {
        setActivePaneResources([res[0], res[1] || null, res[2] || null, res[3] || null]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResourceForPane = (paneIndex: number, resourceId: string) => {
    const found = resources.find((r) => r.id === resourceId) || null;
    const copy = [...activePaneResources];
    copy[paneIndex] = found;
    setActivePaneResources(copy);
  };

  const handleClosePaneResource = (paneIndex: number) => {
    const copy = [...activePaneResources];
    copy[paneIndex] = null;
    setActivePaneResources(copy);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center font-mono text-sm text-text-muted">
        LOADING WORKSTATION RUNTIME...
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 select-none">
        <div className="max-w-md w-full p-8 rounded-2xl bg-surface border border-border text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-canvas border border-primary/40 flex items-center justify-center mx-auto text-primary">
            <BookOpen className="w-7 h-7 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold font-mono text-text-main">No PDF Resources Available</h2>
          <p className="text-xs text-text-muted font-sans leading-relaxed">
            Import your subject textbooks and lecture guides in the Academic Tree to activate side-by-side reading.
          </p>
          {onNavigateToHierarchy && (
            <button
              onClick={onNavigateToHierarchy}
              className="px-5 py-2.5 rounded-xl bg-primary text-canvas font-mono font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-sm transition"
            >
              Open Academic Tree
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 space-y-3 overflow-hidden">
      {/* Top Controls Bar */}
      <div className="hud-panel h-12 px-4 flex items-center justify-between font-mono text-xs select-none">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-text-main flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span>PDF WORKSTATION</span>
          </span>
          <span className="text-text-faint">•</span>
          <span className="text-text-muted">{resources.length} documents in vault</span>
        </div>

        {/* Multi-Pane Split Layout Selector (1 to 4 panes) */}
        <div className="flex items-center space-x-1.5 bg-canvas p-1 rounded-xl border border-border">
          {[1, 2, 3, 4].map((count) => (
            <button
              key={count}
              onClick={() => setPaneCount(count)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                paneCount === count
                  ? 'bg-primary text-canvas shadow-sm font-bold'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              {count} {count === 1 ? 'Pane' : 'Panes'}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Multi-Pane Split Stage */}
      <div className="flex-1 grid gap-3 overflow-hidden" style={{ gridTemplateColumns: `repeat(${paneCount}, minmax(0, 1fr))` }}>
        {Array.from({ length: paneCount }).map((_, paneIdx) => {
          const currentRes = activePaneResources[paneIdx];

          if (!currentRes) {
            return (
              <div
                key={paneIdx}
                className="flex-1 rounded-xl bg-surface border border-dashed border-border flex flex-col items-center justify-center p-6 text-center space-y-3 font-mono text-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-canvas border border-border flex items-center justify-center text-text-faint">
                  <Plus className="w-5 h-5" />
                </div>
                <div className="text-text-main font-bold">Pane {paneIdx + 1} Empty</div>
                <select
                  onChange={(e) => handleSelectResourceForPane(paneIdx, e.target.value)}
                  defaultValue=""
                  className="bg-canvas border border-border rounded-lg px-3 py-1.5 text-xs text-text-main focus:outline-none focus:border-primary max-w-[240px]"
                >
                  <option value="" disabled>
                    Select PDF Document...
                  </option>
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          return (
            <PdfViewerPane
              key={`${paneIdx}-${currentRes.id}`}
              paneId={`pane-${paneIdx}`}
              resource={currentRes}
              onClose={() => handleClosePaneResource(paneIdx)}
            />
          );
        })}
      </div>
    </div>
  );
};
