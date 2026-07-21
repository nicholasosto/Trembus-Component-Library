# @trembus/icons

[![npm](https://img.shields.io/npm/v/@trembus/icons.svg)](https://www.npmjs.com/package/@trembus/icons)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/nicholasosto/Trembus-Component-Library/blob/main/LICENSE)

The shared glyph set for the Trembus component libraries: hand-authored, normalized
24×24 inline-SVG icons used to mark node kinds, file types, and **workflow outputs**
(what human+AI workflow steps emit — tools, application files, media, configuration,
context) and to carry UI affordances. Pure React components — **no stylesheet, no
dependencies** (React peer only).

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
import { Glyph, fileToGlyph, SYSTEM_KIND_GLYPH, OUTPUT_KIND_GLYPH } from '@trembus/icons';

<Glyph name={fileToGlyph('Button.tsx')} />; // → the TypeScript mark
<Glyph name={fileToGlyph('SKILL.md')} />; // → the book glyph (well-known basename)
<Glyph name={SYSTEM_KIND_GLYPH.datastore} />; // → the database glyph
<Glyph name={OUTPUT_KIND_GLYPH.engram} />; // → the brain glyph
```

### The workflow-output vocabulary

Command centers for human+AI workflows sort emitted artifacts into five categories,
each with kind-level glyphs beneath it (`OUTPUT_CATEGORY_GLYPH` / `OUTPUT_KIND_GLYPH`):

| Category          | Kinds → glyphs                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| **Code — Tools**  | tool → wrench · script → terminal · job → clock                                                  |
| **Application**   | module → box · library → layers · controller → gear · utility → component · game → gamepad       |
| **Media**         | audio → waveform · image → image · video → video · model → model-3d                              |
| **Configuration** | config → sliders · data → json · secret → key                                                    |
| **Context**       | engram/memory → brain · skill → book · doc → markdown · agent → robot · prompt/message → message |

`PROVENANCE_GLYPH` adds the _who_: `human` → user, `ai` → robot, `conjoined` → venn
(two overlapping circles). Render it as a small badge beside the kind glyph — and keep
a text label alongside, the marks are decorative.

`Glyph` renders nothing for an unknown name (safe to call eagerly). Importing
`Glyph` / `GLYPHS` pulls the full set; importing individual `*Icon` components
tree-shakes to just those.

## Exports

| Entry                                          | What                                                   |
| ---------------------------------------------- | ------------------------------------------------------ |
| `*Icon` (e.g. `DatabaseIcon`, `SearchIcon`)    | tree-shakeable per-glyph components                    |
| `Glyph` / `GLYPHS` / `GlyphName`               | render-by-name registry (dynamic names)                |
| `SYSTEM_KIND_GLYPH`                            | default C4 node-kind → glyph-name map                  |
| `OUTPUT_CATEGORY_GLYPH` / `OUTPUT_KIND_GLYPH`  | workflow-output category / kind → glyph-name maps      |
| `PROVENANCE_GLYPH`                             | human / ai / conjoined → glyph-name map                |
| `EXT_GLYPH` / `extToGlyph(label)`              | file-extension → glyph-name map + helper               |
| `WELL_KNOWN_FILE_GLYPH` / `fileToGlyph(label)` | well-known-basename-first filename → glyph-name helper |

## License

MIT © Nicholas Osto · [source & contributing](https://github.com/nicholasosto/Trembus-Component-Library)
