# @trembus/ui

[![npm](https://img.shields.io/npm/v/@trembus/ui.svg)](https://www.npmjs.com/package/@trembus/ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/nicholasosto/Trembus-Component-Library/blob/main/LICENSE)
[![Storybook](https://img.shields.io/badge/Storybook-live-ff4785?logo=storybook&logoColor=white)](https://nicholasosto.github.io/Trembus-Component-Library/)

Trembus React component library — first-principles UX (tokens → primitives →
components), each component carrying a machine-checked "3 UI jobs" contract
(Reveal State · Afford Action · Acknowledge Input). claude.ai-clean **light** +
Trembus **dark** + blood-dark **reliquary** themes, zero styling config.

**🔭 [Browse every component + theme in the live Storybook →](https://nicholasosto.github.io/Trembus-Component-Library/)**

## Install

```sh
pnpm add @trembus/ui react react-dom
```

`react` / `react-dom` are peer dependencies (React 19). `@trembus/tokens` comes
along automatically.

## Use

Import the stylesheet once (it bundles the full token layer system — themes and
materials included), pick a theme with `data-theme`, then use components:

```tsx
import { Button, Stack } from '@trembus/ui';
import '@trembus/ui/styles.css';

export function App() {
  return (
    <div className="tcl-root" data-theme="dark">
      <Stack gap="4">
        <Button tone="accent">Bind the relic</Button>
      </Stack>
    </div>
  );
}
```

No Tailwind, no build-tool config. Theming is pure CSS custom properties — override
any `--tcl-*` token to re-skin, or flip `[data-theme]` (`light` · `dark` ·
`reliquary`). Surfaces can wear a **material** skin via `<Box material="glass">`.

## What's inside

**Primitives** — `Box` (Surface), `Stack` / `Inline` (Relation), `Text` (Mark),
`Pressable` (Affordance; owns the idle→hover→pressed→focus FSM). Compose these into
your own components.

**Afford-Action** — `Button`, `IconButton`, `Tabs`, `Menu`.

**Reveal-State** — `Badge`, `Avatar`, `Spinner`, `Skeleton`, `Card`, `Callout`,
`EmptyState`, `Stat`, `Table`, `Progress`, `Meter`.

**Acknowledge-Input** — `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`,
`Switch`, `Tooltip`, `Dialog`, `Toast`.

**Visualizations** (Tier-1, data-driven) — `Hub`, `BarChart`, `LineChart`,
`DonutChart`, `Heatmap`, `Gauge`, `Sparkline`, `Funnel`, `Treemap`, `Timeline`,
`Swimlane`. (Node-link graphs live in [`@trembus/viz`](https://www.npmjs.com/package/@trembus/viz).)

Hooks (`useAffordanceState`, `useFocusTrap`, `useReturnFocus`, `useReducedMotion`,
`useDismissable`) and utils (`Portal`, `Slot`, `cx`) are exported too.

## Theming tokens

A type-safe `tokens` object (var references) is exported for inline use:
`style={{ color: tokens.color.accent }}`. The full token vocabulary lives in
[`@trembus/tokens`](https://www.npmjs.com/package/@trembus/tokens).

## License

MIT © Nicholas Osto · [source & contributing](https://github.com/nicholasosto/Trembus-Component-Library)
