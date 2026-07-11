import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '@trembus/tokens/testing';
import { Strata } from './Strata';
import type { StrataContract } from './Strata';

// The dogfood contract: 5 bedrock primitives → 3 jobs → components, plus one
// conjecture and one reference to an unarticulated support ("attention-budget").
const guide: StrataContract = {
  title: 'Interaction Design',
  principles: [
    { id: 'surface', label: 'Surface' },
    { id: 'mark', label: 'Mark' },
    { id: 'relation', label: 'Relation' },
    { id: 'affordance', label: 'Affordance' },
    { id: 'state', label: 'State', note: 'The system’s memory of now.' },
    {
      id: 'reveal-state',
      label: 'Reveal State',
      sub: 'UI job',
      restsOn: ['surface', 'mark', 'state'],
    },
    {
      id: 'afford-action',
      label: 'Afford Action',
      sub: 'UI job',
      restsOn: ['affordance', 'relation'],
    },
    {
      id: 'acknowledge-input',
      label: 'Acknowledge Input',
      sub: 'UI job',
      restsOn: ['state', 'affordance'],
    },
    {
      id: 'button',
      label: 'Button',
      restsOn: ['reveal-state', 'afford-action', 'acknowledge-input'],
    },
    {
      id: 'progressive-disclosure',
      label: 'Progressive Disclosure',
      restsOn: ['reveal-state', 'attention-budget'],
    },
    {
      id: 'feedback-loop',
      label: 'Feedback Loop',
      conjecture: true,
      restsOn: ['acknowledge-input', 'state'],
    },
  ],
};

/** Arc buttons carry aria-pressed (the hub label is a decorative div). */
function arcButtons(): HTMLElement[] {
  return screen.getAllByRole('button').filter((b) => b.hasAttribute('aria-pressed'));
}

describe('Strata', () => {
  it('renders one button per principle PLUS the auto-materialized gap, folding sub/layer/kind into the name', () => {
    render(<Strata data={guide} />);
    expect(arcButtons()).toHaveLength(12); // 11 principles + 1 gap
    expect(screen.getByRole('button', { name: 'Surface, layer 0' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Reveal State, UI job, layer 1' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Feedback Loop, layer 2, conjecture' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'attention-budget, layer 1, undiscovered support' }),
    ).toBeInTheDocument();
  });

  it('layers by dependency: restsOn pushes a principle further from the center', () => {
    render(<Strata data={guide} />);
    expect(screen.getByRole('button', { name: /^State,/ })).toHaveAttribute('data-depth', '0');
    expect(screen.getByRole('button', { name: /^Reveal State/ })).toHaveAttribute(
      'data-depth',
      '1',
    );
    expect(screen.getByRole('button', { name: /^Button/ })).toHaveAttribute('data-depth', '2');
  });

  it('uses the LONGEST support chain for depth (diamond: direct + transitive)', () => {
    const diamond: StrataContract = {
      principles: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B', restsOn: ['a'] },
        { id: 'c', label: 'C', restsOn: ['a', 'b'] }, // direct a-link must not pull C inward
      ],
    };
    render(<Strata data={diamond} />);
    expect(screen.getByRole('button', { name: /^C/ })).toHaveAttribute('data-depth', '2');
  });

  it('materializes ONE shared gap arc for a missing support referenced by several principles', async () => {
    const user = userEvent.setup();
    const gappy: StrataContract = {
      principles: [
        { id: 'a', label: 'Alpha' },
        { id: 'b', label: 'Beta', restsOn: ['a', 'ghost'] },
        { id: 'c', label: 'Gamma', restsOn: ['ghost', 'b'] },
      ],
    };
    const { container } = render(<Strata data={gappy} />);
    const gaps = arcButtons().filter((b) => b.dataset.kind === 'gap');
    expect(gaps).toHaveLength(1);
    // The gap floats to the ring beneath its SHALLOWEST referencer (Beta, layer 1).
    expect(gaps[0]).toHaveAttribute('data-depth', '0');
    expect(gaps[0]).toHaveAccessibleName('ghost, layer 0, undiscovered support');
    // A ring-0 GAP is undiscovered ground, not bedrock — the inspector must not
    // contradict its own kind line.
    await user.click(gaps[0]);
    const live = container.querySelector('[aria-live="polite"]') as HTMLElement;
    expect(within(live).queryByText(/bedrock/)).toBeNull();
    expect(within(live).getByText(/undiscovered support/)).toBeInTheDocument();
  });

  it('floors a derived-from-unknown principle at layer 1 — never mistaken for bedrock', () => {
    const unknownOnly: StrataContract = {
      principles: [{ id: 'x', label: 'X', restsOn: ['unknown-support'] }],
    };
    render(<Strata data={unknownOnly} />);
    expect(screen.getByRole('button', { name: /^X/ })).toHaveAttribute('data-depth', '1');
    expect(screen.getByRole('button', { name: /unknown-support/ })).toHaveAttribute(
      'data-depth',
      '0',
    );
  });

  it('survives a support cycle without hanging (deterministic layering)', () => {
    const cyclic: StrataContract = {
      principles: [
        { id: 'a', label: 'A', restsOn: ['b'] },
        { id: 'b', label: 'B', restsOn: ['a'] },
      ],
    };
    expect(() => render(<Strata data={cyclic} />)).not.toThrow();
    expect(arcButtons()).toHaveLength(2);
    // Both declared restsOn → neither may present as bedrock.
    expect(screen.getByRole('button', { name: /^B/ })).toHaveAttribute('data-depth', '1');
    expect(screen.getByRole('button', { name: /^A/ })).toHaveAttribute('data-depth', '2');
  });

  it('ignores self-references (a principle cannot rest on itself)', () => {
    const selfish: StrataContract = {
      principles: [{ id: 's', label: 'Solo', restsOn: ['s'] }],
    };
    render(<Strata data={selfish} />);
    expect(screen.getByRole('button', { name: /^Solo/ })).toHaveAttribute('data-depth', '0');
    expect(arcButtons()).toHaveLength(1); // and no gap for the self-id
  });

  it('drops duplicate ids (first wins)', () => {
    const dup: StrataContract = {
      principles: [
        { id: 'x', label: 'First' },
        { id: 'x', label: 'Second' },
      ],
    };
    render(<Strata data={dup} />);
    expect(screen.getByRole('button', { name: /^First/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Second/ })).toBeNull();
    expect(arcButtons()).toHaveLength(1);
  });

  it('selects a principle (uncontrolled): aria-pressed, inspector note, onSelect', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Strata data={guide} onSelect={onSelect} />);
    const state = screen.getByRole('button', { name: /^State,/ });
    await user.click(state);
    expect(state).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('The system’s memory of now.')).toBeInTheDocument();
    expect(onSelect).toHaveBeenCalledWith('state');
  });

  it('exposes one roving Tab stop: the selected arc, otherwise the first arc', () => {
    const { rerender } = render(<Strata data={guide} />);
    const buttons = arcButtons();
    expect(buttons.filter((button) => button.tabIndex === 0)).toEqual([buttons[0]]);
    expect(buttons[0]).toHaveAccessibleName('Surface, layer 0');

    rerender(<Strata data={guide} selectedId="state" />);
    expect(arcButtons().filter((button) => button.tabIndex === 0)).toEqual([
      screen.getByRole('button', { name: /^State,/ }),
    ]);

    // A stale controlled id cannot remove the component's only Tab stop.
    rerender(<Strata data={guide} selectedId="not-in-the-map" />);
    expect(arcButtons().filter((button) => button.tabIndex === 0)).toEqual([
      screen.getByRole('button', { name: /^Surface,/ }),
    ]);
  });

  it('roves, selects, and focuses with Arrow keys and Home/End without moving centroids', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Strata data={guide} onSelect={onSelect} />);
    const surface = screen.getByRole('button', { name: /^Surface,/ });
    const mark = screen.getByRole('button', { name: /^Mark,/ });
    const relation = screen.getByRole('button', { name: /^Relation,/ });
    const last = screen.getByRole('button', { name: /^attention-budget,/ });
    const centers = new Map(
      arcButtons().map((button) => [
        button.getAttribute('aria-label'),
        { left: button.style.left, top: button.style.top },
      ]),
    );

    surface.focus();
    await user.keyboard('{ArrowRight}');
    expect(mark).toHaveFocus();
    expect(mark).toHaveAttribute('aria-pressed', 'true');
    expect(mark.tabIndex).toBe(0);
    expect(surface.tabIndex).toBe(-1);

    await user.keyboard('{ArrowDown}');
    expect(relation).toHaveFocus();
    expect(relation).toHaveAttribute('aria-pressed', 'true');
    await user.keyboard('{End}');
    expect(last).toHaveFocus();
    expect(last).toHaveAttribute('aria-pressed', 'true');
    await user.keyboard('{ArrowRight}');
    expect(surface).toHaveFocus(); // wraps
    await user.keyboard('{ArrowLeft}');
    expect(last).toHaveFocus(); // wraps back
    await user.keyboard('{Home}');
    expect(surface).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(last).toHaveFocus(); // the second arrow-key pair also wraps

    expect(onSelect).toHaveBeenCalledWith('mark');
    expect(onSelect).toHaveBeenCalledWith('relation');
    for (const button of arcButtons()) {
      expect({ left: button.style.left, top: button.style.top }).toEqual(
        centers.get(button.getAttribute('aria-label')),
      );
    }
  });

  it('keeps controlled pointer focus as the Tab stop until selectedId actually changes', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { rerender } = render(
      <Strata data={guide} selectedId="state" onSelect={onSelect} />,
    );
    const state = screen.getByRole('button', { name: /^State,/ });
    expect(state).toHaveAttribute('aria-pressed', 'true');
    const mark = screen.getByRole('button', { name: /^Mark/ });
    await user.click(mark);
    expect(onSelect).toHaveBeenCalledWith('mark');
    expect(mark).toHaveAttribute('aria-pressed', 'false'); // controlled — ring did not move
    expect(mark).toHaveFocus();
    expect(mark.tabIndex).toBe(0);
    expect(state.tabIndex).toBe(-1);

    // An ordinary parent re-render with the same primitive value must not pull
    // the tab stop back to the still-selected arc.
    rerender(<Strata data={guide} selectedId="state" onSelect={onSelect} />);
    expect(mark.tabIndex).toBe(0);
    expect(state.tabIndex).toBe(-1);

    // A real external value change deliberately re-seeds roving focus.
    rerender(<Strata data={guide} selectedId="relation" onSelect={onSelect} />);
    expect(screen.getByRole('button', { name: /^Relation,/ }).tabIndex).toBe(0);
    expect(mark.tabIndex).toBe(-1);
  });

  it('keeps controlled Arrow-key focus tabbable when the parent declines selection', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Strata data={guide} selectedId="surface" onSelect={onSelect} />);
    const surface = screen.getByRole('button', { name: /^Surface,/ });
    const mark = screen.getByRole('button', { name: /^Mark,/ });
    const relation = screen.getByRole('button', { name: /^Relation,/ });

    surface.focus();
    await user.keyboard('{ArrowRight}');
    expect(mark).toHaveFocus();
    expect(mark.tabIndex).toBe(0);
    expect(mark).toHaveAttribute('aria-pressed', 'false');
    expect(surface).toHaveAttribute('aria-pressed', 'true');
    expect(surface.tabIndex).toBe(-1);
    expect(onSelect).toHaveBeenLastCalledWith('mark');

    await user.keyboard('{ArrowRight}');
    expect(relation).toHaveFocus();
    expect(relation.tabIndex).toBe(0);
    expect(mark.tabIndex).toBe(-1);
    expect(onSelect).toHaveBeenLastCalledWith('relation');
  });

  it('lights the LOAD cone of a bedrock principle — the blast radius of a false axiom', async () => {
    const user = userEvent.setup();
    render(<Strata data={guide} />);
    await user.click(screen.getByRole('button', { name: /^State,/ }));
    // Transitive load: Reveal State, Acknowledge Input, Button, Progressive Disclosure, Feedback Loop.
    expect(screen.getByRole('button', { name: /^Button/ })).toHaveClass('is-cone');
    expect(screen.getByRole('button', { name: /^Feedback Loop/ })).toHaveClass('is-cone');
    // Unrelated bedrock sibling: not on the cone, and never dimmed (it stays a legible control).
    const relation = screen.getByRole('button', { name: /^Relation/ });
    expect(relation).not.toHaveClass('is-cone');
    expect(relation).not.toHaveClass('is-muted');
    expect(screen.getByText(/Load: 5/)).toBeInTheDocument();
  });

  it('lights the FOUNDATION cone of a derived principle, down to bedrock', async () => {
    const user = userEvent.setup();
    render(<Strata data={guide} />);
    await user.click(screen.getByRole('button', { name: /^Button/ }));
    expect(screen.getByRole('button', { name: /^Surface/ })).toHaveClass('is-cone');
    expect(screen.getByRole('button', { name: /^Affordance/ })).toHaveClass('is-cone');
    expect(screen.getByText(/Foundations: 8/)).toBeInTheDocument();
    // Nothing rests on Button yet — the floating-principle smell is announced.
    expect(screen.getByText(/Supports: nothing yet\./)).toBeInTheDocument();
  });

  it('names direct supports both ways in the live inspector', async () => {
    const user = userEvent.setup();
    const { container } = render(<Strata data={guide} />);
    const live = container.querySelector('[aria-live="polite"]') as HTMLElement;
    await user.click(screen.getByRole('button', { name: /^Reveal State/ }));
    expect(within(live).getByText(/Rests on:/)).toHaveTextContent('Rests on: Surface, Mark, State');
    expect(within(live).getByText(/Supports:/)).toHaveTextContent(
      'Supports: Button, Progressive Disclosure',
    );
  });

  it('announces a selected gap as an opening for discovery, naming its referencers', async () => {
    const user = userEvent.setup();
    const { container } = render(<Strata data={guide} />);
    const live = container.querySelector('[aria-live="polite"]') as HTMLElement;
    await user.click(screen.getByRole('button', { name: /attention-budget/ }));
    expect(within(live).getByText(/undiscovered support/)).toBeInTheDocument();
    expect(within(live).getByText(/Supports:/)).toHaveTextContent(
      'Supports: Progressive Disclosure',
    );
    expect(
      within(live).getByText(/Referenced but never articulated — an opening for discovery\./),
    ).toBeInTheDocument();
  });

  it('shows the dashed-vocabulary legend only when conjectures or gaps exist', () => {
    const plain: StrataContract = {
      principles: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B', restsOn: ['a'] },
      ],
    };
    const { rerender } = render(<Strata data={plain} />);
    expect(screen.queryByText('Undiscovered gap')).toBeNull();
    expect(screen.queryByText('Established')).toBeNull();
    rerender(<Strata data={guide} />);
    expect(screen.getByText('Undiscovered gap')).toBeInTheDocument();
    expect(screen.getByText('Conjecture')).toBeInTheDocument();
  });

  it('positions every arc-button centroid within the canvas (0–100%)', () => {
    const { container } = render(<Strata data={guide} />);
    const nodes = container.querySelectorAll<HTMLElement>('.tcl-strata__node');
    expect(nodes.length).toBeGreaterThan(0);
    for (const n of nodes) {
      const left = parseFloat(n.style.left);
      const top = parseFloat(n.style.top);
      expect(left).toBeGreaterThanOrEqual(0);
      expect(left).toBeLessThanOrEqual(100);
      expect(top).toBeGreaterThanOrEqual(0);
      expect(top).toBeLessThanOrEqual(100);
    }
  });

  it('clamps a DEEP support chain — rings compress, buttons never escape the canvas', () => {
    const deep: StrataContract = {
      principles: Array.from({ length: 15 }, (_, i) => ({
        id: `p${i}`,
        label: `P${i}`,
        ...(i > 0 ? { restsOn: [`p${i - 1}`] } : {}),
      })),
    };
    const { container } = render(<Strata data={deep} />);
    expect(screen.getByRole('button', { name: /^P14/ })).toHaveAttribute('data-depth', '14');
    const nodes = container.querySelectorAll<HTMLElement>('.tcl-strata__node');
    expect(nodes).toHaveLength(15);
    for (const n of nodes) {
      const left = parseFloat(n.style.left);
      const top = parseFloat(n.style.top);
      expect(left).toBeGreaterThanOrEqual(0);
      expect(left).toBeLessThanOrEqual(100);
      expect(top).toBeGreaterThanOrEqual(0);
      expect(top).toBeLessThanOrEqual(100);
    }
  });

  it('exposes a group role for the figure', () => {
    render(<Strata data={guide} />);
    expect(screen.getByRole('group', { name: /first-principles strata/i })).toBeInTheDocument();
  });

  it('renders an empty state for no principles', () => {
    render(<Strata data={{ principles: [] }} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.getByText(/No principles to display/)).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Strata data={guide} />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
