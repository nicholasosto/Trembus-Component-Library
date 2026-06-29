# @trembus/icons

[![npm](https://img.shields.io/npm/v/@trembus/icons.svg)](https://www.npmjs.com/package/@trembus/icons)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/nicholasosto/Trembus-Component-Library/blob/main/LICENSE)

The shared glyph set for the Trembus component libraries: hand-authored, normalized
24×24 inline-SVG icons used to mark node kinds and file types and to carry UI
affordances. Pure React components — **no stylesheet, no dependencies** (React peer
only).

Two vocabularies, two color rules:

- **Monochrome glyphs** paint `currentColor`, so you tint them with the surrounding
  text color (a `var(--tcl-*)` token in this design system).
- **Brand / type marks** (TypeScript, JavaScript, React, CSS, HTML) carry their own
  brand color — they're only recognizable that way. They're decorative
  (`aria-hidden`), so an adjacent text label does the accessible work.

Part of the [Trembus Component Library](https://github.com/nicholasosto/Trembus-Component-Library) —
**[browse the live Storybook →](https://nicholasosto.github.io/Trembus-Component-Library/)**

```sh
pnpm add @trembus/icons
```

## Use

Import a glyph as a tree-shakeable named component:

```tsx
import { DatabaseIcon, SearchIcon } from '@trembus/icons';

<span style={{ color: 'var(--tcl-text-dim)', fontSize: 16 }}>
  <DatabaseIcon />
</span>;
```

Glyphs size to the font (`width/height: 1em`) and inherit `color` via
`currentColor`, so a wrapping element's `font-size` and `color` control them.

### Render by name

When the glyph name is dynamic (a file extension, a node kind), render through the
registry-backed `<Glyph>`:

```tsx
import { Glyph, extToGlyph, SYSTEM_KIND_GLYPH } from '@trembus/icons';

<Glyph name={extToGlyph('Button.tsx')} />; // → the TypeScript mark
<Glyph name={SYSTEM_KIND_GLYPH.datastore} />; // → the database glyph
```

`Glyph` renders nothing for an unknown name (safe to call eagerly). Importing
`Glyph` / `GLYPHS` pulls the full set; importing individual `*Icon` components
tree-shakes to just those.

## Exports

| Entry                                       | What                                     |
| ------------------------------------------- | ---------------------------------------- |
| `*Icon` (e.g. `DatabaseIcon`, `SearchIcon`) | tree-shakeable per-glyph components      |
| `Glyph` / `GLYPHS` / `GlyphName`            | render-by-name registry (dynamic names)  |
| `SYSTEM_KIND_GLYPH`                         | default C4 node-kind → glyph-name map    |
| `EXT_GLYPH` / `extToGlyph(label)`           | file-extension → glyph-name map + helper |

## License

MIT © Nicholas Osto · [source & contributing](https://github.com/nicholasosto/Trembus-Component-Library)
