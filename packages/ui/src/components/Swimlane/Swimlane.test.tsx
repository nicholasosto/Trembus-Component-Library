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
    render(<Swimlane data={flow} defaultSelectedId="draft" />);
    expect(screen.getByRole('button', { name: 'Claude: Draft — Active' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('is controllable: onSelect fires but selection does not change without a new prop', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<Swimlane data={flow} selectedId="ask" onSelect={onSelect} />);
    const draft = screen.getByRole('button', { name: 'Claude: Draft — Active' });
    await user.click(draft);
    expect(onSelect).toHaveBeenCalledWith('draft');
    // controlled → still selected on "ask", not "draft"
    expect(draft).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'You: Ask — Done' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
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
});
