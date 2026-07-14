import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '../../test/a11y';
import { RunHistory } from './RunHistory';
import type { RunHistoryContract } from './RunHistory';

const flow: RunHistoryContract = {
  title: 'Runs',
  runs: [
    {
      id: 'r127',
      label: '#127',
      status: 'succeeded',
      startedAt: '2026-06-20T10:00:00.000Z',
      durationMs: 228_000,
      note: 'merged to main',
      stepOutcomes: [
        { step: 'a', status: 'done' },
        { step: 'b', status: 'blocked' },
      ],
      outputs: [
        { label: 'transcript.md', href: 'https://example.com/t', kind: 'doc' },
        { label: 'PR #482', href: 'https://example.com/pr', kind: 'pr' },
      ],
    },
    { id: 'r126', label: '#126', status: 'running', startedAt: '2026-06-20T09:00:00.000Z' },
  ],
};

describe('RunHistory', () => {
  it('renders the title and a row button per run with an actor·status accessible name', () => {
    render(<RunHistory data={flow} />);
    expect(screen.getByText('Runs')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Succeeded #127/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Running #126.*in progress/ })).toBeInTheDocument();
  });

  it('selects a run (onSelectRun) and reveals its outputs as real links', async () => {
    const onSelectRun = vi.fn();
    const user = userEvent.setup();
    render(<RunHistory data={flow} onSelectRun={onSelectRun} />);
    await user.click(screen.getByRole('button', { name: /Succeeded #127/ }));
    expect(onSelectRun).toHaveBeenCalledWith('r127');
    expect(screen.getByRole('link', { name: /transcript\.md/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /PR #482/ })).toHaveAttribute(
      'href',
      'https://example.com/pr',
    );
    expect(screen.getByText('merged to main')).toBeInTheDocument();
  });

  it('honors defaultSelectedRunId (uncontrolled)', () => {
    render(<RunHistory data={flow} defaultSelectedRunId="r127" />);
    expect(screen.getByRole('link', { name: /transcript\.md/ })).toBeInTheDocument();
  });

  it('is controllable: onSelectRun fires but selection does not change without a new prop', async () => {
    const onSelectRun = vi.fn();
    const user = userEvent.setup();
    render(<RunHistory data={flow} selectedRunId="r126" onSelectRun={onSelectRun} />);
    await user.click(screen.getByRole('button', { name: /Succeeded #127/ }));
    expect(onSelectRun).toHaveBeenCalledWith('r127');
    // still showing the controlled run #126 (in flight, no outputs) — not #127
    expect(screen.queryByRole('link', { name: /transcript\.md/ })).not.toBeInTheDocument();
  });

  it('falls back to the index — not the label — for runs with no id', async () => {
    const onSelectRun = vi.fn();
    const user = userEvent.setup();
    const dupes: RunHistoryContract = {
      runs: [
        { label: 'Run', status: 'succeeded', startedAt: '2026-06-20T10:00:00.000Z' },
        { label: 'Run', status: 'failed', startedAt: '2026-06-20T09:00:00.000Z' },
      ],
    };
    render(<RunHistory data={dupes} onSelectRun={onSelectRun} />);
    await user.click(screen.getByRole('button', { name: /Failed Run/ }));
    expect(onSelectRun).toHaveBeenCalledWith('r1');
  });

  it('renders the machine <time> and an em-dash duration for an in-flight run', () => {
    const { container } = render(<RunHistory data={flow} />);
    // default sort = started desc → #127 (10:00) is the first row
    const times = container.querySelectorAll('time');
    expect(times[0]).toHaveAttribute('dateTime', '2026-06-20T10:00:00.000Z');
    // the running run names its duration as "in progress"
    expect(screen.getByRole('button', { name: /#126.*in progress/ })).toBeInTheDocument();
  });

  it('sorts by duration when the Duration header is clicked', async () => {
    const user = userEvent.setup();
    const data: RunHistoryContract = {
      runs: [
        { id: 'a', label: 'Slow', status: 'succeeded', startedAt: 3, durationMs: 180_000 },
        { id: 'b', label: 'Mid', status: 'succeeded', startedAt: 2, durationMs: 60_000 },
        { id: 'c', label: 'Quick', status: 'succeeded', startedAt: 1, durationMs: 30_000 },
      ],
    };
    const { container } = render(<RunHistory data={data} />);
    await user.click(screen.getByRole('button', { name: /Duration/ }));
    const rows = container.querySelectorAll('.tcl-table__body .tcl-table__row');
    expect(rows[0]).toHaveTextContent('Quick');
    expect(rows[2]).toHaveTextContent('Slow');
  });

  it('shows an empty message when there are no runs', () => {
    render(<RunHistory data={{ title: 'Runs', runs: [] }} />);
    expect(screen.getByText('No runs yet')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Succeeded/ })).not.toBeInTheDocument();
  });

  it('renders git-style op marks on output chips, op word in the accessible name', async () => {
    const withOps: RunHistoryContract = {
      runs: [
        {
          id: 'r1',
          label: '#1',
          status: 'succeeded',
          startedAt: '2026-06-20T10:00:00.000Z',
          outputs: [
            { label: 'report.pdf', href: 'https://example.com/r', kind: 'doc', op: 'create' },
            { label: 'flag.ts', kind: 'doc', op: 'delete' },
            { label: 'plain.txt', kind: 'doc' },
          ],
        },
      ],
    };
    const { container } = render(<RunHistory data={withOps} defaultSelectedRunId="r1" />);
    // the op word (sr-only) joins the name; the sign + ↗ stay decorative
    expect(screen.getByRole('link', { name: 'created report.pdf' })).toBeInTheDocument();
    const signs = container.querySelectorAll('.tcl-run-history__chip-op');
    expect(Array.from(signs).map((s) => s.textContent)).toEqual(['+', '−']);
    expect(signs[0]?.getAttribute('aria-hidden')).toBe('true');
    // a static (non-link) chip carries its op the same way
    expect(screen.getByText('deleted')).toHaveClass('tcl-sr-only');
    // chips without an op render exactly as before — no mark, no sr word
    expect(screen.getByText('plain.txt').querySelector('.tcl-run-history__chip-op')).toBeNull();
    expect(await a11yViolations(container)).toEqual([]);
  });

  it('degrades junk op values (incl. prototype-chain keys) to an op-less chip', () => {
    const junk: RunHistoryContract = {
      runs: [
        {
          id: 'r1',
          status: 'succeeded',
          startedAt: '2026-06-20T10:00:00.000Z',
          outputs: [
            {
              label: 'a.txt',
              kind: 'doc',
              op: 'constructor' as never,
            },
            { label: 'b.txt', kind: 'doc', op: 'remove' as never },
          ],
        },
      ],
    };
    const { container } = render(<RunHistory data={junk} defaultSelectedRunId="r1" />);
    expect(container.querySelectorAll('.tcl-run-history__chip-op')).toHaveLength(0);
    expect(container.querySelectorAll('.tcl-run-history__chip .tcl-sr-only')).toHaveLength(0);
    expect(screen.getByText('a.txt')).toBeInTheDocument();
    expect(screen.getByText('b.txt')).toBeInTheDocument();
  });

  it('has no axe violations (populated and empty)', async () => {
    const { container, rerender } = render(<RunHistory data={flow} defaultSelectedRunId="r127" />);
    expect(await a11yViolations(container)).toEqual([]);
    rerender(<RunHistory data={{ runs: [] }} />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
