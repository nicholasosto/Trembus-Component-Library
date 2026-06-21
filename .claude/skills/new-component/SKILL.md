---
name: new-component
description: Scaffold a new @trembus/ui component in the canonical 5-file shape (tsx/css/contract/stories/test), wired into the barrel and passing `pnpm run validate` out of the box. Use when adding a component to this library.
---

# new-component

Scaffolds a component under `src/components/<Name>/` following this project's conventions
(see CLAUDE.md) and wires it into `src/index.ts`. The generated component compiles, has a
valid 3-jobs contract, and passes the test + a11y gates immediately — so you start from green
and fill in the real behavior.

## Run it

```bash
node .claude/skills/new-component/scaffold.mjs <Name> [--lead reveal-state|afford-action|acknowledge-input]
```

- `<Name>` — PascalCase (e.g. `Tag`, `AvatarGroup`).
- `--lead` — the component's lead UI job (default `reveal-state`).

It creates exactly five files — `<Name>.tsx`, `<Name>.css`, `<Name>.contract.ts`,
`<Name>.stories.tsx`, `<Name>.test.tsx` — and appends the export to `src/index.ts`. It refuses
to overwrite an existing component directory.

## After scaffolding

1. Implement `<Name>.tsx` — compose the primitives (`Box`/`Stack`/`Text`/`Pressable`); use
   `var(--tcl-*)` tokens only; CSS goes in `@layer tcl.components`.
2. Replace the `TODO` `satisfiedBy` strings in `<Name>.contract.ts`, and make the
   `Default` / `States` / `Interaction` stories actually demonstrate each job.
3. Flesh out `<Name>.test.tsx` (behavior assertions) — keep the `a11yViolations` check.
4. Run `pnpm run validate`.

## Notes

- Story names must stay `Default` / `States` / `Interaction` (the contract references them and
  `pnpm check:contracts` verifies they exist).
- `contract.name` must equal the directory name — the scaffold sets this for you.
- For a visualization (data-driven) component, title it `Visualizations/<Name>` and have it
  consume a Visual Grammar JSON contract (see the `Hub` component).
