# Changelog

All notable changes to the StudyOS project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - 2026-11-13 (Phase 0: Project Foundation & Living Docs)
- **Living Documentation**: Created `README.md`, `FEATURES.md`, `CHANGELOG.md`, `ARCHITECTURE.md`.
- **Git & Environment Configuration**: Configured comprehensive `.gitignore` ensuring zero leakage of build artifacts, runtime databases, tokens, or personal library files.
- **Repository Setup**: Initialized local git repository and linked with private GitHub remote via GitHub CLI (`gh`).
- **Backup Target Verification**: Verified ext4 hardlink destination `/mnt/StudyBackups` ownership and write access for incremental rsync snapshots.
