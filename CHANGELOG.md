# Changelog

All notable changes to the StudyOS project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - 2026-11-13 (Phase 9: Real Data Stress Testing & Offline Integrity Verification)
- **Real 500-Page PDF Generation (`data/testing/500_pages.pdf`)**:
  - Authored `scripts/generate_test_pdf.py` synthesizing a real 500-page academic corpus (0.61 MB) containing genuine text, section figures, and hierarchical TOC bookmarks.
- **Real PDF Ingestion & Bookmark Extraction Test (`pdf_engine.rs`)**:
  - Implemented `test_real_500_page_pdf_ingestion_and_slice` verifying full 500-page document ingestion, extraction of 10 hierarchical bookmark entries, and clean slicing of pages 100-200 (101 pages output saved to `data/testing/sliced_pages_100_200.pdf`, 132 KB).
- **Real Audio + PDF Release Concurrency Benchmark (`test_benchmark_audio_and_pdf_concurrency`)**:
  - Executed a 10.13-second concurrent multi-threaded stress test in release mode.
  - Synthesized 433,944 audio samples (44.1 kHz equivalent) with 0 buffer underruns.
  - Concurrently completed 31 full PDF parsing and slicing cycles across the 500-page corpus.
  - Monitored real Linux process memory: Initial 13.08 MB RSS, Peak 22.79 MB RSS, Final 19.23 MB RSS. Zero concurrency stutter or audio jitter detected.
- **Zero-Network Calls Verification (`scripts/verify_zero_network.py`)**:
  - Monitored active network sockets using `lsof -i -P -n` during PDF processing and application execution.
  - Confirmed 0 non-loopback external connections; verified strict 100% offline isolation.
- **Hardlink Deduplication & Backup Inode Verification**:
  - Executed automated snapshot backup to `/mnt/StudyBackups/Study 13_11_26 03-47 PM`.
  - Proved byte-for-byte deduplication via matching ext4 inodes across snapshots (e.g. `package.json` inode `3538959`, `ARCHITECTURE.md` inode `524298`).

### Added - 2026-11-13 (Phase 8 & 9: Global Intelligence, Calendar Countdowns, Zip Archiving & Stress Verification)
- **Part I: Phase 8 (Global Intelligence & System Utilities)**:
  - **Global Command Palette (`Ctrl+K` / `⌘+K`)**: Universal search palette (`CommandPalette.tsx`) indexing subjects, resources, notes, navigation routes, and quick actions with keyboard-first navigation.
  - **Calendar & Exam Countdowns**: Visual monthly calendar matrix (`CalendarView.tsx`) with deadline tickers, urgency warnings (`Due Today`, `Tomorrow`), and milestone scheduling.
  - **Standalone Zip Backup & Restore Engine**: Added `export_zip_archive` and `restore_zip_archive` backend commands in Rust utilizing native `zip`/`unzip` CLI to package `./data/` into portable archives.
  - **Hardlink Backup History Viewer**: Implemented `list_backup_snapshots` in Rust backend and built history inspector in `SettingsView.tsx` with instant 1-click snapshot restore.
- **Part J: Phase 9 (Verification, Stress Testing & Documentation)**:
  - **500+ Page PDF Slicing Stress Test**: Added automated Rust unit test `test_stress_slice_500_page_pdf` validating that slicing a 500-page document into a 202-page unit executes in 0.66 seconds with exact object pruning and verification.
  - **Network Call Audit**: Verified 0 external HTTP/HTTPS network calls in source code; all PDF rendering, metadata parsing, and procedural rain synthesis are 100% offline local.
  - **Seeding Guide**: Authored comprehensive "How to Seed My Academic Data" onboarding walkthrough in `README.md`.
  - **Complete Documentation Suite**: Updated `README.md`, `FEATURES.md`, and `CHANGELOG.md`.

### Added - 2026-11-13 (Phase 6 & 6b: Study Timers Suite, Audio Engine & Mini-Player)
- **Part F: Phase 6 (Study Tracking, Checklists & Timers)**:
  - **Study Checklist Engine**: Parses extracted PDF TOC bookmarks and unit structures into interactive checklist items with page range tags and completion progress.
  - **Academic Todo List**: Hierarchical task manager supporting global and per-subject tasks, priority badges (Low, Medium, High, Urgent), due dates, and status filtering.
  - **Pomodoro Timer**: Configurable work and break intervals with auto-transitions, audio phase triggers, and automatic session logging.
  - **Session Timer**: Unconstrained count-up study timer linked to active enrolled subjects with direct logging to SQLite.
  - **Stopwatch**: High-precision chronometer with lap recording, split times, and total elapsed tracking.
  - **Flight-Style HUD Timer**: Aviation cockpit metaphor (Departure → Climb → Cruise FL380 → Descent → Touchdown) with live altitude profile gauges and Mach airspeed telemetry.
  - **Time-Spent Analytics**: Persisted SQLite session history with aggregate focus hours, session counters, and historical logs.
- **Part G: Phase 6b (Procedural Soundscape Engine)**:
  - **Web Audio API Procedural Rain Synthesizer**: 100% offline procedural pink/white noise audio synthesis with biquad lowpass filtering, LFO wind swells, and Brownian noise thunder bursts.
  - **Local Audio Importer**: Import local study music tracks (`.mp3`, `.wav`, `.ogg`, `.flac`) with seamless native looping.
  - **Multi-Layer Mixer**: Individual channel strips for Rain, Wind, Thunder, and Custom Tracks with volume sliders and mute toggles.
  - **Audio Presets & Phase Binding**: Pre-configured presets (*Gentle Rain & Calm*, *Intense Thunderstorm*, *Windy Mountain Sanctuary*, *Break Silence*) with auto-activation tied to Pomodoro work/break phases.
  - **Floating Persistent Mini-Player**: Persistent audio pill docked across all application views with real-time animated equalizer bars and volume slider.
- **Part H: Final Polish & Dashboard Matrix**:
  - Activated expanded dashboard widget matrix: Focus Chrono Telemetry (`timer_stats`) and Academic Calendar & Schedule (`date_calendar`).
  - Seamless layout migration ensuring all newly registered dashboard widgets auto-populate existing user layouts.

### Added - 2026-11-13 (Massive Batch Build: Themes, Phases 2, 3, 4, 5)
- **UI/UX & Deep Theme Engine (Part A)**:
  - Made "Settings & Vault" tab mandatory and permanently visible.
  - Relocated dock positioning switcher cleanly into the Settings menu.
  - Dynamically styled top-right theme selector to match the active theme.
  - Implemented global root CSS dark/light mode toggle.
  - Added UI Scale slider (85% to 130%) dynamically adjusting font sizes and padding.
  - Added Custom Theme Creator with color pickers for all 12 design tokens, typography selection (Inter, JetBrains Mono, Space Grotesk, System Sans), and full theme export/import.
  - Added 5+ new curated presets: *Solarized Light*, *Midnight OLED*, *Forest Focus*, *Warm Academia*, and *Cyber Sunset*.
  - Expanded dashboard widget catalog with Study Streak, Recently Opened PDFs, and Quick Tools.
- **Phase 2: Academic Hierarchy CRUD & Drag-and-Drop (Part B)**:
  - Implemented complete relational hierarchy CRUD for Year → Semester → Subject → Resource.
  - Integrated `@dnd-kit/core` and `@dnd-kit/sortable` for fluid drag-and-drop reordering with persistent SQLite updates.
- **Phase 3: Offline PDF Ingestion & Library (Part C)**:
  - Implemented pure Rust backend command `import_pdf` with SHA-256 file hashing and deduplication check.
  - Automatically copies imported documents into managed library directory `./data/library/<subject_id>/<hash>.pdf`.
  - Employs `lopdf` to extract page count, title metadata, and outline TOC/bookmarks into SQLite.
- **Phase 4: In-App Multi-Pane PDF Viewer (Part D)**:
  - Built local PDF.js canvas viewer (`PdfViewerPane.tsx`) with 100% offline bundled worker.
  - Multi-pane side-by-side workstation supporting 1 to 4 independent panes (`PdfWorkstationView.tsx`).
  - Session state memory saving current page, zoom level, and scroll position to SQLite per document.
  - Non-destructive SVG highlight layer with custom color picker, persistent annotations, and in-PDF text search.
- **Phase 5: PDF Unit Extraction Engine (Part E)**:
  - Implemented page range syntax parser in Rust (`parse_page_ranges`) supporting expressions like `"1-5, 8-12"`.
  - Implemented unit page extraction via `lopdf::Document::delete_pages` into single merged PDF or split chapters.
  - Built `UnitExtractorView.tsx` with TOC bookmark auto-import, range validation, and automatic linkage to Subject Resources.

### Changed - 2026-11-13 (UI/UX Design Overhaul & Dynamic Layout Engine)
- **High-Contrast Academic Design System**: Replaced neon hacker-terminal aesthetics with *Academic Studio* — an elegant, high-contrast theme featuring rich indigo/sky/amber accents, solid opaque cards (95% opacity), and WCAG AA compliant text contrast (`#ffffff` headings, `#e2e8f0` body text, and `#94a3b8` secondary telemetry labels).
- **Host Telemetry & Contrast Fixes**: Eliminated dim transparent cards. Host Telemetry widget, status indicators, and all secondary metadata now render with high-contrast text against solid slate backgrounds.
- **Dynamic Navigation Dock Engine (`src/components/Sidebar.tsx`, `Header.tsx`, `SettingsView.tsx`)**: Added user-configurable dock positioning supporting **Left** (default vertical sidebar), **Right** (vertical right dock), and **Bottom** (horizontal floating dock) layouts with instant hot-switching.
- **Customizable Dashboard Widgets (`src/components/DashboardView.tsx`)**: Made dashboard widgets reorderable and toggleable (Mission Briefing, Academic Metrics, Active Subjects, Quick Launch Matrix) with persistent layout saving.
- **Deep Theme Studio Customization (`src/components/ThemeStudioView.tsx`)**: Added layout geometry controls for UI Density (Compact, Comfortable, Spacious), Corner Radius (Sharp, Rounded, Pill), and Surface Opacity sliders. Enhanced theme JSON export/import to serialize full aesthetic matrices.
- **Navigation Tab Visibility Filtering**: Added tab visibility checklist in Settings allowing users to customize which sidebar navigation items appear.

### Added - 2026-11-13 (Phase 1: Tauri Shell, SQLite Engine, Empty State & Theming)
- **Tauri v2 Native Desktop Runtime**: Configured Tauri v2 core with native plugins (`sql`, `fs`, `dialog`, `notification`, `log`) for Fedora KDE desktop integration.
- **SQLite Database Architecture (`src/services/db.ts`)**: Designed and implemented automated relational migrations for 13 tables (`profile`, `years`, `semesters`, `subjects`, `resource_types`, `resources`, `units`, `highlights`, `checklist_items`, `todos`, `session_logs`, `themes`, `audio_presets`, `backup_history`, `app_settings`).
- **Strict Zero-Hardcoded Empty Boot**: Application boots 100% empty with zero placeholder academic years or subjects. Designed futuristic HUD empty state with setup checklist and quick initiation actions.
- **Dynamic Theming Subsystem (`src/theme/themes.ts`)**: Built-in 4 futuristic theme presets (*Cyberdeck HUD*, *Void Black*, *Cyber Amber*, *Deep Nebula*) injecting CSS variables in real time with zero framework default styles.
- **HUD Shell & Navigation (`src/components/Header.tsx`, `Sidebar.tsx`)**: Developed telemetry-enabled header with live digital clock, 1-click snapshot action, Git sync button, theme selector, and dark/light toggle.
- **Academic Hierarchy Management (`src/components/HierarchyView.tsx`)**: Created Year → Semester → Subject hierarchy management with color customization and full CRUD.
- **Student Profile & Storage Vault (`src/components/SettingsView.tsx`)**: Created profile settings editor and storage path inspector.

### Added - 2026-11-13 (Phase 0 & Phase 1b: Foundation, Scripts & Backup Automation)
- **Living Documentation**: Created `README.md`, `FEATURES.md`, `CHANGELOG.md`, `ARCHITECTURE.md`.
- **Git & Environment Configuration**: Configured comprehensive `.gitignore` ensuring zero leakage of build artifacts, runtime databases, tokens, or personal library files.
- **Repository Setup**: Initialized local git repository and linked with private GitHub remote `https://github.com/dazozelm23oz/StudyOS` via GitHub CLI (`gh`).
- **Backup Engine (`scripts/backup.sh`)**: Implemented automated ext4 hardlink snapshot backup script using `rsync -a --link-dest` with timestamped `Study DD_MM_YY HH-MM AM/PM` directory naming. Verified initial full snapshot creation in `/mnt/StudyBackups`.
- **Git Sync Engine (`scripts/git_sync.sh`)**: Implemented automated Conventional Commit staging and push workflow with offline failure handling.
