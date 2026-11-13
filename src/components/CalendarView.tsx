import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Flag,
  Flame,
} from 'lucide-react';
import { Subject, TodoItem } from '../types';
import { dbService } from '../services/db';

interface ExamCountdown {
  id: string;
  subject_id?: string;
  title: string;
  event_type: 'exam' | 'assignment' | 'quiz' | 'milestone';
  due_date: string; // YYYY-MM-DD
  is_completed: boolean;
}

export const CalendarView: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [events, setEvents] = useState<ExamCountdown[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Form State
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState<'exam' | 'assignment' | 'quiz' | 'milestone'>('exam');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventSubjectId, setNewEventSubjectId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subs, todos] = await Promise.all([
        dbService.getSubjects(),
        dbService.getTodos(),
      ]);
      setSubjects(subs);
      
      // Load saved events from localStorage or todos with due dates
      const savedEvents = localStorage.getItem('studyos_academic_events');
      if (savedEvents) {
        try {
          setEvents(JSON.parse(savedEvents));
        } catch (e) {
          console.warn('Could not parse academic events:', e);
        }
      } else {
        // Fallback: seed from todos with due dates
        const mapped: ExamCountdown[] = todos
          .filter((t) => t.due_date)
          .map((t) => ({
            id: 'ev-' + t.id,
            subject_id: t.subject_id,
            title: t.title,
            event_type: t.priority === 'urgent' ? 'exam' : 'assignment',
            due_date: t.due_date!,
            is_completed: t.is_completed,
          }));
        setEvents(mapped);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveEvents = (newEvents: ExamCountdown[]) => {
    setEvents(newEvents);
    localStorage.setItem('studyos_academic_events', JSON.stringify(newEvents));
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDate) return;

    const created: ExamCountdown = {
      id: 'event-' + Date.now(),
      title: newEventTitle.trim(),
      subject_id: newEventSubjectId || undefined,
      event_type: newEventType,
      due_date: newEventDate,
      is_completed: false,
    };

    saveEvents([...events, created]);
    setNewEventTitle('');
    setNewEventDate('');
  };

  const handleDeleteEvent = (id: string) => {
    saveEvents(events.filter((e) => e.id !== id));
  };

  const handleToggleComplete = (id: string) => {
    saveEvents(
      events.map((e) => (e.id === id ? { ...e, is_completed: !e.is_completed } : e))
    );
  };

  // Countdown Calculator
  const getCountdownString = (dueDateStr: string) => {
    const target = new Date(dueDateStr + 'T23:59:59').getTime();
    const now = new Date().getTime();
    const diff = target - now;

    if (diff <= 0) return { label: 'Past Deadline', isUrgent: true, isPast: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days === 0) {
      return { label: `Due Today! (${hours}h remaining)`, isUrgent: true, isPast: false };
    }
    if (days === 1) {
      return { label: `Tomorrow (${hours}h remaining)`, isUrgent: true, isPast: false };
    }
    return { label: `${days} days ${hours}h left`, isUrgent: days <= 3, isPast: false };
  };

  // Calendar Grid Builder for the active month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const sortedEvents = [...events].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-canvas text-text-main select-none">
      {/* Header */}
      <div className="hud-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-primary">
        <div>
          <div className="flex items-center space-x-2 text-primary font-mono text-xs uppercase mb-1 font-bold">
            <CalendarIcon className="w-4 h-4" />
            <span>ACADEMIC TIMELINE & EXAM COMMAND</span>
          </div>
          <h1 className="text-2xl font-bold font-mono tracking-tight text-text-main">
            Calendar & Deadline Countdowns
          </h1>
          <p className="text-xs text-text-muted mt-1 font-mono">
            Track midterm exams, finals, project milestones, and assignment targets.
          </p>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-surface border border-border text-text-muted">
            Pending Milestones: <strong className="text-primary">{events.filter((e) => !e.is_completed).length}</strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Visual Calendar Grid (2 Cols on lg) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="hud-panel p-6 space-y-4">
            {/* Calendar Controls */}
            <div className="flex items-center justify-between border-b border-border pb-3 font-mono">
              <div className="font-bold text-base text-text-main flex items-center space-x-2">
                <span>{monthName} {year}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg bg-canvas border border-border hover:border-primary/50 text-text-muted hover:text-text-main transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1 rounded-lg bg-canvas border border-border text-xs font-bold hover:border-primary text-text-main transition"
                >
                  Today
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg bg-canvas border border-border hover:border-primary/50 text-text-muted hover:text-text-main transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-2 font-mono text-xs text-center text-text-muted font-bold">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-2 font-mono text-xs">
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="h-20 rounded-xl bg-canvas/30 border border-border/30 opacity-40" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayEvents = events.filter((e) => e.due_date === dateKey);
                const isToday =
                  new Date().getDate() === dayNum &&
                  new Date().getMonth() === month &&
                  new Date().getFullYear() === year;

                return (
                  <div
                    key={dayNum}
                    className={`h-20 p-1.5 rounded-xl border flex flex-col justify-between transition ${
                      isToday
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border bg-canvas hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-bold ${isToday ? 'text-primary' : 'text-text-main'}`}>
                        {dayNum}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                      )}
                    </div>

                    <div className="space-y-1 overflow-hidden">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className={`text-[9px] px-1 py-0.5 rounded truncate font-semibold uppercase ${
                            ev.event_type === 'exam'
                              ? 'bg-danger/20 text-danger border border-danger/40'
                              : 'bg-primary/20 text-primary border border-primary/40'
                          }`}
                        >
                          {ev.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Deadlines, Countdowns & Add Event Form */}
        <div className="space-y-6">
          {/* Add Milestone Form */}
          <div className="hud-panel p-6 space-y-4">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-primary flex items-center space-x-2">
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Register Exam or Deadline</span>
            </h3>

            <form onSubmit={handleAddEvent} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-text-muted mb-1">Title / Milestone</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Quantum Physics Midterm"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full bg-canvas border border-border rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-text-muted mb-1">Type</label>
                  <select
                    value={newEventType}
                    onChange={(e: any) => setNewEventType(e.target.value)}
                    className="w-full bg-canvas border border-border rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-primary"
                  >
                    <option value="exam">Exam</option>
                    <option value="assignment">Assignment</option>
                    <option value="quiz">Quiz</option>
                    <option value="milestone">Project</option>
                  </select>
                </div>

                <div>
                  <label className="block text-text-muted mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full bg-canvas border border-border rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-text-muted mb-1">Linked Subject</label>
                <select
                  value={newEventSubjectId}
                  onChange={(e) => setNewEventSubjectId(e.target.value)}
                  className="w-full bg-canvas border border-border rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-primary"
                >
                  <option value="">(None / General)</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-primary text-canvas font-bold uppercase hover:brightness-110 transition shadow-sm"
              >
                Schedule Milestone
              </button>
            </form>
          </div>

          {/* Active Countdowns Feed */}
          <div className="hud-panel p-6 space-y-4">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-text-muted flex items-center space-x-2">
              <Clock className="w-4 h-4 text-accent" />
              <span>Upcoming Exam Countdowns</span>
            </h3>

            <div className="divide-y divide-border/60 max-h-96 overflow-y-auto">
              {sortedEvents.length === 0 ? (
                <div className="py-6 text-center font-mono text-xs text-text-muted">
                  No upcoming deadlines registered. Add your exam dates above.
                </div>
              ) : (
                sortedEvents.map((ev) => {
                  const sub = subjects.find((s) => s.id === ev.subject_id);
                  const cd = getCountdownString(ev.due_date);

                  return (
                    <div
                      key={ev.id}
                      className="py-3 flex items-start justify-between group hover:bg-canvas/50 px-2 rounded-lg transition"
                    >
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={ev.is_completed}
                          onChange={() => handleToggleComplete(ev.id)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-0 cursor-pointer mt-0.5"
                        />
                        <div className="truncate">
                          <div
                            className={`font-mono text-xs font-bold truncate ${
                              ev.is_completed ? 'line-through text-text-faint' : 'text-text-main'
                            }`}
                          >
                            {ev.title}
                          </div>
                          <div className="flex items-center space-x-2 mt-1 font-mono text-[10px]">
                            {sub && (
                              <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-primary font-bold">
                                {sub.code}
                              </span>
                            )}
                            <span
                              className={`px-1.5 py-0.5 rounded uppercase font-bold ${
                                cd.isUrgent
                                  ? 'bg-danger/20 text-danger border border-danger/40'
                                  : 'bg-surface border border-border text-text-muted'
                              }`}
                            >
                              {cd.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteEvent(ev.id)}
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
      </div>
    </div>
  );
};
