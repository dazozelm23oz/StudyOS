# Changelog

All notable changes to the StudyOS project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
