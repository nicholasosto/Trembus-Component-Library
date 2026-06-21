import type { Meta, StoryObj } from '@storybook/react-vite';
import { Progress } from './Progress';

const meta = {
  title: 'Components/Progress',
  component: Progress,
  args: { value: 72, label: 'Upload progress' },
  argTypes: {
    tone: {
      control: 'select',
      options: ['accent', 'info', 'success', 'warning', 'danger', 'neutral'],
    },
    variant: { control: 'inline-radio', options: ['solid', 'segments'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — a determinate fill proportional to value/max. */
export const Default: Story = {};

/** Job: Afford Action — solid vs segments, clean vs the opt-in glow skin. */
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16, minWidth: 380 }}>
      <Progress value={72} tone="info" label="Solid" />
      <Progress value={68} tone="info" glow label="Solid + glow (HUD skin)" />
      <Progress value={60} variant="segments" segments={12} tone="info" label="Segments" />
      <Progress
        value={40}
        variant="segments"
        segments={6}
        tone="success"
        glow
        label="Segments + glow"
      />
    </div>
  ),
};

/** Job: Acknowledge Input — values across the range, sizes, and clamping. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16, minWidth: 380 }}>
      <Progress value={0} tone="info" label="Empty" />
      <Progress value={40} tone="info" label="Partial" />
      <Progress value={100} tone="success" label="Complete" />
      <Progress value={120} tone="warning" label="Clamped over max" />
      <Progress value={50} size="sm" tone="info" label="Small" />
      <Progress value={50} size="lg" tone="info" glow label="Large + glow" />
    </div>
  ),
};
