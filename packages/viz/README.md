# @trembus/viz

[![npm](https://img.shields.io/npm/v/@trembus/viz.svg)](https://www.npmjs.com/package/@trembus/viz)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/nicholasosto/Trembus-Component-Library/blob/main/LICENSE)
[![Storybook](https://img.shields.io/badge/Storybook-live-ff4785?logo=storybook&logoColor=white)](https://nicholasosto.github.io/Trembus-Component-Library/)

Trembus Tier-2 node-link visualizations — `Tree` (strict hierarchy via
`d3-hierarchy`) and `Lineage` (directed graph / DAG via `@dagrejs/dagre`). The
same "3 UI jobs" contract spine as `@trembus/ui`'s Tier-1 viz, with a layout
engine. Depends on `@trembus/tokens` only — never on `@trembus/ui`.

**🔭 [Browse `Tree` + `Lineage` in the live Storybook →](https://nicholasosto.github.io/Trembus-Component-Library/)**

```sh
pnpm add @trembus/viz react react-dom
```

`react` / `react-dom` are peer dependencies (React 19).

## Use

```tsx
import { Tree } from '@trembus/viz';
import '@trembus/viz/styles.css';

<div className="tcl-root" data-theme="dark">
  <Tree data={orgChart} />
</div>;
```

Each datum is a real focusable control with an accessible name, driven by
controlled/uncontrolled `selectedId` (+ `defaultSelectedId` + `onSelect`), with an
`aria-live` inspector — the decorative SVG edges stay `aria-hidden`.

## License

MIT © Nicholas Osto · [source & contributing](https://github.com/nicholasosto/Trembus-Component-Library)
