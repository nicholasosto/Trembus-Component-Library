# templates/* — page templates

Moved here from the root `CLAUDE.md` (lines 167–193 of the 2026-08-11 revision) on 2026-09-09 so it loads only when working under this directory. `templates/REGISTRY.md` stays the canonical grammar reference; `AGENTS.md` (the Codex twin) still carries the old copy.

## Page templates (`templates/*`)

**Copy-and-own reference PAGES** (AppShell · WorkflowBoard) — canonical, versioned page
blueprints iterated HERE (Storybook `Templates/*`) and copied into consuming apps by the
user-level **`trembus-template` skill** (canonical at `templates/skill/`, installed by
`bash templates/skill/link-skill.sh` → `~/.claude/skills/trembus-template` and
`~/.codex/skills/trembus-template`). NOT library
components: no 3-jobs contract. One private workspace member `templates/pages`
(`@trembus-templates/pages`); each template at `src/<Name>/` with a `template.json` manifest
(semver · files[] · slots[] + `context` vars · dependencies · changelog).
**`templates/REGISTRY.md` is the human index AND the canonical grammar reference.**

- **Grammar**: line-1 stamp `/* @trembus-template <name> v<semver> … */` in every copyable
  file; app-owned regions fenced by `@tcl-slot:<name> START/END` comment markers. Chrome
  (outside slots) is template-owned and rewritten on update; slot bodies are preserved
  byte-for-byte. Props carry serializable data; **slots carry framework-specific JSX**
  (router links!) — AppShell ships plain `NavBar.Link href` defaults with the react-router
  `asChild` recipe in the slot comment, so the copied file never hard-depends on a router.
- **Gate placement**: off `validate` like demos (only script is `tc`; eslint-ignored) BUT the
  stories join the root Storybook glob → they run in `build:storybook`, in `test:stories`
  (the CI browser + axe gate), and ship to the Pages gallery — template stories must stay
  compile- AND axe-clean. Deliberately prettier-VISIBLE (copy-ready code stays formatted).
  Check: `pnpm templates:check` (dependency-closure lib build, then `tc`).
- **In-repo filenames are the FINAL names** (`AppShell.tsx`, NOT `AppShell.template.tsx`) so
  inter-file relative imports survive the copy unchanged; the stamp marks templatehood.
- Releasing a template = bump manifest `version` + `changelog` + the REGISTRY row (renaming a
  slot `context` var or removing a slot = MAJOR), then `pnpm templates:check`, commit.
