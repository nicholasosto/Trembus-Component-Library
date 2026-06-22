import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { DataStatusBar } from './DataStatusBar';
import type { DataFilter } from './DataStatusBar';

const FILTERS: DataFilter[] = [
  { id: 'period', label: 'Period', value: 'Q2 FY26', tone: 'accent' },
  { id: 'practice', label: 'Practice', value: 'Data & AI' },
  { id: 'region', label: 'Region', value: 'AMER' },
  { id: 'status', label: 'Stage', value: 'Active' },
];

const meta = {
  title: 'Components/DataStatusBar',
  component: DataStatusBar,
  parameters: { layout: 'padded' },
  args: {
    title: 'Delivery KPIs',
    status: 'live',
    updatedAt: '2026-06-22T13:55:00Z',
    updatedLabel: 'Updated 4m ago',
    metrics: [
      { label: 'records', value: '1,284' },
      { label: 'coverage', value: '98%' },
      { label: 'source', value: 'EPSA · Fabric' },
    ],
    filters: FILTERS,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 920, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DataStatusBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Job: Afford Action — the populated context strip with removable parameter chips
 * and a refresh control: the visible affordances for narrowing or re-pulling the slice.
 */
export const Default: Story = {
  args: { onRemoveFilter: fn(), onRefresh: fn() },
};

/**
 * Job: Reveal State — the same bar across the health ontology. The tone rail, dot,
 * and word make data trust perceivable at a glance; live/loading animate their dot.
 */
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <DataStatusBar status="live" title="Delivery KPIs" updatedLabel="Updated just now" />
      <DataStatusBar status="stale" title="Delivery KPIs" updatedLabel="Updated 3h ago" />
      <DataStatusBar status="loading" title="Delivery KPIs" updatedLabel="Refreshing…" />
      <DataStatusBar status="partial" title="Delivery KPIs" updatedLabel="2 of 5 sources" />
      <DataStatusBar status="paused" title="Delivery KPIs" updatedLabel="Auto-refresh off" />
      <DataStatusBar status="error" title="Delivery KPIs" updatedLabel="Last good 22m ago" />
    </div>
  ),
};

/**
 * Job: Acknowledge Input — removing a chip drops the parameter, and refresh flips the
 * bar to `loading` (the dot pulses, the icon spins) before settling back to `live`.
 */
export const Interaction: Story = {
  render: (args) => {
    const [filters, setFilters] = useState<DataFilter[]>(FILTERS);
    const [status, setStatus] = useState<'live' | 'loading'>('live');
    return (
      <DataStatusBar
        {...args}
        status={status}
        updatedLabel={status === 'loading' ? 'Refreshing…' : 'Updated 4m ago'}
        filters={filters}
        onRemoveFilter={(id) => setFilters((fs) => fs.filter((f) => (f.id ?? '') !== id))}
        onRefresh={() => {
          setStatus('loading');
          setTimeout(() => setStatus('live'), 600);
        }}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // remove a parameter chip → it leaves the bar
    await userEvent.click(canvas.getByRole('button', { name: 'Remove Region filter' }));
    await expect(canvas.queryByText('AMER')).not.toBeInTheDocument();
    // refresh → status flips to Loading (live region re-announces)
    await userEvent.click(canvas.getByRole('button', { name: 'Refresh' }));
    await expect(canvas.getByText('Loading')).toBeInTheDocument();
  },
};
