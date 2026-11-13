import React, { useState, useEffect } from 'react';
import {
  Scissors,
  Layers,
  BookOpen,
  CheckSquare,
  Square,
  FilePlus,
  Activity,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Subject, Resource, Unit, TocItem } from '../types';
import { dbService } from '../services/db';

export const UnitExtractorView: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedResourceId, setSelectedResourceId] = useState<string>('');
  const [unitTitle, setUnitTitle] = useState<string>('');
  const [rangeString, setRangeString] = useState<string>('');
  const [outputMode, setOutputMode] = useState<'merged' | 'split'>('merged');
  const [tocChapters, setTocChapters] = useState<{ title: string; page: number; selected: boolean }[]>([]);
  const [validatedCount, setValidatedCount] = useState<number | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractProgress, setExtractProgress] = useState<number>(0);
  const [extractStep, setExtractStep] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [existingUnits, setExistingUnits] = useState<Unit[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [s, r] = await Promise.all([dbService.getSubjects(), dbService.getResources()]);
      setSubjects(s);
      setResources(r);

      if (s.length > 0) {
        setSelectedSubjectId(s[0].id);
        const subRes = r.filter((item) => item.subject_id === s[0].id);
        if (subRes.length > 0) {
          setSelectedResourceId(subRes[0].id);
          loadTocForResource(subRes[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    const subRes = resources.filter((r) => r.subject_id === subjectId);
    if (subRes.length > 0) {
      setSelectedResourceId(subRes[0].id);
      loadTocForResource(subRes[0]);
    } else {
      setSelectedResourceId('');
      setTocChapters([]);
    }
  };

  const handleResourceChange = (resId: string) => {
    setSelectedResourceId(resId);
    const found = resources.find((r) => r.id === resId);
    if (found) {
      loadTocForResource(found);
      loadExistingUnits(found.id);
    }
  };

  const loadTocForResource = (res: Resource) => {
    if (res.toc_json) {
      try {
        const parsed: TocItem[] = JSON.parse(res.toc_json);
        setTocChapters(parsed.map((item) => ({ title: item.title, page: item.page, selected: false })));
      } catch (e) {
        setTocChapters([]);
      }
    } else {
      setTocChapters([]);
    }
  };

  const loadExistingUnits = async (resId: string) => {
    try {
      const u = await dbService.getUnits(resId);
      setExistingUnits(u);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleValidateRange = async () => {
    if (!rangeString.trim()) return;
    const currentRes = resources.find((r) => r.id === selectedResourceId);
    const maxP = currentRes?.page_count || 1000;

    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        const pages = await invoke<number[]>('validate_page_ranges', {
          rangeStr: rangeString.trim(),
          maxPages: maxP,
        });
        setValidatedCount(pages.length);
        setStatusMessage(`Range valid: ${pages.length} pages targeted for extraction.`);
      } else {
        setValidatedCount(5);
        setStatusMessage('Range validated (test mode).');
      }
    } catch (err: any) {
      setValidatedCount(null);
      setStatusMessage('Invalid range: ' + (err?.toString() || 'Format error'));
    }
  };

  const handleExtract = async () => {
    const currentRes = resources.find((r) => r.id === selectedResourceId);
    if (!currentRes) {
      setStatusMessage('Please select a parent resource first.');
      return;
    }
    if (!rangeString.trim() || !unitTitle.trim()) {
      setStatusMessage('Please specify both a Unit Title and Page Range.');
      return;
    }

    setIsExtracting(true);
    setExtractProgress(15);
    setExtractStep('Analyzing PDF object tree & dereferencing pages...');
    setStatusMessage(null);

    const progressTimer = setInterval(() => {
      setExtractProgress((prev) => {
        if (prev >= 85) return prev;
        const next = prev + 15;
        if (next > 40 && next <= 65) {
          setExtractStep('Slicing specified page ranges with lopdf core...');
        } else if (next > 65) {
          setExtractStep('Pruning unreferenced objects & re-indexing cross-references...');
        }
        return next;
      });
    }, 200);

    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        const extractResult = await invoke<any>('extract_pdf_pages', {
          sourcePath: currentRes.stored_path,
          subjectId: selectedSubjectId,
          pageRanges: rangeString.trim(),
          unitTitle: unitTitle.trim(),
        });

        clearInterval(progressTimer);
        setExtractProgress(95);
        setExtractStep('Writing output and calculating SHA-256 hash...');

        // 1. Create newly extracted child resource in DB
        const newResource: Resource = {
          id: 'res-unit-' + Date.now(),
          subject_id: selectedSubjectId,
          type_id: 'type-notes',
          title: `Unit: ${unitTitle.trim()}`,
          original_filename: `${unitTitle.trim()}.pdf`,
          stored_path: extractResult.stored_path,
          file_hash: extractResult.file_hash,
          page_count: extractResult.page_count,
          toc_json: '[]',
          is_studied: false,
          last_page: 1,
          last_zoom: 1.0,
          last_scroll_y: 0,
          sort_order: resources.length + 1,
          created_at: new Date().toISOString(),
        };
        await dbService.saveResource(newResource);

        // 2. Save unit entry linked to parent resource
        const newUnit: Unit = {
          id: 'unit-' + Date.now(),
          resource_id: currentRes.id,
          title: unitTitle.trim(),
          page_ranges: rangeString.trim(),
          is_studied: false,
          sort_order: existingUnits.length + 1,
        };
        await dbService.saveUnit(newUnit);

        setExtractProgress(100);
        setStatusMessage(
          `Success: Extracted "${unitTitle}" (${extractResult.page_count} pages) and linked to subject resources!`
        );
        setUnitTitle('');
        setRangeString('');
        setValidatedCount(null);
        await loadExistingUnits(currentRes.id);
        const updatedRes = await dbService.getResources();
        setResources(updatedRes);
      } else {
        clearInterval(progressTimer);
        setExtractProgress(100);
        setStatusMessage('Simulated unit extraction complete (browser mode).');
      }
    } catch (err: any) {
      clearInterval(progressTimer);
      console.error(err);
      setStatusMessage('Extraction error: ' + (err?.toString() || 'Failed'));
    } finally {
      clearInterval(progressTimer);
      setIsExtracting(false);
    }
  };

  const handleSelectTocChapter = (chapter: { title: string; page: number; selected: boolean }, index: number) => {
    const updated = [...tocChapters];
    updated[index].selected = !updated[index].selected;
    setTocChapters(updated);

    // Auto calculate range to next chapter if available
    const nextChapter = tocChapters[index + 1];
    const currentRes = resources.find((r) => r.id === selectedResourceId);
    const endP = nextChapter ? nextChapter.page - 1 : currentRes?.page_count || chapter.page;

    setUnitTitle(chapter.title);
    setRangeString(`${chapter.page}-${Math.max(chapter.page, endP)}`);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="hud-panel p-6">
        <div className="flex items-center space-x-2 text-primary font-mono text-xs uppercase mb-1 font-bold">
          <Scissors className="w-4 h-4" />
          <span>OFFLINE PDF COMPOSITION ENGINE</span>
        </div>
        <h1 className="text-2xl font-bold font-mono tracking-tight text-text-main">
          Unit Extractor & Chapter Slicer
        </h1>
        <p className="text-xs text-text-muted mt-1 font-mono">
          Pure Rust lopdf page extraction. Slice custom units via syntax like "1-5, 8-12" or auto-import from bookmarks.
        </p>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-canvas border border-primary/40 text-text-main text-xs font-mono flex items-center space-x-2 animate-fadeIn shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Form: Extraction Controls */}
        <div className="hud-panel p-6 space-y-4">
          <div className="font-mono text-sm font-bold text-text-main flex items-center space-x-2">
            <Layers className="w-4 h-4 text-primary" />
            <span>Target Resource & Unit Parameters</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {/* Subject Selector */}
            <div>
              <label className="block text-text-muted mb-1 font-semibold">1. Subject Vault</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full bg-canvas border border-border rounded-xl px-3 py-2 text-text-main focus:outline-none focus:border-primary"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Parent PDF Selector */}
            <div>
              <label className="block text-text-muted mb-1 font-semibold">2. Source PDF Document</label>
              <select
                value={selectedResourceId}
                onChange={(e) => handleResourceChange(e.target.value)}
                className="w-full bg-canvas border border-border rounded-xl px-3 py-2 text-text-main focus:outline-none focus:border-primary"
              >
                {resources
                  .filter((r) => r.subject_id === selectedSubjectId)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} ({r.page_count} pages)
                    </option>
                  ))}
              </select>
            </div>

            {/* Unit Title */}
            <div>
              <label className="block text-text-muted mb-1 font-semibold">3. Unit / Chapter Name</label>
              <input
                type="text"
                value={unitTitle}
                onChange={(e) => setUnitTitle(e.target.value)}
                placeholder="e.g. Unit 3: Dynamic Programming"
                className="w-full bg-canvas border border-border rounded-xl px-3.5 py-2 text-text-main focus:outline-none focus:border-primary"
              />
            </div>

            {/* Page Range Syntax */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-text-muted font-semibold">4. Page Range Expression</label>
                <span className="text-text-faint text-[11px]">Format: 1-5, 7, 10-15</span>
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={rangeString}
                  onChange={(e) => setRangeString(e.target.value)}
                  placeholder="e.g. 1-12, 15, 20-30"
                  className="flex-1 bg-canvas border border-border rounded-xl px-3.5 py-2 text-text-main focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={handleValidateRange}
                  className="px-3.5 py-2 rounded-xl bg-canvas border border-border hover:border-primary text-text-main text-xs font-semibold"
                >
                  Verify
                </button>
              </div>
            </div>

            {/* Output Mode Option */}
            <div className="pt-1">
              <label className="block text-text-muted mb-1 font-semibold">5. Output Composition</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOutputMode('merged')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                    outputMode === 'merged'
                      ? 'bg-primary text-canvas border-primary font-bold shadow-sm'
                      : 'bg-canvas text-text-muted border-border hover:text-text-main'
                  }`}
                >
                  Single Merged Unit PDF
                </button>
                <button
                  type="button"
                  onClick={() => setOutputMode('split')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                    outputMode === 'split'
                      ? 'bg-primary text-canvas border-primary font-bold shadow-sm'
                      : 'bg-canvas text-text-muted border-border hover:text-text-main'
                  }`}
                >
                  Split Individual Chapters
                </button>
              </div>
            </div>

            {/* Extraction Progress Bar */}
            {isExtracting && (
              <div className="p-3.5 rounded-xl bg-canvas border border-primary/40 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-primary font-bold flex items-center space-x-1.5 truncate">
                    <Activity className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                    <span className="truncate">{extractStep}</span>
                  </span>
                  <span className="font-bold text-text-main flex-shrink-0">{extractProgress}%</span>
                </div>
                <div className="w-full h-2 bg-surface rounded-full overflow-hidden border border-border">
                  <div
                    style={{ width: `${extractProgress}%` }}
                    className="h-full bg-gradient-to-r from-primary via-secondary to-accent transition-all duration-300"
                  />
                </div>
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-3">
              <button
                type="button"
                onClick={handleExtract}
                disabled={isExtracting}
                className="w-full py-2.5 rounded-xl bg-primary text-canvas font-bold uppercase tracking-wider hover:brightness-110 shadow-sm flex items-center justify-center space-x-2 transition disabled:opacity-50"
              >
                {isExtracting ? (
                  <Activity className="w-4 h-4 animate-spin" />
                ) : (
                  <Scissors className="w-4 h-4" />
                )}
                <span>
                  {isExtracting ? 'EXTRACTING WITH LOPDF...' : 'EXTRACT & LINK INTO RESOURCES'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Section: Auto-Import from TOC Chapters */}
        <div className="hud-panel p-6 space-y-4">
          <div className="font-mono text-sm font-bold text-text-main flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-accent" />
              <span>Embedded TOC Bookmarks</span>
            </div>
            <span className="text-[11px] text-text-faint font-normal">Click to auto-populate</span>
          </div>

          {tocChapters.length === 0 ? (
            <div className="p-8 text-center bg-canvas rounded-xl border border-border font-mono text-xs text-text-muted space-y-2">
              <FileText className="w-8 h-8 mx-auto text-text-faint" />
              <div>No embedded outline bookmarks found in this PDF.</div>
              <div className="text-[11px] text-text-faint">
                Use the manual page-range syntax (e.g. 1-15, 20-35) on the left.
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
              {tocChapters.map((ch, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectTocChapter(ch, idx)}
                  className={`p-3 rounded-xl border cursor-pointer transition font-mono text-xs flex items-center justify-between ${
                    ch.selected
                      ? 'border-primary bg-primary/10 text-text-main font-semibold'
                      : 'border-border bg-canvas hover:border-primary/40 text-text-muted hover:text-text-main'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    {ch.selected ? (
                      <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-text-faint shrink-0" />
                    )}
                    <span className="truncate">{ch.title}</span>
                  </div>
                  <span className="text-[11px] text-text-faint shrink-0 ml-2">Page {ch.page}</span>
                </div>
              ))}
            </div>
          )}

          {/* Saved Units for this resource */}
          {existingUnits.length > 0 && (
            <div className="pt-3 border-t border-border font-mono text-xs space-y-2">
              <div className="font-bold text-text-main">Extracted Units for this PDF:</div>
              <div className="space-y-1.5">
                {existingUnits.map((u) => (
                  <div
                    key={u.id}
                    className="p-2.5 rounded-lg bg-canvas border border-border flex items-center justify-between text-[11px]"
                  >
                    <span className="font-semibold text-text-main">{u.title}</span>
                    <span className="text-text-faint">Ranges: {u.page_ranges}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
