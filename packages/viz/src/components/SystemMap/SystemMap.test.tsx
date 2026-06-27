import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '@trembus/tokens/testing';
import { SystemMap } from './SystemMap';
import type { SystemMapContract } from './SystemMap';

// Alpha is a container (children a1, a2). Edges are authored at the deepest level
// so aggregation + cross-boundary summarizing are exercised.
const arch: SystemMapContract = {
  title: 'Arch',
  nodes: [
    { id: 'alpha', label: 'Alpha', kind: 'system' },
    { id: 'beta', label: 'Beta', kind: 'actor' },
    { id: 'gamma', label: 'Gamma', kind: 'external' },
    { id: 'a1', label: 'A-one', parentId: 'alpha', sub: 'svc', note: 'inside alpha' },
    { id: 'a2', label: 'A-two', parentId: 'alpha' },
  ],
  ports: [
    { id: 'px', nodeId: 'a1', label: '/x', direction: 'provided' },
    { id: 'py', nodeId: 'a1', label: '/y', direction: 'required' },
  ],
  edges: [
    { from: 'beta', to: 'a1' }, // → beta → alpha at the root
    { from: 'a1', to: 'gamma' }, // → alpha → gamma at the root; external-out inside alpha
    { from: 'a2', to: 'a1' }, // internal to alpha (hidden at root, visible inside)
  ],
};

/** Node buttons carry aria-pressed (the Open / breadcrumb buttons do not). */
function nodeButtons(): HTMLElement[] {
  return screen.queryAllByRole('button').filter((b) => b.hasAttribute('aria-pressed'));
}

describe('SystemMap', () => {
  it('renders one node button per working-set member, folding sub + kind into the name', () => {
    render(<SystemMap data={arch} />);
    expect(nodeButtons()).toHaveLength(3); // alpha, beta, gamma
    expect(screen.getByRole('button', { name: /^Alpha/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Beta, actor/ })).toBeInTheDocument();
  });

  it('marks a container with a child-count badge + an Open control; a leaf has neither', () => {
    render(<SystemMap data={arch} />);
    expect(screen.getByRole('button', { name: /Open Alpha, 2 parts/ })).toBeInTheDocument();
    expect(screen.getByText('2 parts')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Open Beta/ })).toBeNull();
  });

  it('aggregates deep edges to the visible level (deep → deep shows as container → container)', () => {
    const { container } = render(<SystemMap data={arch} />);
    // beta → a1 aggregates to beta → alpha; a1 → gamma to alpha → gamma.
    expect(container.querySelector('[data-edge="beta->alpha"]')).toBeTruthy();
    expect(container.querySelector('[data-edge="alpha->gamma"]')).toBeTruthy();
  });

  it('drills into a container: deeper nodes appear, breadcrumb + onFocus update', async () => {
    const user = userEvent.setup();
    const onFocus = vi.fn();
    render(<SystemMap data={arch} onFocus={onFocus} />);
    await user.click(screen.getByRole('button', { name: /Open Alpha/ }));
    expect(onFocus).toHaveBeenCalledWith('alpha');
    // Working set is now Alpha's children; a1 surfaces its interfaces + external flag.
    expect(
      screen.getByRole('button', { name: /^A-one, svc, provides \/x; requires \/y/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^A-two/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Alpha/ })).toBeNull();
    // Breadcrumb exposes the way back.
    expect(screen.getByRole('button', { name: 'All systems' })).toBeInTheDocument();
  });

  it('breadcrumb returns to the root level', async () => {
    const user = userEvent.setup();
    render(<SystemMap data={arch} defaultFocusId="alpha" />);
    expect(screen.queryByRole('button', { name: /^Alpha/ })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'All systems' }));
    expect(screen.getByRole('button', { name: /^Alpha/ })).toBeInTheDocument();
  });

  it('summarizes cross-boundary links in the inspector (the accessible membrane)', async () => {
    const user = userEvent.setup();
    const { container } = render(<SystemMap data={arch} defaultFocusId="alpha" />);
    const live = container.querySelector('[aria-live="polite"]') as HTMLElement;
    await user.click(screen.getByRole('button', { name: /^A-one/ }));
    expect(within(live).getByText(/inside alpha/)).toBeInTheDocument();
    expect(within(live).getByText(/External in: Beta/)).toBeInTheDocument();
    expect(within(live).getByText(/External out: Gamma/)).toBeInTheDocument();
    expect(within(live).getByText(/provides \/x · requires \/y/)).toBeInTheDocument();
  });

  it('selects a node (uncontrolled): aria-pressed, inspector, onSelect', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<SystemMap data={arch} onSelect={onSelect} />);
    const alpha = screen.getByRole('button', { name: /^Alpha/ });
    await user.click(alpha);
    expect(alpha).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/Contains 2 parts/)).toBeInTheDocument();
    expect(onSelect).toHaveBeenCalledWith('alpha');
  });

  it('respects a controlled selectedId', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<SystemMap data={arch} selectedId="beta" onSelect={onSelect} />);
    expect(screen.getByRole('button', { name: /^Beta/ })).toHaveAttribute('aria-pressed', 'true');
    const alpha = screen.getByRole('button', { name: /^Alpha/ });
    await user.click(alpha);
    expect(onSelect).toHaveBeenCalledWith('alpha');
    expect(alpha).toHaveAttribute('aria-pressed', 'false'); // controlled — ring did not move
  });

  it('keeps an aggregated edge style only when the constituents agree', () => {
    // x1→y1 (dashed, "alpha") and x2→y1 ("beta") both aggregate to c1→c2.
    const mixed: SystemMapContract = {
      nodes: [
        { id: 'c1', label: 'C1' },
        { id: 'c2', label: 'C2' },
        { id: 'x1', label: 'X1', parentId: 'c1' },
        { id: 'x2', label: 'X2', parentId: 'c1' },
        { id: 'y1', label: 'Y1', parentId: 'c2' },
      ],
      edges: [
        { from: 'x1', to: 'y1', label: 'alpha', dashed: true },
        { from: 'x2', to: 'y1', label: 'beta' },
      ],
    };
    const { container } = render(<SystemMap data={mixed} />);
    const edge = container.querySelector('[data-edge="c1->c2"]');
    expect(edge).toBeTruthy();
    expect(edge).not.toHaveClass('is-dashed'); // one dashed + one solid → solid
    // disagreeing labels → no (misleading) label drawn
    expect(container.querySelector('.tcl-systemmap__edge-label')).toBeNull();
  });

  it('preserves an aggregated edge style when the constituents are unanimous', () => {
    const unanimous: SystemMapContract = {
      nodes: [
        { id: 'c1', label: 'C1' },
        { id: 'c2', label: 'C2' },
        { id: 'x1', label: 'X1', parentId: 'c1' },
        { id: 'y1', label: 'Y1', parentId: 'c2' },
      ],
      edges: [{ from: 'x1', to: 'y1', label: 'sync', dashed: true }],
    };
    const { container } = render(<SystemMap data={unanimous} />);
    const edge = container.querySelector('[data-edge="c1->c2"]');
    expect(edge).toHaveClass('is-dashed');
    expect(container.querySelector('.tcl-systemmap__edge-label')).toHaveTextContent('sync');
  });

  it('orients the user when the selected node is on another level after a drill', async () => {
    const user = userEvent.setup();
    const { container } = render(<SystemMap data={arch} />);
    await user.click(screen.getByRole('button', { name: /^Beta/ })); // select a root node
    await user.click(screen.getByRole('button', { name: /Open Alpha/ })); // drill away from it
    const live = container.querySelector('[aria-live="polite"]') as HTMLElement;
    expect(within(live).getByText(/Beta is on another level/)).toBeInTheDocument();
  });

  it('treats an unknown parent as a root node', () => {
    const orphan: SystemMapContract = {
      nodes: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B', parentId: 'ghost' },
      ],
      edges: [],
    };
    render(<SystemMap data={orphan} />);
    expect(screen.getByRole('button', { name: /^A$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^B$/ })).toBeInTheDocument();
  });

  it('drops duplicate node ids (first wins)', () => {
    const dup: SystemMapContract = {
      nodes: [
        { id: 'x', label: 'First' },
        { id: 'x', label: 'Second' },
      ],
      edges: [],
    };
    render(<SystemMap data={dup} />);
    expect(screen.getByRole('button', { name: /^First/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Second/ })).toBeNull();
  });

  it('survives a parent cycle without throwing', () => {
    const cyclic: SystemMapContract = {
      nodes: [
        { id: 'a', label: 'A', parentId: 'b' },
        { id: 'b', label: 'B', parentId: 'a' },
      ],
      edges: [],
    };
    expect(() => render(<SystemMap data={cyclic} />)).not.toThrow();
    expect(nodeButtons().length).toBeGreaterThan(0);
  });

  it('clamps every node within the plot box', () => {
    const wide: SystemMapContract = {
      nodes: Array.from({ length: 20 }, (_, i) => ({ id: `n${i}`, label: `Node ${i}` })),
      edges: Array.from({ length: 19 }, (_, i) => ({ from: `n${i}`, to: `n${i + 1}` })),
    };
    const { container } = render(<SystemMap data={wide} />);
    const wraps = container.querySelectorAll<HTMLElement>('.tcl-systemmap__node-wrap');
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

  it('renders a kind glyph on each node (decorative, aria-hidden)', () => {
    const { container } = render(<SystemMap data={arch} />);
    expect(container.querySelector('[data-glyph="server"]')).toBeTruthy(); // alpha = system
    expect(container.querySelector('[data-glyph="user"]')).toBeTruthy(); // beta = actor
    expect(container.querySelector('[data-glyph="cloud"]')).toBeTruthy(); // gamma = external
    // glyphs are decorative — the svg itself is aria-hidden
    expect(container.querySelector('[data-glyph="server"]')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  it('lets an explicit node icon override the kind glyph', () => {
    const d: SystemMapContract = {
      nodes: [{ id: 'a', label: 'A', kind: 'system', icon: 'database' }],
      edges: [],
    };
    const { container } = render(<SystemMap data={d} />);
    expect(container.querySelector('[data-glyph="database"]')).toBeTruthy();
    expect(container.querySelector('[data-glyph="server"]')).toBeNull();
  });

  it('exposes a group role for the figure', () => {
    render(<SystemMap data={arch} />);
    expect(screen.getByRole('group', { name: /system map/i })).toBeInTheDocument();
  });

  it('renders an empty state for no nodes', () => {
    render(<SystemMap data={{ nodes: [], edges: [] }} />);
    expect(nodeButtons()).toHaveLength(0);
    expect(screen.getByText(/No nodes to display/)).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<SystemMap data={arch} />);
    expect(await a11yViolations(container)).toEqual([]);
  });

  it('has no axe violations when drilled into a container', async () => {
    const { container } = render(<SystemMap data={arch} defaultFocusId="alpha" />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
