import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { a11yViolations } from '../../test/a11y';
import { Assay } from './Assay';
import type { AssayContract } from './Assay';

const curation: AssayContract = {
  title: 'Engram capture value',
  criteria: [
    { id: 'density', label: 'reference density', weight: 0.3 },
    { id: 'distinct', label: 'distinctness', weight: 0.25 },
    { id: 'bridging', label: 'bridging', weight: 0.25 },
    { id: 'structure', label: 'structure', weight: 0.2 },
  ],
  candidates: [
    {
      id: 'dream',
      label: 'Color ontology dream',
      scores: { density: 0.95, distinct: 0.9, bridging: 1, structure: 0.85 },
    },
    {
      id: 'stagger',
      label: 'Stagger note',
      scores: { density: 0.75, distinct: 0.85, bridging: 0.75, structure: 0.8 },
    },
    {
      id: 'cframe',
      label: 'CFrame basics',
      scores: { density: 0.8, distinct: 0.4, bridging: 0.2, structure: 0.6 },
      penalties: [{ label: 'duplicate of existing', value: 0.8 }],
    },
  ],
  scale: {
    min: -3,
    max: 3,
    bands: [
      { upTo: 0, label: 'skip', tone: 'danger' },
      { upTo: 1.5, label: 'inline', tone: 'neutral' },
      { upTo: 2.5, label: 'trace', tone: 'warning' },
      { label: 'engram', tone: 'success' },
    ],
  },
};

const rankedLabels = (container: HTMLElement): string[] =>
  [...container.querySelectorAll('.tcl-assay__brow-label')].map((el) => el.textContent ?? '');

describe('Assay', () => {
  it('has no axe violations (board + card + penalties + bands)', async () => {
    const { container } = render(<Assay data={curation} defaultSelectedId="cframe" />);
    expect(await a11yViolations(container)).toEqual([]);
  });

  it('ranks candidates by total, maps bands to verdicts, and shows the penalty clawback', () => {
    const { container } = render(<Assay data={curation} defaultSelectedId="cframe" />);
    expect(rankedLabels(container)).toEqual([
      'Color ontology dream',
      'Stagger note',
      'CFrame basics',
    ]);
    expect(
      screen.getByRole('button', { name: 'Color ontology dream, +2.6, engram, rank 1' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Stagger note, +1.7, trace, rank 2' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'CFrame basics, −0.7, skip, rank 3' }),
    ).toBeInTheDocument();
    expect(container.querySelector('.tcl-assay__seg--penalty')).toBeInTheDocument();
  });

  it('announces the assayed candidate with total, verdict, and penalty reasons', () => {
    const { container } = render(<Assay data={curation} />);
    const live = container.querySelector('.tcl-assay__inspector-live');
    expect(live).toHaveAttribute('aria-live', 'polite');
    expect(live).toHaveTextContent('Select a candidate to assay it.');
    fireEvent.click(screen.getByRole('button', { name: /CFrame basics/ }));
    expect(live).toHaveTextContent(
      'CFrame basics: −0.7, skip. Penalty −0.8: duplicate of existing.',
    );
  });

  it('prints an equation that actually sums — the scale base is a real term', () => {
    render(<Assay data={curation} defaultSelectedId="cframe" />);
    expect(
      screen.getByText(/−3\.0 \(base\) \+ 1\.4 \+ 0\.6 \+ 0\.3 \+ 0\.7 − 0\.8 = −0\.7 → skip/),
    ).toBeInTheDocument();
  });

  it('discloses a floor clamp instead of printing false arithmetic', () => {
    render(
      <Assay
        data={{
          ...curation,
          candidates: [
            {
              id: 'floored',
              label: 'Floored',
              scores: {},
              penalties: [{ label: 'catastrophic', value: 6 }],
            },
          ],
        }}
      />,
    );
    expect(
      screen.getByText(
        /−3\.0 \(base\) \+ 0\.0 \+ 0\.0 \+ 0\.0 \+ 0\.0 − 6\.0 = −3\.0 \(floored at −3\.0\) → skip/,
      ),
    ).toBeInTheDocument();
  });

  it('re-seeds the tab stop when the controlled selectedId value changes', () => {
    const { rerender } = render(<Assay data={curation} selectedId="dream" />);
    expect(screen.getByRole('button', { name: /Color ontology dream/ })).toHaveAttribute(
      'tabindex',
      '0',
    );
    rerender(<Assay data={curation} selectedId="stagger" />);
    expect(screen.getByRole('button', { name: /Stagger note/ })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('button', { name: /Color ontology dream/ })).toHaveAttribute(
      'tabindex',
      '-1',
    );
  });

  it('drops the verdict column and chips on a band-less board', () => {
    const { container } = render(
      <Assay
        data={{
          criteria: [{ id: 'q', label: 'Quality', weight: 1 }],
          candidates: [
            { id: 'a', label: 'A', scores: { q: 0.8 } },
            { id: 'b', label: 'B', scores: { q: 0.4 } },
          ],
        }}
      />,
    );
    expect(container.querySelector('.tcl-assay__chip')).not.toBeInTheDocument();
    expect(container.querySelector('.tcl-assay__brow--no-verdict')).toBeInTheDocument();
  });

  it('controlled: click fires onSelect but the selection does not move', () => {
    const onSelect = vi.fn();
    render(<Assay data={curation} selectedId="dream" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /Stagger note/ }));
    expect(onSelect).toHaveBeenCalledWith('stagger');
    expect(screen.getByRole('button', { name: /Color ontology dream/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /Stagger note/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('roves with arrows and selection follows focus', () => {
    render(<Assay data={curation} />);
    const first = screen.getByRole('button', { name: /Color ontology dream/ });
    expect(first).toHaveAttribute('tabindex', '0');
    fireEvent.keyDown(first, { key: 'ArrowDown' });
    const second = screen.getByRole('button', { name: /Stagger note/ });
    expect(second).toHaveFocus();
    expect(second).toHaveAttribute('aria-pressed', 'true');
    expect(first).toHaveAttribute('tabindex', '-1');
  });

  it('renders the detail card (no buttons) for a single candidate', () => {
    const { container } = render(
      <Assay data={{ ...curation, candidates: [curation.candidates[0]] }} />,
    );
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(container.querySelector('.tcl-assay__card')).toBeInTheDocument();
    expect(screen.getByText(/weights Σ 1\.00/)).toBeInTheDocument();
    expect(screen.getByText(/→ engram/)).toBeInTheDocument();
  });

  it('normalizes relative weights identically and discloses non-unit sums', () => {
    const scaled: AssayContract = {
      ...curation,
      criteria: curation.criteria.map((c) => ({ ...c, weight: c.weight * 20 })),
      candidates: [curation.candidates[0]],
    };
    const unit = render(<Assay data={{ ...curation, candidates: [curation.candidates[0]] }} />);
    const twenty = render(<Assay data={scaled} />);
    const widths = (c: HTMLElement) =>
      [...c.querySelectorAll<HTMLElement>('.tcl-assay__track')].map((el) => el.style.width);
    expect(widths(twenty.container)).toEqual(widths(unit.container));
    expect(twenty.container.textContent).toContain('weights Σ 20.00 (normalized)');
    expect(unit.container.textContent).not.toContain('(normalized)');
  });

  it('launders junk scores, weights, and penalties — never renders NaN, always clamps', () => {
    const { container } = render(
      <Assay
        data={{
          criteria: [
            { id: 'a', label: 'A', weight: Number.NaN },
            { id: 'b', label: 'B', weight: -5 },
          ],
          candidates: [
            {
              id: 'x',
              label: 'X',
              scores: { a: 5, b: Number.NaN },
              penalties: [{ label: 'junk', value: Number.NaN }],
            },
            { id: 'y', label: 'Y', scores: { a: -2, b: 0.5 } },
          ],
          scale: { min: 0, max: 1 },
        }}
      />,
    );
    expect(container.innerHTML).not.toContain('NaN');
    const fills = [...container.querySelectorAll<HTMLElement>('.tcl-assay__fill')];
    for (const f of fills) {
      const w = Number.parseFloat(f.style.width);
      expect(w).toBeGreaterThanOrEqual(0);
      expect(w).toBeLessThanOrEqual(100);
    }
  });

  it('launders junk tone strings through the guarded registry — never an invisible fill', () => {
    const { container } = render(
      <Assay
        data={{
          criteria: [{ id: 'c', label: 'C', weight: 1, tone: 'constructor' as never }],
          candidates: [{ id: 'x', label: 'X', scores: { c: 0.5 } }],
          scale: {
            min: 0,
            max: 1,
            bands: [{ label: 'done', tone: 'toString' as never }],
          },
        }}
      />,
    );
    const fill = container.querySelector<HTMLElement>('.tcl-assay__fill');
    expect(fill?.style.background).toBe('var(--tcl-accent)');
    expect(container.querySelector('.tcl-assay__chip--neutral')).toBeInTheDocument();
    expect(container.querySelector('.tcl-assay__chip--toString')).not.toBeInTheDocument();
  });

  it('clamps an oversized penalty at the scale floor', () => {
    render(
      <Assay
        data={{
          ...curation,
          candidates: [
            {
              id: 'doomed',
              label: 'Doomed',
              scores: { density: 1, distinct: 1, bridging: 1, structure: 1 },
              penalties: [{ label: 'catastrophic', value: 999 }],
            },
          ],
        }}
      />,
    );
    // Full marks minus a 6-point penalty lands exactly on the floor — the
    // equation stays honest: −3 (base) + 6 (contributions) − 6 (penalty) = −3.
    expect(
      screen.getByText(/−3\.0 \(base\) \+ 1\.8 \+ 1\.5 \+ 1\.5 \+ 1\.2 − 6\.0 = −3\.0 → skip/),
    ).toBeInTheDocument();
  });

  it('dedups duplicate candidate and criterion ids first-wins', () => {
    const { container } = render(
      <Assay
        data={{
          criteria: [
            { id: 'c', label: 'First criterion', weight: 1 },
            { id: 'c', label: 'Second criterion', weight: 9 },
          ],
          candidates: [
            { id: 'dup', label: 'First', scores: { c: 1 } },
            { id: 'dup', label: 'Second', scores: { c: 0 } },
            { id: 'other', label: 'Other', scores: { c: 0.5 } },
          ],
        }}
      />,
    );
    expect(screen.getByRole('button', { name: /First,/ })).toBeInTheDocument();
    expect(screen.queryByText('Second')).not.toBeInTheDocument();
    expect(container.textContent).toContain('First criterion');
    expect(container.textContent).not.toContain('Second criterion');
  });

  it('degrades to an empty state without criteria or candidates', () => {
    render(<Assay data={{ criteria: [], candidates: [] }} />);
    expect(screen.getByText(/Nothing to assay/)).toBeInTheDocument();
  });
});
