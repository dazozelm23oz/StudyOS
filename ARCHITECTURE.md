# StudyOS System Architecture

## 1. Overview & Core Tenets
StudyOS is architected as an offline-first desktop application combining the memory safety and native system integration of **Rust** (via Tauri v2) with a modern reactive **React 19** frontend.

```
+-----------------------------------------------------------------+
|                        StudyOS Desktop                          |
|                                                                 |
|  +-----------------------------------------------------------+  |
|  |                 React 19 + Vite Frontend                  |  |
|  |  * Cyberdeck UI Design System & CSS Variables Engine      |  |
|  |  * Local PDF.js Canvas + Non-destructive SVG Highlights   |  |
|  |  * Web Audio Procedural Rain & Multi-Track Mixer          |  |
|  |  * Pomodoro, Session, Stopwatch, Flight HUD Timers        |  |
|  +-----------------------------+-----------------------------+  |
|                                | Tauri IPC Bridge               |
|  +-----------------------------v-----------------------------+  |
|  |                    Tauri v2 Rust Core                     |  |
|  |  * Pure Rust lopdf: TOC parsing, range slicing, merging   |  |
|  |  * tauri-plugin-sql: SQLite connection pool               |  |
|  |  * rsync hardlink snapshot invocation engine              |  |
|  |  * Git versioning & Conventional Commit automation        |  |
|  +-----------------------------------------------------------+  |
+-----------------------------------------------------------------+
```

## 2. Component Architecture

### 2.1 Backend (Rust / Tauri v2)
- **`pdf_ops` module**: Employs `lopdf` for pure-Rust PDF manipulation. Bypasses external dependencies like Python, Poppler, or QPDF. Capable of parsing PDF catalog dictionaries, traversing outline trees (bookmarks), extracting specific page objects into new document streams, and concatenating multiple documents.
- **`backup_engine` module**: Wraps Linux `rsync` with `--link-dest=<latest_snapshot>` targeting `/mnt/StudyBackups`. Verifies mount availability and filesystem permissions before invocation; logs structured outcomes to the SQLite `backup_history` table.
- **`git_sync` module**: Coordinates local Git staging, conventional commit creation derived from `CHANGELOG.md`, and pushing to origin with an offline retry queue.

### 2.2 Frontend (React 19 + TypeScript + Tailwind CSS)
- **State Management**: Reactive state stores managing active sessions, navigation route, audio graph states, and PDF view parameters.
- **Theming Subsystem**: CSS variables dynamically injected on the root element. Switching themes updates color tokens across surfaces, borders, glowing accents, and typography instantaneously without re-rendering the DOM tree.
- **PDF Viewer Subsystem**: Employs Mozilla PDF.js rendering directly to an HTML5 canvas layer. Overlaid with an SVG coordinate layer that maps SQLite highlight coordinates `[x, y, width, height]` dynamically, keeping the original PDF bytes unaltered.
- **Procedural Audio Synthesizer**: Connects Web Audio API audio nodes:
  - White/pink noise generation buffer.
  - Biquad bandpass and lowpass filters for rainfall frequency shaping.
  - Low-frequency oscillators (LFO) for wind gust emulation.
  - Brownian noise bursts for randomized thunder rumbles.

## 3. Database Schema
Stored in `./data/studyos.db` via SQLite.
- `years`, `semesters`, `subjects`, `resources`: Strict relational hierarchy with `sort_order` for fluid drag-and-drop.
- `units`: Saved named page ranges linked to a resource.
- `highlights`: Page number, bounding box coordinates, text snippet, color, and note.
- `session_logs`: Academic study logs tracking duration, resource linkage, and active audio preset.
- `themes`: JSON color definitions for custom user themes.
- `audio_presets`: Multi-layer mixer volumes and timer phase mappings.
- `backup_history`: Historical log of all snapshot operations.
