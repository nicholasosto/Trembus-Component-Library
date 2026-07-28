import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '../../test/a11y';
import { MilestoneTrack } from './MilestoneTrack';
import type { MilestoneTrackContract } from './MilestoneTrack';

const leadTime: MilestoneTrackContract = {
  title: 'Completed lead time',
  unit: 'd',
  stations: [
    { id: 'opp', label: 'Opportunity', sub: '≥80%' },
    { id: 'ticket', label: 'Ticket created' },
    { id: 'project', label: 'Project created' },
    { id: 'role', label: 'First role', status: 'pending', badge: 'pending source' },
    { id: 'invoice', label: 'First invoice' },
  ],
  metrics: [
    {
      id: 'ticket-project',
      from: 'ticket',
      to: 'project',
      value: 2.6,
      label: 'Ticket → project',
      count: '605 completed',
    },
    {
      id: 'project-invoice',
      from: 'project',
      to: 'invoice',
      value: 26.3,
      label: 'Project → first invoice',
      count: '427 completed',
    },
  ],
  groups: [
    { label: 'Salesforce', glyph: 'cloud', from: 'opp', to: 'opp' },
    { label: 'Projector', glyph: 'box', from: 'role', to: 'invoice' },
  ],
};

const leftOf = (el: HTMLElement): number => Number.parseFloat(el.style.left);

describe('MilestoneTrack', () => {
  it('renders stations and interval bubbles as named buttons', () => {
    render(<MilestoneTrack data={leadTime} />);
    expect(
      screen.getByRole('button', { name: 'Opportunity — ≥80% — Complete — Salesforce' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'First role — Pending — pending source — Projector' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Ticket → project: 2.6 d, 605 completed' }),
    ).toBeInTheDocument();
  });

  it('computes the measured total into the header meta', () => {
    render(<MilestoneTrack data={leadTime} />);
    expect(screen.getByText('28.9 d measured')).toBeInTheDocument();
  });

  it('acknowledges selection with aria-pressed and the aria-live inspector (station)', async () => {
    const user = userEvent.setup();
    render(<MilestoneTrack data={leadTime} />);
    const station = screen.getByRole('button', {
      name: 'First role — Pending — pending source — Projector',
    });
    await user.click(station);
    expect(station).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/· Pending · Projector/)).toBeInTheDocument();
  });

  it('reveals value, count and share of total for a selected bubble', async () => {
    const user = userEvent.setup();
    render(<MilestoneTrack data={leadTime} />);
    await user.click(screen.getByRole('button', { name: /Ticket → project/ }));
    expect(screen.getByText('605 completed · 9% of measured lead time')).toBeInTheDocument();
  });

  it('supports controlled selection: prop wins, onSelect reports intent', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<MilestoneTrack data={leadTime} selectedId="opp" onSelect={onSelect} />);
    const opp = screen.getByRole('button', { name: /Opportunity/ });
    const ticket = screen.getByRole('button', { name: 'Ticket created — Complete' });
    await user.click(ticket);
    expect(onSelect).toHaveBeenCalledWith('ticket');
    expect(opp).toHaveAttribute('aria-pressed', 'true');
    expect(ticket).toHaveAttribute('aria-pressed', 'false');
  });

  it('places a long-span metric in the last free gap before `to` and draws its whisker', () => {
    const { container } = render(<MilestoneTrack data={leadTime} />);
    const longSpan = screen.getByRole('button', { name: /Project → first invoice/ });
    const role = screen.getByRole('button', { name: /First role/ });
    // Bubble sits in the role → invoice gap, i.e. to the right of the First role station.
    expect(leftOf(longSpan)).toBeGreaterThan(leftOf(role));
    expect(container.querySelector('.tcl-milestone-track__whisker')).not.toBeNull();
    // The adjacent metric spans a single gap — exactly one whisker for the long span.
    expect(container.querySelectorAll('.tcl-milestone-track__whisker')).toHaveLength(1);
  });

  it('gives contended metrics an earlier free gap and omits metrics with no free gap', () => {
    const data: MilestoneTrackContract = {
      stations: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
        { id: 'c', label: 'C' },
      ],
      metrics: [
        { id: 'm1', from: 'b', to: 'c', value: 1, label: 'B to C' },
        { id: 'm2', from: 'a', to: 'c', value: 2, label: 'A to C' },
        { id: 'm3', from: 'a', to: 'c', value: 3, label: 'crowded out' },
      ],
    };
    render(<MilestoneTrack data={data} />);
    const m1 = screen.getByRole('button', { name: /B to C/ });
    const m2 = screen.getByRole('button', { name: /A to C/ });
    expect(leftOf(m2)).toBeLessThan(leftOf(m1));
    expect(screen.queryByRole('button', { name: /crowded out/ })).toBeNull();
  });

  it('skips unresolvable, degenerate and negative metrics; resolves label refs and inverted spans', () => {
    const data: MilestoneTrackContract = {
      stations: [
        { id: 'a', label: 'Alpha' },
        { id: 'b', label: 'Beta' },
      ],
      metrics: [
        { from: 'ghost', to: 'b', value: 1, label: 'unresolvable' },
        { from: 'a', to: 'a', value: 1, label: 'degenerate' },
        { from: 'a', to: 'b', value: -4, label: 'negative' },
        { from: 'Beta', to: 'Alpha', value: 5, label: 'inverted by label' },
      ],
    };
    render(<MilestoneTrack data={data} />);
    expect(screen.queryByRole('button', { name: /unresolvable/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /degenerate/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /negative/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'inverted by label: 5 d' })).toBeInTheDocument();
  });

  it('uniquifies duplicate station ids so one click selects one stop', async () => {
    const user = userEvent.setup();
    render(
      <MilestoneTrack
        data={{
          stations: [
            { id: 'x', label: 'First' },
            { id: 'x', label: 'Second' },
          ],
        }}
      />,
    );
    const second = screen.getByRole('button', { name: 'Second — Complete' });
    await user.click(second);
    expect(second).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'First — Complete' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('shows no share meter for a single metric and no auto total for mixed units', () => {
    const single: MilestoneTrackContract = {
      stations: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ],
      metrics: [{ from: 'a', to: 'b', value: 3, label: 'only' }],
    };
    const { container, rerender } = render(<MilestoneTrack data={single} />);
    expect(container.querySelector('.tcl-milestone-track__bubble-meter')).toBeNull();
    expect(screen.getByText('3 d measured')).toBeInTheDocument();

    const mixed: MilestoneTrackContract = {
      stations: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
        { id: 'c', label: 'C' },
      ],
      metrics: [
        { from: 'a', to: 'b', value: 3, label: 'days leg' },
        { from: 'b', to: 'c', value: 4, unit: 'h', label: 'hours leg' },
      ],
    };
    rerender(<MilestoneTrack data={mixed} />);
    expect(container.querySelector('.tcl-milestone-track__bubble-meter')).toBeNull();
    expect(screen.queryByText(/measured$/)).toBeNull();
  });

  it('renders the empty state without a rail', () => {
    render(<MilestoneTrack data={{ stations: [] }} />);
    expect(screen.getByText('No milestones to chart')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('keys whiskers by their bubble, so co-starting long spans render without duplicate keys', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const data: MilestoneTrackContract = {
      stations: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
        { id: 'c', label: 'C' },
        { id: 'd', label: 'D' },
      ],
      metrics: [
        { id: 'm1', from: 'a', to: 'c', value: 1 },
        { id: 'm2', from: 'a', to: 'd', value: 2 },
      ],
    };
    const { container } = render(<MilestoneTrack data={data} />);
    expect(container.querySelectorAll('.tcl-milestone-track__whisker')).toHaveLength(2);
    expect(spy.mock.calls.flat().join(' ')).not.toMatch(/same key/i);
    spy.mockRestore();
  });

  it('uniquifies duplicate group ids so band chrome keeps unique keys', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <MilestoneTrack
        data={{
          stations: [
            { id: 'a', label: 'A' },
            { id: 'b', label: 'B' },
          ],
          groups: [
            { id: 'g', label: 'One', from: 'a', to: 'a' },
            { id: 'g', label: 'Two', from: 'b', to: 'b' },
          ],
        }}
      />,
    );
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('Two')).toBeInTheDocument();
    expect(spy.mock.calls.flat().join(' ')).not.toMatch(/same key/i);
    spy.mockRestore();
  });

  it('normalizes unknown statuses to done instead of resolving the prototype chain', () => {
    render(
      <MilestoneTrack
        data={{ stations: [{ id: 'a', label: 'X', status: 'constructor' as never }] }}
      />,
    );
    const button = screen.getByRole('button', { name: 'X — Complete' });
    expect(button).toHaveAttribute('data-status', 'done');
  });

  it('never hands an authored id to another station as an index fallback', () => {
    render(
      <MilestoneTrack
        data={{ stations: [{ label: 'A' }, { id: 's0', label: 'B' }] }}
        selectedId="s0"
      />,
    );
    expect(screen.getByRole('button', { name: 'B — Complete' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'A — Complete' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('computes total and shares when metrics uniformly override the track unit', () => {
    const { container } = render(
      <MilestoneTrack
        data={{
          unit: 'd',
          stations: [
            { id: 'a', label: 'A' },
            { id: 'b', label: 'B' },
            { id: 'c', label: 'C' },
          ],
          metrics: [
            { from: 'a', to: 'b', value: 2, unit: 'h' },
            { from: 'b', to: 'c', value: 6, unit: 'h' },
          ],
        }}
      />,
    );
    expect(screen.getByText('8 h measured')).toBeInTheDocument();
    expect(container.querySelectorAll('.tcl-milestone-track__bubble-meter')).toHaveLength(2);
  });

  it('announces "<1%" rather than 0% for a tiny nonzero share', async () => {
    const user = userEvent.setup();
    render(
      <MilestoneTrack
        data={{
          stations: [
            { id: 'a', label: 'A' },
            { id: 'b', label: 'B' },
            { id: 'c', label: 'C' },
          ],
          metrics: [
            { id: 'tiny', from: 'a', to: 'b', value: 0.1, label: 'tiny leg' },
            { from: 'b', to: 'c', value: 99.9, label: 'huge leg' },
          ],
        }}
      />,
    );
    await user.click(screen.getByRole('button', { name: /tiny leg/ }));
    expect(screen.getByText('<1% of measured lead time')).toBeInTheDocument();
  });

  it('normalizes junk metric tones to the warning default (own-property guard)', () => {
    render(
      <MilestoneTrack
        data={{
          stations: [
            { id: 'a', label: 'A' },
            { id: 'b', label: 'B' },
          ],
          metrics: [{ from: 'a', to: 'b', value: 1, label: 'junk tone', tone: 'constructor' as never }],
        }}
      />,
    );
    const bubble = screen.getByRole('button', { name: 'junk tone: 1 d' });
    expect(bubble.style.getPropertyValue('--bubble-tone')).toBe('var(--tcl-status-warning)');
  });

  it('has no axe violations', async () => {
    const { container } = render(<MilestoneTrack data={leadTime} defaultSelectedId="opp" />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
