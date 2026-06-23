import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent, within } from 'storybook/test';
import { Button } from '../Button/Button';
import { Tooltip } from './Tooltip';

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  // Stories provide their own trigger; this satisfies the required `children`.
  args: { content: 'Saves without leaving the page', children: <button>trigger</button> },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — supplemental text on hover/focus. */
export const Default: Story = {
  render: (args) => (
    <div style={{ padding: 48 }}>
      <Tooltip {...args}>
        <Button variant="outline" tone="neutral">
          Hover or focus me
        </Button>
      </Tooltip>
    </div>
  ),
};

/** Job: Afford Action — wraps an existing trigger; placed above or below. */
export const Sides: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 32, padding: 64 }}>
      <Tooltip content="Above the trigger" side="top">
        <Button variant="outline" tone="neutral">
          Top
        </Button>
      </Tooltip>
      <Tooltip content="Below the trigger" side="bottom">
        <Button variant="outline" tone="neutral">
          Bottom
        </Button>
      </Tooltip>
    </div>
  ),
};

/** Job: Acknowledge Input — opens on focus, closes on Escape. */
export const Interaction: Story = {
  render: (args) => (
    <div style={{ padding: 48 }}>
      <Tooltip {...args} openDelay={0}>
        <Button variant="outline" tone="neutral">
          Help
        </Button>
      </Tooltip>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('button', { name: 'Help' }).focus();
    await expect(await screen.findByRole('tooltip')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  },
};
