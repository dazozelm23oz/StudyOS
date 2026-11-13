#!/usr/bin/env bash
set -euo pipefail

# StudyOS Automated Hardlink Snapshot Backup Script
# Usage: ./scripts/backup.sh [DESTINATION_DIR]

DEST_BASE="${1:-/mnt/StudyBackups}"
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 1. Mount & Writeability Check
if [ ! -d "$DEST_BASE" ]; then
  echo "WARN: Backup destination '$DEST_BASE' is not mounted or directory does not exist." >&2
  exit 2
fi

if [ ! -w "$DEST_BASE" ]; then
  echo "WARN: Backup destination '$DEST_BASE' is not writable by $(whoami)." >&2
  exit 2
fi

# 2. Determine Snapshot Folder Name (Study DD_MM_YY HH-MM AM/PM)
# e.g. Study 13_11_26 02-58 AM
TIMESTAMP="$(date '+%d_%m_%y %I-%M %p')"
TARGET_DIR="${DEST_BASE}/Study ${TIMESTAMP}"

# 3. Find Most Recent Previous Snapshot for Hardlink Deduplication
PREV_BACKUP=""
if compgen -G "${DEST_BASE}/Study *" > /dev/null; then
  # Sort directories by modification time (most recent first)
  PREV_BACKUP="$(ls -td "${DEST_BASE}"/Study\ * 2>/dev/null | grep -v "^${TARGET_DIR}$" | head -n 1 || true)"
fi

echo "==> Source: $SOURCE_DIR"
echo "==> Target: $TARGET_DIR"

EXCLUDES=(
  --exclude="node_modules"
  --exclude="node_modules/**"
  --exclude="target"
  --exclude="target/**"
  --exclude="src-tauri/target"
  --exclude="src-tauri/target/**"
  --exclude="dist"
  --exclude="dist/**"
  --exclude="build"
  --exclude="build/**"
  --exclude="*.log"
  --exclude=".pnp*"
)

mkdir -p "$TARGET_DIR"

if [ -n "$PREV_BACKUP" ] && [ -d "$PREV_BACKUP" ]; then
  echo "==> Linking unchanged files against previous snapshot: $PREV_BACKUP"
  rsync -a "${EXCLUDES[@]}" --link-dest="$PREV_BACKUP" "$SOURCE_DIR/" "$TARGET_DIR/"
else
  echo "==> Creating initial full baseline snapshot (no prior snapshot found)"
  rsync -a "${EXCLUDES[@]}" "$SOURCE_DIR/" "$TARGET_DIR/"
fi

# Verification
COPIED_COUNT="$(find "$TARGET_DIR" -type f | wc -l)"
echo "==> Snapshot completed successfully: $TARGET_DIR ($COPIED_COUNT files)"
