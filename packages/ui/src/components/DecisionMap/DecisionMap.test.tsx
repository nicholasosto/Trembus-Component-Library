import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '../../test/a11y';
import { DecisionMap } from './DecisionMap';
import type { DecisionMapContract } from './DecisionMap';

const sessionState: DecisionMapContract = {
  title: 'Where should session state live?',
  context: 'Pick before the beta.',
  recommendation: {
    optionId: 'pg',
    strength: 'strong',
    confidence: 82,
    rationale: 'The ops story is free.',
  },
  options: [
    {
      id: 'pg',
      label: 'Postgres',
      summary: 'A session table in the main DB.',
      tone: 'success',
      effort: 'medium',
      reversibility: 'reversible',
      confidence: 82,
      consequences: [
        {
          label: 'One fewer service',
          tone: 'success',
          likelihood: 'certain',
          horizon: 'immediate',
        },
        {
          label: 'Primary DB takes session load',
          tone: 'warning',
          likelihood: 'likely',
          then: [
            {
              label: 'Read replica later',
              tone: 'danger',
              likelihood: 'possible',
              horizon: 'later',
            },
          ],
        },
        { label: 'Backups already cover it', tone: 'success' },
      ],
    },
    {
      id: 'redis',
      label: 'Redis',
      tone: 'info',
      effort: 'high',
      reversibility: 'costly',
      consequences: [{ label: 'Fast reads', tone: 'success' }],
    },
  ],
};

const decided: DecisionMapContract = {
  ...sessionState,
  status: 'decided',
  decidedId: 'pg',
  decidedNote: 'Locked: Postgres.',
};

const PG_SENTENCE =
  'Option A: Postgres — recommended, strong; confidence 82%; effort medium; reversible; 4 consequences: 2 benefits, 1 caution, 1 risk';

describe('DecisionMap', () => {
  it('renders a button per option whose accessible name is the composed sentence', () => {
    render(<DecisionMap data={sessionState} />);
    expect(screen.getByRole('button', { name: PG_SENTENCE })).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Option B: Redis; effort high; costly to reverse; 1 consequence: 1 benefit',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: 'Where should session state live?' }),
    ).toBeInTheDocument();
  });

  it('selects an option on click and reveals it in the aria-live inspector (uncontrolled)', async () => {
    const user = userEvent.setup();
    const { container } = render(<DecisionMap data={sessionState} />);
    const redis = screen.getByRole('button', { name: /^Option B: Redis/ });
    expect(redis).toHaveAttribute('aria-pressed', 'false');
    await user.click(redis);
    expect(redis).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Option B — Redis')).toBeInTheDocument();
    const inspector = container.querySelector('.tcl-decision-map__inspector');
    expect(inspector).toHaveAttribute('aria-live', 'polite');
  });

  it('is controllable: onSelect fires but selection does not change without a new prop', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<DecisionMap data={sessionState} selectedId="pg" onSelect={onSelect} />);
    const redis = screen.getByRole('button', { name: /^Option B: Redis/ });
    await user.click(redis);
    expect(onSelect).toHaveBeenCalledWith('redis');
    expect(redis).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: PG_SENTENCE })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('auto-seeds the selection to the recommended option when uncontrolled with no defaultSelectedId', () => {
    render(<DecisionMap data={sessionState} />);
    expect(screen.getByRole('button', { name: PG_SENTENCE })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText('Consequences — Option A: Postgres')).toBeInTheDocument();
    expect(
      screen.getByText(/Recommended — strong \(confidence 82%\): The ops story is free\./),
    ).toBeInTheDocument();
  });

  it('lets an explicit defaultSelectedId win over the recommendation auto-seed', () => {
    render(<DecisionMap data={sessionState} defaultSelectedId="redis" />);
    expect(screen.getByRole('button', { name: /^Option B: Redis/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: PG_SENTENCE })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('falls back to the index — not the label — for options with no id', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    const dupes: DecisionMapContract = {
      title: 'Dupes',
      options: [{ label: 'Same' }, { label: 'Same' }],
    };
    render(<DecisionMap data={dupes} onSelect={onSelect} />);
    const buttons = screen.getAllByRole('button', { name: /^Option [AB]: Same/ });
    expect(buttons).toHaveLength(2);
    await user.click(buttons[1]);
    expect(onSelect).toHaveBeenCalledWith('o1');
  });

  it('clamps confidence once — bar var, printed %, and aria sentence all agree', () => {
    const wild: DecisionMapContract = {
      title: 'Clamp',
      options: [
        { id: 'over', label: 'Over', confidence: 150 },
        { id: 'under', label: 'Under', confidence: -5 },
      ],
    };
    render(<DecisionMap data={wild} />);
    const over = screen.getByRole('button', { name: /^Option A: Over/ });
    expect(over.style.getPropertyValue('--value')).toBe('100%');
    expect(within(over).getByText('100%')).toBeInTheDocument();
    expect(over.getAttribute('aria-label')).toContain('confidence 100%');
    const under = screen.getByRole('button', { name: /^Option B: Under/ });
    expect(under.style.getPropertyValue('--value')).toBe('0%');
    expect(within(under).getByText('0%')).toBeInTheDocument();
    expect(under.getAttribute('aria-label')).toContain('confidence 0%');
  });

  it('ignores an unknown recommendation.optionId: no ribbon, no auto-seed, no crash', () => {
    const { container } = render(
      <DecisionMap
        data={{
          ...sessionState,
          recommendation: { optionId: 'nope', strength: 'strong' },
        }}
      />,
    );
    expect(container.querySelector('[data-recommended]')).toBeNull();
    screen
      .getAllByRole('button')
      .forEach((b) => expect(b).toHaveAttribute('aria-pressed', 'false'));
    expect(screen.getByText('Select an option to trace its consequences.')).toBeInTheDocument();
    expect(
      screen.getByText('Select an option to inspect the recommendation and its consequences.'),
    ).toBeInTheDocument();
  });

  it('renders a likelihood word chip for every consequence, defaulting to likely', () => {
    render(<DecisionMap data={sessionState} />);
    const backup = screen.getByText('Backups already cover it').closest('li');
    expect(backup).toHaveAttribute('data-likelihood', 'likely');
    expect(within(backup as HTMLElement).getByText('likely')).toBeInTheDocument();
    const replica = screen.getByText('Read replica later').closest('li');
    expect(replica).toHaveAttribute('data-likelihood', 'possible');
    expect(within(replica as HTMLElement).getByText('possible')).toBeInTheDocument();
  });

  it('renders nested then-chains fully; data-depth keeps counting past the visual cap', () => {
    const chain = (depth: number): DecisionMapContract['options'][number]['consequences'] =>
      depth === 0 ? undefined : [{ label: `Effect d${depth}`, then: chain(depth - 1) }];
    const deep: DecisionMapContract = {
      title: 'Deep',
      options: [{ id: 'a', label: 'A', consequences: chain(5) }],
    };
    const { container } = render(<DecisionMap data={deep} defaultSelectedId="a" />);
    [5, 4, 3, 2, 1].forEach((d) => expect(screen.getByText(`Effect d${d}`)).toBeInTheDocument());
    const depths = Array.from(container.querySelectorAll('.tcl-decision-map__chain'), (ul) =>
      ul.getAttribute('data-depth'),
    );
    expect(depths).toEqual(['0', '1', '2', '3', '4']);
  });

  it('tallies consequences by valence with words, counting nested effects', () => {
    render(<DecisionMap data={sessionState} />);
    const pg = screen.getByRole('button', { name: PG_SENTENCE });
    const benefits = within(pg).getByText('2 benefits');
    expect(benefits).toHaveAttribute('data-bucket', 'benefit');
    expect(within(pg).getByText('1 caution')).toHaveAttribute('data-bucket', 'caution');
    expect(within(pg).getByText('1 risk')).toHaveAttribute('data-bucket', 'risk');
  });

  it('decided: chosen card gets the Chosen chip; other cards stay enabled and undimmed', async () => {
    const user = userEvent.setup();
    const { container } = render(<DecisionMap data={decided} />);
    expect(container.querySelector('.tcl-decision-map')).toHaveAttribute('data-status', 'decided');
    expect(screen.getByText('Decided')).toBeInTheDocument();
    const pg = screen.getByRole('button', { name: /— chosen;/ });
    expect(within(pg).getByText('Chosen')).toBeInTheDocument();
    expect(screen.getByText('Locked: Postgres.')).toBeInTheDocument();
    const redis = screen.getByRole('button', { name: /^Option B: Redis/ });
    expect(redis).toBeEnabled();
    expect(redis).not.toHaveAttribute('aria-disabled');
    expect(redis.className).not.toMatch(/dim|muted|faded/i);
    await user.click(redis);
    expect(redis).toHaveAttribute('aria-pressed', 'true');
  });

  it('selects with the keyboard (Enter and Space)', async () => {
    const user = userEvent.setup();
    const plain: DecisionMapContract = { ...sessionState };
    delete plain.recommendation;
    render(<DecisionMap data={plain} />);
    const pg = screen.getByRole('button', { name: /^Option A: Postgres/ });
    const redis = screen.getByRole('button', { name: /^Option B: Redis/ });
    await user.tab();
    expect(pg).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(pg).toHaveAttribute('aria-pressed', 'true');
    await user.tab();
    expect(redis).toHaveFocus();
    await user.keyboard(' ');
    expect(redis).toHaveAttribute('aria-pressed', 'true');
    expect(pg).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows a quiet empty message when options are missing or empty', () => {
    render(<DecisionMap data={{ title: 'Nothing yet', options: [] }} />);
    expect(screen.getByText('No options mapped yet.')).toBeInTheDocument();
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    expect(() => render(<DecisionMap data={{} as DecisionMapContract} />)).not.toThrow();
  });

  it('shows "No consequences mapped yet." for a selected option without consequences, and omits absent chips', () => {
    const sparse: DecisionMapContract = {
      title: 'Sparse',
      options: [{ id: 'bare', label: 'Bare' }],
    };
    render(<DecisionMap data={sparse} defaultSelectedId="bare" />);
    expect(screen.getByText('No consequences mapped yet.')).toBeInTheDocument();

    render(<DecisionMap data={sessionState} />);
    const load = screen.getByText('Primary DB takes session load').closest('li');
    expect((load as HTMLElement).querySelector(':scope > * > [data-kind="horizon"]')).toBeNull();
  });

  it('maps accent tone to --tcl-text ink for text (AA); other tones keep their hue', () => {
    const toned: DecisionMapContract = {
      title: 'Tones',
      options: [
        { id: 'a', label: 'Gold', tone: 'accent' },
        { id: 'b', label: 'Green', tone: 'success' },
      ],
    };
    render(<DecisionMap data={toned} />);
    const gold = screen.getByRole('button', { name: /^Option A: Gold/ });
    expect(gold.style.getPropertyValue('--option-ink')).toBe('var(--tcl-text)');
    const green = screen.getByRole('button', { name: /^Option B: Green/ });
    expect(green.style.getPropertyValue('--option-ink')).toBe('var(--tcl-status-success)');
  });

  // Regression (review F1): duplicate ids must not double-select or mis-target the inspector.
  it('uniquifies duplicate option ids so selection cannot double-select (first wins)', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    const dupIds: DecisionMapContract = {
      title: 'Dup ids',
      options: [
        { id: 'x', label: 'First' },
        { id: 'x', label: 'Second' },
      ],
    };
    render(<DecisionMap data={dupIds} onSelect={onSelect} />);
    const second = screen.getByRole('button', { name: /^Option B: Second/ });
    await user.click(second);
    expect(onSelect).toHaveBeenCalledWith('x-dup');
    expect(second).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /^Option A: First/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByText('Option B — Second')).toBeInTheDocument();
  });

  // Regression (review F1): an explicit id must not collide with another option's index fallback.
  it('keeps an explicit id from colliding with an index fallback', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    const collide: DecisionMapContract = {
      title: 'Collide',
      options: [{ label: 'NoId' }, { id: 'o0', label: 'ExplicitO0' }],
    };
    render(<DecisionMap data={collide} onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: /^Option B: ExplicitO0/ }));
    expect(onSelect).toHaveBeenCalledWith('o0-dup');
    expect(screen.getByRole('button', { name: /^Option A: NoId/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  // Regression (review F2): when the human decided AGAINST the recommendation, the ledger
  // must first-paint the CHOSEN option (with its decidedNote), not the rejected pick.
  it('seeds the decided option — not the recommendation — when they diverge', () => {
    const overridden: DecisionMapContract = {
      title: 'Overridden',
      status: 'decided',
      decidedId: 'b',
      decidedNote: 'We chose B despite the rec.',
      recommendation: { optionId: 'a', strength: 'strong', rationale: 'A is better.' },
      options: [
        { id: 'a', label: 'Alpha' },
        { id: 'b', label: 'Beta' },
      ],
    };
    render(<DecisionMap data={overridden} />);
    expect(screen.getByRole('button', { name: /^Option B: Beta — chosen/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /^Option A: Alpha — recommended/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByText('We chose B despite the rec.')).toBeInTheDocument();
    expect(screen.getByText('Consequences — Option B: Beta')).toBeInTheDocument();
  });

  // Regression (review N1): accent is an option tone, not a valence — an accent
  // consequence must fold to neutral so no colored rail rides without a word.
  it('folds an accent consequence tone to neutral and tallies it as a note', () => {
    const accented: DecisionMapContract = {
      title: 'Accent',
      options: [
        { id: 'a', label: 'A', consequences: [{ label: 'Golden effect', tone: 'accent' }] },
      ],
    };
    render(<DecisionMap data={accented} defaultSelectedId="a" />);
    const li = screen.getByText('Golden effect').closest('li') as HTMLElement;
    expect(li.style.getPropertyValue('--consequence-tone')).toBe('var(--tcl-status-neutral)');
    const a = screen.getByRole('button', { name: /^Option A: A/ });
    expect(within(a).getByText('1 note')).toHaveAttribute('data-bucket', 'note');
  });

  it('has no axe violations (open and decided)', async () => {
    const open = render(<DecisionMap data={sessionState} />);
    expect(await a11yViolations(open.container)).toEqual([]);
    open.unmount();
    const done = render(<DecisionMap data={decided} />);
    expect(await a11yViolations(done.container)).toEqual([]);
  });
});
