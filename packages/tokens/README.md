# @trembus/tokens

The shared design-token foundation for the Trembus component libraries: the
`var(--tcl-*)` CSS custom properties, a type-safe token ontology, the color-coded
tone vocabulary, the 3-jobs `ComponentContract` type, and an axe a11y test helper.
React-free.

```sh
pnpm add @trembus/tokens
```

## Use

Import the token layer system once (declares the `@layer` cascade, then the
light · dark · reliquary themes + material presets), and select a theme with a
`data-theme` attribute:

```ts
import '@trembus/tokens/styles.css';
```

```html
<html data-theme="dark">
  <!-- light (default) · dark · reliquary -->
</html>
```

Reference tokens from your own CSS — never hardcode a hex:

```css
.thing {
  background: var(--tcl-surface);
  color: var(--tcl-text);
}
```

The token strings + tone helpers are also available from JS:

```ts
import { tokens, toneVar } from '@trembus/tokens';
```

## Subpath exports

| Entry                                                                                 | What                                             |
| ------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `.`                                                                                   | `tokens` object, `toneVar`/`toneFg`, token types |
| `./contract`                                                                          | the 3-jobs `ComponentContract` type              |
| `./testing`                                                                           | `a11yViolations()` axe helper (needs `jest-axe`) |
| `./styles.css`                                                                        | the full layer system (themes + materials)       |
| `./layers.css` · `./light.css` · `./dark.css` · `./reliquary.css` · `./materials.css` | individual layers                                |

Usually you consume tokens transitively via [`@trembus/ui`](https://www.npmjs.com/package/@trembus/ui).

## License

MIT © Nicholas Osto
