<!-- Thanks for contributing! Keep PRs focused. -->

## What & why

<!-- What does this change, and why? -->

## Affected packages

- [ ] `@trembus/tokens`
- [ ] `@trembus/ui`
- [ ] `@trembus/viz`
- [ ] `@trembus/game-viz`
- [ ] tooling / docs only

## Checklist

- [ ] `pnpm run validate` is green (lint · typecheck · contracts · test · build · verify:exports · storybook)
- [ ] New/changed behavior has tests (and a regression test, if this is a fix)
- [ ] Accessibility holds — `a11yViolations(container)` is empty; new interactive bits are real focusable controls
- [ ] Tokens only — no hardcoded colors; component CSS in `@layer tcl.components`
- [ ] For a new/changed component: the `*.contract.ts` names real `Default` / `States` / `Interaction` stories
- [ ] CHANGELOG updated under **Unreleased** (for consumer-facing changes)
