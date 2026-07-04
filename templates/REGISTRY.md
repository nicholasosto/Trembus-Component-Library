# Trembus Page Templates — Registry

Canonical, versioned **reference pages** (not library components). Each template is
**copy-and-own**: its source files are copied into a consuming app, which then owns
them — no runtime dependency on this tier. Iteration happens HERE (root Storybook,
`Templates/*` stories); consuming apps are brought forward to a newer version by the
**`trembus-template`** skill, which re-applies template-owned chrome while preserving
app-owned slot content.

## The model

- **Props vs slots**: serializable data flows through **props**; framework-specific
  JSX (router links, outlets, app controls) lives in **slots**. That is why AppShell
  ships plain `NavBar.Link href` anchors in its nav slot with the router `asChild`
  recipe in the slot comment — the copied file never hard-depends on a router.
- **Chrome is template-owned**: everything outside slot markers may be rewritten by a
  template update. **Slot bodies are app-owned**: preserved byte-for-byte on update.
- Each template's `template.json` is the machine-readable truth (files, slots +
  their `context` variables, dependencies, semver + changelog). There is no
  aggregated registry.json — tools glob `templates/pages/src/*/template.json`.
  (Revisit only if remote single-fetch discovery is ever needed.)
- A slot may reference chrome variables ONLY if they are declared in that slot's
  `context` array — renaming a context variable is a **major** version bump.

## Grammar (canonical — the skill copies these regexes)

- **Stamp** (line 1 of every copyable file, block comment in .tsx/.ts/.css):
  `/* @trembus-template <name> v<semver> · <file> (<role>) · chrome is template-owned — edit only inside @tcl-slot regions; re-apply via the trembus-template skill */`
  Detection regex (searched anywhere in a file): `@trembus-template ([a-z0-9-]+) v(\d+\.\d+\.\d+)`
- **Slots**: `@tcl-slot:<name> START — guidance` … `@tcl-slot:<name> END`, wrapped in
  the file type's comment syntax (`{/* … */}` in JSX children, `// …` in TS, `/* … */`
  in CSS). Detection regex: `@tcl-slot:([a-z][a-z0-9-]*) (START|END)`
  Rules: names unique per file; no nesting; marker lines are template-owned (the
  name is stable); bodies are app-owned. On update, a slot removed by the new
  version has its body moved to an `@tcl-orphaned-slot:<name>` block — never dropped.

## Using templates from another repo

Install the skill once (symlink; survives repo moves by re-running):

```sh
bash ~/Master-Managed/Repositories/Trembus-Component-Library/templates/skill/link-skill.sh
```

Then in any Claude session: “apply the app-shell trembus template” or “update this
page to the workflow-board template”.

## Templates

| Template                         | Version | Path                                 | Copy files                                       | Slots                                                                                                      | Purpose                                                                                                             |
| -------------------------------- | ------- | ------------------------------------ | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `app-shell` (AppShell)           | 1.0.0   | `templates/pages/src/AppShell/`      | `AppShell.tsx` · `useTheme.ts` · `app-shell.css` | brand · nav-links · header-actions · main-content · footer-content · theme-storage-key · app-custom-styles | Site navigation shell: SkipLink + sticky header (brand/nav/actions + ThemeToggle) + main + footer; router-agnostic. |
| `workflow-board` (WorkflowBoard) | 1.0.0   | `templates/pages/src/WorkflowBoard/` | `WorkflowBoard.tsx`                              | toolbar-actions · inspector                                                                                | Workflow working surface: DataStatusBar + toolbar + Switch-toggled RunHistory + time-travelling Swimlane.           |

## Iterating a template (in this repo)

1. Edit the template files; watch it live in Storybook (`Templates/*`, light + dark).
2. Bump `template.json` `version` + append a `changelog` entry (note `migration`
   guidance and any slot/context changes; renamed context or removed slots = major).
3. Update the table above.
4. `pnpm templates:check` (libs build + templates typecheck). Stories also run in
   the CI browser/axe gate (`pnpm test:stories`) and ship to the Pages gallery.
