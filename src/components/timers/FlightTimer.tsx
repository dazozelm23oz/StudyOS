import React, { useState, useEffect, useRef } from 'react';
import {
  Plane,
  Ticket,
  Clock,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Compass,
  Wind,
  CheckCircle2,
  Sliders,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { Subject, SessionLog } from '../../types';
import { dbService } from '../../services/db';

interface FlightTimerProps {
  subjects?: Subject[];
  onSessionLogged?: (log: SessionLog) => void;
}

type FlightStage = 'checkin' | 'ticket' | 'inflight';

export const FlightTimer: React.FC<FlightTimerProps> = ({ subjects = [], onSessionLogged }) => {
  const [activeStage, setActiveStage] = useState<FlightStage>('checkin');
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>(subjects);

  // Check-in Form State
  const [passengerName, setPassengerName] = useState<string>('Scholar One');
  const [callsign, setCallsign] = useState<string>('STUDY-777');
  const [destinationSubjectId, setDestinationSubjectId] = useState<string>('');
  const [flightDurationMins, setFlightDurationMins] = useState<number>(45);
  const [seatingClass, setSeatingClass] = useState<'First Class (Deep Focus)' | 'Business (Active Recall)' | 'Economy (Quick Review)'>('First Class (Deep Focus)');

  // In-flight Live Timer State
  const [flightSecondsLeft, setFlightSecondsLeft] = useState<number>(45 * 60);
  const [isFlightRunning, setIsFlightRunning] = useState<boolean>(false);
  const [seatbeltFastened, setSeatbeltFastened] = useState<boolean>(true);
  const [isTouchdown, setIsTouchdown] = useState<boolean>(false);

  const flightIntervalRef = useRef<any>(null);

  // Load subjects if not passed in props
  useEffect(() => {
    if (subjects.length > 0) {
      setAvailableSubjects(subjects);
      if (!destinationSubjectId) {
        setDestinationSubjectId(subjects[0].id);
      }
    } else {
      dbService.getSubjects().then((subs) => {
        setAvailableSubjects(subs);
        if (subs.length > 0 && !destinationSubjectId) {
          setDestinationSubjectId(subs[0].id);
        }
      });
    }
  }, [subjects]);

  // Timer interval loop
  useEffect(() => {
    if (isFlightRunning) {
      flightIntervalRef.current = setInterval(() => {
        setFlightSecondsLeft((prev) => {
          if (prev <= 1) {
            handleTouchdown();
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
  }, [isFlightRunning, flightDurationMins, destinationSubjectId]);

  // Touchdown Handler
  const handleTouchdown = async () => {
    setIsFlightRunning(false);
    setIsTouchdown(true);

    const durationSec = flightDurationMins * 60;
    const now = new Date();
    const startTime = new Date(now.getTime() - durationSec * 1000).toISOString();
    const log: SessionLog = {
      id: 'flight-' + Date.now(),
      subject_id: destinationSubjectId || undefined,
      start_time: startTime,
      end_time: now.toISOString(),
      duration_seconds: durationSec,
      timer_kind: 'flight',
      audio_preset_name: `Flight ${callsign}`,
    };

    try {
      await dbService.saveSessionLog(log);
      if (onSessionLogged) {
        onSessionLogged(log);
      }
    } catch (e) {
      console.warn('Error saving flight session log:', e);
    }
  };

  const getSelectedSubjectName = (): string => {
    const s = availableSubjects.find((sub) => sub.id === destinationSubjectId);
    return s ? s.name : 'Independent Study Station';
  };

  // Stage Transitions
  const handleIssueTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveStage('ticket');
  };

  const handleBoardFlight = () => {
    setFlightSecondsLeft(flightDurationMins * 60);
    setIsTouchdown(false);
    setIsFlightRunning(true);
    setActiveStage('inflight');
  };

  const handleToggleFlight = () => {
    setIsFlightRunning(!isFlightRunning);
  };

  const handleResetFlight = () => {
    setIsFlightRunning(false);
    setFlightSecondsLeft(flightDurationMins * 60);
    setIsTouchdown(false);
  };

  const handleDisembark = () => {
    setIsFlightRunning(false);
    setIsTouchdown(false);
    setFlightSecondsLeft(flightDurationMins * 60);
    setActiveStage('checkin');
  };

  const toggleSeatbelt = () => {
    setSeatbeltFastened(!seatbeltFastened);
  };

  // Telemetry Calculations
  const totalSec = flightDurationMins * 60;
  const elapsedSec = totalSec - flightSecondsLeft;
  const progressPct = Math.min(100, Math.max(0, (elapsedSec / totalSec) * 100));

  let flightPhaseLabel = 'PRE-FLIGHT TAXI';
  let altitudeFeet = 0;
  let airspeedMach = 0.0;
  let skyAtmosphereClass = 'from-sky-700 via-indigo-900 to-slate-950';

  if (isTouchdown || flightSecondsLeft === 0) {
    flightPhaseLabel = 'TOUCHDOWN / GATE ARRIVAL';
    altitudeFeet = 0;
    airspeedMach = 0.0;
    skyAtmosphereClass = 'from-amber-600 via-orange-950 to-slate-950';
  } else if (progressPct < 15) {
    flightPhaseLabel = 'DEPARTURE & ROTATION';
    altitudeFeet = Math.round((progressPct / 15) * 10000);
    airspeedMach = 0.28 + (progressPct / 15) * 0.25;
    skyAtmosphereClass = 'from-sky-600 via-blue-900 to-slate-950';
  } else if (progressPct < 30) {
    flightPhaseLabel = 'CLIMBING TO FL380';
    altitudeFeet = 10000 + Math.round(((progressPct - 15) / 15) * 28000);
    airspeedMach = 0.53 + ((progressPct - 15) / 15) * 0.29;
    skyAtmosphereClass = 'from-indigo-700 via-blue-950 to-slate-950';
  } else if (progressPct < 85) {
    flightPhaseLabel = 'CRUISE CEILING FL380';
    altitudeFeet = 38000;
    airspeedMach = 0.82;
    skyAtmosphereClass = 'from-blue-950 via-slate-900 to-black';
  } else {
    flightPhaseLabel = 'DESCENT & FINAL APPROACH';
    altitudeFeet = Math.max(300, Math.round(38000 * (1 - (progressPct - 85) / 15)));
    airspeedMach = 0.82 - ((progressPct - 85) / 15) * 0.55;
    skyAtmosphereClass = 'from-amber-700 via-purple-950 to-slate-950';
  }

  const formatTimerDigits = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* ======================================================== */}
      {/* 1. STAGE: CHECK-IN */}
      {/* ======================================================== */}
      {activeStage === 'checkin' && (
        <div className="hud-panel p-8 space-y-6 border border-border">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-surface border border-border text-primary">
                <Plane className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-mono text-text-main">StudyOS Aerospace Check-in</h2>
                <p className="text-xs text-text-muted font-mono">
                  Configure your high-focus academic flight trajectory and issue your boarding pass.
                </p>
              </div>
            </div>
            <div className="hidden sm:block text-right font-mono text-xs text-text-muted">
              <div>TERMINAL 4 • GATE A1</div>
              <div className="text-primary font-bold">READY FOR DEPARTURE</div>
            </div>
          </div>

          <form onSubmit={handleIssueTicket} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Passenger Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-text-muted">PASSENGER / CALLSIGN NAME</label>
                <input
                  type="text"
                  required
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  placeholder="e.g. Cadet Miller"
                  className="w-full bg-canvas border border-border rounded-xl px-4 py-3 font-mono text-sm text-text-main focus:outline-none focus:border-primary"
                />
              </div>

              {/* Callsign */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-text-muted">AIRCRAFT CALLSIGN</label>
                <input
                  type="text"
                  required
                  value={callsign}
                  onChange={(e) => setCallsign(e.target.value.toUpperCase())}
                  placeholder="e.g. STUDY-777"
                  className="w-full bg-canvas border border-border rounded-xl px-4 py-3 font-mono text-sm text-text-main focus:outline-none focus:border-primary"
                />
              </div>

              {/* Destination Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-text-muted">FLIGHT DESTINATION (SUBJECT)</label>
                <select
                  value={destinationSubjectId}
                  onChange={(e) => setDestinationSubjectId(e.target.value)}
                  className="w-full bg-canvas border border-border rounded-xl px-4 py-3 font-mono text-sm text-text-main focus:outline-none focus:border-primary"
                >
                  {availableSubjects.length === 0 ? (
                    <option value="">General Research & Focus</option>
                  ) : (
                    availableSubjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.code ? `[${sub.code}] ` : ''}
                        {sub.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Seating Class */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-text-muted">CABIN CLASS & COGNITIVE MODE</label>
                <select
                  value={seatingClass}
                  onChange={(e) => setSeatingClass(e.target.value as any)}
                  className="w-full bg-canvas border border-border rounded-xl px-4 py-3 font-mono text-sm text-text-main focus:outline-none focus:border-primary"
                >
                  <option value="First Class (Deep Focus)">First Class (Deep Focus • Zero Distraction)</option>
                  <option value="Business (Active Recall)">Business (Active Recall • Problem Solving)</option>
                  <option value="Economy (Quick Review)">Economy (Quick Review • Rapid Reading)</option>
                </select>
              </div>
            </div>

            {/* Flight Duration Presets */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-text-muted">ESTIMATED FLIGHT DURATION</span>
                <span className="font-bold text-primary">{flightDurationMins} MINUTES</span>
              </div>
              <div className="grid grid-cols-5 gap-2.5">
                {[15, 25, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setFlightDurationMins(mins)}
                    className={`py-2.5 rounded-xl font-mono text-xs font-bold transition border ${
                      flightDurationMins === mins
                        ? 'bg-primary text-canvas border-primary shadow-sm'
                        : 'bg-canvas text-text-muted border-border hover:border-primary/50'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3.5 rounded-xl bg-primary text-canvas font-mono text-xs font-bold uppercase tracking-wider flex items-center space-x-2.5 hover:brightness-110 transition shadow-md"
              >
                <span>CONFIRM CHECK-IN & ISSUE TICKET</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. STAGE: BOARDING PASS TICKET */}
      {/* ======================================================== */}
      {activeStage === 'ticket' && (
        <div className="space-y-6">
          <div className="relative rounded-2xl overflow-hidden border border-border bg-surface shadow-2xl flex flex-col md:flex-row">
            {/* Main Boarding Pass Section */}
            <div className="flex-1 p-8 space-y-6">
              {/* Airline Header */}
              <div className="flex items-center justify-between border-b border-border pb-4 font-mono">
                <div className="flex items-center space-x-2.5">
                  <Plane className="w-5 h-5 text-accent" />
                  <span className="font-bold text-sm text-text-main tracking-wider">STUDYOS AEROSPACE</span>
                  <span className="text-[11px] text-accent font-semibold px-2 py-0.5 rounded bg-accent/10 border border-accent/20">
                    BOARDING PASS
                  </span>
                </div>
                <div className="text-xs text-text-muted">FLIGHT: <span className="font-bold text-text-main">{callsign}</span></div>
              </div>

              {/* Route */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-[11px] font-mono text-text-muted">ORIGIN</div>
                  <div className="text-2xl font-bold font-mono text-text-main">BASE CAMP</div>
                  <div className="text-[11px] font-mono text-text-faint">DEPARTURE: NOW</div>
                </div>

                <div className="flex flex-col items-center px-4">
                  <div className="text-[10px] font-mono text-accent mb-1 font-bold">{flightDurationMins} MIN NON-STOP</div>
                  <div className="w-24 sm:w-36 h-[2px] bg-border relative flex items-center justify-center">
                    <Plane className="w-4 h-4 text-primary absolute" />
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] font-mono text-text-muted">DESTINATION</div>
                  <div className="text-2xl font-bold font-mono text-primary truncate max-w-[200px]">
                    {getSelectedSubjectName()}
                  </div>
                  <div className="text-[11px] font-mono text-text-faint">CRUISE ALTITUDE FL380</div>
                </div>
              </div>

              {/* Passenger & Flight Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border font-mono text-xs">
                <div>
                  <div className="text-text-muted text-[10px]">PASSENGER</div>
                  <div className="font-bold text-text-main truncate">{passengerName}</div>
                </div>
                <div>
                  <div className="text-text-muted text-[10px]">GATE</div>
                  <div className="font-bold text-accent">GATE 4B</div>
                </div>
                <div>
                  <div className="text-text-muted text-[10px]">SEAT</div>
                  <div className="font-bold text-text-main">01A (WINDOW)</div>
                </div>
                <div>
                  <div className="text-text-muted text-[10px]">CLASS</div>
                  <div className="font-bold text-primary truncate">{seatingClass.split(' ')[0]}</div>
                </div>
              </div>
            </div>

            {/* Perforated Divider */}
            <div className="relative w-full md:w-0 border-t md:border-t-0 md:border-l border-dashed border-border/80 flex items-center justify-center">
              <div className="hidden md:block absolute -top-4 -left-3 w-6 h-6 rounded-full bg-canvas border border-border" />
              <div className="hidden md:block absolute -bottom-4 -left-3 w-6 h-6 rounded-full bg-canvas border border-border" />
            </div>

            {/* Ticket Stub & Barcode */}
            <div className="w-full md:w-64 bg-canvas/60 p-6 flex flex-col justify-between font-mono text-xs space-y-6">
              <div className="space-y-2">
                <div className="text-text-muted text-[10px]">ELECTRONIC STUB</div>
                <div className="font-bold text-text-main text-sm truncate">{passengerName}</div>
                <div className="text-text-muted text-[11px]">FLIGHT: {callsign}</div>
                <div className="text-text-muted text-[11px]">SEAT: 01A</div>
              </div>

              {/* Aesthetic Barcode */}
              <div className="space-y-1.5 text-center">
                <div className="h-12 w-full flex items-center justify-between space-x-1 opacity-70">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-full bg-text-main ${
                        i % 4 === 0 ? 'w-1.5' : i % 2 === 0 ? 'w-0.5' : 'w-1'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-[9px] tracking-widest text-text-faint">
                  *ST-OS-{Date.now().toString().slice(-8)}*
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveStage('checkin')}
              className="px-5 py-3 rounded-xl bg-canvas border border-border text-text-muted hover:text-text-main font-mono text-xs font-bold transition"
            >
              ← EDIT FLIGHT DETAILS
            </button>

            <button
              onClick={handleBoardFlight}
              className="px-8 py-3.5 rounded-xl bg-primary text-canvas font-mono text-xs font-bold uppercase tracking-wider flex items-center space-x-2.5 hover:brightness-110 transition shadow-lg"
            >
              <Plane className="w-4 h-4 fill-current" />
              <span>BOARD AIRCRAFT & COMMENCE TAKEOFF</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. STAGE: IN-FLIGHT WINDOW VIEW */}
      {/* ======================================================== */}
      {activeStage === 'inflight' && (
        <div className="space-y-6">
          {/* Main Flight Deck & Aircraft Window Frame */}
          <div className="hud-panel p-6 sm:p-8 relative overflow-hidden border border-border bg-surface">
            {/* Aircraft Cockpit Telemetry Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 mb-6 font-mono text-xs">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-accent animate-ping" />
                <span className="font-bold tracking-wider text-accent">COCKPIT FLIGHT DECK</span>
                <span className="text-text-faint">•</span>
                <span className="text-text-main font-semibold">CALLSIGN: {callsign}</span>
              </div>

              <div className="flex items-center space-x-3">
                {/* Seatbelt Sign Button */}
                <button
                  onClick={toggleSeatbelt}
                  className={`px-3 py-1.5 rounded-lg border font-mono text-[11px] font-bold flex items-center space-x-1.5 transition ${
                    seatbeltFastened
                      ? 'bg-danger/15 border-danger/40 text-danger'
                      : 'bg-canvas border-border text-text-muted'
                  }`}
                  title="Toggle Fasten Seatbelt Sign"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>SEATBELT {seatbeltFastened ? 'ON' : 'OFF'}</span>
                </button>

                <div className="text-text-muted">
                  STAGE: <span className="font-bold text-primary">{flightPhaseLabel}</span>
                </div>
              </div>
            </div>

            {/* Central Aircraft Oval Window Viewport */}
            <div className="flex flex-col items-center justify-center my-4">
              <div className="relative w-64 h-80 sm:w-72 sm:h-96 rounded-[90px] p-4 bg-gradient-to-b from-border to-canvas border-4 border-surface shadow-2xl overflow-hidden flex items-center justify-center">
                {/* Window Bezel Inner Rim */}
                <div className="absolute inset-2 rounded-[80px] border border-white/10 pointer-events-none z-20" />

                {/* Sky Atmosphere Dynamic Canvas */}
                <div
                  className={`absolute inset-0 bg-gradient-to-b ${skyAtmosphereClass} transition-colors duration-1000 z-0 flex flex-col justify-between p-6`}
                >
                  {/* Subtle Cloud Layer Drifting */}
                  <div className="space-y-8 opacity-40 animate-pulse pt-4">
                    <div className="h-6 w-32 bg-white/20 rounded-full blur-md" />
                    <div className="h-8 w-44 bg-white/25 rounded-full blur-lg ml-auto" />
                    <div className="h-5 w-28 bg-white/15 rounded-full blur-sm" />
                  </div>

                  {/* Window Horizon Line */}
                  <div className="w-full h-[1px] bg-white/15 opacity-50" />
                </div>

                {/* In-Window HUD Overlay */}
                <div className="relative z-10 text-center font-mono space-y-2 pointer-events-none">
                  <div className="text-xs uppercase tracking-widest text-white/70 font-semibold drop-shadow">
                    TOUCHDOWN IN
                  </div>
                  <div className="text-5xl font-black text-white tracking-tight tabular-nums drop-shadow-lg">
                    {formatTimerDigits(flightSecondsLeft)}
                  </div>
                  <div className="text-[11px] text-white/80 font-bold bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10 inline-block">
                    {Math.round(progressPct)}% COMPLETE
                  </div>
                </div>
              </div>
            </div>

            {/* Flight Instrument Gauges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
              {/* Altitude Gauge */}
              <div className="p-4 rounded-xl bg-canvas border border-border text-center">
                <div className="text-[11px] font-mono text-text-muted uppercase flex items-center justify-center space-x-1.5">
                  <Compass className="w-3.5 h-3.5 text-accent" />
                  <span>ALTITUDE CEILING</span>
                </div>
                <div className="text-3xl font-mono font-bold text-text-main mt-1">
                  {altitudeFeet.toLocaleString()} <span className="text-xs text-text-faint">FT</span>
                </div>
                <div className="text-[10px] font-mono text-accent mt-1">
                  {altitudeFeet >= 38000 ? 'MAX CRUISE CEILING FL380' : 'ALTITUDE GAIN IN PROGRESS'}
                </div>
              </div>

              {/* Main Flight Stage */}
              <div className="p-4 rounded-xl bg-canvas border border-primary/40 text-center shadow-sm">
                <div className="text-[11px] font-mono text-primary font-bold uppercase flex items-center justify-center space-x-1.5">
                  <Plane className="w-3.5 h-3.5" />
                  <span>FLIGHT TRAJECTORY</span>
                </div>
                <div className="text-base font-mono font-bold text-text-main mt-2 truncate">
                  {getSelectedSubjectName()}
                </div>
                <div className="text-[10px] font-mono text-text-faint mt-1">
                  CABIN: {seatingClass.split(' ')[0]}
                </div>
              </div>

              {/* Airspeed Gauge */}
              <div className="p-4 rounded-xl bg-canvas border border-border text-center">
                <div className="text-[11px] font-mono text-text-muted uppercase flex items-center justify-center space-x-1.5">
                  <Wind className="w-3.5 h-3.5 text-secondary" />
                  <span>AIRSPEED VELOCITY</span>
                </div>
                <div className="text-3xl font-mono font-bold text-text-main mt-1">
                  M {airspeedMach.toFixed(2)}
                </div>
                <div className="text-[10px] font-mono text-secondary mt-1">
                  {airspeedMach >= 0.8 ? 'OPTIMAL SUB-SONIC SPEED' : 'INITIAL ROTATION SPEED'}
                </div>
              </div>
            </div>

            {/* Flight Path Altitude Profile */}
            <div className="space-y-2 my-6">
              <div className="flex items-center justify-between text-xs font-mono text-text-muted">
                <span>TAXI / DEPARTURE (0%)</span>
                <span>CRUISE FL380 (50%)</span>
                <span>APPROACH & TOUCHDOWN (100%)</span>
              </div>
              <div className="w-full h-3 bg-canvas rounded-full overflow-hidden border border-border relative">
                <div
                  style={{ width: `${progressPct}%` }}
                  className="h-full bg-gradient-to-r from-primary via-accent to-success transition-all duration-300"
                />
              </div>
            </div>

            {/* Touchdown Banner Celebration */}
            {isTouchdown && (
              <div className="p-5 rounded-2xl bg-success/15 border border-success/40 text-center space-y-3 my-4">
                <div className="flex items-center justify-center space-x-2 text-success font-mono font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>TOUCHDOWN CONFIRMED • WELCOME TO {getSelectedSubjectName().toUpperCase()}!</span>
                </div>
                <p className="text-xs text-text-muted font-mono max-w-md mx-auto">
                  Flight {callsign} landed successfully. Academic session has been logged to your flight records.
                </p>
                <button
                  onClick={handleDisembark}
                  className="px-6 py-2.5 rounded-xl bg-success text-canvas font-mono text-xs font-bold uppercase tracking-wider hover:brightness-110 transition shadow"
                >
                  DISEMBARK & PLAN NEXT FLIGHT
                </button>
              </div>
            )}

            {/* In-Flight Transport Controls */}
            {!isTouchdown && (
              <div className="flex items-center justify-center space-x-4 pt-2">
                <button
                  onClick={handleToggleFlight}
                  className={`px-8 py-3.5 rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition shadow-md ${
                    isFlightRunning
                      ? 'bg-warning text-canvas hover:brightness-110'
                      : 'bg-accent text-canvas hover:brightness-110'
                  }`}
                >
                  {isFlightRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isFlightRunning ? 'HOLD PATTERN (PAUSE)' : 'RESUME TRAJECTORY'}</span>
                </button>

                <button
                  onClick={handleResetFlight}
                  className="p-3.5 rounded-xl bg-canvas border border-border hover:border-accent/50 text-text-muted hover:text-text-main transition shadow-sm"
                  title="Reset Flight"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={handleDisembark}
                  className="px-4 py-3.5 rounded-xl bg-canvas border border-border hover:border-danger/50 text-text-muted hover:text-danger font-mono text-xs font-bold transition"
                  title="Abort flight and return to terminal"
                >
                  ABORT
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
