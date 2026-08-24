# Foundry Room · Maid — demo site

A small consuming app that turns the *Foundry Room* concept into working UI, built
entirely from the **published** `@trembus/ui` surface. It exists to dog-food the
real components — and to exercise the new **`Stepper`**.

## What it shows

- **Rooms** (`/`) — a room explorer: the library **`FolderTree`** lists `_inbox`,
  a selectable file **Inspector** shows the Maid's verdict (misplaced / no law yet /
  in place), and the **Maid dock** (Tooltip-annotated `Button`s) runs the passes.
- **Deep Clean flow** — an in-app `Dialog` sequence: confirm → **live `Stepper`**
  (the six steps advance on a timer) → proposed plan → Implement.
- **Laws** (`/laws`) — the Law Library as a real `Table` with `Badge` status chips.

## Components consumed

`FolderTree · Dialog · Table · Badge · Tooltip · Callout · Button · NavBar ·
SkipLink · Box · Stack · Inline · Text · Stepper` — all from `@trembus/ui`, via
its published entrypoints (`@trembus/ui` + `@trembus/ui/styles.css`).

`Stepper` is the one component this concept needed that the library didn't already
have; it now ships in `@trembus/ui`. Everything else is composition.

## Run it

The library must be **built** first (the demo resolves `dist/`):

```bash
pnpm -r build           # or: pnpm demos:check   (from the repo root)
pnpm --filter @trembus-demo/foundry-room dev    # → http://localhost:5175
```

Off the `validate` gate (scripts named `dev` / `build:site` / `preview` / `tc`);
theme via `data-theme` on `<html>`, toggled in the header.
