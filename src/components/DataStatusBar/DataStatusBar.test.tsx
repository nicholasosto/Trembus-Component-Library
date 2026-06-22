import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '../../test/a11y';
import { DataStatusBar } from './DataStatusBar';
import type { DataFilter } from './DataStatusBar';

const FILTERS: DataFilter[] = [
  { id: 'period', label: 'Period', value: 'Q2 FY26' },
  { id: 'region', label: 'Region', value: 'AMER' },
];

describe('DataStatusBar', () => {
  it('reveals the status word, tone class, and data-status attribute', () => {
    const { container } = render(<DataStatusBar status="stale" />);
    const root = container.querySelector('.tcl-data-status-bar')!;
    expect(screen.getByText('Stale')).toBeInTheDocument();
    expect(root).toHaveClass('tcl-data-status-bar--warning');
    expect(root).toHaveAttribute('data-status', 'stale');
  });

  it('puts the status in a live region so a flip is announced', () => {
    const { rerender } = render(<DataStatusBar status="live" />);
    const region = screen.getByRole('status');
    expect(region).toHaveTextContent('Live');
    rerender(<DataStatusBar status="error" />);
    expect(screen.getByRole('status')).toHaveTextContent('Error');
  });

  it('lets statusLabel override the default word', () => {
    render(<DataStatusBar status="live" statusLabel="Streaming" />);
    expect(screen.getByText('Streaming')).toBeInTheDocument();
    expect(screen.queryByText('Live')).not.toBeInTheDocument();
  });

  it('renders freshness inside <time> when updatedAt is set', () => {
    render(<DataStatusBar updatedAt="2026-06-22T13:55:00Z" updatedLabel="Updated 4m ago" />);
    const time = screen.getByText('Updated 4m ago');
    expect(time.tagName).toBe('TIME');
    expect(time).toHaveAttribute('dateTime', '2026-06-22T13:55:00Z');
  });

  it('renders metrics with their value and label', () => {
    render(<DataStatusBar metrics={[{ label: 'records', value: '1,284' }]} />);
    expect(screen.getByText('1,284')).toBeInTheDocument();
    expect(screen.getByText('records')).toBeInTheDocument();
  });

  it('renders a chip per filter and stays static without onRemoveFilter', () => {
    render(<DataStatusBar filters={FILTERS} />);
    expect(screen.getByText('Period')).toBeInTheDocument();
    expect(screen.getByText('Q2 FY26')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('fires onRemoveFilter with the filter id when a chip is removed', async () => {
    const onRemoveFilter = vi.fn();
    const user = userEvent.setup();
    render(<DataStatusBar filters={FILTERS} onRemoveFilter={onRemoveFilter} />);
    await user.click(screen.getByRole('button', { name: 'Remove Region filter' }));
    expect(onRemoveFilter).toHaveBeenCalledTimes(1);
    expect(onRemoveFilter).toHaveBeenCalledWith('region', FILTERS[1]);
  });

  it('falls back to the index — not the label — for chips with no id', async () => {
    const onRemoveFilter = vi.fn();
    const user = userEvent.setup();
    const dupes: DataFilter[] = [
      { label: 'Tag', value: 'A' },
      { label: 'Tag', value: 'B' },
    ];
    render(<DataStatusBar filters={dupes} onRemoveFilter={onRemoveFilter} />);
    const buttons = screen.getAllByRole('button', { name: 'Remove Tag filter' });
    await user.click(buttons[1]);
    expect(onRemoveFilter).toHaveBeenCalledWith('f1', dupes[1]);
  });

  it('fires onRefresh and disables the control while loading', async () => {
    const onRefresh = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<DataStatusBar status="live" onRefresh={onRefresh} />);
    const refresh = screen.getByRole('button', { name: 'Refresh' });
    await user.click(refresh);
    expect(onRefresh).toHaveBeenCalledTimes(1);
    rerender(<DataStatusBar status="loading" onRefresh={onRefresh} />);
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Refresh' })).toHaveAttribute('aria-busy', 'true');
  });

  it('names the region (default and override)', () => {
    const { rerender } = render(<DataStatusBar />);
    expect(screen.getByRole('region', { name: 'Data status' })).toBeInTheDocument();
    rerender(<DataStatusBar aria-label="KPI freshness" />);
    expect(screen.getByRole('region', { name: 'KPI freshness' })).toBeInTheDocument();
  });

  it('has no axe violations when fully interactive', async () => {
    const { container } = render(
      <DataStatusBar
        title="Delivery KPIs"
        status="partial"
        updatedAt="2026-06-22T13:55:00Z"
        updatedLabel="Updated 4m ago"
        metrics={[{ label: 'records', value: '1,284' }]}
        filters={FILTERS}
        onRemoveFilter={() => {}}
        onRefresh={() => {}}
      />,
    );
    expect(await a11yViolations(container)).toEqual([]);
  });
});
