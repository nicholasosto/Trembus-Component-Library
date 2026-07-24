#!/usr/bin/env bash
# Install the trembus-consumer skill as a USER-LEVEL Claude and Codex skill by
# symlinking this repo's canonical copy into both agents' skill roots.
# Idempotent — safe to re-run (and required after moving the repo). Mirrors
# templates/skill/link-skill.sh: the repo stays the single source of truth;
# the symlinks just expose it.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$SCRIPT_DIR/trembus-consumer"

link_into() {
  local dest_dir="$1"
  local dest="$dest_dir/trembus-consumer"

  mkdir -p "$dest_dir"
  if [[ -e "$dest" && ! -L "$dest" ]]; then
    echo "refusing to replace non-symlink: $dest" >&2
    return 1
  fi
  ln -sfn "$SRC" "$dest"
  echo "linked: $dest -> $SRC"
}

link_into "${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
link_into "${CODEX_SKILLS_DIR:-$HOME/.codex/skills}"
