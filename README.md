# StudyOS

> A fully customizable, offline-first, futuristic university study dashboard as a native Linux desktop application for Fedora KDE.

---

## ⚡ Core Philosophy & Non-Negotiable Constraints
- **Zero Hardcoded Academic Content**: The application boots completely empty. No hardcoded semesters, subjects, codes, or placeholder data. You own and define your academic universe in-app.
- **100% Offline Local Processing**: PDF reading, metadata parsing, bookmark extraction, page-slicing, and audio generation run entirely on your local machine with zero external network calls.
- **Single Portable Data Store**: All database state, copied textbooks, custom themes, and audio files reside in `./data/` for simple folder migration and backup.
- **Native Fedora KDE Integration**: Built on Tauri v2 (Rust backend + WebKitGTK / PipeWire audio) for instant launch, low memory footprint, and native desktop windowing.
- **Automated ext4 Hardlink Snapshots**: High-speed, space-efficient incremental backups to `/mnt/StudyBackups` using `rsync --link-dest`.
- **Synchronized Git Versioning**: Automated Conventional Commit and push routines to a private GitHub repository keeping code and changelogs linked.

---

## 🛠️ Tech Stack
- **Desktop Runtime**: [Tauri v2](https://v2.tauri.app/) (Rust core + WebKitGTK)
- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with dynamic CSS variable theming
- **Database**: [SQLite](https://sqlite.org/) via `@tauri-apps/plugin-sql` (stored at `./data/studyos.db`)
- **PDF Engine**: Pure Rust [`lopdf`](https://crates.io/crates/lopdf) for backend TOC and range manipulation; Mozilla [PDF.js](https://mozilla.github.io/pdf.js/) for in-app canvas rendering
- **Audio Synthesizer**: Web Audio API for real-time procedural rain synthesis and layered track mixing
- **Backup Engine**: `rsync` with `--link-dest` hardlink deduplication

---

## 🚀 Getting Started on Fedora KDE

### Prerequisites
StudyOS requires the standard Rust toolchain, Node.js, and Fedora development libraries:

```bash
# Install core build dependencies on Fedora
sudo dnf install -y rust cargo nodejs npm git rsync
sudo dnf install -y webkit2gtk4.1-devel openssl-devel gtk3-devel libsoup3-devel
```

### Installation & Development Run
```bash
# Clone the repository
git clone <repo-url> Study-Library
cd Study-Library

# Install dependencies
npm install

# Launch StudyOS in native desktop development mode
npx tauri dev
```

### Production Build
```bash
# Compile native optimized Linux binary (.rpm and AppImage)
npx tauri build
```

---

## 📁 Data Locations & Storage
- **Workspace Data Folder**: `./data/`
  - `studyos.db`: Relational SQLite database.
  - `library/`: Managed PDF files organized by subject hash.
  - `audio/`: Imported ambient tracks and user soundscapes.
  - `themes/`: User-exported JSON themes.
- **Snapshot Backups**: `/mnt/StudyBackups/`
  - Automated hardlinked snapshots: `Study DD_MM_YY HH-MM AM/PM/`

---

## 📚 Living Documentation
- [FEATURES.md](file:///home/ziadm/Study-Library/FEATURES.md): Living feature inventory and roadmap status.
- [CHANGELOG.md](file:///home/ziadm/Study-Library/CHANGELOG.md): Granular record of every architectural change and fix.
- [ARCHITECTURE.md](file:///home/ziadm/Study-Library/ARCHITECTURE.md): System design, IPC contracts, and schema documentation.

---

## 🧪 How to Seed Your Academic Data
Because StudyOS adheres to the strict zero-hardcoded rule, it boots empty on first launch:
1. Open **Settings & Profile** from the sidebar and configure your Name, Major, University, and Current Semester.
2. In the **Academic Hierarchy** view, click **+ Add Academic Year** (e.g. `Year 1 (2025/2026)`).
3. Inside your Year, click **+ Add Semester** (e.g. `Fall Semester`).
4. Click **+ Add Subject** (e.g. `CS101 - Algorithms`, assign credits and custom color/banner).
5. Drag and drop your course PDF files (Subject Guide, Textbooks, Lecture Notes) into the Subject Resources area.
