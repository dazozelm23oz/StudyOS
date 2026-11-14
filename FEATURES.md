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
- `[DONE]` External ext4 hardlink auto-backup script (`rsync --link-dest`) (`Phase 1b`)
- `[DONE]` Automated Git commit & push synchronization engine (`Phase 1b`)
- `[DONE]` Tauri v2 desktop shell with native Linux webview (`Phase 1`)
- `[DONE]` React 19 + TypeScript + Vite + Tailwind CSS design system (`Phase 1`)
- `[DONE]` SQLite relational database engine with automated migrations (`Phase 1`)

---

## 2. Academic Hierarchy & Profile
- `[DONE]` Academic hierarchy CRUD (Year → Semester → Subject → Resource) (`Phase 2`)
- `[DONE]` Student profile screen (name, major, university, dates, avatar) (`Phase 2`)
- `[DONE]` Drag-and-drop reordering at every level (`@dnd-kit`) (`Phase 2`)
- `[DONE]` Custom fields (arbitrary key/value pairs) on profile and hierarchy nodes (`Phase 2`)
- `[DONE]` Per-subject metadata (code, credits, instructor, notes, custom colors) (`Phase 2`)

---

## 3. PDF Ingestion & Management
- `[DONE]` Offline PDF importer with copy to managed library (`./data/library/`) (`Phase 3`)
- `[DONE]` SHA-256 deduplication and duplicate file warning (`Phase 3`)
- `[DONE]` Pure Rust metadata extraction (page count, title, author) via `lopdf` (`Phase 3`)
- `[DONE]` Pure Rust Table of Contents (TOC) / bookmarks outline parser (`Phase 3`)

---

## 4. In-App PDF Viewer
- `[DONE]` Smooth local PDF.js canvas rendering with high-DPI support (`Phase 4`)
- `[DONE]` Virtualized page scrolling and instant page jumping (`Phase 4`)
- `[DONE]` Non-destructive highlight annotations stored in SQLite (`Phase 4`)
- `[DONE]` Highlight notes, color picker, and persistent SVG overlay layer (`Phase 4`)
- `[DONE]` Local in-document full-text search with counter (`Phase 4`)
- `[DONE]` Session memory (remembers page, zoom, scroll position, and active panes) (`Phase 4`)
- `[DONE]` Side-by-side multi-pane split layout (1 to 4 independent panes) (`Phase 4`)

---

## 5. PDF Unit Extraction
- `[DONE]` Unit definition interface (auto-import from TOC or syntax parser) (`Phase 5`)
- `[DONE]` Page range syntax parser supporting expressions like `1-5,7,10-20` (`Phase 5`)
- `[DONE]` Pure Rust offline page-slicing and merging via `lopdf` (`Phase 5`)
- `[DONE]` Output modes: Single merged PDF or one PDF per unit (`Phase 5`)
- `[DONE]` Automatic ingestion into Subject Resources with progress indicator (`Phase 5`)

---

## 6. Study Tracking & Timers
- `[DONE]` Subject guide checklist extractor (converts units and TOC bookmarks to interactive checklist) (`Phase 6`)
- `[DONE]` Hierarchical Todo list (global & per-subject with priorities and due dates) (`Phase 6`)
- `[DONE]` Pomodoro timer with configurable cycles and auto-phase transitions (`Phase 6`)
- `[DONE]` Count-up session timer logging time directly to subjects/resources (`Phase 6`)
- `[DONE]` High-precision stopwatch with lap logging (`Phase 6`)
- `[DONE]` Aviation "Flight-Style" HUD timer (Departure → Cruise → Touchdown) (`Phase 6`)
- `[DONE]` Time-spent analytics dashboard with SQLite persistence (`Phase 6`)
- `[DONE]` "Today" Mission Control dashboard with expanded toggleable progress widgets (`Phase 6`)

---

## 7. Study Audio & Synthesizers
- `[DONE]` High-performance native Rust procedural rain synthesizer via `rodio` (`Phase 6b & Architecture Pivot`)
- `[DONE]` Native Rust multi-threaded audio worker over channel message bus (`AudioCommand`) eliminating WebKitGTK GC and suspension issues (`Architecture Pivot`)
- `[DONE]` Native Rust local audio file decoder and player (`.mp3`, `.wav`, `.ogg`, `.flac`) via `rodio` with seamless looping (`Architecture Pivot`)
- `[DONE]` Multi-layer audio mixer with per-channel volume sliders (`Phase 6b`)
- `[DONE]` Named audio presets with auto-attachment to timer phases (`Phase 6b`)
- `[DONE]` Persistent mini-player with master volume and low CPU PipeWire output (`Phase 6b`)

---

## 8. Visual Customization & Theming
- `[DONE]` High-Contrast Academic Studio flagship theme (WCAG AA compliant) (`Design Overhaul`)
- `[DONE]` Dynamic Navigation Dock Positioning (Left, Right, Bottom) (`Design Overhaul`)
- `[DONE]` Reorderable & toggleable dashboard widgets with persistent layout (`Design Overhaul`)
- `[DONE]` Deep theme customization (UI density, corner radius, surface opacity) (`Design Overhaul`)
- `[DONE]` Navigation tab visibility checklist management (`Design Overhaul`)
- `[DONE]` Futuristic Multi-Preset Theme Suite (Academic Studio, Nordic Slate, Obsidian Violet, Cyberdeck HUD) (`Phase 7 base`)
- `[DONE]` In-app visual theme editor with real-time CSS variable live preview (`Phase 7 base`)
- `[DONE]` JSON full theme export and import (`Phase 7 base`)
- `[DONE]` Independent Dark / Light mode toggle (`Phase 7 base`)
- `[PLANNED]` Banner customization (upload, procedural CSS gradient generator, opt-in cached gallery) (`Phase 7`)

---

## 9. Global Utilities & Data Protection
- `[DONE]` Global Command Palette (`Ctrl+K` / `⌘+K`) for fast keyboard navigation (`Phase 8`)
- `[DONE]` Universal search indexing subjects, resources, notes, and actions (`Phase 8`)
- `[DONE]` Academic calendar with visual month grid and exam countdowns (`Phase 8`)
- `[DONE]` One-click manual backup & restore via standalone ZIP archive (`Phase 8`)
- `[DONE]` In-app backup history viewer with ext4 snapshot rollback capabilities (`Phase 8`)

---

## 10. Verification, Stress Testing & Integrity
- `[DONE]` Real 500-page academic corpus generation (`500_pages.pdf`, 629 KB) with diagrams & bookmarks (`Phase 9`)
- `[DONE]` Real 500-page PDF ingestion, bookmark extraction, and page range slicing (100-200 -> 101 pages) (`Phase 9`)
- `[DONE]` Real 10-second Release Audio + PDF Concurrency Benchmark (433k samples, 31 PDF cycles, 22.79 MB peak RSS, 0 underruns) (`Phase 9`)
- `[DONE]` Real-time socket audit (`lsof -i -P -n`) verifying 0 external network requests (100% offline local) (`Phase 9`)
- `[DONE]` Inode verification proving ext4 hardlink deduplication across snapshots in `/mnt/StudyBackups` (`Phase 9`)
- `[DONE]` High-contrast Academic Studio design system with WCAG AA compliance (`Phase 9`)
- `[DONE]` Multi-pane side-by-side workstation (1 to 4 independent panes) (`Phase 9`)
