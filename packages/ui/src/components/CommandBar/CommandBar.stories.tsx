import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Badge } from '../Badge/Badge';
import { CommandBar } from './CommandBar';
import type { CommandGroup } from './CommandBar';

/**
 * A **command dock**: one declarative `groups` model rendered as a compact bar of
 * real controls, with progressive disclosure into menus and automatic overflow
 * collapsing. Built on `Toolbar` + `Menu`, so it inherits the ARIA toolbar pattern
 * and the menu-button pattern. Lead job: **afford action**.
 *
 * ### When to use it
 * - Floating chrome over a canvas/viewport, an editor header, or a panel footer —
 *   anywhere many commands must fit a small strip and act on something *elsewhere*.
 * - Use it when your commands are DATA (an array you map over, feature-flagged or
 *   server-driven). If you are hand-writing a fixed cluster of JSX buttons, compose
 *   `Toolbar` + `Menu` directly — that is what this renders.
 * - Not for site navigation (`NavBar`), not for a single popup list of choices
 *   (`Menu` alone), not for a search-and-run command palette (no component yet).
 *
 * ### Data & key props
 * - `groups: CommandGroup[]` — `{ id, label, commands }`. Groups render as
 *   separator-divided `role="group"` clusters and are the unit of overflow.
 * - `Command` — `{ id, label, glyph?, tone?, disabled? }` plus `pressed?`, `showLabel?`,
 *   `hint?`, `commands?` and `onSelect?`. `glyph` names a `@trembus/icons` glyph; a
 *   command with `commands` becomes a menu trigger (nesting is two levels: menu → submenu).
 * - `label` (required, names the toolbar) · `side` (menus open `top` by default) ·
 *   `align` (`start` | `center` | `end` — the root is always full-width) ·
 *   `overflow` · `meta` (static trailing content) · `onCommand`.
 * - Readout: `showStatus` · `status` (controlled) · `formatStatus` (uncontrolled echo).
 *
 * ### Accessibility
 * - `role="toolbar"` with a roving tabindex — the whole bar is ONE Tab stop; ←/→ and
 *   Home/End move between commands and skip disabled ones.
 * - Icon-only commands are named by `label` via `aria-label`; a command with no
 *   `glyph` renders its label as text, so no control is ever nameless.
 * - Menus follow the menu-button pattern (`aria-haspopup`/`aria-expanded`, ↓ to open,
 *   → into a submenu, ←/Escape back out, Tab collapses the tree).
 * - The readout under the bar is `role="status"` (a polite live region) — the command
 *   acts off-screen, so the bar confirms it happened.
 * - `pressed` maps to `aria-pressed`; `disabled` to a real disabled button.
 *
 * ### Theming & setup
 * - Surfaces, the accent primary, and the destructive tone come from tokens; the
 *   destructive tone is painted as TEXT on a transparent control so it stays legible
 *   in light · dark · reliquary.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Components/CommandBar',
  component: CommandBar,
  args: {
    label: 'Scene actions',
    groups: [{ id: 'tools', label: 'Tools', commands: [{ id: 'materials', label: 'Materials' }] }],
  },
} satisfies Meta<typeof CommandBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The DCC-bridge dock: tools, a bridge menu with one submenu, and an accent export. */
const SCENE_GROUPS: CommandGroup[] = [
  {
    id: 'tools',
    label: 'Tools',
    commands: [
      { id: 'materials', label: 'Materials', glyph: 'layers' },
      { id: 'lighting', label: 'Lighting', glyph: 'zap' },
      { id: 'capture', label: 'Capture', glyph: 'image' },
    ],
  },
  {
    id: 'bridge',
    label: 'Bridge',
    commands: [
      {
        id: 'dcc',
        label: 'DCC Bridge',
        glyph: 'sparkle',
        commands: [
          { id: 'zbrush', label: 'ZBrush', glyph: 'model-3d', hint: '⌘1' },
          {
            id: 'roblox',
            label: 'Roblox',
            glyph: 'gamepad',
            commands: [
              { id: 'roblox-send', label: 'Send' },
              { id: 'roblox-download', label: 'Send + download' },
              { id: 'roblox-log', label: 'Send with log' },
            ],
          },
          { id: 'blender', label: 'Blender', glyph: 'box', hint: '⌘2' },
          { id: 'godot', label: 'Godot', glyph: 'component' },
          { id: 'unreal', label: 'Unreal', glyph: 'cpu' },
          { id: 'isaac', label: 'OV / Isaac', glyph: 'robot', disabled: true, hint: 'offline' },
        ],
      },
      { id: 'share', label: 'Share', glyph: 'external-link' },
    ],
  },
  {
    id: 'output',
    label: 'Output',
    commands: [{ id: 'export', label: 'Export', glyph: 'play', tone: 'accent' }],
  },
];

const SEND_TARGETS = new Set(['zbrush', 'blender', 'godot', 'unreal']);

const sentence = (id: string, label: string): string => {
  if (id.startsWith('roblox-')) return `Sent to Roblox — ${label.toLowerCase()}`;
  return SEND_TARGETS.has(id) ? `Sent to ${label}` : `${label} selected`;
};

/** A mock viewport for the dock to float over. */
function Viewport({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: 'relative',
        width: 'min(720px, 92vw)',
        height: 320,
        borderRadius: 'var(--tcl-radius-lg)',
        border: '1px solid var(--tcl-border)',
        background:
          'radial-gradient(120% 90% at 50% 0%, var(--tcl-surface-raised), var(--tcl-surface-sunken))',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 12,
          left: 14,
          color: 'var(--tcl-text-dim)',
          fontSize: 'var(--tcl-text-sm)',
          fontFamily: 'var(--tcl-font-sans)',
        }}
      >
        Scene · viewport (mock)
      </span>
      <div style={{ position: 'absolute', insetInline: 12, bottom: 12 }}>{children}</div>
    </div>
  );
}

/**
 * Job: Afford Action — one `groups` array becomes a docked bar of real controls;
 * the ✦ command owns a menu (→ on “Roblox” for its submenu) and the readout is
 * controlled by the app.
 */
export const Default: Story = {
  render: (args) => {
    const [msg, setMsg] = useState<string>('Open ✦ DCC Bridge — → on “Roblox” for alternates.');
    return (
      <Viewport>
        <CommandBar
          {...args}
          label="Scene actions"
          groups={SCENE_GROUPS}
          align="center"
          status={msg}
          meta={<Badge tone="warning">+$20</Badge>}
          onCommand={(c) => setMsg(sentence(c.id, c.label))}
        />
      </Viewport>
    );
  },
};

/**
 * Job: Reveal State — availability (disabled), toggle state (aria-pressed), the
 * accent primary, a destructive command, and the static meta slot.
 */
export const States: Story = {
  render: (args) => (
    <CommandBar
      {...args}
      label="Asset actions"
      showStatus={false}
      meta={<Badge tone="neutral">12 selected</Badge>}
      groups={[
        {
          id: 'view',
          label: 'View',
          commands: [
            { id: 'grid', label: 'Grid', glyph: 'component', pressed: true },
            { id: 'list', label: 'List', glyph: 'layers' },
            { id: 'inspect', label: 'Inspect', glyph: 'search', disabled: true },
          ],
        },
        {
          id: 'act',
          label: 'Actions',
          commands: [
            { id: 'publish', label: 'Publish', glyph: 'play', tone: 'accent', showLabel: true },
            { id: 'delete', label: 'Delete', glyph: 'close', tone: 'danger', showLabel: true },
          ],
        },
      ]}
    />
  ),
};

/**
 * Job: Acknowledge Input — rove with →, open the ✦ menu, pick a target; the live
 * readout under the bar echoes the command that ran and focus returns to the trigger.
 */
export const Interaction: Story = {
  render: (args) => (
    <CommandBar
      {...args}
      label="Scene actions"
      side="bottom"
      overflow={false}
      formatStatus={(c) => `Sent to ${c.label}`}
      groups={[
        {
          id: 'tools',
          label: 'Tools',
          commands: [
            { id: 'materials', label: 'Materials', glyph: 'layers' },
            { id: 'lighting', label: 'Lighting', glyph: 'zap' },
          ],
        },
        {
          id: 'bridge',
          label: 'Bridge',
          commands: [
            {
              id: 'dcc',
              label: 'DCC Bridge',
              glyph: 'sparkle',
              commands: [
                { id: 'blender', label: 'Blender', glyph: 'box' },
                { id: 'unreal', label: 'Unreal', glyph: 'cpu' },
              ],
            },
          ],
        },
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const materials = canvas.getByRole('button', { name: 'Materials' });
    materials.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('button', { name: 'Lighting' })).toHaveFocus();

    const trigger = canvas.getByRole('button', { name: 'DCC Bridge' });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // The menu is portaled to <body>, so query the document, not the canvas.
    const body = within(document.body);
    await userEvent.click(await body.findByRole('menuitem', { name: 'Blender' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Sent to Blender');
    await expect(trigger).toHaveFocus();
  },
};

/** A width-constrained frame, so the same bar can be shown roomy and tight. */
function Frame({ width, children }: { width: number; children: ReactNode }) {
  return (
    <div style={{ display: 'grid', gap: 'var(--tcl-space-2)', justifyItems: 'start' }}>
      <span style={{ color: 'var(--tcl-text-dim)', fontSize: 'var(--tcl-text-sm)' }}>
        {width}px
      </span>
      <div
        style={{
          width,
          padding: 'var(--tcl-space-3)',
          border: '1px dashed var(--tcl-border)',
          borderRadius: 'var(--tcl-radius-md)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Job: Afford Action — the SAME three groups at two container widths. When the bar
 * outgrows its container the trailing groups collapse into the ⋯ menu (each under
 * its group heading) instead of overflowing or vanishing; widen it and they return.
 */
export const Overflow: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 'var(--tcl-space-5)' }}>
      {[420, 190].map((width) => (
        <Frame key={width} width={width}>
          <CommandBar
            {...args}
            label={`Scene actions (${width}px)`}
            groups={SCENE_GROUPS}
            side="bottom"
            showStatus={false}
          />
        </Frame>
      ))}
    </div>
  ),
};
