import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '@trembus/tokens/testing';
import { EpisodeDeck } from './EpisodeDeck';
import type { EpisodeDeckContract } from './EpisodeDeck';

const season: EpisodeDeckContract = {
  title: 'Episode deck',
  episodes: [
    {
      id: 'ep01',
      title: 'The Invocation',
      code: 'S01 · EP 01',
      state: 'available',
      synopsis: 'the first nail',
    },
    { id: 'ep02', title: 'The Ninth Gate', code: 'S01 · EP 02', state: 'streaming' },
    {
      id: 'ep04',
      title: 'The Kept Knight Speaks',
      code: 'S01 · EP 04',
      state: 'locked',
      releaseAt: 'APR 26',
    },
  ],
};

describe('EpisodeDeck', () => {
  it('renders one button per episode with a numeral + state encoded in the accessible name', () => {
    render(<EpisodeDeck data={season} />);
    expect(screen.getAllByRole('button')).toHaveLength(3);
    // derived Roman numerals (I, II, III) + state words
    expect(
      screen.getByRole('button', { name: 'I. The Invocation, S01 · EP 01, Watch' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'II. The Ninth Gate, S01 · EP 02, Now streaming' }),
    ).toBeInTheDocument();
    // locked episode carries its release date in the name
    expect(
      screen.getByRole('button', {
        name: 'III. The Kept Knight Speaks, S01 · EP 04, locked, releases APR 26',
      }),
    ).toBeInTheDocument();
  });

  it('selects an episode (uncontrolled): aria-pressed flips, onSelect fires, inspector updates', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { container } = render(<EpisodeDeck data={season} onSelect={onSelect} />);
    const ep01 = screen.getByRole('button', { name: /^I\. The Invocation/ });
    expect(ep01).toHaveAttribute('aria-pressed', 'false');
    await user.click(ep01);
    expect(ep01).toHaveAttribute('aria-pressed', 'true');
    expect(onSelect).toHaveBeenCalledWith('ep01');
    // the live inspector announces the selection + synopsis
    const live = container.querySelector('[aria-live="polite"]')!;
    expect(within(live as HTMLElement).getByText(/the first nail/)).toBeInTheDocument();
  });

  it('respects a controlled selectedId (click fires onSelect but does not move the ring)', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<EpisodeDeck data={season} selectedId="ep01" onSelect={onSelect} />);
    expect(screen.getByRole('button', { name: /^I\. The Invocation/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const ep02 = screen.getByRole('button', { name: /^II\. The Ninth Gate/ });
    await user.click(ep02);
    expect(onSelect).toHaveBeenCalledWith('ep02');
    expect(ep02).toHaveAttribute('aria-pressed', 'false'); // controlled — parent owns it
  });

  it('exposes a group role for the list', () => {
    render(<EpisodeDeck data={season} />);
    expect(screen.getByRole('group', { name: /episode deck/i })).toBeInTheDocument();
  });

  it('renders cleanly with no episodes', () => {
    render(<EpisodeDeck data={{ episodes: [] }} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.getByText(/Select an episode/)).toBeInTheDocument();
  });

  it('dedups duplicate episode ids (first wins): no double selection ring or key collision', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const dup: EpisodeDeckContract = {
      episodes: [
        { id: 'dup', title: 'First' },
        { id: 'dup', title: 'Second' },
        { id: 'c', title: 'Third' },
      ],
    };
    render(<EpisodeDeck data={dup} selectedId="dup" />);
    // first wins → the duplicate-id "Second" is dropped
    expect(screen.getByRole('button', { name: /First/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Second/ })).toBeNull();
    // exactly one row is selected — no double ring from a colliding id
    const pressed = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-pressed') === 'true');
    expect(pressed).toHaveLength(1);
    // and no React duplicate-key warning
    expect(spy).not.toHaveBeenCalledWith(expect.stringContaining('same key'));
    spy.mockRestore();
  });

  it('gives missing-id episodes collision-proof synthetic ids (no duplicate keys)', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    // a synthetic id `ep1` would collide with the explicit one at another index
    const mixed: EpisodeDeckContract = {
      episodes: [{ id: 'ep1', title: 'Explicit' }, { title: 'Missing A' }, { title: 'Missing B' }],
    };
    render(<EpisodeDeck data={mixed} />);
    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(spy).not.toHaveBeenCalledWith(expect.stringContaining('same key'));
    spy.mockRestore();
  });

  it('has no axe violations', async () => {
    const { container } = render(<EpisodeDeck data={season} defaultSelectedId="ep01" />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
