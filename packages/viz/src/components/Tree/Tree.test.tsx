import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '@trembus/tokens/testing';
import { Tree } from './Tree';
import type { TreeContract } from './Tree';

const org: TreeContract = {
  title: 'Org',
  nodes: [
    { id: 'root', label: 'Root', note: 'the top' },
    { id: 'a', label: 'A', parentId: 'root' },
    { id: 'b', label: 'B', parentId: 'root' },
    { id: 'a1', label: 'A1', parentId: 'a', note: 'leaf a1' },
  ],
};

/** Node buttons carry aria-pressed; toggles carry aria-expanded. */
function nodeButtons(): HTMLElement[] {
  return screen.getAllByRole('button').filter((b) => b.hasAttribute('aria-pressed'));
}

describe('Tree', () => {
  it('renders one button per node, by accessible name', () => {
    render(<Tree data={org} />);
    expect(nodeButtons()).toHaveLength(4);
    expect(screen.getByRole('button', { name: /^Root, level 1/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^A, level 2/ })).toBeInTheDocument();
  });

  it('encodes the path-to-root in the accessible name', () => {
    render(<Tree data={org} />);
    // A1 is under A under Root → "A1, level 3, Root › A"
    expect(screen.getByRole('button', { name: 'A1, level 3, Root › A' })).toBeInTheDocument();
    // a root reads "level 1, root"
    expect(screen.getByRole('button', { name: 'Root, level 1, root' })).toBeInTheDocument();
  });

  it('renders a forest (multiple roots) without throwing', () => {
    const forest: TreeContract = {
      nodes: [
        { id: 'r1', label: 'R1' },
        { id: 'r2', label: 'R2' },
        { id: 'c', label: 'C', parentId: 'r1' },
      ],
    };
    expect(() => render(<Tree data={forest} />)).not.toThrow();
    expect(screen.getByRole('button', { name: /^R1/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^R2/ })).toBeInTheDocument();
  });

  it('degrades a missing parent to a root (no throw)', () => {
    const dangling: TreeContract = { nodes: [{ id: 'x', label: 'X', parentId: 'ghost' }] };
    expect(() => render(<Tree data={dangling} />)).not.toThrow();
    expect(screen.getByRole('button', { name: 'X, level 1, root' })).toBeInTheDocument();
  });

  it('survives a parent cycle (no throw)', () => {
    const cyclic: TreeContract = {
      nodes: [
        { id: 'a', label: 'A', parentId: 'b' },
        { id: 'b', label: 'B', parentId: 'a' },
      ],
    };
    expect(() => render(<Tree data={cyclic} />)).not.toThrow();
    expect(nodeButtons()).toHaveLength(2);
  });

  it('drops duplicate ids (first wins) with no duplicate-key warning', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const dup: TreeContract = {
      nodes: [
        { id: 'd', label: 'First' },
        { id: 'd', label: 'Second' },
        { id: 'c', label: 'Child', parentId: 'd' },
      ],
    };
    render(<Tree data={dup} />);
    expect(screen.getByRole('button', { name: /^First/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Second/ })).toBeNull();
    expect(nodeButtons()).toHaveLength(2);
    expect(spy).not.toHaveBeenCalledWith(
      expect.stringContaining('Encountered two children with the same key'),
    );
    spy.mockRestore();
  });

  it('selects a node (uncontrolled): aria-pressed, inspector note, onSelect', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Tree data={org} onSelect={onSelect} />);
    const a1 = screen.getByRole('button', { name: /^A1, level 3/ });
    expect(a1).toHaveAttribute('aria-pressed', 'false');
    await user.click(a1);
    expect(a1).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('leaf a1')).toBeInTheDocument();
    expect(onSelect).toHaveBeenCalledWith('a1');
  });

  it('respects a controlled selectedId (click fires onSelect but does not move the ring)', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Tree data={org} selectedId="a" onSelect={onSelect} />);
    expect(screen.getByRole('button', { name: /^A, level 2/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const a1 = screen.getByRole('button', { name: /^A1, level 3/ });
    await user.click(a1);
    expect(onSelect).toHaveBeenCalledWith('a1');
    expect(a1).toHaveAttribute('aria-pressed', 'false'); // controlled — parent didn't move it
  });

  it('highlights the ancestor lineage of the selected node', async () => {
    const user = userEvent.setup();
    render(<Tree data={org} />);
    await user.click(screen.getByRole('button', { name: /^A1, level 3/ }));
    // A1's ancestors (A, Root) carry the lineage class.
    expect(screen.getByRole('button', { name: /^Root, level 1/ })).toHaveClass('is-lineage');
    expect(screen.getByRole('button', { name: /^A, level 2/ })).toHaveClass('is-lineage');
    // B (not an ancestor) does not.
    expect(screen.getByRole('button', { name: /^B, level 2/ })).not.toHaveClass('is-lineage');
  });

  it('collapses a subtree (uncontrolled): descendants leave, aria-expanded flips', async () => {
    const user = userEvent.setup();
    render(<Tree data={org} />);
    expect(screen.getByRole('button', { name: /^A1, level 3/ })).toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: 'Collapse A' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await user.click(toggle);
    expect(screen.queryByRole('button', { name: /^A1, level 3/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Expand A' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await user.click(screen.getByRole('button', { name: 'Expand A' }));
    expect(screen.getByRole('button', { name: /^A1, level 3/ })).toBeInTheDocument();
  });

  it('respects controlled collapsedIds + fires onToggle', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<Tree data={org} collapsedIds={['a']} onToggle={onToggle} />);
    // A's subtree is collapsed → A1 hidden.
    expect(screen.queryByRole('button', { name: /^A1, level 3/ })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Expand A' }));
    expect(onToggle).toHaveBeenCalledWith('a', false); // false = now expanded
    // Controlled — internal state untouched, so A1 stays hidden until the parent updates.
    expect(screen.queryByRole('button', { name: /^A1, level 3/ })).toBeNull();
  });

  it('clamps every node within the plot box', () => {
    // A deliberately wide + deep tree.
    const wide: TreeContract = {
      nodes: [
        { id: 'r', label: 'R' },
        ...Array.from({ length: 12 }, (_, i) => ({ id: `n${i}`, label: `N${i}`, parentId: 'r' })),
        ...Array.from({ length: 12 }, (_, i) => ({
          id: `m${i}`,
          label: `M${i}`,
          parentId: `n${i}`,
        })),
      ],
    };
    const { container } = render(<Tree data={wide} />);
    const wraps = container.querySelectorAll<HTMLElement>('.tcl-tree__node-wrap');
    expect(wraps.length).toBeGreaterThan(0);
    for (const w of wraps) {
      const left = parseFloat(w.style.left);
      const top = parseFloat(w.style.top);
      expect(left).toBeGreaterThanOrEqual(0);
      expect(left).toBeLessThanOrEqual(100);
      expect(top).toBeGreaterThanOrEqual(0);
      expect(top).toBeLessThanOrEqual(100);
    }
  });

  it('exposes a group role for the figure', () => {
    render(<Tree data={org} />);
    expect(screen.getByRole('group', { name: /tree/i })).toBeInTheDocument();
  });

  it('renders an empty state for no nodes', () => {
    render(<Tree data={{ nodes: [] }} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.getByText(/No nodes to display/)).toBeInTheDocument();
  });

  it('updates the live inspector region on selection', async () => {
    const user = userEvent.setup();
    const { container } = render(<Tree data={org} />);
    const live = container.querySelector('[aria-live="polite"]')!;
    expect(within(live as HTMLElement).getByText(/Select a node/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Root, level 1/ }));
    expect(within(live as HTMLElement).getByText('the top')).toBeInTheDocument();
  });

  it('includes a node sub in its accessible name (SR parity with the visible box text)', () => {
    render(
      <Tree
        data={{
          nodes: [
            { id: 'root', label: 'Platform', sub: '3 reports' },
            { id: 'k', label: 'Kid', parentId: 'root', sub: 'Engineering' },
          ],
        }}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Platform, 3 reports, level 1, root' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Kid, Engineering, level 2, Platform' }),
    ).toBeInTheDocument();
  });

  it('renders the full tree even when a node id collides with the synthetic root', () => {
    const collide: TreeContract = {
      nodes: [
        { id: '__tcl_tree_root__', label: 'Sentinel' },
        { id: 'c', label: 'Child', parentId: '__tcl_tree_root__' },
      ],
    };
    expect(() => render(<Tree data={collide} />)).not.toThrow();
    // The tree must NOT blank — both nodes render despite the id collision.
    expect(screen.getByRole('button', { name: /^Sentinel/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Child/ })).toBeInTheDocument();
    expect(nodeButtons()).toHaveLength(2);
  });

  it('has no axe violations', async () => {
    const { container } = render(<Tree data={org} />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
