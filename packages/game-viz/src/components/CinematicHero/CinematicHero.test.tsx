import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '@trembus/tokens/testing';
import { CinematicHero } from './CinematicHero';
import type { CinematicHeroContract } from './CinematicHero';

const hero: CinematicHeroContract = {
  tone: 'danger',
  kicker: 'An Animated Liturgy · VI Episodes',
  title: [{ text: 'Soul' }, { text: 'Steel', outline: true }],
  tagline: 'The dead do not rest — they are FORGED.',
  highlight: 'FORGED',
  accolades: [{ value: '★★★★★', source: 'Ash & Iron' }],
};

describe('CinematicHero', () => {
  it('renders the kicker, both title lines, tagline, and accolades', () => {
    render(<CinematicHero data={hero} />);
    expect(screen.getByText(/An Animated Liturgy/)).toBeInTheDocument();
    // both title lines are real, readable text (the outlined line is not hidden)
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('Soul');
    expect(h1).toHaveTextContent('Steel');
    expect(screen.getByText('Ash & Iron', { exact: false })).toBeInTheDocument();
  });

  it('highlights the requested substring within the tagline', () => {
    const { container } = render(<CinematicHero data={hero} />);
    const hl = container.querySelector('.tcl-cinematic-hero__hl');
    expect(hl).not.toBeNull();
    expect(hl).toHaveTextContent('FORGED');
  });

  it('renders an href action as a link and an onPress action as a button (firing onPress)', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(
      <CinematicHero
        data={{
          ...hero,
          actions: [
            { label: 'Watch', icon: '▶', variant: 'primary', onPress },
            { label: 'Codex', variant: 'secondary', href: '/codex' },
          ],
        }}
      />,
    );
    expect(screen.getByRole('link', { name: 'Codex' })).toHaveAttribute('href', '/codex');
    const watch = screen.getByRole('button', { name: 'Watch' });
    await user.click(watch);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('accepts a plain string title', () => {
    render(<CinematicHero data={{ title: 'The Last Nail' }} />);
    expect(screen.getByRole('heading', { level: 1, name: 'The Last Nail' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <CinematicHero
        data={{
          ...hero,
          actions: [
            { label: 'Watch', icon: '▶', variant: 'primary', href: '#' },
            { label: 'Codex', variant: 'secondary', href: '#' },
          ],
        }}
      />,
    );
    expect(await a11yViolations(container)).toEqual([]);
  });
});
