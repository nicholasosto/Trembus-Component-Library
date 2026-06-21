# @trembus/ui

A React component library grounded in **first-principles UX** — a claude.ai-clean light
theme by default, the Trembus Visual Grammar as a built-in dark theme, and zero styling
config for consumers.

> Tokens → primitives → components. Every component carries a machine-checked contract
> proving it does the three irreducible jobs of any UI.

## First principles

Every component is built to satisfy the **three irreducible UI jobs**:

1. **Reveal State** — make machine/data state perceivable.
2. **Afford Action** — expose capability with a visible affordance.
3. **Acknowledge Input** — respond perceivably to every input (close the feedback loop).

…by composing a small set of **primitives** that map to the five UI primitives:

| Primitive  | Maps to     | Responsibility                                                        |
| ---------- | ----------- | -------------------------------------------------------------------- |
| `Box`      | Surface     | bounded region: padding, surface, radius, border, z-layer (tokens)   |
| `Stack` / `Inline` | Relation | order & grouping made visual (flex over `Box`)                |
| `Text`     | Mark        | draws glyphs; meaning comes from `as` (`h1`, `label`, …)             |
| `Pressable`| Affordance  | the one interactive element; owns the idle→hover→pressed→focus FSM   |

The Affordance state machine lives once in `useAffordanceState` and is exposed as a
`data-state` attribute, so feedback is structural rather than re-implemented per component.

## Install & use

```sh
pnpm add @trembus/ui react react-dom
```

Two lines wire up the whole library — import the stylesheet **once**, and set a theme:

```tsx
import '@trembus/ui/styles.css';
import { Button, Badge, Input, Dialog } from '@trembus/ui';

export function App() {
  return (
    <div className="tcl-root">
      <Button tone="accent" onPress={() => console.log('pressed')}>
        Save
      </Button>
    </div>
  );
}
```

```html
<!-- light is the default; opt into dark with one attribute -->
<html data-theme="dark">
```

No Tailwind, no build-tool config required. Theming is pure CSS custom properties — override
any `--tcl-*` token to re-skin, or flip `[data-theme]` for the built-in light/dark themes.

## Components

**Afford-Action**

- **Button** — solid / outline / ghost × 6 tones, sizes, loading, `asChild`.
- **IconButton** — square, icon-only; composes Button and requires an `aria-label`.
- **Tabs** — ARIA tablist with roving tabindex + Arrow/Home/End nav (compound API).
- **Menu** — dropdown (ARIA menu button): portal, roving focus, Esc/outside/Tab dismiss, return-focus.

**Reveal-State**

- **Badge** — the color-coded status ontology (success / info / warning / danger / neutral / accent).
- **Avatar** — image → initials → glyph fallback; sizes, shapes, status tones; `role=img`.
- **Spinner** — busy indicator (`role=status` + SR label); sizes and tones.
- **Skeleton** — loading placeholders (text / rect / circle, multi-line, reduced-motion-aware shimmer).
- **Card** — a raised surface that groups content; compound `Card.Header` / `Card.Body` / `Card.Footer`.

**Acknowledge-Input**

- **Input** — labeled field with description, validation (`aria-invalid` + announced error).
- **Textarea** — multiline field; same shared field chrome and validation.
- **Select** — native-first select with placeholder, validation, and a chevron.
- **Checkbox** — labeled, tri-state (indeterminate), custom box.
- **RadioGroup** — single-choice group (`role=radiogroup`); compound `RadioGroup.Item`.
- **Switch** — labeled toggle (`role=switch`).
- **Tooltip** — hover + focus, `role=tooltip` bound via `aria-describedby`, Esc/blur dismiss.
- **Dialog** — focus-trapped modal: portal, scroll-lock, Esc/overlay dismiss, return-focus.
- **Toast** — `ToastProvider` + `useToast()`: portal viewport, tone-coded, `aria-live`, auto-dismiss with pause-on-hover.

Labeled controls (Input/Textarea/Select) share one internal field shell (`src/internal/field`) — a single source of truth for label/description/error wiring.

**Visualizations** (data-driven; consume Visual Grammar contracts)

- **Hub** — a hex-flower domain map (one center + up to six petals). Consumes the same JSON
  shape as the Visual Grammar `hub.schema.json` contract, so a hub authored for the static HTML
  kit renders here unchanged. Tiles are color-coded by `kind` (center / shipped / current /
  planned); selecting a tile reveals its detail in a live inspector. Supports legacy VG `pos`
  names, generic slots, or auto-placement.

Primitives (`Box`, `Stack`, `Inline`, `Text`, `Pressable`), hooks (`useAffordanceState`,
`useFocusTrap`, `useReturnFocus`, `useReducedMotion`, `useDismissable`), and utils
(`Portal`, `Slot`, `cx`) are all exported for composing your own components.

## Theming tokens

Three layers, all CSS custom properties:

- **Chrome** — `--tcl-bg`, `--tcl-surface[-raised|-sunken]`, `--tcl-border[-soft|-strong]`,
  `--tcl-text[-dim|-faint]`, `--tcl-accent`.
- **Status / intent** (the color-coded ontology) — `--tcl-status-{success|info|warning|danger|neutral}`
  each with a `-bg` / `-fg` companion.
- **Scales** — `--tcl-space-0..8`, `--tcl-radius-{sm|md|lg|full}`, `--tcl-text-{xs..xl}`,
  `--tcl-elevation-{0..3}`, motion `--tcl-ease-calm` / `--tcl-dur-{fast|base|slow}`.

A type-safe `tokens` object (var references) is exported for inline use:
`style={{ color: tokens.color.accent }}`.

## Development

```sh
pnpm dev               # Storybook (docs + playground) on :6006
pnpm test              # unit tests (jsdom + axe a11y) — runs anywhere
pnpm test:stories      # story tests in a real browser (needs: pnpm exec playwright install chromium)
pnpm typecheck
pnpm lint
pnpm build             # → dist/{index.js, index.d.ts, styles.css}
pnpm check:contracts   # enforce the 3-jobs contract per component
pnpm verify:exports    # publint + are-the-types-wrong
pnpm run validate      # the full gate, in order
```

### The contract discipline

Each component owns a `*.contract.ts` — the single source of truth declaring how it
satisfies the three jobs and which Storybook story demonstrates each. The
`ComponentContract` type makes the three jobs non-optional (you cannot compile a contract
that omits one), and `pnpm check:contracts` verifies the named stories actually exist. The
canonical five-file shape per component is enforced:

```
src/components/<Name>/
  <Name>.tsx           # implementation (composes primitives)
  <Name>.css           # @layer tcl.components { .tcl-<name> … }  — var(--tcl-*) only
  <Name>.contract.ts   # the 3-jobs contract (single source of truth)
  <Name>.stories.tsx   # Default / States / Interaction (names match the contract)
  <Name>.test.tsx      # behavior + jest-axe
```

## License

UNLICENSED — internal Trembus package.
