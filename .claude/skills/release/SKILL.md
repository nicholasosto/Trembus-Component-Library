---
name: release
description: Cut and publish a release of one or more @trembus/* packages (tokens · icons · ui · viz · game-viz) — version bump, enforced CHANGELOG entry, roster docs sync (READMEs + CLAUDE/AGENTS twins), gate, scoped commit, pnpm publish, npm verify, git tag + GitHub Release with the changelog as notes. Use when asked to "release", "publish", "bump and publish", or "cut a version" of a package. RELEASING.md is the canonical checklist; this skill executes it.
---

# release — execute RELEASING.md end to end

Never freestyle a release: this skill exists because a past release skipped the changelog
and three docs went stale for two versions. **The changelog entry and the docs sync are
not optional steps — a release without them does not proceed.**

## 1 · Preflight

- Identify the package(s). Current live version: `npm view @trembus/<pkg> version`.
- Last release commit: `git log --oneline --grep="release(<pkg>)"` (plus the multi-package
  `release:` commits). Summarize what changed since:
  `git log <last>..HEAD --oneline -- packages/<pkg>` + a skim of the diff.
- Propose the bump per RELEASING.md policy (patch = fixes; minor = new component/props;
  we are pre-1.0 — treat minor as the ceiling). Confirm with the user only if genuinely
  ambiguous.
- Working tree: unrelated WIP files are fine (they get excluded by the scoped commit) but
  NOTE them now so they are never staged.

## 2 · Bump + manifest hygiene

- `packages/<pkg>/package.json` → new `version`.
- If the component roster changed: refresh `description` and `keywords` (npm search
  surface) in the same edit.

## 3 · CHANGELOG (enforced)

Add a section at the top (below `## [Unreleased]`), Keep-a-Changelog format:

```md
## [@trembus/<pkg> X.Y.Z] — YYYY-MM

### Added / Changed / Fixed

- **`<Component>`** — what it is, in consumer terms; the a11y spine; notable gotchas fixed.
```

## 4 · Docs roster sync (when the public surface changed)

All four surfaces — they have gone stale before:

1. `packages/<pkg>/README.md` — the component roster paragraph + browse line.
2. Root `README.md` — the package table row.
3. `CLAUDE.md` **and** `AGENTS.md` — near-twin files; update BOTH (workspace package list
   - the relevant section: Tier-2 roster, game-viz roster, gotchas learned).
4. New canonical Visual Grammar schema? Mirror it (Tier-2 contract convention).

## 5 · Gate

```sh
pnpm --filter @trembus/<pkg>... run build   # dependency closure (fresh-clone safe)
pnpm --filter @trembus/<pkg> validate
```

Multiple packages or release-critical change → root `pnpm validate`.

## 6 · Scoped commit + push

Stage ONLY what the release touched — never unrelated WIP:

```sh
git add packages/<pkg> CHANGELOG.md README.md CLAUDE.md AGENTS.md
git commit -m "release(<pkg>): @trembus/<pkg> X.Y.Z — <headline>"
git push origin main    # Pages gallery redeploys from main
```

## 7 · Publish (pnpm, NEVER npm)

`pnpm publish` rewrites `workspace:^` deps to real ranges; `npm publish` would ship a
broken manifest. The configured token bypasses 2FA — no `--otp`.

```sh
pnpm --filter @trembus/<pkg> publish --dry-run        # inspect the tarball first
pnpm --filter @trembus/<pkg> publish --access public  # add --no-git-checks ONLY when
                                                      # unrelated WIP dirties the tree
```

Multi-package order (dependents after dependencies, so rewrites resolve):
**tokens → icons → ui → viz → game-viz**.

## 8 · Verify

```sh
npm view @trembus/<pkg> version dependencies --json
```

Version live + every `@trembus/*` dep a real `^x.y.z` range (no `workspace:` remnants).

## 9 · Tag + GitHub Release (per-version notes on GitHub)

```sh
git tag "@trembus/<pkg>@X.Y.Z" && git push origin "@trembus/<pkg>@X.Y.Z"
awk '/^## \[@trembus\/<pkg> X.Y.Z\]/{f=1;next} /^## /{f=0} f' CHANGELOG.md > /tmp/notes.md
gh release create "@trembus/<pkg>@X.Y.Z" --title "@trembus/<pkg> X.Y.Z" --notes-file /tmp/notes.md
```

(The tag convention comes from RELEASING.md; tags start at the first release that uses
this skill — no retro-tagging.)

## 10 · Aftercare + report

- Report: versions live on npm, commit hash, tag/release URL, docs synced, gates run.
- Claude sessions with project memory: update the publishing memory's live-versions line.
