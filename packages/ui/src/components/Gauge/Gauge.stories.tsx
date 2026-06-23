import type { Meta, StoryObj } from '@storybook/react-vite';
import { Gauge } from './Gauge';
import type { GaugeProps } from './Gauge';

// The PMO DIRT-lag gauge: green ≤ target, amber ≤ 2×target, red beyond.
const dirtZones: GaugeProps['zones'] = [
  { upTo: 1, tone: 'success', label: 'on target' },
  { upTo: 2, tone: 'warning', label: 'slipping' },
  { upTo: 3, tone: 'danger', label: 'late' },
];

const meta = {
  title: 'Visualizations/Gauge',
  component: Gauge,
  args: {
    value: 1.2,
    max: 3,
    unit: 'd',
    zones: dirtZones,
    target: { value: 1.0, label: '≤ 1.0d' },
    label: 'DIRT lag',
  },
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div style={{ width: 240 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Gauge>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Afford Action — a single DIRT gauge with quality bands and a target tick. */
export const Default: Story = {};

/** Job: Reveal State — the same dial reading into each band: on-target, slipping, late. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      {[
        { value: 0.7, label: 'On target' },
        { value: 1.6, label: 'Slipping' },
        { value: 2.6, label: 'Late' },
      ].map((s) => (
        <div key={s.label} style={{ width: 200 }}>
          <Gauge
            value={s.value}
            max={3}
            unit="d"
            zones={dirtZones}
            target={{ value: 1.0, label: '≤ 1.0d' }}
            label={s.label}
          />
        </div>
      ))}
    </div>
  ),
};

/** Job: Acknowledge Input — a utilization dial with custom zones; value exposed via role=meter. */
export const Zones: Story = {
  args: {
    value: 68,
    max: 100,
    unit: '%',
    label: 'Utilization',
    zones: [
      { upTo: 45, tone: 'danger', label: 'under-utilized' },
      { upTo: 75, tone: 'warning', label: 'below target' },
      { upTo: 100, tone: 'success', label: 'healthy' },
    ],
    target: { value: 75, label: '75%' },
  },
};
