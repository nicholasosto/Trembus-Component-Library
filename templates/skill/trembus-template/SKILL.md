---
name: trembus-template
description: Apply or update Trembus copy-and-own page templates (AppShell, WorkflowBoard, …) in ANY repo. Activates on "apply/add the <name> trembus template", "update/re-apply this page to the <name> template (v<N>)", or any mention of trembus templates. Copies canonical template files into the app, or re-applies a newer template version around the app's @tcl-slot content without touching it.
---

# trembus-template — apply/update Trembus page templates

Templates are **copy-and-own** reference pages from the Trembus Component Library.
Chrome (everything outside slot markers) is template-owned; **slot bodies are
app-owned and must never be modified by this skill**.

## 1 · Locate the library

- Primary: `~/Master-Managed/Repositories/Trembus-Component-Library/templates/`
- Fallback (no local checkout): `https://raw.githubusercontent.com/nicholasosto/Trembus-Component-Library/main/templates/…`
- Neither reachable → ask the user for their checkout path. Never guess.

Read `templates/REGISTRY.md` for the roster, then the target template's manifest at
`templates/pages/src/<Title>/template.json` (machine truth: files, slots + context,
dependencies, version, changelog) and its source files listed in `files[]`.

## 2 · Grammar (must match REGISTRY.md exactly)

- Stamp regex (anywhere in a file): `@trembus-template ([a-z0-9-]+) v(\d+\.\d+\.\d+)`
- Slot regex: `@tcl-slot:([a-z][a-z0-9-]*) (START|END)`
- Slot rules: unique names per file, no nesting, marker lines template-owned
  (names stable), bodies app-owned byte-for-byte.

## 3 · Mode detection

Grep the target (the named file if given, else the repo) for
`@trembus-template <name>`: a hit → **UPDATE** that file set; none → **APPLY** fresh.

## 4 · APPLY (fresh copy)

1. Preflight: check the target app's package.json for the manifest `dependencies`
   (e.g. `@trembus/ui >= x`) and for a `@trembus/ui/styles.css` import at the app
   entry. Report gaps with exact install/import commands — do NOT silently install.
2. Choose a destination from each file's `destinationHint` + the app's conventions;
   confirm with the user before writing.
3. Copy each `files[]` entry (honoring `copyAs` and `skipIf` — ask when a skipIf
   condition seems to hold). Keep default slot content as shipped; keep stamps.
   If the user splits companion files into different dirs, fix the relative imports
   between them.
4. Report: files created, slots the app should customize first (nav-links, brand,
   …), and the manifest `setup[]` steps.

## 5 · UPDATE (re-apply a newer version)

1. Read the stamp version from every target file; read the manifest's current
   version and the `changelog` entries BETWEEN them. Surface the change list —
   and any `migration` notes (major bumps) — to the user BEFORE editing.
2. Validate markers in each target file: every slot name unique, every START has
   an END, stamp present. Any violation → STOP; go to §6 guided merge.
3. Extract each slot body from the target, byte-for-byte.
4. Chrome-drift check (best effort, local checkout only): recover the OLD template
   source via `git log -S "<name> v<oldversion>" -- templates/pages/src/<Title>/`
   then `git show <sha>:<path>`; diff the target's chrome against the old
   template's chrome. List app-made chrome edits found and ask which to carry
   forward (they are otherwise lost by design).
5. Rebuild each file: NEW template chrome + the preserved slot bodies.
   - Slot in new version but not in target → insert with the new default content
     and FLAG it in the report.
   - Slot in target but removed from the new version → move the app's body into a
     clearly marked `@tcl-orphaned-slot:<name> (removed in v<new>)` comment block
     near its old position and FLAG it. Never silently drop content.
6. Restamp every touched file with the new version. Report: chrome changes
   (from the changelog), slots preserved, orphans/insertions, and manual
   follow-ups (e.g. slot bodies referencing renamed context variables — the
   manifest `slots[].context` names are the compatibility contract).

## 6 · Safety rules

- Never modify slot interiors. Never touch files not listed in the manifest.
- Mangled/missing markers or stamp on an UPDATE → STOP and run a guided manual
  merge: show template source beside the target, propose region by region, get
  user confirmation for each.
- Never downgrade (target stamp > manifest version) without explicit confirmation.
- Always end with a diff summary of what changed, what was preserved, what needs
  the user's attention.

## 7 · Install / verify this skill

```sh
bash ~/Master-Managed/Repositories/Trembus-Component-Library/templates/skill/link-skill.sh
ls -la ~/.claude/skills/trembus-template ~/.codex/skills/trembus-template
```

Both paths are symlinks to this repo-owned canonical skill; edit the source here,
never either user-level exposure.
