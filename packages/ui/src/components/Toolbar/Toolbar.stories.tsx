import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Toolbar } from './Toolbar';

/**
 * A compact cluster of commands under ONE Tab stop — the ARIA toolbar pattern for
 * editor chrome and canvas tools. Compound: `Toolbar.Button` / `Toolbar.Group` /
 * `Toolbar.Separator`. Lead job: **afford action** — many controls, minimal
 * tab-order cost.
 *
 * ### When to use it
 * - Icon command bars: formatting, canvas tools, panel headers; pair with `Menu`
 *   for overflow — a `Toolbar.Button` can BE the `Menu.Trigger`.
 * - Not for site navigation (`NavBar`) or a popup list of choices (`Menu` alone).
 *
 * ### Data & key props
 * - Root: `aria-label` (name the toolbar) · `orientation` (`horizontal` default |
 *   `vertical` — flips the arrow axis and `aria-orientation`).
 * - `Toolbar.Button` — a real `<button>`; `tone` `neutral` (default) | `accent` for
 *   the one primary action; native props pass through (`aria-pressed` toggles,
 *   `disabled`, …).
 * - `Toolbar.Group` clusters related controls; `Toolbar.Separator` divides clusters.
 *
 * ### Accessibility
 * - `role="toolbar"` with a roving tabindex — exactly one item is tabbable; Arrow
 *   keys (per orientation) + Home/End move focus and wrap; disabled controls are
 *   skipped by the rove.
 * - Arrow keys rove FIRST, then fall through to composed handlers — so a
 *   menu-trigger button still opens on ArrowDown in a horizontal bar.
 * - Separators expose `role="separator"` with the perpendicular `aria-orientation`;
 *   groups are `role="group"`.
 *
 * ### Theming & setup
 * - Raised surface, hover, and the accent primary come from tokens; works in
 *   light · dark · reliquary via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Components/Toolbar',
  component: Toolbar,
} satisfies Meta<typeof Toolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

const Glyph = ({ children, ...style }: { children: string } & CSSProperties) => (
  <span aria-hidden style={style}>
    {children}
  </span>
);

/**
 * Job: Afford Action — a cluster of real controls under one Tab stop, split into
 * groups by separators, ending in an emphasized (accent) primary action.
 */
export const Default: Story = {
  render: () => (
    <Toolbar aria-label="Text formatting">
      <Toolbar.Group aria-label="History">
        <Toolbar.Button aria-label="Undo">
          <Glyph>↶</Glyph>
        </Toolbar.Button>
        <Toolbar.Button aria-label="Redo">
          <Glyph>↷</Glyph>
        </Toolbar.Button>
      </Toolbar.Group>
      <Toolbar.Separator />
      <Toolbar.Group aria-label="Style">
        <Toolbar.Button aria-label="Bold">
          <Glyph fontWeight={700}>B</Glyph>
        </Toolbar.Button>
        <Toolbar.Button aria-label="Italic">
          <Glyph fontStyle="italic">I</Glyph>
        </Toolbar.Button>
        <Toolbar.Button aria-label="Underline">
          <Glyph textDecoration="underline">U</Glyph>
        </Toolbar.Button>
      </Toolbar.Group>
      <Toolbar.Separator />
      <Toolbar.Button tone="accent">Share</Toolbar.Button>
    </Toolbar>
  ),
};

/**
 * Job: Reveal State — a toggled-on control (aria-pressed), an unavailable control
 * (disabled, and skipped by roving), and the accent primary.
 */
export const States: Story = {
  render: () => (
    <Toolbar aria-label="Formatting (states)">
      <Toolbar.Button aria-label="Bold" aria-pressed>
        <Glyph fontWeight={700}>B</Glyph>
      </Toolbar.Button>
      <Toolbar.Button aria-label="Italic">
        <Glyph fontStyle="italic">I</Glyph>
      </Toolbar.Button>
      <Toolbar.Separator />
      <Toolbar.Button aria-label="Comment (unavailable)" disabled>
        <Glyph>💬</Glyph>
      </Toolbar.Button>
      <Toolbar.Separator />
      <Toolbar.Button tone="accent">Publish</Toolbar.Button>
    </Toolbar>
  ),
};

/**
 * Job: Acknowledge Input — focus the first control, then rove with →/Home/End;
 * the disabled control is skipped and focus wraps.
 */
export const Interaction: Story = {
  render: () => (
    <Toolbar aria-label="Formatting">
      <Toolbar.Button aria-label="Bold">
        <Glyph fontWeight={700}>B</Glyph>
      </Toolbar.Button>
      <Toolbar.Button aria-label="Italic">
        <Glyph fontStyle="italic">I</Glyph>
      </Toolbar.Button>
      <Toolbar.Button aria-label="Underline">
        <Glyph textDecoration="underline">U</Glyph>
      </Toolbar.Button>
    </Toolbar>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bold = canvas.getByRole('button', { name: 'Bold' });
    bold.focus();
    await expect(bold).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('button', { name: 'Italic' })).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect(canvas.getByRole('button', { name: 'Underline' })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(bold).toHaveFocus();
  },
};
