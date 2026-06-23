import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '@trembus/tokens/testing';
import { SoulCard } from './SoulCard';
import type { SoulCardContract } from './SoulCard';

const maraFlip: SoulCardContract = {
  name: 'Mara of the Salt',
  epithet: 'Saltwitch',
  quote: '“Front quote.”',
  back: {
    heading: 'The Drowning',
    body: 'The sea kept her voice.',
    items: [{ label: 'Rite', value: 'The Hundredth Voice' }],
    quote: '“Reverse quote.”',
  },
};

const mara: SoulCardContract = {
  index: 'SOUL · IV',
  state: 'UNBOUND',
  stateTone: 'danger',
  name: 'Mara of the Salt',
  epithet: 'Saltwitch, Thirteenth of her Line',
  stats: [
    { label: 'House', value: 'Coven of the Cold Coast' },
    { label: 'Integrity', value: 'VOLATILE' },
  ],
  description: 'A witch made from drowned sailors.',
  quote: '“All of my mouths are borrowed.”',
};

describe('SoulCard', () => {
  it('renders identity, state, stats, bio, and quote as perceivable text', () => {
    render(<SoulCard data={mara} />);
    expect(screen.getByRole('heading', { name: 'Mara of the Salt' })).toBeInTheDocument();
    expect(screen.getByText('Saltwitch, Thirteenth of her Line')).toBeInTheDocument();
    expect(screen.getByText('UNBOUND')).toBeInTheDocument();
    // stat label + value both readable (meaning in the words, not color)
    expect(screen.getByText('House')).toBeInTheDocument();
    expect(screen.getByText('Coven of the Cold Coast')).toBeInTheDocument();
    expect(screen.getByText('VOLATILE')).toBeInTheDocument();
    expect(screen.getByText(/drowned sailors/)).toBeInTheDocument();
    expect(screen.getByText(/All of my mouths are borrowed/)).toBeInTheDocument();
  });

  it('renders stats as a definition list (dt/dd pairs)', () => {
    const { container } = render(<SoulCard data={mara} />);
    expect(container.querySelectorAll('dl > div')).toHaveLength(2);
    expect(container.querySelectorAll('dt')).toHaveLength(2);
    expect(container.querySelectorAll('dd')).toHaveLength(2);
  });

  it('renders a decorative placeholder when no portrait is given', () => {
    const { container } = render(<SoulCard data={mara} />);
    const plate = container.querySelector('.tcl-soul-card__portrait.is-empty');
    expect(plate).not.toBeNull();
    expect(plate).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('img')).toBeNull();
  });

  it('renders an <img> with alt text when a portrait + alt are given', () => {
    render(
      <SoulCard data={{ ...mara, portrait: '/mara.png', portraitAlt: 'Mara, a salt-witch' }} />,
    );
    expect(screen.getByRole('img', { name: 'Mara, a salt-witch' })).toBeInTheDocument();
  });

  it('omits optional sections cleanly when absent', () => {
    const { container } = render(<SoulCard data={{ name: 'Nameless' }} />);
    expect(screen.getByRole('heading', { name: 'Nameless' })).toBeInTheDocument();
    expect(container.querySelector('.tcl-soul-card__stats')).toBeNull();
    expect(container.querySelector('.tcl-soul-card__quote')).toBeNull();
    expect(container.querySelector('.tcl-soul-card__desc')).toBeNull();
  });

  it('is static (no flip control) when no `back` is authored', () => {
    const { container } = render(<SoulCard data={mara} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(container.querySelector('.tcl-soul-card.is-flippable')).toBeNull();
    expect(container.querySelector('.tcl-soul-card__face.is-back')).toBeNull();
  });

  it('becomes flippable when a `back` is authored, defaulting to the front', () => {
    const { container } = render(<SoulCard data={maraFlip} />);
    const flip = screen.getByRole('button', { name: /Show the reverse of Mara/ });
    expect(flip).toHaveAttribute('aria-pressed', 'false');
    const article = container.querySelector('.tcl-soul-card.is-flippable')!;
    expect(article).not.toHaveAttribute('data-flipped');
    // front is live, back is inert (so a screen reader reads only the visible face)
    expect(container.querySelector('.tcl-soul-card__face.is-front')).not.toHaveAttribute('inert');
    expect(container.querySelector('.tcl-soul-card__face.is-back')).toHaveAttribute('inert');
  });

  it('flips on click (uncontrolled): aria-pressed + data-flipped + inert all toggle, onFlip fires', async () => {
    const user = userEvent.setup();
    const onFlip = vi.fn();
    const { container } = render(<SoulCard data={maraFlip} onFlip={onFlip} />);
    await user.click(screen.getByRole('button', { name: /Show the reverse of Mara/ }));
    expect(onFlip).toHaveBeenCalledWith(true);
    const article = container.querySelector('.tcl-soul-card')!;
    expect(article).toHaveAttribute('data-flipped');
    // the control now offers to flip back, and inert has swapped to the front face
    expect(screen.getByRole('button', { name: /Show the front of Mara/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(container.querySelector('.tcl-soul-card__face.is-front')).toHaveAttribute('inert');
    expect(container.querySelector('.tcl-soul-card__face.is-back')).not.toHaveAttribute('inert');
  });

  it('respects a controlled `flipped` (click fires onFlip but does not move it)', async () => {
    const user = userEvent.setup();
    const onFlip = vi.fn();
    const { container } = render(<SoulCard data={maraFlip} flipped onFlip={onFlip} />);
    expect(container.querySelector('.tcl-soul-card')).toHaveAttribute('data-flipped');
    await user.click(screen.getByRole('button', { name: /Show the front of Mara/ }));
    expect(onFlip).toHaveBeenCalledWith(false);
    // controlled — parent owns it, so it stays flipped until the prop changes
    expect(container.querySelector('.tcl-soul-card')).toHaveAttribute('data-flipped');
  });

  it('has no axe violations', async () => {
    const { container } = render(<SoulCard data={mara} />);
    expect(await a11yViolations(container)).toEqual([]);
  });

  it('has no axe violations when flippable (both faces + flip control)', async () => {
    const { container } = render(<SoulCard data={maraFlip} />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
