import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '@trembus/tokens/testing';
import { TalentTree } from './TalentTree';
import type { TalentTreeContract } from './TalentTree';

// A compact fixture exercising prereqs, a rank-prereq, and a tier gate.
const TREE: TalentTreeContract = {
  title: 'Test Tree',
  points: 10,
  tiers: [{ label: 'One' }, { label: 'Two' }, { label: 'Three', gate: 3 }],
  nodes: [
    { id: 'a', label: 'Alpha', tier: 0, maxRank: 2 },
    { id: 'b', label: 'Bravo', tier: 0 },
    { id: 'c', label: 'Charlie', tier: 1, requires: ['a'] },
    { id: 'd', label: 'Delta', tier: 1, requires: [{ id: 'a', rank: 2 }] },
    { id: 'e', label: 'Echo', tier: 2, requires: ['c'] },
  ],
};

const node = (name: string): HTMLElement =>
  screen.getByRole('button', { name: new RegExp(`^${name},`) });
const nodeButtons = (): HTMLElement[] =>
  screen.getAllByRole('button').filter((b) => b.getAttribute('aria-pressed') !== null);
const live = (container: HTMLElement): HTMLElement =>
  container.querySelector('[aria-live="polite"]') as HTMLElement;

describe('TalentTree — structure & a11y', () => {
  it('renders one focusable button per node inside a labelled group', () => {
    render(<TalentTree data={TREE} />);
    expect(nodeButtons()).toHaveLength(5);
    expect(screen.getByRole('group', { name: /Test Tree/ })).toBeInTheDocument();
    expect(node('Alpha')).toHaveAttribute('aria-label', expect.stringContaining('rank 0 of 2'));
  });

  it('leaves exactly one roving tab stop', () => {
    render(<TalentTree data={TREE} defaultSelectedId="c" />);
    const tabbable = nodeButtons().filter((b) => b.tabIndex === 0);
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]).toHaveAttribute('aria-label', expect.stringContaining('Charlie'));
  });

  it('keeps a locked node focusable via aria-disabled (never removed)', () => {
    render(<TalentTree data={TREE} />);
    // Echo is locked (behind the tier-2 gate and prereq); still a real button.
    expect(node('Echo')).toHaveAttribute('aria-disabled', 'true');
    expect(node('Echo').tabIndex).toBeGreaterThanOrEqual(-1);
  });

  it('has no axe violations (allocated + locked + inspector actions rendered)', async () => {
    const { container } = render(
      <TalentTree data={TREE} defaultAllocated={{ a: 2, c: 1 }} defaultSelectedId="a" />,
    );
    expect(await a11yViolations(container)).toEqual([]);
  });

  it('has no axe violations in read-only mode', async () => {
    const { container } = render(
      <TalentTree data={TREE} readOnly allocated={{ a: 1 }} defaultSelectedId="a" />,
    );
    expect(await a11yViolations(container)).toEqual([]);
  });
});

describe('TalentTree — allocation guards', () => {
  it('blocks allocation until a prerequisite is met', async () => {
    const user = userEvent.setup();
    render(<TalentTree data={TREE} />);
    await user.click(node('Charlie')); // a not allocated → locked
    expect(node('Charlie')).toHaveAttribute('aria-label', expect.stringContaining('rank 0'));

    await user.click(node('Alpha')); // a → 1
    await user.click(node('Charlie')); // now available → 1
    expect(node('Charlie')).toHaveAttribute('aria-label', expect.stringContaining('rank 1'));
  });

  it('honors a rank prerequisite (Delta needs Alpha at rank 2)', async () => {
    const user = userEvent.setup();
    render(<TalentTree data={TREE} defaultAllocated={{ a: 1 }} />);
    await user.click(node('Delta')); // a only rank 1 → blocked
    expect(node('Delta')).toHaveAttribute('aria-label', expect.stringContaining('rank 0'));

    await user.click(node('Alpha')); // a → 2
    await user.click(node('Delta')); // now unlocked
    expect(node('Delta')).toHaveAttribute('aria-label', expect.stringContaining('rank 1'));
  });

  it('blocks allocation that would exceed the points budget', async () => {
    const user = userEvent.setup();
    const tree: TalentTreeContract = {
      points: 1,
      nodes: [
        { id: 'x', label: 'Xray', tier: 0 },
        { id: 'y', label: 'Yankee', tier: 0, cost: 2 },
      ],
    };
    render(<TalentTree data={tree} />);
    await user.click(node('Yankee')); // costs 2, only 1 point → blocked
    expect(node('Yankee')).toHaveAttribute('aria-label', expect.stringContaining('rank 0'));
  });

  it('blocks allocation behind an unmet tier gate', async () => {
    const user = userEvent.setup();
    render(<TalentTree data={TREE} defaultAllocated={{ a: 1, c: 1 }} />);
    // spentBelow(tier 2) = 2 < gate 3 → Echo locked even though its prereq (c) is met.
    await user.click(node('Echo'));
    expect(node('Echo')).toHaveAttribute('aria-label', expect.stringContaining('rank 0'));
    expect(node('Echo')).toHaveAttribute('aria-disabled', 'true');
  });

  it('opens a gated tier once enough points are spent below it', async () => {
    const user = userEvent.setup();
    render(<TalentTree data={TREE} defaultAllocated={{ a: 2, c: 1 }} />);
    // spentBelow(tier 2) = 3 >= gate 3 → Echo available.
    expect(node('Echo')).not.toHaveAttribute('aria-disabled');
    await user.click(node('Echo'));
    expect(node('Echo')).toHaveAttribute('aria-label', expect.stringContaining('rank 1'));
  });

  it('does not allocate past maxRank', async () => {
    const user = userEvent.setup();
    render(<TalentTree data={TREE} defaultAllocated={{ a: 2 }} />);
    expect(node('Alpha')).toHaveAttribute('aria-label', expect.stringContaining('maxed'));
    await user.click(node('Alpha')); // already 2 of 2
    expect(node('Alpha')).toHaveAttribute('aria-label', expect.stringContaining('rank 2 of 2'));
  });
});

describe('TalentTree — safe deallocation', () => {
  it('blocks removing a rank that would orphan an allocated dependent', () => {
    render(<TalentTree data={TREE} defaultAllocated={{ a: 1, c: 1 }} defaultSelectedId="a" />);
    // c depends on a>=1, so a cannot drop below 1.
    fireEvent.click(node('Alpha'), { shiftKey: true });
    expect(node('Alpha')).toHaveAttribute('aria-label', expect.stringContaining('rank 1'));
  });

  it('blocks a removal that would drop an allocated node below its tier gate', () => {
    // Recompute case: removing a tier-0 point pushes Echo below the tier-2 gate.
    render(
      <TalentTree data={TREE} defaultAllocated={{ a: 2, c: 1, e: 1 }} defaultSelectedId="a" />,
    );
    fireEvent.click(node('Alpha'), { shiftKey: true }); // would make spentBelow(2)=2 < gate 3
    expect(node('Alpha')).toHaveAttribute('aria-label', expect.stringContaining('rank 2'));
  });

  it('allows deallocating to repair an illegal controlled map (violations do not grow)', () => {
    const onChange = vi.fn();
    // c allocated but a is not → c is already a violation; removing c is allowed (repair).
    render(
      <TalentTree
        data={TREE}
        allocated={{ c: 1 }}
        onAllocatedChange={onChange}
        defaultSelectedId="c"
      />,
    );
    fireEvent.click(node('Charlie'), { shiftKey: true });
    expect(onChange).toHaveBeenCalledWith(expect.not.objectContaining({ c: expect.anything() }), {
      id: 'c',
      rank: 0,
    });
  });
});

describe('TalentTree — controlled / uncontrolled', () => {
  it('uncontrolled: Enter increments and fires onAllocatedChange with the next map', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TalentTree data={TREE} onAllocatedChange={onChange} defaultSelectedId="a" />);
    node('Alpha').focus();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith({ a: 1 }, { id: 'a', rank: 1 });
    expect(node('Alpha')).toHaveAttribute('aria-label', expect.stringContaining('rank 1'));
  });

  it('uncontrolled: removing the last rank deletes the key from the next map', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TalentTree data={TREE} defaultAllocated={{ a: 1 }} onAllocatedChange={onChange} />);
    node('Alpha').focus();
    await user.keyboard('-');
    const lastNext = onChange.mock.calls.at(-1)![0];
    expect(lastNext).not.toHaveProperty('a');
  });

  it('controlled: internal state is not mutated, but the callback still fires', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TalentTree data={TREE} allocated={{}} onAllocatedChange={onChange} />);
    await user.click(node('Alpha'));
    expect(onChange).toHaveBeenCalledWith({ a: 1 }, { id: 'a', rank: 1 });
    expect(node('Alpha')).toHaveAttribute('aria-label', expect.stringContaining('rank 0')); // unchanged
  });

  it('controlled: the tab stop re-seeds when selectedId actually changes', () => {
    const { rerender } = render(<TalentTree data={TREE} selectedId="a" />);
    expect(node('Alpha').tabIndex).toBe(0);
    rerender(<TalentTree data={TREE} selectedId="b" />);
    expect(node('Bravo').tabIndex).toBe(0);
    expect(node('Alpha').tabIndex).toBe(-1);
  });
});

describe('TalentTree — degradation (never throws)', () => {
  it('drops duplicate ids (first wins)', () => {
    render(
      <TalentTree
        data={{
          nodes: [
            { id: 'a', label: 'First', tier: 0 },
            { id: 'a', label: 'Second', tier: 0 },
          ],
        }}
      />,
    );
    expect(nodeButtons()).toHaveLength(1);
    expect(screen.getByRole('button', { name: /^First,/ })).toBeInTheDocument();
  });

  it('drops a dangling requirement so the node stays allocatable', async () => {
    const user = userEvent.setup();
    render(
      <TalentTree data={{ nodes: [{ id: 'a', label: 'Alpha', tier: 0, requires: ['ghost'] }] }} />,
    );
    await user.click(node('Alpha'));
    expect(node('Alpha')).toHaveAttribute('aria-label', expect.stringContaining('rank 1'));
  });

  it('breaks a two-node requirement cycle so both stay allocatable', async () => {
    const user = userEvent.setup();
    render(
      <TalentTree
        data={{
          nodes: [
            { id: 'a', label: 'Alpha', requires: ['b'] },
            { id: 'b', label: 'Bravo', requires: ['a'] },
          ],
        }}
      />,
    );
    // One of them floors as a root (cycle broken); at least one is immediately allocatable.
    await user.click(node('Alpha'));
    await user.click(node('Bravo'));
    const alpha = node('Alpha').getAttribute('aria-label')!.includes('rank 1');
    const bravo = node('Bravo').getAttribute('aria-label')!.includes('rank 1');
    expect(alpha || bravo).toBe(true);
  });

  it('compresses tier gaps (nodes at tier 0 and tier 5 → two rows)', () => {
    render(
      <TalentTree
        data={{
          nodes: [
            { id: 'a', label: 'Alpha', tier: 0 },
            { id: 'z', label: 'Zulu', tier: 5, requires: ['a'] },
          ],
        }}
      />,
    );
    const ay = parseFloat(node('Alpha').style.top.replace('%', ''));
    const zy = parseFloat(node('Zulu').style.top.replace('%', ''));
    expect(ay).toBeGreaterThan(0);
    expect(zy).toBeGreaterThan(ay); // Zulu sits in the row directly below, not five rows down
  });

  it('clamps an over-max controlled rank everywhere (name + spend)', () => {
    render(<TalentTree data={TREE} allocated={{ a: 99 }} />);
    // a maxRank 2 → clamped to 2 in the name and in the meter.
    expect(node('Alpha')).toHaveAttribute('aria-label', expect.stringContaining('rank 2 of 2'));
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '2');
  });

  it('renders an empty state for no nodes', () => {
    render(<TalentTree data={{ nodes: [] }} />);
    expect(screen.getByText(/no talents to display/i)).toBeInTheDocument();
  });

  it('treats a non-finite points budget as unlimited (never renders NaN)', () => {
    render(
      <TalentTree data={{ points: Number.NaN, nodes: [{ id: 'a', label: 'Alpha', cost: 1 }] }} />,
    );
    expect(screen.queryByRole('meter')).toBeNull(); // no meter for a junk budget
    expect(document.body.textContent).not.toMatch(/NaN/);
  });
});

describe('TalentTree — layout', () => {
  it('clamps every node position into 0–100%', () => {
    render(<TalentTree data={TREE} />);
    for (const btn of nodeButtons()) {
      const left = parseFloat(btn.style.left.replace('%', ''));
      const top = parseFloat(btn.style.top.replace('%', ''));
      expect(left).toBeGreaterThanOrEqual(0);
      expect(left).toBeLessThanOrEqual(100);
      expect(top).toBeGreaterThanOrEqual(0);
      expect(top).toBeLessThanOrEqual(100);
    }
  });
});

describe('TalentTree — keyboard', () => {
  it('roves within a row and across tiers, selection following focus', async () => {
    const user = userEvent.setup();
    render(<TalentTree data={TREE} defaultSelectedId="a" />);
    node('Alpha').focus();
    await user.keyboard('{ArrowRight}'); // → Bravo (same row)
    expect(node('Bravo')).toHaveAttribute('aria-pressed', 'true');
    await user.keyboard('{ArrowDown}'); // → nearest node in the next tier
    const pressed = nodeButtons().find((b) => b.getAttribute('aria-pressed') === 'true')!;
    expect(pressed.getAttribute('aria-label')).toMatch(/Charlie|Delta/);
  });

  it('Enter allocates, Minus deallocates', async () => {
    const user = userEvent.setup();
    render(<TalentTree data={TREE} defaultSelectedId="a" />);
    node('Alpha').focus();
    await user.keyboard('{Enter}');
    expect(node('Alpha')).toHaveAttribute('aria-label', expect.stringContaining('rank 1'));
    await user.keyboard('-');
    expect(node('Alpha')).toHaveAttribute('aria-label', expect.stringContaining('rank 0'));
  });

  it('Space allocates exactly one rank (no double-fire with the click handler)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TalentTree data={TREE} onAllocatedChange={onChange} defaultSelectedId="a" />);
    node('Alpha').focus();
    await user.keyboard(' ');
    expect(node('Alpha')).toHaveAttribute('aria-label', expect.stringContaining('rank 1 of 2'));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('Enter on a locked node selects only (no allocation)', async () => {
    const user = userEvent.setup();
    render(<TalentTree data={TREE} />);
    node('Echo').focus();
    await user.keyboard('{Enter}');
    expect(node('Echo')).toHaveAttribute('aria-pressed', 'true'); // selected
    expect(node('Echo')).toHaveAttribute('aria-label', expect.stringContaining('rank 0')); // not allocated
  });
});

describe('TalentTree — announcements & meter', () => {
  it('announces the selection with rank, points, and prerequisite words', () => {
    const { container } = render(
      <TalentTree data={TREE} defaultAllocated={{ a: 2 }} defaultSelectedId="c" />,
    );
    const text = live(container).textContent ?? '';
    expect(text).toContain('Charlie');
    expect(text).toMatch(/Requires:.*Alpha.*met/);
    expect(text).toMatch(/points spent/);
  });

  it('states the deallocation blocker in words', () => {
    const { container } = render(
      <TalentTree data={TREE} defaultAllocated={{ a: 1, c: 1 }} defaultSelectedId="a" />,
    );
    expect(live(container).textContent).toMatch(/would lock: Charlie/);
  });

  it('clamps the meter and keeps an honest over-budget valuetext', () => {
    const tree: TalentTreeContract = {
      points: 3,
      nodes: [{ id: 'a', label: 'Alpha', tier: 0, maxRank: 5 }],
    };
    render(<TalentTree data={tree} allocated={{ a: 5 }} />);
    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuenow', '3'); // clamped to max
    expect(meter).toHaveAttribute('aria-valuetext', '5 of 3 points spent — over budget');
  });
});
