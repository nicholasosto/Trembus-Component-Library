# @trembus/ui

Trembus React component library — first-principles UX (tokens → primitives →
components), each component carrying a machine-checked "3 UI jobs" contract
(Reveal State · Afford Action · Acknowledge Input). claude.ai-clean **light** +
Trembus **dark** + blood-dark **reliquary** themes.

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

Primitives (`Box`, `Stack`/`Inline`, `Text`, `Pressable`) compose into the higher
components; surfaces can wear a **material** skin via `<Box material="glass">`.

Browse every component + theme in [Storybook](https://github.com/nicholasosto/Trembus-Component-Library).

## License

MIT © Nicholas Osto
