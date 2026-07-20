# TCL consumer recipes

> Stamp 2026-07-20 · tokens 0.2.1 · icons 0.2.0 · ui 0.8.2 · viz 0.5.0 · game-viz 0.4.0

Copy-adaptable patterns for consuming apps. Whole-page scaffolds (AppShell nav shell,
WorkflowBoard) are versioned copy-and-own templates owned by the sibling
**trembus-template** skill — route there instead of hand-building page chrome.

## Index

1. Vite / SPA setup · 2. Next.js App Router · 3. Theme switching · 4. Custom brand theme ·
2. Display font (Cinzel) · 6. Materials · 7. Router links (`asChild`) · 8. Forms + Dialog ·
3. Wiring selection (sel-trio) · 10. RunHistory → Swimlane replay · 11. Drag & drop ·
4. a11y testing in the consumer · 13. Troubleshooting (full table)

## 1 · Vite / SPA setup

```tsx
// src/main.tsx — styles once, at the entry
import '@trembus/ui/styles.css';
import '@trembus/viz/styles.css'; // if used
import '@trembus/game-viz/styles.css'; // if used
import './styles/app.css'; // yours — unlayered, wins over tcl layers
```

```html
<!-- index.html -->
<html lang="en" data-theme="dark"></html>
```

```tsx
// App root
export function App() {
  return <div className="tcl-root app">{/* routes */}</div>;
}
```

`.tcl-root` applies the themed font/background/text to the subtree; `data-theme` on
`<html>` lets portaled layers (Dialog, Menu, Toast) inherit the theme too — that's why it
belongs on an ancestor of `<body>`'s portals, not on a page div.

## 2 · Next.js App Router

```tsx
// app/layout.tsx (server component — style imports are fine here)
import '@trembus/ui/styles.css';
import '@trembus/viz/styles.css'; // if used
import '@trembus/game-viz/styles.css'; // if used

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className="tcl-root">{children}</body>
    </html>
  );
}
```

- Interactive TCL components (anything with state/handlers — Dialog, Menu, charts,
  forms) render inside `'use client'` components. Purely presentational output (Badge,
  Card chrome) is fine in server components.
- **Effigy / MediaFrame(model) are SSR-safe**: model-viewer is dynamically imported in
  the browser only; the server render shows the poster until hydration. No `<script>`
  tag, no `next/dynamic` gymnastics needed — but the bundler must support dynamic `import()`.
- Theme toggling on the server-rendered `<html>` attribute: set the initial value from a
  cookie (or accept a first-paint default) and flip the attribute client-side (recipe 3).

## 3 · Theme switching

Themes are CSS-only: flipping the attribute re-themes everything, portals included.

```tsx
type AppTheme = 'light' | 'dark' | 'reliquary'; // ThemeName omits 'reliquary' — known gap

function applyTheme(theme: AppTheme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('app-theme', theme);
}
```

- `light` is the token default (`:root`); `dark` and `reliquary` (blood-dark, red accent)
  ship with tokens. `reliquary` is game-viz's home idiom but works everywhere.
- Restore before first paint (inline script or cookie) to avoid a theme flash.
- Don't build per-component theme switches — the attribute is the single lever.

## 4 · Custom brand theme

A theme is just a `[data-theme='<name>']` block defining color/elevation tokens —
invariant scales (space, radius, type) always come from `:root`. Anything you don't set
falls through to the light defaults, so start from your closest built-in and override
families incrementally. In YOUR stylesheet (unlayered, so it wins):

```css
[data-theme='acme'] {
  --tcl-bg: #0e1420;
  --tcl-surface: #151d2e;
  --tcl-surface-raised: #1b2438;
  --tcl-surface-sunken: #0a0f19;
  --tcl-border: #2a3650;
  --tcl-text: #e8edf6;
  --tcl-text-dim: #b7c2d6;
  --tcl-accent: #4f8cff;
  --tcl-accent-hover: #6ea1ff;
  --tcl-accent-fg: #0a1020;
  --tcl-focus-ring: #6ea1ff;
}
```

- Then `<html data-theme="acme">`. Check contrast: text vs bg/surface ≥ 4.5:1, and each
  `--tcl-status-*` you override needs a matching AA-safe `-fg`.
- Dark-based theme + the `glass` material? Test glass surfaces — built-in dark themes
  carry glass-specific tuning; replicate under `[data-theme='acme'] [data-material='glass']` if
  glass looks washed out.
- For a one-off accent change, override just `--tcl-accent`/`-hover`/`-active`/`-fg` on
  an existing theme instead of minting a new one.

## 5 · Display font (Cinzel)

`--tcl-font-display` is a Cinzel-first stack; no font file ships. For the intended look:

```sh
pnpm add @fontsource/cinzel
```

```tsx
import '@fontsource/cinzel/700.css'; // weight the display type actually uses
```

Skipping this is legitimate — the stack degrades to Optima/Palatino/Georgia. To use your
own display face instead: `:root { --tcl-font-display: 'YourFace', serif; }` (unlayered).

## 6 · Materials

Seven token-driven skins applied per-surface via `<Box material="…">` (or
`data-material` on any element): `glass · cyber · felt · relic · parchment · slate · regal`.

```tsx
<Box material="glass" p="4" radius="lg">
  …
</Box>
```

Materials are scene-setting — hero panels, feature cards, HUD surfaces — not every
container. They live in `@layer tcl.materials` (above components), include
reduced-transparency/contrast fallbacks, and are tuned by `--tcl-mat-*` knobs if you must
adjust one (in your unlayered CSS).

## 7 · Router links (`asChild`)

TCL is routing-agnostic. Lend link affordances to YOUR router's component:

```tsx
import { NavLink } from 'react-router';

<NavBar.Link asChild>
  <NavLink to="/library" end>
    Library
  </NavLink>
</NavBar.Link>;
```

- In `asChild` mode, omit `active` — the router link owns `aria-current="page"`, and TCL
  styles off that attribute. Only pass `active` when you render plain `href` links yourself.
- Same pattern for `Breadcrumb.Item asChild` and `Pressable asChild` (e.g. a Stat tile
  that navigates). `asChild` expects exactly ONE interactive child element.

## 8 · Forms + Dialog

Labelled controls (Input/Textarea/Select) wire label/description/error to ARIA
internally — never wrap them in your own `<label>` or duplicate error text.

```tsx
<Dialog
  open={open}
  onClose={() => setOpen(false)}
  title="Rename asset"
  footer={
    <Inline gap="2" justify="end">
      <Button onPress={() => setOpen(false)}>Cancel</Button>
      <Button tone="accent" loading={saving} onPress={submit}>
        Save
      </Button>
    </Inline>
  }
>
  <Stack gap="4">
    <Input
      label="Name"
      value={name}
      onChange={(e) => setName(e.target.value)}
      error={error}
      description="Shown in the asset grid."
    />
  </Stack>
</Dialog>
```

- Validate on submit; put the message in `error` (it renders AND announces). Keep the
  primary action `tone="accent"` with `loading` during the request.
- Confirm the outcome with a Toast (`useToast`), not a second dialog.

## 9 · Wiring selection (the sel-trio)

Every data component supports controlled or uncontrolled selection. Master–detail:

```tsx
const [selected, setSelected] = useState<string | undefined>();
<BarChart data={issues} selectedId={selected} onSelect={setSelected} />
<AssetDetail id={selected} />   // your panel, beside the built-in inspector
```

- Uncontrolled (`defaultSelectedId` or nothing) is fine when the built-in aria-live
  inspector is all the detail you need; add `onSelect` alone for analytics.
- Heatmap in `selectionMode="row"` uses `selectedRowId`/`onSelectRow`; RunHistory uses
  `selectedRunId`/`onSelectRun` — same shape, clearer names.
- Selection ring and focus ring are distinct by design (selection persists when focus
  leaves) — don't restyle one to look like the other.

## 10 · RunHistory → Swimlane replay (`applyRun`)

Time-travel a process board to any logged run:

```tsx
import { applyRun, RunHistory, Swimlane } from '@trembus/ui';

const [runId, setRunId] = useState<string>();
const run = history.runs.find((r) => r.id === runId);

<RunHistory data={history} selectedRunId={runId} onSelectRun={setRunId} />
<Swimlane data={run ? applyRun(board, run) : board} />;
```

`applyRun` overlays the run's `stepOutcomes` statuses (and step outputs) onto the
Swimlane contract — the board becomes "what this run actually did". Clearing the
selection restores the canonical board.

## 11 · Drag & drop

TCL deliberately ships **no** DnD engine — components stay "grabbable" (real buttons,
stable ids, honest affordances) and YOU bring the engine (dnd-kit recommended).

```tsx
// Card reorder with dnd-kit — the proven pattern (library story: Examples/Card Drag and Drop)
<SortableContext items={cards.map((c) => c.id)}>
  {cards.map((card) => (
    <SortableCardWrapper key={card.id} id={card.id}>
      <Card>…</Card>
    </SortableCardWrapper>
  ))}
</SortableContext>
```

Attach sortable/droppable behavior to thin wrappers around Card/Box/rows; keep TCL
components unwrapped inside. Verify keyboard reorder (dnd-kit's keyboard sensor) — the
components' real-button spine makes it work; don't break it with div handles.

## 12 · a11y testing in the consumer

The library gates itself with axe; test YOUR compositions the same way:

```sh
pnpm add -D jest-axe @types/jest-axe   # peer of @trembus/tokens/testing
```

```tsx
import { render } from '@testing-library/react';
import { a11yViolations } from '@trembus/tokens/testing';

it('dashboard has no axe violations', async () => {
  const { container } = render(<Dashboard />);
  expect(await a11yViolations(container)).toEqual([]);
});
```

`a11yViolations` pre-disables page-level rules that false-positive on fragments and sets
`preload: false` so `<audio>`/`<video>` (AudioWaveform, MediaFrame) don't hang jsdom.
Note the subpath resolves to TypeScript source — fine under Vite/vitest/ts-jest.
Windowed components: pass `virtualize={false}` (VirtualAssetGrid) in jsdom so all tiles exist.

## 13 · Troubleshooting

| Symptom                                          | Cause → fix                                                                                                                                          |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Components render unstyled                       | that package's `styles.css` import missing at the entry                                                                                              |
| game-viz styled, embedded ui/viz parts aren't    | the 0.4.0 rule — import all three `styles.css`                                                                                                       |
| Headings serif but not Cinzel                    | Cinzel is opt-in — recipe 5                                                                                                                          |
| Theme not applying / stuck on light              | `data-theme` not on an ancestor, or `.tcl-root` missing                                                                                              |
| Portaled layer (Dialog/Menu/Toast) ignores theme | `data-theme` sits on a page div — move it to `<html>`/`<body>`                                                                                       |
| Menu/popover invisible behind a Dialog           | `@trembus/ui` < 0.8.1 — upgrade                                                                                                                      |
| Escape closes Dialog AND Menu at once            | your own portaled popup inside Dialog — `stopPropagation` its Escape (built-ins already do)                                                          |
| Double selection rings / wrong inspector target  | duplicate or missing datum ids — give stable unique `id`s                                                                                            |
| Labels read "[object Object]"                    | ReactNode passed into a string label field — labels stay strings; use `display`/`sub` for rich content                                               |
| TS rejects `data-theme="reliquary"`              | known gap: `ThemeName` omits it — cast/widen locally                                                                                                 |
| Chart renders empty inside a hidden tab/panel    | mounted while `display:none` → measured 0 — render when visible                                                                                      |
| Effigy blank                                     | non-glTF/GLB source (use MediaFrame's poster/doc fallback), bundler without dynamic `import()`, or pre-hydration SSR frame (poster shows — expected) |
| jsdom test hangs ~10 s on axe                    | raw `axe` on media — use `a11yViolations` from `@trembus/tokens/testing` (recipe 12)                                                                 |
| VirtualAssetGrid empty in jsdom tests            | no layout size — `virtualize={false}`                                                                                                                |
| Icon bundle larger than expected                 | `Glyph`/`GLYPHS` registry pulls every glyph — import `*Icon` components directly when names are static                                               |
| Custom hex colors don't re-theme                 | that's the trade of leaving tokens — move the value to a `--tcl-*` override per theme, or accept it                                                  |
