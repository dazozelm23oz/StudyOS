import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Flag,
  Plane,
  ListTodo,
  CheckSquare,
  BarChart3,
  Calendar,
  AlertCircle,
  Plus,
  Trash2,
  Check,
  Sparkles,
  Volume2,
  FolderOpen,
  ArrowRight,
  TrendingUp,
  Flame,
} from 'lucide-react';
import { Subject, Resource, Unit, ChecklistItem, TodoItem, SessionLog } from '../types';
import { dbService } from '../services/db';
import { audioEngine } from '../services/audioEngine';
import { FlightTimer } from './timers/FlightTimer';

type TimerTab = 'pomodoro' | 'session' | 'stopwatch' | 'flight' | 'checklist' | 'todos' | 'analytics';

export const StudyTimersView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TimerTab>('pomodoro');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  // ----------------------------------------------------
  // 1. POMODORO STATE
  // ----------------------------------------------------
  const [pomoWorkMins, setPomoWorkMins] = useState<number>(25);
  const [pomoBreakMins, setPomoBreakMins] = useState<number>(5);
  const [pomoPhase, setPomoPhase] = useState<'work' | 'break'>('work');
  const [pomoSecondsLeft, setPomoSecondsLeft] = useState<number>(25 * 60);
  const [isPomoRunning, setIsPomoRunning] = useState<boolean>(false);
  const pomoIntervalRef = useRef<any>(null);

  // ----------------------------------------------------
  // 2. SESSION TIMER STATE (Count-Up)
  // ----------------------------------------------------
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const [isSessionRunning, setIsSessionRunning] = useState<boolean>(false);
  const [sessionSubjectId, setSessionSubjectId] = useState<string>('');
  const [sessionStartTime, setSessionStartTime] = useState<string>('');
  const sessionIntervalRef = useRef<any>(null);

  // ----------------------------------------------------
  // 3. STOPWATCH STATE
  // ----------------------------------------------------
  const [stopwatchMs, setStopwatchMs] = useState<number>(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState<boolean>(false);
  const [laps, setLaps] = useState<{ id: number; splitMs: number; totalMs: number }[]>([]);
  const stopwatchIntervalRef = useRef<any>(null);

  // ----------------------------------------------------
  // 4. FLIGHT-STYLE HUD TIMER STATE
  // ----------------------------------------------------
  // Metaphor: Departure (0-15%) -> Climb (15-30%) -> Cruise FL380 (30-80%) -> Descent (80-95%) -> Touchdown (100%)
  const [flightTotalMins, setFlightTotalMins] = useState<number>(60);
  const [flightSecondsLeft, setFlightSecondsLeft] = useState<number>(60 * 60);
  const [isFlightRunning, setIsFlightRunning] = useState<boolean>(false);
  const [callsign, setCallsign] = useState<string>('STUDY-747');
  const flightIntervalRef = useRef<any>(null);

  // ----------------------------------------------------
  // 5. STUDY CHECKLIST & TODOS STATE
  // ----------------------------------------------------
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [newChecklistTitle, setNewChecklistTitle] = useState<string>('');
  const [newChecklistRange, setNewChecklistRange] = useState<string>('');

  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [todoFilter, setTodoFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [newTodoTitle, setNewTodoTitle] = useState<string>('');
  const [newTodoPriority, setNewTodoPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newTodoDueDate, setNewTodoDueDate] = useState<string>('');
  const [newTodoSubjectId, setNewTodoSubjectId] = useState<string>('');

  // ----------------------------------------------------
  // 6. ANALYTICS STATE
  // ----------------------------------------------------
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);
  const [totalTimeSecs, setTotalTimeSecs] = useState<number>(0);

  // Initial Data Load
  useEffect(() => {
    loadBaseData();
  }, []);

  const loadBaseData = async () => {
    try {
      const [subs, res, logs, totalSec] = await Promise.all([
        dbService.getSubjects(),
        dbService.getResources(),
        dbService.getSessionLogs(),
        dbService.getTotalTimeSeconds(),
      ]);
      setSubjects(subs);
      setResources(res);
      setSessionLogs(logs);
      setTotalTimeSecs(totalSec);
      if (subs.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(subs[0].id);
        setSessionSubjectId(subs[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Reload checklist when subject changes
  useEffect(() => {
    if (selectedSubjectId) {
      loadChecklist(selectedSubjectId);
    }
    loadTodos();
  }, [selectedSubjectId]);

  const loadChecklist = async (subId: string) => {
    const items = await dbService.getChecklistItems(subId);
    setChecklistItems(items);
  };

  const loadTodos = async () => {
    const list = await dbService.getTodos();
    setTodos(list);
  };

  // ----------------------------------------------------
  // Pomodoro Timer Effect & Logic
  // ----------------------------------------------------
  useEffect(() => {
    if (isPomoRunning) {
      pomoIntervalRef.current = setInterval(() => {
        setPomoSecondsLeft((prev) => {
          if (prev <= 1) {
            // Transition Phase
            handlePomoPhaseSwitch();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (pomoIntervalRef.current) clearInterval(pomoIntervalRef.current);
    }
    return () => {
      if (pomoIntervalRef.current) clearInterval(pomoIntervalRef.current);
    };
  }, [isPomoRunning, pomoPhase, pomoWorkMins, pomoBreakMins]);

  const handlePomoPhaseSwitch = async () => {
    const nextPhase = pomoPhase === 'work' ? 'break' : 'work';
    const nextSeconds = (nextPhase === 'work' ? pomoWorkMins : pomoBreakMins) * 60;
    
    // Log work session if transitioning from work
    if (pomoPhase === 'work') {
      const duration = pomoWorkMins * 60;
      const log: SessionLog = {
        id: 'pomo-' + Date.now(),
        subject_id: selectedSubjectId || undefined,
        timer_kind: 'pomodoro',
        start_time: new Date(Date.now() - duration * 1000).toISOString(),
        end_time: new Date().toISOString(),
        duration_seconds: duration,
      };
      await dbService.saveSessionLog(log);
      setSessionLogs((prev) => [log, ...prev]);
      setTotalTimeSecs((prev) => prev + duration);
    }

    // Trigger Audio Engine phase sync
    audioEngine.handleTimerPhase(nextPhase);

    setPomoPhase(nextPhase);
    setPomoSecondsLeft(nextSeconds);
  };

  const togglePomo = () => {
    if (!isPomoRunning) {
      // Starting work or break
      audioEngine.handleTimerPhase(pomoPhase);
    }
    setIsPomoRunning(!isPomoRunning);
  };

  const resetPomo = () => {
    setIsPomoRunning(false);
    setPomoSecondsLeft((pomoPhase === 'work' ? pomoWorkMins : pomoBreakMins) * 60);
  };

  // ----------------------------------------------------
  // Session Count-Up Timer Logic
  // ----------------------------------------------------
  useEffect(() => {
    if (isSessionRunning) {
      sessionIntervalRef.current = setInterval(() => {
        setSessionSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
    }
    return () => {
      if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
    };
  }, [isSessionRunning]);

  const startSession = () => {
    setSessionStartTime(new Date().toISOString());
    setIsSessionRunning(true);
    audioEngine.handleTimerPhase('work');
  };

  const pauseSession = () => {
    setIsSessionRunning(false);
  };

  const stopAndSaveSession = async () => {
    setIsSessionRunning(false);
    if (sessionSeconds > 5) {
      const log: SessionLog = {
        id: 'session-' + Date.now(),
        subject_id: sessionSubjectId || undefined,
        timer_kind: 'session',
        start_time: sessionStartTime || new Date(Date.now() - sessionSeconds * 1000).toISOString(),
        end_time: new Date().toISOString(),
        duration_seconds: sessionSeconds,
      };
      await dbService.saveSessionLog(log);
      setSessionLogs((prev) => [log, ...prev]);
      setTotalTimeSecs((prev) => prev + sessionSeconds);
    }
    setSessionSeconds(0);
    setSessionStartTime('');
  };

  // ----------------------------------------------------
  // Stopwatch Logic
  // ----------------------------------------------------
  useEffect(() => {
    if (isStopwatchRunning) {
      const startTime = Date.now() - stopwatchMs;
      stopwatchIntervalRef.current = setInterval(() => {
        setStopwatchMs(Date.now() - startTime);
      }, 10);
    } else {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    }
    return () => {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    };
  }, [isStopwatchRunning]);

  const recordLap = () => {
    const prevTotal = laps.length > 0 ? laps[0].totalMs : 0;
    const split = stopwatchMs - prevTotal;
    setLaps([{ id: laps.length + 1, splitMs: split, totalMs: stopwatchMs }, ...laps]);
  };

  const resetStopwatch = () => {
    setIsStopwatchRunning(false);
    setStopwatchMs(0);
    setLaps([]);
  };

  // ----------------------------------------------------
  // Flight-Style HUD Timer Logic
  // ----------------------------------------------------
  useEffect(() => {
    if (isFlightRunning) {
      flightIntervalRef.current = setInterval(() => {
        setFlightSecondsLeft((prev) => {
          if (prev <= 1) {
            handleFlightTouchdown();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (flightIntervalRef.current) clearInterval(flightIntervalRef.current);
    }
    return () => {
      if (flightIntervalRef.current) clearInterval(flightIntervalRef.current);
    };
  }, [isFlightRunning, flightTotalMins]);

  const handleFlightTouchdown = async () => {
    setIsFlightRunning(false);
    const duration = flightTotalMins * 60;
    const log: SessionLog = {
      id: 'flight-' + Date.now(),
      subject_id: selectedSubjectId || undefined,
      timer_kind: 'flight',
      start_time: new Date(Date.now() - duration * 1000).toISOString(),
      end_time: new Date().toISOString(),
      duration_seconds: duration,
    };
    await dbService.saveSessionLog(log);
    setSessionLogs((prev) => [log, ...prev]);
    setTotalTimeSecs((prev) => prev + duration);
  };

  const toggleFlight = () => {
    if (!isFlightRunning) {
      audioEngine.handleTimerPhase('work');
    }
    setIsFlightRunning(!isFlightRunning);
  };

  const resetFlight = () => {
    setIsFlightRunning(false);
    setFlightSecondsLeft(flightTotalMins * 60);
  };

  // Flight HUD telemetry calculations
  const flightTotalSec = flightTotalMins * 60;
  const flightElapsedSec = flightTotalSec - flightSecondsLeft;
  const flightProgressPct = Math.min(100, Math.max(0, (flightElapsedSec / flightTotalSec) * 100));

  let flightPhaseLabel = 'PRE-FLIGHT';
  let flightAltitude = 0; // Feet
  let flightMach = 0.0;

  if (flightProgressPct < 15) {
    flightPhaseLabel = 'DEPARTURE / TAXI';
    flightAltitude = Math.round((flightProgressPct / 15) * 5000);
    flightMach = 0.25;
  } else if (flightProgressPct < 30) {
    flightPhaseLabel = 'CLIMB TO CRUISE';
    flightAltitude = 5000 + Math.round(((flightProgressPct - 15) / 15) * 33000);
    flightMach = 0.65;
  } else if (flightProgressPct < 85) {
    flightPhaseLabel = 'CRUISE ALTITUDE FL380';
    flightAltitude = 38000;
    flightMach = 0.82;
  } else if (flightProgressPct < 99) {
    flightPhaseLabel = 'DESCENT / APPROACH';
    flightAltitude = Math.max(500, Math.round(38000 * (1 - (flightProgressPct - 85) / 14)));
    flightMach = 0.45;
  } else {
    flightPhaseLabel = 'TOUCHDOWN';
    flightAltitude = 0;
    flightMach = 0.0;
  }

  // ----------------------------------------------------
  // Study Checklist Handlers
  // ----------------------------------------------------
  const handleToggleChecklist = async (id: string, completed: boolean) => {
    await dbService.toggleChecklistItem(id, completed);
    setChecklistItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_completed: completed } : item))
    );
  };

  const handleAddChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistTitle.trim() || !selectedSubjectId) return;

    const newItem: ChecklistItem = {
      id: 'chk-' + Date.now(),
      subject_id: selectedSubjectId,
      title: newChecklistTitle.trim(),
      page_range: newChecklistRange.trim() || undefined,
      is_completed: false,
      sort_order: checklistItems.length + 1,
    };

    await dbService.saveChecklistItem(newItem);
    setChecklistItems((prev) => [...prev, newItem]);
    setNewChecklistTitle('');
    setNewChecklistRange('');
  };

  const handleDeleteChecklistItem = async (id: string) => {
    await dbService.deleteChecklistItem(id);
    setChecklistItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleImportTocAsChecklist = async () => {
    if (!selectedSubjectId) return;
    const subjectResources = resources.filter((r) => r.subject_id === selectedSubjectId);
    let importedCount = 0;

    for (const res of subjectResources) {
      if (res.toc_json) {
        try {
          const toc = JSON.parse(res.toc_json);
          const flattenToc = (nodes: any[]): { title: string; page: number }[] => {
            let res: any[] = [];
            for (const n of nodes) {
              res.push({ title: n.title, page: n.page });
              if (n.children && n.children.length > 0) {
                res.push(...flattenToc(n.children));
              }
            }
            return res;
          };
          const flat = flattenToc(toc);
          for (let i = 0; i < flat.length; i++) {
            const item: ChecklistItem = {
              id: 'chk-toc-' + Date.now() + '-' + i,
              subject_id: selectedSubjectId,
              title: flat[i].title,
              page_range: `Page ${flat[i].page}`,
              is_completed: false,
              sort_order: checklistItems.length + importedCount + 1,
            };
            await dbService.saveChecklistItem(item);
            importedCount++;
          }
        } catch (e) {
          console.warn('Failed to parse TOC JSON:', e);
        }
      }
    }

    if (importedCount > 0) {
      loadChecklist(selectedSubjectId);
    } else {
      alert('No TOC bookmarks found in the PDFs of this subject. You can extract units in the Unit Extractor first!');
    }
  };

  // ----------------------------------------------------
  // Todo Handlers
  // ----------------------------------------------------
  const handleToggleTodo = async (id: string, completed: boolean) => {
    await dbService.toggleTodo(id, completed);
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, is_completed: completed } : t))
    );
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    const newTodo: TodoItem = {
      id: 'todo-' + Date.now(),
      subject_id: newTodoSubjectId || undefined,
      title: newTodoTitle.trim(),
      priority: newTodoPriority,
      due_date: newTodoDueDate || undefined,
      is_completed: false,
      created_at: new Date().toISOString(),
    };

    await dbService.saveTodo(newTodo);
    setTodos((prev) => [newTodo, ...prev]);
    setNewTodoTitle('');
    setNewTodoDueDate('');
  };

  const handleDeleteTodo = async (id: string) => {
    await dbService.deleteTodo(id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  // Helpers
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatStopwatch = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds
      .toString()
      .padStart(2, '0')}`;
  };

  const formatHoursMins = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h === 0) return `${m} mins`;
    return `${h}h ${m}m`;
  };

  const filteredTodos = todos.filter((t) => {
    if (todoFilter === 'pending') return !t.is_completed;
    if (todoFilter === 'completed') return t.is_completed;
    return true;
  });

  const completedChecklistCount = checklistItems.filter((i) => i.is_completed).length;
  const checklistPct = checklistItems.length > 0 ? Math.round((completedChecklistCount / checklistItems.length) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-canvas text-text-main">
      {/* Top Navigation Tabs */}
      <div className="h-14 border-b border-border bg-surface px-6 flex items-center justify-between">
        <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none font-mono text-xs font-bold">
          <button
            onClick={() => setActiveTab('pomodoro')}
            className={`px-3.5 py-1.5 rounded-lg transition flex items-center space-x-2 ${
              activeTab === 'pomodoro'
                ? 'bg-primary text-canvas shadow-sm'
                : 'text-text-muted hover:text-text-main hover:bg-canvas'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>POMODORO</span>
          </button>

          <button
            onClick={() => setActiveTab('session')}
            className={`px-3.5 py-1.5 rounded-lg transition flex items-center space-x-2 ${
              activeTab === 'session'
                ? 'bg-primary text-canvas shadow-sm'
                : 'text-text-muted hover:text-text-main hover:bg-canvas'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>SESSION COUNT-UP</span>
          </button>

          <button
            onClick={() => setActiveTab('stopwatch')}
            className={`px-3.5 py-1.5 rounded-lg transition flex items-center space-x-2 ${
              activeTab === 'stopwatch'
                ? 'bg-primary text-canvas shadow-sm'
                : 'text-text-muted hover:text-text-main hover:bg-canvas'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>STOPWATCH</span>
          </button>

          <button
            onClick={() => setActiveTab('flight')}
            className={`px-3.5 py-1.5 rounded-lg transition flex items-center space-x-2 ${
              activeTab === 'flight'
                ? 'bg-accent text-canvas shadow-sm'
                : 'text-text-muted hover:text-text-main hover:bg-canvas'
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>FLIGHT HUD</span>
          </button>

          <div className="h-4 w-[1px] bg-border mx-2" />

          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-3.5 py-1.5 rounded-lg transition flex items-center space-x-2 ${
              activeTab === 'checklist'
                ? 'bg-secondary text-canvas shadow-sm'
                : 'text-text-muted hover:text-text-main hover:bg-canvas'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>STUDY CHECKLIST</span>
          </button>

          <button
            onClick={() => setActiveTab('todos')}
            className={`px-3.5 py-1.5 rounded-lg transition flex items-center space-x-2 ${
              activeTab === 'todos'
                ? 'bg-secondary text-canvas shadow-sm'
                : 'text-text-muted hover:text-text-main hover:bg-canvas'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>ACADEMIC TODOS</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-1.5 rounded-lg transition flex items-center space-x-2 ${
              activeTab === 'analytics'
                ? 'bg-surfaceElevated text-text-main border border-border shadow-sm'
                : 'text-text-muted hover:text-text-main hover:bg-canvas'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-primary" />
            <span>ANALYTICS</span>
          </button>
        </div>

        {/* Global Total Time Badge */}
        <div className="hidden sm:flex items-center space-x-2 font-mono text-xs px-3 py-1 rounded-lg bg-canvas border border-border">
          <Flame className="w-3.5 h-3.5 text-accent" />
          <span className="text-text-muted">Total Focused:</span>
          <span className="font-bold text-text-main">{formatHoursMins(totalTimeSecs)}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* ========================================================= */}
        {/* TAB 1: POMODORO TIMER */}
        {/* ========================================================= */}
        {activeTab === 'pomodoro' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="hud-panel p-8 text-center relative overflow-hidden flex flex-col items-center">
              {/* Phase Badge */}
              <div
                className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full font-mono text-xs font-bold uppercase tracking-wider mb-6 ${
                  pomoPhase === 'work'
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : 'bg-success/10 text-success border border-success/30'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    pomoPhase === 'work' ? 'bg-primary animate-ping' : 'bg-success animate-ping'
                  }`}
                />
                <span>{pomoPhase === 'work' ? 'Deep Work Session' : 'Restorative Break'}</span>
              </div>

              {/* Big Digital Display */}
              <div className="text-7xl sm:text-8xl font-mono font-bold tracking-tight text-text-main my-4 tabular-nums">
                {formatTime(pomoSecondsLeft)}
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-md h-2 bg-canvas rounded-full overflow-hidden border border-border my-4">
                <div
                  style={{
                    width: `${
                      ((((pomoPhase === 'work' ? pomoWorkMins : pomoBreakMins) * 60 - pomoSecondsLeft) /
                        ((pomoPhase === 'work' ? pomoWorkMins : pomoBreakMins) * 60)) *
                        100) || 0
                    }%`,
                  }}
                  className={`h-full transition-all duration-300 ${
                    pomoPhase === 'work' ? 'bg-primary' : 'bg-success'
                  }`}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-4 mt-6">
                <button
                  onClick={togglePomo}
                  className={`px-8 py-3.5 rounded-xl font-mono font-bold text-sm uppercase tracking-wider flex items-center space-x-2 transition shadow-md ${
                    isPomoRunning
                      ? 'bg-warning text-canvas hover:brightness-110'
                      : 'bg-primary text-canvas hover:brightness-110'
                  }`}
                >
                  {isPomoRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isPomoRunning ? 'PAUSE' : 'START FOCUS'}</span>
                </button>

                <button
                  onClick={resetPomo}
                  className="p-3.5 rounded-xl bg-canvas border border-border hover:border-primary/50 text-text-muted hover:text-text-main transition shadow-sm"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Subject Tagging */}
              <div className="mt-8 flex items-center space-x-3 text-xs font-mono">
                <span className="text-text-muted">Link Subject:</span>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="bg-canvas border border-border rounded-lg px-3 py-1.5 text-text-main font-mono text-xs focus:outline-none focus:border-primary"
                >
                  <option value="">(No Subject Attached)</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pomodoro Configuration */}
            <div className="hud-panel p-6 space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted">
                Pomodoro Settings
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-text-muted mb-1.5">
                    Work Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={pomoWorkMins}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 25;
                      setPomoWorkMins(v);
                      if (pomoPhase === 'work' && !isPomoRunning) setPomoSecondsLeft(v * 60);
                    }}
                    className="w-full bg-canvas border border-border rounded-lg px-3 py-2 text-sm font-mono text-text-main"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-text-muted mb-1.5">
                    Break Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={pomoBreakMins}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 5;
                      setPomoBreakMins(v);
                      if (pomoPhase === 'break' && !isPomoRunning) setPomoSecondsLeft(v * 60);
                    }}
                    className="w-full bg-canvas border border-border rounded-lg px-3 py-2 text-sm font-mono text-text-main"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: SESSION COUNT-UP TIMER */}
        {/* ========================================================= */}
        {activeTab === 'session' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="hud-panel p-8 text-center flex flex-col items-center">
              <div className="text-xs font-mono text-primary font-bold uppercase tracking-wider mb-2">
                UNCONSTRAINED FOCUS SESSION
              </div>
              <h2 className="text-xs text-text-muted font-mono mb-6">
                Open-ended study timer with automatic database persistence
              </h2>

              <div className="text-7xl sm:text-8xl font-mono font-bold tracking-tight text-text-main my-4 tabular-nums">
                {formatTime(sessionSeconds)}
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-4 mt-6">
                {!isSessionRunning ? (
                  <button
                    onClick={startSession}
                    className="px-8 py-3.5 rounded-xl font-mono font-bold text-sm uppercase tracking-wider bg-primary text-canvas hover:brightness-110 flex items-center space-x-2 transition shadow-md"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>START SESSION</span>
                  </button>
                ) : (
                  <button
                    onClick={pauseSession}
                    className="px-8 py-3.5 rounded-xl font-mono font-bold text-sm uppercase tracking-wider bg-warning text-canvas hover:brightness-110 flex items-center space-x-2 transition shadow-md"
                  >
                    <Pause className="w-4 h-4 fill-current" />
                    <span>PAUSE</span>
                  </button>
                )}

                <button
                  onClick={stopAndSaveSession}
                  disabled={sessionSeconds === 0}
                  className="px-6 py-3.5 rounded-xl font-mono font-bold text-sm uppercase tracking-wider bg-success text-canvas hover:brightness-110 flex items-center space-x-2 transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>LOG TO DATABASE</span>
                </button>
              </div>

              {/* Subject Selector */}
              <div className="mt-8 flex items-center space-x-3 text-xs font-mono">
                <span className="text-text-muted">Target Subject:</span>
                <select
                  value={sessionSubjectId}
                  onChange={(e) => setSessionSubjectId(e.target.value)}
                  className="bg-canvas border border-border rounded-lg px-3 py-1.5 text-text-main font-mono text-xs focus:outline-none focus:border-primary"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: STOPWATCH */}
        {/* ========================================================= */}
        {activeTab === 'stopwatch' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="hud-panel p-8 text-center flex flex-col items-center">
              <div className="text-xs font-mono text-primary font-bold uppercase tracking-wider mb-4">
                PRECISION CHRONOMETER
              </div>

              <div className="text-6xl sm:text-7xl font-mono font-bold tracking-tight text-text-main my-4 tabular-nums">
                {formatStopwatch(stopwatchMs)}
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-3 mt-6">
                <button
                  onClick={() => setIsStopwatchRunning(!isStopwatchRunning)}
                  className={`px-7 py-3 rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition shadow-md ${
                    isStopwatchRunning
                      ? 'bg-warning text-canvas hover:brightness-110'
                      : 'bg-primary text-canvas hover:brightness-110'
                  }`}
                >
                  {isStopwatchRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isStopwatchRunning ? 'PAUSE' : 'START'}</span>
                </button>

                <button
                  onClick={recordLap}
                  disabled={!isStopwatchRunning}
                  className="px-6 py-3 rounded-xl font-mono font-bold text-xs uppercase tracking-wider bg-canvas border border-border hover:border-primary/50 text-text-main transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>RECORD LAP</span>
                </button>

                <button
                  onClick={resetStopwatch}
                  className="p-3 rounded-xl bg-canvas border border-border hover:border-primary/50 text-text-muted hover:text-text-main transition shadow-sm"
                  title="Reset Stopwatch"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Laps List */}
            {laps.length > 0 && (
              <div className="hud-panel p-6 space-y-3">
                <div className="flex items-center justify-between font-mono text-xs text-text-muted border-b border-border pb-2">
                  <span>LAP NUMBER</span>
                  <span>SPLIT TIME</span>
                  <span>TOTAL ELAPSED</span>
                </div>
                <div className="divide-y divide-border/50 max-h-60 overflow-y-auto">
                  {laps.map((lap) => (
                    <div key={lap.id} className="py-2.5 flex items-center justify-between font-mono text-xs">
                      <span className="font-bold text-text-main">Lap #{lap.id}</span>
                      <span className="text-secondary font-semibold">{formatStopwatch(lap.splitMs)}</span>
                      <span className="text-text-muted">{formatStopwatch(lap.totalMs)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: FLIGHT-STYLE HUD TIMER */}
        {/* ========================================================= */}
        {activeTab === 'flight' && (
          <FlightTimer
            subjects={subjects}
            onSessionLogged={(newLog) => {
              setSessionLogs((prev) => [newLog, ...prev]);
              setTotalTimeSecs((prev) => prev + newLog.duration_seconds);
            }}
          />
        )}

        {/* ========================================================= */}
        {/* TAB 5: STUDY CHECKLIST */}
        {/* ========================================================= */}
        {activeTab === 'checklist' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="hud-panel p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                  <h2 className="font-mono text-lg font-bold text-text-main flex items-center space-x-2">
                    <CheckSquare className="w-5 h-5 text-secondary" />
                    <span>Subject Curriculum Checklist</span>
                  </h2>
                  <p className="text-xs font-mono text-text-muted mt-1">
                    Track topic completion from extracted PDF TOCs or custom entries.
                  </p>
                </div>

                {/* Subject Selector */}
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="bg-canvas border border-border rounded-lg px-3 py-2 text-xs font-mono text-text-main focus:outline-none focus:border-secondary"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleImportTocAsChecklist}
                    className="px-3 py-2 rounded-lg bg-surface border border-border hover:border-secondary text-secondary text-xs font-mono font-bold flex items-center space-x-1.5 transition shadow-sm"
                    title="Import Units / TOC from Subject PDFs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">IMPORT FROM PDF TOC</span>
                  </button>
                </div>
              </div>

              {/* Progress Metric */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono text-text-muted">
                  <span>PROGRESS COMPLETION</span>
                  <span className="font-bold text-text-main">
                    {completedChecklistCount} / {checklistItems.length} ({checklistPct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-canvas rounded-full overflow-hidden border border-border">
                  <div
                    style={{ width: `${checklistPct}%` }}
                    className="h-full bg-secondary transition-all duration-300"
                  />
                </div>
              </div>

              {/* Add New Checklist Item Form */}
              <form onSubmit={handleAddChecklistItem} className="flex items-center space-x-2 pt-2">
                <input
                  type="text"
                  placeholder="Add custom topic or chapter to master..."
                  value={newChecklistTitle}
                  onChange={(e) => setNewChecklistTitle(e.target.value)}
                  className="flex-1 bg-canvas border border-border rounded-lg px-3 py-2 text-xs font-mono text-text-main focus:outline-none focus:border-secondary"
                />
                <input
                  type="text"
                  placeholder="Pages (e.g. pp. 12-45)"
                  value={newChecklistRange}
                  onChange={(e) => setNewChecklistRange(e.target.value)}
                  className="w-36 bg-canvas border border-border rounded-lg px-3 py-2 text-xs font-mono text-text-main focus:outline-none focus:border-secondary"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-secondary text-canvas font-mono font-bold text-xs uppercase hover:brightness-110 flex items-center space-x-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>ADD</span>
                </button>
              </form>

              {/* Checklist Items List */}
              <div className="divide-y divide-border/60 pt-2">
                {checklistItems.length === 0 ? (
                  <div className="py-8 text-center text-xs font-mono text-text-muted">
                    No checklist topics yet for this subject. Add topics above or click "IMPORT FROM PDF TOC".
                  </div>
                ) : (
                  checklistItems.map((item) => (
                    <div
                      key={item.id}
                      className="py-3 flex items-center justify-between group hover:bg-canvas/50 px-2 rounded-lg transition"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={item.is_completed}
                          onChange={(e) => handleToggleChecklist(item.id, e.target.checked)}
                          className="w-4 h-4 rounded border-border text-secondary focus:ring-0 cursor-pointer"
                        />
                        <div className="truncate">
                          <span
                            className={`font-mono text-xs ${
                              item.is_completed ? 'line-through text-text-faint' : 'text-text-main'
                            }`}
                          >
                            {item.title}
                          </span>
                          {item.page_range && (
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-surface border border-border text-[10px] font-mono text-text-muted">
                              {item.page_range}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteChecklistItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-text-faint hover:text-danger p-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: ACADEMIC TODOS */}
        {/* ========================================================= */}
        {activeTab === 'todos' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="hud-panel p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h2 className="font-mono text-lg font-bold text-text-main flex items-center space-x-2">
                    <ListTodo className="w-5 h-5 text-primary" />
                    <span>Academic Task Command</span>
                  </h2>
                  <p className="text-xs font-mono text-text-muted mt-1">
                    Manage assignments, problem sets, and study milestones.
                  </p>
                </div>

                {/* Filter Selector */}
                <div className="flex items-center space-x-1 bg-canvas p-1 rounded-lg border border-border text-xs font-mono">
                  {(['all', 'pending', 'completed'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setTodoFilter(f)}
                      className={`px-3 py-1 rounded-md capitalize font-semibold transition ${
                        todoFilter === f ? 'bg-primary text-canvas shadow-sm' : 'text-text-muted hover:text-text-main'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Todo Form */}
              <form onSubmit={handleAddTodo} className="space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="New assignment, lab report, or study task..."
                    value={newTodoTitle}
                    onChange={(e) => setNewTodoTitle(e.target.value)}
                    className="flex-1 bg-canvas border border-border rounded-lg px-3 py-2 text-xs font-mono text-text-main focus:outline-none focus:border-primary"
                  />
                  <select
                    value={newTodoPriority}
                    onChange={(e: any) => setNewTodoPriority(e.target.value)}
                    className="bg-canvas border border-border rounded-lg px-3 py-2 text-xs font-mono text-text-main focus:outline-none focus:border-primary"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">URGENT</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={newTodoSubjectId}
                    onChange={(e) => setNewTodoSubjectId(e.target.value)}
                    className="bg-canvas border border-border rounded-lg px-3 py-2 text-xs font-mono text-text-main focus:outline-none focus:border-primary flex-1"
                  >
                    <option value="">Global (All Subjects)</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="date"
                    value={newTodoDueDate}
                    onChange={(e) => setNewTodoDueDate(e.target.value)}
                    className="bg-canvas border border-border rounded-lg px-3 py-2 text-xs font-mono text-text-main focus:outline-none focus:border-primary"
                  />

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-primary text-canvas font-mono font-bold text-xs uppercase hover:brightness-110 flex items-center space-x-1.5 transition shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>ADD TASK</span>
                  </button>
                </div>
              </form>

              {/* Todo List Items */}
              <div className="divide-y divide-border/60 pt-4">
                {filteredTodos.length === 0 ? (
                  <div className="py-8 text-center text-xs font-mono text-text-muted">
                    No tasks found matching current filter.
                  </div>
                ) : (
                  filteredTodos.map((t) => {
                    const sub = subjects.find((s) => s.id === t.subject_id);
                    return (
                      <div
                        key={t.id}
                        className="py-3 flex items-center justify-between group hover:bg-canvas/50 px-2 rounded-lg transition"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={t.is_completed}
                            onChange={(e) => handleToggleTodo(t.id, e.target.checked)}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-0 cursor-pointer"
                          />
                          <div className="truncate">
                            <span
                              className={`font-mono text-xs ${
                                t.is_completed ? 'line-through text-text-faint' : 'text-text-main font-semibold'
                              }`}
                            >
                              {t.title}
                            </span>
                            <div className="flex items-center space-x-2 mt-1 text-[10px] font-mono">
                              {sub && (
                                <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-primary font-bold">
                                  {sub.code}
                                </span>
                              )}
                              <span
                                className={`px-1.5 py-0.5 rounded uppercase font-bold ${
                                  t.priority === 'urgent'
                                    ? 'bg-danger/20 text-danger border border-danger/40'
                                    : t.priority === 'high'
                                    ? 'bg-warning/20 text-warning border border-warning/40'
                                    : 'bg-surface border border-border text-text-muted'
                                }`}
                              >
                                {t.priority}
                              </span>
                              {t.due_date && (
                                <span className="text-text-muted flex items-center space-x-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>Due: {t.due_date}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteTodo(t.id)}
                          className="opacity-0 group-hover:opacity-100 text-text-faint hover:text-danger p-1 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: STUDY ANALYTICS */}
        {/* ========================================================= */}
        {activeTab === 'analytics' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="hud-panel p-5">
                <div className="text-xs font-mono text-text-muted">TOTAL TIME FOCUSED</div>
                <div className="text-3xl font-mono font-bold text-text-main mt-1">
                  {formatHoursMins(totalTimeSecs)}
                </div>
                <div className="text-[10px] font-mono text-success mt-1">Stored securely in SQLite</div>
              </div>

              <div className="hud-panel p-5">
                <div className="text-xs font-mono text-text-muted">RECORDED SESSIONS</div>
                <div className="text-3xl font-mono font-bold text-text-main mt-1">
                  {sessionLogs.length}
                </div>
                <div className="text-[10px] font-mono text-primary mt-1">All timer modalities</div>
              </div>

              <div className="hud-panel p-5">
                <div className="text-xs font-mono text-text-muted">AVERAGE SESSION</div>
                <div className="text-3xl font-mono font-bold text-text-main mt-1">
                  {sessionLogs.length > 0
                    ? Math.round(totalTimeSecs / sessionLogs.length / 60) + ' mins'
                    : '0 mins'}
                </div>
                <div className="text-[10px] font-mono text-accent mt-1">Consistent focus pace</div>
              </div>
            </div>

            {/* Session Log History */}
            <div className="hud-panel p-6 space-y-4">
              <h3 className="font-mono text-sm font-bold tracking-wider text-text-main">
                HISTORICAL STUDY LOGS
              </h3>

              <div className="divide-y divide-border/60">
                {sessionLogs.length === 0 ? (
                  <div className="py-8 text-center text-xs font-mono text-text-muted">
                    No study sessions recorded yet. Start a Pomodoro, Session, or Flight timer to begin!
                  </div>
                ) : (
                  sessionLogs.slice(0, 15).map((log) => {
                    const sub = subjects.find((s) => s.id === log.subject_id);
                    return (
                      <div key={log.id} className="py-3 flex items-center justify-between font-mono text-xs">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-primary">
                            {log.timer_kind === 'flight' ? (
                              <Plane className="w-4 h-4" />
                            ) : log.timer_kind === 'pomodoro' ? (
                              <Clock className="w-4 h-4" />
                            ) : (
                              <TrendingUp className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-text-main uppercase">
                              {log.timer_kind} Session {sub ? `• ${sub.code}` : ''}
                            </div>
                            <div className="text-[10px] text-text-muted">
                              {new Date(log.start_time).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-success">{formatHoursMins(log.duration_seconds)}</div>
                          <div className="text-[10px] text-text-faint">{log.duration_seconds}s total</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
