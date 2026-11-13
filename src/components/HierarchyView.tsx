import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  FolderPlus,
  BookPlus,
  FileText,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Palette,
} from 'lucide-react';
import { Year, Semester, Subject, Resource } from '../types';
import { dbService } from '../services/db';

export const HierarchyView: React.FC = () => {
  const [years, setYears] = useState<Year[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Input States
  const [newYearName, setNewYearName] = useState('');
  const [newYearColor, setNewYearColor] = useState('#00e5ff');
  const [showAddYear, setShowAddYear] = useState(false);

  const [activeYearForSem, setActiveYearForSem] = useState<string | null>(null);
  const [newSemName, setNewSemName] = useState('');

  const [activeSemForSubject, setActiveSemForSubject] = useState<string | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newSubjectCredits, setNewSubjectCredits] = useState(3);
  const [newSubjectColor, setNewSubjectColor] = useState('#0ea5e9');

  useEffect(() => {
    loadHierarchy();
  }, []);

  const loadHierarchy = async () => {
    setLoading(true);
    try {
      const [y, s, sub] = await Promise.all([
        dbService.getYears(),
        dbService.getSemesters(),
        dbService.getSubjects(),
      ]);
      setYears(y);
      setSemesters(s);
      setSubjects(sub);
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

  const handleDeleteYear = async (id: string) => {
    await dbService.deleteYear(id);
    await loadHierarchy();
  };

  const handleDeleteSemester = async (id: string) => {
    await dbService.deleteSemester(id);
    await loadHierarchy();
  };

  const handleDeleteSubject = async (id: string) => {
    await dbService.deleteSubject(id);
    await loadHierarchy();
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="hud-panel p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-primary font-mono text-xs uppercase mb-1">
            <Layers className="w-4 h-4" />
            <span>RELATIONAL CURRICULUM ARCHITECTURE</span>
          </div>
          <h1 className="text-2xl font-bold font-mono tracking-tight text-text-main">
            Academic Hierarchy Vault
          </h1>
          <p className="text-xs text-text-muted mt-1 font-mono">
            Year → Semester → Subject → Resource tree. Reorderable, fully editable, zero hardcoding.
          </p>
        </div>

        <button
          onClick={() => setShowAddYear(true)}
          className="px-4 py-2 rounded-lg bg-primary text-canvas font-mono font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-hud-glow flex items-center space-x-1.5 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ ADD ACADEMIC YEAR</span>
        </button>
      </div>

      {/* Add Year Inline Modal / Banner */}
      {showAddYear && (
        <form onSubmit={handleCreateYear} className="hud-panel p-4 flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={newYearName}
            onChange={(e) => setNewYearName(e.target.value)}
            placeholder="Academic Year Name (e.g. Year 1 - 2025/2026)"
            autoFocus
            className="flex-1 min-w-[240px] bg-canvas border border-border focus:border-primary rounded-lg px-3 py-2 text-xs font-mono text-text-main focus:outline-none"
          />
          <input
            type="color"
            value={newYearColor}
            onChange={(e) => setNewYearColor(e.target.value)}
            className="w-9 h-9 p-1 rounded bg-canvas border border-border cursor-pointer"
            title="Accent Color"
          />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-lg bg-primary text-canvas text-xs font-mono font-bold hover:brightness-110"
          >
            CREATE YEAR
          </button>
          <button
            type="button"
            onClick={() => setShowAddYear(false)}
            className="px-3.5 py-2 rounded-lg bg-canvas border border-border text-xs font-mono text-text-muted hover:text-text-main"
          >
            CANCEL
          </button>
        </form>
      )}

      {/* Hierarchy Tree Rendering */}
      {years.length === 0 ? (
        <div className="hud-panel p-12 text-center space-y-3 font-mono">
          <div className="w-12 h-12 rounded-xl bg-canvas border border-border flex items-center justify-center mx-auto text-primary">
            <Layers className="w-6 h-6 animate-pulse" />
          </div>
          <div className="text-sm font-bold text-text-main">No Academic Years Defined</div>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            Click "+ ADD ACADEMIC YEAR" above to initiate your university structure.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {years.map((year) => {
            const yearSemesters = semesters.filter((s) => s.year_id === year.id);

            return (
              <div key={year.id} className="hud-panel p-5 space-y-4">
                {/* Year Header */}
                <div className="flex items-center justify-between border-b border-border/80 pb-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-3.5 h-3.5 rounded-full shadow-sm"
                      style={{ backgroundColor: year.accent_color }}
                    />
                    <h3 className="font-mono text-base font-bold text-text-main">{year.name}</h3>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-text-muted">
                      {yearSemesters.length} Semesters
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setActiveYearForSem(activeYearForSem === year.id ? null : year.id)}
                      className="px-2.5 py-1 text-xs font-mono bg-canvas border border-border hover:border-primary text-text-main rounded flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3 text-primary" />
                      <span>Add Semester</span>
                    </button>
                    <button
                      onClick={() => handleDeleteYear(year.id)}
                      className="p-1 text-text-muted hover:text-danger rounded hover:bg-canvas"
                      title="Delete Year"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Inline Add Semester Form */}
                {activeYearForSem === year.id && (
                  <div className="p-3 rounded-lg bg-canvas border border-primary/30 flex items-center gap-2">
                    <input
                      type="text"
                      value={newSemName}
                      onChange={(e) => setNewSemName(e.target.value)}
                      placeholder="Semester Name (e.g. Fall Semester 2025)"
                      autoFocus
                      className="flex-1 bg-surface border border-border rounded px-3 py-1.5 text-xs font-mono text-text-main focus:outline-none focus:border-primary"
                    />
                    <button
                      onClick={() => handleCreateSemester(year.id)}
                      className="px-3 py-1.5 bg-primary text-canvas font-mono font-bold text-xs rounded"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setActiveYearForSem(null)}
                      className="px-2.5 py-1.5 bg-surface border border-border text-text-muted text-xs font-mono rounded"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Semesters inside Year */}
                <div className="space-y-3 pl-4 border-l border-border/50 ml-2">
                  {yearSemesters.map((sem) => {
                    const semSubjects = subjects.filter((sub) => sub.semester_id === sem.id);

                    return (
                      <div key={sem.id} className="p-4 rounded-lg bg-canvas/60 border border-border space-y-3">
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
                                setActiveSemForSubject(activeSemForSubject === sem.id ? null : sem.id)
                              }
                              className="px-2 py-0.5 text-[11px] font-mono bg-surface border border-border hover:border-accent text-accent rounded flex items-center space-x-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Subject</span>
                            </button>
                            <button
                              onClick={() => handleDeleteSemester(sem.id)}
                              className="p-1 text-text-faint hover:text-danger rounded"
                              title="Delete Semester"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Inline Add Subject Form */}
                        {activeSemForSubject === sem.id && (
                          <div className="p-3 rounded bg-surface border border-accent/40 grid grid-cols-1 sm:grid-cols-4 gap-2">
                            <input
                              type="text"
                              value={newSubjectName}
                              onChange={(e) => setNewSubjectName(e.target.value)}
                              placeholder="Subject Name (e.g. Distributed Systems)"
                              className="bg-canvas border border-border rounded px-2.5 py-1 text-xs font-mono text-text-main focus:outline-none"
                            />
                            <input
                              type="text"
                              value={newSubjectCode}
                              onChange={(e) => setNewSubjectCode(e.target.value)}
                              placeholder="Code (e.g. CS401)"
                              className="bg-canvas border border-border rounded px-2.5 py-1 text-xs font-mono text-text-main focus:outline-none"
                            />
                            <input
                              type="number"
                              value={newSubjectCredits}
                              onChange={(e) => setNewSubjectCredits(Number(e.target.value))}
                              placeholder="Credits"
                              className="bg-canvas border border-border rounded px-2.5 py-1 text-xs font-mono text-text-main focus:outline-none"
                            />
                            <div className="flex items-center space-x-2">
                              <input
                                type="color"
                                value={newSubjectColor}
                                onChange={(e) => setNewSubjectColor(e.target.value)}
                                className="w-7 h-7 rounded border border-border bg-canvas cursor-pointer"
                              />
                              <button
                                onClick={() => handleCreateSubject(sem.id)}
                                className="flex-1 py-1 bg-accent text-canvas font-mono font-bold text-xs rounded"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Subjects Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {semSubjects.map((sub) => (
                            <div
                              key={sub.id}
                              style={{ borderLeftColor: sub.accent_color }}
                              className="p-2.5 rounded bg-surface/90 border border-border border-l-4 flex items-center justify-between"
                            >
                              <div>
                                <div className="font-mono text-xs font-bold text-text-main">{sub.name}</div>
                                <div className="font-mono text-[10px] text-text-faint">
                                  {sub.code} • {sub.credits} credits
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteSubject(sub.id)}
                                className="p-1 text-text-faint hover:text-danger rounded"
                                title="Delete Subject"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
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
  );
};
