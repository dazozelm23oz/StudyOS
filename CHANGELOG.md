# Changelog

All notable changes to the StudyOS project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - 2026-11-13 (Phase 0 & Phase 1b: Foundation, Scripts & Backup Automation)
- **Living Documentation**: Created `README.md`, `FEATURES.md`, `CHANGELOG.md`, `ARCHITECTURE.md`.
- **Git & Environment Configuration**: Configured comprehensive `.gitignore` ensuring zero leakage of build artifacts, runtime databases, tokens, or personal library files.
- **Repository Setup**: Initialized local git repository and linked with private GitHub remote `https://github.com/dazozelm23oz/StudyOS` via GitHub CLI (`gh`).
- **Backup Engine (`scripts/backup.sh`)**: Implemented automated ext4 hardlink snapshot backup script using `rsync -a --link-dest` with timestamped `Study DD_MM_YY HH-MM AM/PM` directory naming. Verified initial full snapshot creation in `/mnt/StudyBackups`.
- **Git Sync Engine (`scripts/git_sync.sh`)**: Implemented automated Conventional Commit staging and push workflow with offline failure handling.
