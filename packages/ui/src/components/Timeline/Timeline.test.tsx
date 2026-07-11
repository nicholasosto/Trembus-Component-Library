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

function mockElementScrollTo(): { scrollTo: ReturnType<typeof vi.fn>; restore: () => void } {
  const scrollTo = vi.fn();
  const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollTo');
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
    configurable: true,
    value: scrollTo,
  });
  return {
    scrollTo,
    restore: () => {
      if (original) Object.defineProperty(HTMLElement.prototype, 'scrollTo', original);
      else Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo');
    },
  };
}

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
    expect(rite).toHaveAttribute('tabindex', '0');
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

  it('uses roving tabindex and Arrow/Home/End keys to select and focus events', async () => {
    const user = userEvent.setup();
    render(<Timeline data={ages} />);
    const pact = screen.getByRole('button', { name: '0 A.V.: The First Pact — Pacts' });
    const rite = screen.getByRole('button', { name: 'XII A.V.: The Silent Rite — Wars' });
    const war = screen.getByRole('button', { name: 'CCXI A.V.: War of Cold Coasts — Wars' });

    expect(pact).toHaveAttribute('tabindex', '0');
    expect(rite).toHaveAttribute('tabindex', '-1');
    pact.focus();

    await user.keyboard('{ArrowRight}');
    expect(rite).toHaveFocus();
    expect(rite).toHaveAttribute('aria-pressed', 'true');
    expect(rite).toHaveAttribute('tabindex', '0');
    expect(pact).toHaveAttribute('tabindex', '-1');

    await user.keyboard('{End}');
    expect(war).toHaveFocus();
    expect(war).toHaveAttribute('aria-pressed', 'true');

    await user.keyboard('{ArrowLeft}');
    expect(rite).toHaveFocus();
    await user.keyboard('{Home}');
    expect(pact).toHaveFocus();
    expect(pact).toHaveAttribute('aria-pressed', 'true');
  });

  it('scrolls selected events without smooth motion when reduced motion is requested', () => {
    const scroll = mockElementScrollTo();
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );

    try {
      render(<Timeline data={ages} defaultSelectedId="war" />);
      expect(scroll.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'auto' }));
    } finally {
      vi.unstubAllGlobals();
      scroll.restore();
    }
  });

  it('preserves roving focus and scroll position across equivalent controlled data rerenders', async () => {
    const scroll = mockElementScrollTo();
    const onSelect = vi.fn();
    const user = userEvent.setup();

    try {
      const { rerender } = render(<Timeline data={ages} selectedId="pact" onSelect={onSelect} />);
      const pact = screen.getByRole('button', { name: '0 A.V.: The First Pact — Pacts' });
      const rite = screen.getByRole('button', { name: 'XII A.V.: The Silent Rite — Wars' });
      pact.focus();
      await user.keyboard('{ArrowRight}');
      expect(rite).toHaveFocus();
      expect(rite).toHaveAttribute('tabindex', '0');
      expect(scroll.scrollTo).toHaveBeenCalledTimes(1);

      rerender(
        <Timeline
          data={{
            ...ages,
            categories: ages.categories?.map((category) => ({ ...category })),
            events: ages.events.map((event) => ({ ...event })),
          }}
          selectedId="pact"
          onSelect={onSelect}
        />,
      );

      expect(rite).toHaveFocus();
      expect(rite).toHaveAttribute('tabindex', '0');
      expect(scroll.scrollTo).toHaveBeenCalledTimes(1);
    } finally {
      scroll.restore();
    }
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

  it('keeps the first authored event when explicit ids are duplicated', () => {
    const { container } = render(
      <Timeline
        data={{
          events: [
            { id: 'duplicate', at: 20, dateLabel: 'XX', label: 'First authored' },
            { id: 'duplicate', at: 1, dateLabel: 'I', label: 'Earlier duplicate' },
            { id: 'unique', at: 30, dateLabel: 'XXX', label: 'Unique' },
          ],
        }}
        selectedId="duplicate"
      />,
    );
    expect(screen.getByRole('button', { name: 'XX: First authored' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.queryByRole('button', { name: 'I: Earlier duplicate' })).not.toBeInTheDocument();
    expect(container.querySelectorAll('.tcl-timeline__event')).toHaveLength(2);
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
