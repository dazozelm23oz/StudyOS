# StudyOS Feature Inventory & Tracking

Status Key:
- `[DONE]` Completed, verified, and documented
- `[IN PROGRESS]` Currently being implemented
- `[PLANNED]` Scheduled for subsequent phases
- `[DEFERRED]` Postponed for future release

---

## 0. Non-Negotiable Hard Constraints
- `[DONE]` Zero hardcoded academic content (database starts strictly empty)
- `[DONE]` Zero online API calls for PDF/audio processing (100% offline local)
- `[DONE]` Single portable project data directory (`./data/`)
- `[DONE]` Native Linux desktop app (Tauri v2 + Fedora KDE integration)
- `[DONE]` Futuristic, bespoke visual design across all surfaces
- `[DONE]` Living documentation (`README.md`, `FEATURES.md`, `CHANGELOG.md`) kept in sync
- `[DONE]` Mandatory automated ext4 hardlink auto-backup (`/mnt/StudyBackups`) and Git sync

---

## 1. Core Architecture & Runtime
- `[DONE]` Living project documentation & Git repository (`Phase 0`)
- `[IN PROGRESS]` Tauri v2 desktop shell with native Linux webview (`Phase 1`)
- `[IN PROGRESS]` React 19 + TypeScript + Vite + Tailwind CSS design system (`Phase 1`)
- `[IN PROGRESS]` SQLite relational database engine with automated migrations (`Phase 1`)
- `[PLANNED]` External ext4 hardlink auto-backup script (`rsync --link-dest`) (`Phase 1b`)
- `[PLANNED]` Automated Git commit & push synchronization engine (`Phase 1b`)

---

## 2. Academic Hierarchy & Profile
- `[PLANNED]` Academic hierarchy CRUD (Year → Semester → Subject → Resource) (`Phase 2`)
- `[PLANNED]` Drag-and-drop reordering at every level (`@dnd-kit`) (`Phase 2`)
- `[PLANNED]` Custom fields (arbitrary key/value pairs) on profile and hierarchy nodes (`Phase 2`)
- `[PLANNED]` Per-subject metadata (code, credits, instructor, notes, custom colors) (`Phase 2`)
- `[PLANNED]` Student profile screen (name, major, university, dates, avatar) (`Phase 2`)

---

## 3. PDF Ingestion & Management
- `[PLANNED]` Offline PDF importer with copy to managed library (`./data/library/`) (`Phase 3`)
- `[PLANNED]` SHA-256 deduplication and duplicate file warning (`Phase 3`)
- `[PLANNED]` Pure Rust metadata extraction (page count, title, author) via `lopdf` (`Phase 3`)
- `[PLANNED]` Pure Rust Table of Contents (TOC) / bookmarks outline parser (`Phase 3`)

---

## 4. In-App PDF Viewer
- `[PLANNED]` Smooth local PDF.js canvas rendering with high-DPI support (`Phase 4`)
- `[PLANNED]` Virtualized page scrolling and instant page jumping (`Phase 4`)
- `[PLANNED]` Non-destructive highlight annotations stored in SQLite (`Phase 4`)
- `[PLANNED]` Highlight notes, color picker, and persistent SVG overlay layer (`Phase 4`)
- `[PLANNED]` Local in-document full-text search with counter (`Phase 4`)
- `[PLANNED]` Session memory (remembers page, zoom, scroll position, and active panes) (`Phase 4`)
- `[PLANNED]` Side-by-side multi-pane split layout (2 to 4 independent panes) (`Phase 4`)

---

## 5. PDF Unit Extraction
- `[PLANNED]` Unit definition interface (auto-import from TOC or syntax parser) (`Phase 5`)
- `[PLANNED]` Page range syntax parser supporting expressions like `1-5,7,10-20` (`Phase 5`)
- `[PLANNED]` Pure Rust offline page-slicing and merging via `lopdf` (`Phase 5`)
- `[PLANNED]` Output modes: Single merged PDF or one PDF per unit (`Phase 5`)
- `[PLANNED]` Automatic ingestion into Subject Resources with progress indicator (`Phase 5`)

---

## 6. Study Tracking & Timers
- `[PLANNED]` Subject guide checklist extractor (converts units to interactive checklist) (`Phase 6`)
- `[PLANNED]` Hierarchical Todo list (global & per-subject with priorities and due dates) (`Phase 6`)
- `[PLANNED]` Pomodoro timer with configurable cycles and auto-phase transitions (`Phase 6`)
- `[PLANNED]` Count-up session timer logging time directly to subjects/resources (`Phase 6`)
- `[PLANNED]` High-precision stopwatch with lap logging (`Phase 6`)
- `[PLANNED]` Aviation "Flight-Style" HUD timer (Departure → Cruise → Touchdown) (`Phase 6`)
- `[PLANNED]` Time-spent analytics dashboard and CSV session export (`Phase 6`)
- `[PLANNED]` "Today" Mission Control dashboard with toggleable progress widgets (`Phase 6`)

---

## 7. Study Audio & Synthesizers
- `[PLANNED]` Real-time procedural rain synthesizer via Web Audio API (`Phase 6b`)
- `[PLANNED]` Wind gust LFO modulation and Brownian noise thunder rumble bursts (`Phase 6b`)
- `[PLANNED]` Local audio file importer (`.mp3`, `.wav`, `.ogg`, `.flac`, `.m4a`) (`Phase 6b`)
- `[PLANNED]` Multi-layer audio mixer with per-channel volume sliders (`Phase 6b`)
- `[PLANNED]` Named audio presets with auto-attachment to timer phases (`Phase 6b`)
- `[PLANNED]` Persistent mini-player with master volume and low CPU PipeWire output (`Phase 6b`)

---

## 8. Visual Customization & Theming
- `[PLANNED]` Futuristic Multi-Preset Theme Suite (Cyberdeck HUD, Void Black, Cyber Amber, Deep Nebula) (`Phase 7`)
- `[PLANNED]` In-app visual theme editor with real-time CSS variable live preview (`Phase 7`)
- `[PLANNED]` JSON theme export and import (`Phase 7`)
- `[PLANNED]` Independent Dark / Light mode toggle (`Phase 7`)
- `[PLANNED]` Banner customization (upload, procedural CSS gradient generator, opt-in cached gallery) (`Phase 7`)

---

## 9. Global Utilities & Data Protection
- `[PLANNED]` Global Command Palette (`Ctrl+K` / `⌘+K`) for fast keyboard navigation (`Phase 8`)
- `[PLANNED]` Universal search indexing subjects, resources, notes, and tasks (`Phase 8`)
- `[PLANNED]` Academic calendar with exam countdowns (`Phase 8`)
- `[PLANNED]` One-click manual backup & restore via standalone ZIP archive (`Phase 8`)
- `[PLANNED]` In-app backup history log with snapshot inspect and rollback capabilities (`Phase 8`)
