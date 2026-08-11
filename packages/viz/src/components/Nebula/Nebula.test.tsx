import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { a11yViolations } from '@trembus/tokens/testing';
import { Nebula } from './Nebula';
import type { NebulaContract } from './Nebula';

const space: NebulaContract = {
  title: 'Concept space',
  items: [
    { id: 'glossary', label: 'Glossary', group: 'spec', summary: 'The common language.' },
    { id: 'ontology', label: 'Ontology', group: 'spec', weight: 0.9 },
    {
      id: 'brain',
      label: 'artificial-brain',
      group: 'instances',
      summary: 'The flagship instance.',
    },
    { id: 'versioning', label: 'Versioning', group: 'spec' },
    { id: 'engram', label: 'Engram', group: 'notes' },
  ],
  links: [
    { source: 'glossary', target: 'ontology', weight: 0.8, kind: 'defines' },
    { source: 'ontology', target: 'brain', weight: 0.55, kind: 'near-synonym' },
    { source: 'ontology', target: 'versioning', weight: 0.7 },
    { source: 'brain', target: 'engram', weight: 0.6 },
  ],
  groups: {
    spec: { label: 'Spec', tone: 'accent' },
    instances: { label: 'Instances', tone: 'info' },
    notes: { label: 'Notes', tone: 'success' },
  },
};

const stylesOf = (container: HTMLElement): string[] =>
  [...container.querySelectorAll<HTMLButtonElement>('.tcl-nebula__node')].map(
    (b) => `${b.getAttribute('aria-label')}|${b.style.left}|${b.style.top}`,
  );

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Nebula', () => {
  it('has no axe violations', async () => {
    const { container } = render(
      <Nebula data={space} defaultSelectedId="ontology" autoOrbit showEdges="all" />,
    );
    expect(await a11yViolations(container)).toEqual([]);
  });

  it('lays out deterministically — same input, same map', () => {
    const a = render(<Nebula data={space} />);
    const b = render(<Nebula data={space} />);
    expect(stylesOf(a.container)).toEqual(stylesOf(b.container));
    expect(stylesOf(a.container)[0]).toMatch(/%/);
  });

  it('dedups duplicate ids first-wins and drops dangling/self links', () => {
    const { container } = render(
      <Nebula
        showEdges="all"
        data={{
          items: [
            { id: 'dup', label: 'First' },
            { id: 'dup', label: 'Second' },
            { id: 'solo', label: 'Solo' },
          ],
          links: [
            { source: 'dup', target: 'solo', weight: 0.8 },
            { source: 'dup', target: 'ghost', weight: 0.9 },
            { source: 'solo', target: 'solo', weight: 1 },
          ],
        }}
      />,
    );
    expect(screen.getByRole('button', { name: 'First' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Second' })).not.toBeInTheDocument();
    expect(container.querySelectorAll('.tcl-nebula__edge')).toHaveLength(1);
  });

  it('never renders NaN for junk weights/positions and keeps nodes in the plot box', () => {
    const { container } = render(
      <Nebula
        data={{
          layout: 'given',
          items: [
            { id: 'a', label: 'Alpha', weight: Number.NaN, position: [Number.NaN, 99, 0] },
            { id: 'b', label: 'Beta', position: [0, -99, 0] },
            { id: 'c', label: 'Gamma' },
          ],
          links: [{ source: 'a', target: 'b', weight: Number.NaN }],
        }}
      />,
    );
    expect(container.innerHTML).not.toContain('NaN');
    for (const node of container.querySelectorAll<HTMLButtonElement>('.tcl-nebula__node')) {
      const left = Number.parseFloat(node.style.left);
      const top = Number.parseFloat(node.style.top);
      // PAD/W and PAD/H rims of the 760×520 viewBox.
      expect(left).toBeGreaterThanOrEqual((64 / 760) * 100 - 1e-6);
      expect(left).toBeLessThanOrEqual(100 - (64 / 760) * 100 + 1e-6);
      expect(top).toBeGreaterThanOrEqual((64 / 520) * 100 - 1e-6);
      expect(top).toBeLessThanOrEqual(100 - (64 / 520) * 100 + 1e-6);
    }
  });

  it('selects uncontrolled and announces the datum with ranked neighbors', () => {
    const { container } = render(<Nebula data={space} />);
    const live = container.querySelector('.tcl-nebula__inspector-live');
    expect(live).toHaveAttribute('aria-live', 'polite');
    expect(live).toHaveTextContent('Select a concept to inspect it.');
    fireEvent.click(screen.getByRole('button', { name: 'Ontology, Spec' }));
    expect(screen.getByRole('button', { name: 'Ontology, Spec' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(live).toHaveTextContent('Ontology · Spec');
    expect(live).toHaveTextContent(/Closest:/);
    // Linked neighbors surface their link weight + kind.
    expect(live).toHaveTextContent(/Glossary \(0\.80, defines\)/);
  });

  it('controlled: click fires onSelect but the ring does not move', () => {
    const onSelect = vi.fn();
    render(<Nebula data={space} selectedId="glossary" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: 'Engram, Notes' }));
    expect(onSelect).toHaveBeenCalledWith('engram');
    expect(screen.getByRole('button', { name: 'Glossary, Spec' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Engram, Notes' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('default showEdges="selected" draws only the selection’s threads', () => {
    const bare = render(<Nebula data={space} />);
    expect(bare.container.querySelectorAll('.tcl-nebula__edge')).toHaveLength(0);
    const seeded = render(<Nebula data={space} defaultSelectedId="ontology" />);
    // ontology touches glossary, brain, versioning.
    expect(seeded.container.querySelectorAll('.tcl-nebula__edge')).toHaveLength(3);
  });

  it('rotates from the keyboard on the Reset-view control and Home restores', () => {
    const { container } = render(<Nebula data={space} />);
    const before = stylesOf(container);
    const reset = screen.getByRole('button', { name: /^Reset view/ });
    fireEvent.keyDown(reset, { key: 'ArrowRight' });
    expect(stylesOf(container)).not.toEqual(before);
    fireEvent.keyDown(reset, { key: 'Home' });
    expect(stylesOf(container)).toEqual(before);
  });

  it('roves focus through the cloud with arrow keys', () => {
    render(<Nebula data={space} />);
    const first = screen.getByRole('button', { name: 'Glossary, Spec' });
    expect(first).toHaveAttribute('tabindex', '0');
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    expect(screen.getByRole('button', { name: 'Ontology, Spec' })).toHaveFocus();
    expect(first).toHaveAttribute('tabindex', '-1');
    // ArrowDown jumps to the NEXT group's first member.
    fireEvent.keyDown(screen.getByRole('button', { name: 'Ontology, Spec' }), {
      key: 'ArrowDown',
    });
    expect(screen.getByRole('button', { name: 'artificial-brain, Instances' })).toHaveFocus();
    // ArrowUp jumps to the PREVIOUS group run's FIRST member, not its last.
    fireEvent.keyDown(screen.getByRole('button', { name: 'artificial-brain, Instances' }), {
      key: 'ArrowUp',
    });
    expect(screen.getByRole('button', { name: 'Glossary, Spec' })).toHaveFocus();
  });

  it('keys edges by index pair so ids containing "->" cannot collide', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(
      <Nebula
        showEdges="all"
        data={{
          items: [
            { id: 'x', label: 'X' },
            { id: 'y->z', label: 'YZ' },
            { id: 'x->y', label: 'XY' },
            { id: 'z', label: 'Z' },
          ],
          links: [
            { source: 'x', target: 'y->z', weight: 0.8 },
            { source: 'x->y', target: 'z', weight: 0.8 },
          ],
        }}
      />,
    );
    expect(container.querySelectorAll('.tcl-nebula__edge')).toHaveLength(2);
    const keyWarnings = errorSpy.mock.calls.flat().join(' ');
    expect(keyWarnings).not.toMatch(/same key|two children with the same/i);
    errorSpy.mockRestore();
  });

  it('lifts the selected node above nearer overlapping nodes', () => {
    render(
      <Nebula
        data={{
          layout: 'given',
          items: [
            // "near" sits closer to the camera than "far" at the same x/y.
            { id: 'far', label: 'Far', position: [0, 0, -0.8] },
            { id: 'near', label: 'Near', position: [0, 0, 0.8] },
          ],
        }}
        defaultSelectedId="far"
      />,
    );
    const far = screen.getByRole('button', { name: 'Far' });
    const near = screen.getByRole('button', { name: 'Near' });
    expect(Number(far.style.zIndex)).toBeGreaterThan(Number(near.style.zIndex));
  });

  it('autoOrbit ships a real pause toggle (constant label, aria-pressed carries state)', () => {
    render(<Nebula data={space} autoOrbit />);
    const pause = screen.getByRole('button', { name: 'Pause orbit' });
    expect(pause).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(pause);
    // The label must NOT flip alongside aria-pressed (the ARIA toggle anti-pattern).
    expect(screen.getByRole('button', { name: 'Pause orbit' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('suppresses autoOrbit (and its toggle) under prefers-reduced-motion', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
    render(<Nebula data={space} autoOrbit />);
    expect(screen.queryByRole('button', { name: /orbit/i })).not.toBeInTheDocument();
  });

  it('degrades to an empty state without throwing', () => {
    render(<Nebula data={{ items: [] }} />);
    expect(screen.getByText('No concepts to display.')).toBeInTheDocument();
  });
});
