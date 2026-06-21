import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { IconButton } from './IconButton';

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const meta = {
  title: 'Components/IconButton',
  component: IconButton,
  args: { 'aria-label': 'Add item', children: <PlusIcon />, onPress: fn() },
  argTypes: {
    variant: { control: 'inline-radio', options: ['solid', 'outline', 'ghost'] },
    tone: {
      control: 'select',
      options: ['accent', 'success', 'info', 'warning', 'danger', 'neutral'],
    },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Afford Action — a square, named affordance for one icon. */
export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12 }}>
      <IconButton {...args} variant="solid" />
      <IconButton {...args} variant="outline" />
      <IconButton {...args} variant="ghost" />
    </div>
  ),
};

/** Job: Reveal State — idle / disabled / loading. */
export const States: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <IconButton {...args} />
      <IconButton {...args} disabled />
      <IconButton {...args} loading />
    </div>
  ),
};

/** Job: Acknowledge Input — activates on click + keyboard. */
export const Interaction: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Add item' }));
    await expect(args.onPress).toHaveBeenCalled();
  },
};
