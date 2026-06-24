import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '../../test/a11y';
import { Timeline } from './Timeline';
import type { TimelineContract } from './Timeline';

const ages: TimelineContract = {
  title: 'Ages',
  caption: 'A small chronicle.',
  categories: [
    { key: 'pact', label: 'Pacts', tone: 'success' },
    { key: 'war', label: 'Wars', tone: 'danger' },
  ],
  events: [
    {
      id: 'pact',
      at: 0,
      dateLabel: '0 A.V.',
      label: 'The First Pact',
      category: 'pact',
      note: 'Founded on the drowned altar.',
    },
    { id: 'rite', at: 12, dateLabel: 'XII A.V.', label: 'The Silent Rite', category: 'war' },
    {
      id: 'war',
      at: 211,
      dateLabel: 'CCXI A.V.',
      label: 'War of Cold Coasts',
      category: 'war',
      note: 'Salt meets steel.',
    },
  ],
};

describe('Timeline', () => {
  it('renders the header and a button per event with a date·title·category name', () => {
    render(<Timeline data={ages} />);
    expect(screen.getByText('Ages')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '0 A.V.: The First Pact — Pacts' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'CCXI A.V.: War of Cold Coasts — Wars' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Ages' })).toBeInTheDocument();
  });

  it('selects an event on click (aria-pressed) and reveals its note in the inspector', async () => {
    const user = userEvent.setup();
    render(<Timeline data={ages} />);
    const pact = screen.getByRole('button', { name: '0 A.V.: The First Pact — Pacts' });
    expect(pact).toHaveAttribute('aria-pressed', 'false');
    await user.click(pact);
    expect(pact).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Founded on the drowned altar.')).toBeInTheDocument();
  });

  it('honors defaultSelectedId (uncontrolled)', () => {
    render(<Timeline data={ages} defaultSelectedId="war" />);
    expect(
      screen.getByRole('button', { name: 'CCXI A.V.: War of Cold Coasts — Wars' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('is controllable: onSelect fires but selection does not change without a new prop', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<Timeline data={ages} selectedId="pact" onSelect={onSelect} />);
    const rite = screen.getByRole('button', { name: 'XII A.V.: The Silent Rite — Wars' });
    await user.click(rite);
    expect(onSelect).toHaveBeenCalledWith('rite');
    expect(rite).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: '0 A.V.: The First Pact — Pacts' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('orders events by date and steps the selection with the prev/next arrows', async () => {
    const user = userEvent.setup();
    render(<Timeline data={ages} defaultSelectedId="pact" />);
    await user.click(screen.getByRole('button', { name: 'Next event' }));
    expect(
      screen.getByRole('button', { name: 'XII A.V.: The Silent Rite — Wars' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Previous event' }));
    expect(screen.getByRole('button', { name: '0 A.V.: The First Pact — Pacts' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('disables Previous on the first event', () => {
    render(<Timeline data={ages} defaultSelectedId="pact" />);
    expect(screen.getByRole('button', { name: 'Previous event' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next event' })).toBeEnabled();
  });

  it('disables Next on the last event', () => {
    render(<Timeline data={ages} defaultSelectedId="war" />);
    expect(screen.getByRole('button', { name: 'Next event' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous event' })).toBeEnabled();
  });

  it('falls back to the index — not the label — for events with no id', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    const dupes: TimelineContract = {
      events: [
        { at: 1, dateLabel: 'I', label: 'Repeat' },
        { at: 2, dateLabel: 'I', label: 'Repeat' },
      ],
    };
    render(<Timeline data={dupes} onSelect={onSelect} />);
    const buttons = screen.getAllByRole('button', { name: 'I: Repeat' });
    await user.click(buttons[1]);
    expect(onSelect).toHaveBeenCalledWith('e1');
  });

  it('shows an empty message when there are no events', () => {
    render(<Timeline data={{ title: 'Empty', events: [] }} />);
    expect(screen.getByText('No events to chronicle')).toBeInTheDocument();
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Timeline data={ages} defaultSelectedId="pact" />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
