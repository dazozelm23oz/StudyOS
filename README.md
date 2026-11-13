# StudyOS

> A fully customizable, offline-first, futuristic university study dashboard as a native Linux desktop application for Fedora KDE.

---

## ⚡ Core Philosophy & Non-Negotiable Hard Constraints
- **Zero Hardcoded Academic Content**: The application boots completely empty. No hardcoded semesters, subjects, codes, banners, or placeholder data. You own and define your academic universe in-app.
- **100% Offline Local Processing**: PDF reading, metadata parsing, bookmark extraction, page-slicing, and procedural audio synthesis run entirely on your local machine with zero external network calls.
- **Single Portable Data Store**: All database state, copied textbooks, custom themes, and audio files reside in `./data/` for simple folder migration and backup.
- **Native Fedora KDE Integration**: Built on Tauri v2 (Rust backend + WebKitGTK / PipeWire audio) for instant launch, low memory footprint, and native desktop windowing.
- **Automated ext4 Hardlink Snapshots**: High-speed, space-efficient incremental backups to `/mnt/StudyBackups` using `rsync --link-dest`.
- **Synchronized Git Versioning**: Automated Conventional Commit and push routines to a private GitHub repository keeping code and changelogs linked.

---

## 🛠️ Tech Stack & Architecture
- **Desktop Runtime**: [Tauri v2](https://v2.tauri.app/) (Rust core + WebKitGTK)
- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with dynamic CSS variable theming
- **Database**: [SQLite](https://sqlite.org/) via `@tauri-apps/plugin-sql` (stored at `./data/studyos.db`)
- **PDF Engine**: Pure Rust [`lopdf`](https://crates.io/crates/lopdf) for backend TOC and range manipulation; Mozilla [PDF.js](https://mozilla.github.io/pdf.js/) for in-app canvas rendering
- **Audio Synthesizer**: Web Audio API for real-time procedural rain synthesis and layered track mixing
- **Backup Engine**: `rsync` with `--link-dest` hardlink deduplication + native `.zip` compression

---

## 🚀 Getting Started on Fedora KDE

### Prerequisites
StudyOS requires the standard Rust toolchain, Node.js, and Fedora development libraries:

```bash
# Install core build dependencies on Fedora
sudo dnf install -y rust cargo nodejs npm git rsync zip unzip
sudo dnf install -y webkit2gtk4.1-devel openssl-devel gtk3-devel libsoup3-devel
```

### Installation & Development Run
```bash
# Clone the repository
git clone https://github.com/dazozelm23oz/StudyOS.git Study-Library
cd Study-Library

# Install dependencies
npm install

# Launch StudyOS in native desktop development mode
npm run tauri dev
```

### Automated Verification
```bash
# Run Rust unit and stress tests (including 500-page PDF slice stress test)
cargo test --manifest-path src-tauri/Cargo.toml

# Compile production frontend bundle
npm run build
```

---

## 🧭 How to Seed My Academic Data (Complete Step-by-Step Guide)

Because StudyOS adheres to the strict zero-hardcoded constraint, it boots completely clean on first run. Follow this step-by-step workflow to seed and customize your academic environment:

### Step 1: Initialize Your Profile
1. Navigate to **Settings & Vault** (from the sidebar dock or via `Ctrl+K`).
2. Fill in your **Full Name**, **Major / Degree**, **University**, **Current Academic Year**, and **Current Semester**.
3. Click **SAVE PROFILE**.

### Step 2: Build Your Academic Tree
1. Open the **Academic Tree** tab (`HierarchyView`).
2. Click **+ ADD ACADEMIC YEAR** (e.g. `Year 1 (2025/2026)`), and pick a color accent.
3. Click **+ ADD SEMESTER** within the year (e.g. `Fall 2025`).
4. Click **+ ADD SUBJECT** within the semester (e.g. `CS201 - Data Structures & Algorithms`, 4 Credits, Professor Dr. Smith).
5. Drag and drop to reorder years, semesters, or subjects to mirror your curriculum sequence.

### Step 3: Ingest Textbooks & Course Materials
1. Under each Subject in the Academic Tree, click **IMPORT PDF**.
2. Select your textbooks, syllabi, lecture slides, or subject guides.
3. StudyOS calculates the SHA-256 hash, checks for duplicates, extracts the Table of Contents (TOC) bookmarks in pure Rust, and stores the copy safely inside `./data/library/<subject_id>/<hash>.pdf`.

### Step 4: Extract Units & Study Chapters
1. Open the **Unit Extractor** tab.
2. Select your textbook. Click **AUTO-IMPORT FROM PDF TOC** or specify custom page ranges (e.g. `1-45, 60-95`).
3. Click **EXTRACT & BIND UNITS**. StudyOS uses `lopdf` in the Rust core to slice the exact pages into a new standalone document linked directly to your subject.

### Step 5: Convert Units into Interactive Checklists
1. Navigate to **Study Timers** $\rightarrow$ **STUDY CHECKLIST**.
2. Select your Subject and click **IMPORT FROM PDF TOC**.
3. All chapters and extracted units instantly turn into interactive checkboxes with page badges to track your mastery.

### Step 6: Schedule Exams & Milestones
1. Open **Calendar & Exams**.
2. Register your midterm dates, assignment deadlines, or finals.
3. Track countdown tickers with automatic urgency warnings (`Due Today`, `Tomorrow`, or `X days left`).

### Step 7: Focus Sessions with Procedural Rain
1. In **Study Timers**, choose between **Pomodoro**, **Session Timer**, **Stopwatch**, or **Flight-Style Cockpit HUD**.
2. Open **Rain & Audio** to mix procedural pink/white noise rain, mountain wind swells, and thunder bursts.
3. Attach the preset to your timer work phase so the soundscape plays automatically during study and pauses on break.

---

## ⌨️ Global Shortcuts & Intelligence
- <kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>Cmd</kbd> + <kbd>K</kbd>: Open Global Command Palette to search subjects, PDFs, notes, or trigger actions anywhere.
- **Dynamic Dock**: Toggle navigation dock between **Left** (default), **Bottom** (horizontal dock), and **Right** in Settings.
- **Theme Studio**: Hot-switch between 8 curated presets (*Academic Studio*, *Solarized Light*, *Midnight OLED*, *Forest Focus*, *Warm Academia*, etc.) or create and export custom themes.

---

## 📁 Data Storage & Portability
- **Workspace Data Folder**: `./data/`
  - `studyos.db`: Relational SQLite database with automated schema migrations.
  - `library/`: Managed PDF files organized by subject hash.
  - `audio/`: Imported ambient tracks and user soundscapes.
- **Snapshot Backups**: `/mnt/StudyBackups/`
  - Automated ext4 hardlink snapshots: `Study DD_MM_YY HH-MM AM/PM/`
- **Portable Zip Archives**:
  - Export full self-contained `.zip` archives from **Settings** for easy cloudless migration to other Linux machines.

---

## 📚 Living Documentation
- [FEATURES.md](file:///home/ziadm/Study-Library/FEATURES.md): Living feature inventory and verification status.
- [CHANGELOG.md](file:///home/ziadm/Study-Library/CHANGELOG.md): Granular record of every architectural change and fix.
- [ARCHITECTURE.md](file:///home/ziadm/Study-Library/ARCHITECTURE.md): System design, IPC contracts, and schema documentation.
