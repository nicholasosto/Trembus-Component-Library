import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { MaterialTone } from '../../tokens/tokens.types';
import { Box } from './Box';

/**
 * The SURFACE primitive — a bounded region speaking the token vocabulary: elevation
 * intent (`surface`), border, radius token, z-layer, padding steps, and the `material`
 * skin system. Composed chrome throughout the library ultimately sits on a Box; reach
 * for it when you build custom chrome and want to stay inside the token system.
 *
 * ### When to use it
 * - Custom panels, wells, and chrome that composed components don't cover.
 * - Not for everyday content blocks — `Card` (and friends) come pre-composed; Box is
 *   the escape hatch that never hardcodes a hex.
 *
 * ### Data & key props
 * - `surface` — elevation intent: `raised` · `sunken` · `overlay`.
 * - `material` — a token-driven skin (`glass` · `cyber` · `felt` · `relic` ·
 *   `parchment` · `slate` · `regal`) applied via `[data-material]` and tuned with the
 *   `--tcl-mat-*` knobs (tint, accent, …).
 * - `radius` / `border` / `z` — token-scale corner, border, and layer.
 * - Padding on the space scale: `p` (all sides), `px` / `py` (axis), `pt` / `pr` /
 *   `pb` / `pl` (edge) — steps, never pixels.
 * - Polymorphic `as` — render any element while keeping the vocabulary.
 *
 * ### Accessibility
 * - Renders a plain element with no role of its own; semantics come from `as` and the
 *   content you put inside.
 *
 * ### Theming & setup
 * - Everything resolves through `var(--tcl-*)`, so surfaces and materials re-skin per
 *   theme automatically (materials carry per-theme tuning, e.g. glass on dark themes).
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full
 *   tokens foundation).
 */
const meta = {
  title: 'Primitives/Box',
  component: Box,
} satisfies Meta<typeof Box>;

export default meta;
type Story = StoryObj<typeof Box>;

/** A Surface — padding, radius, border, and elevation from tokens alone. */
export const Default: Story = {
  render: () => (
    <Box surface="raised" border radius="lg" p={6} style={{ maxWidth: 320 }}>
      A Surface — a bounded region with padding, radius, border, and elevation.
    </Box>
  ),
};

/** The three elevation intents side by side — raised · sunken · overlay. */
export const Surfaces: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {(['raised', 'sunken', 'overlay'] as const).map((s) => (
        <Box key={s} surface={s} border radius="md" p={5}>
          {s}
        </Box>
      ))}
    </div>
  ),
};

const glassStyle = (tint: string): CSSProperties =>
  ({ width: 196, ['--tcl-mat-tint' as string]: tint }) as CSSProperties;

const GLASS_TINTS = [
  {
    key: 'gold',
    tint: 'color-mix(in oklab, var(--tcl-accent) 38%, var(--tcl-surface-raised))',
    name: 'Frosted gold',
  },
  {
    key: 'azure',
    tint: 'color-mix(in oklab, var(--tcl-status-info) 38%, var(--tcl-surface-raised))',
    name: 'Frosted azure',
  },
  {
    key: 'jade',
    tint: 'color-mix(in oklab, var(--tcl-status-success) 38%, var(--tcl-surface-raised))',
    name: 'Frosted jade',
  },
] as const;

/** Material · Glass — one frosted material, re-tinted by tokens, over a vivid backdrop. */
export const Glass: Story = {
  name: 'Material · Glass',
  render: () => (
    <div
      style={{
        position: 'relative',
        padding: 40,
        borderRadius: 16,
        overflow: 'hidden',
        background:
          'radial-gradient(90% 90% at 12% 18%, #7b6cf6 0%, transparent 55%),' +
          'radial-gradient(80% 80% at 88% 12%, #18c5b6 0%, transparent 52%),' +
          'radial-gradient(90% 90% at 70% 100%, #ff6fae 0%, transparent 55%),' +
          'linear-gradient(140deg, #1a1f3c 0%, #0b0e1f 100%)',
      }}
    >
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        {GLASS_TINTS.map((t) => (
          <Box key={t.key} material="glass" p={6} style={glassStyle(t.tint)}>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--tcl-font-mono)',
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--tcl-text-dim)',
              }}
            >
              --tcl-mat-tint
            </p>
            <p
              style={{ margin: '6px 0 0', fontSize: 16, fontWeight: 600, color: 'var(--tcl-text)' }}
            >
              {t.name}
            </p>
            <p
              style={{
                margin: '10px 0 0',
                fontSize: 13,
                lineHeight: 1.5,
                color: 'var(--tcl-text-dim)',
              }}
            >
              One glass material, re-tinted by a single token — backdrop-filter refracts the colors
              behind it.
            </p>
          </Box>
        ))}
      </div>
    </div>
  ),
};

const matStyle = (prop: string, value: string): CSSProperties =>
  ({ width: 196, [prop as string]: value }) as CSSProperties;

function MaterialCards({
  material,
  varName,
  items,
}: {
  material: MaterialTone;
  varName: string;
  items: readonly { key: string; value: string; name: string; blurb: string }[];
}) {
  return (
    <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
      {items.map((t) => (
        <Box key={t.key} material={material} p={6} style={matStyle(varName, t.value)}>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--tcl-font-mono)',
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--tcl-text-dim)',
            }}
          >
            {varName}
          </p>
          <p style={{ margin: '6px 0 0', fontSize: 16, fontWeight: 600, color: 'var(--tcl-text)' }}>
            {t.name}
          </p>
          <p
            style={{
              margin: '10px 0 0',
              fontSize: 13,
              lineHeight: 1.5,
              color: 'var(--tcl-text-dim)',
            }}
          >
            {t.blurb}
          </p>
        </Box>
      ))}
    </div>
  );
}

const CYBER_TINTS = [
  {
    key: 'gold',
    value: 'var(--tcl-accent)',
    name: 'Neon gold',
    blurb: 'Chamfered plate, accent neon edge + inner glow.',
  },
  {
    key: 'azure',
    value: 'var(--tcl-status-info)',
    name: 'Neon azure',
    blurb: 'The drop-shadow glow follows the chamfer silhouette.',
  },
  {
    key: 'crimson',
    value: 'var(--tcl-status-danger)',
    name: 'Neon crimson',
    blurb: 'Brushed-metal + scanline texture, recolored by one token.',
  },
] as const;

/** Material · Cyber — chamfered, neon-edged industrial panels; recolor via --tcl-mat-accent. */
export const Cyber: Story = {
  name: 'Material · Cyber',
  render: () => (
    <div
      style={{
        padding: 40,
        borderRadius: 16,
        background:
          'repeating-linear-gradient(0deg, transparent 0 23px, rgba(120,180,255,0.05) 23px 24px),' +
          'repeating-linear-gradient(90deg, transparent 0 23px, rgba(120,180,255,0.05) 23px 24px),' +
          'radial-gradient(circle at 50% -10%, #16213e 0%, #070a12 72%)',
      }}
    >
      <MaterialCards material="cyber" varName="--tcl-mat-accent" items={CYBER_TINTS} />
    </div>
  ),
};

const FELT_TINTS = [
  {
    key: 'amber',
    value: 'var(--tcl-accent)',
    name: 'Amber felt',
    blurb: 'Fractal-noise nap blended over a warm token base.',
  },
  {
    key: 'forest',
    value: 'var(--tcl-status-success)',
    name: 'Forest felt',
    blurb: 'Zero gloss, soft matte — recolored by one token.',
  },
  {
    key: 'wine',
    value: 'var(--tcl-status-danger)',
    name: 'Wine felt',
    blurb: 'Inner bottom shade gives the fabric a little depth.',
  },
] as const;

/** Material · Felt — fibrous matte fabric; recolor via --tcl-mat-accent. */
export const Felt: Story = {
  name: 'Material · Felt',
  render: () => (
    <div style={{ padding: 40, borderRadius: 16, background: 'var(--tcl-surface-sunken)' }}>
      <MaterialCards material="felt" varName="--tcl-mat-accent" items={FELT_TINTS} />
    </div>
  ),
};

const RELIC_TINTS = [
  {
    key: 'gold',
    value: 'var(--tcl-accent)',
    name: 'Sunfire relic',
    blurb: 'Aged stone with dormant gold energy seams.',
  },
  {
    key: 'azure',
    value: 'var(--tcl-status-info)',
    name: 'Aether relic',
    blurb: 'Etched circuit glow recolored by one token.',
  },
  {
    key: 'verdant',
    value: 'var(--tcl-status-success)',
    name: 'Verdant relic',
    blurb: 'Patina energy over weathered grain.',
  },
] as const;

/** Material · Relic — ancient advanced technology: weathered stone + dormant energy seams. */
export const Relic: Story = {
  name: 'Material · Relic (ancient tech)',
  render: () => (
    <div
      style={{
        padding: 40,
        borderRadius: 16,
        background: 'radial-gradient(circle at 50% 0%, #1b1410 0%, #0a0805 75%)',
      }}
    >
      <MaterialCards material="relic" varName="--tcl-mat-accent" items={RELIC_TINTS} />
    </div>
  ),
};

const PARCHMENT_TINTS = [
  {
    key: 'sepia',
    value: 'var(--tcl-accent)',
    name: 'Sepia vellum',
    blurb: 'Warm cream, foxing blotches, fibre grain.',
  },
  {
    key: 'olive',
    value: 'var(--tcl-status-success)',
    name: 'Olive vellum',
    blurb: 'Same parchment, tinted by one token.',
  },
  {
    key: 'rust',
    value: 'var(--tcl-status-danger)',
    name: 'Rust vellum',
    blurb: 'The aged vignette darkens the edges.',
  },
] as const;

/** Material · Parchment — warm aged vellum with foxing and fibre. */
export const Parchment: Story = {
  name: 'Material · Parchment',
  render: () => (
    <div
      style={{
        padding: 40,
        borderRadius: 16,
        background: 'linear-gradient(135deg, #3a3329, #251f17)',
      }}
    >
      <MaterialCards material="parchment" varName="--tcl-mat-accent" items={PARCHMENT_TINTS} />
    </div>
  ),
};

const SLATE_TINTS = [
  {
    key: 'neutral',
    value: 'var(--tcl-text-faint)',
    name: 'Honed slate',
    blurb: 'Fine speckle, hard bevel, near-neutral.',
  },
  {
    key: 'steel',
    value: 'var(--tcl-status-info)',
    name: 'Steel slate',
    blurb: 'A whisper of token tint in the stone.',
  },
  {
    key: 'gilt',
    value: 'var(--tcl-accent)',
    name: 'Gilt slate',
    blurb: 'Industrial matte, recolored subtly.',
  },
] as const;

/** Material · Slate — honed industrial stone with a fine speckle and hard bevel. */
export const Slate: Story = {
  name: 'Material · Slate',
  render: () => (
    <div style={{ padding: 40, borderRadius: 16, background: 'var(--tcl-surface)' }}>
      <MaterialCards material="slate" varName="--tcl-mat-accent" items={SLATE_TINTS} />
    </div>
  ),
};

const REGAL_TINTS = [
  {
    key: 'gold',
    value: 'var(--tcl-accent)',
    name: 'Gilded ivory',
    blurb: 'White-and-gold pearl with an angelic halo bloom.',
  },
  {
    key: 'platinum',
    value: 'var(--tcl-text-faint)',
    name: 'Platinum ivory',
    blurb: 'The same regal sheen in cool platinum.',
  },
  {
    key: 'rose',
    value: 'var(--tcl-status-danger)',
    name: 'Rose-gold ivory',
    blurb: 'Recolored to rose gold by one token.',
  },
] as const;

/** Material · Regal — MGM+ white-and-gold: a luminous pearl surface with a gilt edge + halo. */
export const Regal: Story = {
  name: 'Material · Regal (white & gold)',
  render: () => (
    <div
      style={{
        padding: 48,
        borderRadius: 16,
        background: 'radial-gradient(circle at 50% 8%, #f4eeda 0%, #d9cca9 70%, #c3b289 100%)',
      }}
    >
      <MaterialCards material="regal" varName="--tcl-mat-accent" items={REGAL_TINTS} />
    </div>
  ),
};
