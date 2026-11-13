#!/usr/bin/env bash
set -euo pipefail

# StudyOS Automated Git Commit & Push Script (§9c)
# Usage: ./scripts/git_sync.sh "<commit message>"

MSG="${1:-chore: update studyos codebase and documentation}"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")"

echo "==> Staging changes..."
git add -A

echo "==> Committing with message: $MSG"
if git diff --staged --quiet; then
  echo "==> No changes to commit."
else
  git commit -m "$MSG"
fi

echo "==> Pushing to origin/$BRANCH..."
if git push origin "$BRANCH"; then
  echo "==> Pushed successfully to origin/$BRANCH"
else
  echo "WARN: Push failed (offline or auth issue). Commit saved locally; queued for next sync." >&2
  exit 1
fi
