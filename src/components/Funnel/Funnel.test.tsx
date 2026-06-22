import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '../../test/a11y';
import { Funnel } from './Funnel';
import type { FunnelContract } from './Funnel';

const data: FunnelContract = {
  view: 'funnel',
  code: 'test.funnel',
  title: 'Pipeline',
  unit: ' deals',
  stages: [
    { id: 'booked', label: 'Booked', value: 120, tone: 'info', note: 'Closed-won.' },
    { id: 'approved', label: 'Approved', value: 96, tone: 'accent', note: 'Finance review.' },
    { id: 'staffed', label: 'Staffed', value: 60, tone: 'success', note: 'Team assigned.' },
  ],
};

describe('Funnel', () => {
  it('renders a labelled button per stage with conversion vs the top', () => {
    render(<Funnel data={data} />);
    expect(
      screen.getByRole('button', { name: 'Booked: 120 deals, 100% of Booked' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Approved: 96 deals, 80% of Booked' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Staffed: 60 deals, 50% of Booked' }),
    ).toBeInTheDocument();
  });

  it('shows the header code and an inspector hint by default', () => {
    render(<Funnel data={data} />);
    expect(screen.getByText('test.funnel')).toBeInTheDocument();
    expect(screen.getByText(/Select a stage/)).toBeInTheDocument();
  });

  it('selects a stage, sets aria-pressed, and reveals the drop from the previous stage', async () => {
    const user = userEvent.setup();
    render(<Funnel data={data} />);
    const stage = screen.getByRole('button', { name: /Staffed: 60 deals/ });
    expect(stage).toHaveAttribute('aria-pressed', 'false');
    await user.click(stage);
    expect(stage).toHaveAttribute('aria-pressed', 'true');
    // 96 → 60 is a drop of 36 (37.5% → 38%) from Approved.
    expect(screen.getByText(/Down 36 deals \(38%\) from Approved/)).toBeInTheDocument();
    expect(screen.getByText('Team assigned.')).toBeInTheDocument();
  });

  it('omits the drop line for the first stage', async () => {
    const user = userEvent.setup();
    render(<Funnel data={data} />);
    await user.click(screen.getByRole('button', { name: /Booked: 120 deals/ }));
    expect(screen.queryByText(/Down/)).not.toBeInTheDocument();
  });

  it('calls onSelect with the stage id', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<Funnel data={data} onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: /Approved: 96 deals/ }));
    expect(onSelect).toHaveBeenCalledWith('approved');
  });

  it('falls back to the stage index as the id when none is given', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <Funnel
        data={{
          stages: [
            { label: 'Dup', value: 10 },
            { label: 'Dup', value: 4 },
          ],
        }}
        onSelect={onSelect}
      />,
    );
    // Duplicate labels must not collide — index fallback keeps them distinct.
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    await user.click(buttons[1]);
    expect(onSelect).toHaveBeenCalledWith('s1');
  });

  it('exposes a group role for the stages', () => {
    render(<Funnel data={data} />);
    expect(screen.getByRole('group', { name: 'Pipeline' })).toBeInTheDocument();
  });

  it('does not divide by zero when the top stage is zero', () => {
    render(<Funnel data={{ stages: [{ label: 'None', value: 0 }] }} />);
    expect(screen.getByRole('button', { name: 'None: 0, 0% of None' })).toBeInTheDocument();
  });

  it('clamps conversion labels to 100% for a non-monotonic (out-of-order) stage', async () => {
    const user = userEvent.setup();
    render(
      <Funnel
        data={{
          stages: [
            { id: 'top', label: 'Top', value: 100 },
            { id: 'surge', label: 'Surge', value: 150 },
          ],
        }}
      />,
    );
    // Surge exceeds the top: the bar caps at full width, so its label must read
    // 100% (not 150%) to stay consistent.
    const surge = screen.getByRole('button', { name: 'Surge: 150, 100% of Top' });
    await user.click(surge);
    // Retained is likewise clamped: "150% retained" would be nonsense.
    expect(screen.getByText('No drop from Top (100% retained)')).toBeInTheDocument();
  });

  it('keeps bars visible when the top stage is zero but later stages are positive', () => {
    // Conversion vs a zero top is 0%, but bars scale against the largest stage
    // so they don't all collapse to empty.
    render(
      <Funnel
        data={{
          stages: [
            { id: 'top', label: 'Top', value: 0 },
            { id: 'big', label: 'Big', value: 40 },
          ],
        }}
      />,
    );
    const big = document.querySelectorAll('.tcl-funnel__bar')[1] as HTMLElement;
    expect(big.style.getPropertyValue('--pct')).toBe('100%');
  });

  it('has no axe violations', async () => {
    const { container } = render(<Funnel data={data} />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
