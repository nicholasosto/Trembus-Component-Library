import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Button', onPress: fn() },
  argTypes: {
    variant: { control: 'inline-radio', options: ['solid', 'outline', 'ghost'] },
    tone: {
      control: 'select',
      options: ['accent', 'success', 'info', 'warning', 'danger', 'neutral'],
    },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Afford Action — a visible, clickable affordance (a real <button>). */
export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12 }}>
      <Button {...args} variant="solid">
        Solid
      </Button>
      <Button {...args} variant="outline">
        Outline
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
    </div>
  ),
};

export const Tones: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {(['accent', 'success', 'info', 'warning', 'danger', 'neutral'] as const).map((t) => (
        <Button key={t} {...args} tone={t}>
          {t}
        </Button>
      ))}
    </div>
  ),
};

/** Job: Reveal State — idle / disabled / loading are each perceivable. */
export const States: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button {...args}>Idle</Button>
      <Button {...args} disabled>
        Disabled
      </Button>
      <Button {...args} loading>
        Loading
      </Button>
    </div>
  ),
};

/** Job: Acknowledge Input — activates on click + keyboard. */
export const Interaction: Story = {
  args: { children: 'Activate' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole('button', { name: 'Activate' });
    await userEvent.click(btn);
    await expect(args.onPress).toHaveBeenCalled();
  },
};
