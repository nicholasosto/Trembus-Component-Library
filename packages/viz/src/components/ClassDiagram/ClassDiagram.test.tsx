import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '@trembus/tokens/testing';
import { ClassDiagram } from './ClassDiagram';
import type { ClassDiagramContract } from './ClassDiagram';

const model: ClassDiagramContract = {
  title: 'Model',
  nodes: [
    {
      id: 'base',
      name: 'Base',
      stereotype: '«abstract»',
      attributes: [{ name: 'id: string', visibility: 'protected' }],
      methods: [{ name: 'save(): void', visibility: 'public' }],
      note: 'the base',
    },
    { id: 'sub', name: 'Sub', attributes: [{ name: 'x: number', visibility: 'private' }] },
    { id: 'part', name: 'Part' },
    { id: 'iface', name: 'Repo', stereotype: '«interface»' },
    { id: 'lone', name: 'Lone' },
  ],
  edges: [
    { from: 'sub', to: 'base', kind: 'inheritance' },
    { from: 'sub', to: 'part', kind: 'composition' },
    { from: 'sub', to: 'iface', kind: 'realization' },
  ],
};

function nodeButtons(): HTMLElement[] {
  return screen.queryAllByRole('button').filter((b) => b.hasAttribute('aria-pressed'));
}

describe('ClassDiagram', () => {
  it('renders one class button per node, folding stereotype + member counts into the name', () => {
    render(<ClassDiagram data={model} />);
    expect(nodeButtons()).toHaveLength(5);
    expect(
      screen.getByRole('button', { name: 'Base, «abstract», 1 attribute, 1 method' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sub, 1 attribute, 0 methods' })).toBeInTheDocument();
  });

  it('renders attribute + method compartments with visibility markers', () => {
    render(<ClassDiagram data={model} />);
    expect(screen.getByText('# id: string')).toBeInTheDocument(); // protected
    expect(screen.getByText('+ save(): void')).toBeInTheDocument(); // public
    expect(screen.getByText('- x: number')).toBeInTheDocument(); // private
  });

  it('encodes each relationship kind with the right arrowhead marker', () => {
    const { container } = render(<ClassDiagram data={model} />);
    const inh = container.querySelector('[data-edge="sub->base"]')!;
    expect(inh.getAttribute('data-kind')).toBe('inheritance');
    expect(inh.getAttribute('marker-end')).toContain('tcl-class-tri');

    const comp = container.querySelector('[data-edge="sub->part"]')!;
    expect(comp.getAttribute('marker-start')).toContain('tcl-class-diamond-filled');
    expect(comp.getAttribute('marker-end')).toBeNull();

    const real = container.querySelector('[data-edge="sub->iface"]')!;
    expect(real.getAttribute('marker-end')).toContain('tcl-class-tri');
    expect(real).toHaveClass('is-dashed'); // realization is dashed
  });

  it('drops self-loops and dangling relations without throwing', () => {
    const bad: ClassDiagramContract = {
      nodes: [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
      ],
      edges: [
        { from: 'a', to: 'a', kind: 'association' },
        { from: 'a', to: 'ghost', kind: 'dependency' },
        { from: 'a', to: 'b', kind: 'association' },
      ],
    };
    const { container } = render(<ClassDiagram data={bad} />);
    expect(nodeButtons()).toHaveLength(2);
    expect(container.querySelector('[data-edge="a->b"]')).toBeTruthy();
    expect(container.querySelector('[data-edge="a->a"]')).toBeNull();
    expect(container.querySelector('[data-edge="a->ghost"]')).toBeNull();
  });

  it('drops duplicate class ids (first wins)', () => {
    const dup: ClassDiagramContract = {
      nodes: [
        { id: 'x', name: 'First' },
        { id: 'x', name: 'Second' },
      ],
      edges: [],
    };
    render(<ClassDiagram data={dup} />);
    expect(screen.getByRole('button', { name: /^First/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Second/ })).toBeNull();
  });

  it('selects a class: aria-pressed, members + UML-verb relationships in the inspector, onSelect', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { container } = render(<ClassDiagram data={model} onSelect={onSelect} />);
    const sub = screen.getByRole('button', { name: /^Sub,/ });
    await user.click(sub);
    expect(sub).toHaveAttribute('aria-pressed', 'true');
    expect(onSelect).toHaveBeenCalledWith('sub');
    const live = container.querySelector('[aria-live="polite"]') as HTMLElement;
    expect(within(live).getByText(/extends Base/)).toBeInTheDocument();
    expect(within(live).getByText(/owns Part/)).toBeInTheDocument();
    expect(within(live).getByText(/implements Repo/)).toBeInTheDocument();
  });

  it('reveals the selected class note + members in the inspector', async () => {
    const user = userEvent.setup();
    const { container } = render(<ClassDiagram data={model} />);
    await user.click(screen.getByRole('button', { name: /^Base,/ }));
    const live = container.querySelector('[aria-live="polite"]') as HTMLElement;
    expect(within(live).getByText(/the base/)).toBeInTheDocument();
    expect(within(live).getByText(/Methods: \+ save\(\): void/)).toBeInTheDocument();
  });

  it('respects a controlled selectedId', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ClassDiagram data={model} selectedId="base" onSelect={onSelect} />);
    expect(screen.getByRole('button', { name: /^Base,/ })).toHaveAttribute('aria-pressed', 'true');
    const sub = screen.getByRole('button', { name: /^Sub,/ });
    await user.click(sub);
    expect(onSelect).toHaveBeenCalledWith('sub');
    expect(sub).toHaveAttribute('aria-pressed', 'false'); // controlled — ring did not move
  });

  it('emphasizes related classes without dimming unrelated focusable nodes', async () => {
    const user = userEvent.setup();
    render(<ClassDiagram data={model} />);
    await user.click(screen.getByRole('button', { name: /^Sub,/ }));
    expect(screen.getByRole('button', { name: /^Base,/ })).toHaveClass('is-emphasized');
    const lone = screen.getByRole('button', { name: /^Lone,/ });
    expect(lone).not.toHaveClass('is-emphasized');
    expect(lone).not.toHaveClass('is-muted'); // nodes are never dimmed
  });

  it('clamps every class within the plot box', () => {
    const wide: ClassDiagramContract = {
      nodes: Array.from({ length: 16 }, (_, i) => ({ id: `n${i}`, name: `Class ${i}` })),
      edges: Array.from({ length: 15 }, (_, i) => ({
        from: `n${i}`,
        to: `n${i + 1}`,
        kind: 'association' as const,
      })),
    };
    const { container } = render(<ClassDiagram data={wide} />);
    const wraps = container.querySelectorAll<HTMLElement>('.tcl-classdiagram__node-wrap');
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
    render(<ClassDiagram data={model} />);
    expect(screen.getByRole('group', { name: /class diagram/i })).toBeInTheDocument();
  });

  it('renders an empty state for no classes', () => {
    render(<ClassDiagram data={{ nodes: [], edges: [] }} />);
    expect(nodeButtons()).toHaveLength(0);
    expect(screen.getByText(/No classes to display/)).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<ClassDiagram data={model} />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
