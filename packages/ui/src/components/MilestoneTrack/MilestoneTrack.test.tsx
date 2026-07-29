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

  it('never hands an authored id to another metric as an index fallback', () => {
    render(
      <MilestoneTrack
        data={{
          stations: [
            { id: 'a', label: 'A' },
            { id: 'b', label: 'B' },
            { id: 'c', label: 'C' },
          ],
          metrics: [
            { from: 'a', to: 'b', value: 1, label: 'anon' },
            { id: 'm0', from: 'b', to: 'c', value: 2, label: 'named' },
          ],
        }}
        selectedId="m0"
      />,
    );
    expect(screen.getByRole('button', { name: 'named: 2 d' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'anon: 1 d' })).toHaveAttribute(
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
          metrics: [
            { from: 'a', to: 'b', value: 1, label: 'junk tone', tone: 'constructor' as never },
          ],
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

  // ── serpentine rows + scaled capsules ──

  const snake: MilestoneTrackContract = {
    title: 'Snaking lead time',
    unit: 'd',
    stations: [
      { id: 'opp', label: 'Opportunity' },
      { id: 'ticket', label: 'Ticket created' },
      { id: 'project', label: 'Project created' },
      { id: 'role', label: 'First role' },
      { id: 'invoice', label: 'First invoice' },
    ],
    metrics: [
      {
        id: 'ticket-project',
        from: 'ticket',
        to: 'project',
        value: 2.6,
        label: 'Ticket → project',
      },
      { id: 'role-invoice', from: 'role', to: 'invoice', value: 26.3, label: 'Role → invoice' },
    ],
    groups: [
      { id: 'sf', label: 'Salesforce', from: 'opp', to: 'opp' },
      { id: 'jsd', label: 'Jira Service Desk', from: 'ticket', to: 'project' },
      { id: 'proj', label: 'Projector', from: 'role', to: 'invoice' },
    ],
  };

  const topOf = (el: HTMLElement): number => Number.parseFloat(el.style.top);

  it('serpentine partitions one row per group, stacked in flow order', () => {
    render(<MilestoneTrack data={snake} layout="serpentine" />);
    const opp = screen.getByRole('button', { name: 'Opportunity — Complete — Salesforce' });
    const ticket = screen.getByRole('button', {
      name: 'Ticket created — Complete — Jira Service Desk',
    });
    const project = screen.getByRole('button', {
      name: 'Project created — Complete — Jira Service Desk',
    });
    const role = screen.getByRole('button', { name: 'First role — Complete — Projector' });
    const invoice = screen.getByRole('button', { name: 'First invoice — Complete — Projector' });
    expect(topOf(opp)).toBeLessThan(topOf(ticket));
    expect(topOf(ticket)).toBe(topOf(project));
    expect(topOf(project)).toBeLessThan(topOf(role));
    expect(topOf(role)).toBe(topOf(invoice));
  });

  it('gives stations outside any group their own orphan rows', () => {
    render(
      <MilestoneTrack
        layout="serpentine"
        data={{
          stations: [
            { id: 'a', label: 'A' },
            { id: 'b', label: 'B' },
            { id: 'c', label: 'C' },
          ],
          groups: [{ id: 'mid', label: 'Mid', from: 'b', to: 'b' }],
        }}
      />,
    );
    const a = screen.getByRole('button', { name: 'A — Complete' });
    const b = screen.getByRole('button', { name: 'B — Complete — Mid' });
    const c = screen.getByRole('button', { name: 'C — Complete' });
    expect(topOf(a)).toBeLessThan(topOf(b));
    expect(topOf(b)).toBeLessThan(topOf(c));
    expect(screen.getByText('Mid')).toBeInTheDocument();
  });

  it('skips overlapping groups as row-makers (first-sorted wins) but keeps their accessible names', () => {
    render(
      <MilestoneTrack
        layout="serpentine"
        data={{
          stations: [
            { id: 'a', label: 'A' },
            { id: 'b', label: 'B' },
            { id: 'c', label: 'C' },
            { id: 'd', label: 'D' },
          ],
          groups: [
            { id: 'one', label: 'One', from: 'a', to: 'c' },
            { id: 'two', label: 'Two', from: 'b', to: 'd' },
          ],
        }}
      />,
    );
    const a = screen.getByRole('button', { name: 'A — Complete — One' });
    const c = screen.getByRole('button', { name: 'C — Complete — One' });
    // D is only covered by the skipped group — the name keeps it, the rows don't.
    const d = screen.getByRole('button', { name: 'D — Complete — Two' });
    expect(topOf(a)).toBe(topOf(c));
    expect(topOf(d)).toBeGreaterThan(topOf(c));
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.queryByText('Two')).toBeNull();
  });

  it('renders serpentine with no groups exactly like the rail (single row, no wrap)', () => {
    const flat: MilestoneTrackContract = {
      stations: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
        { id: 'c', label: 'C' },
      ],
      metrics: [{ from: 'a', to: 'c', value: 5, label: 'wide' }],
    };
    const positions = (root: HTMLElement): string[] =>
      Array.from(root.querySelectorAll('button')).map((b) => `${b.style.left}|${b.style.top}`);
    const rail = render(<MilestoneTrack data={flat} />);
    const serp = render(<MilestoneTrack data={flat} layout="serpentine" />);
    expect(positions(serp.container)).toEqual(positions(rail.container));
    expect(serp.container.querySelectorAll('.tcl-milestone-track__connector')).toHaveLength(0);
  });

  it('mirrors odd rows right-to-left while DOM order stays flow order', () => {
    render(<MilestoneTrack data={snake} layout="serpentine" />);
    const ticket = screen.getByRole('button', {
      name: 'Ticket created — Complete — Jira Service Desk',
    });
    const project = screen.getByRole('button', {
      name: 'Project created — Complete — Jira Service Desk',
    });
    // Row 2 flows right→left: the earlier station sits further right.
    expect(leftOf(ticket)).toBeGreaterThan(leftOf(project));
    expect(ticket.compareDocumentPosition(project) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('draws one U-turn connector per row break and a single arrowhead at the true end', () => {
    const { container } = render(<MilestoneTrack data={snake} layout="serpentine" />);
    expect(container.querySelectorAll('.tcl-milestone-track__connector')).toHaveLength(2);
    expect(container.querySelectorAll('.tcl-milestone-track__arrow')).toHaveLength(1);
  });

  it('renders a cross-row handoff bubble on the next row lead-in, between the boundary stations', () => {
    const handoff: MilestoneTrackContract = {
      ...snake,
      metrics: [
        ...(snake.metrics ?? []),
        {
          id: 'project-role',
          from: 'project',
          to: 'role',
          value: 11.4,
          label: 'Project → staffing',
        },
      ],
    };
    render(<MilestoneTrack data={handoff} layout="serpentine" />);
    const bubble = screen.getByRole('button', { name: 'Project → staffing: 11.4 d' });
    const project = screen.getByRole('button', {
      name: 'Project created — Complete — Jira Service Desk',
    });
    const role = screen.getByRole('button', { name: 'First role — Complete — Projector' });
    // Home row is the destination row: capsule top = that row's rail − half.
    expect(topOf(bubble)).toBe(topOf(role) + 16 - 46);
    // Lead-in geometry: turn corner + attach + pinch on a left→right row.
    expect(leftOf(bubble)).toBe(94);
    expect(leftOf(role)).toBe(240);
    // DOM (and tab) order stays flow order: project, handoff bubble, role.
    expect(project.compareDocumentPosition(bubble) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(bubble.compareDocumentPosition(role) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('dashes the connector when a boundary station is pending', () => {
    const pendingRole: MilestoneTrackContract = {
      ...snake,
      stations: snake.stations.map((s) =>
        s.id === 'role' ? { ...s, status: 'pending' as const } : s,
      ),
    };
    const { container } = render(<MilestoneTrack data={pendingRole} layout="serpentine" />);
    const connectors = container.querySelectorAll('.tcl-milestone-track__connector');
    expect(connectors[0]).not.toHaveClass('is-pending');
    expect(connectors[1]).toHaveClass('is-pending');
  });

  it('splits a cross-row measured span into per-row whisker runs with caps on their own rails', () => {
    const spanAcross: MilestoneTrackContract = {
      ...snake,
      metrics: [{ id: 'wide', from: 'ticket', to: 'role', value: 9, label: 'Ticket → staffing' }],
    };
    const { container } = render(<MilestoneTrack data={spanAcross} layout="serpentine" />);
    const whiskers = container.querySelectorAll('.tcl-milestone-track__whisker');
    expect(whiskers).toHaveLength(1);
    const caps = Array.from(
      whiskers[0].querySelectorAll('line:not(.tcl-milestone-track__whisker-run)'),
    );
    const runs = whiskers[0].querySelectorAll('.tcl-milestone-track__whisker-run');
    expect(caps).toHaveLength(2);
    expect(runs).toHaveLength(1);
    // The span ends live on different rows, so the caps sit on different rails.
    expect(caps[0].getAttribute('y1')).not.toBe(caps[1].getAttribute('y1'));
  });

  const uneven: MilestoneTrackContract = {
    stations: [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
      { id: 'c', label: 'C' },
    ],
    metrics: [
      { id: 'small', from: 'a', to: 'b', value: 2.6, label: 'small leg' },
      { id: 'big', from: 'b', to: 'c', value: 26.3, label: 'big leg' },
    ],
  };

  it('scales capsule heights by share: the worst bottleneck hits the max, tiny shares go compact', () => {
    render(<MilestoneTrack data={uneven} bubbleSizing="scaled" />);
    const big = screen.getByRole('button', { name: 'big leg: 26.3 d' });
    const small = screen.getByRole('button', { name: 'small leg: 2.6 d' });
    expect(big.style.height).toBe('128px');
    expect(big).not.toHaveAttribute('data-size');
    expect(small.style.height).toBe('66px');
    expect(small).toHaveAttribute('data-size', 'compact');
  });

  it('keeps every capsule at the uniform height by default, however uneven the values', () => {
    render(<MilestoneTrack data={uneven} />);
    expect(screen.getByRole('button', { name: 'big leg: 26.3 d' }).style.height).toBe('92px');
    expect(screen.getByRole('button', { name: 'small leg: 2.6 d' }).style.height).toBe('92px');
  });

  it('falls back to weights when shares are uncomputable, and ignores weights when they are not', () => {
    const mixed: MilestoneTrackContract = {
      stations: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
        { id: 'c', label: 'C' },
      ],
      metrics: [
        { id: 'days', from: 'a', to: 'b', value: 3, label: 'days leg' },
        { id: 'hours', from: 'b', to: 'c', value: 4, unit: 'h', label: 'hours leg' },
      ],
    };
    // Mixed units, no weights → silently uniform.
    const { rerender } = render(<MilestoneTrack data={mixed} bubbleSizing="scaled" />);
    expect(screen.getByRole('button', { name: 'days leg: 3 d' }).style.height).toBe('92px');
    expect(screen.getByRole('button', { name: 'hours leg: 4 h' }).style.height).toBe('92px');

    // Mixed units + weights → weight ratios drive the halves.
    rerender(
      <MilestoneTrack
        bubbleSizing="scaled"
        data={{
          ...mixed,
          metrics: [
            { id: 'days', from: 'a', to: 'b', value: 3, label: 'days leg', weight: 1 },
            { id: 'hours', from: 'b', to: 'c', value: 4, unit: 'h', label: 'hours leg', weight: 3 },
          ],
        }}
      />,
    );
    expect(screen.getByRole('button', { name: 'days leg: 3 d' }).style.height).toBe('82px');
    expect(screen.getByRole('button', { name: 'hours leg: 4 h' }).style.height).toBe('128px');

    // Shares computable → an authored weight cannot override them.
    rerender(
      <MilestoneTrack
        bubbleSizing="scaled"
        data={{
          ...uneven,
          metrics: (uneven.metrics ?? []).map((m) =>
            m.id === 'small' ? { ...m, weight: 100 } : m,
          ),
        }}
      />,
    );
    expect(screen.getByRole('button', { name: 'small leg: 2.6 d' }).style.height).toBe('66px');
  });

  it('lifts the label and the count/meter foot out of the capsule, adding rail headroom', () => {
    const { container, rerender } = render(<MilestoneTrack data={uneven} />);
    const inside = container.querySelector<HTMLElement>('.tcl-milestone-track__station');
    expect(container.firstElementChild).toHaveAttribute('data-labels', 'inside');
    expect(topOf(inside!)).toBe(84);

    rerender(<MilestoneTrack data={uneven} labelPlacement="outside" />);
    expect(container.firstElementChild).toHaveAttribute('data-labels', 'outside');
    // The rail drops by one label line so the escaped label clears the band chrome.
    expect(topOf(container.querySelector<HTMLElement>('.tcl-milestone-track__station')!)).toBe(108);
    // The count + meter travel together in a foot wrapper, still inside the button
    // (one hit target, one accessible name).
    const bubble = screen.getByRole('button', { name: 'big leg: 26.3 d' });
    const foot = bubble.querySelector('.tcl-milestone-track__bubble-foot');
    expect(foot).not.toBeNull();
    expect(foot?.querySelector('.tcl-milestone-track__bubble-meter')).not.toBeNull();
  });

  it('keeps the count and meter on a compact capsule when the labels sit outside', () => {
    const { container, rerender } = render(<MilestoneTrack data={uneven} bubbleSizing="scaled" />);
    // Inside: the compact capsule has no room, so the foot is hidden by CSS.
    expect(screen.getByRole('button', { name: 'small leg: 2.6 d' })).toHaveAttribute(
      'data-size',
      'compact',
    );
    rerender(<MilestoneTrack data={uneven} bubbleSizing="scaled" labelPlacement="outside" />);
    expect(container.firstElementChild).toHaveAttribute('data-labels', 'outside');
    expect(
      screen
        .getByRole('button', { name: 'small leg: 2.6 d' })
        .querySelector('.tcl-milestone-track__bubble-foot'),
    ).not.toBeNull();
  });

  it('renders row header chips instead of band chrome in serpentine', () => {
    const { container } = render(<MilestoneTrack data={snake} layout="serpentine" />);
    expect(container.querySelectorAll('.tcl-milestone-track__row-label')).toHaveLength(3);
    expect(container.querySelectorAll('.tcl-milestone-track__band')).toHaveLength(0);
    expect(container.querySelectorAll('.tcl-milestone-track__divider')).toHaveLength(0);
    expect(screen.getByText('Jira Service Desk')).toBeInTheDocument();
  });

  it('has no axe violations in serpentine with scaled capsules', async () => {
    const handoff: MilestoneTrackContract = {
      ...snake,
      metrics: [
        ...(snake.metrics ?? []),
        {
          id: 'project-role',
          from: 'project',
          to: 'role',
          value: 11.4,
          label: 'Project → staffing',
        },
      ],
    };
    const { container } = render(
      <MilestoneTrack
        data={handoff}
        layout="serpentine"
        bubbleSizing="scaled"
        defaultSelectedId="project-role"
      />,
    );
    expect(await a11yViolations(container)).toEqual([]);
  });
});
