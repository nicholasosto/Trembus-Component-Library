import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { SkipLink } from './SkipLink';

const meta = {
  title: 'Components/SkipLink',
  component: SkipLink,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof SkipLink>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Afford Action — a real bypass link to the main landmark. Press Tab to reveal it. */
export const Default: Story = {
  args: { href: '#sb-main' },
  render: (args) => (
    <div style={{ padding: 16 }}>
      <SkipLink {...args} />
      <p>
        Press <kbd>Tab</kbd> — the skip link appears at the top-left.
      </p>
      <nav aria-label="Primary" style={{ display: 'flex', gap: 8 }}>
        <a href="#a">One</a>
        <a href="#b">Two</a>
      </nav>
      <main id="sb-main" tabIndex={-1} style={{ marginTop: 16 }}>
        Main content — activating the skip link moves focus here.
      </main>
    </div>
  ),
};

/** Job: Reveal State — hidden until focused, then revealed top-left (focused on load). */
export const States: Story = {
  args: { href: '#sb-main-2' },
  render: (args) => (
    <div style={{ padding: 16 }}>
      <SkipLink {...args} />
      <main id="sb-main-2" tabIndex={-1}>
        The link is focused on load to show its revealed appearance.
      </main>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('link', { name: 'Skip to main content' }).focus();
  },
};

/** Job: Acknowledge Input — Tab focuses and reveals it; the focus ring confirms. */
export const Interaction: Story = {
  args: { href: '#sb-main-3' },
  render: (args) => (
    <div style={{ padding: 16 }}>
      <SkipLink {...args} />
      <main id="sb-main-3" tabIndex={-1}>
        Target landmark.
      </main>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: 'Skip to main content' })).toHaveFocus();
  },
};
