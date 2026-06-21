import type { Meta, StoryObj } from '@storybook/react-vite';
import { Meter } from './Meter';

const meta = {
  title: 'Components/Meter',
  component: Meter,
  args: { value: 57, label: 'Disk usage' },
  argTypes: {
    tone: {
      control: 'select',
      options: ['accent', 'info', 'success', 'warning', 'danger', 'neutral'],
    },
    variant: { control: 'inline-radio', options: ['solid', 'stacked', 'threshold'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Meter>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — a measurement filled to its value. */
export const Default: Story = {};

/** Job: Afford Action — solid, threshold (recoloring gauge), and stacked proportions. */
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16, minWidth: 420 }}>
      <Meter value={57} tone="success" label="Solid" />
      <Meter
        value={57}
        tone="success"
        variant="threshold"
        thresholds={[
          { value: 50, tone: 'warning' },
          { value: 80, tone: 'danger' },
        ]}
        glow
        label="Threshold gauge (warning at 50, danger at 80)"
      />
      <Meter
        variant="stacked"
        showValue={false}
        segments={[
          { value: 45, tone: 'info', label: '45%' },
          { value: 30, tone: 'success', label: '30%' },
          { value: 25, tone: 'neutral', label: '25%' },
        ]}
        label="Storage by type"
      />
    </div>
  ),
};

/** Job: Acknowledge Input — values, threshold crossings, and sizes. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16, minWidth: 420 }}>
      <Meter
        value={20}
        tone="success"
        variant="threshold"
        thresholds={[
          { value: 50, tone: 'warning' },
          { value: 80, tone: 'danger' },
        ]}
        label="Healthy"
      />
      <Meter
        value={65}
        tone="success"
        variant="threshold"
        thresholds={[
          { value: 50, tone: 'warning' },
          { value: 80, tone: 'danger' },
        ]}
        label="Warning"
      />
      <Meter
        value={92}
        tone="success"
        variant="threshold"
        thresholds={[
          { value: 50, tone: 'warning' },
          { value: 80, tone: 'danger' },
        ]}
        glow
        label="Critical"
      />
      <Meter value={40} size="sm" tone="info" label="Small" />
    </div>
  ),
};
