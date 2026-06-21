import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Switch } from './Switch';

const meta = {
  title: 'Components/Switch',
  component: Switch,
  args: { label: 'Enable notifications' },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Afford Action — a labeled toggle. */
export const Default: Story = {};

/** Job: Reveal State — off / on / disabled. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Switch label="Off" />
      <Switch label="On" defaultChecked />
      <Switch label="With description" description="Get notified about activity." />
      <Switch label="Disabled" disabled />
    </div>
  ),
};

/** Job: Acknowledge Input — toggles on interaction. */
export const Interaction: Story = {
  args: { label: 'Wi-Fi' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch', { name: 'Wi-Fi' });
    await expect(sw).not.toBeChecked();
    await userEvent.click(sw);
    await expect(sw).toBeChecked();
  },
};
