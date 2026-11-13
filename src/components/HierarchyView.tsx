import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  BookOpen,
  FilePlus,
  CheckCircle,
  Circle,
  FileText,
  Upload,
  Activity,
  AlertCircle,
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
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Year, Semester, Subject, Resource, ResourceType } from '../types';
import { dbService } from '../services/db';

interface SortableItemProps {
  id: string;
  children: (handle: React.ReactNode) => React.ReactNode;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragHandle = (
    <button
      type="button"
      {...attributes}
      {...listeners}
      className="p-1 text-text-faint hover:text-text-main cursor-grab active:cursor-grabbing rounded"
    >
      <GripVertical className="w-4 h-4" />
    </button>
  );

  return (
    <div ref={setNodeRef} style={style}>
      {children(dragHandle)}
    </div>
  );
};

export const HierarchyView: React.FC = () => {
  const [years, setYears] = useState<Year[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
  const [loading, setLoading] = useState(true);

  // Expanded toggles for collapsible tree
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});
  const [expandedSemesters, setExpandedSemesters] = useState<Record<string, boolean>>({});

  // Creation Modals & Inline inputs
  const [showAddYear, setShowAddYear] = useState(false);
  const [newYearName, setNewYearName] = useState('');
  const [newYearColor, setNewYearColor] = useState('#6366f1');

  const [activeYearForSem, setActiveYearForSem] = useState<string | null>(null);
  const [newSemName, setNewSemName] = useState('');

  const [activeSemForSubject, setActiveSemForSubject] = useState<string | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newSubjectCredits, setNewSubjectCredits] = useState(3);
  const [newSubjectColor, setNewSubjectColor] = useState('#38bdf8');

  // PDF Ingestion state
  const [importingSubjectId, setImportingSubjectId] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    loadHierarchy();
  }, []);

  const loadHierarchy = async () => {
    setLoading(true);
    try {
      const [y, s, sub, res, types] = await Promise.all([
        dbService.getYears(),
        dbService.getSemesters(),
        dbService.getSubjects(),
        dbService.getResources(),
        dbService.getResourceTypes(),
      ]);
      setYears(y);
      setSemesters(s);
      setSubjects(sub);
      setResources(res);
      setResourceTypes(types);

      // Auto-expand all years by default
      const yearExp: Record<string, boolean> = {};
      y.forEach((item) => (yearExp[item.id] = true));
      setExpandedYears(yearExp);

      const semExp: Record<string, boolean> = {};
      s.forEach((item) => (semExp[item.id] = true));
      setExpandedSemesters(semExp);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYearName.trim()) return;

    const newYear: Year = {
      id: 'year-' + Date.now(),
      name: newYearName.trim(),
      accent_color: newYearColor,
      sort_order: years.length + 1,
    };
    await dbService.saveYear(newYear);
    setNewYearName('');
    setShowAddYear(false);
    await loadHierarchy();
  };

  const handleCreateSemester = async (yearId: string) => {
    if (!newSemName.trim()) return;

    const newSem: Semester = {
      id: 'sem-' + Date.now(),
      year_id: yearId,
      name: newSemName.trim(),
      accent_color: '#38bdf8',
      sort_order: semesters.filter((s) => s.year_id === yearId).length + 1,
    };
    await dbService.saveSemester(newSem);
    setNewSemName('');
    setActiveYearForSem(null);
    await loadHierarchy();
  };

  const handleCreateSubject = async (semesterId: string) => {
    if (!newSubjectName.trim()) return;

    const newSub: Subject = {
      id: 'sub-' + Date.now(),
      semester_id: semesterId,
      name: newSubjectName.trim(),
      code: newSubjectCode.trim() || 'SUB-101',
      credits: Number(newSubjectCredits) || 3,
      accent_color: newSubjectColor,
      sort_order: subjects.filter((s) => s.semester_id === semesterId).length + 1,
    };
    await dbService.saveSubject(newSub);
    setNewSubjectName('');
    setNewSubjectCode('');
    setActiveSemForSubject(null);
    await loadHierarchy();
  };

  // --- PDF Import Ingestion Logic (Phase 3) ---
  const handleImportPdf = async (subjectId: string) => {
    setImportingSubjectId(subjectId);
    setImportNotice(null);

    try {
      let selectedPath: string | null = null;

      // In Tauri runtime: use native file dialog
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { open } = await import('@tauri-apps/plugin-dialog');
        const file = await open({
          multiple: false,
          filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
        });
        if (file && typeof file === 'string') {
          selectedPath = file;
        }
      }

      if (!selectedPath) {
        setImportNotice('PDF import cancelled.');
        setTimeout(() => setImportNotice(null), 3000);
        setImportingSubjectId(null);
        return;
      }

      // Invoke pure Rust lopdf import command
      const { invoke } = await import('@tauri-apps/api/core');
      const importResult = await invoke<any>('import_pdf', {
        sourcePath: selectedPath,
        subjectId,
      });

      const newResource: Resource = {
        id: 'res-' + Date.now(),
        subject_id: subjectId,
        type_id: resourceTypes[0]?.id || 'type-textbook',
        title: importResult.title,
        original_filename: importResult.original_filename,
        stored_path: importResult.stored_path,
        file_hash: importResult.file_hash,
        page_count: importResult.page_count,
        toc_json: JSON.stringify(importResult.toc || []),
        is_studied: false,
        last_page: 1,
        last_zoom: 1.0,
        last_scroll_y: 0,
        sort_order: resources.filter((r) => r.subject_id === subjectId).length + 1,
        created_at: new Date().toISOString(),
      };

      await dbService.saveResource(newResource);
      setImportNotice(
        importResult.is_duplicate
          ? 'Notice: PDF already existed (deduplicated by SHA-256).'
          : `Success: Imported ${importResult.title} (${importResult.page_count} pages)`
      );
      setTimeout(() => setImportNotice(null), 4000);
      await loadHierarchy();
    } catch (err: any) {
      console.error(err);
      setImportNotice('Import failed: ' + (err?.toString() || 'Unknown error'));
      setTimeout(() => setImportNotice(null), 5000);
    } finally {
      setImportingSubjectId(null);
    }
  };

  // Reordering Dnd Handlers
  const handleYearDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = years.findIndex((y) => y.id === active.id);
      const newIndex = years.findIndex((y) => y.id === over.id);
      const reordered = arrayMove(years, oldIndex, newIndex);
      setYears(reordered);
      await dbService.reorderYears(reordered);
    }
  };

  const handleToggleResourceStudied = async (res: Resource) => {
    const updated = !res.is_studied;
    await dbService.updateResourceStudyStatus(res.id, updated);
    setResources(resources.map((r) => (r.id === res.id ? { ...r, is_studied: updated } : r)));
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="hud-panel p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-primary font-mono text-xs uppercase mb-1 font-bold">
            <Layers className="w-4 h-4" />
            <span>RELATIONAL CURRICULUM ARCHITECTURE</span>
          </div>
          <h1 className="text-2xl font-bold font-mono tracking-tight text-text-main">
            Academic Hierarchy Vault
          </h1>
          <p className="text-xs text-text-muted mt-1 font-mono">
            Year → Semester → Subject → Resource tree with drag-and-drop reordering and PDF ingestion.
          </p>
        </div>

        <button
          onClick={() => setShowAddYear(true)}
          className="px-5 py-2.5 rounded-xl bg-primary text-canvas font-mono font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-sm flex items-center space-x-2 self-start sm:self-auto transition"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ ADD ACADEMIC YEAR</span>
        </button>
      </div>

      {/* Global Ingestion Notice */}
      {importNotice && (
        <div className="p-3 rounded-xl bg-canvas border border-primary/40 text-text-main text-xs font-mono flex items-center space-x-2 animate-fadeIn shadow-sm">
          <AlertCircle className="w-4 h-4 text-primary" />
          <span>{importNotice}</span>
        </div>
      )}

      {/* Add Year Form */}
      {showAddYear && (
        <form onSubmit={handleCreateYear} className="hud-panel p-5 flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={newYearName}
            onChange={(e) => setNewYearName(e.target.value)}
            placeholder="Academic Year Name (e.g. Year 1 - 2025/2026)"
            autoFocus
            className="flex-1 min-w-[240px] bg-canvas border border-border focus:border-primary rounded-xl px-3.5 py-2 text-xs font-mono text-text-main focus:outline-none"
          />
          <input
            type="color"
            value={newYearColor}
            onChange={(e) => setNewYearColor(e.target.value)}
            className="w-9 h-9 p-1 rounded-xl bg-canvas border border-border cursor-pointer"
            title="Accent Color"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-primary text-canvas text-xs font-mono font-bold hover:brightness-110 shadow-sm"
          >
            CREATE YEAR
          </button>
          <button
            type="button"
            onClick={() => setShowAddYear(false)}
            className="px-4 py-2 rounded-xl bg-canvas border border-border text-xs font-mono text-text-muted hover:text-text-main"
          >
            CANCEL
          </button>
        </form>
      )}

      {/* Hierarchy Tree Rendering with @dnd-kit */}
      {years.length === 0 ? (
        <div className="hud-panel p-12 text-center space-y-3 font-mono">
          <div className="w-12 h-12 rounded-2xl bg-canvas border border-border flex items-center justify-center mx-auto text-primary shadow-sm">
            <Layers className="w-6 h-6 animate-pulse" />
          </div>
          <div className="text-base font-bold text-text-main">No Academic Years Defined</div>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            Click "+ ADD ACADEMIC YEAR" above to initiate your university structure.
          </p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleYearDragEnd}>
          <SortableContext items={years.map((y) => y.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {years.map((year) => {
                const isExpanded = expandedYears[year.id] ?? true;
                const yearSemesters = semesters.filter((s) => s.year_id === year.id);

                return (
                  <SortableItem key={year.id} id={year.id}>
                    {(dragHandle) => (
                      <div className="hud-panel p-5 space-y-4">
                        {/* Year Header */}
                        <div className="flex items-center justify-between border-b border-border/80 pb-3">
                          <div className="flex items-center space-x-3">
                            {dragHandle}
                            <button
                              onClick={() =>
                                setExpandedYears({ ...expandedYears, [year.id]: !isExpanded })
                              }
                              className="text-text-muted hover:text-text-main"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                            <div
                              className="w-3.5 h-3.5 rounded-full shadow-sm"
                              style={{ backgroundColor: year.accent_color }}
                            />
                            <h3 className="font-mono text-base font-bold text-text-main">
                              {year.name}
                            </h3>
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface border border-border text-text-muted font-semibold">
                              {yearSemesters.length} Semesters
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() =>
                                setActiveYearForSem(activeYearForSem === year.id ? null : year.id)
                              }
                              className="px-3 py-1.5 text-xs font-mono bg-canvas border border-border hover:border-primary text-text-main rounded-lg flex items-center space-x-1.5 transition shadow-sm font-semibold"
                            >
                              <Plus className="w-3.5 h-3.5 text-primary" />
                              <span>Add Semester</span>
                            </button>
                            <button
                              onClick={async () => {
                                await dbService.deleteYear(year.id);
                                await loadHierarchy();
                              }}
                              className="p-1.5 text-text-faint hover:text-danger rounded-lg hover:bg-canvas"
                              title="Delete Year"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Inline Add Semester Form */}
                        {activeYearForSem === year.id && (
                          <div className="p-3.5 rounded-xl bg-canvas border border-primary/30 flex items-center gap-2.5">
                            <input
                              type="text"
                              value={newSemName}
                              onChange={(e) => setNewSemName(e.target.value)}
                              placeholder="Semester Name (e.g. Fall Semester 2025)"
                              autoFocus
                              className="flex-1 bg-surface border border-border rounded-lg px-3 py-1.5 text-xs font-mono text-text-main focus:outline-none focus:border-primary"
                            />
                            <button
                              onClick={() => handleCreateSemester(year.id)}
                              className="px-3.5 py-1.5 bg-primary text-canvas font-mono font-bold text-xs rounded-lg"
                            >
                              Add
                            </button>
                            <button
                              onClick={() => setActiveYearForSem(null)}
                              className="px-3 py-1.5 bg-surface border border-border text-text-muted text-xs font-mono rounded-lg"
                            >
                              Cancel
                            </button>
                          </div>
                        )}

                        {/* Semesters list */}
                        {isExpanded && (
                          <div className="space-y-4 pl-4 border-l border-border/60 ml-2">
                            {yearSemesters.map((sem) => {
                              const semSubjects = subjects.filter(
                                (sub) => sub.semester_id === sem.id
                              );

                              return (
                                <div
                                  key={sem.id}
                                  className="p-4 rounded-xl bg-canvas/80 border border-border space-y-3.5 shadow-sm"
                                >
                                  {/* Semester Header */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2 font-mono text-xs font-bold text-text-main">
                                      <span className="text-primary font-bold">▶</span>
                                      <span>{sem.name}</span>
                                      <span className="text-text-faint font-normal text-[11px]">
                                        ({semSubjects.length} subjects)
                                      </span>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() =>
                                          setActiveSemForSubject(
                                            activeSemForSubject === sem.id ? null : sem.id
                                          )
                                        }
                                        className="px-2.5 py-1 text-[11px] font-mono bg-surface border border-border hover:border-accent text-accent rounded-lg flex items-center space-x-1.5 font-semibold"
                                      >
                                        <Plus className="w-3 h-3" />
                                        <span>Add Subject</span>
                                      </button>
                                      <button
                                        onClick={async () => {
                                          await dbService.deleteSemester(sem.id);
                                          await loadHierarchy();
                                        }}
                                        className="p-1 text-text-faint hover:text-danger rounded"
                                        title="Delete Semester"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Inline Add Subject Form */}
                                  {activeSemForSubject === sem.id && (
                                    <div className="p-3.5 rounded-xl bg-surface border border-accent/40 grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                                      <input
                                        type="text"
                                        value={newSubjectName}
                                        onChange={(e) => setNewSubjectName(e.target.value)}
                                        placeholder="Subject Name (e.g. Algorithms)"
                                        className="bg-canvas border border-border rounded-lg px-3 py-1.5 text-xs font-mono text-text-main focus:outline-none"
                                      />
                                      <input
                                        type="text"
                                        value={newSubjectCode}
                                        onChange={(e) => setNewSubjectCode(e.target.value)}
                                        placeholder="Code (e.g. CS201)"
                                        className="bg-canvas border border-border rounded-lg px-3 py-1.5 text-xs font-mono text-text-main focus:outline-none"
                                      />
                                      <input
                                        type="number"
                                        value={newSubjectCredits}
                                        onChange={(e) => setNewSubjectCredits(Number(e.target.value))}
                                        placeholder="Credits"
                                        className="bg-canvas border border-border rounded-lg px-3 py-1.5 text-xs font-mono text-text-main focus:outline-none"
                                      />
                                      <div className="flex items-center space-x-2">
                                        <input
                                          type="color"
                                          value={newSubjectColor}
                                          onChange={(e) => setNewSubjectColor(e.target.value)}
                                          className="w-8 h-8 rounded-lg border border-border bg-canvas cursor-pointer"
                                        />
                                        <button
                                          onClick={() => handleCreateSubject(sem.id)}
                                          className="flex-1 py-1.5 bg-accent text-canvas font-mono font-bold text-xs rounded-lg shadow-sm"
                                        >
                                          Save
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Subjects List */}
                                  <div className="space-y-3">
                                    {semSubjects.map((sub) => {
                                      const subResources = resources.filter(
                                        (r) => r.subject_id === sub.id
                                      );

                                      return (
                                        <div
                                          key={sub.id}
                                          style={{ borderLeftColor: sub.accent_color }}
                                          className="p-3.5 rounded-xl bg-surface border border-border border-l-4 space-y-3 shadow-sm"
                                        >
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <div className="font-mono text-xs font-bold text-text-main">
                                                {sub.name}
                                              </div>
                                              <div className="font-mono text-[11px] text-text-faint">
                                                {sub.code} • {sub.credits} credits •{' '}
                                                {subResources.length} resources
                                              </div>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                              <button
                                                onClick={() => handleImportPdf(sub.id)}
                                                disabled={importingSubjectId === sub.id}
                                                className="px-2.5 py-1 rounded-lg bg-canvas border border-border hover:border-primary text-xs font-mono font-semibold text-text-main flex items-center space-x-1.5 transition"
                                                title="Import local PDF into subject library"
                                              >
                                                {importingSubjectId === sub.id ? (
                                                  <Activity className="w-3.5 h-3.5 animate-spin text-primary" />
                                                ) : (
                                                  <Upload className="w-3.5 h-3.5 text-primary" />
                                                )}
                                                <span>
                                                  {importingSubjectId === sub.id
                                                    ? 'Importing...'
                                                    : 'Import PDF'}
                                                </span>
                                              </button>

                                              <button
                                                onClick={async () => {
                                                  await dbService.deleteSubject(sub.id);
                                                  await loadHierarchy();
                                                }}
                                                className="p-1 text-text-faint hover:text-danger rounded"
                                                title="Delete Subject"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </div>

                                          {/* Ingested PDF Resources for this Subject */}
                                          {subResources.length > 0 && (
                                            <div className="space-y-1.5 pt-2 border-t border-border/60">
                                              {subResources.map((res) => (
                                                <div
                                                  key={res.id}
                                                  className="p-2.5 rounded-lg bg-canvas border border-border flex items-center justify-between font-mono text-xs"
                                                >
                                                  <div className="flex items-center space-x-2.5 truncate">
                                                    <button
                                                      onClick={() => handleToggleResourceStudied(res)}
                                                      title="Toggle studied status"
                                                    >
                                                      {res.is_studied ? (
                                                        <CheckCircle className="w-4 h-4 text-success" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-text-faint" />
                                                      )}
                                                    </button>
                                                    <FileText className="w-4 h-4 text-primary shrink-0" />
                                                    <span className="font-bold text-text-main truncate">
                                                      {res.title}
                                                    </span>
                                                    <span className="text-[10px] text-text-faint px-1.5 py-0.5 rounded bg-surface border border-border">
                                                      {res.page_count}p
                                                    </span>
                                                  </div>

                                                  <button
                                                    onClick={async () => {
                                                      await dbService.deleteResource(res.id);
                                                      await loadHierarchy();
                                                    }}
                                                    className="p-1 text-text-faint hover:text-danger rounded"
                                                    title="Delete Resource"
                                                  >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                  </button>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </SortableItem>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};
