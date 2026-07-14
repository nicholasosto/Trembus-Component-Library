import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '../../test/a11y';
import { Swimlane } from './Swimlane';
import type { SwimlaneContract } from './Swimlane';

const flow: SwimlaneContract = {
  title: 'Loop',
  caption: 'A tiny human ↔ agent loop.',
  lanes: [
    { id: 'human', label: 'You', kind: 'human' },
    { id: 'ai', label: 'Claude', kind: 'ai' },
  ],
  steps: [
    { id: 'ask', lane: 'human', label: 'Ask', status: 'done', note: 'Plain-language request.' },
    { id: 'draft', lane: 'ai', label: 'Draft', status: 'active' },
    { id: 'review', lane: 'human', label: 'Review', status: 'pending', to: [] },
  ],
};

describe('Swimlane', () => {
  it('renders the header and a button per step with an actor·step·status name', () => {
    render(<Swimlane data={flow} />);
    expect(screen.getByText('Loop')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'You: Ask — Done' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Claude: Draft — Active' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Loop' })).toBeInTheDocument();
  });

  it('selects a step on click (aria-pressed) and reveals its handoff in the inspector', async () => {
    const user = userEvent.setup();
    render(<Swimlane data={flow} />);
    const ask = screen.getByRole('button', { name: 'You: Ask — Done' });
    expect(ask).toHaveAttribute('aria-pressed', 'false');
    await user.click(ask);
    expect(ask).toHaveAttribute('aria-pressed', 'true');
    // default connector → next step (Draft)
    expect(screen.getByText(/Hands off to/)).toHaveTextContent('Claude · Draft');
    expect(screen.getByText('Plain-language request.')).toBeInTheDocument();
  });

  it('honors defaultSelectedId (uncontrolled)', () => {
    const { container } = render(<Swimlane data={flow} defaultSelectedId="draft" />);
    const draft = screen.getByRole('button', { name: 'Claude: Draft — Active' });
    expect(draft).toHaveAttribute('aria-pressed', 'true');
    expect(draft).toHaveAttribute('tabindex', '0');
    expect(container.querySelectorAll('.tcl-swimlane__step[tabindex="0"]')).toHaveLength(1);
  });

  it('is controllable: onSelect fires but selection does not change without a new prop', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<Swimlane data={flow} selectedId="ask" onSelect={onSelect} />);
    const draft = screen.getByRole('button', { name: 'Claude: Draft — Active' });
    await user.click(draft);
    expect(onSelect).toHaveBeenCalledWith('draft');
    expect(draft).toHaveAttribute('tabindex', '0');
    // controlled → still selected on "ask", not "draft"
    expect(draft).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'You: Ask — Done' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('roves with arrow keys and Home/End while selecting the focused step', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <Swimlane data={flow} defaultSelectedId="ask" onSelect={onSelect} />,
    );
    const ask = screen.getByRole('button', { name: 'You: Ask — Done' });
    const draft = screen.getByRole('button', { name: 'Claude: Draft — Active' });
    const review = screen.getByRole('button', { name: 'You: Review — Pending' });

    ask.focus();
    await user.keyboard('{ArrowRight}');
    expect(draft).toHaveFocus();
    expect(draft).toHaveAttribute('tabindex', '0');
    expect(draft).toHaveAttribute('aria-pressed', 'true');

    await user.keyboard('{End}');
    expect(review).toHaveFocus();
    await user.keyboard('{Home}');
    expect(ask).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(review).toHaveFocus();
    expect(container.querySelectorAll('.tcl-swimlane__step[tabindex="0"]')).toHaveLength(1);
    expect(onSelect).toHaveBeenLastCalledWith('review');
  });

  it('keeps controlled roving focus stable across equivalent data rerenders', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<Swimlane data={flow} selectedId="ask" onSelect={onSelect} />);
    const ask = screen.getByRole('button', { name: 'You: Ask — Done' });
    const draft = screen.getByRole('button', { name: 'Claude: Draft — Active' });

    ask.focus();
    await user.keyboard('{ArrowRight}');
    expect(draft).toHaveFocus();
    expect(draft).toHaveAttribute('tabindex', '0');
    expect(draft).toHaveAttribute('aria-pressed', 'false');
    expect(onSelect).toHaveBeenLastCalledWith('draft');

    rerender(
      <Swimlane
        data={{
          ...flow,
          lanes: flow.lanes.map((lane) => ({ ...lane })),
          steps: flow.steps.map((step) => ({ ...step })),
        }}
        selectedId="ask"
        onSelect={onSelect}
      />,
    );

    expect(draft).toHaveFocus();
    expect(draft).toHaveAttribute('tabindex', '0');
    expect(ask).toHaveAttribute('aria-pressed', 'true');
  });

  it('falls back to the index — not the label — for steps with no id', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    const dupes: SwimlaneContract = {
      lanes: [{ label: 'You' }],
      steps: [
        { lane: 'You', label: 'Step' },
        { lane: 'You', label: 'Step' },
      ],
    };
    render(<Swimlane data={dupes} onSelect={onSelect} />);
    const buttons = screen.getAllByRole('button', { name: /Step/ });
    await user.click(buttons[1]);
    expect(onSelect).toHaveBeenCalledWith('s1');
  });

  it('resolves a step lane by label, and skips steps whose lane is unknown', () => {
    const data: SwimlaneContract = {
      lanes: [{ id: 'a', label: 'Alpha' }],
      steps: [
        { lane: 'Alpha', label: 'By label' },
        { lane: 'ghost', label: 'Orphan' },
      ],
    };
    render(<Swimlane data={data} />);
    expect(screen.getByRole('button', { name: /By label/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Orphan/ })).not.toBeInTheDocument();
  });

  it('highlights the connectors touching the selected step', async () => {
    const user = userEvent.setup();
    const { container } = render(<Swimlane data={flow} />);
    await user.click(screen.getByRole('button', { name: 'Claude: Draft — Active' }));
    // ask→draft and draft→review both touch "draft"
    expect(container.querySelectorAll('.tcl-swimlane__edge.is-active').length).toBeGreaterThan(0);
  });

  it('dedupes repeated handoff targets into a single connector', () => {
    const data: SwimlaneContract = {
      lanes: [{ label: 'You' }],
      steps: [
        { id: 'a', lane: 'You', label: 'A', to: ['b', 'b', 'a'] },
        { id: 'b', lane: 'You', label: 'B', to: [] },
      ],
    };
    const { container } = render(<Swimlane data={data} />);
    // 'b' twice + self 'a' collapse to one a→b edge (no duplicate React keys)
    expect(container.querySelectorAll('.tcl-swimlane__edge').length).toBe(1);
  });

  it('shows an empty message when there are no steps', () => {
    render(<Swimlane data={{ title: 'Empty', lanes: [{ label: 'You' }], steps: [] }} />);
    expect(screen.getByText('No steps to lay out')).toBeInTheDocument();
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Swimlane data={flow} defaultSelectedId="ask" />);
    expect(await a11yViolations(container)).toEqual([]);
  });

  it('renders a kind glyph per lane head — kind word in the tooltip, not as text', () => {
    const { container } = render(<Swimlane data={flow} />);
    expect(container.querySelector('.tcl-swimlane__lane-glyph [data-glyph="user"]')).toBeTruthy();
    expect(
      container.querySelector('.tcl-swimlane__lane-glyph [data-glyph="sparkle"]'),
    ).toBeTruthy();
    // the raw kind word is no longer rendered as text…
    expect(screen.queryByText('human')).not.toBeInTheDocument();
    // …it lives in the glyph slot's tooltip
    const slots = container.querySelectorAll('.tcl-swimlane__lane-glyph');
    expect(Array.from(slots).map((s) => s.getAttribute('title'))).toEqual(['human', 'ai']);
  });

  it('keeps an empty, tooltip-less glyph slot for neutral lanes so labels align', () => {
    const { container } = render(
      <Swimlane data={{ lanes: [{ label: 'Notes' }], steps: [{ lane: 'Notes', label: 'A' }] }} />,
    );
    const slot = container.querySelector('.tcl-swimlane__lane-glyph');
    expect(slot).toBeTruthy();
    expect(slot?.getAttribute('title')).toBeNull();
    expect(slot?.querySelector('svg')).toBeNull();
  });

  it('defaults to the original cozy geometry; density="comfortable" raises the cells', () => {
    const { container, rerender } = render(<Swimlane data={flow} />);
    const step = () => container.querySelector('.tcl-swimlane__step') as HTMLElement;
    const laneHead = () => container.querySelector('.tcl-swimlane__lane-head') as HTMLElement;
    // cozy = the pre-density metrics, byte-for-byte (the back-compat contract)
    expect(step().style.height).toBe('60px');
    expect(step().style.width).toBe('140px');
    expect(laneHead().style.height).toBe('88px');
    expect((container.querySelector('.tcl-swimlane') as HTMLElement).dataset.density).toBe('cozy');

    rerender(<Swimlane data={flow} density="comfortable" />);
    expect(step().style.height).toBe('76px');
    expect(step().style.width).toBe('140px');
    expect(laneHead().style.height).toBe('104px');
    expect((container.querySelector('.tcl-swimlane') as HTMLElement).dataset.density).toBe(
      'comfortable',
    );
  });

  it('gives the detail line a hover title matching its text', () => {
    const data: SwimlaneContract = {
      lanes: [{ label: 'You' }],
      steps: [{ lane: 'You', label: 'Step', detail: 'reads the codebase' }],
    };
    render(<Swimlane data={data} />);
    expect(screen.getByText('reads the codebase')).toHaveAttribute('title', 'reads the codebase');
  });

  it('folds marker titles into the step accessible name; the marks stay decorative', () => {
    const data: SwimlaneContract = {
      lanes: [{ label: 'You' }],
      steps: [
        {
          id: 'a',
          lane: 'You',
          label: 'Build',
          markers: [
            { id: 'm1', glyph: 'check', title: 'Realizes decision 0013' },
            { id: 'm2', title: 'Tracked in plan' }, // no glyph → dot mark
          ],
        },
      ],
    };
    const { container } = render(<Swimlane data={data} />);
    expect(
      screen.getByRole('button', {
        name: 'You: Build — Pending — Realizes decision 0013, Tracked in plan',
      }),
    ).toBeInTheDocument();
    const markers = container.querySelector('.tcl-swimlane__step-markers');
    expect(markers?.getAttribute('aria-hidden')).toBe('true');
    expect(markers?.querySelector('[data-glyph="check"]')).toBeTruthy();
    const marks = markers?.querySelectorAll('.tcl-swimlane__step-marker') ?? [];
    expect(marks[0]?.getAttribute('title')).toBe('Realizes decision 0013');
    expect(marks[1]?.textContent).toBe('•');
  });

  it('degrades prototype-chain glyph/kind names to the documented fallbacks, no crash', () => {
    const data: SwimlaneContract = {
      lanes: [{ label: 'You', kind: 'constructor' as never }],
      steps: [
        {
          id: 'a',
          lane: 'You',
          label: 'A',
          markers: [{ id: 'm', glyph: 'constructor', title: 'junk glyph' }],
        },
      ],
    };
    const { container } = render(<Swimlane data={data} />);
    // junk marker glyph → the promised dot mark, not a crashed tree
    expect(container.querySelector('.tcl-swimlane__step-marker')?.textContent).toBe('•');
    // junk lane kind → neutral: empty glyph slot, no tooltip
    const slot = container.querySelector('.tcl-swimlane__lane-glyph');
    expect(slot?.querySelector('svg')).toBeNull();
    expect(slot?.getAttribute('title')).toBeNull();
    expect(
      screen.getByRole('button', { name: 'You: A — Pending — junk glyph' }),
    ).toBeInTheDocument();
  });

  it('has no axe violations with markers and comfortable density', async () => {
    const withMarkers: SwimlaneContract = {
      ...flow,
      steps: flow.steps.map((s) => ({ ...s, markers: [{ glyph: 'check', title: 'ok' }] })),
    };
    const { container } = render(<Swimlane data={withMarkers} density="comfortable" />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
