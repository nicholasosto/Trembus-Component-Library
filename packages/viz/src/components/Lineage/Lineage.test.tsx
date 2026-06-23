import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '@trembus/tokens/testing';
import { Lineage } from './Lineage';
import type { GraphContract } from './Lineage';

const flow: GraphContract = {
  title: 'Flow',
  nodes: [
    { id: 'a', label: 'A', kind: 'source', note: 'the start' },
    { id: 'b', label: 'B', sub: 'mid' },
    { id: 'c', label: 'C' },
    { id: 'd', label: 'D' },
  ],
  edges: [
    { from: 'a', to: 'b' },
    { from: 'b', to: 'c' },
    { from: 'b', to: 'd' },
  ],
};

/** Node buttons carry aria-pressed. */
function nodeButtons(): HTMLElement[] {
  return screen.getAllByRole('button').filter((b) => b.hasAttribute('aria-pressed'));
}

describe('Lineage', () => {
  it('renders one button per node, folding sub + kind into the accessible name', () => {
    render(<Lineage data={flow} />);
    expect(nodeButtons()).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'A, source' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'B, mid' })).toBeInTheDocument();
  });

  it('drops edges with a missing endpoint without throwing', () => {
    const dangling: GraphContract = {
      nodes: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ],
      edges: [
        { from: 'a', to: 'ghost' },
        { from: 'a', to: 'b' },
      ],
    };
    expect(() => render(<Lineage data={dangling} />)).not.toThrow();
    expect(nodeButtons()).toHaveLength(2);
  });

  it('drops self-loops without throwing', () => {
    const selfish: GraphContract = {
      nodes: [{ id: 'a', label: 'A' }],
      edges: [{ from: 'a', to: 'a' }],
    };
    expect(() => render(<Lineage data={selfish} />)).not.toThrow();
    expect(nodeButtons()).toHaveLength(1);
  });

  it('survives a cycle (dagre cycle handling) without throwing', () => {
    const cyclic: GraphContract = {
      nodes: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ],
      edges: [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'a' },
      ],
    };
    expect(() => render(<Lineage data={cyclic} />)).not.toThrow();
    expect(nodeButtons()).toHaveLength(2);
  });

  it('drops duplicate node ids (first wins)', () => {
    const dup: GraphContract = {
      nodes: [
        { id: 'x', label: 'First' },
        { id: 'x', label: 'Second' },
      ],
      edges: [],
    };
    render(<Lineage data={dup} />);
    expect(screen.getByRole('button', { name: /^First/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Second/ })).toBeNull();
    expect(nodeButtons()).toHaveLength(1);
  });

  it('renders nodes even with no edges', () => {
    render(<Lineage data={{ nodes: [{ id: 'a', label: 'Solo' }], edges: [] }} />);
    expect(screen.getByRole('button', { name: /^Solo/ })).toBeInTheDocument();
  });

  it('selects a node (uncontrolled): aria-pressed, inspector note, onSelect', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Lineage data={flow} onSelect={onSelect} />);
    const a = screen.getByRole('button', { name: 'A, source' });
    await user.click(a);
    expect(a).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('the start')).toBeInTheDocument();
    expect(onSelect).toHaveBeenCalledWith('a');
  });

  it('respects a controlled selectedId', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Lineage data={flow} selectedId="a" onSelect={onSelect} />);
    expect(screen.getByRole('button', { name: 'A, source' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const b = screen.getByRole('button', { name: 'B, mid' });
    await user.click(b);
    expect(onSelect).toHaveBeenCalledWith('b');
    expect(b).toHaveAttribute('aria-pressed', 'false'); // controlled — ring did not move
  });

  it('emphasizes the upstream+downstream lineage (off-lineage nodes stay legible)', async () => {
    const user = userEvent.setup();
    render(<Lineage data={flow} />);
    // C's lineage = {C, B, A}; D is a sibling → off-lineage.
    await user.click(screen.getByRole('button', { name: /^C$/ }));
    expect(screen.getByRole('button', { name: /^A, source/ })).toHaveClass('is-lineage');
    expect(screen.getByRole('button', { name: /^B, mid/ })).toHaveClass('is-lineage');
    const d = screen.getByRole('button', { name: /^D$/ });
    expect(d).not.toHaveClass('is-lineage'); // off-lineage
    expect(d).not.toHaveClass('is-muted'); // but NOT dimmed — stays legible + operable
  });

  it('names + annotates connections in the inspector (accessible edge info)', async () => {
    const user = userEvent.setup();
    const g: GraphContract = {
      nodes: [
        { id: 'a', label: 'Alpha' },
        { id: 'b', label: 'Beta' },
        { id: 'c', label: 'Gamma' },
      ],
      edges: [
        { from: 'a', to: 'c' },
        { from: 'b', to: 'c', dashed: true, label: 'inferred' },
      ],
    };
    const { container } = render(<Lineage data={g} />);
    const live = container.querySelector('[aria-live="polite"]') as HTMLElement;
    await user.click(screen.getByRole('button', { name: /^Gamma/ }));
    // Gamma's direct upstream is named, with the dashed edge annotated by its label.
    expect(within(live).getByText(/From:/)).toHaveTextContent('From: Alpha, Beta (inferred)');
  });

  it('lights a bypass edge between two on-lineage nodes', async () => {
    const user = userEvent.setup();
    const g: GraphContract = {
      nodes: [
        { id: 'u', label: 'U' },
        { id: 's', label: 'S' },
        { id: 'd', label: 'D' },
      ],
      edges: [
        { from: 'u', to: 's' },
        { from: 's', to: 'd' },
        { from: 'u', to: 'd' }, // bypass: skips S
      ],
    };
    const { container } = render(<Lineage data={g} />);
    await user.click(screen.getByRole('button', { name: /^S$/ }));
    // U and D are both on S's lineage → the bypass U→D edge is lit, not muted.
    const bypass = container.querySelector('[data-edge="u->d"]')!;
    expect(bypass).toHaveClass('is-lineage');
    expect(bypass).not.toHaveClass('is-muted');
  });

  it('reports upstream/downstream counts in the live inspector', async () => {
    const user = userEvent.setup();
    const { container } = render(<Lineage data={flow} />);
    const live = container.querySelector('[aria-live="polite"]') as HTMLElement;
    await user.click(screen.getByRole('button', { name: /^C$/ }));
    // C: upstream {B, A} = 2, downstream {} = 0.
    expect(within(live).getByText(/2 upstream/)).toBeInTheDocument();
    expect(within(live).getByText(/0 downstream/)).toBeInTheDocument();
  });

  it('clamps every node within the plot box', () => {
    const wide: GraphContract = {
      nodes: Array.from({ length: 24 }, (_, i) => ({ id: `n${i}`, label: `Node ${i}` })),
      edges: Array.from({ length: 23 }, (_, i) => ({ from: `n${i}`, to: `n${i + 1}` })),
    };
    const { container } = render(<Lineage data={wide} />);
    const wraps = container.querySelectorAll<HTMLElement>('.tcl-lineage__node-wrap');
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
    render(<Lineage data={flow} />);
    expect(screen.getByRole('group', { name: /lineage/i })).toBeInTheDocument();
  });

  it('renders an empty state for no nodes', () => {
    render(<Lineage data={{ nodes: [], edges: [] }} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.getByText(/No nodes to display/)).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Lineage data={flow} />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
