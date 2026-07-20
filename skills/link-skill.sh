#!/usr/bin/env bash
# Install the trembus-consumer skill as a USER-LEVEL Claude skill by symlinking
# this repo's canonical copy into ~/.claude/skills. Idempotent — safe to re-run
# (and required after moving the repo). Mirrors templates/skill/link-skill.sh:
# the repo stays the single source of truth; the symlink just exposes it.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$SCRIPT_DIR/trembus-consumer"
DEST_DIR="$HOME/.claude/skills"
DEST="$DEST_DIR/trembus-consumer"

mkdir -p "$DEST_DIR"
ln -sfn "$SRC" "$DEST"

echo "linked: $DEST -> $SRC"
