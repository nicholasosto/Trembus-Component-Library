import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Toolbar } from './Toolbar';

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
