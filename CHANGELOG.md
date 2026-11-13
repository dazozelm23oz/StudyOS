# Changelog

All notable changes to the StudyOS project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
